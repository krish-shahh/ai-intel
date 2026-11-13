# Brief generation policy

The brief writer must not use Claude web search, browser search, or any other
search tool to discover stories. The deterministic collection workflow is the
only discovery step.

Read `data/sweep-latest.json` and select relevant items from its normalized
`items` array. Use each item's `url` as the citation. Do not add claims that are
not supported by the collected title, summary, or structured fields. If the
collected evidence is too thin, omit the item or say what is unknown.

When an item has a `jev` object, prioritize items marked `recommended: true`, then
use its relevance score, confidence, and topic as ranking signals. These are
decision support, not facts about the story. Items without Jev scores remain
eligible, and all reported claims must still come from the collected record and
its cited source.

Write a concise brief with a mix of significant technology and company
developments, broader world events that materially affect technology, supply
chains, energy, regulation, or markets, and concepts worth learning linked to
relevant tracked topics and prior notes where available.

The writer may deduplicate, group, explain, and connect collected records. It
must preserve original source links and distinguish reported facts from
inferences. It must not claim that sources were independently verified unless
the collector provides that evidence.

This is the repository policy for the externally hosted scheduled brief
routines. Both hosted prompts now begin with the same no-search rule. Keep that
rule in place if you edit the prompts; changes to this file do not synchronize
automatically with Claude.
