'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GraphData, GraphNode, GraphNodeType } from '../../lib/graph-data';
import { createForceGraph, type ForceGraphHandle } from './force-graph';

const TYPE_LABEL: Record<GraphNodeType, string> = { brief: 'Briefs', person: 'People', company: 'Companies', topic: 'Topics' };
const RANGES = [
  { key: '30', label: '30d' },
  { key: '90', label: '90d' },
  { key: 'all', label: 'All' },
] as const;

export function GraphView({ data }: { data: GraphData }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<ForceGraphHandle | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('30');
  const [hidden, setHidden] = useState<Set<GraphNodeType>>(new Set());
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const filtered = useMemo(() => {
    if (range === 'all') return data;
    const cutoff = new Date(Date.now() - Number(range) * 86400000).toISOString().slice(0, 10);
    const keepBriefIds = new Set(
      data.nodes.filter((n) => n.type === 'brief' && (!n.date || n.date >= cutoff)).map((n) => n.id)
    );
    const links = data.links.filter((l) => keepBriefIds.has(l.source));
    const referenced = new Set<string>();
    links.forEach((l) => referenced.add(l.target));
    const nodes = data.nodes.filter((n) => (n.type === 'brief' ? keepBriefIds.has(n.id) : referenced.has(n.id)));
    return { nodes, links };
  }, [data, range]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cs = getComputedStyle(document.documentElement);
    const colors: Record<string, string> = {
      brief: cs.getPropertyValue('--brief').trim(),
      person: cs.getPropertyValue('--person').trim(),
      company: cs.getPropertyValue('--company').trim(),
      topic: cs.getPropertyValue('--topic').trim(),
    };
    const handle = createForceGraph(
      canvasRef.current,
      filtered,
      colors,
      (node) => setSelected(node),
      () => {}
    );
    handleRef.current = handle;
    return () => handle.destroy();
  }, [filtered]);

  function toggleType(t: GraphNodeType) {
    handleRef.current?.toggleType(t);
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  if (data.nodes.length === 0) {
    return <div className="empty">Nothing to graph yet.</div>;
  }

  return (
    <div className="graph-page">
      <div className="graph-toolbar">
        <div className="range-switch">
          {RANGES.map((r) => (
            <button key={r.key} type="button" className={range === r.key ? 'active' : ''} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
        <button type="button" className="graph-reset" onClick={() => handleRef.current?.fit()}>Fit</button>
      </div>

      <div className="graph-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>

      <div className="graph-legend">
        {(Object.keys(TYPE_LABEL) as GraphNodeType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={hidden.has(t) ? 'legend-chip legend-off' : 'legend-chip'}
            onClick={() => toggleType(t)}
          >
            <span className="legend-dot" style={{ background: `var(--${t})` }} />
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {selected && (
        <div className="graph-sheet-backdrop" onClick={() => setSelected(null)}>
          <div className="graph-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="graph-sheet-handle" />
            <div className="lbl">{TYPE_LABEL[selected.type].replace(/s$/, '')}</div>
            <div className="graph-sheet-title">{selected.label}</div>
            <div className="graph-sheet-actions">
              <button type="button" className="graph-sheet-open" onClick={() => router.push(selected.href)}>Open</button>
              <button type="button" className="graph-sheet-close" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
