# Site Editor — Design Spec
**Date:** 2026-04-14
**Status:** Approved

---

## Overview

A locally-running web app that loads any vanilla HTML/CSS/JS website in an editable inline mode. Click any element to edit it directly on the page. Change colours and fonts via a Style panel that writes to CSS custom properties. Save writes changes to disk, Push commits and deploys to Netlify via GitHub. Reusable across any number of sites via a `sites.json` config.

---

## Goals

1. **Inline WYSIWYG editing** — edit the website exactly as it looks to visitors
2. **CSS variable editing** — change brand colours and fonts site-wide, not per-element
3. **Dark/light mode support** — edit both themes separately; add visitor toggle to sites
4. **One-click deploy** — Save to disk, Push to GitHub (triggers Netlify auto-deploy)
5. **Multi-site** — manage any number of vanilla HTML sites from one tool
6. **Always-on server** — nodemon auto-restarts on crash; localhost verified at every step

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Server | Node.js + Express |
| Auto-restart | nodemon |
| Editor overlay | Vanilla JS (injected into served pages) |
| Colour pickers | Native `<input type="color">` |
| Font loading | Google Fonts API |
| Git operations | Node.js `child_process` (git commands) |
| Config | `sites.json` (flat JSON, hand-edited) |

No frontend framework. No bundler. No build step.

---

## File Structure

```
site-editor/
  server.js                  ← Express server, injection middleware, API routes
  editor/
    editor.js                ← Injected editor overlay and toolbar logic
    editor.css               ← Injected editor styles (toolbar, pickers, highlights)
  sites.json                 ← { "Site Name": "/absolute/path/to/site" }
  package.json               ← nodemon dev script
```

---

## Architecture

### Server (`server.js`)

Express app on port 4000. Three responsibilities:

1. **Static file serving** — serves all files from the currently selected site's folder
2. **HTML injection middleware** — intercepts HTML responses and injects `editor.js` and `editor.css` before `</body>` and `</head>` respectively
3. **API routes:**
   - `GET /api/sites` — returns the full `sites.json` contents
   - `POST /api/save` — receives `{ file, changes }`, writes targeted changes to the site's HTML/CSS files on disk
   - `POST /api/push` — receives `{ message }`, runs `git add . && git commit -m "..." && git push` in the site directory via `child_process.exec`, streams status back
   - `GET /api/git-status` — returns list of changed files in the site directory

The server uses `sites.json` to resolve file paths. It never writes outside the configured site folder.

### Editor Overlay (`editor/editor.js`)

Injected into every HTML page the server serves. Responsibilities:

1. **Toolbar** — fixed bar at top of page (pushes page content down, does not overlap):
   - Left: site name dropdown (populated from `/api/sites`)
   - Centre: Style panel toggle button, change counter (`● 3 unsaved changes`)
   - Right: Save button, Push button (disabled until saved)

2. **Click-to-edit** — `mouseenter` highlights editable elements with a blue outline; click activates:
   - **Text elements** (h1–h6, p, span, li, a, button, label) → `contentEditable = true`, text cursor, floating mini-toolbar with text colour picker and font size stepper
   - **Images** (`img`) → file picker opens, selected file is base64-encoded or copied to `assets/` and src updated

3. **Style panel** — slides down from toolbar when toggled:
   - **Colours section** — reads all CSS custom properties from `:root` in `style.css`, renders one `<input type="color">` per variable; live-updates the page's `:root` on change
   - **Fonts section** — dropdown per font variable (`--font-display`, `--font-body`) with curated list: Montserrat, Inter, Poppins, Raleway, Open Sans, Lato, Roboto — loads selected font from Google Fonts on change
   - **Theme section** — toggle between `Light` and `Dark` theme to edit each independently (see Dark/Light Mode section)

4. **Change tracking** — all edits accumulated in memory as `{ type, selector, property, oldValue, newValue }`. Toolbar shows count. Undo (Ctrl+Z) reverts last change.

5. **Save** — POSTs accumulated changes to `/api/save`. Server writes targeted replacements to HTML/CSS files. On success: counter resets, Push button activates.

6. **Push modal** — clicking Push opens a modal showing:
   - List of changed files with change counts
   - Editable commit message (pre-filled: `"content: update [summary of changes]"`)
   - Confirm Push button → POSTs to `/api/push`, streams status: `Committing... → Pushing... → Live on Netlify ✓`
   - Error state shows git error message with Retry button

---

## Dark / Light Mode

### On the SolutionsAI website (visitor-facing)

A theme toggle button is added to the site's nav. It stores preference in `localStorage`. The CSS uses a `[data-theme="light"]` attribute on `<html>` to switch between colour schemes:

```css
:root { --bg: #0B1120; --text: #ffffff; } /* dark default */
[data-theme="light"] { --bg: #F4F7FC; --text: #0B1120; }
```

### In the editor

The Style panel's Theme toggle switches the `data-theme` attribute on the previewed page. Colour variable edits apply only to the currently active theme. This lets you set dark-mode colours and light-mode colours independently without leaving the editor.

---

## Save Mechanism (targeted file writes)

The server does **not** rewrite whole files. For each change:

- **Text content change** → find the element by a generated selector (tag + class + position), replace its inner text in `index.html` using regex on the specific line range
- **CSS variable change** → find `--variable-name: oldValue` in `style.css` and replace the value
- **Image src change** → copy uploaded file to `assets/`, update `src="..."` attribute in `index.html`

Original formatting, comments, and indentation are preserved.

---

## Multi-Site Config

`sites.json` is hand-edited — no UI required. Add a site by appending an entry:

```json
{
  "SolutionsAI": "C:/Users/verno/SolutionsAI_Projects/SolutionsAI website",
  "Client B": "C:/Users/verno/SolutionsAI_Projects/ClientB website"
}
```

Restart the server (nodemon handles this automatically on `sites.json` save). The new site appears in the toolbar dropdown.

---

## Running the Tool

```bash
cd site-editor
npm install        # once
npm run dev        # starts server with nodemon on port 4000
```

Open `http://localhost:4000`. The server auto-restarts on any file change in `site-editor/`. It does NOT restart on changes inside the managed site folders (those are the files being edited).

---

## Out of Scope (Phase 1)

- Authentication / password protection
- Cloud hosting of the editor itself
- Drag-and-drop layout changes (reordering sections)
- Adding new sections or components
- Version history / rollback beyond git log
- CMS database or headless CMS integration

---

## Reliability Requirements

- Server uses `nodemon` — auto-restarts on crash, no manual intervention needed
- Every implementation task must verify `http://localhost:4000` responds before marking complete
- `/api/push` must handle git auth errors gracefully and surface them in the modal
- Unsaved changes are held in editor memory — a browser refresh warning prevents accidental data loss
