import Link from 'next/link';
import { getLatestBrief, getBriefNeighbors } from '../lib/vault';
import { briefLabel, cap, fmtDate } from '../lib/format';

export default function HomePage() {
  const brief = getLatestBrief();

  if (!brief) {
    return <div className="empty">No briefs yet.</div>;
  }

  const { older } = getBriefNeighbors(brief.slug);
  const people = (brief.data.people as string[]) || [];
  const companies = (brief.data.companies as string[]) || [];
  const topics = (brief.data.topics as string[]) || [];

  return (
    <article>
      <div className="eyebrow">Latest brief · {cap(brief.data.session as string)}</div>
      <h1 className="pagetitle">{fmtDate(brief.data.date as string, true)}</h1>
      <div className="subtitle">
        {people.length} people · {companies.length} companies · {topics.length} topics
      </div>
      <div className="prose" dangerouslySetInnerHTML={{ __html: brief.html }} />
      <nav className="brief-nav" aria-label="Brief navigation">
        {older ? (
          <Link href={`/briefs/${older.slug}`}>
            <small>Older brief</small>
            <span>{briefLabel(older)}</span>
          </Link>
        ) : <span />}
        <Link href="/briefs" className="next">
          <small>All briefs</small>
          <span>Browse archive</span>
        </Link>
      </nav>
    </article>
  );
}

export const revalidate = 300;
