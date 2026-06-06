# ai-intel desktop app

A small Electron reader for the `ai-intel` wiki. Three views over the same markdown
the routines write: **Dashboard**, **Graph**, and **Files**.

## Run

```bash
cd app
npm install
npm start
```

By default it reads the vault from the parent folder (`app/..`, i.e. the repo root).
Point it elsewhere with the folder picker if needed.

## Package a macOS app

```bash
cd app
npm run dist        # outputs a .dmg + .zip in app/dist/
```

## Views

- **Dashboard** — next run, stats, recent briefs, the latest brief rendered inline, and a live **Status** panel: whether you're behind `origin` (click to pull) and the latest result of each GitHub Actions workflow (notify · link-check · heartbeat, via the `gh` CLI).
- **Graph** — force-directed map of briefs ↔ people ↔ topics (frontmatter + `[[wikilinks]]`). Drag to pan, scroll to zoom, click a node to open.
- **Files** — a collapsible **file tree** of the whole vault (folders show file counts, click to expand/collapse) + a reader. Source links open in your browser; wikilinks navigate in-app.

The CI status needs the [GitHub CLI](https://cli.github.com) installed and authenticated (`gh auth login`); without it the rest still works and that row just says "needs gh CLI".

Shortcuts: `⌘1/2/3` switch views, `⌘K` search.

Live updates: the app watches the vault and reloads when files change (e.g. after Obsidian Git pulls a new brief).

## Notes

- `node_modules/` and `dist/` are gitignored.
- In Obsidian, exclude this `app/` folder so its files don't clutter the vault:
  **Settings → Files and links → Excluded files → add `app/`**.
