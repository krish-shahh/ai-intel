#!/usr/bin/env python3
"""Deterministic web sweep for ai-intel: Reddit, Hacker News, Polymarket.

Pure HTTP fetch + filter, no LLM involved. Writes data/sweep-latest.json,
which the morning/evening brief routines read instead of redoing these
same raw fetches themselves every run.
"""
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FRESHNESS_HOURS = 14
UA = "ai-intel-sweep/1.0 (github actions; github.com/krish-shahh/ai-intel)"

SUBREDDITS = [
    "LocalLLaMA", "LocalLLM", "ollama", "SillyTavern", "StableDiffusion", "comfyui",
    "AI_Agents", "LLMDevs", "ChatGPTCoding", "cursor", "LangChain", "RAG",
    "ClaudeAI", "Anthropic", "OpenAI", "OpenAIDev", "GeminiAI", "MistralAI",
    "grok", "perplexity_ai", "MachineLearning", "deeplearning", "artificial",
    "singularity", "accelerate", "agi",
]
HN_TERMS = ["AI agent", "LLM", "Claude", "Anthropic", "OpenAI", "machine learning"]


def fetch_json(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  skip {url}: {e}")
        return None


def tracked_names():
    names = []
    for f in (ROOT / "people").glob("*.md"):
        text = f.read_text(encoding="utf-8")
        m = re.search(r"^name:\s*(.+)$", text, re.MULTILINE)
        if m:
            names.append(m.group(1).strip())
    return names


def sweep_reddit(cutoff_ts):
    seen, items = set(), []
    for sub in SUBREDDITS:
        for endpoint in (f"r/{sub}/new.json?limit=50", f"r/{sub}/top.json?t=day&limit=25"):
            data = fetch_json(f"https://www.reddit.com/{endpoint}")
            time.sleep(1)
            if not data:
                continue
            for child in data.get("data", {}).get("children", []):
                d = child.get("data", {})
                pid = d.get("id")
                if not pid or pid in seen:
                    continue
                if (d.get("created_utc") or 0) < cutoff_ts:
                    continue
                seen.add(pid)
                items.append({
                    "subreddit": sub,
                    "title": d.get("title"),
                    "permalink": "https://www.reddit.com" + (d.get("permalink") or ""),
                    "url": d.get("url"),
                    "score": d.get("score"),
                    "num_comments": d.get("num_comments"),
                    "created_utc": d.get("created_utc"),
                })
    return items


def sweep_hn(cutoff_ts, extra_terms):
    seen, items = set(), []
    for term in HN_TERMS + extra_terms:
        q = urllib.parse.quote(term)
        data = fetch_json(f"https://hn.algolia.com/api/v1/search?query={q}&tags=story&hitsPerPage=20")
        time.sleep(0.3)
        if not data:
            continue
        for hit in data.get("hits", []):
            oid = hit.get("objectID")
            if not oid or oid in seen:
                continue
            points, comments = hit.get("points") or 0, hit.get("num_comments") or 0
            if points < 10 and comments < 5:
                continue
            if (hit.get("created_at_i") or 0) < cutoff_ts:
                continue
            seen.add(oid)
            items.append({
                "title": hit.get("title"),
                "url": hit.get("url") or f"https://news.ycombinator.com/item?id={oid}",
                "hn_thread": f"https://news.ycombinator.com/item?id={oid}",
                "points": points,
                "num_comments": comments,
                "created_at": hit.get("created_at"),
                "matched_term": term,
            })
    return items


def sweep_polymarket():
    data = fetch_json("https://gamma-api.polymarket.com/markets?active=true&limit=50&q=AI")
    if not data:
        return []
    rows = data if isinstance(data, list) else data.get("markets", [])
    items = []
    for m in rows:
        try:
            volume = float(m.get("volume") or 0)
        except (TypeError, ValueError):
            volume = 0
        if volume <= 10000:
            continue
        items.append({
            "question": m.get("question"),
            "outcomePrices": m.get("outcomePrices"),
            "volume": volume,
            "slug": m.get("slug"),
        })
    return items


def main():
    now = datetime.now(timezone.utc)
    cutoff_ts = int((now - timedelta(hours=FRESHNESS_HOURS)).timestamp())

    names = tracked_names()
    print(f"tracked names: {len(names)}")

    print("sweeping reddit...")
    reddit_items = sweep_reddit(cutoff_ts)
    print(f"  {len(reddit_items)} fresh reddit posts")

    print("sweeping hacker news...")
    hn_items = sweep_hn(cutoff_ts, names)
    print(f"  {len(hn_items)} fresh hn stories")

    print("checking polymarket...")
    poly_items = sweep_polymarket()
    print(f"  {len(poly_items)} actionable markets")

    out = {
        "generated_at": now.isoformat(),
        "window_hours": FRESHNESS_HOURS,
        "reddit": reddit_items,
        "hn": hn_items,
        "polymarket": poly_items,
    }
    out_path = ROOT / "data" / "sweep-latest.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
