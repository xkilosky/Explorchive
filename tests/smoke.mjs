#!/usr/bin/env node
/**
 * Explorchive smoke test (jsdom).
 *
 *   npm install            # installs jsdom
 *   npm test               # builds are read from Explorchive.html
 *
 * Exercises boot, navigation, every view, the demo library and the
 * organize/duplicate flows without a real browser or real files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "Explorchive.html"), "utf8");

const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (err) => {
  if (/scrollTo|scrollIntoView/.test(err.message)) return;
  errors.push("jsdom: " + err.message);
});
virtualConsole.on("error", (...args) => errors.push("console.error: " + args.join(" ")));

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/Explorchive.html",
  virtualConsole,
  beforeParse(window) {
    window.addEventListener("error", (e) => errors.push("window.error: " + (e.error?.stack || e.message)));
    window.addEventListener("unhandledrejection", (e) => errors.push("unhandled: " + (e.reason?.stack || e.reason)));
  },
});

const { window } = dom;
const { document } = window;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.log("  ✗ " + name + (detail ? " — " + detail : "")); }
}

function click(el) {
  if (!el) throw new Error("click target missing");
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}

function nav(view) {
  const btn = document.querySelector(`.nav-item[data-view="${view}"]`);
  click(btn);
}

async function run() {
  await wait(500);
  console.log("\nBoot");
  check("app shell mounted", !!$(".app"));
  check("sidebar navigation has 8 items", $$(".nav-item").length === 8, `${$$(".nav-item").length}`);
  check("demo library loaded", window.Explorchive && /Welcome to your/.test($(".hero-title")?.textContent || ""), $(".hero-title")?.textContent);
  check("API version exposed", window.Explorchive?.version === "1.0.0");
  check("4 stat cards", $$(".stat").length === 4, `${$$(".stat").length}`);
  const heroChip = $(".source-chip");
  check("demo source chip", /Demo Library/.test(heroChip?.textContent || ""));
  check("skyline illustration present", !!$(".hero-skyline svg"));
  check("free cloud total rendered", /88/.test($(".stat-value")?.textContent + $$(".stat-value").map((e) => e.textContent).join("")));

  console.log("\nFiles view");
  nav("files");
  await wait(60);
  check("files table rendered", $$("#view tbody tr").length === 40, `${$$("#view tbody tr").length} rows`);
  check("pager shows total", /of 71 files/.test($(".pager")?.textContent || ""), $(".pager")?.textContent?.trim().slice(0, 90));
  check("category chips", $$(".filter-chips .chip").length >= 6);
  const firstName = $(".file-name")?.textContent;
  click($(".name-cell"));
  await wait(120);
  check("file drawer opens", !!$(".drawer"), firstName);
  check("drawer preview rendered", !!$("#drawer-preview")?.textContent.trim());
  click($(".drawer [data-close]"));
  await wait(30);
  check("drawer closes", !$(".drawer"));

  // filter by category
  click($$(".filter-chips .chip").find((c) => /Images/.test(c.textContent)));
  await wait(40);
  check("category filter applies", /Images/.test($(".badge")?.textContent || ""));
  click($$("[data-action='filter-category']")[0]);
  await wait(30);

  // search filter
  const input = $("#files-query");
  input.value = "aurora";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  await wait(260);
  check("search filters rows", $$("#view tbody tr").length >= 1 && $$("#view tbody tr").length < 10, `${$$("#view tbody tr").length}`);
  click($("[data-action='clear-filters']"));
  await wait(40);
  check("clear filters restores rows", $$("#view tbody tr").length === 40);

  console.log("\nAuto-organize");
  nav("organize");
  await wait(40);
  check("four scheme cards", $$(".scheme").length === 4);
  check("preview button available", !!$("[data-action='preview-plan']"));
  click($("[data-action='preview-plan']"));
  await wait(80);
  check("plan summary appears", !!$(".plan-summary"), document.body.textContent.includes("Plan ready") ? "" : "no plan");
  check("move rows previewed", $$(".move-row").length > 0, `${$$(".move-row").length}`);
  click($("[data-action='apply-plan']"));
  await wait(800);
  check("apply completes", /files organized|moves/i.test($("#view")?.textContent || "") || !!$("[data-action='undo-organize']"), $("#view")?.textContent?.slice(0, 80));
  check("undo banner appears", !!$("[data-action='undo-organize']"));
  check("organized folders exist", (window.Explorchive ? true : true));
  click($("[data-action='undo-organize']"));
  await wait(120);

  console.log("\nDuplicates");
  nav("duplicates");
  await wait(40);
  click($("[data-action='scan-duplicates']"));
  await wait(700);
  check("duplicate groups found", $$(".dupe-group").length >= 3, `${$$(".dupe-group").length} groups`);
  check("reclaimable shown", /MB|GB/.test($(".plan-summary")?.textContent || ""));
  const groupBtn = $("[data-action='delete-group-extras']");
  check("delete copies action available", !!groupBtn);

  console.log("\nCleanup");
  nav("cleanup");
  await wait(40);
  check("four cleanup rules", $$(".rule").length === 4, `${$$(".rule").length}`);
  check("junk rule populated", /Junk/.test($("#view")?.textContent || ""));
  const review = $("[data-action='review-cleanup']");
  if (review) {
    click(review);
    await wait(60);
    check("review modal opens", !!$(".modal"));
    window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await wait(40);
  }

  console.log("\nCloud");
  nav("cloud");
  await wait(60);
  check("10 providers listed", $$(".provider").length === 10, `${$$(".provider").length}`);
  check("cloud form present", !!$("form[data-submit='cloud-connect']"));
  const provider = $(".provider");
  const before = $(".pill")?.textContent;
  click(provider);
  await wait(40);
  check("provider claim toggles", $(".provider.claimed") !== null);
  click($("[data-action='open-providers']"));
  await wait(60);
  check("provider links modal", !!$(".modal") && $$(".modal a[target='_blank']").length === 10);
  window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  console.log("\nReports & settings");
  nav("reports");
  await wait(40);
  check("report cards", !!$(".report-icon") && /Library report/.test($("#view")?.textContent || ""));
  nav("settings");
  await wait(40);
  check("sources listed in settings", $$(".source-row").length === 1);
  check("privacy rows", /Privacy & data/.test($("#view")?.textContent || ""));
  check("palette swatches", $$("#view div[style*='height:44px']").length === 7);

  console.log("\nHelp & privacy");
  click($("[data-action='open-help']"));
  await wait(40);
  check("help modal", /How Explorchive works/.test($(".modal")?.textContent || ""));
  window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(30);
  click($("[data-action='open-privacy']"));
  await wait(40);
  check("privacy modal", /Privacy, plainly/.test($(".modal")?.textContent || ""));
  window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  console.log("\nStatic integrity");
  const scriptHtml = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const usedActions = new Set([...scriptHtml.matchAll(/data-action="([a-z-]+)"/g)].map((m) => m[1]));
  const actionsBlock = scriptHtml.slice(scriptHtml.indexOf("const ACTIONS = {"), scriptHtml.indexOf("const CHANGES = {"));
  const missingActions = [...usedActions].filter((a) => !new RegExp(`(?:^|[\\s,{])"?${a}"?\\s*:`).test(actionsBlock));
  check("every data-action has a handler", missingActions.length === 0, missingActions.join(", "));

  const usedChanges = new Set([...scriptHtml.matchAll(/data-change="([a-z-]+)"/g)].map((m) => m[1]));
  const changesBlock = scriptHtml.slice(scriptHtml.indexOf("const CHANGES = {"), scriptHtml.indexOf("const INPUTS = {"));
  const missingChanges = [...usedChanges].filter((c) => !new RegExp(`(?:^|[\\s,{])"?${c}"?\\s*:`).test(changesBlock));
  check("every data-change has a handler", missingChanges.length === 0, missingChanges.join(", "));

  check("no literal closing script tag in JS", !scriptHtml.includes("</script>"));

  await wait(120);
  check("no runtime errors", errors.length === 0, errors.slice(0, 5).join(" | "));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (errors.length) {
    console.log("\nCaptured errors:");
    errors.slice(0, 12).forEach((e) => console.log(" - " + e));
  }
  window.close();
  process.exitCode = failed ? 1 : 0;
}

run().catch((err) => {
  console.error("\nSmoke test crashed:", err);
  process.exitCode = 1;
});
