# Inventory · Project Accomplishment · PDM Schedule

A single-file web application for construction/inventory project management:
material inventory and On-Site tracking, **Project Accomplishment** (BOQ,
variation orders, monthly accomplishment, reports, analytics) and the
**PDM Schedule** module (forward/backward pass, float, critical path,
network diagram, Gantt chart, contract-item data entry and
**Suspension Orders & Resumption**) — all in one page with a
Google Apps Script backend.

> The whole front end lives in `index.html` (no build step, no framework).
> Everything is computed client-side; the server only stores raw rows.

## Highlights

- **PDM scheduling engine** — hand-written forward pass / backward pass with
  FS, SS, FF and SF relationships, lag, total float and the critical path,
  all derived in one place (`pdmCalculate()`) so the dashboard, activity
  table, network diagram and Gantt can never disagree.
- **Suspension Orders & Resumption** — suspension periods are applied as a
  *calendar* inside the scheduling engine (never as manual date edits):
  overlapping orders are merged without double-counting, indefinite
  suspensions put unfinished work **ON HOLD** with *Pending Resumption*
  readings, and a full timestamped audit trail is kept.
- **One shared selection** — the Project/Site and Contract ID chosen on any
  Project Accomplishment or PDM page follows the user across every page of
  both modules.
- **Data isolation** — inventory, accomplishment, baseline, actual-progress
  and suspension records live in dedicated stores that never overwrite each
  other.

## Repository layout

| Path | Purpose |
|---|---|
| `index.html` | The complete application (front end + client logic) |
| `manifest.json` | PWA manifest — makes the page installable as an app |
| `sw.js` | Service worker — app shell cache for offline use |
| `favicon.ico`, `favicon-192.png`, `favicon-512.png`, `maskable-512.png`, `apple-touch-icon.png` | The app icon set (tab, home screen, install dialog, iOS) |
| `app_icon_source.html`, `app_icon_source_maskable.html` | Vector sources the icons are rendered from |
| `Gs_files/` | Google Apps Script server code (deploy to the backend) |
| `*_suite.js.txt` | Headless-Chrome test suites (appended to a copy of the page) |
| `run_*.ps1` | PowerShell runners for each suite |
| `*.md` | Design/specification documents |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |

## Installable app (PWA)

The page is a full Progressive Web App, so on the deployed site it can be
**installed like a native application**:

- **Chrome / Edge (desktop)** — click the *Install* icon in the address bar
  (or menu → *Cast, save and share → Install page as app*).
- **Android** — menu → *Add to Home screen*.
- **iOS Safari** — Share → *Add to Home Screen*.

It opens in its own window (no browser chrome) with the app icon from
`manifest.json`. The service worker (`sw.js`) caches the app shell after the
first visit, so the application keeps opening **offline**; live data still
requires a connection. Service workers are registered only on real
http/https origins — opening `index.html` from a folder behaves exactly as
before.

### Regenerating the icons

The icons are rendered from the two vector sources:

```powershell
chrome --headless=new --window-size=512,512 --screenshot=favicon-512.png app_icon_source.html
chrome --headless=new --window-size=512,512 --screenshot=maskable-512.png app_icon_source_maskable.html
```

(and 192/180 px variants the same way; `favicon.ico` is the 48 px render of
the rounded source wrapped in an ICO header).

## Run locally

Open `index.html` in Chrome, or serve the folder:

```powershell
npx serve .          # or: python -m http.server 8080
```

Without the backend the app runs entirely in the browser using
`localStorage`, so every module works offline out of the box.

## Backend (Google Apps Script) — optional but recommended

1. Create a new Apps Script project at <https://script.google.com>.
2. Copy each file in `Gs_files/` into a script file with the same name
   (e.g. `Code.gs`, `06_pdm_schedule.gs`, …) and save.
3. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the Web app URL and paste it into `index.html`:

   ```js
   const WEB_APP_URL = 'https://script.google.com/macros/s/…/exec';
   ```

5. Redeploy the page — the app now stores its rows in the dedicated
   `PdmSchedule*`, `ProjectAccomplishment*` and inventory sheets.

## Tests

Every suite appends its script to a *copy* of `index.html` and runs it in
headless Chrome — the shipped page is never modified. Chrome must be
installed.

```powershell
powershell -ExecutionPolicy Bypass -File .\run_pdm_schedule_suite.ps1
powershell -ExecutionPolicy Bypass -File .\run_pdm_suspension_suite.ps1
powershell -ExecutionPolicy Bypass -File .\run_project_accomplishment_suite.ps1
powershell -ExecutionPolicy Bypass -File .\run_dashboard_validation_suite.ps1
```

Exit code `0` = every assertion passed. The runners print
`SUMMARY :: N passed, 0 failed` on success and keep
`_<suite>.html / _<suite>_out.txt` for inspection on failure.

## Publish on GitHub (and online with GitHub Pages)

The repository is prepared for upload: `.gitignore` excludes the test/build
artifacts (`_*.html`, `_*_out.txt`, screenshots) and `.nojekyll` makes GitHub
Pages serve the files exactly as they are. Because the app is a single
`index.html` at the repository root, **GitHub Pages publishes it with no
build step at all**.

### 1. Create the repository

Create a new **public** repository on <https://github.com/new> (e.g.
`inventory-pdm-schedule`) — *do not* initialize it with a README, the local
folder already has one.

### 2. Push this folder

Command line (Git for Windows / any shell in this folder):

```powershell
git init -b main
git add .
git commit -m "Inventory, Project Accomplishment and PDM Schedule modules"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

> When Git asks for credentials, use a **Personal Access Token** (or install
> **GitHub Desktop**, sign in, and use *Add an existing repository* →
> *Push origin* — exactly the same result without the command line).

### 3. Turn on GitHub Pages

1. On GitHub open **Settings → Pages**.
2. Under **Build and deployment** choose **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)` → **Save**.
4. After ~1 minute the site is live at
   `https://<your-user>.github.io/<your-repo>/`.

### 4. Afterwards — normal workflow

```powershell
git add .
git commit -m "describe the change"
git push
```

Every push updates the live site automatically.

### Notes

- The Apps Script URL in `index.html` is public by design (that is how the
  page talks to its backend); the sheets themselves stay private behind the
  script's access rules. Restrict them later by redeploying the web app with
  *"Who has access: Anyone with Google account"* and signing users in.
- All user data on the client is stored per-browser (`localStorage`);
  nothing sensitive ships with the repository.

