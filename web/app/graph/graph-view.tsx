'use client';

import { useMemo, useState } from 'react';
import type { GraphData, GraphNode, GraphNodeType } from '../../lib/graph-data';

const TYPE_LABEL: Record<GraphNodeType, string> = { brief: 'Briefs', person: 'People', company: 'Companies', topic: 'Topics' };
const ENTITY_TYPES: GraphNodeType[] = ['person', 'company', 'topic'];
const RANGES = [
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
  { key: 'all', label: 'All' },
] as const;
const shortDate = (value?: string) => value
  ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
  : 'Undated';

export function GraphView({ data }: { data: GraphData }) {
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('30');
  const [focusId, setFocusId] = useState('');
  const [typeFilter, setTypeFilter] = useState<GraphNodeType | 'all'>('all');

  const model = useMemo(() => {
    const cutoff = range === 'all' ? null : new Date(Date.now() - Number(range) * 86400000).toISOString().slice(0, 10);
    const nodes = new Map(data.nodes.map((node) => [node.id, node]));
    const briefs = new Map(data.nodes
      .filter((node) => node.type === 'brief' && (!cutoff || !node.date || node.date >= cutoff))
      .map((node) => [node.id, node]));
    const entities = data.nodes.filter((node) => node.type !== 'brief');
    const byBrief = new Map<string, GraphNode[]>();
    const degree = new Map<string, number>();

    for (const link of data.links) {
      if (!briefs.has(link.source)) continue;
      const entity = nodes.get(link.target);
      if (!entity || entity.type === 'brief') continue;
      byBrief.set(link.source, [...(byBrief.get(link.source) ?? []), entity]);
      degree.set(entity.id, (degree.get(entity.id) ?? 0) + 1);
    }

    const ranked = [...entities].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.label.localeCompare(b.label));
    return { briefs, byBrief, degree, ranked };
  }, [data, range]);

  const focus = model.ranked.find((node) => node.id === focusId) ?? model.ranked[0] ?? null;
  const related = useMemo(() => {
    if (!focus) return [];
    const evidenceByEntity = new Map<string, { node: GraphNode; briefs: GraphNode[] }>();
    for (const [briefId, entities] of model.byBrief) {
      if (!entities.some((entity) => entity.id === focus.id)) continue;
      const brief = model.briefs.get(briefId);
      if (!brief) continue;
      for (const entity of entities) {
        if (entity.id === focus.id || entity.type === 'brief') continue;
        const item = evidenceByEntity.get(entity.id) ?? { node: entity, briefs: [] };
        item.briefs.push(brief);
        evidenceByEntity.set(entity.id, item);
      }
    }
    return [...evidenceByEntity.values()]
      .filter((item) => typeFilter === 'all' || item.node.type === typeFilter)
      .sort((a, b) => b.briefs.length - a.briefs.length || a.node.label.localeCompare(b.node.label));
  }, [focus, model, typeFilter]);

  const groups = ENTITY_TYPES.map((type) => ({
    type,
    items: related.filter((item) => item.node.type === type),
  })).filter((group) => group.items.length > 0);

  function chooseEntity(node: GraphNode) {
    setFocusId(node.id);
    setTypeFilter('all');
  }

  if (model.ranked.length === 0) return <div className="empty">Nothing to connect yet.</div>;

  return (
    <div className="graph-page">
      <div className="graph-explore-bar">
        <label className="graph-search-label" htmlFor="graph-entity-select">Explore from</label>
        <select
          id="graph-entity-select"
          className="graph-select"
          value={focus?.id ?? ''}
          onChange={(event) => {
            const node = model.ranked.find((entity) => entity.id === event.target.value);
            if (node) chooseEntity(node);
          }}
        >
          {ENTITY_TYPES.map((type) => (
            <optgroup key={type} label={TYPE_LABEL[type]}>
              {model.ranked.filter((node) => node.type === type).map((node) => (
                <option key={node.id} value={node.id}>{node.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="graph-toolbar">
        <div className="range-switch" aria-label="Connection time range">
          {RANGES.map((item) => (
            <button key={item.key} type="button" className={range === item.key ? 'text-control is-active' : 'text-control'} onClick={() => setRange(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        {focus && <span className="graph-count">{model.degree.get(focus.id) ?? 0} briefs mention this</span>}
      </div>

      {focus && (
        <div className="relation-map">
          <div className="relation-root">
            <span className={`relation-type ${focus.type}`}>{TYPE_LABEL[focus.type].replace(/s$/, '')}</span>
            <a href={focus.href} className="relation-root-link">{focus.label}</a>
            <span className="relation-root-note">Shared coverage connects this to</span>
          </div>

          <div className="relation-filter" aria-label="Filter connected entities">
            {(['all', ...ENTITY_TYPES] as const).map((type) => (
              <button key={type} type="button" className={typeFilter === type ? 'relation-filter-button is-active' : 'relation-filter-button'} onClick={() => setTypeFilter(type)}>
                {type === 'all' ? 'All connections' : TYPE_LABEL[type]}
              </button>
            ))}
          </div>

          {groups.length ? (
            <div className="relation-groups">
              {groups.map(({ type, items }) => (
                <section className="relation-group" key={type}>
                  <h2><span className={`graph-kind-dot ${type}`} />{TYPE_LABEL[type]} <small>{items.length}</small></h2>
                  <ol className="relation-list">
                    {items.map(({ node, briefs }) => (
                      <li className="relation-item" key={node.id}>
                        <button type="button" className="relation-node" onClick={() => chooseEntity(node)}>
                          <span>{node.label}</span>
                          <small>{briefs.length} {briefs.length === 1 ? 'shared brief' : 'shared briefs'}<span aria-hidden="true"> ↗</span></small>
                        </button>
                        <details className="relation-evidence">
                          <summary>See {briefs.length === 1 ? 'brief' : 'briefs'} behind this link</summary>
                          <ul>
                            {[...briefs].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).map((brief) => (
                              <li key={brief.id}><a href={brief.href}>{shortDate(brief.date)} · {brief.label}</a></li>
                            ))}
                          </ul>
                        </details>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          ) : (
            <p className="relation-empty">No shared briefs connect this entity in the selected range.</p>
          )}
        </div>
      )}
    </div>
  );
}
