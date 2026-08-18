import type { Metadata } from 'next';
import { getAllNotes } from '../../lib/vault';
import { buildGraphData } from '../../lib/graph-data';
import { GraphView } from './graph-view';

export const metadata: Metadata = { title: 'Graph · ai-intel' };

export default function GraphPage() {
  const data = buildGraphData(getAllNotes());
  return (
    <>
      <h1 className="pagetitle graph-title">Graph</h1>
      <GraphView data={data} />
    </>
  );
}

export const revalidate = 300;
