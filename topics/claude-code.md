---
title: Claude Code
tags: [topic]
---

Claude Code is Anthropic's command-line coding agent. It runs in the terminal and reads, edits, runs, and reviews code in a real repository. This page tracks its releases, pricing, and adoption.

## Notes

- **2026-06-11** Code with Claude: Extended Tokyo ran today — a second-day overflow event for indie devs and early-stage founders with hands-on workshops on managed agents, memory, evals, and multi-agent composition; recordings to be posted. [Event page](https://claude.com/code-with-claude/tokyo-extended)
- **2026-06-06** Enterprise cost crisis surfacing loudly. Microsoft cutting Claude Code licenses for its Experiences + Devices division by June 30, routing to Copilot. Uber burned through its entire 2026 AI coding budget by April, with heavy users hitting $500-$2,000/month. ([opentools.ai](https://opentools.ai/news/microsoft-cancels-claude-code-licenses-copilot-cli))
- **2026-05-28** Claude Opus 4.8 released, now leads the Artificial Analysis Intelligence Index at 61.4, with SWE-bench Pro at 69.2%.
- **2026-06-08** Billing split lands June 15: Agent SDK, `claude -p`, and Claude Code GitHub Actions move off subscription limits into a separate monthly credit pool ($20 Pro / $100 Max 5x / $200 Max 20x) at full API rates, no rollover. Interactive Claude Code in the terminal is unaffected. [TechTimes](https://www.techtimes.com/articles/317625/20260602/anthropic-ends-subscription-subsidy-agents-june-15-credit-pool-replaces-flat-rate-access.htm) · [Codersera](https://codersera.com/blog/anthropic-june-2026-billing-change-claude-code/)
- **2026-06-06** v2.1.166-168: adds `fallbackModel` setting so agents recover when the primary model is unavailable, glob support in deny-rule tool-name positions, hardened cross-session message security, and `MAX_THINKING_TOKENS=0` to suppress extended thinking. Two follow-on patch releases the same day. [GitHub releases](https://github.com/anthropics/claude-code/releases)
- **2026-06-06** Auto mode now on Bedrock, Vertex, and Foundry for Opus 4.7/4.8; dynamic-workflow trigger renamed to "ultracode"; plugins in `.claude/skills/` load automatically without a marketplace. [Releasebot](https://releasebot.io/updates/anthropic/claude-code)
