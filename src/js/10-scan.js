/* ============================================================
   Explorchive — scanning, moving, hashing, filesystem actions
   ============================================================ */

const dirCache = new Map();

function fsSupported() { return typeof window.showDirectoryPicker === "function"; }

function demoActive() { return state.sources.some((s) => s.demo); }

function activeSources() { return state.sources.filter((s) => !s.demo); }

function writableSources() { return activeSources().filter((s) => s.writable !== false && (s.handle || s.rawFiles)); }

function sourceById(id) { return state.sources.find((s) => s.id === id); }

function fileById(id) { return state.files.find((f) => f.id === id); }

function rebuildFoldersFromFiles() {
  const map = new Map();
  // Existing folders stay known — moving files around can leave a folder empty,
  // and the cleanup view should still be able to see and remove it.
  state.folders.forEach((folder) => {
    if (sourceById(folder.rootId)) {
      map.set(folder.rootId + "|" + folder.path, folder);
    }
  });
  state.files.forEach((f) => {
    let dir = f.dir;
    while (dir) {
      const key = f.rootId + "|" + dir;
      if (!map.has(key)) {
        const source = sourceById(f.rootId);
        map.set(key, {
          path: dir, name: baseOfPath(dir), depth: dir.split("/").length,
          rootId: f.rootId, demo: !!(source && source.demo), handle: null, parentHandle: null,
        });
      }
      dir = dirOfPath(dir);
    }
  });
  state.folders = Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
}

/* ---------------------------- busy overlay ---------------------------- */
function showBusy(title, detail = "") {
  let el = document.getElementById("busy");
  if (!el) {
    el = document.createElement("div");
    el.id = "busy";
    el.className = "scan-float";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div class="sf-top">${icon("refresh")}<span>${esc(title)}</span></div>
    <div class="progress slim"><span style="width:6%"></span></div>
    <div class="sf-path" id="busy-detail">${esc(detail)}</div>`;
}

function updateBusy(detail, fraction) {
  const el = document.getElementById("busy");
  if (!el) return;
  const d = document.getElementById("busy-detail");
  if (d) { d.textContent = detail; }
  const bar = el.querySelector(".progress span");
  if (bar && typeof fraction === "number") bar.style.width = clamp(fraction * 100, 2, 100) + "%";
}

function hideBusy() {
  const el = document.getElementById("busy");
  if (el) el.remove();
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/* ---------------------------- picker / sources ---------------------------- */
function embeddedWarning() {
  openModal({
    title: "Folder access is blocked here",
    sub: "This preview runs inside a sandboxed frame",
    iconName: "alert",
    iconTone: "danger",
    body: `<p style="font-size:12.5px;line-height:1.65;color:var(--ink-2)">
      Browsers only allow the folder picker on a top-level page. Open Explorchive in its own tab —
      the picker, file moves and local scanning will all work there.
    </p>
    <div class="banner info" style="margin-top:14px">${icon("info")}<div class="b-body">Your files are never uploaded. Scanning and moving happens on your device with the File System Access API.</div></div>`,
    actions: [
      { label: "Try demo instead", icon: "sparkles", onClick: (close) => { close(); if (!demoActive()) { loadDemo(); saveSettings({ demoHidden: true }); render(); } } },
      { label: "Open in new tab", icon: "external", cls: "primary", onClick: () => window.open(location.href, "_blank", "noopener") },
    ],
  });
}

async function pickFolder() {
  if (!window.showDirectoryPicker) {
    const input = document.getElementById("fallback-input");
    if (input) input.click();
    else toast("Folder picking is not supported in this browser. Try Chrome, Edge or Brave.", "err");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ id: "explorchive", mode: "readwrite", startIn: "documents" });
    await addSource(handle);
  } catch (err) {
    if (err && (err.name === "AbortError" || err.code === 20)) return;
    if (err && err.name === "SecurityError") embeddedWarning();
    else toast((err && err.message) || "Could not open that folder.", "err");
  }
}

async function addSource(handle) {
  hideDemo();
  const exists = state.sources.some((s) => s.id === handle.name && !s.demo);
  const source = {
    id: exists ? handle.name + "-" + uid().slice(0, 5) : handle.name,
    name: handle.name,
    handle,
    demo: false,
    writable: true,
    status: "ready",
    addedAt: Date.now(),
  };
  state.sources = state.sources.filter((s) => !s.demo).concat(source);
  saveSettings({ demoHidden: true, onboarded: true });
  await idbSaveSource(source);
  await scanSource(source);
  if (state.view !== "files") navigate("files");
  render();
}

function hideDemo() {
  if (state.sources.some((s) => s.demo)) {
    state.sources = state.sources.filter((s) => !s.demo);
    state.files = state.files.filter((f) => !f.demo);
    state.folders = state.folders.filter((f) => !f.demo);
    state.scannedAt = null;
    state.dupes = { groups: null, reclaimable: 0, busy: false, strict: false, scannedAt: null };
    state.selection.clear();
    state.organize.plan = null;
  }
}

function fallbackFilesPicked(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  const first = files[0].webkitRelativePath || files[0].name;
  const rootName = first.split("/")[0] || "Selected folder";
  hideDemo();
  const raw = files.map((f) => {
    const rel = f.webkitRelativePath || f.name;
    const path = rel.split("/").slice(1).join("/") || f.name;
    return { f, path };
  });
  const source = {
    id: "fallback-" + uid().slice(0, 6),
    name: rootName,
    demo: false,
    handle: null,
    rawFiles: raw,
    writable: false,
    readonly: true,
    status: "ready",
    addedAt: Date.now(),
  };
  state.sources = state.sources.filter((s) => !s.demo).concat(source);
  state.files = state.files.filter((x) => x.rootId !== source.id);
  state.folders = state.folders.filter((x) => x.rootId !== source.id);
  raw.forEach(({ f, path }) => {
    state.files.push({
      id: uid(), rootId: source.id, demo: false, path,
      dir: dirOfPath(path), name: baseOfPath(path), ext: extOf(path),
      size: f.size, mtime: f.lastModified || Date.now(),
      category: categoryOf(path), handle: null, parentHandle: null, rawFile: f,
    });
  });
  const set = new Set();
  raw.forEach(({ path }) => { let d = dirOfPath(path); while (d) { set.add(d); d = dirOfPath(d); } });
  set.forEach((path) => state.folders.push({
    path, name: baseOfPath(path), depth: path.split("/").length,
    rootId: source.id, demo: false, handle: null, parentHandle: null,
  }));
  state.scannedAt = Date.now();
  state.selection.clear();
  saveSettings({ demoHidden: true, onboarded: true, lastScan: Date.now() });
  toast("Scanned " + fmtCount(state.files.length) + " files (read-only mode)", "ok");
  input.value = "";
  navigate("files");
  render();
}

async function removeSource(id) {
  const source = sourceById(id);
  if (!source) return;
  const ok = await confirmModal({
    title: "Remove this folder?",
    message: `Explorchive will forget <strong>${esc(source.name)}</strong> and clear its ${fmtCount(filesForRoot(id))} files from the library. Your real files stay untouched.`,
    confirmLabel: "Remove folder",
    tone: "danger",
    iconName: "files",
  });
  if (!ok) return;
  state.sources = state.sources.filter((s) => s.id !== id);
  state.files = state.files.filter((f) => f.rootId !== id);
  state.folders = state.folders.filter((f) => f.rootId !== id);
  state.selection.clear();
  state.dupes = { groups: null, reclaimable: 0, busy: false, strict: false, scannedAt: null };
  state.organize.plan = null;
  if (!state.sources.length) {
    state.scannedAt = null;
    state.files = [];
    state.folders = [];
  }
  await idbDeleteSource(id);
  if (!state.sources.length && !state.settings.demoHidden) loadDemo();
  toast("Folder removed from library", "info");
  render();
}

function filesForRoot(id) { return state.files.filter((f) => f.rootId === id); }

async function reconnectSource(id) {
  const source = sourceById(id);
  if (!source) return;
  if (source.demo) { toast("Demo library is already available", "info"); return; }
  if (!source.handle) { toast("Re-select this folder to grant access", "info"); return; }
  try {
    const opts = { mode: "readwrite" };
    const granted = await source.handle.requestPermission(opts);
    if (granted !== "granted") {
      const ro = await source.handle.requestPermission({ mode: "read" });
      if (ro !== "granted") { toast("Permission denied for " + source.name, "err"); return; }
      source.writable = false;
    } else {
      source.writable = true;
    }
    source.status = "ready";
    await scanSource(source);
    render();
  } catch (err) {
    toast((err && err.message) || "Could not reconnect that folder.", "err");
  }
}

async function restoreSources() {
  const saved = await idbAllSources();
  if (!saved.length) return false;
  state.sources = saved.map((s) => ({
    id: s.id, name: s.name, handle: s.handle, demo: false,
    writable: true, status: "unknown", addedAt: s.addedAt,
  }));
  state.restoring = true;
  let any = false;
  for (const source of state.sources) {
    try {
      const perm = await source.handle.queryPermission({ mode: "read" });
      if (perm === "granted") {
        await scanSource(source);
        any = true;
      } else {
        source.status = "needs-permission";
      }
    } catch {
      source.status = "needs-permission";
    }
  }
  state.restoring = false;
  void any;
  return true;
}

/* ---------------------------- scanning ---------------------------- */
async function scanAll({ quiet = false } = {}) {
  if (state.scanning) return;
  if (!activeSources().some((s) => s.handle)) {
    if (!quiet) toast("Pick a folder first — Explorchive will scan it locally", "info");
    return;
  }
  state.scanning = true;
  for (const source of activeSources()) {
    if (!source.handle) continue;
    try {
      const perm = await source.handle.queryPermission({ mode: "read" });
      if (perm !== "granted") { source.status = "needs-permission"; continue; }
      await scanSource(source);
    } catch (err) {
      source.status = "error";
      toast("Could not scan " + source.name + ": " + (err.message || err.name), "err");
    }
  }
  state.scanning = false;
  state.scannedAt = Date.now();
  saveSettings({ lastScan: Date.now() });
  state.dupes = { groups: null, reclaimable: 0, busy: false, strict: false, scannedAt: null };
  state.selection.clear();
  state.organize.plan = null;
  render();
  if (!quiet) toast("Library updated — " + fmtCount(state.files.length) + " files in view", "ok");
  await runAutopilot();
}

/* ---------------------------- autopilot ---------------------------- */
async function runAutopilot() {
  const auto = state.settings.autopilot || {};
  if (!auto.enabled) return;
  if (!state.files.length || state.organize.busy) return;
  if (!state.sources.some((s) => !s.demo)) return;
  const previous = { scheme: state.organize.scheme, include: state.organize.includeSubfolders };
  state.organize.scheme = SCHEMES[auto.scheme] ? auto.scheme : "type";
  state.organize.includeSubfolders = !!auto.includeSubfolders;
  const plan = buildOrganizePlan();
  if (!plan.length) {
    state.organize.scheme = previous.scheme;
    state.organize.includeSubfolders = previous.include;
    return;
  }
  state.organize.plan = plan;
  toast(`Auto-organize is on — moving ${plan.length} ${plural(plan.length, "file", "files")}`, "info", "Autopilot");
  await applyOrganizePlan();
}

async function scanSource(source) {
  if (!source.handle) return;
  const files = [];
  const folders = [];
  const started = performance.now();
  source.status = "scanning";
  source.scanned = 0;
  showBusy("Scanning " + source.name, "Reading folder…");

  const walk = async (dirHandle, path, depth, parentHandle) => {
    if (depth > 24) return;
    let entries;
    try { entries = dirHandle.entries(); } catch { return; }
    for await (const [name, handle] of entries) {
      const childPath = path ? path + "/" + name : name;
      if (handle.kind === "directory") {
        folders.push({
          path: childPath, name, depth: depth + 1, rootId: source.id,
          demo: false, handle, parentHandle: dirHandle,
        });
        await walk(handle, childPath, depth + 1, dirHandle);
      } else {
        try {
          const f = await handle.getFile();
          files.push({
            id: source.id + ":" + childPath,
            rootId: source.id, demo: false, path: childPath,
            dir: path, name, ext: extOf(name), size: f.size,
            mtime: f.lastModified || Date.now(), category: categoryOf(name),
            handle, parentHandle: dirHandle,
          });
          source.scanned++;
          if (source.scanned % 40 === 0) {
            updateBusy(fmtCount(source.scanned) + " files · " + childPath);
            await sleep(0);
          }
        } catch { /* unreadable entry — skip */ }
      }
    }
  };

  try {
    await walk(source.handle, "", 0, null);
    source.status = "ready";
    source.writable = true;
    source.scannedAt = Date.now();
    source.duration = Math.round(performance.now() - started);
  } catch (err) {
    source.status = "error";
    source.error = err.message || String(err);
    if (err.name === "NotAllowedError") source.status = "needs-permission";
  } finally {
    hideBusy();
  }

  state.files = state.files.filter((f) => f.rootId !== source.id).concat(files);
  state.folders = state.folders.filter((f) => f.rootId !== source.id).concat(folders);
  state.scannedAt = Date.now();
  state.scanning = false;
  state.filters.page = 1;
  state.selection.clear();
  dirCache.clear();
  saveSettings({ lastScan: Date.now(), demoHidden: true });
}

/* ---------------------------- permissions ---------------------------- */
async function ensureWritable(source) {
  if (!source) return false;
  if (source.demo) return true;
  if (source.rawFiles || source.readonly) {
    toast("This folder was loaded read-only (browser fallback). Use Chrome or Edge for write access.", "err");
    return false;
  }
  if (!source.handle) return false;
  try {
    const opts = { mode: "readwrite" };
    if ((await source.handle.queryPermission(opts)) === "granted") { source.writable = true; return true; }
    const result = await source.handle.requestPermission(opts);
    source.writable = result === "granted";
    if (!source.writable) toast("Write permission is needed to move or delete files in " + source.name, "err");
    return source.writable;
  } catch {
    return false;
  }
}

async function getDirHandle(source, path, create = false) {
  const key = source.id + "|" + path + "|" + (create ? "w" : "r");
  if (dirCache.has(key)) return dirCache.get(key);
  let current = source.handle;
  const segments = path.split("/").filter(Boolean);
  let walked = "";
  for (const segment of segments) {
    walked = walked ? walked + "/" + segment : segment;
    const stepKey = source.id + "|" + walked + "|w";
    if (dirCache.has(stepKey)) { current = dirCache.get(stepKey); continue; }
    current = await current.getDirectoryHandle(segment, { create });
    dirCache.set(stepKey, current);
  }
  dirCache.set(key, current);
  return current;
}

/* ---------------------------- moving / deleting ---------------------------- */
async function moveEntry(fileObj, destDirHandle, newName) {
  const oldName = fileObj.name;
  // Fast path: native move (Chromium 111+). Keeps the file, no copy.
  if (fileObj.handle && typeof fileObj.handle.move === "function") {
    try {
      if (newName !== oldName) await fileObj.handle.move(destDirHandle, newName);
      else await fileObj.handle.move(destDirHandle);
      return await destDirHandle.getFileHandle(newName);
    } catch { /* fall through to copy */ }
  }
  // Fallback: stream copy, then remove the original.
  const file = await fileObj.handle.getFile();
  const destHandle = await destDirHandle.getFileHandle(newName, { create: true });
  const writable = await destHandle.createWritable();
  try {
    await writable.write(file);
    await writable.close();
  } catch (err) {
    try { await writable.abort(); } catch {}
    throw err;
  }
  await fileObj.parentHandle.removeEntry(oldName);
  return destHandle;
}

async function deleteFileObjects(files, { confirm = false } = {}) {
  if (!files.length) return { deleted: 0, failed: 0 };
  if (confirm) {
    const total = sum(files, (f) => f.size);
    const ok = await confirmModal({
      title: `Delete ${fmtCount(files.length)} ${plural(files.length, "file", "files")}?`,
      message: `This removes <strong>${fmtByteLabel(total)}</strong> permanently from your device. Deleted files do not go to the system trash and cannot be restored by Explorchive.`,
      confirmLabel: "Delete permanently",
      tone: "danger",
      iconName: "trash",
    });
    if (!ok) return { deleted: 0, failed: 0, cancelled: true };
  }
  const deleted = [];
  let failed = 0;
  const byRoot = new Map();
  files.forEach((f) => {
    const list = byRoot.get(f.rootId) || [];
    list.push(f);
    byRoot.set(f.rootId, list);
  });
  for (const [rootId, group] of byRoot) {
    const source = sourceById(rootId);
    if (!source) { failed += group.length; continue; }
    if (!source.demo) {
      const allowed = await ensureWritable(source);
      if (!allowed) { failed += group.length; continue; }
    }
    for (const f of group) {
      if (source.demo) { deleted.push(f.id); continue; }
      try {
        if (!f.parentHandle) throw new Error("read-only");
        await f.parentHandle.removeEntry(f.name);
        deleted.push(f.id);
      } catch { failed++; }
    }
  }
  const deletedSet = new Set(deleted);
  state.files = state.files.filter((f) => !deletedSet.has(f.id));
  state.selection.forEach((id) => { if (deletedSet.has(id)) state.selection.delete(id); });
  state.cleanupSelection.clear();
  if (state.dupes.groups) {
    state.dupes.groups = state.dupes.groups.map((g) => {
      const kept = g.files.filter((f) => !deletedSet.has(f.id));
      return kept.length > 1 ? { ...g, files: kept, wasted: g.size * (kept.length - 1) } : null;
    }).filter(Boolean);
    state.dupes.reclaimable = sum(state.dupes.groups, (g) => g.wasted);
  }
  if (state.organize.plan) state.organize.plan = state.organize.plan.filter((p) => !deletedSet.has(p.fileId));
  if (deleted.length) toast(`Deleted ${fmtCount(deleted.length)} ${plural(deleted.length, "file", "files")} · ${fmtBytes(sum(files.filter((f) => deletedSet.has(f.id)), (f) => f.size))} freed`, "ok");
  if (failed) toast(`${fmtCount(failed)} ${plural(failed, "file was", "files were")} not deleted — permission or read-only folder`, "err");
  render();
  return { deleted: deleted.length, failed };
}

async function deleteFolderObject(folder) {
  const source = sourceById(folder.rootId);
  if (!source) return false;
  if (source.demo) return true;
  if (!(await ensureWritable(source))) return false;
  try {
    if (folder.parentHandle) await folder.parentHandle.removeEntry(folder.name);
    else if (source.handle) await source.handle.removeEntry(folder.name);
    return true;
  } catch { return false; }
}

/* ---------------------------- organizing ---------------------------- */
const SCHEMES = {
  type: { name: "By file type", desc: "Images, Documents, Video, Audio…", icon: "layers" },
  month: { name: "By year & month", desc: "2025 / 03 – March", icon: "clock" },
  year: { name: "By year", desc: "2023, 2024, 2025", icon: "sun" },
  project: { name: "By project", desc: "Keep the project, sort inside it", icon: "folder" },
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function destSegmentsFor(file, scheme) {
  const d = new Date(file.mtime || Date.now());
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const catFolder = CATEGORIES[file.category] ? CATEGORIES[file.category].folder : "Other";
  if (scheme === "month") return [yyyy, `${mm} - ${MONTH_NAMES[d.getMonth()]}`];
  if (scheme === "year") return [yyyy];
  if (scheme === "project") {
    const top = file.dir ? file.dir.split("/")[0] : "";
    return top ? [top, catFolder] : ["Loose files", catFolder];
  }
  return [catFolder];
}

function uniqueName(destDir, name, used) {
  const key = destDir + "|" + name.toLowerCase();
  if (!used.has(key)) { used.add(key); return name; }
  const ext = extOf(name);
  const base = ext ? name.slice(0, -(ext.length + 1)) : name;
  let n = 2;
  while (true) {
    const candidate = `${base} (${n})${ext ? "." + ext : ""}`;
    const k = destDir + "|" + candidate.toLowerCase();
    if (!used.has(k)) { used.add(k); return candidate; }
    n++;
  }
}

function buildOrganizePlan() {
  const scheme = state.organize.scheme;
  const include = state.organize.includeSubfolders;
  const candidates = state.files.filter((f) => include || !f.dir);
  const used = new Set();
  const movingIds = new Set(candidates.map((f) => f.id));
  state.files.forEach((f) => {
    if (!movingIds.has(f.id)) used.add(f.dir + "|" + f.name.toLowerCase());
  });
  const plan = [];
  for (const f of candidates) {
    const segments = destSegmentsFor(f, scheme);
    const destDir = segments.join("/");
    if (destDir === f.dir) continue;
    const newName = uniqueName(destDir, f.name, used);
    plan.push({
      fileId: f.id, name: f.name, newName, renamed: newName !== f.name,
      srcDir: f.dir, srcPath: f.path, destDir, destPath: destDir + "/" + newName,
      size: f.size, category: f.category, mtime: f.mtime, rootId: f.rootId,
    });
  }
  return plan;
}

function planSummary(plan) {
  const folders = new Set(plan.map((p) => p.destDir));
  return {
    count: plan.length,
    folders: folders.size,
    bytes: sum(plan, (p) => p.size),
    renamed: plan.filter((p) => p.renamed).length,
    categories: Array.from(new Set(plan.map((p) => p.category))),
  };
}

async function applyOrganizePlan() {
  const plan = state.organize.plan;
  if (!plan || !plan.length) return;
  state.organize.busy = true;
  state.organize.progress = 0;
  state.organize.total = plan.length;
  render();

  if (demoActive()) {
    await sleep(450);
    const moved = [];
    for (const item of plan) {
      const f = fileById(item.fileId);
      if (!f) continue;
      const oldPath = f.path;
      f.dir = item.destDir;
      f.path = item.destPath;
      f.name = item.newName;
      moved.push({ fileId: f.id, from: oldPath, to: f.path });
    }
    rebuildFoldersFromFiles();
    state.organize.undo = { at: Date.now(), count: moved.length, ops: moved, demo: true };
    state.organize.plan = null;
    state.organize.busy = false;
    state.files.sort((a, b) => a.path.localeCompare(b.path));
    render();
    toast(`${fmtCount(moved.length)} files organized in the demo library`, "ok", "Organized");
    return;
  }

  showBusy("Organizing files", "Preparing destinations…");
  const ops = [];
  let done = 0;
  let failures = 0;
  const permissionCache = new Map();

  for (const item of plan) {
    const f = fileById(item.fileId);
    const source = f && sourceById(f.rootId);
    if (!f || !source || !f.handle || !f.parentHandle) { failures++; continue; }
    if (!permissionCache.has(source.id)) permissionCache.set(source.id, await ensureWritable(source));
    if (!permissionCache.get(source.id)) { failures += plan.length - done; break; }
    try {
      const destDirHandle = await getDirHandle(source, item.destDir, true);
      const oldPath = f.path;
      await moveEntry(f, destDirHandle, item.newName);
      f.dir = item.destDir;
      f.path = item.destPath;
      f.name = item.newName;
      f.parentHandle = destDirHandle;
      ops.push({
        fileId: f.id, destDir: item.destDir, newName: item.newName,
        srcDir: item.srcDir, name: item.name, oldPath, newPath: item.destPath,
      });
      done++;
    } catch (err) {
      failures++;
    }
    state.organize.progress = done + failures;
    if (done % 3 === 0 || done === plan.length) {
      updateBusy(`Moving ${done} of ${plan.length} — ${f.name}`, state.organize.progress / plan.length);
      // update in-view progress if visible
      const bar = document.querySelector("[data-organize-bar]");
      if (bar) bar.style.width = pct(state.organize.progress, plan.length) + "%";
      const label = document.querySelector("[data-organize-label]");
      if (label) label.textContent = `${done} / ${plan.length} moved`;
      await sleep(0);
    }
  }

  rebuildFoldersFromFiles();
  state.organize.undo = ops.length ? { at: Date.now(), count: ops.length, ops, demo: false } : null;
  state.organize.plan = null;
  state.organize.busy = false;
  hideBusy();
  state.files.sort((a, b) => a.path.localeCompare(b.path));
  render();
  if (done) toast(`${fmtCount(done)} files moved into place${failures ? ` · ${failures} skipped` : ""}`, "ok", "Organized");
  if (failures) toast(`${fmtCount(failures)} files could not be moved. Some browsers block moving large files — they were skipped.`, "err");
}

async function undoOrganize() {
  const undo = state.organize.undo;
  if (!undo || !undo.ops.length) return;
  showBusy("Restoring original locations", "Undoing the last organize…");
  let restored = 0;
  let failed = 0;

  if (undo.demo) {
    for (const op of undo.ops) {
      const f = fileById(op.fileId);
      if (!f) continue;
      f.path = op.from;
      f.dir = dirOfPath(op.from);
      f.name = baseOfPath(op.from);
      restored++;
    }
  } else {
    for (const op of undo.ops) {
      const f = fileById(op.fileId);
      const source = f && sourceById(f.rootId);
      if (!f || !source) { failed++; continue; }
      try {
        if (!(await ensureWritable(source))) { failed++; continue; }
        const destHandle = await getDirHandle(source, op.srcDir, true);
        await moveEntry(f, destHandle, op.name);
        f.dir = op.srcDir;
        f.path = op.oldPath;
        f.name = op.name;
        f.parentHandle = destHandle;
        restored++;
      } catch { failed++; }
    }
  }
  rebuildFoldersFromFiles();
  state.organize.undo = null;
  hideBusy();
  render();
  toast(`Restored ${fmtCount(restored)} files${failed ? ` · ${failed} failed` : ""}`, failed ? "err" : "ok");
}

/* ---------------------------- hashing & duplicates ---------------------------- */
function bufferToHex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashFileObject(file) {
  if (file.demo) return "demo-" + file.name.toLowerCase() + "-" + file.size;
  if (file.rawFile) return "raw-" + file.rawFile.name + "-" + file.rawFile.size + "-" + file.name;
  if (!file.handle) return "nohandle-" + file.path;
  const f = await file.handle.getFile();
  const SLICE = 4 * 1024 * 1024;
  const FULL = 64 * 1024 * 1024;
  if (f.size <= FULL) {
    const buf = await f.slice(0, f.size).arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return "full-" + f.size + "-" + bufferToHex(digest);
  }
  const head = await f.slice(0, SLICE).arrayBuffer();
  const tail = await f.slice(Math.max(0, f.size - SLICE), f.size).arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", await new Blob([head, tail]).arrayBuffer());
  return "partial-" + f.size + "-" + bufferToHex(digest);
}

async function scanDuplicates() {
  if (state.dupes.busy || !state.files.length) return;
  const strict = state.dupes.strict;
  state.dupes.busy = true;
  closeModal();
  render();
  showBusy(strict ? "Hashing files" : "Comparing files", "Looking for same name and size…");
  await sleep(120);

  try {
    const groups = new Map();
    state.files.forEach((f) => {
      if (!f.size) return;
      const key = f.size + "|" + (strict ? "" : f.name.toLowerCase());
      const list = groups.get(key) || [];
      list.push(f);
      groups.set(key, list);
    });

    let candidates = Array.from(groups.values()).filter((g) => g.length > 1);
    let hashed = 0;
    const totalToHash = sum(candidates, (g) => g.length);

    if (strict) {
      const byHash = new Map();
      for (const group of candidates) {
        for (const f of group) {
          hashed++;
          if (hashed % 2 === 0) {
            updateBusy(`Hashing ${hashed} / ${totalToHash} — ${f.path}`, hashed / Math.max(1, totalToHash));
            await sleep(0);
          }
          let hash;
          try { hash = await hashFileObject(f); }
          catch { hash = "unreadable:" + f.path; }
          const key = f.size + "|" + hash;
          const list = byHash.get(key) || [];
          list.push(f);
          byHash.set(key, list);
        }
      }
      candidates = Array.from(byHash.values()).filter((g) => g.length > 1);
    }

    const result = candidates.map((files) => {
      const sorted = sortBy(files, (f) => f.mtime || 0);
      return {
        id: uid(),
        name: sorted[0].name,
        size: sorted[0].size,
        category: sorted[0].category,
        wasted: sorted[0].size * (sorted.length - 1),
        keepId: sorted[0].id,
        files: sorted,
      };
    }).sort((a, b) => b.wasted - a.wasted);

    state.dupes = {
      groups: result,
      reclaimable: sum(result, (g) => g.wasted),
      busy: false,
      strict,
      scannedAt: Date.now(),
      scannedCount: state.files.length,
    };
    hideBusy();
    render();
    if (result.length) toast(`${result.length} duplicate groups · ${fmtBytes(state.dupes.reclaimable)} reclaimable`, "ok", "Scan complete");
    else toast("No duplicates found. Your library is tidy.", "ok", "Scan complete");
  } catch (err) {
    state.dupes.busy = false;
    hideBusy();
    render();
    toast("Duplicate scan failed: " + (err.message || err.name), "err");
  }
}

function setKeep(groupId, fileId) {
  if (!state.dupes.groups) return;
  const group = state.dupes.groups.find((g) => g.id === groupId);
  if (group) { group.keepId = fileId; render(); }
}

async function deleteGroupExtras(groupId) {
  const group = state.dupes.groups && state.dupes.groups.find((g) => g.id === groupId);
  if (!group) return;
  const extras = group.files.filter((f) => f.id !== group.keepId);
  await deleteFileObjects(extras, { confirm: false });
}

/* ---------------------------- cleanup ---------------------------- */
function cleanupBuckets() {
  const now = Date.now();
  const YEAR = 365 * 86400000;
  const large = state.files.filter((f) => f.size >= 100 * 1024 * 1024);
  const old = state.files.filter((f) => f.mtime && now - f.mtime > YEAR);
  const junk = state.files.filter((f) => isJunk(f.name));
  const empties = emptyFolders();
  return {
    large: { key: "large", files: large, bytes: sum(large, (f) => f.size) },
    old: { key: "old", files: old, bytes: sum(old, (f) => f.size) },
    junk: { key: "junk", files: junk, bytes: sum(junk, (f) => f.size) },
    empty: { key: "empty", folders: empties, bytes: 0 },
  };
}

function emptyFolders() {
  const occupied = new Set();
  state.files.forEach((f) => {
    let dir = f.dir;
    while (dir) { occupied.add(dir); dir = dirOfPath(dir); }
  });
  return state.folders
    .filter((f) => !occupied.has(f.path))
    .sort((a, b) => b.depth - a.depth);
}

async function deleteEmptyFolders({ confirm = true } = {}) {
  const empties = emptyFolders();
  if (!empties.length) return;
  if (confirm) {
    const ok = await confirmModal({
      title: `Remove ${fmtCount(empties.length)} empty ${plural(empties.length, "folder", "folders")}?`,
      message: "Only folders with no files inside will be removed. This cannot be undone.",
      confirmLabel: "Remove folders",
      tone: "danger",
      iconName: "folder",
    });
    if (!ok) return;
  }
  let removed = 0;
  let failed = 0;
  for (const folder of empties) {
    const source = sourceById(folder.rootId);
    if (!source) { failed++; continue; }
    if (source.demo) { removed++; continue; }
    if (!(await ensureWritable(source))) { failed++; continue; }
    try {
      if (folder.parentHandle) await folder.parentHandle.removeEntry(folder.name);
      else if (source.handle) await source.handle.removeEntry(folder.name);
      removed++;
    } catch { failed++; }
  }
  const removedSet = new Set(empties.map((f) => f.path));
  state.folders = state.folders.filter((f) => !removedSet.has(f.path));
  render();
  toast(`${removed} empty ${plural(removed, "folder", "folders")} removed${failed ? ` · ${failed} skipped` : ""}`, failed ? "err" : "ok");
}

/* ---------------------------- previews & downloads ---------------------------- */
async function getBlobForFile(file) {
  if (file.rawFile) return file.rawFile;
  if (file.handle) { try { return await file.handle.getFile(); } catch { return null; } }
  return null;
}

async function previewData(file) {
  if (!file) return { type: "none" };
  if (file.demo) return { type: "demo", category: file.category };
  const blob = await getBlobForFile(file);
  if (!blob) return { type: "none" };
  const ext = file.ext;
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "avif", "svg", "ico"].includes(ext) && blob.size < 25 * 1024 * 1024) {
    return { type: "image", url: URL.createObjectURL(blob) };
  }
  if (["txt", "md", "json", "js", "css", "html", "csv", "log", "yml", "yaml", "xml", "ts", "py", "sh", "sql"].includes(ext) && blob.size < 2 * 1024 * 1024) {
    const text = await blob.slice(0, 100 * 1024).text();
    return { type: "text", text };
  }
  return { type: "none" };
}

async function downloadFileObject(file) {
  if (!file) return;
  if (file.demo) {
    const content = `Explorchive demo file\n\nName: ${file.name}\nPath: ${file.path}\nSize: ${fmtBytes(file.size)}\nCategory: ${CATEGORIES[file.category].label}\nModified: ${dateTimeStr(file.mtime)}\n\nThis is a simulated file from the demo library. Connect a real folder to download the actual document.`;
    saveBlob(new Blob([content], { type: "text/plain" }), file.name + ".demo.txt");
    toast("Demo files are simulated — a preview summary was downloaded instead", "info");
    return;
  }
  const blob = await getBlobForFile(file);
  if (!blob) { toast("This file could not be read. Reconnect the folder.", "err"); return; }
  saveBlob(blob, file.name);
  toast("Downloading " + file.name, "ok");
}

function fmtByteLabel(bytes) { return fmtBytes(bytes); }
