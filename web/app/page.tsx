import Link from 'next/link';
import { briefLabel, cap, fmtDate } from '../lib/format';
import { getBriefNeighbors, getCollectionList, getLatestBrief, getRecentBriefs } from '../lib/vault';

function readingMinutes(text: string): number {
  const words = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export default function HomePage() {
  const brief = getLatestBrief();
  const recent = getRecentBriefs(4);
  const people = getCollectionList('people');
  const companies = getCollectionList('companies');
  const topics = getCollectionList('topics');

  if (!brief) {
    return (
      <section className="empty-state">
        <h1>No brief yet</h1>
        <p>Your next AI and tech digest will appear here.</p>
      </section>
    );
  }

  const neighbors = getBriefNeighbors(brief.slug);
  const peopleInBrief = (brief.data.people as string[]) || [];
  const companiesInBrief = (brief.data.companies as string[]) || [];
  const topicsInBrief = (brief.data.topics as string[]) || [];
  const session = cap(brief.data.session as string) || 'Daily';

  return (
    <div className="reader-home">
      <header className="page-intro">
        <p className="edition-kicker">{session} brief · {fmtDate(brief.data.date as string, true)}</p>
        <h1>Today</h1>
        <p className="edition-meta">About {readingMinutes(brief.rawBody)} minutes to read</p>
      </header>

      <article className="edition-reading">
        <div className="prose edition-prose" dangerouslySetInnerHTML={{ __html: brief.html }} />
        <nav className="edition-pagination" aria-label="Brief navigation">
          {neighbors.older ? <Link href={`/briefs/${neighbors.older.slug}`}>Previous edition</Link> : <span />}
          <Link href="/briefs">All editions</Link>
        </nav>
      </article>

      <section className="reading-index" aria-label="In this edition">
        <h2>In this edition</h2>
        <p>
          <Link href="/people">{peopleInBrief.length} people</Link>
          <span> · </span>
          <Link href="/companies">{companiesInBrief.length} companies</Link>
          <span> · </span>
          <Link href="/topics">{topicsInBrief.length} topics</Link>
        </p>
        <div className="reading-index-counts">
          <Link href="/topics">Browse {topics.length} topics</Link>
          <Link href="/companies">Browse {companies.length} companies</Link>
          <Link href="/people">Browse {people.length} people</Link>
        </div>
      </section>

      {recent.length > 1 && (
        <nav className="recent-editions" aria-label="Recent editions">
          <h2>Recent editions</h2>
          {recent.filter((item) => item.slug !== brief.slug).map((item) => (
            <Link href={`/briefs/${item.slug}`} key={item.slug}>{briefLabel(item)}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}

export const revalidate = 300;
