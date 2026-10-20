/* ============================================================
   Explorchive — actions, events, boot
   ============================================================ */

/* ---------------------------- navigation ---------------------------- */
function currentHashView() {
  const raw = location.hash.replace(/^#\/?/, "").split("?")[0];
  return PAGE_META[raw] ? raw : null;
}

function navigate(view) {
  if (!PAGE_META[view]) view = "dashboard";
  setMenu(false);
  const changed = state.view !== view;
  state.view = view;
  if (location.hash !== "#/" + view) {
    try { location.hash = "#/" + view; } catch {}
  }
  if (changed) {
    state.filters.page = 1;
    window.scrollTo({ top: 0, behavior: "auto" });
    const viewEl = document.getElementById("view");
    if (viewEl) viewEl.focus({ preventScroll: true });
  }
  render();
}

function setMenu(open) {
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  if (!sidebar) return;
  sidebar.classList.toggle("open", open);
  if (scrim) scrim.hidden = !open;
}

function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  setMenu(!sidebar.classList.contains("open"));
}

/* ---------------------------- utility flows ---------------------------- */
async function downloadAppFile() {
  const candidates = ["Explorchive.html", "dist/Explorchive.html"];
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, { cache: "no-store" });
      if (!res.ok) continue;
      const blob = await res.blob();
      if (blob.size < 5000) continue;
      saveBlob(blob, "Explorchive.html");
      toast("Downloaded Explorchive.html — one file, no installer", "ok", "Take it with you");
      return;
    } catch {}
  }
  if (location.protocol === "file:") {
    openModal({
      title: "Save this page as your app",
      sub: "You are already running the single-file build",
      iconName: "download",
      body: `<p style="font-size:12.5px;line-height:1.65;color:var(--ink-2)">
        Explorchive is running from a local file, so the browser cannot fetch a second copy automatically.
        Use <strong>Ctrl+S</strong> (Windows) or <strong>⌘S</strong> (macOS) and save the page as
        <span class="mono">Explorchive.html</span>. The saved file is the entire app and works offline.</p>
        <div class="banner info" style="margin-top:12px">${icon("info")}<div class="b-body">If you opened the repository copy, download <span class="mono">dist/Explorchive.html</span> instead.</div></div>`,
      actions: [{ label: "Got it", cls: "primary" }],
    });
    return;
  }
  openModal({
    title: "Download unavailable here",
    sub: "The single-file build wasn't served next to this page",
    iconName: "download",
    body: `<p style="font-size:12.5px;line-height:1.65;color:var(--ink-2)">
      Open <span class="mono">Explorchive.html</span> (the built file at the repository root or in <span class="mono">dist/</span>)
      in your browser, then use its Download button. Or save the current page with <strong>Ctrl+S</strong>.
      If you're using the dev copy (<span class="mono">src/index.html</span>), it needs the build step first:
      <span class="mono">python3 build.py</span>.</p>`,
    actions: [{ label: "Close", cls: "primary" }],
  });
}

function openPrivacy() {
  openModal({
    title: "Privacy, plainly",
    sub: "No account. No server. No analytics.",
    iconName: "shield",
    wide: true,
    body: `
      <div class="kv">
        <div class="kv-row"><span class="k">Files</span><span class="v">Read only with your permission, never uploaded</span></div>
        <div class="kv-row"><span class="k">File index</span><span class="v">Held in this tab's memory</span></div>
        <div class="kv-row"><span class="k">Settings</span><span class="v">localStorage in this browser</span></div>
        <div class="kv-row"><span class="k">Folder handles</span><span class="v">IndexedDB in this browser</span></div>
        <div class="kv-row"><span class="k">Network calls</span><span class="v">Only to the Supabase bucket you configure</span></div>
        <div class="kv-row"><span class="k">Analytics / tracking</span><span class="v">None</span></div>
      </div>
      <div class="banner info" style="margin-top:14px">${icon("info")}<div class="b-body">
        Explorchive has no backend. Deleting, moving and organizing happen through the browser's File System Access API.
        Remove a folder from the sidebar or Settings to forget its handle. Reset the app to clear everything Explorchive stored.
      </div></div>
      <p class="hint" style="margin-top:12px">Cloud backups are optional and go directly from your browser to your own storage provider. That provider sees your files and IP, exactly as it would if you uploaded through their website.</p>`,
    actions: [{ label: "Close", cls: "primary" }],
  });
}

function openHelp() {
  openModal({
    title: "How Explorchive works",
    sub: "Sixty seconds to a sorted library",
    iconName: "info",
    wide: true,
    body: `
      <ol class="steps">
        <li><strong>Add a folder.</strong> The browser asks for permission. Explorchive indexes names, sizes and dates — nothing is copied.</li>
        <li><strong>Browse and filter.</strong> Every file is grouped into images, video, audio, documents, archives, code or fonts. Preview it, download it, delete it.</li>
        <li><strong>Preview an organize plan.</strong> Choose type / month / year / project, inspect every move, then apply. Name conflicts are renamed, never overwritten.</li>
        <li><strong>Find duplicates.</strong> Fast mode compares name + size. Strict mode hashes contents with SHA-256 (head + tail for files over 64 MB).</li>
        <li><strong>Clean up.</strong> Large files, untouched files, temp junk and empty folders — each reviewed before anything is deleted.</li>
        <li><strong>Free storage.</strong> The Cloud page totals common free tiers, then lets you connect your own free Supabase bucket for backups.</li>
      </ol>
      <div class="banner warn" style="margin-top:14px">${icon("alert")}<div class="b-body">
        <strong>Browser support:</strong> Chrome, Edge, Brave and other Chromium browsers support reading and moving folders.
        Firefox and Safari use a read-only fallback. The folder picker needs a top-level tab, not an embedded preview.
      </div></div>`,
    actions: [{ label: "Start exploring", cls: "primary" }],
  });
}

function openProviders() {
  openModal({
    title: "Free cloud tiers worth claiming",
    sub: "Typical consumer free plans — check each provider for current terms",
    iconName: "cloud",
    wide: true,
    body: `<div class="object-list">
      ${FREE_TIERS.map((t) => `
        <div class="obj-row">
          <span class="provider-logo" style="background:${t.color};width:28px;height:28px;border-radius:8px;font-size:11px">${esc(t.short)}</span>
          <span class="obj-main"><span class="obj-name">${esc(t.name)}</span><span class="obj-meta">${esc(t.note)}</span></span>
          <span class="provider-gb">${t.gb} GB</span>
          <a class="btn sm ghost" href="${t.url}" target="_blank" rel="noopener noreferrer">${icon("external")} Open</a>
        </div>`).join("")}
    </div>
    <p class="hint" style="margin-top:12px">Explorchive links out — it never automates account creation or stores provider passwords.</p>`,
    actions: [{ label: "Close", cls: "primary" }],
  });
}

function exportReport(kind) {
  const stamp = new Date().toISOString().slice(0, 10);
  if (kind === "json") {
    saveBlob(new Blob([JSON.stringify(buildReport(), null, 2)], { type: "application/json" }), `explorchive-report-${stamp}.json`);
    toast("JSON report downloaded", "ok");
  } else if (kind === "csv") {
    saveBlob(new Blob([reportCSV()], { type: "text/csv" }), `explorchive-files-${stamp}.csv`);
    toast("File index downloaded", "ok");
  } else {
    saveBlob(new Blob([reportTxt()], { type: "text/plain" }), `explorchive-summary-${stamp}.txt`);
    toast("Summary downloaded", "ok");
  }
}

async function copyReport() {
  const ok = await copyText(reportTxt());
  toast(ok ? "Summary copied to clipboard" : "Could not copy the summary", ok ? "ok" : "err");
}

function printReport() {
  const w = window.open("", "_blank");
  if (!w) { window.print(); return; }
  const html = `<html><head><title>Explorchive report</title><style>
    body{font-family:-apple-system,Segoe UI,system-ui,sans-serif;color:#0B2239;padding:32px;max-width:820px;margin:auto}
    pre{white-space:pre-wrap;font:12px/1.6 SFMono-Regular,Menlo,Consolas,monospace}
    h1{font-size:18px;margin:0 0 4px} p{color:#6B8299;font-size:11px}
  </style></head><body><h1>Explorchive library report</h1>
  <p>Generated ${esc(new Date().toLocaleString())} · Tokyo Sky edition</p>
  <pre>${esc(reportTxt())}</pre>
  <script>window.onload=()=>setTimeout(()=>window.print(),200)<\/script></body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function clearDemo() {
  state.sources = state.sources.filter((s) => !s.demo);
  state.files = state.files.filter((f) => !f.demo);
  state.folders = state.folders.filter((f) => !f.demo);
  if (!state.sources.length) state.scannedAt = null;
  state.selection.clear();
  state.dupes = { groups: null, reclaimable: 0, busy: false, strict: false, scannedAt: null };
  state.organize.plan = null;
  saveSettings({ demoHidden: true });
  render();
  toast("Demo cleared — add a folder to build your own library", "info");
}

async function resetAll() {
  const ok = await confirmModal({
    title: "Reset Explorchive?",
    message: "Saved folders, permissions and cloud credentials stored by this app will be removed. Your real files are never touched. The demo reloads.",
    confirmLabel: "Reset app",
    tone: "danger",
    iconName: "alert",
  });
  if (!ok) return;
  try { localStorage.removeItem(LS_KEY); } catch {}
  try {
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = req.onerror = req.onblocked = resolve;
    });
  } catch {}
  location.reload();
}

function downloadSelected() {
  const files = state.files.filter((f) => state.selection.has(f.id));
  if (!files.length) return;
  files.forEach((f, i) => {
    setTimeout(() => downloadFileObject(f), i * 220);
  });
  toast("Preparing " + fmtCount(files.length) + " downloads…", "ok");
}

function pickLargestForUpload() {
  const real = sortBy(state.files.filter((f) => !f.demo), (f) => -f.size).slice(0, 10);
  state.uploadSelection = new Set(real.map((f) => f.id));
  render();
  toast(real.length ? `${real.length} largest files selected` : "No real files available", real.length ? "info" : "err");
}

/* ---------------------------- action map ---------------------------- */
const ACTIONS = {
  navigate: (data) => navigate(data.view),
  "toggle-menu": () => toggleMenu(),
  "close-menu": () => setMenu(false),
  "add-folder": () => pickFolder(),
  scan: () => ACTIONS["rescan-files"](),
  "rescan-files": () => {
    if (!activeSources().length) {
      toast("The demo library is always up to date. Add a folder to scan your own files.", "info");
      return;
    }
    scanAll();
  },
  "clear-demo": () => clearDemo(),
  "load-demo": () => { loadDemo(); saveSettings({ demoHidden: false }); navigate("dashboard"); render(); },
  "reset-demo": () => resetDemo(),
  "remove-source": (data) => removeSource(data.id),
  "reconnect-source": (data) => reconnectSource(data.id),
  "sort-files": (data, el) => {
    const sort = data.sort || el.value;
    if (el && el.tagName === "SELECT") {
      state.filters.sort = sort;
      state.filters.dir = sort === "name" || sort === "path" || sort === "category" ? 1 : -1;
    } else if (state.filters.sort === sort) {
      state.filters.dir = state.filters.dir === 1 ? -1 : 1;
    } else {
      state.filters.sort = sort;
      state.filters.dir = sort === "name" || sort === "path" || sort === "category" ? 1 : -1;
    }
    state.filters.page = 1;
    render();
  },
  "filter-category": (data) => {
    state.filters.category = data.cat;
    state.filters.page = 1;
    render();
  },
  page: (data) => {
    state.filters.page = Math.max(1, parseInt(data.page, 10) || 1);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
  "preview-file": (data) => openFileDrawer(fileById(data.id)),
  "open-file": (data) => openFileDrawer(fileById(data.id)),
  "delete-file": async (data) => {
    const file = fileById(data.id);
    if (file) await deleteFileObjects([file], { confirm: true });
  },
  "delete-selected": async () => {
    const files = state.files.filter((f) => state.selection.has(f.id));
    if (files.length) await deleteFileObjects(files, { confirm: true });
  },
  "download-selected": () => downloadSelected(),
  "clear-selection": () => { state.selection.clear(); render(); },
  "clear-filters": () => {
    state.filters.query = "";
    state.filters.category = "all";
    state.filters.source = "all";
    state.filters.page = 1;
    const gs = document.getElementById("global-search");
    if (gs) gs.value = "";
    render();
    toast("Filters cleared", "info");
  },
  "scan-duplicates": () => {
    if (state.dupes.busy) return;
    scanDuplicates();
  },
  "set-keep": (data) => setKeep(data.group, data.id),
  "delete-group-extras": async (data) => {
    const group = state.dupes.groups && state.dupes.groups.find((g) => g.id === data.id);
    if (!group) return;
    const extras = group.files.filter((f) => f.id !== group.keepId);
    const ok = await confirmModal({
      title: `Delete ${extras.length} duplicate ${plural(extras.length, "copy", "copies")}?`,
      message: `Keeps <strong>${esc((group.files.find((f) => f.id === group.keepId) || group.files[0]).path)}</strong> and permanently deletes the other ${extras.length} copies, freeing <strong>${fmtBytes(group.wasted)}</strong>.`,
      confirmLabel: "Delete copies",
      tone: "danger",
      iconName: "duplicates",
    });
    if (ok) await deleteFileObjects(extras, { confirm: false });
  },
  "delete-all-dupes": async () => {
    if (!state.dupes.groups || !state.dupes.groups.length) return;
    const extras = [];
    state.dupes.groups.forEach((g) => g.files.forEach((f) => { if (f.id !== g.keepId) extras.push(f); }));
    const ok = await confirmModal({
      title: `Delete ${fmtCount(extras.length)} extra copies?`,
      message: `One copy of each group is kept. This frees about <strong>${fmtBytes(sum(extras, (f) => f.size))}</strong> and cannot be undone.`,
      confirmLabel: "Delete all copies",
      tone: "danger",
      iconName: "duplicates",
    });
    if (ok) await deleteFileObjects(extras, { confirm: false });
  },
  "organize-scheme": (data) => {
    state.organize.scheme = data.scheme;
    state.organize.plan = null;
    render();
  },
  "organize-scan-first": async () => {
    if (!activeSources().length) { toast("This is the demo library — it's already scanned", "info"); return; }
    await scanAll({ quiet: true });
    if (state.files.length) {
      state.organize.plan = buildOrganizePlan();
      render();
      toast("Library rescanned and a fresh plan is ready", "ok");
    }
  },
  "preview-plan": () => {
    if (!state.files.length) return;
    const plan = buildOrganizePlan();
    state.organize.plan = plan;
    render();
    if (!plan.length) {
      toast("Everything already follows this structure. Try another scheme or include subfolders.", "info");
      return;
    }
    setTimeout(() => {
      const target = document.querySelector(".plan-summary");
      if (target && target.scrollIntoView) target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  },
  "cancel-plan": () => { state.organize.plan = null; render(); },
  "apply-plan": () => applyOrganizePlan(),
  "undo-organize": () => undoOrganize(),
  "review-cleanup": (data) => openCleanupReview(data.kind),
  "cleanup-delete": async (data) => {
    const buckets = cleanupBuckets();
    const bucket = buckets[data.kind];
    if (!bucket) return;
    if (data.kind === "empty") { await deleteEmptyFolders(); return; }
    if (!bucket.files.length) { toast("Nothing to delete", "info"); return; }
    const ok = await confirmModal({
      title: `Delete ${fmtCount(bucket.files.length)} ${plural(bucket.files.length, "file", "files")}?`,
      message: `This permanently removes <strong>${fmtBytes(bucket.bytes)}</strong> matched by this rule. Consider reviewing the list first.`,
      confirmLabel: "Delete permanently",
      tone: "danger",
      iconName: "cleanup",
    });
    if (ok) await deleteFileObjects(bucket.files, { confirm: false });
  },
  "claim-provider": (data) => {
    const claimed = new Set(state.settings.claimed || []);
    if (claimed.has(data.name)) claimed.delete(data.name);
    else claimed.add(data.name);
    saveSettings({ claimed: Array.from(claimed) });
    render();
  },
  "open-providers": () => openProviders(),
  "cloud-test": () => testCloud(),
  "cloud-usage": () => refreshCloudUsage({ quiet: false }),
  "cloud-edit": async () => {
    const ok = await confirmModal({
      title: "Edit cloud connection?",
      message: "The saved URL and key will be cleared so you can enter new ones. Files already in the bucket are untouched.",
      confirmLabel: "Edit connection",
      iconName: "key",
    });
    if (!ok) return;
    state.settings.cloud = null;
    saveSettings({ cloud: null });
    state.cloud = { status: "idle", error: "", buckets: [], usage: null, quotaGB: 1, busy: false, upload: null, objects: null, lastUpload: null, autoTried: false };
    render();
    toast("Enter new credentials to reconnect", "info");
  },
  "cloud-disconnect": async () => {
    if (!cloudConfigured()) { toast("No cloud vault is connected", "info"); return; }
    const ok = await confirmModal({
      title: "Disconnect the cloud vault?",
      message: "The URL and anon key are removed from this browser. Files remain in your Supabase bucket.",
      confirmLabel: "Disconnect",
      tone: "danger",
      iconName: "cloud",
    });
    if (!ok) return;
    state.settings.cloud = null;
    saveSettings({ cloud: null });
    state.cloud = { status: "idle", error: "", buckets: [], usage: null, quotaGB: 1, busy: false, upload: null, objects: null, lastUpload: null, autoTried: false };
    render();
    toast("Cloud vault disconnected", "ok");
  },
  "cloud-upload": () => cloudUploadSelected(),
  "upload-select-largest": () => pickLargestForUpload(),
  "cloud-link": (data) => openSignedLink(data.name),
  "cloud-delete": (data) => deleteCloudObject(data.name),
  "export-json": () => exportReport("json"),
  "export-csv": () => exportReport("csv"),
  "export-txt": () => exportReport("txt"),
  "copy-report": () => copyReport(),
  "print-report": () => printReport(),
  "download-app": () => downloadAppFile(),
  "open-privacy": () => openPrivacy(),
  "open-help": () => openHelp(),
  "reset-all": () => resetAll(),
  "page-prev": () => { state.filters.page = Math.max(1, state.filters.page - 1); render(); },
};

const CHANGES = {
  "select-file": (el) => {
    if (el.checked) state.selection.add(el.dataset.id);
    else state.selection.delete(el.dataset.id);
    render();
  },
  "select-page": (el) => {
    const f = state.filters;
    const list = filteredFiles();
    const start = (clamp(f.page, 1, Math.max(1, Math.ceil(list.length / f.pageSize))) - 1) * f.pageSize;
    const pageRows = list.slice(start, start + f.pageSize);
    pageRows.forEach((file) => {
      if (el.checked) state.selection.add(file.id);
      else state.selection.delete(file.id);
    });
    render();
  },
  "filter-source": (el) => {
    state.filters.source = el.value;
    state.filters.page = 1;
    render();
  },
  "sort-files": (el) => ACTIONS["sort-files"]({ sort: el.value }, el),
  "page-size": (el) => {
    state.filters.pageSize = parseInt(el.value, 10) || 40;
    state.filters.page = 1;
    render();
  },
  "organize-scope": (el) => {
    state.organize.includeSubfolders = el.checked;
    state.organize.plan = null;
    render();
  },
  "dupes-strict": (el) => {
    state.dupes.strict = el.checked;
    render();
  },
  "autopilot-toggle": (el) => {
    const auto = { ...(state.settings.autopilot || {}), enabled: el.checked };
    saveSettings({ autopilot: auto });
    render();
    if (el.checked) {
      if (!state.sources.some((s) => !s.demo)) {
        toast("Autopilot is on — it starts as soon as you connect a real folder", "info");
      } else {
        toast("Autopilot is on. Rescan to apply it.", "ok");
      }
    } else {
      toast("Autopilot paused", "info");
    }
  },
  "autopilot-scheme": (el) => {
    const auto = { ...(state.settings.autopilot || {}), scheme: el.value };
    saveSettings({ autopilot: auto });
    render();
  },
  "autopilot-scope": (el) => {
    const auto = { ...(state.settings.autopilot || {}), includeSubfolders: el.checked };
    saveSettings({ autopilot: auto });
    render();
  },
  "upload-select": (el) => {
    if (el.checked) state.uploadSelection.add(el.dataset.id);
    else state.uploadSelection.delete(el.dataset.id);
    render();
  },
};

const INPUTS = {
  "files-query": debounce((value) => {
    state.filters.query = value;
    state.filters.page = 1;
    render({ focus: "files-query" });
  }, 180),
};

const SUBMITS = {
  "cloud-connect": (form) => {
    const fd = new FormData(form);
    let url = String(fd.get("url") || "").trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const key = String(fd.get("key") || "").trim();
    const bucket = String(fd.get("bucket") || "").trim() || "explorchive";
    const quotaGB = Number(fd.get("quota")) || 1;
    if (!url || !key) { toast("Project URL and anon key are required", "err"); return; }
    state.settings.cloud = { url, key, bucket, quotaGB };
    saveSettings({ cloud: state.settings.cloud });
    state.cloud.autoTried = false;
    state.cloud.status = "idle";
    state.cloud.error = "";
    render();
    toast("Credentials saved locally — testing connection…", "info");
    setTimeout(() => testCloud({ quiet: false }), 120);
  },
};

/* ---------------------------- storage detection ---------------------------- */
let quotaRequested = false;
function maybeEstimateStorage() {
  if (quotaRequested) return;
  if (!navigator.storage || !navigator.storage.estimate) return;
  quotaRequested = true;
  navigator.storage.estimate().then((est) => {
    state.localQuota = { usage: est.usage || 0, quota: est.quota || 0 };
    const el = document.getElementById("local-quota");
    if (el && state.localQuota.quota) el.textContent = fmtBytes(state.localQuota.quota) + " total";
  }).catch(() => { quotaRequested = false; });
}

function renderScanOverlay() {
  // Scanning progress is shown through the body-level #busy panel created by showBusy().
  // This hook keeps the scan state in sync with the shell without rebuilding that panel.
  const scanLabel = document.querySelector("[data-action='scan'] .btn-txt");
  if (scanLabel) scanLabel.textContent = state.scanning ? "Scanning…" : "Rescan";
}

function afterRenderUI() {
  $$("[data-indeterminate='1']").forEach((el) => { el.indeterminate = true; });
  document.title = "Explorchive — " + (PAGE_META[state.view] || PAGE_META.dashboard).title;
  if (state.view === "cloud" && cloudConfigured() && state.cloud.status === "idle" && !state.cloud.autoTried) {
    state.cloud.autoTried = true;
    setTimeout(() => testCloud({ quiet: true }), 200);
  }
}

/* ---------------------------- events ---------------------------- */
function setupEvents() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = ACTIONS[el.dataset.action];
    if (!action) return;
    e.preventDefault();
    try { action(el.dataset, el, e); }
    catch (err) { console.error(err); toast(err.message || "Something went wrong", "err"); }
  });

  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-change]");
    if (!el) return;
    const handler = CHANGES[el.dataset.change];
    if (handler) {
      try { handler(el, e); }
      catch (err) { console.error(err); toast(err.message || "Something went wrong", "err"); }
    }
  });

  document.addEventListener("input", (e) => {
    const el = e.target.closest("[data-input]");
    if (!el) return;
    const handler = INPUTS[el.dataset.input];
    if (handler) handler(el.value, el);
  });

  document.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-submit]");
    if (!form) return;
    e.preventDefault();
    const handler = SUBMITS[form.dataset.submit];
    if (handler) handler(form);
  });

  window.addEventListener("hashchange", () => {
    const view = currentHashView();
    if (view && view !== state.view) {
      state.view = view;
      state.filters.page = 1;
      setMenu(false);
      window.scrollTo({ top: 0, behavior: "auto" });
      render();
    }
  });

  document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
    if (e.key === "/" && !typing) {
      e.preventDefault();
      const search = document.getElementById("global-search");
      if (search) search.focus();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const search = document.getElementById("global-search");
      if (search) search.focus();
    }
    if (e.key === "Enter" && e.target && e.target.id === "global-search") {
      state.filters.query = e.target.value.trim();
      state.filters.page = 1;
      if (state.view !== "files") navigate("files");
      else render();
    }
    if (e.key === "Escape") setMenu(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) setMenu(false);
  });

  window.addEventListener("beforeunload", (e) => {
    if (state.cloud.busy || state.organize.busy || state.scanning) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  /* drag & drop folders */
  let dragDepth = 0;
  window.addEventListener("dragenter", (e) => {
    if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes("Files")) return;
    dragDepth++;
    document.body.classList.add("dragging");
  });
  window.addEventListener("dragleave", () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) document.body.classList.remove("dragging");
  });
  window.addEventListener("dragover", (e) => { e.preventDefault(); });
  window.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragDepth = 0;
    document.body.classList.remove("dragging");
    const items = Array.from((e.dataTransfer && e.dataTransfer.items) || []);
    const handlePromises = items
      .filter((i) => i.kind === "file" && typeof i.getAsFileSystemHandle === "function")
      .map((i) => i.getAsFileSystemHandle().catch(() => null));
    let handles = [];
    try { handles = (await Promise.all(handlePromises)).filter((h) => h && h.kind === "directory"); } catch {}
    if (handles.length) {
      for (const handle of handles) await addSource(handle);
      toast(`${handles.length} ${plural(handles.length, "folder", "folders")} added`, "ok");
      return;
    }
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      toast("Drop a folder (not files) to scan it, or use Add folder", "info");
    }
  });
}

/* ---------------------------- boot ---------------------------- */
async function init() {
  setupEvents();
  const fallback = document.getElementById("fallback-input") || document.createElement("input");
  fallback.id = "fallback-input";
  fallback.type = "file";
  fallback.webkitdirectory = true;
  fallback.multiple = true;
  fallback.hidden = true;
  if (!fallback.isConnected) document.body.appendChild(fallback);
  fallback.addEventListener("change", () => fallbackFilesPicked(fallback));

  state.view = currentHashView() || "dashboard";
  render();

  const hadSaved = await restoreSources();
  if (!hadSaved && !state.settings.demoHidden) {
    loadDemo();
  }
  if (!hadSaved && state.settings.demoHidden) {
    state.files = [];
    state.folders = [];
  }
  render();
  afterRenderUI();

  if (!state.sources.length && !state.settings.demoHidden) {
    loadDemo();
    render();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
