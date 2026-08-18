import type { Note } from './vault';

export type GraphNodeType = 'brief' | 'person' | 'company' | 'topic';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  href: string;
  date?: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// A flat graph (briefs <-> the people/companies/topics they mention) rather than
// the desktop app's month/week cluster hierarchy — that drill-down was designed
// for a big canvas and a precise mouse pointer; on a phone screen a single flat
// layout plus a date-range filter reads better and needs no expand/collapse.
export function buildGraphData(notes: Note[]): GraphData {
  const nodes: GraphNode[] = [];
  const nodeIds = new Set<string>();
  const links: GraphLink[] = [];

  const add = (id: string, label: string, type: GraphNodeType, href: string, date?: string) => {
    if (nodeIds.has(id)) return;
    nodeIds.add(id);
    nodes.push({ id, label, type, href, date });
  };

  for (const n of notes) {
    if (n.collection === 'people') add(`person:${n.slug}`, (n.data.name as string) || n.slug, 'person', `/people/${n.slug}`);
    if (n.collection === 'companies') add(`company:${n.slug}`, (n.data.name as string) || n.slug, 'company', `/companies/${n.slug}`);
    if (n.collection === 'topics') add(`topic:${n.slug}`, (n.data.title as string) || n.slug, 'topic', `/topics/${n.slug}`);
  }

  for (const n of notes) {
    if (n.collection !== 'briefs') continue;
    const date = n.data.date as string | undefined;
    add(`brief:${n.slug}`, n.slug, 'brief', `/briefs/${n.slug}`, date);

    const refs = [
      ...(((n.data.people as string[]) || []).map((s) => `person:${s}`)),
      ...(((n.data.companies as string[]) || []).map((s) => `company:${s}`)),
      ...(((n.data.topics as string[]) || []).map((s) => `topic:${s}`)),
    ];
    for (const ref of refs) {
      if (nodeIds.has(ref)) links.push({ source: `brief:${n.slug}`, target: ref });
    }
  }

  const linked = new Set<string>();
  for (const l of links) { linked.add(l.source); linked.add(l.target); }
  const finalNodes = nodes.filter((n) => n.type === 'brief' || linked.has(n.id));

  return { nodes: finalNodes, links };
}
