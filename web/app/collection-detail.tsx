import { notFound } from 'next/navigation';
import { getCollectionItem, type CollectionName } from '../lib/vault';

const TITLE_FIELD: Record<CollectionName, string> = { briefs: 'date', people: 'name', companies: 'name', topics: 'title' };
const KIND_LABEL: Record<CollectionName, string> = { briefs: 'Brief', people: 'Person', companies: 'Company', topics: 'Topic' };

export function CollectionDetail({ name, slug }: { name: CollectionName; slug: string }) {
  const item = getCollectionItem(name, slug);
  if (!item) notFound();

  const titleField = TITLE_FIELD[name];
  const title = (item.data[titleField] as string) || item.slug;
  const handle = item.data.handle as string | undefined;
  const ticker = item.data.ticker as string | undefined;
  const layer = item.data.layer as string | undefined;

  return (
    <>
      <div className="eyebrow">{KIND_LABEL[name]}</div>
      <h1 className="pagetitle">{title}</h1>
      {handle && (
        <div className="subtitle">
          <a href={`https://x.com/${handle.replace(/^@/, '')}`} target="_blank" rel="noreferrer">
            {handle}
          </a>
        </div>
      )}
      {(ticker || layer) && (
        <div className="chips" style={{ marginBottom: 18 }}>
          {ticker && <span className="chip">{ticker}</span>}
          {layer && <span className="chip">{layer}</span>}
        </div>
      )}
      <article className="prose" dangerouslySetInnerHTML={{ __html: item.html }} />
    </>
  );
}
