import Link from 'next/link';
import type { Metadata } from 'next';
import { getRecentBriefs } from '../../lib/vault';
import { briefLabel } from '../../lib/format';

export const metadata: Metadata = { title: 'Briefs · ai-intel' };

export default function BriefsPage() {
  const briefs = getRecentBriefs(500);

  return (
    <div>
      <div className="eyebrow">Archive</div>
      <h1 className="pagetitle">Briefs</h1>
      <div className="subtitle">{briefs.length} briefs, newest first</div>
      {briefs.length === 0 && <div className="empty">No briefs yet.</div>}
      {briefs.map((b) => {
        const people = (b.data.people as string[]) || [];
        const companies = (b.data.companies as string[]) || [];
        const topics = (b.data.topics as string[]) || [];
        return (
          <Link key={b.slug} href={`/briefs/${b.slug}`} className="list-row">
            <div className="title">{briefLabel(b)}</div>
            <div className="meta">
              {people.length} people · {companies.length} companies · {topics.length} topics
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export const revalidate = 300;
