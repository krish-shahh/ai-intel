import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBrief, getAllBriefSlugs, getBriefNeighbors } from '../../../lib/vault';
import { briefLabel, cap, fmtDate } from '../../../lib/format';

export function generateStaticParams() {
  return getAllBriefSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brief = getBrief(slug);
  if (!brief) return {};
  return { title: `${briefLabel(brief)} · ai-intel` };
}

export default async function BriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brief = getBrief(slug);
  if (!brief) notFound();

  const { older, newer } = getBriefNeighbors(slug);
  const people = (brief.data.people as string[]) || [];
  const companies = (brief.data.companies as string[]) || [];
  const topics = (brief.data.topics as string[]) || [];

  return (
    <article>
      <div className="eyebrow">{cap(brief.data.session as string)} brief</div>
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

export const revalidate = 300;
