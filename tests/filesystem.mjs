#!/usr/bin/env node
/**
 * Explorchive filesystem engine test.
 *
 * Uses an in-memory mock of the File System Access API (a real folder tree is
 * emulated with the same methods the browser exposes) to exercise scanning,
 * folder creation, moving files, name-conflict renaming, undo and deletion.
 *
 *   npm run test:fs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "Explorchive.html"), "utf8");

/* ----------------------------- mock filesystem ----------------------------- */
class MockFileHandle {
  constructor(name, parent, size = 1024, lastModified = Date.now()) {
    this.kind = "file";
    this.name = name;
    this.parent = parent;
    this.size = size;
    this.lastModified = lastModified;
  }
  async getFile() {
    const self = this;
    return {
      name: this.name,
      size: this.size,
      lastModified: this.lastModified,
      type: "",
      async text() { return "mock:" + self.name; },
      slice(start = 0, end = self.size) { return { size: Math.max(0, end - start), arrayBuffer: async () => new ArrayBuffer(0) }; },
    };
  }
  async move(destDir, newName) {
    if (newName && destDir.files.has(newName.toLowerCase())) throw new Error("exists");
    this.parent.files.delete(this.name.toLowerCase());
    const target = newName || this.name;
    this.parent = destDir;
    this.name = target;
    destDir.files.set(target.toLowerCase(), this);
  }
}

class MockWritable {
  constructor(handle) { this.handle = handle; this.chunks = []; }
  async write(chunk) { this.chunks.push(chunk && chunk.size || 0); }
  async close() { this.handle.size = this.chunks.reduce((a, b) => a + b, 0) || 1; }
  async abort() {}
}

class MockDirHandle {
  constructor(name, parent = null) {
    this.kind = "directory";
    this.name = name;
    this.parent = parent;
    this.files = new Map();
    this.dirs = new Map();
  }
  async queryPermission() { return "granted"; }
  async requestPermission() { return "granted"; }
  async *entries() {
    for (const dir of this.dirs.values()) yield [dir.name, dir];
    for (const file of this.files.values()) yield [file.name, file];
  }
  async getFileHandle(name, opts = {}) {
    const existing = this.files.get(name.toLowerCase());
    if (existing) return existing;
    if (!opts.create) throw new DOMException("NotFound", "NotFoundError");
    const handle = new MockFileHandle(name, this);
    this.files.set(name.toLowerCase(), handle);
    return handle;
  }
  async getDirectoryHandle(name, opts = {}) {
    const existing = this.dirs.get(name.toLowerCase());
    if (existing) return existing;
    if (!opts.create) throw new DOMException("NotFound", "NotFoundError");
    const dir = new MockDirHandle(name, this);
    this.dirs.set(name.toLowerCase(), dir);
    return dir;
  }
  async removeEntry(name) {
    const key = name.toLowerCase();
    if (!this.files.delete(key) && !this.dirs.delete(key)) throw new DOMException("NotFound", "NotFoundError");
  }
  createWritableFor(handle) { return new MockWritable(handle); }
}

function buildTree() {
  const rootDir = new MockDirHandle("MockLibrary");
  const add = (dir, name, mb) => {
    const file = new MockFileHandle(name, dir, Math.round(mb * 1024 * 1024));
    dir.files.set(name.toLowerCase(), file);
  };
  const mk = (dir, name) => {
    const d = new MockDirHandle(name, dir);
    dir.dirs.set(name.toLowerCase(), d);
    return d;
  };
  add(rootDir, "loose-photo.jpg", 3);
  add(rootDir, "loose-report.pdf", 0.4);
  add(rootDir, "loose-song.mp3", 6);
  add(rootDir, "loose.zip", 150);

  const photos = mk(rootDir, "Photos");
  add(photos, "beach.jpg", 2);
  add(photos, "beach-copy.jpg", 2);

  const work = mk(rootDir, "Work");
  add(work, "beach.jpg", 2);
  const invoices = mk(work, "Invoices");
  add(invoices, "invoice-01.pdf", 0.2);
  add(invoices, "invoice-02.pdf", 0.2);

  const empty = mk(rootDir, "Empty Folder");
  void empty;

  const docs = mk(rootDir, "Documents");
  add(docs, "Thumbs.db", 0.04);
  add(docs, "notes.tmp", 1);
  return rootDir;
}

/* ------------------------------- harness ------------------------------- */
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (err) => {
  if (/scrollTo|scrollIntoView|Not implemented/.test(err.message)) return;
  errors.push("jsdom: " + err.message);
});

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/Explorchive.html",
  virtualConsole,
  beforeParse(window) {
    window.indexedDB = undefined;
    window.addEventListener("error", (e) => errors.push("window.error: " + (e.error?.stack || e.message)));
    window.addEventListener("unhandledrejection", (e) => errors.push("unhandled: " + (e.reason?.stack || e.reason)));
  },
});

const { window } = dom;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name + (detail ? " — " + detail : "")); }
}

async function run() {
  await wait(400);
  const api = window.Explorchive;
  const I = api.internals;
  const state = api.state;
  check("internals exposed", !!(I && I.addSource && state));

  // start from a clean slate: drop demo, add the mock folder
  state.sources = [];
  state.files = [];
  state.folders = [];
  state.settings.demoHidden = true;

  const tree = buildTree();
  console.log("\nScanning a mock folder");
  await I.addSource(tree);
  await wait(120);

  const source = state.sources[0];
  check("source registered", !!source && source.name === "MockLibrary");
  check("files scanned recursively", state.files.length === 11, `${state.files.length}`);
  check("folders discovered", state.folders.length === 5, `${state.folders.length}`);
  check("nested dir recorded", state.folders.some((f) => f.path === "Work/Invoices"));
  check("categories assigned", state.files.filter((f) => f.category === "image").length === 4, `${state.files.filter((f) => f.category === "image").length}`);
  check("junk detected", state.files.filter((f) => I.isJunk(f.name)).length === 2);
  check("empty folders detected", I.emptyFolders().some((f) => f.path === "Empty Folder"));
  check("sizes parsed", state.files.find((f) => f.name === "loose.zip")?.size === 150 * 1024 * 1024, `${state.files.find((f) => f.name === "loose.zip")?.size}`);

  console.log("\nOrganize plan (by type, whole library)");
  state.organize.scheme = "type";
  state.organize.includeSubfolders = true;
  const plan = I.buildOrganizePlan();
  check("plan covers every file", plan.length === 11, `${plan.length}`);
  check("images target Images/", plan.filter((p) => p.category === "image").every((p) => p.destDir === "Images"));
  check("same-name conflict gets a unique target", plan.some((p) => p.renamed && p.newName === "beach (2).jpg"), JSON.stringify(plan.filter((p) => /beach/.test(p.newName)).map((p) => p.newName)));
  check("no file moves onto itself", plan.every((p) => p.destPath !== p.srcPath));

  state.organize.plan = plan;
  state.organize.total = plan.length;
  await I.applyOrganizePlan();
  await wait(200);

  check("plan cleared after apply", state.organize.plan === null);
  check("all moves recorded for undo", state.organize.undo?.ops.length === 11, `${state.organize.undo?.ops.length}`);
  check("root now has Images/", tree.dirs.has("images"));
  check("Images folder holds images", tree.dirs.get("images")?.files.size === 4, `${tree.dirs.get("images")?.files.size}`);
  check("Documents folder holds pdf", tree.dirs.get("documents")?.files.size === 3, `${tree.dirs.get("documents")?.files.size}`);
  check("Archives folder holds zip", tree.dirs.get("archives")?.files.size === 1);
  check("duplicate basenames kept apart", tree.dirs.get("images")?.files.has("beach (2).jpg") === true, [...(tree.dirs.get("images")?.files.keys() || [])].join(","));
  check("original nested files moved out", tree.dirs.get("photos")?.files.size === 0 && tree.dirs.get("work")?.files.size === 0);

  console.log("\nUndo");
  await I.undoOrganize();
  await wait(150);
  check("undo restored root files", tree.files.has("loose-photo.jpg"), [...tree.files.keys()].join(","));
  check("undo cleared history", state.organize.undo === null);

  console.log("\nDeletion");
  const tmp = state.files.find((f) => f.ext === "tmp");
  const res = await I.deleteFileObjects([tmp], { confirm: false });
  await wait(80);
  check("file deleted from disk", res.deleted === 1 && !tree.dirs.get("documents")?.files.has("notes.tmp"));
  check("file removed from index", !state.files.some((f) => f.id === tmp.id));

  const beforeEmpty = I.emptyFolders().length;
  await I.deleteEmptyFolders({ confirm: false });
  await wait(120);
  check("empty folders pruned", I.emptyFolders().length < beforeEmpty, `${beforeEmpty} → ${I.emptyFolders().length}`);

  console.log("\nAutopilot");
  state.settings.autopilot = { enabled: true, scheme: "year", includeSubfolders: true };
  state.organize.scheme = "type";
  state.organize.includeSubfolders = false;
  const ui = window.Explorchive.internals;
  await ui.scanAll({ quiet: true });
  await wait(400);
  const yearDir = [...tree.dirs.keys()].find((k) => /^20\d\d$/.test(k));
  check("autopilot applied the chosen scheme", !!yearDir, [...tree.dirs.keys()].join(","));
  check("autopilot recorded an undo step", !!state.organize.undo);
  await I.undoOrganize();
  await wait(200);
  state.settings.autopilot = { enabled: false, scheme: "type", includeSubfolders: false };

  console.log("\nDuplicates (fast mode)");
  state.files.forEach((f) => {
    if (f.demo) f.demo = false;
  });
  await I.scanDuplicates();
  await wait(300);
  check("duplicate scan completes", state.dupes.groups !== null);
  check("finds the same-name/same-size pair", state.dupes.groups.length === 1, `${state.dupes.groups.length}`);
  const group = state.dupes.groups[0] || { files: [] };
  check("group keeps two copies", group.files.length === 2 && group.files.every((f) => f.name === "beach.jpg"), JSON.stringify(group.files.map((f) => f.path)));
  check("reclaimable equals one copy", group.wasted === 2 * 1024 * 1024, `${group.wasted}`);

  console.log("\nCleanup buckets");
  const buckets = I.cleanupBuckets();
  check("large files bucket", buckets.large.files.length >= 1, `${buckets.large.files.length}`);
  check("junk bucket", buckets.junk.files.length >= 1);
  check("old bucket present", Array.isArray(buckets.old.files));

  console.log("\nFormatting helpers");
  check("fmtBytes MB", I.fmtBytes(5 * 1024 * 1024) === "5 MB", I.fmtBytes(5 * 1024 * 1024));
  check("fmtBytes GB", /GB/.test(I.fmtBytes(3 * 1024 ** 3)));
  check("extOf", I.extOf("Photo.JPG") === "jpg");
  check("categoryOf", I.categoryOf("clip.mov") === "video");

  await wait(100);
  check("no runtime errors", errors.length === 0, errors.slice(0, 4).join(" | "));

  console.log(`\n${passed} passed, ${failed} failed`);
  window.close();
  process.exitCode = failed ? 1 : 0;
}

run().catch((err) => {
  console.error("\nFilesystem test crashed:", err);
  process.exitCode = 1;
});
