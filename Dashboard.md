---
title: Dashboard
tags: [dashboard]
---

# ai-intel dashboard

> Needs the **Dataview** community plugin. In Obsidian: Settings → Community plugins → Browse → install & enable **Dataview**. The blocks below render live once it's on.

## Latest briefs

```dataview
TABLE WITHOUT ID file.link AS Brief, session AS Session, date AS Date
FROM "briefs"
SORT date DESC, session DESC
LIMIT 20
```

## Most-mentioned people

```dataview
TABLE length(rows) AS "Briefs"
FROM "briefs"
FLATTEN people AS person
GROUP BY person AS "Person"
SORT length(rows) DESC
```

## Most-covered topics

```dataview
TABLE length(rows) AS "Briefs"
FROM "briefs"
FLATTEN topics AS topic
GROUP BY topic AS "Topic"
SORT length(rows) DESC
```

## People index

```dataview
LIST
FROM "people"
SORT file.name ASC
```

## Topics index

```dataview
LIST
FROM "topics"
SORT file.name ASC
```
