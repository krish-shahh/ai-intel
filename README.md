# ai-intel

A **self-writing AI intel wiki**: a living knowledge base about the people,
projects, and ideas moving the AI world. Two scheduled cloud agents read what
happened across X, Reddit, and the web twice a day, write a short brief, update the
relevant people/topic pages, push to `main`, and ping your phone. It's built to
be browsed as an [Obsidian](https://obsidian.md) vault.

## How it works

```mermaid
flowchart TD
    R["⏰ Cloud routines<br/>8am &amp; 8pm EST"] -->|search X + Reddit + web| W["Write digest brief<br/>+ update people/topics"]
    W -->|commit &amp; push| M[("main branch")]
    M --> N["notify.yml<br/>→ ntfy push 🔔"]
    M --> L["linkcheck.yml<br/>→ flag dead links"]
    H["heartbeat.yml<br/>scheduled"] -.->|brief missing| N
    M -->|git auto-pull| A["🖥️ Desktop app<br/>dashboard · graph · files · CI status"]
    N --> U["📱 You"]
    A --> U
```

Each run:
1. Reads `people/` and `topics/` as the **source of truth** for what to track.
2. Searches X/Twitter, Reddit, and the web for the last ~10h. Reddit is pulled as
   structured JSON (append `.json` to any URL, e.g. `r/LocalLLaMA/new.json`), and each
   post's `created_utc` timestamp is used to keep only genuinely fresh items.
3. Skims the previous brief and reports only what's new since then, so the morning and
   evening briefs don't repeat each other.
4. Writes a scannable digest to `briefs/<date>-<session>.md` — TL;DR, light section
   headers, one-line bullets in a plain voice, every bullet ending in a real source link.
5. Appends dated, sourced notes to the relevant `people/` and `topics/` pages.
6. Commits and pushes the brief to `main` first, then the page updates as a second commit.

## Folder structure

```
.claude/skills/humanizer/   Bundled MIT writing-cleanup skill (optional; not in the default pipeline)
.github/workflows/          notify.yml · linkcheck.yml · heartbeat.yml
briefs/                     Dated digests: YYYY-MM-DD-{morning,evening}.md
people/                     One page per tracked person (name, handle, tags:[person])
topics/                     One page per topic (title, tags:[topic])
app/                        Desktop reader app (Electron: dashboard, graph, files)
README.md                   This file
```

- **`people/` is the whitelist.** Add a `people/<slug>.md` with `name`, `handle`,
  `tags: [person]` and the next run tracks them. Remove the file to stop. The
  filename (no `.md`) is the wikilink slug, e.g. `[[karpathy]]`. Each page carries a
  short bio and links the handle to that person's X profile; the routine appends dated,
  sourced notes under `## Recent`.
- **`topics/`** works the same way for themes; its filenames are the topic slugs.

## Automation

- **Routines** (claude.ai/code): two scheduled agents, **8:00 AM** and **8:00 PM
  EST**. Manage at https://claude.ai/code/routines.
- **`notify.yml`** — on each new brief, sends an [ntfy.sh](https://ntfy.sh) push
  (topic `ai-intel`) with a one-line summary + link; tap opens the brief.
  Subscribe in the ntfy app to topic `ai-intel`.
- **`linkcheck.yml`** — verifies the brief's source links resolve; alerts on
  dead/invented ones (404/410/unreachable).
- **`heartbeat.yml`** — shortly after each window, alerts if the expected brief
  never landed, so a failed run can't pass as a quiet day.

## Run your own copy

It's just markdown + GitHub Actions + Claude Code routines, so you can fork it and
point it at your own interests:

1. **Fork the repo**, then edit `people/` and `topics/` to track who and what you
   care about (one file each — see [Folder structure](#folder-structure)).
2. **Create two Claude Code routines** at
   [claude.ai/code/routines](https://claude.ai/code/routines) — a morning and an
   evening run — pointed at your fork. Each routine's prompt scans X, Reddit (via the
   public `.json` endpoints, filtered to fresh posts by `created_utc`), and the web for
   your tracked people/topics, writes `briefs/<date>-<session>.md`, updates the stubs,
   and commits/pushes to `main`. (The prompts live in claude.ai, not the repo; cron is
   in UTC, so convert from your timezone.)
3. **Allow direct pushes** — in the routine's repo permissions, enable
   **Allow unrestricted git push** so it can commit straight to `main` (or adapt
   the prompt to open PRs instead).
4. **Choose an ntfy topic** — replace `ai-intel` with your own (ideally
   unguessable) topic in `.github/workflows/notify.yml` and `heartbeat.yml`, then
   subscribe to it in the [ntfy](https://ntfy.sh) app.
5. **Enable GitHub Actions** on your fork (they power notifications, link-checking,
   and the missed-run heartbeat). No secrets or tokens needed — ntfy topics are
   public and the workflows just `curl` them.
6. **(Optional) the desktop app** — `cd app && npm install && npm start`. Its CI
   panel uses the [GitHub CLI](https://cli.github.com) (`gh auth login`).

## Desktop app

A standalone Electron reader lives in [`app/`](app/) — a purpose-built mini-Obsidian for
this vault, so you don't need Obsidian at all. Three views over the same markdown:

- **Dashboard** — next-run time, stats, recent briefs, the latest brief rendered inline,
  and a live status panel: whether you're behind `origin` (click to pull) and the latest
  GitHub Actions run for each workflow (notify · link-check · heartbeat, via the `gh` CLI).
- **Graph** — force-directed map of briefs ↔ people ↔ topics, from frontmatter + `[[wikilinks]]`.
- **Files** — a collapsible file tree of the vault + a reader.

It auto-pulls from GitHub (every 10 min + on launch) and live-reloads on file changes, so
new briefs appear on their own.

```bash
cd app && npm install && npm start   # run from source
npm run dist                          # build a macOS .app + .dmg into app/dist/
```

See [`app/README.md`](app/README.md) for details.

## Obsidian (optional)

The desktop app above is the primary way to read this wiki, but since it's just a
folder of markdown, you can also open it in [Obsidian](https://obsidian.md) if you
prefer (`Open folder as vault`, pointed at the repo root). You get wikilinks,
backlinks (each person/topic page shows every brief that mentioned it), the graph
view, and tag filtering (`person` / `topic` / `brief`).

If you go the Obsidian route, install the **Obsidian Git** plugin and enable
auto-pull so new briefs sync to your vault (the routines push to GitHub, not to
your machine).

## A note on accuracy

Briefs are auto-generated from web search. The link-check catches dead URLs, but
it can't verify that every claim is true — treat briefs as leads, not gospel, and
follow the sources.

## License

MIT — see [LICENSE](LICENSE). The bundled humanizer skill is MIT, adapted from
[blader/humanizer](https://github.com/blader/humanizer).
