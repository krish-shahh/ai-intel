import Link from 'next/link';
import { getCollectionList } from '../lib/vault';

const TITLE_FIELD = { people: 'name', companies: 'name', topics: 'title' };
const SUBTITLE = {
  people: (data) => data.handle || '',
  companies: (data) => [data.ticker, data.layer].filter(Boolean).join(' · '),
  topics: () => '',
};

export function CollectionList({ name, heading }) {
  const items = getCollectionList(name);
  const titleField = TITLE_FIELD[name];
  const subtitle = SUBTITLE[name];

  return (
    <>
      <h1 className="pagetitle">{heading}</h1>
      {items.length === 0 && <div className="empty">Nothing tracked yet.</div>}
      {items.map((item) => (
        <Link key={item.slug} href={`/${name}/${item.slug}`} className="list-row">
          <div className="title">{item.data[titleField] || item.slug}</div>
          {subtitle(item.data) && <div className="meta">{subtitle(item.data)}</div>}
        </Link>
      ))}
    </>
  );
}
