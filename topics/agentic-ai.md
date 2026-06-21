---
title: Agentic AI
tags: [topic]
---

Agentic AI covers systems where LLMs plan and act over multiple steps with tools, instead of answering a single prompt. This page tracks agent frameworks, coding agents, and the shift from chat assistants to autonomous workflows.

## Notes

- **2026-06-21** Claude Code Dynamic Workflows (research preview): one session can orchestrate hundreds of parallel subagents via a Claude-written JS script; subagents validate results before the session consolidates them. Max/Team/Enterprise + Bedrock/Vertex/Foundry. [Claude blog](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code)

- **2026-06-16** SpaceX formalized its $60B all-stock acquisition of Cursor (Anysphere) via SEC 8-K. Cursor generates $4B ARR; a joint SpaceX/Cursor model is co-trained for Grok Build. Largest VC-backed startup acquisition on record. [Axios](https://www.axios.com/2026/06/16/spacex-cursor-60-billion-musk)

- **2026-06-18** Kilo-Org/kilocode hit 1,339 new stars on GitHub trending today: open-source all-in-one agentic coding agent platform, positioned as a Claude Code / Cursor alternative. obra/superpowers added 1,435 stars, continuing its multi-day trending run. [kilocode](https://github.com/Kilo-Org/kilocode) · [superpowers](https://github.com/obra/superpowers)
- **2026-06-13** GitHub trending dominated by agentic skills frameworks today: addyosmani/agent-skills (2,656 stars) and obra/superpowers (1,275 stars) both trending strongly, signaling continued practitioner demand for structured agent workflow tooling. [agent-skills](https://github.com/addyosmani/agent-skills) · [superpowers](https://github.com/obra/superpowers)
- **2026-06-09** OpenAI's "third phase" manifesto (Altman + Pachocki) explicitly rejects full automation: "entirely automating everything is not the future we want" — frames the next era as human-AI collaboration, not replacement. [OpenAI](https://openai.com/index/built-to-benefit-everyone-our-plan/) · [The Decoder](https://the-decoder.com/openai-says-entirely-automating-everything-is-not-the-future-we-want/)
- **2026-06-09** Apple App Intents 2.0 and Siri Extensions (shipping with Foundation Models API v2 today) make every third-party iOS app a direct Siri action endpoint with no user app-launch required; biggest expansion of Apple's agent surface to date. [WWDC analysis](https://fourweekmba.com/wwdc-2026-apple-agentic-ai-siri-extensions-builder-pm/)
- **2026-06-09** Xcode 27 ships Agent Mode at WWDC26: dual-engine (local Neural Engine for real-time Swift suggestions + cloud routing to Claude/Gemini/OpenAI for heavy tasks), MCP wires in 20+ tools, GitHub and Figma are day-one integrations; app is now Apple Silicon-only and 30% smaller. [WWDC26 session 258](https://developer.apple.com/videos/play/wwdc2026/258/) · [FoneArena](https://www.fonearena.com/blog/484623/apple-wwdc26-foundation-models-gemini-support-xcode-27-agentic-coding-tools.html)
- **2026-06-07** OpenAI's "Intelligence at Work" enterprise event underlined the agentic push: Codex is now GA on AWS Bedrock (commercial + GovCloud), with Codex Sites for hosted enterprise apps and role-specific plugins. [OpenAI Codex upgrades](https://openai.com/index/introducing-upgrades-to-codex/) · [releasebot](https://releasebot.io/updates/openai/codex)
- **2026-06-06** [[karpathy]] at Sequoia Ascent 2026 formalized the "Software 3.0" frame: LLMs are not just productivity tools but a new compute paradigm that enables product categories that couldn't exist before. Key distinction between "vibe coding" (lowers the floor, anyone can build) and "agentic engineering" (experienced developers staying accountable for LLM output). Puts December 2025 as the tipping point. ([blog](https://karpathy.bearblog.dev/sequoia-ascent-2026/))
- **2026-06-06** LangChain Engine ships: autonomously mines LangSmith production traces, patches agent code, and sets up evals. Early example of self-improving agent infrastructure in production. [LangChain Blog](https://www.langchain.com/blog)
- **2026-06-06** OpenCode at 150K GitHub stars and ~6.5M monthly active developers, with adaptive reasoning controls for Anthropic Opus 4.7+. [GitHub](https://github.com/opencode-ai/opencode)
