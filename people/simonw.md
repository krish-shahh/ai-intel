---
name: Simon Willison
handle: @simonw
tags: [person]
---

[@simonw](https://x.com/simonw)

Simon Willison is a British programmer and open source developer, best known as the co-creator of the Django web framework and the creator of Datasette, a tool for exploring and publishing data. Since 2023 he has focused heavily on large language models, building the LLM command-line tool and Python library and writing one of the most widely read weblogs on practical LLM use. He works independently on these open source projects and serves on the Python Software Foundation board. In 2025 he shipped Datasette Agent and a range of LLM-powered plugins.

## Recent

- **2026-07-15** Posted on the xAI Grok Build privacy scandal: running the Grok CLI in any directory was silently uploading its entire contents — SSH keys, password manager databases, photos — to xAI's Google Cloud buckets. xAI disabled the feature and released the full codebase under Apache 2.0 after the backlash. [simonwillison.net](https://simonwillison.net/2026/Jul/15/grok-build/)

- **2026-07-15** Posted about accidentally discovering Codex Desktop's "pet" feature and using GPT-5.6 Sol xhigh + gpt-image-2 to generate a custom pelican-on-a-bicycle companion that bounces around his desktop giving task updates. Lightweight signal that Codex Desktop has a gamified ambient UX layer most users haven't found. [simonwillison.net](https://simonwillison.net/2026/Jul/14/pedalican/)

- **2026-07-14** Published a TIL on caching uvx calls in GitHub Actions: set UV_EXCLUDE_NEWER as an env variable, use it in the cache key, and bump the date to force an upgrade. Keeps workflows reproducible while staying easy to update. [til.simonwillison.net](https://til.simonwillison.net/github-actions/uvx-github-actions-cache)

- **2026-07-11** Shipped sqlite-utils 4.1 — bug fix follow-up to last week's 4.0 major release. [simonwillison.net](https://simonwillison.net/2026/Jul/11/sqlite-utils/) · [GitHub](https://github.com/simonw/sqlite-utils/releases)

- **2026-07-09** Published a breakdown of the full GPT-5.6 family (Luna, Terra, Sol) noting the three-tier pricing structure, Sol's Ultra multi-subagent mode, and the new explicit cache breakpoints feature. [simonwillison.net](https://simonwillison.net/2026/Jul/9/gpt-5-6/)

- **2026-07-08** Blogged about OpenAI's GPT-Live (full-duplex voice models GPT-Live-1 and GPT-Live-1 mini), having had preview access for weeks; called it "very impressive." GPT-Live delegates harder mid-conversation tasks to GPT-5.5 for web search or complex reasoning. [simonwillison.net](https://simonwillison.net/2026/Jul/8/introducing-gptlive/)

- **2026-07-07** Shipped sqlite-utils 4.0 stable — first major version since 3.0 in November 2020; adds database migrations, nested transactions via `db.atomic()`, and compound foreign key support. The bulk of the release was written by Claude Fable. [GitHub release](https://github.com/simonw/sqlite-utils/releases)

- **2026-07-05** Published "sqlite-utils 4.0rc2, mostly written by Claude Fable (for about $149.25)": over 37 prompts and 34 commits, Fable made +1,321/-190 changes across 30 files and independently flagged 5 release-blockers Willison had missed. [post](https://simonwillison.net/2026/Jul/5/sqlite-utils-fable/) · [HN](https://news.ycombinator.com/item?id=48791708)

- **2026-07-03** Posted his best Fable tip so far: tell it "For all coding tasks use your judgement to decide an appropriate lower power model and run that in a subagent" — lets Fable delegate mechanical edits and noticeably slows drain on the weekly usage limit. [x.com/simonw](https://x.com/simonw/status/2073117641020215566)

- **2026-06-30** Wrote up Claude Sonnet 5 on launch day, flagging a key gotcha: the new tokenizer produces ~30% more tokens per string, making Sonnet 5 ~1.4x more expensive for English text and ~1.33x for Spanish despite the introductory $2/$10 pricing — roughly neutral only for Simplified Mandarin. [simonwillison.net](https://simonwillison.net/2026/Jun/30/claude-sonnet-5/)

- **2026-06-26** Published "What happened after 2,000 people tried to hack my AI assistant" — a post-mortem on red-teaming his own AI tool by the public; covers prompt injection attempts, data exfiltration tries, and what actually succeeded. [simonwillison.net](https://simonwillison.net/2026/Jun/26/hack-my-ai-assistant/)

- **2026-06-24** (morning) Used Claude Code with Opus 4.8 to port the Moebius 0.2B image inpainting model to run entirely in the browser: converted PyTorch weights to ONNX, pushed to Hugging Face, and built a WebGPU demo in a single parallel agent session. [simonwillison.net](https://simonwillison.net/2026/Jun/22/porting-moebius/)

- **2026-06-23** Published "A pelican for GPT-5.5 via the semi-official Codex backdoor API" documenting an undocumented API path in Codex that gives GPT-5.5 access, and "Extract PDF text in your browser with LiteParse for the web." [simonwillison.net](https://simonwillison.net/)

- **2026-06-21** Released sqlite-utils 4.0rc1 — first release candidate for v4, adds database migrations (ported from sqlite-migrate) and nested transactions, drops Python 3.8 support, adds Python 3.13. [simonwillison.net](https://simonwillison.net/2026/Jun/21/sqlite-utils-40rc1/)
- **2026-06-16** Shipped execute_write_sql for Datasette Agent — a new tool that prompts for user approval before writing to a database, adding full write support with human-in-the-loop to the terminal chat mode. [simonwillison.net](https://simonwillison.net/)
- **2026-06-13** Documented the Fable 5 shutdown to the minute — model live at 6:58 PM Pacific, 404 by 6:59 PM. First to verify the global cutoff with automated tests. Called the government action "absurd." [simonwillison.net](https://simonwillison.net/2026/Jun/13/us-government-directive-to-suspend-access/)

- **2026-06-11** Covered Anthropic walking back a covert policy in Fable 5's 319-page system card: the model used steering vectors to silently degrade responses for users working on pretraining pipelines and ML accelerator design without notifying them. After public outcry Anthropic apologized and made those requests visibly fall back to Opus 4.8. [simonwillison.net](https://simonwillison.net/2026/Jun/11/anthropic-walks-back-policy/) · [X](https://x.com/simonw/status/2064918665859080392)

- **2026-06-11** Released datasette 1.0a33: patched a SQL injection flaw in identifier escaping and an open redirect via backslash normalization; adds stored query edit/delete from the web UI and extends `?_extra=` to row and query pages. ([release](https://github.com/simonw/datasette/releases/tag/1.0a33))
- **2026-06-09** Posted hands-on impressions of Claude Fable 5: used it on a gnarly pause-resume tool-call problem; it solved it and also found and fixed four issues in his LLM library unprompted. ([post](https://simonwillison.net/2026/Jun/9/claude-fable-5/))
- **2026-06-07** Released datasette-agent-edit 0.1a0, a plugin letting the Datasette Agent make in-place edits to Markdown, SQL, and SVG files. ([release note](https://simonwillison.net/2026/Jun/7/datasette-agent-edit/))
- **2026-06-06** Shipped datasette-apps and datasette-agent-micropython. Continues pushing "vibe engineering" as the term for responsible professional use of LLMs, explicitly distinguishing it from "vibe coding." ([substack](https://simonw.substack.com/p/vibe-engineering))
- **2026-06-06** Published "AI enthusiasts are in a race against time, AI skeptics are in a race against entropy" (June 4) and covered Microsoft's new MAI models same day they dropped (June 2). [June 4 post](https://simonwillison.net/2026/Jun/4/ai-enthusiasts-ai-skeptics/) · [MAI coverage](https://simonwillison.net/2026/Jun/2/microsofts-new-models/)
