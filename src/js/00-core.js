/* ============================================================
   Explorchive — core: constants, state, utils, UI primitives
   ============================================================ */
const APP_VERSION = "1.0.0";
const LS_KEY = "explorchive.settings.v1";
const DB_NAME = "explorchive.handles";
const DB_STORE = "sources";

/* ---------------------------- icons ---------------------------- */
const ICON_PATHS = {
  dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  files: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  sort: '<path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
  duplicates: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  cleanup: '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 0 0 .6-9 6 6 0 0 0-11.7-1.4A4 4 0 0 0 6.5 19Z"/>',
  report: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 17v-3M12 17v-6M15 17v-2"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.1.37.5.64.9.64H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  folderPlus: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M12 11.5v5M9.5 14h5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>',
  alert: '<path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  hardDrive: '<path d="M21 12H3"/><path d="M5 5h14a2 2 0 0 1 1.8 1.1L23 12v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-5l2.2-5.9A2 2 0 0 1 5 5Z"/><path d="M7 16h.01M11 16h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkles: '<path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z"/><path d="m19 15 .6 1.7 1.7.6-1.7.6L19 20l-.6-1.6-1.7-.6 1.7-.6Z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4Z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  fileText: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  archive: '<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
  type: '<path d="M4 6V4h16v2M12 4v16M9 20h6"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  zap: '<path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  move: '<path d="M12 3v18"/><path d="m8 7 4-4 4 4M8 17l4 4 4-4"/><path d="M3 12h18"/><path d="m7 8-4 4 4 4M17 8l4 4-4 4"/>',
  play: '<path d="M6 4v16l14-8Z"/>',
};

function icon(name, cls = "") {
  const paths = ICON_PATHS[name] || ICON_PATHS.file;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cls ? ` class="${cls}"` : ""}>${paths}</svg>`;
}

const LOGO_SVG = `<svg viewBox="0 0 64 64" role="img" aria-label="Explorchive logo"><defs><linearGradient id="lgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7DCDFF"/><stop offset=".55" stop-color="#3D9ADE"/><stop offset="1" stop-color="#155F94"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#lgA)"/><circle cx="47" cy="16" r="6.5" fill="#FFFFFF" opacity=".55"/><path d="M9 25a4 4 0 0 1 4-4h9.2l2.6 3.4H51a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4V25Z" fill="#FFFFFF"/><path d="M9 31.5h46" stroke="#CDE8FA" stroke-width="1.4"/><g fill="none" stroke="#1D7CBE" stroke-linecap="round" stroke-width="2.2"><path d="M32 50V29"/><path d="M27 50 32 29l5 21"/><path d="M28.4 44h7.2M29.6 37.5h4.8M30.8 33h2.4"/><path d="M32 29V24"/></g><circle cx="32" cy="23" r="1.9" fill="#F7768E"/></svg>`;

const HERO_SKYLINE = `<svg viewBox="0 0 720 200" fill="none" aria-hidden="true">
  <circle cx="596" cy="54" r="34" fill="#FFFFFF" opacity=".7"/>
  <g fill="#CFE8FA" opacity=".6">
    <rect x="120" y="96" width="58" height="104" rx="4"/><rect x="184" y="118" width="42" height="82" rx="3"/>
    <rect x="232" y="86" width="66" height="114" rx="4"/><rect x="304" y="128" width="34" height="72" rx="3"/>
    <rect x="344" y="106" width="52" height="94" rx="4"/><rect x="402" y="136" width="40" height="64" rx="3"/>
    <rect x="448" y="112" width="58" height="88" rx="4"/><rect x="512" y="142" width="46" height="58" rx="3"/>
    <rect x="564" y="120" width="62" height="80" rx="4"/><rect x="632" y="146" width="52" height="54" rx="3"/>
  </g>
  <g fill="#B5DCF6" opacity=".75">
    <rect x="146" y="76" width="34" height="124" rx="3"/><rect x="256" y="62" width="44" height="138" rx="4"/>
    <rect x="332" y="150" width="26" height="50" rx="2"/><rect x="368" y="86" width="34" height="114" rx="3"/>
    <rect x="456" y="70" width="38" height="130" rx="3"/><rect x="582" y="98" width="40" height="102" rx="3"/>
  </g>
  <g stroke="#7FBCE6" stroke-width="3" stroke-linecap="round">
    <path d="M292 200 306 76l14 124"/>
    <path d="M297 152h18M300 128h12M303 102h6"/>
    <path d="M306 76V62M306 62l-8 7M306 62l8 7"/>
  </g>
  <circle cx="306" cy="58" r="3" fill="#F7768E"/>
  <g stroke="#A4D2F0" stroke-width="1.5" stroke-dasharray="2 6" opacity=".7"><path d="M70 190h580"/></g>
  <g fill="#FFFFFF" opacity=".8"><ellipse cx="450" cy="42" rx="30" ry="8"/><ellipse cx="482" cy="36" rx="20" ry="7"/></g>
</svg>`;

/* ---------------------------- categories ---------------------------- */
const CATEGORIES = {
  image:    { label: "Images",    folder: "Images",    color: "#1D7CBE", icon: "image" },
  video:    { label: "Video",     folder: "Video",     color: "#7C6BF5", icon: "video" },
  audio:    { label: "Audio",     folder: "Audio",     color: "#0FA3A3", icon: "music" },
  document: { label: "Documents", folder: "Documents", color: "#4A72D8", icon: "fileText" },
  archive:  { label: "Archives",  folder: "Archives",  color: "#D99A1E", icon: "archive" },
  code:     { label: "Code",      folder: "Code",      color: "#5A9333", icon: "code" },
  font:     { label: "Fonts",     folder: "Fonts",     color: "#D6537A", icon: "type" },
  other:    { label: "Other",     folder: "Other",     color: "#7C93A8", icon: "file" },
};

const EXT_MAP = {};
function mapExts(cat, exts) { exts.split(" ").forEach((e) => { EXT_MAP[e] = cat; }); }
mapExts("image", "jpg jpeg png gif webp svg heic heif bmp tiff tif avif ico raw cr2 nef arw dng psd");
mapExts("video", "mp4 mov mkv avi webm m4v wmv flv mpeg mpg 3gp ogv");
mapExts("audio", "mp3 wav flac aac ogg m4a wma aiff aif opus mid midi");
mapExts("document", "pdf doc docx txt rtf md odt pages xls xlsx csv numbers ppt pptx key epub tex");
mapExts("archive", "zip rar 7z tar gz bz2 xz iso dmg tgz cab lz lzma zst");
mapExts("code", "js mjs cjs ts tsx jsx html htm css scss sass less json py rb php java c cpp h hpp sh bash zsh sql go rs swift kt kts yml yaml xml toml ini env vue svelte astro");
mapExts("font", "ttf otf woff woff2 eot");

const JUNK_NAMES = new Set(["thumbs.db", "desktop.ini", ".ds_store", "ehthumbs.db"]);
const JUNK_PREFIXES = ["~$", ".~lock."];
const JUNK_EXTS = new Set(["tmp", "temp", "part", "crdownload", "download", "partial"]);

const FREE_TIERS = [
  { name: "Google Drive", gb: 15, note: "with a Google account", url: "https://drive.google.com", color: "#1A73E8", short: "G" },
  { name: "OneDrive", gb: 5, note: "Microsoft account", url: "https://onedrive.live.com", color: "#0F6CBD", short: "O" },
  { name: "Dropbox", gb: 2, note: "Dropbox Basic", url: "https://www.dropbox.com/plans", color: "#0061FF", short: "D" },
  { name: "iCloud Drive", gb: 5, note: "Apple ID", url: "https://www.icloud.com", color: "#3693F3", short: "i" },
  { name: "MEGA", gb: 20, note: "MEGA Free", url: "https://mega.nz", color: "#D9272E", short: "M" },
  { name: "pCloud", gb: 10, note: "free account", url: "https://www.pcloud.com", color: "#18A2E1", short: "p" },
  { name: "Box", gb: 10, note: "Personal plan", url: "https://www.box.com/pricing", color: "#0061D5", short: "B" },
  { name: "Backblaze B2", gb: 10, note: "10 GB free", url: "https://www.backblaze.com/cloud-storage", color: "#E21E29", short: "B2" },
  { name: "Cloudflare R2", gb: 10, note: "free tier / month", url: "https://developers.cloudflare.com/r2/", color: "#F6821F", short: "R2" },
  { name: "Supabase", gb: 1, note: "free storage", url: "https://supabase.com/pricing", color: "#3ECF8E", short: "S" },
];

/* ---------------------------- utilities ---------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function fmtBytes(bytes, decimals) {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes < 1024) return Math.round(bytes) + " B";
  const units = ["KB", "MB", "GB", "TB", "PB"];
  let i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)) - 1, units.length - 1);
  const value = bytes / Math.pow(1024, i + 1);
  const d = decimals != null ? decimals : value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return value.toFixed(d).replace(/\.0+$/, "") + " " + units[i];
}

function fmtCount(n) { return new Intl.NumberFormat().format(n || 0); }

function dateStr(ts) {
  if (!ts) return "—";
  try { return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(ts)); }
  catch { return new Date(ts).toLocaleDateString(); }
}

function dateTimeStr(ts) {
  if (!ts) return "—";
  try { return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(ts)); }
  catch { return new Date(ts).toLocaleString(); }
}

function timeAgo(ts) {
  if (!ts) return "unknown";
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return days + " days ago";
  if (days < 365) {
    const m = Math.round(days / 30);
    return m + (m === 1 ? " month ago" : " months ago");
  }
  const y = Math.floor(days / 365);
  return y + (y === 1 ? " year ago" : " years ago");
}

function extOf(name) {
  const clean = name.toLowerCase();
  if (clean === ".ds_store") return "ds_store";
  const idx = clean.lastIndexOf(".");
  return idx > 0 ? clean.slice(idx + 1) : "";
}

function categoryOf(name) { return EXT_MAP[extOf(name)] || "other"; }

function isJunk(name) {
  const lower = name.toLowerCase();
  if (JUNK_NAMES.has(lower)) return true;
  if (JUNK_PREFIXES.some((p) => lower.startsWith(p))) return true;
  return JUNK_EXTS.has(extOf(name));
}

function isHidden(name) { return name.startsWith(".") && name !== ".DS_Store"; }

function dirOfPath(path) {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? "" : path.slice(0, idx);
}

function baseOfPath(path) {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? path : path.slice(idx + 1);
}

function debounce(fn, wait) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
}

function sum(arr, fn = (x) => x) { return arr.reduce((acc, x) => acc + (fn(x) || 0), 0); }

function sortBy(arr, fn) { return arr.slice().sort((a, b) => fn(a) - fn(b)); }

function pct(part, total) { return total ? clamp((part / total) * 100, 0, 100) : 0; }

function plural(n, one, many) { return n === 1 ? one : many; }

function saveBlob(blob, filename) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch { return false; }
  }
}

function debounceNav(view) { location.hash = "#/" + view; }

/* ---------------------------- settings ---------------------------- */
const DEFAULT_SETTINGS = {
  cloud: null,            // { url, key, bucket, quotaGB }
  claimed: [],            // provider names marked as claimed
  demoHidden: false,
  lastScan: null,
  onboarded: false,
  autopilot: { enabled: false, scheme: "type", includeSubfolders: false },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

function saveSettings(patch = {}) {
  Object.assign(state.settings, patch);
  try { localStorage.setItem(LS_KEY, JSON.stringify(state.settings)); } catch {}
}

/* ---------------------------- state ---------------------------- */
const state = {
  view: "dashboard",
  settings: loadSettings(),
  sources: [],
  files: [],
  folders: [],
  scannedAt: null,
  scanning: false,
  scan: { active: false, count: 0, current: "", root: "" },
  restoring: false,
  selection: new Set(),
  filters: { query: "", category: "all", source: "all", sort: "size", dir: -1, page: 1, pageSize: 40 },
  dupes: { groups: null, reclaimable: 0, busy: false, strict: false, scannedAt: null },
  cleanupSelection: new Set(),
  organize: { scheme: "type", includeSubfolders: false, plan: null, busy: false, progress: 0, total: 0, undo: null, error: null },
  cloud: { status: "idle", error: "", buckets: [], usage: null, quotaGB: 1, busy: false, upload: null, objects: null, lastUpload: null },
  uploadSelection: new Set(),
  freeTiersOpen: true,
  hashBusy: false,
};

/* ---------------------------- IDB sources ---------------------------- */
function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("no-idb"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbAllSources() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch { return []; }
}

async function idbSaveSource(source) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put({ id: source.id, name: source.name, addedAt: Date.now(), handle: source.handle });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

async function idbDeleteSource(id) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

/* ---------------------------- demo library ---------------------------- */
function demoFilesRaw(now) {
  const D = 86400000;
  const rows = [
    ["Photos/Tokyo 2024/Tokyo-Tower-night.jpg", 8.4, 420],
    ["Photos/Tokyo 2024/Shibuya-crossing.jpg", 6.1, 420],
    ["Photos/Tokyo 2024/Shinjuku-skyline.jpg", 7.8, 419],
    ["Photos/Tokyo 2024/IMG_2041.JPG", 6.84, 415],
    ["Photos/Tokyo 2024/IMG_2042.JPG", 5.2, 415],
    ["Photos/Tokyo 2024/Ramen-Shop.jpg", 4.4, 414],
    ["Photos/Tokyo 2024/Tokyo-2024-03-12-01.jpg", 9.1, 412],
    ["Photos/Tokyo 2025/IMG_7781.HEIC", 3.9, 120],
    ["Photos/Tokyo 2025/Skytree-sunset.jpg", 11.2, 118],
    ["Photos/Tokyo 2025/Ueno-park.jpg", 5.8, 117],
    ["Photos/Tokyo 2025/Tsukiji-breakfast.jpg", 4.6, 116],
    ["Photos/Family/Abuela-cumpleanos.jpg", 4.1, 330],
    ["Photos/Family/Lake-Atitlan-2023.jpg", 7.3, 700],
    ["Photos/Family/Sunday-lunch.jpg", 3.4, 60],
    ["Photos/Family/Family-video.mp4", 412, 210],
    ["Work/Client Aurora/Aurora-invoice-0003.pdf", 0.212, 40],
    ["Work/Client Aurora/Aurora-brief.docx", 1.8, 75],
    ["Work/Client Aurora/Aurora-logo-final.png", 2.4, 90],
    ["Work/Client Aurora/backup/Aurora-logo-final.png", 2.4, 90],
    ["Work/Client Aurora/Aurora-brand-guidelines.pdf", 6.2, 88],
    ["Work/Invoices/Invoice-2024-03.pdf", 0.184, 590],
    ["Work/Invoices/Invoice-2024-04.pdf", 0.191, 560],
    ["Work/Invoices/Invoice-2024-05.pdf", 0.188, 530],
    ["Work/Invoices/Invoice-2024-03-copy.pdf", 0.184, 590],
    ["Projects/Explorchive/index.html", 0.024, 2],
    ["Projects/Explorchive/app.js", 0.186, 2],
    ["Projects/Explorchive/README.md", 0.008, 2],
    ["Projects/Explorchive/hero.png", 1.6, 4],
    ["Projects/Explorchive/package-lock.json", 0.64, 2],
    ["Projects/Website/index.html", 0.018, 190],
    ["Projects/Website/style.css", 0.042, 190],
    ["Projects/Website/script.js", 0.096, 190],
    ["Projects/Website/fonts/Inter.woff2", 0.34, 190],
    ["Downloads/IMG_2041.JPG", 6.84, 300],
    ["Downloads/Screenshot 2025-02-11.png", 1.8, 250],
    ["Downloads/setup.exe", 84, 480],
    ["Downloads/ubuntu-24.04.iso", 5324.8, 210],
    ["Downloads/random.tmp", 1.2, 30],
    ["Downloads/.DS_Store", 0.008, 1],
    ["Downloads/Thumbs.db", 0.042, 45],
    ["Downloads/archive.zip", 1433.6, 720],
    ["Downloads/invoice.pdf", 0.18, 580],
    ["Music/Tokyo-Dreams.mp3", 9.8, 380],
    ["Music/Christmas-Mr-Lawrence.flac", 42.7, 900],
    ["Music/Lofi-beats-vol1.zip", 380, 600],
    ["Music/Midnight-City.mp3", 8.6, 700],
    ["Videos/Tokyo-timelapse-4K.mp4", 2457.6, 160],
    ["Videos/Family-video.mp4", 412, 210],
    ["Videos/drone-shot.mov", 890.4, 300],
    ["Documents/CV-2025.pdf", 0.32, 20],
    ["Documents/Passport-scan.jpg", 1.2, 410],
    ["Documents/Budget-2025.xlsx", 0.088, 14],
    ["Documents/Tax-return-2023.pdf", 2.1, 640],
    ["Documents/Notes.txt", 0.004, 3],
    ["Documents/~$Budget-2025.xlsx", 0.000165, 12],
    ["Documents/Old/2019-notes.txt", 0.012, 2100],
    ["Backups/2023/Backup-2023.zip", 4198.4, 800],
    ["Backups/2023/phone-backup.tar.gz", 1843.2, 760],
    ["Archive/Old projects/Portfolio-2019.zip", 655.36, 1200],
    ["Archive/Old projects/thesis-final-FINAL.docx", 12.4, 1100],
    ["Archive/Old projects/old-export.csv", 44.8, 400],
    ["Desktop/Screenshot 2025-02-11.png", 1.8, 250],
    ["Desktop/Screenshot 2025-03-01.png", 2.2, 240],
    ["Desktop/todo.txt", 0.002, 5],
    ["Desktop/temp-render.tmp", 220, 2],
    ["Tokyo-trip-cover.jpg", 7.2, 100],
    ["Budget-2026.xlsx", 0.07, 8],
    ["Meeting-notes.txt", 0.003, 2],
    ["Video-export.mp4", 240, 40],
    ["Backup-old.zip", 620, 900],
    ["Portrait.png", 3.1, 70],
  ];
  return rows.map(([path, mb, days]) => ({
    id: "demo:" + path,
    rootId: "demo",
    demo: true,
    path,
    dir: dirOfPath(path),
    name: baseOfPath(path),
    ext: extOf(path),
    size: Math.round(mb * 1024 * 1024) || 1024,
    mtime: now - days * D,
    category: categoryOf(path),
    handle: null,
    parentHandle: null,
  }));
}

const DEMO_FILE_COUNT = demoFilesRaw(Date.now()).length;

function loadDemo() {
  const now = Date.now();
  state.sources = [{ id: "demo", name: "Demo Library", demo: true, writable: true, status: "ready", addedAt: now, handle: null }];
  state.files = demoFilesRaw(now);
  const folderSet = new Set();
  state.files.forEach((f) => {
    let dir = f.dir;
    while (dir) { folderSet.add(dir); dir = dirOfPath(dir); }
  });
  folderSet.add("Archive/Empty 2022");
  state.folders = Array.from(folderSet).sort().map((path) => ({
    path, name: baseOfPath(path), depth: path.split("/").length,
    rootId: "demo", demo: true, handle: null, parentHandle: null,
  }));
  state.scannedAt = now;
  state.filters.page = 1;
  state.selection.clear();
  state.dupes = { groups: null, reclaimable: 0, busy: false, strict: false, scannedAt: null };
  state.organize = { scheme: state.organize.scheme, includeSubfolders: false, plan: null, busy: false, progress: 0, total: 0, undo: null, error: null };
  state.sourcesDemo = true;
}

function resetDemo() { loadDemo(); render(); toast("Demo library reset", "info"); }

/* ---------------------------- toasts & modal ---------------------------- */
let toastTimer = 0;
function toast(message, type = "info", title = "") {
  const root = $("#toasts");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast " + (type === "ok" ? "ok" : type === "err" ? "err" : "");
  const ico = type === "ok" ? "check" : type === "err" ? "alert" : "info";
  el.innerHTML = `${icon(ico)}<div>${title ? `<strong>${esc(title)}</strong>` : ""}<span>${esc(message)}</span></div>`;
  root.appendChild(el);
  const remove = () => { el.classList.add("out"); setTimeout(() => el.remove(), 220); };
  const t = setTimeout(remove, type === "err" ? 6200 : 3800);
  el.addEventListener("click", () => { clearTimeout(t); remove(); });
  if (root.children.length > 4) root.firstElementChild.remove();
}

let modalCloser = null;
function openModal({ title, sub, iconName = "info", iconTone = "", body = "", actions = [], wide = false, onMount, onClose }) {
  closeModal();
  const root = $("#modal-root");
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head">
        <div class="modal-ico ${iconTone}">${icon(iconName)}</div>
        <div class="mh-main">
          <h2 class="modal-title">${esc(title)}</h2>
          ${sub ? `<div class="modal-sub">${esc(sub)}</div>` : ""}
        </div>
        <button class="icon-btn modal-close" aria-label="Close">${icon("x")}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${actions.length ? `<div class="modal-foot"></div>` : ""}
    </div>`;
  root.appendChild(backdrop);
  const foot = $(".modal-foot", backdrop);
  const close = () => {
    if (!backdrop.isConnected) return;
    backdrop.remove();
    document.removeEventListener("keydown", onKey);
    if (!modalCloser || modalCloser === close) modalCloser = null;
    onClose && onClose();
  };
  actions.forEach((a) => {
    if (!foot) return;
    const btn = document.createElement("button");
    btn.className = "btn " + (a.cls || "ghost");
    btn.innerHTML = (a.icon ? icon(a.icon) : "") + `<span>${esc(a.label)}</span>`;
    if (a.disabled) btn.disabled = true;
    btn.addEventListener("click", () => { a.onClick ? a.onClick(close) : close(); });
    foot.appendChild(btn);
  });
  $(".modal-close", backdrop).addEventListener("click", close);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop && !backdrop.dataset.locked) close(); });
  function onKey(e) { if (e.key === "Escape") close(); }
  document.addEventListener("keydown", onKey);
  modalCloser = close;
  const focusTarget = $("button", foot) || $(".modal-close", backdrop);
  focusTarget && focusTarget.focus({ preventScroll: true });
  if (onMount) onMount(backdrop, close);
  return close;
}

function closeModal() {
  if (modalCloser) { const fn = modalCloser; modalCloser = null; fn(); }
  const root = $("#modal-root");
  if (root) root.innerHTML = "";
}

function confirmModal({ title, message, confirmLabel = "Confirm", tone = "primary", iconName = "alert" }) {
  return new Promise((resolve) => {
    let done = false;
    openModal({
      title,
      iconName,
      iconTone: tone === "danger" ? "danger" : "",
      body: `<p style="font-size:12.5px;line-height:1.6;color:var(--ink-2)">${message}</p>`,
      actions: [
        { label: "Cancel", onClick: (close) => { done = true; resolve(false); close(); } },
        { label: confirmLabel, cls: tone === "danger" ? "danger" : "primary", onClick: (close) => { done = true; resolve(true); close(); } },
      ],
      onClose: () => { if (!done) resolve(false); },
    });
  });
}
