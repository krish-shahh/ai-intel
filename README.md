# ai-intel

Collects AI and tech updates from APIs, RSS, and research feeds, then turns them into
cited briefs and linked wiki pages.

## System

```mermaid
flowchart LR
  subgraph Sources[Source data]
    HN[Hacker News Algolia]
    Reddit[Reddit API or public JSON]
    Poly[Polymarket Gamma]
    Research[arXiv and SEC EDGAR]
    GitHub[GitHub Search API and Trending page]
    News[GDELT]
    RSS[RSS registry<br/>MIT Tech Review · TechCrunch · The Verge<br/>a16z · TLDR · IEEE · NVIDIA · Ars]
    Paid[Optional NewsAPI and Mediastack]
  end

  subgraph Collect[GitHub Actions: deterministic collection]
    SweepClock[sweep.yml<br/>every 4 hours] --> Script[sweep.py]
    Script --> Fresh[Normalize · filter · deduplicate]
    Fresh --> Jev[Jev / TypeSafe<br/>optional relevance and topic scores]
    Fresh --> Records[data/sweep-latest.json]
    Jev -. ranking signals .-> Records
  end

  HN --> Script
  Reddit --> Script
  Poly --> Script
  Research --> Script
  GitHub --> Script
  News --> Script
  RSS --> Script
  Paid --> Script

  subgraph Briefs[GitHub Actions: scheduled brief runs]
    Clock[fire-claude-routines.yml<br/>9 AM and 8 PM New York time] --> Fire[POST routine API<br/>Run mode: morning or evening]
    Fire --> Claude[API-only Claude Code routine]
    Prompt[Versioned prompt and skill<br/>no discovery search] --> Claude
    Records --> Claude
    Claude --> Output[Briefs and linked wiki pages<br/>people · companies · topics]
    Output --> Push[Commit and push to main]
  end

  Push --> Notify[ntfy notifications]
  Push --> Linkcheck[Source link checks]
  Heartbeat[Missed-run heartbeat] -. checks .-> Push
  Push --> Web[Next.js reader<br/>Vercel deployment]
  Push --> Desktop[Electron reader<br/>auto-pulls from GitHub]
```

GitHub Actions schedules the API-only Claude routine. The routine has no timer of its
own. Its task prompt and Claude skill live in the repo; collected records are the only
story-discovery input. The graph comes from links among briefs, people, companies, and
topics.

## Set up

1. For local collection, copy `.env.example` to `.env` and add credentials. `.env` is
   ignored by Git. Run a sweep with `python3 .github/scripts/sweep.py`.
2. For GitHub Actions, add `TYPESAFE_API_KEY`, Reddit credentials, and any optional
   provider keys as repository **secrets**. Set `SEC_USER_AGENT` as a repository
   **variable**. GitHub supplies `GITHUB_TOKEN` automatically.
3. Add `CLAUDE_AI_INTEL_ROUTINE_FIRE_TOKEN` as a repository secret and set
   `CLAUDE_ROUTINES_VIA_API=true` as a repository variable. The routine token is
   generated in Claude Code. The routine fire workflow starts disabled until enabled.
   Keep the older time-based routines paused.

For a fork, create an API-only Claude routine and replace the routine ID in
`.github/workflows/fire-claude-routines.yml` with yours.

## Sources

The collector uses Hacker News, Reddit, Polymarket, arXiv, SEC EDGAR, GitHub, GDELT,
and the RSS feeds in `config/sources.json`. NewsAPI and Mediastack are optional. Jev
scores items when `TYPESAFE_API_KEY` is set; scores affect ranking, not story facts.
GitHub Trending is read from its public HTML page, so GitHub markup changes may require
parser updates.

## Readers

- Desktop: `cd app && npm install && npm start`
- Web: `cd web && npm install && npm run dev`

MIT license. Collector and agent settings: `config/`, `.github/scripts/`, and
`.agents/skills/ai-intel-brief/`.
