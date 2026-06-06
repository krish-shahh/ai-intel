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

- **Dashboard** — next run, stats, recent briefs, and the latest brief rendered inline.
- **Graph** — force-directed map of briefs ↔ people ↔ topics (frontmatter + `[[wikilinks]]`). Drag to pan, scroll to zoom, click a node to open.
- **Files** — folder tree + reader. Source links open in your browser; wikilinks navigate in-app.

Shortcuts: `⌘1/2/3` switch views, `⌘K` search.

Live updates: the app watches the vault and reloads when files change (e.g. after Obsidian Git pulls a new brief).

## Notes

- `node_modules/` and `dist/` are gitignored.
- In Obsidian, exclude this `app/` folder so its files don't clutter the vault:
  **Settings → Files and links → Excluded files → add `app/`**.
