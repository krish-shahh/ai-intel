import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBrief, getAllBriefSlugs, getBriefNeighbors } from '../../../lib/vault';
import { briefLabel, cap, fmtDate } from '../../../lib/format';

export function generateStaticParams() {
  return getAllBriefSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const brief = getBrief(slug);
  if (!brief) return {};
  return { title: `${briefLabel(brief)} · ai-intel` };
}

export default async function BriefPage({ params }) {
  const { slug } = await params;
  const brief = getBrief(slug);
  if (!brief) notFound();

  const { older, newer } = getBriefNeighbors(slug);

  return (
    <article>
      <div className="eyebrow">{cap(brief.data.session)} brief</div>
      <h1 className="pagetitle">{fmtDate(brief.data.date, true)}</h1>
      <div className="subtitle">
        {(brief.data.people || []).length} people · {(brief.data.companies || []).length} companies · {(brief.data.topics || []).length} topics
      </div>
      <div className="prose" dangerouslySetInnerHTML={{ __html: brief.html }} />
      <nav className="brief-nav" aria-label="Brief navigation">
        {older ? (
          <Link href={`/briefs/${older.slug}`}>
            <small>Older brief</small>
            <span>{briefLabel(older)}</span>
          </Link>
        ) : <span />}
        {newer ? (
          <Link href={`/briefs/${newer.slug}`} className="next">
            <small>Newer brief</small>
            <span>{briefLabel(newer)}</span>
          </Link>
        ) : <span />}
      </nav>
    </article>
  );
}
