/* ============================================================
   Explorchive — organize, duplicates, cleanup, cloud, reports
   ============================================================ */

/* ---------------------------- auto-organize ---------------------------- */
function organizeViewHTML() {
  const demo = demoActive();
  const plan = state.organize.plan;
  const summary = plan ? planSummary(plan) : null;
  const include = state.organize.includeSubfolders;
  const scopeCount = state.files.filter((f) => include || !f.dir).length;
  const undo = state.organize.undo;

  const schemeCards = Object.entries(SCHEMES).map(([key, s]) => {
    const sample = demoPreviewFolders(key);
    return `
    <button class="scheme ${state.organize.scheme === key ? "active" : ""}" data-action="organize-scheme" data-scheme="${key}" aria-pressed="${state.organize.scheme === key}">
      <span class="scheme-check">${icon("check")}</span>
      <span class="scheme-art">${sample.map((f, i) => `<span class="folder-viz ${i === 1 ? "b" : i === 2 ? "c" : ""}">${esc(f)}</span>`).join("")}</span>
      <span class="scheme-title">${esc(s.name)}</span>
      <span class="scheme-desc">${esc(s.desc)}</span>
    </button>`;
  }).join("");

  return `
  <div class="view-stack">
    ${demo ? demoBannerHTML() : ""}
    ${undo ? `<div class="banner ok">${icon("check")}<div class="b-body"><div class="b-title">${fmtCount(undo.count)} files organized · ${esc(timeAgo(undo.at))}</div>Original locations are remembered for this session. You can put everything back.</div><button class="btn sm ghost" data-action="undo-organize">${icon("undo")} Undo</button></div>` : ""}

    <section class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${icon("sort")} Choose a sorting system</div>
          <div class="card-sub">Explorchive proposes a folder structure. Nothing moves until you press Apply.</div>
        </div>
        <div class="row">
          ${state.settings.autopilot?.enabled ? `<span class="pill ok">${icon("check")} Autopilot on</span>` : `<span class="pill muted">Autopilot off</span>`}
          <span class="pill">${fmtCount(scopeCount)} files in scope</span>
        </div>
      </div>
      <div class="card-body">
        <div class="scheme-grid">${schemeCards}</div>
        <div class="divider" style="margin:18px 0"></div>
        <div class="row wrap" style="justify-content:space-between;gap:14px">
          <div class="row wrap" style="gap:18px">
            <label class="switch">
              <input type="checkbox" data-change="organize-scope" ${include ? "checked" : ""} />
              <span class="track"></span>
              <span>Include files inside existing subfolders</span>
            </label>
            <span class="pill muted">${include ? "Whole library" : "Top level only"}</span>
          </div>
          <div class="row">
            <button class="btn ghost" data-action="organize-scan-first" title="Refresh before planning">${icon("refresh")} Rescan</button>
            <button class="btn primary" data-action="preview-plan" ${state.files.length ? "" : "disabled"}>${icon("sparkles")} Preview plan</button>
          </div>
        </div>
        <div class="hint" style="margin-top:10px">
          Moving works best in Chrome and Edge. Large files are moved with a copy-then-delete fallback, and name conflicts are renamed automatically.
          ${include ? "" : " Files already sitting inside folders are left untouched — enable the switch to sort the whole library."}
        </div>
      </div>
    </section>

    ${plan ? `
    <section class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${icon("sparkles")} Plan ready — review before moving</div>
          <div class="card-sub">${summary.count} files · ${summary.folders} destination folders · ${summary.renamed} renames to avoid conflicts</div>
        </div>
        <button class="icon-btn" data-action="cancel-plan" aria-label="Cancel plan">${icon("x")}</button>
      </div>
      <div class="card-body">
        <div class="plan-summary" style="margin-bottom:16px">
          <div class="plan-stat"><strong>${fmtCount(summary.count)}</strong><span>files to move</span></div>
          <div class="plan-stat"><strong>${fmtCount(summary.folders)}</strong><span>new folders</span></div>
          <div class="plan-stat"><strong>${fmtBytes(summary.bytes)}</strong><span>total size</span></div>
          <div class="plan-stat"><strong>${summary.renamed}</strong><span>auto-renamed</span></div>
          <div class="plan-stat"><strong>${summary.categories.length}</strong><span>categories</span></div>
        </div>

        ${state.organize.busy ? `
          <div class="card pad" style="border-color:var(--sky-200);background:var(--sky-25);margin-bottom:14px">
            <div class="row" style="justify-content:space-between;margin-bottom:8px">
              <strong style="font-size:12.5px">Moving files…</strong>
              <span class="small muted" data-organize-label>${state.organize.progress} / ${state.organize.total} moved</span>
            </div>
            <div class="progress"><span data-organize-bar style="width:${pct(state.organize.progress, state.organize.total)}%"></span></div>
          </div>` : ""}

        <div class="preview-list">
          ${plan.slice(0, 250).map((p) => `
            <div class="move-row">
              <span class="move-from">${icon(CATEGORIES[p.category].icon)}<span title="${esc(p.srcPath)}">${esc(p.name)}</span></span>
              <span class="move-arrow">${icon("arrowRight")}</span>
              <span class="move-to" title="${esc(p.destPath)}">${icon("folder")}<span class="dest-folder">${esc(p.destDir)}/</span><span style="color:var(--ink-2)">${esc(p.newName)}</span>${p.renamed ? ' <span class="pill warn" style="padding:1px 6px;font-size:9px">renamed</span>' : ""}</span>
            </div>`).join("")}
          ${plan.length > 250 ? `<div class="move-more">+ ${fmtCount(plan.length - 250)} more moves in this plan</div>` : ""}
        </div>
      </div>
      <div class="card-foot">
        <div class="row wrap" style="justify-content:space-between">
          <span class="hint" style="max-width:520px">${demo ? "Demo mode · moves are simulated, so nothing on your disk changes." : "Files move on your device. Read-only folders are skipped."}</span>
          <span class="row">
            <button class="btn ghost" data-action="cancel-plan" ${state.organize.busy ? "disabled" : ""}>Cancel</button>
            <button class="btn primary" data-action="apply-plan" ${state.organize.busy ? "disabled" : ""}>${icon("check")} Apply ${fmtCount(summary.count)} moves</button>
          </span>
        </div>
      </div>
    </section>` : ""}

    ${!state.files.length ? `<section class="card">${miniEmpty("sort", "Nothing to organize yet", "Add a folder and scan it first.")}</section>` : ""}

    <details class="help">
      <summary>${icon("info")} What exactly happens to my files?</summary>
      <div class="help-body">
        <ul class="steps">
          <li>Explorchive asks the browser for write permission on each folder you connected.</li>
          <li>Each destination folder is created only when a file actually needs it.</li>
          <li>In Chrome and Edge, files are moved natively — metadata and timestamps are preserved.</li>
          <li>If the native move is unavailable, the file is copied, verified, then the original is removed. Keep the tab open until it finishes.</li>
          <li>Nothing is uploaded. There is no Explorchive server and no account.</li>
        </ul>
      </div>
    </details>
  </div>`;
}

function demoPreviewFolders(scheme) {
  if (scheme === "month") return ["2025", "03 – March", "04 – April"];
  if (scheme === "year") return ["2023", "2024", "2025"];
  if (scheme === "project") return ["Aurora", "Images", "Briefs"];
  return ["Images", "Documents", "Video"];
}

/* ---------------------------- duplicates ---------------------------- */
function duplicatesViewHTML() {
  const demo = demoActive();
  const d = state.dupes;
  const groups = d.groups || [];
  const extrasCount = sum(groups, (g) => g.files.length - 1);

  return `
  <div class="view-stack">
    ${demo ? demoBannerHTML() : ""}
    <section class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${icon("duplicates")} Duplicate finder</div>
          <div class="card-sub">Fast mode compares name + size. Strict mode confirms with SHA-256 content hashes.</div>
        </div>
        ${d.scannedAt ? `<span class="pill ok">${icon("check")} Scanned ${esc(timeAgo(d.scannedAt))}</span>` : `<span class="pill muted">Not scanned</span>`}
      </div>
      <div class="card-body">
        <div class="row wrap" style="justify-content:space-between;gap:14px">
          <div class="row wrap" style="gap:16px">
            <label class="switch">
              <input type="checkbox" data-change="dupes-strict" ${d.strict ? "checked" : ""} />
              <span class="track"></span>
              <span>Strict mode — read &amp; hash every candidate</span>
            </label>
            <span class="hint">${d.strict ? "Slower, but catches copies with different names." : "Fast. Different names are treated as different files."}</span>
          </div>
          <button class="btn primary" data-action="scan-duplicates" ${d.busy || !state.files.length ? "disabled" : ""}>${icon("search")} ${d.groups ? "Scan again" : "Find duplicates"}</button>
        </div>
        ${d.groups && d.groups.length ? `
        <div class="divider" style="margin:18px 0"></div>
        <div class="plan-summary">
          <div class="plan-stat"><strong>${fmtCount(groups.length)}</strong><span>duplicate groups</span></div>
          <div class="plan-stat"><strong>${fmtBytes(d.reclaimable)}</strong><span>reclaimable space</span></div>
          <div class="plan-stat"><strong>${fmtCount(extrasCount)}</strong><span>extra copies</span></div>
          <div class="grow"></div>
          <button class="btn danger sm" data-action="delete-all-dupes">${icon("trash")} Delete all extra copies</button>
        </div>` : ""}
        ${d.groups && !d.groups.length ? `<div class="banner ok" style="margin-top:16px">${icon("check")}<div class="b-body"><div class="b-title">No duplicates found</div>${fmtCount(d.scannedCount || state.files.length)} files compared${d.strict ? " with full hashing" : ""}. Your library is tidy.</div></div>` : ""}
      </div>
    </section>

    ${d.busy ? `<section class="card">${miniEmpty("refresh", "Comparing files…", "Large libraries and strict mode can take a moment. Files are read locally.")}</section>` : ""}

    ${groups.length ? `
    <div class="view-stack">
      ${groups.map((g) => duplicateGroupHTML(g)).join("")}
    </div>` : ""}

    ${!state.files.length ? `<section class="card">${miniEmpty("duplicates", "Add files to compare", "Connect a folder, then run the finder.")}</section>` : ""}

    <div class="banner info">
      ${icon("shield")}
      <div class="b-body"><div class="b-title">The oldest copy is kept by default</div>
      Explorchive never deletes automatically. Pick which copy to keep in each group, review the total, then confirm. Deleted files skip the system trash.</div>
    </div>
  </div>`;
}

function duplicateGroupHTML(g) {
  return `
  <section class="card dupe-group">
    <div class="dupe-head">
      <span class="file-ico" style="width:28px;height:28px">${icon(CATEGORIES[g.category].icon)}</span>
      <span class="dh-name">${esc(g.name)}</span>
      <span class="dh-meta">
        <span class="badge cat-${g.category}">${fmtBytes(g.size)} each</span>
        <span class="pill warn">${fmtCount(g.files.length)} copies</span>
        <span class="muted">${fmtBytes(g.wasted)} wasted</span>
        <button class="btn sm danger" data-action="delete-group-extras" data-id="${g.id}">${icon("trash")} Delete ${g.files.length - 1} extra</button>
      </span>
    </div>
    ${g.files.map((f) => {
      const keep = f.id === g.keepId;
      const source = sourceById(f.rootId);
      return `
      <div class="dupe-file ${keep ? "keep" : ""}">
        <button class="radio ${keep ? "checked" : ""}" data-action="set-keep" data-group="${g.id}" data-id="${f.id}" aria-label="Keep this copy" title="Keep this copy"></button>
        <span class="df-main">
          <span class="row" style="gap:7px">
            <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${esc(f.name)}</span>
            ${keep ? '<span class="keep-tag">keep</span>' : ""}
          </span>
          <span class="df-path">${esc(f.path)}${source ? " · " + esc(source.name) : ""}</span>
        </span>
        <span class="tiny muted nowrap">${esc(dateStr(f.mtime))}</span>
        <button class="icon-btn" data-action="open-file" data-id="${esc(f.id)}" title="Preview" aria-label="Preview">${icon("eye")}</button>
        ${keep ? "" : `<button class="icon-btn" data-action="delete-file" data-id="${esc(f.id)}" title="Delete this copy" aria-label="Delete this copy">${icon("trash")}</button>`}
      </div>`;
    }).join("")}
  </section>`;
}

/* ---------------------------- cleanup ---------------------------- */
function cleanupViewHTML() {
  const demo = demoActive();
  const b = cleanupBuckets();
  const rule = (key, iconName, tone, title, desc, bytes, count, unit) => `
    <section class="card rule">
      <div class="rule-top">
        <span class="rule-ico ${tone}">${icon(iconName)}</span>
        <div class="grow">
          <div class="rule-title">${esc(title)}</div>
          <div class="rule-desc">${esc(desc)}</div>
        </div>
      </div>
      <div class="rule-meta">
        <span class="rule-size">${key === "empty" ? fmtCount(count) : fmtBytes(bytes)}</span>
        <span class="rule-count">${key === "empty" ? plural(count, "folder", "folders") : fmtCount(count) + " " + plural(count, "file", "files")}</span>
      </div>
      ${count ? `<div class="rule-actions">
        <button class="btn sm ghost" data-action="review-cleanup" data-kind="${key}">${icon("eye")} Review</button>
        <button class="btn sm danger" data-action="cleanup-delete" data-kind="${key}">${icon("trash")} Delete ${key === "empty" ? "folders" : "all"}</button>
      </div>` : `<div class="rule-actions"><span class="pill ok">${icon("check")} Nothing to clean</span></div>`}
      ${count && key !== "empty" ? `<div class="rule-list">
        ${b[key].files.slice(0, 4).map((f) => `<div class="rule-item">${icon(CATEGORIES[f.category].icon)}<span class="ri-name">${esc(f.name)}</span><span class="ri-size">${fmtBytes(f.size)}</span></div>`).join("")}
        ${count > 4 ? `<div class="rule-item" style="color:var(--ink-4)">+ ${fmtCount(count - 4)} more</div>` : ""}
      </div>` : ""}
      ${count && key === "empty" ? `<div class="rule-list">
        ${b.empty.folders.slice(0, 4).map((f) => `<div class="rule-item">${icon("folder")}<span class="ri-name">${esc(f.path)}</span></div>`).join("")}
        ${count > 4 ? `<div class="rule-item" style="color:var(--ink-4)">+ ${fmtCount(count - 4)} more</div>` : ""}
      </div>` : ""}
    </section>`;

  const totalReclaim = b.junk.bytes + b.large.bytes;

  return `
  <div class="view-stack">
    ${demo ? demoBannerHTML() : ""}
    <section class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${icon("cleanup")} Four rules, full control</div>
          <div class="card-sub">Review everything before deleting. Explorchive never removes a file on its own.</div>
        </div>
        <div class="row">
          <span class="pill ${totalReclaim ? "warn" : "ok"}">${fmtBytes(totalReclaim)} in large + junk</span>
          <button class="btn sm ghost" data-action="scan">${icon("refresh")} Rescan</button>
        </div>
      </div>
    </section>

    <div class="rule-grid">
      ${rule("large", "hardDrive", "violet", "Large files", "Single files over 100 MB. Move them to the cloud vault or an external drive.", b.large.bytes, b.large.files.length)}
      ${rule("old", "clock", "amber", "Untouched for a year", "Files with a modified date older than 365 days. A good archive candidate.", b.old.bytes, b.old.files.length)}
      ${rule("junk", "cleanup", "coral", "Junk & temp files", ".tmp, .part, .crdownload, Thumbs.db, .DS_Store and Office lock files.", b.junk.bytes, b.junk.files.length)}
      ${rule("empty", "folder", "green", "Empty folders", "Folders with zero files inside, checked recursively.", 0, b.empty.folders.length)}
    </div>

    <div class="banner info">
      ${icon("info")}
      <div class="b-body"><div class="b-title">Deleting is permanent</div>
      Explorchive deletes through the File System Access API, which bypasses the system trash. Large-file cleanup is best done by moving files into the cloud vault instead — see Cloud &amp; storage.</div>
    </div>
  </div>`;
}

function openCleanupReview(kind) {
  const buckets = cleanupBuckets();
  const bucket = buckets[kind];
  if (!bucket) return;
  const items = kind === "empty" ? bucket.folders : bucket.files;
  if (!items.length) { toast("Nothing to review in this rule", "info"); return; }
  const label = { large: "Large files", old: "Untouched files", junk: "Junk files", empty: "Empty folders" }[kind];
  const body = `
    <div class="banner info" style="margin-bottom:14px">${icon("info")}<div class="b-body">
      ${kind === "empty" ? `${fmtCount(items.length)} folders will be removed. Only truly empty folders are touched.` : `${fmtCount(items.length)} files · ${fmtBytes(bucket.bytes)}. Uncheck anything you want to keep, then delete.`}
    </div></div>
    ${kind === "empty" ? `
      <div class="preview-list">
        ${items.slice(0, 400).map((f) => `<div class="move-row" style="grid-template-columns:1fr">
          <span class="move-from">${icon("folder")}<span>${esc(f.path)}</span></span>
        </div>`).join("")}
      </div>` : `
      <div class="preview-list">
        ${items.slice(0, 400).map((f) => `<div class="move-row" style="grid-template-columns:22px minmax(0,1fr) auto">
          <input type="checkbox" class="checkbox" data-cleanup-file="${esc(f.id)}" checked aria-label="Select ${esc(f.name)}" />
          <span class="move-from">${icon(CATEGORIES[f.category].icon)}<span title="${esc(f.path)}">${esc(f.path)}</span></span>
          <span class="tiny muted nowrap">${fmtBytes(f.size)} · ${esc(dateStr(f.mtime))}</span>
        </div>`).join("")}
        ${items.length > 400 ? `<div class="move-more">+ ${fmtCount(items.length - 400)} more not shown</div>` : ""}
      </div>`}
    ${items.length > 400 && kind !== "empty" ? `<div class="hint" style="margin-top:8px">Deleting runs on the first 400 items shown. Review the rest in smaller batches.</div>` : ""}`;

  openModal({
    title: `Review ${label.toLowerCase()}`,
    sub: `${fmtCount(items.length)} ${kind === "empty" ? "folders" : "files"}${kind === "empty" ? "" : " · " + fmtBytes(bucket.bytes)}`,
    iconName: kind === "empty" ? "folder" : "cleanup",
    wide: true,
    body,
    actions: [
      { label: "Close", onClick: (close) => close() },
      {
        label: kind === "empty" ? "Remove all folders" : "Delete selected",
        cls: "danger",
        icon: "trash",
        onClick: async (close) => {
          if (kind === "empty") { close(); await deleteEmptyFolders(); return; }
          const ids = $$("[data-cleanup-file]:checked", document.getElementById("modal-root")).map((el) => el.dataset.cleanupFile);
          const files = ids.map(fileById).filter(Boolean);
          close();
          await deleteFileObjects(files, { confirm: false });
        },
      },
    ],
  });
}

/* ---------------------------- cloud ---------------------------- */
function cloudCfg() { return state.settings.cloud || null; }
function cloudBase() { const c = cloudCfg(); return c ? String(c.url || "").replace(/\/+$/, "") : ""; }

async function cloudRequest(path, { method = "GET", body = null, headers = {} } = {}) {
  const cfg = cloudCfg();
  if (!cfg) throw new Error("Cloud vault is not configured");
  let res;
  try {
    res = await fetch(cloudBase() + path, {
    method,
      headers: {
        apikey: cfg.key,
        Authorization: "Bearer " + cfg.key,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const host = (() => { try { return new URL(cloudBase()).host; } catch { return "the project URL"; } })();
    throw new Error(`Could not reach ${host}. Check the URL, your connection, and that the project is awake.`);
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const message = (data && (data.message || data.error_description || data.error)) || (typeof data === "string" ? data : "") || ("HTTP " + res.status);
    throw new Error(message + (res.status === 401 ? " — check the anon key" : res.status === 403 ? " — storage policies are blocking this key" : ""));
  }
  return data;
}

async function listCloudObjects(bucket, prefix = "", depth = 0, out = []) {
  let offset = 0;
  const PAGE = 100;
  while (true) {
    const batch = await cloudRequest("/storage/v1/object/list/" + encodeURIComponent(bucket), {
      method: "POST",
      body: { prefix, limit: PAGE, offset, sortBy: { column: "name", order: "asc" } },
    });
    if (!Array.isArray(batch)) throw new Error("Unexpected response from storage list");
    for (const item of batch) {
      const full = prefix ? prefix + "/" + item.name : item.name;
      const isFolder = !item.id || !item.metadata || item.metadata === null;
      if (isFolder) { if (depth < 8) await listCloudObjects(bucket, full, depth + 1, out); }
      else out.push({
        name: full,
        size: Number(item.metadata.size) || 0,
        updated: item.updated_at,
        mimetype: item.metadata.mimetype || "application/octet-stream",
        id: item.id,
      });
    }
    if (batch.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

async function testCloud({ quiet = false } = {}) {
  if (!cloudConfigured()) return;
  state.cloud.busy = true;
  state.cloud.status = "connecting";
  state.cloud.error = "";
  render();
  try {
    const cfg = cloudCfg();
    let buckets;
    try { buckets = await cloudRequest("/storage/v1/bucket"); }
    catch (err) {
      throw new Error(err.message + ". The anon key needs read access to Storage. Check your Supabase policies.");
    }
    state.cloud.buckets = Array.isArray(buckets) ? buckets : [];
    let bucketName = cfg.bucket || "explorchive";
    let exists = state.cloud.buckets.some((b) => (b.name || b.id) === bucketName);
    if (!exists) {
      try {
        await cloudRequest("/storage/v1/bucket", { method: "POST", body: { name: bucketName, id: bucketName, public: false } });
        exists = true;
        if (!quiet) toast('Bucket "' + bucketName + '" created in your Supabase project', "ok");
      } catch (err) {
        throw new Error('Bucket "' + bucketName + '" is missing and could not be created (' + err.message + "). Create it in Supabase → Storage, or paste another bucket name.");
      }
    }
    const objects = await listCloudObjects(bucketName);
    state.cloud.objects = objects;
    state.cloud.usage = sum(objects, (o) => o.size);
    state.cloud.status = "ready";
    state.cloud.lastChecked = Date.now();
    if (!quiet) toast("Cloud vault connected · " + fmtBytes(state.cloud.usage) + " used", "ok");
  } catch (err) {
    state.cloud.status = "error";
    state.cloud.error = err.message || String(err);
    if (!quiet) toast("Cloud vault: " + state.cloud.error, "err");
  } finally {
    state.cloud.busy = false;
    render();
  }
}

async function refreshCloudUsage({ quiet = true } = {}) {
  if (!cloudConfigured()) return;
  try {
    const bucket = cloudCfg().bucket || "explorchive";
    const objects = await listCloudObjects(bucket);
    state.cloud.objects = objects;
    state.cloud.usage = sum(objects, (o) => o.size);
    state.cloud.status = "ready";
    state.cloud.error = "";
    if (!quiet) toast("Usage refreshed · " + fmtBytes(state.cloud.usage), "ok");
  } catch (err) {
    state.cloud.status = "error";
    state.cloud.error = err.message;
    if (!quiet) toast(err.message, "err");
  }
  render();
}

async function cloudUploadSelected() {
  if (!cloudConfigured()) { toast("Connect a cloud vault first", "err"); return; }
  const files = Array.from(state.uploadSelection).map(fileById).filter(Boolean).filter((f) => !f.demo);
  if (!files.length) { toast("Select files from a real folder to back up", "info"); return; }
  if (!state.sources.some((s) => !s.demo && (s.handle || s.rawFiles))) { toast("Connect a real folder first — demo files cannot be uploaded", "err"); return; }
  const cfg = cloudCfg();
  const bucket = cfg.bucket || "explorchive";
  state.cloud.busy = true;
  state.cloud.upload = { total: files.length, done: 0, current: "", bytes: 0, failed: 0, startedAt: Date.now() };
  render();
  let uploaded = 0;
  let failed = 0;
  let bytes = 0;

  for (const file of files) {
    state.cloud.upload.current = file.name;
    render();
    try {
      const blob = await getBlobForFile(file);
      if (!blob) throw new Error("unreadable");
      const year = new Date(file.mtime || Date.now()).getFullYear();
      const safeName = file.name.replace(/[#?%]/g, "_");
      const path = ["explorchive", String(year), file.category, safeName].map(encodeURIComponent).join("/");
      let response;
      try {
        response = await fetch(cloudBase() + "/storage/v1/object/" + encodeURIComponent(bucket) + "/" + path, {
        method: "POST",
        headers: {
          apikey: cfg.key,
          Authorization: "Bearer " + cfg.key,
          "x-upsert": "true",
          "Content-Type": blob.type || "application/octet-stream",
          "cache-control": "3600",
        },
          body: blob,
        });
      } catch {
        throw new Error("network — could not reach the bucket");
      }
      if (!response.ok) {
        const t = await response.text();
        let msg = t;
        try { msg = JSON.parse(t).message || t; } catch {}
        throw new Error(msg || "HTTP " + response.status);
      }
      uploaded++;
      bytes += blob.size;
    } catch (err) {
      failed++;
      if (failed === 1) toast("Upload issue: " + (err.message || err.name), "err");
    }
    state.cloud.upload.done = uploaded + failed;
    state.cloud.upload.bytes = bytes;
    state.cloud.upload.failed = failed;
    const bar = document.querySelector("[data-upload-bar]");
    if (bar) bar.style.width = pct(uploaded + failed, files.length) + "%";
    const label = document.querySelector("[data-upload-label]");
    if (label) label.textContent = `${uploaded + failed} / ${files.length} · ${file.name}`;
  }

  state.cloud.upload = null;
  state.cloud.busy = false;
  state.uploadSelection.clear();
  state.cloud.lastUpload = { at: Date.now(), uploaded, failed, bytes };
  await refreshCloudUsage({ quiet: true });
  render();
  if (uploaded) toast(`${fmtCount(uploaded)} files backed up · ${fmtBytes(bytes)}${failed ? ` · ${failed} failed` : ""}`, "ok", "Cloud vault");
  if (!uploaded && failed) toast("Upload failed. Check bucket policies and CORS in Supabase.", "err");
}

async function deleteCloudObject(name) {
  const cfg = cloudCfg();
  if (!cfg) return;
  const ok = await confirmModal({
    title: "Delete from the cloud vault?",
    message: `Remove <strong>${esc(baseOfPath(name))}</strong> from bucket <span class="mono">${esc(cfg.bucket)}</span>? This frees space in your cloud account.`,
    confirmLabel: "Delete object",
    tone: "danger",
    iconName: "cloud",
  });
  if (!ok) return;
  try {
    const path = name.split("/").map(encodeURIComponent).join("/");
    await cloudRequest("/storage/v1/object/" + encodeURIComponent(cfg.bucket) + "/" + path, { method: "DELETE" });
    toast("Object deleted from cloud vault", "ok");
    await refreshCloudUsage({ quiet: true });
  } catch (err) {
    toast("Delete failed: " + err.message, "err");
  }
}

async function openSignedLink(name) {
  const cfg = cloudCfg();
  if (!cfg) return;
  try {
    const path = name.split("/").map(encodeURIComponent).join("/");
    const data = await cloudRequest("/storage/v1/object/sign/" + encodeURIComponent(cfg.bucket) + "/" + path, {
      method: "POST",
      body: { expiresIn: 3600 },
    });
    if (!data || !data.signedURL) throw new Error("No signed URL returned");
    const url = data.signedURL.startsWith("http") ? data.signedURL : cloudBase() + "/storage/v1" + data.signedURL;
    window.open(url, "_blank", "noopener");
    toast("Signed link created — valid for 1 hour", "ok");
  } catch (err) {
    toast("Could not create link: " + err.message, "err");
  }
}

function cloudViewHTML() {
  const cfg = cloudCfg();
  const connected = state.cloud.status === "ready";
  const quotaGB = cfg ? Number(cfg.quotaGB || 1) : 1;
  const used = state.cloud.usage;
  const quotaBytes = quotaGB * 1024 ** 3;
  const usedPct = used != null ? pct(used, quotaBytes) : 0;
  const claimed = new Set(state.settings.claimed || []);
  const claimedGB = sum(FREE_TIERS.filter((t) => claimed.has(t.name)), (t) => t.gb);
  const objects = state.cloud.objects || [];
  const realFiles = state.files.filter((f) => !f.demo);
  const candidates = sortBy(realFiles, (f) => -f.size).slice(0, 40);
  const demo = demoActive();

  return `
  <div class="view-stack">
    ${demo ? `<div class="banner info">${icon("sparkles")}<div class="b-body"><div class="b-title">Cloud backups need real files</div>The demo library can't be uploaded. Add a real folder to back files up to your own Supabase bucket.</div><button class="btn sm ghost" data-action="add-folder">${icon("folderPlus")} Add folder</button></div>` : ""}

    <div class="cloud-grid">
      <section class="card">
        <div class="card-head">
          <div>
            <div class="card-title">${icon("cloud")} Cloud vault</div>
            <div class="card-sub">Your own free Supabase Storage bucket — connected directly from this browser.</div>
          </div>
          <span class="status-line"><span class="status-dot ${connected ? "on" : state.cloud.status === "error" ? "err" : state.cloud.status === "connecting" ? "wait" : ""}"></span>${connected ? "Connected" : state.cloud.status === "error" ? "Error" : cfg ? "Not tested" : "Not configured"}</span>
        </div>
        <div class="card-body">
          ${state.cloud.error ? `<div class="banner danger" style="margin-bottom:14px">${icon("alert")}<div class="b-body"><div class="b-title">Connection problem</div>${esc(state.cloud.error)}</div></div>` : ""}

          ${cfg ? `
            <div class="kv">
              <div class="kv-row"><span class="k">Project URL</span><span class="v mono" style="max-width:240px;overflow:hidden;text-overflow:ellipsis">${esc(cfg.url)}</span></div>
              <div class="kv-row"><span class="k">Bucket</span><span class="v mono">${esc(cfg.bucket || "explorchive")}</span></div>
              <div class="kv-row"><span class="k">Free tier set to</span><span class="v">${quotaGB} GB</span></div>
              <div class="kv-row"><span class="k">Objects in vault</span><span class="v">${objects.length ? fmtCount(objects.length) : "—"}</span></div>
            </div>
            <div class="quota" style="margin-top:16px">
              <div class="quota-head">
                <strong>${used != null ? fmtBytes(used) : "—"} used</strong>
                <span>of ${quotaGB} GB · ${used != null ? fmtBytes(Math.max(0, quotaBytes - used)) + " free" : "usage not loaded"}</span>
              </div>
              <div class="quota-track"><div class="quota-used" style="width:${clamp(usedPct, 0, 100)}%"></div></div>
              <div class="quota-note">Supabase free plan includes ~1 GB storage + 2 GB egress. Usage is approximate and cached.</div>
            </div>
            <div class="row wrap" style="margin-top:16px">
              <button class="btn primary sm" data-action="cloud-test" ${state.cloud.busy ? "disabled" : ""}>${icon(state.cloud.busy ? "refresh" : "zap")} ${state.cloud.busy ? "Testing…" : "Test connection"}</button>
              <button class="btn ghost sm" data-action="cloud-usage">${icon("refresh")} Refresh usage</button>
              <button class="btn ghost sm" data-action="cloud-edit">${icon("settings")} Edit</button>
              <button class="btn danger sm" data-action="cloud-disconnect">${icon("x")} Disconnect</button>
            </div>` : `
            <form data-submit="cloud-connect" class="form-grid" autocomplete="off">
              <div class="field">
                <label class="label" for="cloud-url">Supabase project URL</label>
                <input class="input" id="cloud-url" name="url" placeholder="https://abcdefgh.supabase.co" required />
              </div>
              <div class="field">
                <label class="label" for="cloud-key">Anon public key</label>
                <input class="input" id="cloud-key" name="key" type="password" placeholder="eyJhbGciOiJIUzI1NiIs…" required />
                <span class="hint">Stored only in this browser's localStorage. Use a project made for this purpose — never your service-role key.</span>
              </div>
              <div class="row" style="gap:10px;align-items:flex-start">
                <div class="field grow">
                  <label class="label" for="cloud-bucket">Bucket</label>
                  <input class="input" id="cloud-bucket" name="bucket" value="explorchive" placeholder="explorchive" />
                </div>
                <div class="field" style="width:130px">
                  <label class="label" for="cloud-quota">Free tier (GB)</label>
                  <input class="input" id="cloud-quota" name="quota" type="number" min="0.1" step="0.1" value="1" />
                </div>
              </div>
              <button class="btn primary" type="submit">${icon("cloud")} Connect vault</button>
            </form>

            <div class="divider" style="margin:18px 0"></div>
            <div class="card-title" style="font-size:12.5px;margin-bottom:8px">${icon("key")} One-time setup in Supabase</div>
            <ol class="steps">
              <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> (no card needed).</li>
              <li>In <strong>Storage</strong>, create a private bucket named <span class="mono">explorchive</span> — or let Explorchive create it.</li>
              <li>Paste the project URL and <strong>anon public</strong> key from Project Settings → API.</li>
              <li>For uploads, add a storage policy allowing <span class="mono">anon</span> access to that bucket on CREATE, SELECT and DELETE.</li>
            </ol>
            <div class="banner warn" style="margin-top:12px">${icon("alert")}<div class="b-body">
              A public anon key in browser storage is fine for a personal project, but anyone with the key and permissive policies can reach the bucket. Keep RLS/policies tight and do not reuse this project for secrets.
            </div></div>`}
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <div>
            <div class="card-title">${icon("search")} Free cloud finder</div>
            <div class="card-sub">Free tiers this app knows about, totalled locally.</div>
          </div>
          <span class="pill">${claimedGB} GB claimed</span>
        </div>
        <div class="card-body">
          <div class="free-total">
            <div>
              <div class="ft-value">${claimableTotal()} GB</div>
              <div class="ft-label">still claimable across ${FREE_TIERS.length - claimed.size} providers</div>
            </div>
            <div class="grow"></div>
            <span class="stat-ico green">${icon("cloud")}</span>
          </div>
          <div class="provider-grid" style="margin-top:14px">
            ${FREE_TIERS.map((t) => {
              const on = claimed.has(t.name);
              return `
              <button class="provider ${on ? "claimed" : ""}" data-action="claim-provider" data-name="${esc(t.name)}" title="${esc(t.note)}">
                <span class="provider-logo" style="background:${t.color}">${esc(t.short)}</span>
                <span class="provider-meta"><span class="provider-name">${esc(t.name)}</span><span class="provider-note">${esc(t.note)}</span></span>
                <span class="provider-gb">${t.gb} GB</span>
                <span class="provider-check">${icon("check")}</span>
              </button>`;
            }).join("")}
          </div>
          <div class="row" style="justify-content:space-between;margin-top:14px">
            <span class="hint">Tap a provider to mark it claimed. Figures are typical free tiers, not a live API — providers change plans.</span>
            <button class="btn sm ghost" data-action="open-providers" aria-label="Open provider links">${icon("external")}</button>
          </div>
        </div>
      </section>
    </div>

    ${cfg ? `
    <section class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${icon("upload")} Back up files to the vault</div>
          <div class="card-sub">Select real files — they upload straight from your device to your bucket.</div>
        </div>
        <div class="row">
          <span class="pill">${fmtCount(state.uploadSelection.size)} selected</span>
          <button class="btn sm ghost" data-action="upload-select-largest">${icon("sparkles")} Pick 10 largest</button>
          <button class="btn primary sm" data-action="cloud-upload" ${state.cloud.busy || !state.uploadSelection.size ? "disabled" : ""}>${icon("upload")} Back up ${state.uploadSelection.size || ""}</button>
        </div>
      </div>
      <div class="card-body">
        ${state.cloud.upload ? `
          <div class="card pad" style="border-color:var(--sky-200);background:var(--sky-25);margin-bottom:14px">
            <div class="row" style="justify-content:space-between;margin-bottom:8px">
              <strong style="font-size:12.5px">Uploading to your bucket…</strong>
              <span class="small muted" data-upload-label>${state.cloud.upload.done} / ${state.cloud.upload.total} · ${esc(state.cloud.upload.current)}</span>
            </div>
            <div class="progress"><span data-upload-bar style="width:${pct(state.cloud.upload.done, state.cloud.upload.total)}%"></span></div>
          </div>` : ""}
        ${state.cloud.lastUpload ? `<div class="banner ok" style="margin-bottom:14px">${icon("check")}<div class="b-body"><div class="b-title">Last backup ${esc(timeAgo(state.cloud.lastUpload.at))}</div>${fmtCount(state.cloud.lastUpload.uploaded)} files · ${fmtBytes(state.cloud.lastUpload.bytes)} uploaded${state.cloud.lastUpload.failed ? ` · ${state.cloud.lastUpload.failed} failed` : ""}.</div></div>` : ""}
        ${!realFiles.length ? miniEmpty("cloud", "No real files yet", "Demo files stay in the demo. Connect a folder to back up real documents.") : `
        <div class="preview-list" style="max-height:320px">
          ${candidates.map((f) => `
            <div class="move-row" style="grid-template-columns:22px minmax(0,1fr) auto auto">
              <input type="checkbox" class="checkbox" data-change="upload-select" data-id="${esc(f.id)}" ${state.uploadSelection.has(f.id) ? "checked" : ""} aria-label="Select ${esc(f.name)}" />
              <span class="move-from">${icon(CATEGORIES[f.category].icon)}<span title="${esc(f.path)}">${esc(f.path)}</span></span>
              <span class="tiny muted nowrap">${fmtBytes(f.size)}</span>
              <span class="pill">${esc(CATEGORIES[f.category].label)}</span>
            </div>`).join("")}
        </div>`}
        ${realFiles.length > 40 ? `<div class="hint" style="margin-top:8px">Showing the 40 largest files. Use All files to select smaller ones.</div>` : ""}
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${icon("database")} In the vault</div>
          <div class="card-sub">${objects.length ? `${fmtCount(objects.length)} objects · ${fmtBytes(sum(objects, (o) => o.size))}` : "No objects loaded yet"}</div>
        </div>
        <button class="btn sm ghost" data-action="cloud-usage">${icon("refresh")} Refresh</button>
      </div>
      <div class="card-body" style="padding-top:8px">
        ${objects.length ? `
        <div class="object-list">
          ${objects.slice(0, 80).map((o) => `
            <div class="obj-row">
              <span class="obj-ico">${icon(CATEGORIES[categoryOf(o.name)].icon)}</span>
              <span class="obj-main"><span class="obj-name">${esc(baseOfPath(o.name))}</span><span class="obj-meta">${esc(dirOfPath(o.name))} · ${fmtBytes(o.size)}</span></span>
              <span class="obj-actions">
                <button class="icon-btn" data-action="cloud-link" data-name="${esc(o.name)}" title="Signed link" aria-label="Create signed link">${icon("link")}</button>
                <button class="icon-btn" data-action="cloud-delete" data-name="${esc(o.name)}" title="Delete object" aria-label="Delete object">${icon("trash")}</button>
              </span>
            </div>`).join("")}
          ${objects.length > 80 ? `<div class="hint" style="padding-top:10px">+ ${fmtCount(objects.length - 80)} more objects in the bucket.</div>` : ""}
        </div>` : miniEmpty("cloud", "Vault is empty", "Back up your first files above, or refresh to load objects from the bucket.")}
      </div>
    </section>` : ""}

    <div class="banner info">
      ${icon("shield")}
      <div class="b-body"><div class="b-title">"Detect give cloud free storage" — how it works</div>
      Explorchive can't create accounts for you, so it does the honest version: it detects which free tiers exist, totals them, tracks what you've claimed, and connects a real storage bucket you own. Nothing is uploaded until you press Back up.</div>
    </div>
  </div>`;
}

/* ---------------------------- reports ---------------------------- */
function buildReport() {
  return {
    app: "Explorchive",
    version: APP_VERSION,
    generatedAt: new Date().toISOString(),
    sources: state.sources.map((s) => ({ name: s.name, demo: !!s.demo, status: s.status, files: filesForRoot(s.id).length })),
    totals: {
      files: state.files.length,
      folders: folderCount(),
      bytes: totalSize(),
      categories: categoryStats().map((c) => ({ category: CATEGORIES[c.key].label, files: c.count, bytes: c.bytes })),
    },
    duplicates: state.dupes.groups ? {
      groups: state.dupes.groups.length,
      reclaimableBytes: state.dupes.reclaimable,
      strict: state.dupes.strict,
    } : { scanned: false },
    cleanup: (() => {
      const b = cleanupBuckets();
      return {
        largeFiles: { count: b.large.files.length, bytes: b.large.bytes },
        untouchedForAYear: { count: b.old.files.length, bytes: b.old.bytes },
        junkFiles: { count: b.junk.files.length, bytes: b.junk.bytes },
        emptyFolders: { count: b.empty.folders.length },
      };
    })(),
    cloud: {
      configured: cloudConfigured(),
      bucket: cloudConfigured() ? cloudCfg().bucket : null,
      usedBytes: state.cloud.usage,
      freeTiersGB: claimableTotal(),
    },
    largestFiles: largestFiles(25).map((f) => ({ name: f.name, path: f.path, bytes: f.size, modified: new Date(f.mtime).toISOString(), category: CATEGORIES[f.category].label })),
  };
}

function reportTxt() {
  const r = buildReport();
  const lines = [];
  lines.push("EXPLORCHIVE LIBRARY REPORT");
  lines.push("Generated " + new Date(r.generatedAt).toLocaleString());
  lines.push("=".repeat(52));
  lines.push("");
  lines.push("SOURCES");
  r.sources.forEach((s) => lines.push(`  • ${s.name}${s.demo ? " (demo)" : ""} — ${fmtCount(s.files)} files`));
  lines.push("");
  lines.push("TOTALS");
  lines.push(`  Files:    ${fmtCount(r.totals.files)}`);
  lines.push(`  Folders:  ${fmtCount(r.totals.folders)}`);
  lines.push(`  Size:     ${fmtBytes(r.totals.bytes)}`);
  lines.push("");
  lines.push("BY CATEGORY");
  r.totals.categories.forEach((c) => lines.push(`  ${c.category.padEnd(12)} ${String(c.files).padStart(6)} files  ${fmtBytes(c.bytes)}`));
  lines.push("");
  lines.push("CLEANUP");
  lines.push(`  Large files:        ${fmtCount(r.cleanup.largeFiles.count)} (${fmtBytes(r.cleanup.largeFiles.bytes)})`);
  lines.push(`  Untouched 1 year:   ${fmtCount(r.cleanup.untouchedForAYear.count)} (${fmtBytes(r.cleanup.untouchedForAYear.bytes)})`);
  lines.push(`  Junk files:         ${fmtCount(r.cleanup.junkFiles.count)} (${fmtBytes(r.cleanup.junkFiles.bytes)})`);
  lines.push(`  Empty folders:      ${fmtCount(r.cleanup.emptyFolders.count)}`);
  lines.push("");
  lines.push("DUPLICATES");
  if (r.duplicates.scanned) {
    lines.push(`  Groups: ${r.duplicates.groups}`);
    lines.push(`  Reclaimable: ${fmtBytes(r.duplicates.reclaimableBytes)}`);
  } else lines.push("  Not scanned");
  lines.push("");
  lines.push("LARGEST FILES");
  r.largestFiles.slice(0, 10).forEach((f) => lines.push(`  ${fmtBytes(f.bytes).padStart(9)}  ${f.path}`));
  lines.push("");
  lines.push("Generated locally by Explorchive — no data left this device.");
  return lines.join("\n");
}

function reportCSV() {
  const rows = [["name", "path", "category", "bytes", "modified", "source"]];
  state.files.forEach((f) => {
    const source = sourceById(f.rootId);
    rows.push([f.name, f.path, CATEGORIES[f.category].label, f.size, new Date(f.mtime).toISOString(), source ? source.name : ""]);
  });
  return rows.map((r) => r.map((cell) => {
    const s = String(cell == null ? "" : cell);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(",")).join("\n");
}

function reportsViewHTML() {
  const r = buildReport();
  const demo = demoActive();
  return `
  <div class="view-stack">
    ${demo ? demoBannerHTML() : ""}
    <section class="card">
      <div class="card-head">
        <div class="row">
          <span class="report-icon">${icon("report")}</span>
          <div>
            <div class="card-title">Library report</div>
            <div class="card-sub">A snapshot you can keep, print or share — generated in this tab.</div>
          </div>
        </div>
        <span class="pill">${esc(dateStr(Date.now()))}</span>
      </div>
      <div class="card-body">
        <div class="grid cols-3">
          <div class="card pad" style="box-shadow:none">
            <div class="stat-label">Files indexed</div>
            <div class="stat-value" style="margin-top:8px">${fmtCount(r.totals.files)}</div>
            <div class="tiny muted" style="margin-top:6px">${fmtCount(r.totals.folders)} folders · ${r.sources.length} ${plural(r.sources.length, "source", "sources")}</div>
          </div>
          <div class="card pad" style="box-shadow:none">
            <div class="stat-label">Library size</div>
            <div class="stat-value" style="margin-top:8px">${fmtBytes(r.totals.bytes)}</div>
            <div class="tiny muted" style="margin-top:6px">${r.totals.categories.length} categories</div>
          </div>
          <div class="card pad" style="box-shadow:none">
            <div class="stat-label">Cleanup potential</div>
            <div class="stat-value" style="margin-top:8px">${fmtBytes(r.cleanup.junkFiles.bytes + r.cleanup.largeFiles.bytes)}</div>
            <div class="tiny muted" style="margin-top:6px">large + junk files</div>
          </div>
        </div>
        <div class="divider" style="margin:18px 0"></div>
        <div class="row wrap">
          <button class="btn primary" data-action="export-json">${icon("download")} Export JSON</button>
          <button class="btn ghost" data-action="export-csv">${icon("download")} Export file index (CSV)</button>
          <button class="btn ghost" data-action="export-txt">${icon("fileText")} Summary (.txt)</button>
          <button class="btn ghost" data-action="copy-report">${icon("copy")} Copy summary</button>
          <button class="btn ghost" data-action="print-report">${icon("report")} Print</button>
        </div>
        <div class="hint" style="margin-top:10px">Reports contain file names and paths. They are generated locally and only leave your device if you share them.</div>
      </div>
    </section>

    <div class="grid cols-2">
      <section class="card">
        <div class="card-head"><div class="card-title">${icon("layers")} Category breakdown</div></div>
        <div class="card-body">
          ${r.totals.categories.length ? `<div class="bars">
            ${r.totals.categories.map((c) => `
              <div class="bar-row">
                <div class="bar-top"><span>${esc(c.category)} <span class="muted">· ${fmtCount(c.files)} files</span></span><span class="bar-val">${fmtBytes(c.bytes)}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${pct(c.bytes, r.totals.bytes)}%;background:${(Object.values(CATEGORIES).find((x) => x.label === c.category) || {}).color || "#3D9ADE"}"></div></div>
              </div>`).join("")}
          </div>` : miniEmpty("layers", "No data yet", "Scan a folder to populate the report.")}
        </div>
      </section>

      <section class="card">
        <div class="card-head"><div class="card-title">${icon("check")} Health check</div></div>
        <div class="card-body">
          <div class="kv">
            <div class="kv-row"><span class="k">Duplicate scan</span><span class="v">${r.duplicates.scanned ? `${r.duplicates.groups} groups · ${fmtBytes(r.duplicates.reclaimableBytes)}` : "Not run"}</span></div>
            <div class="kv-row"><span class="k">Junk files</span><span class="v">${fmtCount(r.cleanup.junkFiles.count)} · ${fmtBytes(r.cleanup.junkFiles.bytes)}</span></div>
            <div class="kv-row"><span class="k">Untouched &gt; 1 year</span><span class="v">${fmtCount(r.cleanup.untouchedForAYear.count)} · ${fmtBytes(r.cleanup.untouchedForAYear.bytes)}</span></div>
            <div class="kv-row"><span class="k">Empty folders</span><span class="v">${fmtCount(r.cleanup.emptyFolders.count)}</span></div>
            <div class="kv-row"><span class="k">Cloud vault</span><span class="v">${r.cloud.configured ? esc(r.cloud.bucket) : "Not connected"}</span></div>
          </div>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card-head">
        <div class="card-title">${icon("hardDrive")} Ten largest files</div>
        <button class="btn sm ghost" data-action="navigate" data-view="files">${icon("arrowRight")} Open files</button>
      </div>
      ${r.largestFiles.length ? `
      <div class="table-wrap">
        <table class="tbl"><thead><tr><th>File</th><th>Category</th><th class="num">Size</th><th class="num">Modified</th></tr></thead>
        <tbody>${r.largestFiles.slice(0, 10).map((f) => `<tr><td class="w-name"><span class="file-name">${esc(f.name)}</span><div class="file-path">${esc(f.path)}</div></td><td><span class="badge">${esc(f.category)}</span></td><td class="num" style="font-weight:600">${fmtBytes(f.bytes)}</td><td class="num muted">${esc(dateStr(new Date(f.modified).getTime()))}</td></tr>`).join("")}</tbody></table>
      </div>` : `<div class="card-body">${miniEmpty("file", "No files indexed", "Add a folder to build a report.")}</div>`}
    </section>

    <section class="card">
      <div class="card-head">
        <div class="row">
          <span class="report-icon" style="background:#EAF9F3;color:var(--ok)">${icon("download")}</span>
          <div><div class="card-title">Take Explorchive with you</div><div class="card-sub">One HTML file. No installer, no account, works offline.</div></div>
        </div>
        <button class="btn primary" data-action="download-app">${icon("download")} Download app</button>
      </div>
      <div class="card-body">
        <div class="banner info">${icon("info")}<div class="b-body">The downloaded file is the whole app — markup, styles and JavaScript inlined. Put it on a USB stick, email it to yourself, or host it on any static site. It runs from <span class="mono">file://</span> in Chrome or Edge.</div></div>
      </div>
    </section>
  </div>`;
}

/* ---------------------------- settings ---------------------------- */
function settingsViewHTML() {
  const demo = demoActive();
  const supported = fsSupported();
  const auto = state.settings.autopilot || { enabled: false, scheme: "type", includeSubfolders: false };
  return `
  <div class="view-stack">
    <div class="grid cols-2">
      <section class="card">
        <div class="card-head">
          <div><div class="card-title">${icon("files")} Folders & sources</div><div class="card-sub">Explorchive only sees folders you pick.</div></div>
          <button class="btn primary sm" data-action="add-folder">${icon("plus")} Add</button>
        </div>
        <div class="card-body">
          ${state.sources.length ? state.sources.map((s) => `
            <div class="source-row">
              <span class="src-ico">${icon(s.demo ? "sparkles" : "hardDrive")}</span>
              <div class="grow" style="min-width:0">
                <div style="font-weight:600">${esc(s.name)} ${s.demo ? '<span class="pill muted">demo</span>' : ""}</div>
                <div class="tiny muted">${s.demo ? "Simulated library" : s.status === "needs-permission" ? "Needs permission" : `${fmtCount(filesForRoot(s.id).length)} files · ${fmtBytes(sum(filesForRoot(s.id), (f) => f.size))}`}</div>
              </div>
              ${s.demo ? `<button class="btn sm ghost" data-action="reset-demo">${icon("refresh")} Reset</button>` : ""}
              ${!s.demo && s.status === "needs-permission" ? `<button class="btn sm soft" data-action="reconnect-source" data-id="${esc(s.id)}">Reconnect</button>` : ""}
              ${!s.demo ? `<button class="btn sm ghost" data-action="remove-source" data-id="${esc(s.id)}">${icon("x")} Remove</button>` : ""}
              ${s.demo ? `<button class="btn sm ghost" data-action="clear-demo">${icon("x")} Clear</button>` : ""}
            </div>`).join("") : `<div class="empty" style="padding:26px 10px">
              <div class="empty-art" style="width:52px;height:52px;border-radius:15px">${icon("folderPlus")}</div>
              <h3 style="font-size:13.5px">No folders connected</h3>
              <p style="font-size:11.5px">Pick a folder to index it locally. Permission can be revoked at any time.</p>
              <button class="btn primary sm" data-action="add-folder">${icon("folderPlus")} Add a folder</button>
            </div>`}
          <div class="banner ${supported ? "ok" : "warn"}" style="margin-top:14px">
            ${icon(supported ? "check" : "alert")}
            <div class="b-body"><div class="b-title">${supported ? "File System Access API detected" : "Limited browser support"}</div>
            ${supported ? "Your browser can read and move folders with permission. Handles are remembered after a reload, and permission can be restored in one click." : "This browser can't open folders directly. Explorchive will use the read-only folder upload fallback. Chrome or Edge unlocks moving files."}</div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <div><div class="card-title">${icon("cloud")} Cloud vault</div><div class="card-sub">Your own free storage, optional.</div></div>
          <span class="pill ${cloudConfigured() ? "ok" : "muted"}">${cloudConfigured() ? "Configured" : "Off"}</span>
        </div>
        <div class="card-body">
          ${cloudConfigured() ? `
          <div class="kv">
            <div class="kv-row"><span class="k">Project</span><span class="v mono" style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${esc(cloudCfg().url)}</span></div>
            <div class="kv-row"><span class="k">Bucket</span><span class="v mono">${esc(cloudCfg().bucket || "explorchive")}</span></div>
            <div class="kv-row"><span class="k">Plan shown</span><span class="v">${esc(cloudCfg().quotaGB || 1)} GB free</span></div>
            <div class="kv-row"><span class="k">Free tiers claimed</span><span class="v">${(state.settings.claimed || []).length} / ${FREE_TIERS.length}</span></div>
          </div>` : `<p class="small muted">Explorchive can back up to a free Supabase Storage bucket you own. Setup takes about two minutes.</p>`}
          <div class="row wrap" style="margin-top:14px">
            <button class="btn primary sm" data-action="navigate" data-view="cloud">${icon("cloud")} ${cloudConfigured() ? "Manage vault" : "Find free storage"}</button>
            ${cloudConfigured() ? `<button class="btn ghost sm" data-action="cloud-disconnect">${icon("x")} Disconnect</button>` : ""}
          </div>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${icon("sparkles")} Autopilot</div>
          <div class="card-sub">Let Explorchive sort new files by itself after every scan.</div>
        </div>
        <span class="pill ${auto.enabled ? "ok" : "muted"}">${auto.enabled ? "Running" : "Off"}</span>
      </div>
      <div class="card-body" style="padding-top:4px">
        <div class="setting-row">
          <div class="sr-main">
            <div class="sr-title">Auto-organize after each scan</div>
            <div class="sr-desc">When enabled, every rescan plans the moves below and applies them immediately. Every run can still be undone from Auto-organize. Folders that are read-only are skipped.</div>
          </div>
          <label class="switch">
            <input type="checkbox" data-change="autopilot-toggle" ${auto.enabled ? "checked" : ""} />
            <span class="track"></span>
            <span>${auto.enabled ? "On" : "Off"}</span>
          </label>
        </div>
        <div class="setting-row">
          <div class="sr-main">
            <div class="sr-title">Structure used by autopilot</div>
            <div class="sr-desc">${auto.includeSubfolders ? "Whole library, including files already in subfolders." : "Top-level files only — existing folders are left alone."}</div>
          </div>
          <div class="row">
            <select class="select" data-change="autopilot-scheme" aria-label="Autopilot structure" style="width:auto">
              ${Object.entries(SCHEMES).map(([key, val]) => `<option value="${key}" ${auto.scheme === key ? "selected" : ""}>${esc(val.name)}</option>`).join("")}
            </select>
            <label class="switch">
              <input type="checkbox" data-change="autopilot-scope" ${auto.includeSubfolders ? "checked" : ""} />
              <span class="track"></span>
              <span class="sr-only">Include subfolders</span>
            </label>
          </div>
        </div>
        <div class="banner warn" style="margin-top:12px">${icon("alert")}<div class="b-body">
          Autopilot moves real files. Start with one test folder, check the result, then widen the scope. Explorchive never deletes anything automatically.
        </div></div>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><div class="card-title">${icon("shield")} Privacy & data</div></div>
      <div class="card-body" style="padding-top:4px">
        <div class="setting-row">
          <div class="sr-main">
            <div class="sr-title">Where does my data go?</div>
            <div class="sr-desc">Nowhere. File names and sizes live in this tab's memory. Only theme/cloud settings and folder handles are saved in this browser. Unplug the network and the app keeps working.</div>
          </div>
          <span class="pill ok">${icon("shield")} Local only</span>
        </div>
        <div class="setting-row">
          <div class="sr-main">
            <div class="sr-title">Remembered folder handles</div>
            <div class="sr-desc">Stored in IndexedDB so your folders come back after a reload. Remove a source to forget its handle. They never leave the browser.</div>
          </div>
          <button class="btn sm ghost" data-action="open-privacy">Details</button>
        </div>
        <div class="setting-row">
          <div class="sr-main">
            <div class="sr-title">Cloud credentials</div>
            <div class="sr-desc">A Supabase URL and anon key can be stored in localStorage. Disconnect removes them immediately.</div>
          </div>
          <button class="btn sm ghost" data-action="cloud-disconnect" ${cloudConfigured() ? "" : "disabled"}>Clear keys</button>
        </div>
        <div class="setting-row">
          <div class="sr-main">
            <div class="sr-title">Demo library</div>
            <div class="sr-desc">A ${fmtCount(DEMO_FILE_COUNT)}-file sample so every feature can be tested without touching real files.</div>
          </div>
          <div class="row">
            ${demo ? `<button class="btn sm ghost" data-action="reset-demo">Reset demo</button>` : `<button class="btn sm ghost" data-action="load-demo">Open demo</button>`}
          </div>
        </div>
        <div class="setting-row">
          <div class="sr-main">
            <div class="sr-title">Reset everything</div>
            <div class="sr-desc">Forget folders, clear saved settings, and return to a fresh demo. Real files are never affected.</div>
          </div>
          <button class="btn sm danger" data-action="reset-all">${icon("trash")} Reset app</button>
        </div>
      </div>
    </section>

    <div class="grid cols-2">
      <section class="card">
        <div class="card-head"><div class="card-title">${icon("sun")} Tokyo Sky palette</div></div>
        <div class="card-body">
          <div class="row wrap" style="gap:8px">
            ${[["#F4FAFF", "50"], ["#CFE6F8", "200"], ["#6FB8EA", "400"], ["#3D9ADE", "500"], ["#1D7CBE", "600"], ["#155F94", "700"], ["#0B2239", "ink"]].map(([hex, label]) => `
              <div style="text-align:center;width:58px">
                <div style="height:44px;border-radius:9px;background:${hex};border:1px solid rgba(11,34,57,.08)"></div>
                <div class="tiny muted" style="margin-top:4px">${label}</div>
              </div>`).join("")}
          </div>
          <p class="hint" style="margin-top:12px">Daylight blue on white, with a single vermilion accent from Tokyo Tower. System font stack, high contrast, reduced-motion friendly.</p>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><div class="card-title">${icon("download")} The downloadable app</div></div>
        <div class="card-body">
          <div class="kv">
            <div class="kv-row"><span class="k">Version</span><span class="v">${APP_VERSION} · Tokyo Sky</span></div>
            <div class="kv-row"><span class="k">Format</span><span class="v">Single HTML file</span></div>
            <div class="kv-row"><span class="k">Dependencies</span><span class="v">None</span></div>
            <div class="kv-row"><span class="k">Works offline</span><span class="v">Yes, after download</span></div>
          </div>
          <button class="btn primary" style="margin-top:14px" data-action="download-app">${icon("download")} Download Explorchive.html</button>
          <div class="hint" style="margin-top:8px">Build output also lives at <span class="mono">dist/Explorchive.html</span> in the repository.</div>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card-head"><div class="card-title">${icon("info")} About this build</div></div>
      <div class="card-body">
        <p class="small" style="color:var(--ink-2);line-height:1.65;max-width:760px">
          Explorchive is a local-first file manager. It uses the File System Access API where available, degrades to a read-only
          folder picker elsewhere, and never includes analytics or remote calls except the cloud bucket you configure yourself.
          Version ${APP_VERSION} — Tokyo Sky edition. Built as a single, portable HTML file.
        </p>
        <div class="row wrap" style="margin-top:12px">
          <button class="btn sm ghost" data-action="open-help">${icon("info")} How it works</button>
          <button class="btn sm ghost" data-action="open-privacy">${icon("shield")} Privacy</button>
          <button class="btn sm ghost" data-action="download-app">${icon("download")} Download</button>
        </div>
      </div>
    </section>
  </div>`;
}
