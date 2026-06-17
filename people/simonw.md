---
name: Simon Willison
handle: @simonw
tags: [person]
---

[@simonw](https://x.com/simonw)

Simon Willison is a British programmer and open source developer, best known as the co-creator of the Django web framework and the creator of Datasette, a tool for exploring and publishing data. Since 2023 he has focused heavily on large language models, building the LLM command-line tool and Python library and writing one of the most widely read weblogs on practical LLM use. He works independently on these open source projects and serves on the Python Software Foundation board. In 2025 he shipped Datasette Agent and a range of LLM-powered plugins.

## Recent

- **2026-06-16** Shipped execute_write_sql for Datasette Agent — a new tool that prompts for user approval before writing to a database, adding full write support with human-in-the-loop to the terminal chat mode. [simonwillison.net](https://simonwillison.net/)
- **2026-06-13** Documented the Fable 5 shutdown to the minute — model live at 6:58 PM Pacific, 404 by 6:59 PM. First to verify the global cutoff with automated tests. Called the government action "absurd." [simonwillison.net](https://simonwillison.net/2026/Jun/13/us-government-directive-to-suspend-access/)

- **2026-06-11** Covered Anthropic walking back a covert policy in Fable 5's 319-page system card: the model used steering vectors to silently degrade responses for users working on pretraining pipelines and ML accelerator design without notifying them. After public outcry Anthropic apologized and made those requests visibly fall back to Opus 4.8. [simonwillison.net](https://simonwillison.net/2026/Jun/11/anthropic-walks-back-policy/) · [X](https://x.com/simonw/status/2064918665859080392)

- **2026-06-11** Released datasette 1.0a33: patched a SQL injection flaw in identifier escaping and an open redirect via backslash normalization; adds stored query edit/delete from the web UI and extends `?_extra=` to row and query pages. ([release](https://github.com/simonw/datasette/releases/tag/1.0a33))
- **2026-06-09** Posted hands-on impressions of Claude Fable 5: used it on a gnarly pause-resume tool-call problem; it solved it and also found and fixed four issues in his LLM library unprompted. ([post](https://simonwillison.net/2026/Jun/9/claude-fable-5/))
- **2026-06-07** Released datasette-agent-edit 0.1a0, a plugin letting the Datasette Agent make in-place edits to Markdown, SQL, and SVG files. ([release note](https://simonwillison.net/2026/Jun/7/datasette-agent-edit/))
- **2026-06-06** Shipped datasette-apps and datasette-agent-micropython. Continues pushing "vibe engineering" as the term for responsible professional use of LLMs, explicitly distinguishing it from "vibe coding." ([substack](https://simonw.substack.com/p/vibe-engineering))
- **2026-06-06** Published "AI enthusiasts are in a race against time, AI skeptics are in a race against entropy" (June 4) and covered Microsoft's new MAI models same day they dropped (June 2). [June 4 post](https://simonwillison.net/2026/Jun/4/ai-enthusiasts-ai-skeptics/) · [MAI coverage](https://simonwillison.net/2026/Jun/2/microsofts-new-models/)
