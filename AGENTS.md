# Project agent guide

Use the versioned project workflow instead of relying on personal or global prompt
instructions:

- `config/brief-agent-prompt.md` is the task prompt and lists the project's callable
  tools.
- `.agents/skills/ai-intel-brief/SKILL.md` defines the brief-writing workflow.
- `.github/scripts/sweep.py` is the deterministic source-collection tool. The APIs and
  feed URLs it calls are configured in `config/sources.json`.

For briefs, do not discover stories with web, browser, X, or other search tools. Run the
collector if its output is missing or stale, then use `data/sweep-latest.json`. Keep
credentials in local ignored `.env` or the corresponding GitHub Actions secrets/variables;
never commit real credentials.
