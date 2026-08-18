import Link from 'next/link';
import { getRecentBriefs } from '../../lib/vault';
import { briefLabel } from '../../lib/format';

export const metadata = { title: 'Briefs · ai-intel' };

export default function BriefsPage() {
  const briefs = getRecentBriefs(500);

  return (
    <div>
      <div className="eyebrow">Archive</div>
      <h1 className="pagetitle">Briefs</h1>
      <div className="subtitle">{briefs.length} briefs, newest first</div>
      {briefs.length === 0 && <div className="empty">No briefs yet.</div>}
      {briefs.map((b) => (
        <Link key={b.slug} href={`/briefs/${b.slug}`} className="list-row">
          <div className="title">{briefLabel(b)}</div>
          <div className="meta">
            {(b.data.people || []).length} people · {(b.data.companies || []).length} companies · {(b.data.topics || []).length} topics
          </div>
        </Link>
      ))}
    </div>
  );
}
