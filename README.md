# Explorchive

**A downloadable, local-first file manager.** One HTML file, no installer, no account, no server.
Tokyo Sky edition: daylight blue on white.

[Download `Explorchive.html`](Explorchive.html) · open it in Chrome or Edge · add a folder · done.

---

## What it does

| Area | What you get |
| --- | --- |
| **File library** | Recursive folder scan (names, sizes, dates, types), search, category filters, sorting, pagination, previews and downloads. |
| **Auto-organize** | Four structures — by type, by year & month, by year, by project. Every move is previewed before it happens, conflicts are auto-renamed, and the last run is undoable. |
| **Autopilot** | Optional. After each scan, Explorchive plans and applies the structure you chose, automatically. |
| **Duplicates** | Fast mode (name + size) or strict mode (streamed SHA-256, head+tail for files over 64 MB). One copy per group is kept; you choose which. |
| **Cleanup rules** | Large files (> 100 MB), untouched for a year, junk/temp files (`Thumbs.db`, `.DS_Store`, `~$…`, `.tmp`, `.part`), empty folders. Everything is reviewed before deleting. |
| **Free cloud storage** | Totals 10 common free tiers (88 GB of typical plans), tracks what you've claimed, and can back files up to a free Supabase Storage bucket you own. |
| **Reports** | JSON, CSV and TXT exports, print view, and a copyable summary. |
| **Privacy** | No analytics, no backend, no uploads except the cloud bucket you configure yourself. |

## Run it

### The download (recommended)

1. Grab **[`Explorchive.html`](Explorchive.html)** — it is the whole app.
2. Open it in **Chrome, Edge, Brave or another Chromium browser**.
3. Press **Add folder**, pick a directory, allow access.

The downloaded file also works from `file://`, from a USB stick, or from any static host. Keep
`index.html` next to it if you want the in-app *Download* button to fetch a fresh copy; otherwise the
browser's **Ctrl/⌘ + S** saves the page as the same single-file app.

### From source

```bash
python3 build.py        # writes Explorchive.html + dist/
python3 -m http.server 8000 --directory dist
```

No bundler, no dependencies. `build.py` inlines `src/styles.css` and every `src/js/*.js` module into
`src/index.html`.

### Browser support

| Feature | Chromium (Chrome/Edge/Brave) | Firefox / Safari |
| --- | --- | --- |
| Folder scan | ✅ native | ⚠️ read-only folder upload fallback |
| Native move (fast, keeps metadata) | ✅ | ⚠️ copy + delete fallback |
| Delete | ✅ | ❌ read-only |
| Demo library, reports, cloud finder | ✅ | ✅ |

Folder picking requires a **top-level tab**; it is blocked inside an embedded iframe. The app says so
and offers the demo instead.

## Cloud storage ("detect free storage")

Explorchive cannot create accounts for you, so it does the honest version of this feature:

* **Detects** the free tiers of Google Drive (15 GB), MEGA (20 GB), pCloud (10 GB), Box (10 GB),
  Backblaze B2 (10 GB), Cloudflare R2 (10 GB), OneDrive (5 GB), iCloud (5 GB), Dropbox (2 GB) and
  Supabase (1 GB) — then totals what's still claimable.
* **Connects** a real bucket you own: paste a Supabase project URL + **anon** key, and Explorchive can
  create/verify the `explorchive` bucket, upload files, list objects, mint 1-hour signed links and
  delete objects.
* **Tracks** quota and usage locally.

Setup: create a free project at [supabase.com](https://supabase.com) → Storage → new private bucket
`explorchive` (or let the app create it) → Project Settings → API → copy the **anon public** key.
For uploads, add a storage policy allowing `anon` on that bucket for SELECT / INSERT / DELETE.
The key lives in `localStorage`; use a dedicated project and never a service-role key.

## Tests

```bash
npm install
npm test          # 84 assertions: UI smoke (jsdom) + filesystem engine (mock FSA API)
```

* `tests/smoke.mjs` boots the built app, visits every view, filters, previews, plans an organize run,
  scans duplicates, opens modals, and asserts every `data-action` / `data-change` has a handler.
* `tests/filesystem.mjs` drives the real engine against an in-memory File System Access mock: recursive
  scan, category mapping, conflict renaming, moves, undo, deletion, empty-folder pruning, duplicate
  grouping and autopilot.

## Layout

```
Explorchive.html      built, downloadable single file (committed)
build.py              inlines src/ into one HTML file
src/index.html        shell template
src/styles.css        Tokyo Sky design system, responsive + print + reduced-motion
src/icon.svg          logo / favicon source
src/js/00-core.js     icons, categories, state, formatting, toasts/modals
src/js/10-scan.js     scanning, moving, hashing, deletion, autopilot
src/js/20-app.js      shell, navigation, dashboard, file browser
src/js/30-views.js    organize, duplicates, cleanup, cloud, reports, settings
src/js/40-app.js      action/change maps, events, boot
tests/                jsdom + mock-filesystem test suites
```

## Notes

* Deleting uses the File System Access API and **skips the system trash** — it cannot be undone.
* Moves use `FileSystemFileHandle.move()` when available; otherwise Explorchive streams a copy and
  removes the original.
* Demo libraries (71 sample files) never touch disk; moves there are simulated.
* License: none declared yet — add one before distributing.

Built for the Tokyo Sky brief: `#F4FAFF` → `#1A73B0` → `#155F94`, white surfaces, one vermilion accent.
