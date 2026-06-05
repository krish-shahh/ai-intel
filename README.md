# ai-intel

A **self-writing AI intel wiki**: a living, lightly-structured knowledge base
about the people, projects, and ideas moving the AI world. It's designed to be
maintained mostly by an agent — reading the timeline, watching releases, and
filling in the stubs below over time — so the notes grow on their own rather
than being hand-curated.

## Folder structure

```
.claude/skills/   Skills available to the agent maintaining this wiki
                  (e.g. humanizer, for making generated notes read naturally)
briefs/           Dated intel briefs — short write-ups synthesizing what
                  happened across people and topics
people/           One stub per person of interest (frontmatter: name, handle,
                  tags: [person])
topics/           One stub per topic/theme (frontmatter: title, tags: [topic])
README.md         This file
```

- **`people/`** — profiles for researchers, founders, and builders worth
  tracking. Each file carries a `name`, a `handle`, and the `[person]` tag.
- **`topics/`** — themes like agentic AI, Claude Code, model releases, and
  dev tools. Each file carries a `title` and the `[topic]` tag.
- **`briefs/`** — the output: periodic summaries that connect the dots between
  people and topics. Starts empty (`.gitkeep`) and fills up as briefs are written.

## Using it as an Obsidian vault

This repo is built to be opened directly as an
[Obsidian](https://obsidian.md) vault — point Obsidian at the repo root.
Markdown frontmatter, `[[wikilinks]]`, and the `tags` fields are all
Obsidian-native, so the graph view, tag search, and backlinks work out of the
box. The `person` and `topic` tags let you filter the graph by entity type,
and briefs link out to the relevant people and topics.

## Status

Scaffold only — most files are placeholder stubs. The wiki populates itself
from here.
