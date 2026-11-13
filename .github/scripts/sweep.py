#!/usr/bin/env python3
"""Deterministic collectors for ai-intel. No generative web search is used.

Each adapter returns normalized source records. Collection, freshness filtering,
deduplication, and basic ranking are code-driven; the brief writer consumes the
resulting data/sweep-latest.json.
"""
import base64
import email.utils
import html
from html.parser import HTMLParser
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FRESHNESS_HOURS = 14
UA = "ai-intel-sweep/2.0 (https://github.com/krish-shahh/ai-intel)"
SUBREDDITS = [
    "LocalLLaMA", "LocalLLM", "ollama", "SillyTavern", "StableDiffusion", "comfyui",
    "AI_Agents", "LLMDevs", "ChatGPTCoding", "cursor", "LangChain", "RAG",
    "ClaudeAI", "Anthropic", "OpenAI", "OpenAIDev", "GeminiAI", "MistralAI",
    "grok", "perplexity_ai", "MachineLearning", "deeplearning", "artificial",
    "singularity", "accelerate", "agi",
]
HN_TERMS = ["AI agent", "LLM", "Claude", "Anthropic", "OpenAI", "machine learning"]
ARXIV_QUERY = "cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR cat:stat.ML"
GDELT_QUERY = '("artificial intelligence" OR "AI model" OR semiconductor OR "data center" OR datacenter OR robotics OR cybersecurity) sourcelang:english'


def fetch(url, headers=None, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read()
    except Exception as exc:
        print(f"  skip {url}: {exc}")
        return None


def load_local_env():
    """Load simple KEY=VALUE pairs from .env without overriding injected secrets."""
    path = ROOT / ".env"
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip()
        if key and key not in os.environ:
            if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
                value = value[1:-1]
            os.environ[key] = value


def fetch_json(url, headers=None):
    raw = fetch(url, headers)
    if not raw:
        return None
    try:
        return json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        print(f"  invalid JSON from {url}: {exc}")
        return None


def iso_date(value):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).isoformat()
    except (ValueError, TypeError):
        try:
            dt = email.utils.parsedate_to_datetime(value)
            return dt.astimezone(timezone.utc).isoformat()
        except (ValueError, TypeError, OverflowError):
            return None


def record(source, source_id, title, url, published_at=None, summary="", **extra):
    return {
        "id": f"{source}:{source_id or url}", "source": source,
        "source_id": str(source_id or ""), "title": clean(title),
        "url": url, "published_at": iso_date(published_at),
        "summary": clean(summary), **extra,
    }


def clean(value):
    if not value:
        return ""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", str(value)))).strip()


def tracked_names():
    names = []
    for folder in ("people", "companies", "topics"):
        for path in (ROOT / folder).glob("*.md"):
            text = path.read_text(encoding="utf-8")
            match = re.search(r"^(?:name|title):\s*(.+)$", text, re.MULTILINE)
            names.append(match.group(1).strip().strip("'\"" ) if match else path.stem.replace("-", " "))
    return names


def tracked_tickers():
    tickers = []
    for path in (ROOT / "companies").glob("*.md"):
        text = path.read_text(encoding="utf-8")
        match = re.search(r"^ticker:\s*([A-Z0-9.=-]+)$", text, re.MULTILINE)
        if match and "." not in match.group(1):
            tickers.append(match.group(1))
    return sorted(set(tickers))


def fetch_reddit(cutoff_ts):
    token = reddit_oauth_token()
    if token:
        base, suffix = "https://oauth.reddit.com", ""
        headers = {"Authorization": f"Bearer {token}"}
    else:
        print("  Reddit: no OAuth credentials; attempting public JSON endpoints")
        base, suffix, headers = "https://www.reddit.com", ".json", {}
    items, seen = [], set()
    for sub in SUBREDDITS:
        for endpoint in (f"r/{sub}/new{suffix}?limit=50", f"r/{sub}/top{suffix}?t=day&limit=25"):
            data = fetch_json(f"{base}/{endpoint}", headers)
            time.sleep(.4 if token else 1)
            for child in (data or {}).get("data", {}).get("children", []):
                d = child.get("data", {})
                pid = d.get("id")
                if not pid or pid in seen or (d.get("created_utc") or 0) < cutoff_ts:
                    continue
                seen.add(pid)
                items.append(record("reddit", pid, d.get("title"), "https://www.reddit.com" + (d.get("permalink") or ""),
                    datetime.fromtimestamp(d["created_utc"], timezone.utc).isoformat() if d.get("created_utc") else None,
                    d.get("selftext", ""), subreddit=sub, score=d.get("score", 0), comments=d.get("num_comments", 0)))
    return items


def reddit_oauth_token():
    cid, secret = os.getenv("REDDIT_CLIENT_ID"), os.getenv("REDDIT_CLIENT_SECRET")
    if not cid or not secret:
        return None
    basic = base64.b64encode(f"{cid}:{secret}".encode()).decode()
    req = urllib.request.Request("https://www.reddit.com/api/v1/access_token", data=b"grant_type=client_credentials",
        headers={"Authorization": f"Basic {basic}", "User-Agent": UA}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return json.loads(response.read().decode()).get("access_token")
    except Exception as exc:
        print(f"  Reddit OAuth failed: {exc}")
        return None


def fetch_hn(cutoff_ts, names):
    items, seen = [], set()
    terms = list(dict.fromkeys(HN_TERMS + names))
    for term in terms:
        query = urllib.parse.urlencode({"query": term, "tags": "story", "hitsPerPage": 30})
        data = fetch_json(f"https://hn.algolia.com/api/v1/search?{query}") or {}
        time.sleep(.25)
        for hit in data.get("hits", []):
            oid = hit.get("objectID")
            if not oid or oid in seen or (hit.get("created_at_i") or 0) < cutoff_ts:
                continue
            points, comments = hit.get("points") or 0, hit.get("num_comments") or 0
            if points < 10 and comments < 5:
                continue
            seen.add(oid)
            items.append(record("hackernews", oid, hit.get("title"), hit.get("url") or f"https://news.ycombinator.com/item?id={oid}",
                hit.get("created_at"), hit.get("story_text", ""), thread_url=f"https://news.ycombinator.com/item?id={oid}",
                points=points, comments=comments, matched_term=term))
    return items


def fetch_polymarket():
    items = []
    terms = ["artificial intelligence", "AI model", "OpenAI", "Anthropic", "NVIDIA", "semiconductor", "data center"]
    seen = set()
    for term in terms:
        query = urllib.parse.urlencode({"active": "true", "closed": "false", "limit": 100, "q": term})
        data = fetch_json(f"https://gamma-api.polymarket.com/markets?{query}") or []
        for market in (data if isinstance(data, list) else data.get("markets", [])):
            slug = market.get("slug")
            if not slug or slug in seen:
                continue
            seen.add(slug)
            try:
                volume = float(market.get("volume") or 0)
            except (TypeError, ValueError):
                volume = 0
            if volume < 10000:
                continue
            question = market.get("question", "")
            if not re.search(r"\b(ai|artificial intelligence|openai|anthropic|nvidia|semiconductor|chip|data cent(?:er|re)|llm|model)\b", question, re.I):
                continue
            items.append(record("polymarket", slug, question, f"https://polymarket.com/market/{slug}",
                summary="", volume=volume, outcome_prices=market.get("outcomePrices")))
    return items


def read_feed(url, source, cutoff, metadata=None):
    raw = fetch(url, {"Accept": "application/atom+xml, application/rss+xml, application/xml"})
    if not raw:
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        print(f"  invalid feed {url}: {exc}")
        return []
    out = []
    for entry in root.iter():
        tag = entry.tag.rsplit("}", 1)[-1].lower()
        if tag not in ("item", "entry"):
            continue
        fields = {}
        for child in list(entry):
            fields[child.tag.rsplit("}", 1)[-1].lower()] = child
        def txt(*keys):
            for key in keys:
                if key in fields:
                    return "".join(fields[key].itertext()).strip()
            return ""
        link = ""
        link_element = fields.get("link")
        if link_element is not None:
            link = link_element.attrib.get("href") or (link_element.text or "").strip()
        date = iso_date(txt("published", "pubdate", "date", "updated"))
        if date and datetime.fromisoformat(date) < cutoff:
            continue
        if link and link.startswith("http"):
            out.append(record(source, link, txt("title"), link, date, txt("summary", "description", "content"), **(metadata or {})))
    return out


def fetch_rss(cutoff):
    config = json.loads((ROOT / "config" / "sources.json").read_text(encoding="utf-8"))
    items = []
    for source in config.get("feeds", []):
        metadata = {key: source[key] for key in ("name", "kind", "publisher") if source.get(key)}
        rows = read_feed(source["url"], source["id"], cutoff, metadata)
        items.extend(rows)
        print(f"  RSS {source['id']}: {len(rows)} items")
    return items


def score_with_jev(items, previous_items):
    """Add structured relevance/topic signals from Jev when an API key is set."""
    api_key = os.getenv("TYPESAFE_API_KEY")
    if not api_key:
        print("  Jev: TYPESAFE_API_KEY not configured; keeping deterministic source ranking")
        return

    cached = {item.get("id"): item["jev"] for item in previous_items if item.get("id") and item.get("jev")}
    reused = 0
    for item in items:
        if item.get("id") in cached:
            item["jev"] = cached[item["id"]]
            reused += 1

    candidates = [item for item in items if not item.get("jev") and item.get("title")]
    candidates.sort(key=lambda item: item.get("published_at") or "", reverse=True)
    try:
        max_items = max(0, int(os.getenv("JEV_MAX_ITEMS_PER_SWEEP", "100")))
    except ValueError:
        max_items = 100
    try:
        min_relevance = float(os.getenv("JEV_MIN_RELEVANCE_SCORE", "2"))
    except ValueError:
        min_relevance = 2.0
    if len(candidates) > max_items:
        print(f"  Jev: scoring newest {max_items} of {len(candidates)} uncached items")

    questions = {
        "relevance": {
            "type": "score",
            "instructions": "How relevant is this item to a personal AI and technology intelligence brief? Score its direct usefulness, not how broadly popular it is.",
            "criteria": [
                "Not relevant to AI or technology learning/current awareness",
                "Tangentially related or low practical/news value",
                "Relevant background or a modestly useful update",
                "Directly useful: substantive AI, software, research, policy, or technology business news",
                "Highly useful: major development, strong learning value, or clear impact on AI/software/hardware ecosystems",
            ],
        },
        "topic": {
            "type": "choice",
            "instructions": "Choose the best primary topic for this item.",
            "criteria": {
                "ai_models_research": "AI models, agents, machine learning research, benchmarks, or AI products",
                "developer_tools": "Software engineering, coding tools, open-source software, or developer workflows",
                "hardware_datacenters": "Semiconductors, compute, networking, power, cooling, or data centers",
                "policy_business": "AI policy, regulation, company strategy, funding, or market activity",
                "other_technology": "Technology news that does not fit the categories above",
            },
        },
    }
    scored = 0
    for item in candidates[:max_items]:
        state = {
            "title": item.get("title", "")[:500],
            "summary": item.get("summary", "")[:3500],
            "source": item.get("source", ""),
            "publisher": item.get("publisher") or item.get("name") or item.get("domain", ""),
        }
        request_body = json.dumps({"model": "jev-latest", "state": state, "questions": questions}).encode()
        req = urllib.request.Request(
            "https://api.typesafe.ai/v1/systemone", data=request_body,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", "User-Agent": UA},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as response:
                result = json.loads(response.read().decode("utf-8"))
            answers = result.get("answers", {})
            relevance = answers.get("relevance", {})
            topic = answers.get("topic", {})
            item["jev"] = {
                "model": result.get("model", "jev-latest"),
                "relevance_score": relevance.get("score"),
                "recommended": relevance.get("score") is not None and float(relevance["score"]) >= min_relevance,
                "relevance_confidence": relevance.get("confidence"),
                "relevance_probabilities": relevance.get("probabilities"),
                "topic": topic.get("choice"),
                "topic_confidence": topic.get("confidence"),
                "topic_probabilities": topic.get("probabilities"),
            }
            scored += 1
        except Exception as exc:
            print(f"  Jev: scoring failed for {item.get('id')}: {exc}")
        time.sleep(.1)
    print(f"  Jev: scored {scored} items; reused {reused} cached scores; left {max(0, len(candidates) - max_items)} unscored by per-run limit")


def fetch_arxiv(cutoff):
    params = urllib.parse.urlencode({"search_query": ARXIV_QUERY, "start": 0, "max_results": 100, "sortBy": "submittedDate", "sortOrder": "descending"})
    raw = fetch(f"https://export.arxiv.org/api/query?{params}")
    if not raw:
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return []
    ns = {"a": "http://www.w3.org/2005/Atom"}
    out = []
    for entry in root.findall("a:entry", ns):
        date = iso_date(entry.findtext("a:published", default="", namespaces=ns))
        if date and datetime.fromisoformat(date) < cutoff:
            continue
        url = entry.findtext("a:id", default="", namespaces=ns)
        authors = [a.findtext("a:name", default="", namespaces=ns) for a in entry.findall("a:author", ns)]
        cats = [c.attrib.get("term", "") for c in entry.findall("a:category", ns)]
        out.append(record("arxiv", url.rsplit("/", 1)[-1], entry.findtext("a:title", default="", namespaces=ns), url, date,
            entry.findtext("a:summary", default="", namespaces=ns), authors=authors, categories=cats))
    return out


def fetch_sec(cutoff):
    agent = os.getenv("SEC_USER_AGENT")
    if not agent:
        print("  SEC: set SEC_USER_AGENT (include a contact email) to enable EDGAR requests")
        return []
    headers = {"User-Agent": agent}
    tickers = tracked_tickers()
    directory = fetch_json("https://www.sec.gov/files/company_tickers.json", headers) or {}
    lookup = {str(v.get("ticker", "")).upper(): (str(v.get("cik_str", "")).zfill(10), v.get("title", "")) for v in directory.values()}
    out = []
    cutoff_date = cutoff.date().isoformat()
    for ticker in tickers:
        found = lookup.get(ticker)
        if not found:
            continue
        cik, name = found
        data = fetch_json(f"https://data.sec.gov/submissions/CIK{cik}.json", headers) or {}
        recent = data.get("filings", {}).get("recent", {})
        for i, filed in enumerate(recent.get("filingDate", [])):
            if filed < cutoff_date:
                break
            form = recent.get("form", [""])[i]
            if form not in ("8-K", "10-K", "10-Q", "6-K", "20-F", "40-F"):
                continue
            accession = recent.get("accessionNumber", [""])[i].replace("-", "")
            primary = recent.get("primaryDocument", [""])[i]
            url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession}/{primary}"
            out.append(record("sec_edgar", accession, f"{name} filed {form}", url, filed, ticker=ticker, form=form, cik=cik))
        time.sleep(.12)
    return out


def fetch_github(cutoff):
    since = (datetime.now(timezone.utc) - timedelta(days=2)).date().isoformat()
    query = urllib.parse.urlencode({"q": f"topic:artificial-intelligence created:>{since} stars:>50", "sort": "stars", "order": "desc", "per_page": 50})
    headers = {"Accept": "application/vnd.github+json"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = fetch_json(f"https://api.github.com/search/repositories?{query}", headers) or {}
    out = []
    for repo in data.get("items", []):
        created = iso_date(repo.get("created_at"))
        out.append(record("github", repo.get("full_name"), repo.get("full_name"), repo.get("html_url"), created,
            repo.get("description", ""), stars=repo.get("stargazers_count", 0), language=repo.get("language"),
            topics=repo.get("topics", []), updated_at=repo.get("updated_at")))
    return out


class GitHubTrendingParser(HTMLParser):
    """Extract repository cards from GitHub's public Trending page."""
    def __init__(self):
        super().__init__()
        self.rows = []
        self.current = None
        self.in_description = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "article" and "Box-row" in attrs.get("class", "").split():
            self.current = {"text": [], "description": [], "links": []}
        elif self.current is not None and tag == "a" and attrs.get("href"):
            self.current["links"].append(attrs["href"])
        elif self.current is not None and tag == "p":
            self.in_description = True

    def handle_data(self, data):
        if self.current is not None and data.strip():
            self.current["text"].append(data.strip())
            if self.in_description:
                self.current["description"].append(data.strip())

    def handle_endtag(self, tag):
        if tag == "article" and self.current is not None:
            self.rows.append(self.current)
            self.current = None
        elif tag == "p":
            self.in_description = False


def fetch_github_trending():
    """Collect daily trending repositories from GitHub's public HTML page."""
    raw = fetch("https://github.com/trending", {"Accept": "text/html"})
    if not raw:
        return []
    parser = GitHubTrendingParser()
    try:
        parser.feed(raw.decode("utf-8", errors="replace"))
    except Exception as exc:
        print(f"  GitHub Trending: could not parse page: {exc}")
        return []
    now = datetime.now(timezone.utc).isoformat()
    out = []
    for row in parser.rows:
        repo_path = next((path for path in row["links"] if re.fullmatch(r"/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", path)), None)
        if not repo_path:
            continue
        name = repo_path.strip("/")
        summary = " ".join(row["description"])
        out.append(record("github_trending", name, name, f"https://github.com/{name}", now,
            summary[:1200], trending_period="daily", trending_page="https://github.com/trending"))
    print(f"  GitHub Trending: parsed {len(out)} repository cards")
    return out


def fetch_gdelt():
    params = urllib.parse.urlencode({"query": GDELT_QUERY, "mode": "ArtList", "format": "json", "sort": "DateDesc", "maxrecords": 75, "timespan": "14h"})
    data = fetch_json(f"https://api.gdeltproject.org/api/v2/doc/doc?{params}") or {}
    out = []
    for article in data.get("articles", []):
        out.append(record("gdelt", article.get("url"), article.get("title"), article.get("url"), article.get("seendate"),
            article.get("socialimage", ""), domain=article.get("domain"), language=article.get("language"), country=article.get("sourcecountry")))
    return out


def fetch_newsapi():
    key = os.getenv("NEWSAPI_KEY")
    if not key:
        print("  NewsAPI: NEWSAPI_KEY not configured")
        return []
    query = '"artificial intelligence" OR semiconductor OR "data center" OR robotics'
    params = urllib.parse.urlencode({"q": query, "language": "en", "sortBy": "publishedAt", "pageSize": 100, "apiKey": key})
    data = fetch_json(f"https://newsapi.org/v2/everything?{params}") or {}
    return [record("newsapi", a.get("url"), a.get("title"), a.get("url"), a.get("publishedAt"), a.get("description", ""), publisher=(a.get("source") or {}).get("name")) for a in data.get("articles", [])]


def fetch_mediastack():
    key = os.getenv("MEDIASTACK_KEY")
    if not key:
        print("  Mediastack: MEDIASTACK_KEY not configured")
        return []
    params = urllib.parse.urlencode({"access_key": key, "keywords": "artificial intelligence,semiconductor,data center,robotics", "languages": "en", "sort": "published_desc", "limit": 100})
    data = fetch_json(f"https://api.mediastack.com/v1/news?{params}") or {}
    return [record("mediastack", a.get("url"), a.get("title"), a.get("url"), a.get("published_at"), a.get("description", ""), publisher=a.get("source")) for a in data.get("data", [])]


def normalize(items, cutoff):
    seen, out = set(), []
    for item in items:
        url = item.get("url", "")
        key = url.split("#", 1)[0].rstrip("/").lower()
        if not key or key in seen:
            continue
        date = item.get("published_at")
        if date:
            try:
                if datetime.fromisoformat(date) < cutoff:
                    continue
            except ValueError:
                pass
        seen.add(key)
        out.append(item)
    return sorted(out, key=lambda i: i.get("published_at") or "", reverse=True)


def main():
    load_local_env()
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=FRESHNESS_HOURS)
    names = tracked_names()
    source_rows = {}
    previous = {}
    try:
        previous = json.loads((ROOT / "data" / "sweep-latest.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        pass
    previous_items = previous.get("items", [])
    history = previous.get("source_fetched_at", {})
    next_history = dict(history)
    collectors = {
        "reddit": lambda: fetch_reddit(int(cutoff.timestamp())),
        "hackernews": lambda: fetch_hn(int(cutoff.timestamp()), names),
        "polymarket": fetch_polymarket,
        "rss": lambda: fetch_rss(cutoff),
        "arxiv": fetch_arxiv,
        "sec_edgar": lambda: fetch_sec(cutoff),
        "github": lambda: fetch_github(cutoff),
        "github_trending": fetch_github_trending,
        "gdelt": fetch_gdelt,
        "newsapi": fetch_newsapi,
        "mediastack": fetch_mediastack,
    }
    for source, collector in collectors.items():
        print(f"collecting {source}...")
        key_is_set = (source == "newsapi" and os.getenv("NEWSAPI_KEY")) or (source == "mediastack" and os.getenv("MEDIASTACK_KEY"))
        if key_is_set:
            last = iso_date(history.get(source))
            if last and now - datetime.fromisoformat(last) < timedelta(hours=12):
                source_rows[source] = [i for i in previous_items if i.get("source") == source]
                print(f"  using cached {source} results (12-hour request interval)")
                continue
        try:
            source_rows[source] = collector()
        except Exception as exc:
            print(f"  {source} collector failed: {exc}")
            source_rows[source] = []
        if key_is_set:
            next_history[source] = now.isoformat()
        print(f"  {len(source_rows[source])} raw items")
    all_items = normalize([item for rows in source_rows.values() for item in rows], cutoff)
    score_with_jev(all_items, previous_items)
    all_items.sort(key=lambda item: (
        item.get("jev", {}).get("recommended", False),
        item.get("jev", {}).get("relevance_score", -1) if item.get("jev") else -1,
        item.get("published_at") or "",
    ), reverse=True)
    out = {
        "generated_at": now.isoformat(), "window_hours": FRESHNESS_HOURS,
        "collection_mode": "deterministic_api_and_feeds_no_web_search_with_optional_jev_scoring",
        "source_fetched_at": next_history,
        "counts": {source: len(rows) for source, rows in source_rows.items()},
        "items": all_items,
        # Compatibility fields for the existing brief routine while it is migrated.
        "reddit": source_rows["reddit"], "hn": source_rows["hackernews"],
        "polymarket": source_rows["polymarket"],
    }
    out_path = ROOT / "data" / "sweep-latest.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {len(all_items)} unique items to {out_path}")


if __name__ == "__main__":
    main()
