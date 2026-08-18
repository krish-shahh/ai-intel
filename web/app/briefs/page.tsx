import type { Metadata } from 'next';
import { getRecentBriefs } from '../../lib/vault';
import { briefLabel } from '../../lib/format';
import { IndexedList, type IndexedItem } from '../indexed-list';

export const metadata: Metadata = { title: 'Briefs · ai-intel' };

function monthLabel(date?: string): string {
  if (!date) return 'Undated';
  const dt = new Date(date + 'T12:00:00');
  if (isNaN(dt.getTime())) return 'Undated';
  return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function monthShort(date?: string): string {
  if (!date) return '?';
  const dt = new Date(date + 'T12:00:00');
  if (isNaN(dt.getTime())) return '?';
  return dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

export default function BriefsPage() {
  const briefs = getRecentBriefs(500);

  const indexed: IndexedItem[] = briefs.map((b) => {
    const people = (b.data.people as string[]) || [];
    const companies = (b.data.companies as string[]) || [];
    const topics = (b.data.topics as string[]) || [];
    return {
      slug: b.slug,
      href: `/briefs/${b.slug}`,
      title: briefLabel(b),
      subtitle: `${people.length} people · ${companies.length} companies · ${topics.length} topics`,
      group: monthLabel(b.data.date as string),
      groupShort: monthShort(b.data.date as string),
    };
  });

  return (
    <div>
      <div className="eyebrow">Archive</div>
      <h1 className="pagetitle">Briefs</h1>
      <div className="subtitle">{briefs.length} briefs, newest first</div>
      {briefs.length === 0 ? (
        <div className="empty">No briefs yet.</div>
      ) : (
        <IndexedList items={indexed} placeholder="Search briefs" />
      )}
    </div>
  );
}

export const revalidate = 300;
