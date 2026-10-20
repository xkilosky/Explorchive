#!/usr/bin/env python3
"""Build Explorchive into one portable HTML file.

Usage:
    python3 build.py

Outputs:
    dist/index.html          app entry for local preview / static hosting
    dist/Explorchive.html    the downloadable single-file app
    Explorchive.html         same file at the repo root, easy to grab
"""
from __future__ import annotations

import base64
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
JS_DIR = SRC / "js"
DIST = ROOT / "dist"

BANNER = """/*!
 * Explorchive v{version} — Tokyo Sky edition
 * Local-first file manager. No tracker, no backend, no account.
 * Build: single HTML file, zero dependencies.
 */
"""


def read(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


def main() -> int:
    template = read(SRC / "index.html")
    styles = read(SRC / "styles.css")
    icon_svg = read(SRC / "icon.svg").strip()
    icon_uri = "data:image/svg+xml;base64," + base64.b64encode(icon_svg.encode("utf-8")).decode("ascii")

    js_files = sorted(JS_DIR.glob("*.js"))
    if not js_files:
        print("No JavaScript found in src/js", file=sys.stderr)
        return 1

    js_parts = []
    for path in js_files:
        js_parts.append(f"\n/* ===== {path.name} ===== */\n" + read(path).rstrip() + "\n")
    js_body = "".join(js_parts)

    # Keep the document parser safe: no literal closing script tag may appear in inline JS.
    if "</script" in js_body.lower():
        print("Refusing to inline: a script contains a literal </script> sequence.", file=sys.stderr)
        return 1

    bundle = (
        BANNER.format(version="1.0.0")
        + "(function () {\n'use strict';\n"
        + js_body
        + "\nwindow.Explorchive = Object.freeze({\n"
        + "  version: APP_VERSION,\n"
        + "  edition: 'Tokyo Sky',\n"
        + "  // Exposed for the test suite and for people who want to script the app.\n"
        + "  state,\n"
        + "  internals: Object.freeze({\n"
        + "    addSource, scanSource, scanAll, buildOrganizePlan, applyOrganizePlan, undoOrganize,\n"
        + "    deleteFileObjects, deleteEmptyFolders, scanDuplicates, loadDemo, render, navigate,\n"
        + "    categoryOf, extOf, isJunk, fmtBytes, cleanupBuckets, emptyFolders, ACTIONS,\n"
        + "  }),\n"
        + "});\n"
        + "})();\n"
    )

    html = template.replace("/* {{STYLES}} */", styles.rstrip())
    html = html.replace("/* {{SCRIPTS}} */", bundle)
    html = html.replace("<!--ICON-->", icon_uri)

    if "{{STYLES}}" in html or "{{SCRIPTS}}" in html or "<!--ICON-->" in html:
        print("Template placeholders were not all replaced", file=sys.stderr)
        return 1

    DIST.mkdir(exist_ok=True)
    entry = DIST / "index.html"
    entry.write_text(html, encoding="utf-8")
    shutil.copyfile(entry, DIST / "Explorchive.html")
    shutil.copyfile(entry, ROOT / "Explorchive.html")
    shutil.copyfile(SRC / "icon.svg", DIST / "icon.svg")

    kb = len(html.encode("utf-8")) / 1024
    print(f"Built Explorchive — {kb:.1f} KB, {len(js_files)} JS modules")
    print(f"  {entry.relative_to(ROOT)}")
    print(f"  {(DIST / 'Explorchive.html').relative_to(ROOT)}")
    print(f"  {(ROOT / 'Explorchive.html').relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
