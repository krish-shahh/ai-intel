# ai-intel

A **self-writing AI intel wiki**: a living knowledge base about the people,
companies, and ideas moving the AI world — software, and the hardware/compute/
datacenter stack underneath it. Two scheduled cloud agents read what happened
across X, Reddit, Hacker News, Polymarket, GitHub, and the web twice a day,
write a short brief, update the relevant people/company/topic pages, push to
`main`, and ping your phone with a link to a hosted, mobile-optimized web app.
It's also built to be browsed as an [Obsidian](https://obsidian.md) vault.

**Live:** [ai-krish.vercel.app](https://ai-krish.vercel.app)

## How it works

```mermaid
flowchart TD
    R["⏰ Cloud routines<br/>9am &amp; 8pm EST"] -->|search X · Reddit · HN · Polymarket · GitHub · web| W["Write digest brief<br/>+ update people/companies/topics"]
    W -->|commit &amp; push| M[("main branch")]
    M --> N["notify.yml<br/>→ ntfy push 🔔"]
    M --> L["linkcheck.yml<br/>→ flag dead links"]
    H["heartbeat.yml<br/>scheduled"] -.->|brief missing| N
    M -->|git auto-pull| A["🖥️ Desktop app<br/>dashboard · graph · files · CI status"]
    M -->|auto-deploy| B["🌐 Web app (Vercel)<br/>mobile-optimized, live from git"]
    N -->|links to| B
    N --> U["📱 You"]
    A --> U
    B --> U
```

Each run:
1. Reads `people/`, `companies/`, and `topics/` as the **source of truth** for what to track.
2. Searches across multiple sources for the last ~10h:
   - **X/Twitter** and the **web** via search
   - **Reddit** — pulled as structured JSON (`r/<sub>/new.json`, filtered by `created_utc`)
     across 26+ practitioner subs (r/LocalLLaMA, r/ClaudeAI, r/OpenAI, etc.)
   - **Hacker News** — via the Algolia API (`hn.algolia.com`), filtered by freshness and
     minimum engagement (≥10 points or ≥5 comments)
   - **Polymarket** — scans active prediction markets for AI topics; surfaces a signal only
     if volume > $10k and the odds are surprising or actionable
   - **GitHub trending** — daily trending repos, filtered to AI/ML/agent projects
   - **TLDR newsletters** (morning only) — ai, tech, and hardware editions
3. Ranks competing items by community engagement (Reddit score, HN points, comment count)
   within the freshness window.
4. Skims the previous brief and reports only what's new since then, so the morning and
   evening briefs don't repeat each other.
5. Writes a scannable digest to `briefs/<date>-<session>.md` — TL;DR, light section
   headers, one-line bullets in a plain voice, every bullet ending in a real source link.
6. Appends dated, sourced notes to the relevant `people/`, `companies/`, and `topics/` pages.
7. Commits and pushes the brief to `main` first, then the page updates as a second commit.

## Folder structure

```
.claude/skills/humanizer/   Bundled MIT writing-cleanup skill (optional; not in the default pipeline)
.github/workflows/          notify.yml · linkcheck.yml · heartbeat.yml
briefs/                     Dated digests: YYYY-MM-DD-{morning,evening}.md
people/                     One page per tracked person (name, handle, tags:[person])
companies/                  One page per tracked public company (name, ticker, layer, tags:[company])
topics/                     One page per topic (title, tags:[topic])
app/                        Desktop reader app (Electron: dashboard, graph, files)
web/                        Hosted reader app (Next.js: briefs, people, companies, topics, graph)
README.md                   This file
```

- **`people/` and `companies/` are starting whitelists, not hard limits.** Add a
  `people/<slug>.md` (`name`, `handle`, `tags: [person]`) or `companies/<slug>.md`
  (`name`, `ticker`, `layer`, `tags: [company]`) and the next run tracks them; remove
  the file to stop. The filename (no `.md`) is the wikilink slug, e.g. `[[karpathy]]`.
  Beyond the seeded list, the routine also **auto-discovers** newly relevant people and
  companies it encounters while researching (e.g. a new lab founder, a newly public
  supplier) and creates a stub page for them the same way, so coverage grows on its own.
  Each page carries a short bio; the routine appends dated, sourced notes under `## Recent`.
- **`companies/`** covers public companies across the AI hardware/datacenter supply chain --
  compute, memory, networking, storage, power, cooling, and building & site (see
  [[ai-datacenter-stack]]) -- plus the TMT names around them. The routine tracks
  stock-moving news (earnings, capex guidance, supply agreements) alongside product news.
- **`topics/`** works the same way for themes; its filenames are the topic slugs.

## Automation

- **Routines** (claude.ai/code): two scheduled agents, **8:00 AM** and **8:00 PM
  EST**. Manage at https://claude.ai/code/routines.
- **`notify.yml`** — on each new brief, sends an [ntfy.sh](https://ntfy.sh) push
  (topic `ai-intel`) with a one-line summary + link to the brief on the hosted
  web app; tap opens it. Subscribe in the ntfy app to topic `ai-intel`.
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
   public `.json` endpoints, filtered by `created_utc`), Hacker News (Algolia API),
   Polymarket, GitHub trending, and the web for your tracked people/topics, writes
   `briefs/<date>-<session>.md`, updates the stubs, and commits/pushes to `main`.
   (The prompts live in claude.ai, not the repo; cron is in UTC, so convert from your timezone.)
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
7. **(Optional) the web app** — deploy [`web/`](web/) to [Vercel](https://vercel.com)
   (Root Directory: `web`) for a hosted, mobile-optimized reader. It reads the same
   markdown at build time, so it redeploys automatically on every push to `main`.
   Point `notify.yml`'s `WEB_APP_URL` at your deployment so notifications link there.

## Web app

A hosted Next.js reader lives in [`web/`](web/) — the mobile-first way to read this
wiki, deployed on [Vercel](https://vercel.com) and rebuilt automatically on every
push to `main`. Same five views as the desktop app, tuned for a phone:

- **Briefs / People / Companies / Topics** — searchable list pages with an
  iOS-Contacts-style index scrubber for fast alphabetical/date jumping.
- **Graph** — a touch-friendly (pinch-to-zoom, tap-to-open) force-directed map of
  briefs ↔ people ↔ companies ↔ topics, filterable by date range and node type.
- A bottom dock (glass/blur effect) replaces a nav bar; PWA metadata (favicon,
  Open Graph/Twitter cards) is generated from the desktop app's icon.

```bash
cd web && npm install && npm run dev   # run locally at localhost:3000
npm run build                           # production build (what Vercel runs)
```

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
