import { getCollectionItem } from '../lib/vault';
import { notFound } from 'next/navigation';

const TITLE_FIELD = { people: 'name', companies: 'name', topics: 'title' };

export function CollectionDetail({ name, slug }) {
  const item = getCollectionItem(name, slug);
  if (!item) notFound();

  const titleField = TITLE_FIELD[name];
  const title = item.data[titleField] || item.slug;

  return (
    <>
      <div className="eyebrow">{name === 'people' ? 'Person' : name === 'companies' ? 'Company' : 'Topic'}</div>
      <h1 className="pagetitle">{title}</h1>
      {item.data.handle && (
        <div className="subtitle">
          <a href={`https://x.com/${String(item.data.handle).replace(/^@/, '')}`} target="_blank" rel="noreferrer">
            {item.data.handle}
          </a>
        </div>
      )}
      {(item.data.ticker || item.data.layer) && (
        <div className="chips" style={{ marginBottom: 18 }}>
          {item.data.ticker && <span className="chip">{item.data.ticker}</span>}
          {item.data.layer && <span className="chip">{item.data.layer}</span>}
        </div>
      )}
      <article className="prose" dangerouslySetInnerHTML={{ __html: item.html }} />
    </>
  );
}
