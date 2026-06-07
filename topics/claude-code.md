---
title: Claude Code
tags: [topic]
---

Claude Code is Anthropic's command-line coding agent. It runs in the terminal and reads, edits, runs, and reviews code in a real repository. This page tracks its releases, pricing, and adoption.

## Notes

- **2026-06-06** Enterprise cost crisis surfacing loudly. Microsoft cutting Claude Code licenses for its Experiences + Devices division by June 30, routing to Copilot. Uber burned through its entire 2026 AI coding budget by April, with heavy users hitting $500-$2,000/month. ([opentools.ai](https://opentools.ai/news/microsoft-cancels-claude-code-licenses-copilot-cli))
- **2026-05-28** Claude Opus 4.8 released, now leads the Artificial Analysis Intelligence Index at 61.4, with SWE-bench Pro at 69.2%.
- **2026-06-06** v2.1.166-168: adds `fallbackModel` setting so agents recover when the primary model is unavailable, glob support in deny-rule tool-name positions, hardened cross-session message security, and `MAX_THINKING_TOKENS=0` to suppress extended thinking. Two follow-on patch releases the same day. [GitHub releases](https://github.com/anthropics/claude-code/releases)
- **2026-06-06** Auto mode now on Bedrock, Vertex, and Foundry for Opus 4.7/4.8; dynamic-workflow trigger renamed to "ultracode"; plugins in `.claude/skills/` load automatically without a marketplace. [Releasebot](https://releasebot.io/updates/anthropic/claude-code)
