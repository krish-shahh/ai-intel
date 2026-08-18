import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import MarkdownIt from 'markdown-it';
import multimdTable from 'markdown-it-multimd-table';
import markdownItAttrs from 'markdown-it-attrs';

const COLLECTIONS = ['briefs', 'people', 'companies', 'topics'];

// Frontmatter here isn't always valid YAML (e.g. unquoted @handles), so this
// mirrors the desktop app's lightweight regex parser (app/main.js) rather than
// a strict YAML library — same behavior across both readers.
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\s*([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    const k = mm[1];
    const v = mm[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      data[k] = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      data[k] = v.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2] };
}

function resolveVaultRoot() {
  const candidates = [path.resolve(process.cwd(), '..'), process.cwd()];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'briefs')) && fs.existsSync(path.join(c, 'people'))) return c;
  }
  return candidates[0];
}

const VAULT_ROOT = resolveVaultRoot();

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })
  .use(multimdTable, { multiline: false, rowspan: false, headerless: false, multibody: true })
  .use(markdownItAttrs);

function wikilinksToHref(body, slugIndex) {
  return body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, slug, label) => {
    const s = slug.trim();
    const target = slugIndex[s];
    const text = (label || s).trim();
    if (!target) return text;
    return `[${text}](/${target}/${s})`;
  });
}

function readCollection(name) {
  const dir = path.join(VAULT_ROOT, name);
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (e) { return []; }
  return files.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    return { collection: name, slug, data, rawBody: body };
  });
}

// Wrapped in React's cache() so repeated calls within one render pass share a
// single fs read, but nothing persists across requests/revalidations — a
// deployment's filesystem is a frozen snapshot, so cross-request memoization
// would just mean revalidate never actually picks up anything.
const loadAll = cache(function loadAll() {
  const byCollection = {};
  for (const name of COLLECTIONS) byCollection[name] = readCollection(name);

  const slugIndex = {};
  for (const name of COLLECTIONS) {
    for (const note of byCollection[name]) {
      if (!slugIndex[note.slug]) slugIndex[note.slug] = name;
    }
  }

  for (const name of COLLECTIONS) {
    for (const note of byCollection[name]) {
      const withLinks = wikilinksToHref(note.rawBody, slugIndex);
      note.html = md.render(withLinks);
    }
  }

  byCollection.briefs.sort((a, b) => (b.data.date || '').localeCompare(a.data.date || '') || b.slug.localeCompare(a.slug));
  byCollection.people.sort((a, b) => (a.data.name || a.slug).localeCompare(b.data.name || b.slug));
  byCollection.companies.sort((a, b) => (a.data.name || a.slug).localeCompare(b.data.name || b.slug));
  byCollection.topics.sort((a, b) => (a.data.title || a.slug).localeCompare(b.data.title || b.slug));

  let watchlistHtml = '';
  try {
    const raw = fs.readFileSync(path.join(VAULT_ROOT, 'WATCHLIST.md'), 'utf8');
    watchlistHtml = md.render(wikilinksToHref(raw, slugIndex));
  } catch (e) { /* optional */ }

  return { byCollection, slugIndex, watchlistHtml };
});

export function getLatestBrief() {
  return loadAll().byCollection.briefs[0] || null;
}

export function getRecentBriefs(n = 8) {
  return loadAll().byCollection.briefs.slice(0, n);
}

export function getAllBriefSlugs() {
  return loadAll().byCollection.briefs.map((b) => b.slug);
}

export function getBrief(slug) {
  return loadAll().byCollection.briefs.find((b) => b.slug === slug) || null;
}

export function getCollectionList(name) {
  return loadAll().byCollection[name] || [];
}

export function getCollectionItem(name, slug) {
  return (loadAll().byCollection[name] || []).find((n) => n.slug === slug) || null;
}

export function getCollectionSlugs(name) {
  return (loadAll().byCollection[name] || []).map((n) => n.slug);
}

export function getMentionCounts(field) {
  const counts = {};
  for (const b of loadAll().byCollection.briefs) {
    for (const s of b.data[field] || []) counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}

export function getWatchlistHtml() {
  return loadAll().watchlistHtml;
}

export function getBriefNeighbors(slug) {
  const briefs = loadAll().byCollection.briefs;
  const i = briefs.findIndex((b) => b.slug === slug);
  if (i < 0) return { older: null, newer: null };
  return { older: briefs[i + 1] || null, newer: briefs[i - 1] || null };
}
