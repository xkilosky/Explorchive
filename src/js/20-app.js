/* ============================================================
   Explorchive — shell, navigation, dashboard, file browser
   ============================================================ */

const NAV_ITEMS = [
  { section: "Workspace" },
  { id: "dashboard", label: "Overview", icon: "dashboard" },
  { id: "files", label: "All files", icon: "files", badge: "files" },
  { id: "organize", label: "Auto-organize", icon: "sort" },
  { section: "Clean up" },
  { id: "duplicates", label: "Duplicates", icon: "duplicates", badge: "dupes" },
  { id: "cleanup", label: "Cleanup rules", icon: "cleanup", badge: "cleanup" },
  { section: "Beyond this device" },
  { id: "cloud", label: "Cloud & storage", icon: "cloud", badge: "cloud" },
  { id: "reports", label: "Reports", icon: "report" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const PAGE_META = {
  dashboard: { title: "Overview", crumb: "Workspace" },
  files: { title: "All files", crumb: "Workspace" },
  organize: { title: "Auto-organize", crumb: "Workspace" },
  duplicates: { title: "Duplicates", crumb: "Clean up" },
  cleanup: { title: "Cleanup rules", crumb: "Clean up" },
  cloud: { title: "Cloud & storage", crumb: "Beyond this device" },
  reports: { title: "Reports", crumb: "Beyond this device" },
  settings: { title: "Settings", crumb: "Beyond this device" },
};

/* ---------------------------- derived data ---------------------------- */
function totalSize() { return sum(state.files, (f) => f.size); }

function categoryStats() {
  const map = {};
  state.files.forEach((f) => {
    const key = f.category || "other";
    if (!map[key]) map[key] = { key, count: 0, bytes: 0 };
    map[key].count++;
    map[key].bytes += f.size;
  });
  return Object.values(map).sort((a, b) => b.bytes - a.bytes);
}

function folderCount() {
  if (!state.files.length && !state.folders.length) return 0;
  const set = new Set(state.folders.map((f) => f.path));
  return set.size;
}

function sortedFiles(sort, dir) {
  const getters = {
    name: (f) => f.name.toLowerCase(),
    size: (f) => f.size,
    mtime: (f) => f.mtime || 0,
    category: (f) => f.category,
    path: (f) => f.path.toLowerCase(),
  };
  const get = getters[sort] || getters.size;
  const list = state.files.slice().sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va < vb) return -1;
    if (va > vb) return 1;
    return a.path.localeCompare(b.path);
  });
  return dir === -1 ? list.reverse() : list;
}

function filteredFiles() {
  const f = state.filters;
  const q = f.query.trim().toLowerCase();
  return sortedFiles(f.sort, f.dir).filter((file) => {
    if (f.category !== "all" && file.category !== f.category) return false;
    if (f.source !== "all" && file.rootId !== f.source) return false;
    if (q && !(file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q))) return false;
    return true;
  });
}

function largestFiles(n = 6) {
  return sortBy(state.files, (f) => -f.size).slice(0, n);
}

function freeCloudTotal() { return sum(FREE_TIERS, (t) => t.gb); }

function claimableTotal() {
  const claimed = new Set(state.settings.claimed || []);
  return sum(FREE_TIERS.filter((t) => !claimed.has(t.name)), (t) => t.gb);
}

function needsPermission() { return state.sources.filter((s) => s.status === "needs-permission"); }

function cloudConfigured() { return !!(state.settings.cloud && state.settings.cloud.url && state.settings.cloud.key); }

function cloudUsageLabel() {
  if (!cloudConfigured()) return claimableTotal() + " GB";
  const usage = state.cloud.usage;
  const quotaGB = (state.settings.cloud.quotaGB || 1);
  if (usage == null) return quotaGB + " GB";
  return fmtBytes(Math.max(0, quotaGB * 1024 ** 3 - usage));
}

/* ---------------------------- shell ---------------------------- */
function navBadge(kind) {
  if (kind === "files") return state.files.length ? fmtCount(state.files.length) : "";
  if (kind === "dupes") return state.dupes.groups ? String(state.dupes.groups.length) : "";
  if (kind === "cleanup") {
    const b = cleanupBuckets();
    const n = b.junk.files.length + b.large.files.length;
    return n ? String(n) : "";
  }
  if (kind === "cloud") return cloudConfigured() ? '<span class="status-dot on" title="Cloud vault connected"></span>' : "";
  return "";
}

function sidebarHTML() {
  const nav = NAV_ITEMS.map((item) => {
    if (item.section) return `<div class="nav-label">${esc(item.section)}</div>`;
    const badge = item.badge ? navBadge(item.badge) : "";
    return `<button class="nav-item ${state.view === item.id ? "active" : ""}" data-action="navigate" data-view="${item.id}">
      ${icon(item.icon)}<span>${esc(item.label)}</span>
      ${badge ? `<span class="nav-badge">${badge}</span>` : ""}
    </button>`;
  }).join("");

  return `
  <aside class="sidebar" id="sidebar" aria-label="Main navigation">
    <div class="sidebar-head">
      <a class="brand" href="#/dashboard" data-action="navigate" data-view="dashboard">
        <span class="brand-mark">${LOGO_SVG}</span>
        <span class="brand-text">
          <span class="brand-name">Explor<em>chive</em></span>
          <span class="brand-tag">Tokyo Sky edition</span>
        </span>
      </a>
    </div>
    <nav class="nav">${nav}</nav>
    <div class="sidebar-foot">
      <div class="privacy-card">
        <div class="pc-top">${icon("shield")} Stays on your device</div>
        No uploads, no account, no tracking. Explorchive reads folders with your permission and keeps working offline.
      </div>
      <div class="sidebar-legal">
        <span>v${APP_VERSION}</span>
        <button class="tiny" data-action="open-privacy" style="color:var(--ink-3)">Privacy</button>
      </div>
    </div>
  </aside>`;
}

function topbarHTML() {
  const meta = PAGE_META[state.view] || PAGE_META.dashboard;
  return `
  <header class="topbar">
    <button class="icon-btn menu-btn" data-action="toggle-menu" aria-label="Open navigation">${icon("menu")}</button>
    <div class="topbar-main">
      <div class="topbar-title">
        <div class="crumb">${esc(meta.crumb)} <span>/</span> Explorchive</div>
        <h1 id="page-title">${esc(meta.title)}</h1>
      </div>
    </div>
    <div class="topbar-actions">
      <div class="top-search">
        ${icon("search")}
        <input id="global-search" type="search" placeholder="Search the library…" aria-label="Search all files" value="${esc(state.filters.query)}" />
        <kbd>/</kbd>
      </div>
      <button class="btn ghost" data-action="scan" title="Rescan folders">${icon("refresh")}<span class="btn-txt">${state.scanning ? "Scanning…" : "Rescan"}</span></button>
      <button class="btn primary" data-action="add-folder">${icon("plus")}<span class="btn-txt">Add folder</span></button>
    </div>
  </header>`;
}

function footerHTML() {
  return `
  <footer class="app-foot">
    <span>Explorchive v${APP_VERSION} · Files never leave your device · Tokyo Sky edition</span>
    <span class="foot-links">
      <button data-action="download-app">Download this app</button>
      <button data-action="open-privacy">Privacy</button>
      <button data-action="open-help">How it works</button>
    </span>
  </footer>`;
}

function shellHTML() {
  return `
  <div class="app">
    ${sidebarHTML()}
    <div class="scrim" id="scrim" data-action="close-menu" hidden></div>
    <div class="main">
      ${topbarHTML()}
      <main class="content" id="main-content"><div id="view" class="view" tabindex="-1"></div></main>
      ${footerHTML()}
    </div>
  </div>`;
}

function render({ focus } = {}) {
  const app = document.getElementById("app");
  if (!app.dataset.built) {
    app.innerHTML = shellHTML();
    app.dataset.built = "1";
  } else {
    const active = document.querySelector(".nav-item.active");
    const nextActive = NAV_ITEMS.find((n) => n.id === state.view);
    if (active && nextActive) {
      // refresh nav in place (badges change often)
      const nav = document.querySelector(".nav");
      if (nav) nav.innerHTML = NAV_ITEMS.map((item) => {
        if (item.section) return `<div class="nav-label">${esc(item.section)}</div>`;
        const badge = item.badge ? navBadge(item.badge) : "";
        return `<button class="nav-item ${state.view === item.id ? "active" : ""}" data-action="navigate" data-view="${item.id}">
          ${icon(item.icon)}<span>${esc(item.label)}</span>
          ${badge ? `<span class="nav-badge">${badge}</span>` : ""}
        </button>`;
      }).join("");
    }
    const top = document.querySelector(".topbar");
    if (top) {
      const meta = PAGE_META[state.view] || PAGE_META.dashboard;
      const crumb = top.querySelector(".crumb");
      const h1 = top.querySelector("#page-title");
      if (crumb) crumb.innerHTML = `${esc(meta.crumb)} <span>/</span> Explorchive`;
      if (h1) h1.textContent = meta.title;
      const scanBtn = top.querySelector('[data-action="scan"] .btn-txt');
      if (scanBtn) scanBtn.textContent = state.scanning ? "Scanning…" : "Rescan";
    }
  }

  const view = document.getElementById("view");
  if (!view) return;
  const scrollY = window.scrollY;
  const html = viewHTML(state.view);
  view.innerHTML = html;
  view.classList.remove("view");
  void view.offsetWidth;
  view.classList.add("view");
  if (!document.body.dataset.firstRender) {
    document.body.dataset.firstRender = "1";
  } else {
    // keep the user's scroll position for in-place updates
    window.scrollTo({ top: scrollY, behavior: "instant" in window ? "instant" : "auto" });
  }

  if (focus) {
    const el = document.getElementById(focus);
    if (el) {
      el.focus({ preventScroll: true });
      if (el.setSelectionRange && typeof el.value === "string") {
        try { el.setSelectionRange(el.value.length, el.value.length); } catch {}
      }
    }
  }
  renderScanOverlay();
  document.body.classList.toggle("has-scan", state.scan.active);
  maybeEstimateStorage();
  afterRenderUI();
}

function viewHTML(view) {
  switch (view) {
    case "files": return filesViewHTML();
    case "organize": return organizeViewHTML();
    case "duplicates": return duplicatesViewHTML();
    case "cleanup": return cleanupViewHTML();
    case "cloud": return cloudViewHTML();
    case "reports": return reportsViewHTML();
    case "settings": return settingsViewHTML();
    default: return dashboardViewHTML();
  }
}

function dashboardViewHTML() {
  const demo = demoActive();
  const files = state.files;
  const size = totalSize();
  const cats = categoryStats();
  const biggest = largestFiles(6);
  const dupes = state.dupes;
  const buckets = cleanupBuckets();
  const attention = [];

  if (!dupes.groups) {
    attention.push({ icon: "duplicates", title: "Duplicates not scanned yet", meta: "Find identical copies", action: "scan-duplicates", tone: "" });
  } else if (dupes.groups.length) {
    attention.push({ icon: "duplicates", title: `${dupes.groups.length} duplicate ${plural(dupes.groups.length, "group", "groups")}`, meta: `${fmtBytes(dupes.reclaimable)} can be reclaimed`, action: "navigate", view: "duplicates", tone: "amber" });
  }
  if (buckets.junk.files.length) attention.push({ icon: "cleanup", title: `${buckets.junk.files.length} junk ${plural(buckets.junk.files.length, "file", "files")}`, meta: `${fmtBytes(buckets.junk.bytes)} of temp files`, action: "navigate", view: "cleanup", tone: "coral" });
  if (buckets.large.files.length) attention.push({ icon: "hardDrive", title: `${buckets.large.files.length} large ${plural(buckets.large.files.length, "file", "files")}`, meta: `${fmtBytes(buckets.large.bytes)} in single files`, action: "navigate", view: "cleanup", tone: "violet" });
  if (buckets.empty.folders.length) attention.push({ icon: "folder", title: `${buckets.empty.folders.length} empty ${plural(buckets.empty.folders.length, "folder", "folders")}`, meta: "Safe to tidy away", action: "navigate", view: "cleanup", tone: "green" });
  if (!attention.length) attention.push({ icon: "check", title: "Nothing needs attention", meta: "Your library looks clean", action: "navigate", view: "cleanup", tone: "green" });

  const sourcesChips = state.sources.map((s) => `
    <span class="source-chip">
      ${icon(s.demo ? "sparkles" : "hardDrive")}
      ${esc(s.name)}
      <span class="n">${s.demo ? "demo" : s.status === "needs-permission" ? "needs access" : fmtCount(filesForRoot(s.id).length) + " files"}</span>
      <button data-action="remove-source" data-id="${esc(s.id)}" aria-label="Remove ${esc(s.name)}">${icon("x")}</button>
    </span>`).join("");

  const pending = needsPermission();

  return `
  <div class="view-stack">
    ${demo ? demoBannerHTML() : ""}
    ${pending.length ? `
      <div class="banner warn">
        ${icon("alert")}
        <div class="b-body">
          <div class="b-title">Reconnect ${esc(pending.map((s) => s.name).join(", "))}</div>
          Browsers forget folder permission after a restart. One click restores access — nothing is uploaded.
        </div>
        ${pending.map((s) => `<button class="btn sm soft" data-action="reconnect-source" data-id="${esc(s.id)}">Reconnect</button>`).join("")}
      </div>` : ""}

    <section class="hero">
      <div class="hero-content">
        <span class="hero-badge"><span class="dot"></span>${demo ? "Live demo library" : "Tokyo Sky edition"}</span>
        <h2 class="hero-title">${demo ? "Welcome to your <em>explorer's archive</em>." : "Your files, sorted by the <em>sky</em>."}</h2>
        <p class="hero-sub">${demo
          ? "This is a sample library so you can try every tool. Add a real folder when you're ready — Explorchive reads it locally and never uploads a byte."
          : `Scanning ${state.sources.length} ${plural(state.sources.length, "folder", "folders")} · ${fmtCount(files.length)} files · ${fmtBytes(size)} indexed. Everything stays on this device.`}</p>
        <div class="hero-actions">
          <button class="btn primary lg" data-action="add-folder">${icon("folderPlus")} Add a folder</button>
          <button class="btn ghost" data-action="scan">${icon("refresh")} ${state.scanning ? "Scanning…" : "Rescan library"}</button>
          ${demo ? `<button class="btn ghost" data-action="clear-demo">${icon("x")} Clear demo</button>` : ""}
        </div>
      </div>
      <div class="hero-meta">
        ${sourcesChips || `<span class="source-chip">${icon("folder")} No folders connected yet</span>`}
        <button class="chip" data-action="add-folder">${icon("plus")} Add source</button>
      </div>
      <div class="hero-skyline">${HERO_SKYLINE}</div>
    </section>

    <div class="grid stats">
      ${statCard("files", "Files indexed", fmtCount(files.length), `${fmtCount(folderCount())} folders`, ICON_PATHS.files ? "files" : "files", "")}
      ${statCard("hardDrive", "Library size", fmtBytes(size), `${cats.length} categories`, "hardDrive", "")}
      ${statCard("duplicates", "Reclaimable", dupes.groups ? fmtBytes(dupes.reclaimable) : "—", dupes.groups ? `${dupes.groups.length} duplicate ${plural(dupes.groups.length, "group", "groups")}` : "Run a duplicate scan", "duplicates", "amber")}
      ${statCard("cloud", "Free cloud found", `${claimableTotal()} <small>GB</small>`, `across ${FREE_TIERS.length} free tiers`, "cloud", "green")}
    </div>

    <div class="grid dash">
      <div class="view-stack">
        <section class="card">
          <div class="card-head">
            <div>
              <div class="card-title">${icon("layers")} Storage by category</div>
              <div class="card-sub">Where the ${fmtBytes(size)} goes</div>
            </div>
            <button class="btn sm ghost" data-action="navigate" data-view="files">${icon("arrowRight")} Browse</button>
          </div>
          <div class="card-body">
            ${cats.length ? `
            <div class="donut-wrap">
              <div class="donut">
                ${donutSVG(cats, size)}
                <div class="donut-center"><strong>${fmtBytes(size).replace(/ ([A-Z]+)$/, "")}<span style="font-size:11px;font-weight:700;color:var(--ink-3)"> ${(fmtBytes(size).match(/([A-Z]+)$/) || [])[1] || ""}</span></strong><span>${fmtCount(files.length)} files</span></div>
              </div>
              <div class="legend">
                ${cats.map((c) => `
                  <div class="legend-row">
                    <span class="legend-dot" style="background:${CATEGORIES[c.key].color}"></span>
                    <span class="legend-name">${esc(CATEGORIES[c.key].label)} <span style="color:var(--ink-4);font-size:10.5px">· ${fmtCount(c.count)}</span></span>
                    <span class="legend-val">${fmtBytes(c.bytes)}</span>
                  </div>`).join("")}
              </div>
            </div>` : miniEmpty("chart", "No files indexed yet", "Add a folder or open the demo to see the breakdown.")}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <div class="card-title">${icon("hardDrive")} Largest files</div>
              <div class="card-sub">The biggest space consumers in view</div>
            </div>
            <button class="btn sm ghost" data-action="navigate" data-view="files">${icon("arrowRight")} All files</button>
          </div>
          ${biggest.length ? `
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>File</th><th>Category</th><th class="num">Size</th></tr></thead>
              <tbody>
                ${biggest.map((f) => `
                  <tr>
                    <td class="w-name"><button class="name-cell" data-action="preview-file" data-id="${esc(f.id)}" style="text-align:left">
                      <span class="file-ico">${icon(CATEGORIES[f.category].icon)}</span>
                      <span class="file-meta"><span class="file-name">${esc(f.name)}</span><span class="file-path">${esc(f.dir || "Root")}</span></span>
                    </button></td>
                    <td><span class="badge cat-${f.category}">${esc(CATEGORIES[f.category].label)}</span></td>
                    <td class="num" style="font-weight:650">${fmtBytes(f.size)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>` : `<div class="card-body">${miniEmpty("file", "Nothing here yet", "Largest files appear after a scan.")}</div>`}
        </section>
      </div>

      <div class="view-stack">
        <section class="card">
          <div class="card-head">
            <div class="card-title">${icon("database")} Space map</div>
            <span class="pill ${cloudConfigured() ? "ok" : "muted"}">${cloudConfigured() ? "Vault connected" : "Vault offline"}</span>
          </div>
          <div class="card-body">
            <div class="kv">
              <div class="kv-row"><span class="k">On this device (indexed)</span><span class="v">${fmtBytes(size)}</span></div>
              <div class="kv-row"><span class="k">Duplicates, reclaimable</span><span class="v">${dupes.groups ? fmtBytes(dupes.reclaimable) : "Scan needed"}</span></div>
              <div class="kv-row"><span class="k">Free cloud tiers, claimable</span><span class="v">${claimableTotal()} GB</span></div>
              <div class="kv-row"><span class="k">Local browser quota</span><span class="v" id="local-quota">${state.localQuota ? fmtBytes(state.localQuota.quota) : "Detecting…"}</span></div>
              <div class="kv-row"><span class="k">Cloud vault free space</span><span class="v">${cloudConfigured() ? cloudUsageLabel() : "Not set up"}</span></div>
            </div>
            <div class="row wrap" style="margin-top:14px">
              <button class="btn ghost sm" data-action="navigate" data-view="cloud">${icon("cloud")} Find free storage</button>
              ${dupes.groups ? "" : `<button class="btn soft sm" data-action="scan-duplicates">${icon("search")} Scan duplicates</button>`}
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div class="card-title">${icon("sparkles")} Needs a little attention</div>
            <span class="pill muted">${attention.length} ${plural(attention.length, "item", "items")}</span>
          </div>
          <div class="card-body" style="padding-top:6px">
            <div class="kv">
              ${attention.map((a) => `
                <div class="kv-row" style="align-items:center">
                  <span class="row" style="gap:10px">
                    <span class="rule-ico ${a.tone}" style="width:28px;height:28px;border-radius:8px">${icon(a.icon)}</span>
                    <span><span style="color:var(--ink);font-weight:600;display:block;font-size:12px">${esc(a.title)}</span><span class="tiny muted">${esc(a.meta)}</span></span>
                  </span>
                  <button class="icon-btn" data-action="${a.action}" ${a.view ? `data-view="${a.view}"` : ""} aria-label="Open">${icon("chevronRight")}</button>
                </div>`).join("")}
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div class="card-title">${icon("download")} Take it with you</div>
            <span class="pill">Single file</span>
          </div>
          <div class="card-body">
            <p class="small" style="color:var(--ink-2);line-height:1.55">
              Explorchive is one HTML file — no installer, no account. Save it, keep it on a USB stick, and it still opens offline.
            </p>
            <div class="row wrap" style="margin-top:12px">
              <button class="btn primary sm" data-action="download-app">${icon("download")} Download Explorchive.html</button>
              <button class="btn ghost sm" data-action="navigate" data-view="reports">${icon("external")} What's inside</button>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div class="card-title">${icon("zap")} One-click routines</div>
          </div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
            <button class="provider" data-action="navigate" data-view="organize">
              <span class="provider-logo" style="background:linear-gradient(135deg,#55B4F0,#155F94)${""}">${icon("sort")}</span>
              <span class="provider-meta"><span class="provider-name">Auto-organize by type</span><span class="provider-note">Preview first, then move</span></span>
              ${icon("chevronRight")}
            </button>
            <button class="provider" data-action="scan-duplicates">
              <span class="provider-logo" style="background:linear-gradient(135deg,#9C8CFB,#5B49D6)">${icon("duplicates")}</span>
              <span class="provider-meta"><span class="provider-name">Find duplicate copies</span><span class="provider-note">Same name + exact hash</span></span>
              ${icon("chevronRight")}
            </button>
            <button class="provider" data-action="navigate" data-view="cleanup">
              <span class="provider-logo" style="background:linear-gradient(135deg,#F0B04D,#C47A12)">${icon("cleanup")}</span>
              <span class="provider-meta"><span class="provider-name">Clean junk & large files</span><span class="provider-note">Temp files, empty folders</span></span>
              ${icon("chevronRight")}
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>`;
}

function statCard(ico, label, value, foot, iconName, tone) {
  return `
  <section class="card stat">
    <div class="stat-top">
      <span class="stat-label">${esc(label)}</span>
      <span class="stat-ico ${tone}">${icon(iconName)}</span>
    </div>
    <div class="stat-value">${value}</div>
    <div class="stat-foot">${icon("info")}<span>${esc(foot)}</span></div>
  </section>`;
}

function donutSVG(cats, total) {
  const R = 60;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const segments = cats.map((c) => {
    const frac = total ? c.bytes / total : 0;
    const len = Math.max(0, frac * C - 2);
    const seg = `<circle cx="86" cy="86" r="${R}" fill="none" stroke="${CATEGORIES[c.key].color}" stroke-width="19" stroke-linecap="round" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-offset}" opacity=".92"/>`;
    offset += frac * C;
    return seg;
  }).join("");
  return `<svg viewBox="0 0 172 172" role="img" aria-label="Storage by file category">
    <circle cx="86" cy="86" r="${R}" fill="none" stroke="#EFF7FD" stroke-width="19"/>
    ${segments}
  </svg>`;
}

function miniEmpty(ico, title, text) {
  return `<div class="empty" style="padding:26px 12px">
    <div class="empty-art" style="width:54px;height:54px;border-radius:16px">${icon(ico)}</div>
    <h3 style="font-size:13.5px">${esc(title)}</h3>
    <p style="font-size:11.5px">${esc(text)}</p>
  </div>`;
}

function demoBannerHTML() {
  return `<div class="banner info">
    ${icon("sparkles")}
    <div class="b-body">
      <div class="b-title">You're exploring the demo library</div>
      A sample of ${fmtCount(state.files.length)} files across photos, work and backups. Moves are simulated here — add a real folder to work on your own files.
    </div>
    <button class="btn sm ghost" data-action="add-folder">${icon("folderPlus")} Use my folder</button>
    <button class="btn sm ghost" data-action="clear-demo">${icon("x")} Clear</button>
  </div>`;
}

/* ---------------------------- files view ---------------------------- */
function filesViewHTML() {
  const demo = demoActive();
  const list = filteredFiles();
  const f = state.filters;
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / f.pageSize));
  const page = clamp(f.page, 1, pages);
  const start = (page - 1) * f.pageSize;
  const rows = list.slice(start, start + f.pageSize);
  const cats = categoryStats();
  const selectedCount = state.selection.size;
  const selectedBytes = sum(state.files.filter((x) => state.selection.has(x.id)), (x) => x.size);
  const allOnPage = rows.length > 0 && rows.every((r) => state.selection.has(r.id));
  const someOnPage = rows.some((r) => state.selection.has(r.id));

  return `
  <div class="view-stack">
    ${demo ? demoBannerHTML() : ""}
    ${needsPermission().length ? `<div class="banner warn">${icon("alert")}<div class="b-body"><div class="b-title">Permission expired</div>Reconnect your folders to see current files.</div>${needsPermission().map((s) => `<button class="btn sm soft" data-action="reconnect-source" data-id="${esc(s.id)}">Reconnect ${esc(s.name)}</button>`).join("")}</div>` : ""}

    <section class="card">
      <div class="toolbar">
        <div class="search">
          ${icon("search")}
          <input class="input" id="files-query" data-input="files-query" type="search" placeholder="Filter by name or path…" value="${esc(f.query)}" aria-label="Filter files" />
        </div>
        <div class="filter-chips">
          <button class="chip ${f.category === "all" ? "active" : ""}" data-action="filter-category" data-cat="all">All <span class="n">${state.files.length}</span></button>
          ${cats.map((c) => `<button class="chip ${f.category === c.key ? "active" : ""}" data-action="filter-category" data-cat="${c.key}">${esc(CATEGORIES[c.key].label)} <span class="n">${c.count}</span></button>`).join("")}
        </div>
        ${(f.query || f.category !== "all" || f.source !== "all") ? `<button class="btn sm ghost" data-action="clear-filters">${icon("x")} Clear</button>` : ""}
        <div class="row" style="margin-left:auto;gap:6px">
          ${state.sources.length > 1 ? `<select class="select" data-change="filter-source" aria-label="Filter by source" style="width:auto">
            <option value="all">All sources</option>
            ${state.sources.map((s) => `<option value="${esc(s.id)}" ${f.source === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
          </select>` : ""}
          <select class="select" data-change="sort-files" aria-label="Sort files" style="width:auto">
            <option value="size" ${f.sort === "size" ? "selected" : ""}>Largest first</option>
            <option value="mtime" ${f.sort === "mtime" ? "selected" : ""}>Newest first</option>
            <option value="name" ${f.sort === "name" ? "selected" : ""}>Name A–Z</option>
            <option value="category" ${f.sort === "category" ? "selected" : ""}>Category</option>
            <option value="path" ${f.sort === "path" ? "selected" : ""}>Path</option>
          </select>
          <button class="btn sm ghost" data-action="rescan-files" title="Refresh">${icon("refresh")}</button>
        </div>
      </div>

      ${selectedCount ? `
      <div class="bulkbar">
        ${icon("check")}<strong>${fmtCount(selectedCount)} selected</strong>
        <span class="muted">${fmtBytes(selectedBytes)}</span>
        <span class="spacer"></span>
        <button class="btn sm ghost" data-action="download-selected">${icon("download")} Download</button>
        <button class="btn sm danger" data-action="delete-selected">${icon("trash")} Delete</button>
        <button class="btn sm ghost" data-action="clear-selection">${icon("x")} Clear</button>
      </div>` : ""}

      ${rows.length ? `
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="cb"><input type="checkbox" class="checkbox" data-change="select-page" ${allOnPage ? "checked" : ""} ${someOnPage && !allOnPage ? 'data-indeterminate="1"' : ""} aria-label="Select all on page" /></th>
              <th class="sortable ${f.sort === "name" ? "on" : ""}" data-action="sort-files" data-sort="name">Name <span class="sort-ind">${sortIcon(f, "name")}</span></th>
              <th>Category</th>
              <th class="sortable ${f.sort === "size" ? "on" : ""} num" data-action="sort-files" data-sort="size">Size <span class="sort-ind">${sortIcon(f, "size")}</span></th>
              <th class="sortable ${f.sort === "mtime" ? "on" : ""}" data-action="sort-files" data-sort="mtime">Modified <span class="sort-ind">${sortIcon(f, "mtime")}</span></th>
              <th style="width:76px"></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((file) => fileRowHTML(file)).join("")}
          </tbody>
        </table>
      </div>
      <div class="pager">
        <span>Showing <strong>${fmtCount(start + 1)}–${fmtCount(Math.min(start + f.pageSize, total))}</strong> of ${fmtCount(total)} files · ${fmtBytes(sum(list, (x) => x.size))}</span>
        <div class="pager-btns">
          <select class="select" data-change="page-size" aria-label="Rows per page" style="width:auto;padding:5px 28px 5px 9px;font-size:11px">
            <option value="20" ${f.pageSize === 20 ? "selected" : ""}>20 / page</option>
            <option value="40" ${f.pageSize === 40 ? "selected" : ""}>40 / page</option>
            <option value="80" ${f.pageSize === 80 ? "selected" : ""}>80 / page</option>
          </select>
          <button class="pagebtn" data-action="page" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="Previous page">${icon("chevronLeft")}</button>
          <span style="padding:0 5px;color:var(--ink-3)">${page} / ${pages}</span>
          <button class="pagebtn" data-action="page" data-page="${page + 1}" ${page >= pages ? "disabled" : ""} aria-label="Next page">${icon("chevronRight")}</button>
        </div>
      </div>` : `
      <div class="empty">
        <div class="empty-art">${icon(state.files.length ? "search" : "folderPlus")}</div>
        <h3>${state.files.length ? "No files match those filters" : "Your library is waiting"}</h3>
        <p>${state.files.length ? "Try a different search, or clear the filters to see the whole library." : "Pick a folder — Explorchive scans it locally, groups it by type and shows what's taking up space."}</p>
        <div class="row">
          ${state.files.length
            ? `<button class="btn ghost" data-action="clear-filters">${icon("x")} Clear filters</button>`
            : `<button class="btn primary" data-action="add-folder">${icon("folderPlus")} Add a folder</button>
               <button class="btn ghost" data-action="load-demo">${icon("sparkles")} Try the demo</button>`}
        </div>
      </div>`}
    </section>
  </div>`;
}

function sortIcon(f, key) {
  if (f.sort !== key) return icon("chevronDown");
  return `<span style="display:inline-flex;transform:rotate(${f.dir === -1 ? 0 : 180}deg)">${icon("chevronDown")}</span>`;
}

function fileRowHTML(file) {
  const selected = state.selection.has(file.id);
  return `
  <tr class="${selected ? "sel" : ""}" data-file-row="${esc(file.id)}">
    <td class="cb"><input type="checkbox" class="checkbox" data-change="select-file" data-id="${esc(file.id)}" ${selected ? "checked" : ""} aria-label="Select ${esc(file.name)}" /></td>
    <td class="w-name">
      <button class="name-cell" data-action="preview-file" data-id="${esc(file.id)}" style="text-align:left">
        <span class="file-ico">${icon(CATEGORIES[file.category].icon)}</span>
        <span class="file-meta">
          <span class="file-name">${esc(file.name)}</span>
          <span class="file-path">${esc(file.dir || "Root")}${state.sources.length > 1 ? " · " + esc((sourceById(file.rootId) || {}).name || "") : ""}</span>
        </span>
      </button>
    </td>
    <td><span class="badge cat-${file.category}">${esc(CATEGORIES[file.category].label)}</span></td>
    <td class="num" style="font-weight:600">${fmtBytes(file.size)}</td>
    <td class="num" style="color:var(--ink-3);font-size:11.5px">${esc(dateStr(file.mtime))}</td>
    <td class="num">
      <span class="row" style="justify-content:flex-end;gap:0">
        <button class="icon-btn" data-action="preview-file" data-id="${esc(file.id)}" title="Preview" aria-label="Preview">${icon("eye")}</button>
        <button class="icon-btn" data-action="delete-file" data-id="${esc(file.id)}" title="Delete" aria-label="Delete" style="color:var(--ink-4)">${icon("trash")}</button>
      </span>
    </td>
  </tr>`;
}

/* ---------------------------- file drawer ---------------------------- */
async function openFileDrawer(file) {
  if (!file) return;
  closeModal();
  const source = sourceById(file.rootId);
  const root = document.getElementById("modal-root");
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop drawer-bg";
  backdrop.innerHTML = `
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(file.name)}">
      <div class="drawer-head">
        <span class="file-ico" style="width:34px;height:34px">${icon(CATEGORIES[file.category].icon)}</span>
        <div class="grow" style="min-width:0">
          <div style="font-weight:700;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(file.name)}</div>
          <div class="tiny muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(file.path)}</div>
        </div>
        <button class="icon-btn" data-close aria-label="Close preview">${icon("x")}</button>
      </div>
      <div class="drawer-body">
        <div class="preview-box" id="drawer-preview">
          <div class="preview-fallback">${icon("eye")}<span>Loading preview…</span></div>
        </div>
        <div class="kv">
          <div class="kv-row"><span class="k">Category</span><span class="v"><span class="badge cat-${file.category}">${esc(CATEGORIES[file.category].label)}</span></span></div>
          <div class="kv-row"><span class="k">Size</span><span class="v">${fmtBytes(file.size)} <span class="tiny muted">(${fmtCount(file.size)} bytes)</span></span></div>
          <div class="kv-row"><span class="k">Modified</span><span class="v">${esc(dateTimeStr(file.mtime))}</span></div>
          <div class="kv-row"><span class="k">Location</span><span class="v" style="max-width:250px;word-break:break-word">${esc(file.path)}</span></div>
          <div class="kv-row"><span class="k">Source</span><span class="v">${esc(source ? source.name : "Unknown")}${source && source.demo ? ' <span class="pill muted">demo</span>' : ""}</span></div>
          <div class="kv-row"><span class="k">Permissions</span><span class="v">${file.demo ? "Simulated" : file.rawFile ? "Read-only" : "Read + write"}</span></div>
        </div>
        ${file.demo ? `<div class="banner info" style="margin-top:14px">${icon("sparkles")}<div class="b-body">This is a demo file. The preview and download are simulated.</div></div>` : ""}
      </div>
      <div class="drawer-foot">
        <button class="btn primary sm" data-download>${icon("download")} Download</button>
        <button class="btn ghost sm" data-copy>${icon("copy")} Copy path</button>
        <span class="grow"></span>
        <button class="btn danger sm" data-delete>${icon("trash")} Delete</button>
      </div>
    </aside>`;
  root.appendChild(backdrop);

  const close = () => {
    backdrop.remove();
    document.removeEventListener("keydown", onKey);
    if (modalCloser === close) modalCloser = null;
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  modalCloser = close;
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("[data-close]").addEventListener("click", close);
  backdrop.querySelector("[data-copy]").addEventListener("click", async () => {
    const ok = await copyText(file.path);
    toast(ok ? "Path copied" : "Could not copy path", ok ? "ok" : "err");
  });
  backdrop.querySelector("[data-download]").addEventListener("click", () => downloadFileObject(file));
  backdrop.querySelector("[data-delete]").addEventListener("click", async () => {
    const res = await deleteFileObjects([file], { confirm: true });
    if (res.deleted) close();
  });

  const box = backdrop.querySelector("#drawer-preview");
  let objectUrl = null;
  try {
    const data = await previewData(file);
    if (!backdrop.isConnected) { if (data.url) URL.revokeObjectURL(data.url); return; }
    if (data.type === "image") {
      objectUrl = data.url;
      box.innerHTML = `<img alt="Preview of ${esc(file.name)}" src="${data.url}" />`;
    } else if (data.type === "text") {
      box.innerHTML = `<pre>${esc(data.text)}</pre>`;
    } else {
      box.innerHTML = `<div class="preview-fallback">${icon(CATEGORIES[file.category].icon)}<strong style="color:var(--ink-2);font-size:12.5px">${esc(file.name)}</strong><span>${file.demo ? "Demo file — no binary content" : "No inline preview for this format"}<br/>Use Download to open it with your system apps.</span></div>`;
    }
  } catch {
    box.innerHTML = `<div class="preview-fallback">${icon("alert")}<span>Preview unavailable. The folder may need reconnecting.</span></div>`;
  }
  const originalClose = modalCloser;
  if (objectUrl) {
    const revoke = () => URL.revokeObjectURL(objectUrl);
    const observer = new MutationObserver(() => {
      if (!backdrop.isConnected) { revoke(); observer.disconnect(); }
    });
    observer.observe(document.getElementById("modal-root"), { childList: true });
    void originalClose;
  }
}
