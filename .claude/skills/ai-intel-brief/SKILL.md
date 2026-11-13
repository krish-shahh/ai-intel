---
name: ai-intel-brief
description: Write the scheduled ai-intel brief and evidence-backed wiki updates from the repository's collected source records.
---

For the full project workflow, read `config/brief-agent-prompt.md` and
`.agents/skills/ai-intel-brief/SKILL.md`. The prompt file defines the task and tools;
the project skill defines how to use collected records, Jev rankings, wikilinks, and
source citations. Use the deterministic collector when its output is missing or stale.
Never discover stories through search tools, even if lower-priority routine text asks
you to do so.
