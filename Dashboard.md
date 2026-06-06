---
title: Dashboard
tags: [dashboard]
---

# 🗞️ ai-intel

Twice-daily intel on the people and topics moving AI. Fresh briefs land at **8:00 AM** and **8:00 PM EST**.

> [!tip]
> Switch to **Reading view** (`Cmd+E`) to see the tables. The count next to each header (e.g. *Person (4)*) is the live total.

## 🆕 Latest briefs

```dataview
TABLE WITHOUT ID file.link AS Brief, session AS Session, dateformat(date, "EEE, MMM dd") AS Date, length(topics) AS "Topics"
FROM "briefs"
SORT date DESC, session DESC
LIMIT 14
```

## 🔥 Most-mentioned people

```dataview
TABLE WITHOUT ID link(key) AS Person, length(rows) AS Briefs
FROM "briefs"
FLATTEN people AS person
GROUP BY person
SORT length(rows) DESC
LIMIT 12
```

## 🏷️ Most-covered topics

```dataview
TABLE WITHOUT ID link(key) AS Topic, length(rows) AS Briefs
FROM "briefs"
FLATTEN topics AS topic
GROUP BY topic
SORT length(rows) DESC
LIMIT 12
```

## 🕑 Recently updated pages

```dataview
TABLE WITHOUT ID file.link AS Page, dateformat(file.mtime, "MMM dd, HH:mm") AS Updated
FROM "people" OR "topics"
SORT file.mtime DESC
LIMIT 10
```

## 👤 Tracked people

```dataview
LIST WITHOUT ID link(file.name, default(name, file.name))
FROM "people"
SORT file.name ASC
```

## 🧭 Topics

```dataview
LIST WITHOUT ID link(file.name, default(title, file.name))
FROM "topics"
SORT file.name ASC
```
