import Link from 'next/link';
import { getCollectionList, type CollectionName, type NoteData } from '../lib/vault';

const TITLE_FIELD: Record<CollectionName, string> = { briefs: 'date', people: 'name', companies: 'name', topics: 'title' };
const SUBTITLE: Partial<Record<CollectionName, (data: NoteData) => string>> = {
  people: (data) => (data.handle as string) || '',
  companies: (data) => [data.ticker, data.layer].filter(Boolean).join(' · '),
  topics: () => '',
};

export function CollectionList({ name, heading }: { name: CollectionName; heading: string }) {
  const items = getCollectionList(name);
  const titleField = TITLE_FIELD[name];
  const subtitle = SUBTITLE[name];

  return (
    <>
      <h1 className="pagetitle">{heading}</h1>
      {items.length === 0 && <div className="empty">Nothing tracked yet.</div>}
      {items.map((item) => (
        <Link key={item.slug} href={`/${name}/${item.slug}`} className="list-row">
          <div className="title">{(item.data[titleField] as string) || item.slug}</div>
          {subtitle?.(item.data) ? <div className="meta">{subtitle(item.data)}</div> : null}
        </Link>
      ))}
    </>
  );
}
