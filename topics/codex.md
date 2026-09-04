---
title: Codex
tags: [topic]
---

Codex is OpenAI's coding agent for writing, editing, and running code across a codebase. This page tracks its releases, features, and usage.

## Notes

- **2026-09-03** Codex CLI v0.153.0: vim mode gets undo/redo (`u` / `Ctrl+R`) that preserves drafts and attachments, plus a plugin CLI to list, install, and remove plugins from remote marketplaces. [GitHub release](https://github.com/openai/codex/releases/tag/rust-v0.153.0) (primary)

- **2026-07-24** OpenAI shipped GPT-Live full-duplex voice control for Codex and ChatGPT Work in the desktop app (macOS and Windows). Users can now dispatch and coordinate multiple Codex agents simultaneously by voice while agents run in parallel. Rolling out to Plus, Pro, Business, Edu, and Enterprise plans. [OpenAI on X](https://x.com/OpenAI/status/2080378182469857576) · [VentureBeat](https://venturebeat.com/orchestration/agentic-coding-goes-hands-free-as-openai-brings-gpt-lives-full-duplex-voice-control-to-codex-and-chatgpt-on-the-desktop)

- **2026-07-15** OpenAI's Codex CLI began encrypting the prompts sent to sub-agents, sparking a 408-point HN thread (240 comments) about agentic transparency and what operators can actually audit in automated pipelines. [GitHub issue](https://github.com/openai/codex/issues/28058) · [HN](https://news.ycombinator.com/item?id=48905028)

- **2026-07-15** OpenAI launched the Codex Micro, its first hardware product: a compact programmable macro pad (13 mechanical keys, joystick, rotary encoder, Bluetooth and WiFi) built with boutique keyboard maker Work Louder. Targets Codex's 5M weekly users who want hardware shortcuts without a context switch. Jony Ive's AI device is reportedly still delayed. [TechStory](https://techstory.in/openai-launches-codex-micro-keypad-as-its-first-hardware-product-jony-ives-device-still-delayed/) · [DevOps.com](https://devops.com/openai-expands-into-developer-hardware-with-codex-micro-keyboard/)

- **2026-06-25** Atlassian added Codex support to Bitbucket Agentic Pipelines; Codex agents can now be triggered by PR comments, merges, schedules, or failing CI builds, following earlier Claude agent support in the same platform. [Atlassian](https://www.atlassian.com/blog/bitbucket/agentic-pipelines-now-supports-openai-codex)
- **2026-06-19** Record & Replay for macOS launched: record a workflow once and Codex converts it into a reusable "skill" via Computer Use; excluded from EEA, UK, and Switzerland at launch. [Codex changelog](https://developers.openai.com/codex/changelog)
- **2026-06-11** OCI integration live: Oracle cloud customers can now apply Oracle Universal Credits toward OpenAI models and Codex, routing enterprise procurement through existing Oracle contracts. [OpenAI](https://openai.com/index/openai-on-oracle-cloud/)
- **2026-06-06** Hit 5M weekly users. Shipped Codex Sites (build and deploy internal apps from a prompt) and 6 role-specific plugin bundles covering data, sales, design, and banking. [VentureBeat](https://venturebeat.com/orchestration/openais-codex-update-lets-agents-build-interactive-enterprise-workspaces-via-sites-and-role-specific-plugins)
