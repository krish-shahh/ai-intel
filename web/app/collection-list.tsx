import { getCollectionList, type CollectionName, type NoteData } from '../lib/vault';
import { IndexedList, type IndexedItem } from './indexed-list';

const TITLE_FIELD: Record<CollectionName, string> = { briefs: 'date', people: 'name', companies: 'name', topics: 'title' };
const SUBTITLE: Partial<Record<CollectionName, (data: NoteData) => string>> = {
  people: (data) => (data.handle as string) || '',
  companies: (data) => [data.ticker, data.layer].filter(Boolean).join(' · '),
  topics: () => '',
};
const PLACEHOLDER: Record<CollectionName, string> = {
  briefs: 'Search briefs',
  people: 'Search people',
  companies: 'Search companies',
  topics: 'Search topics',
};

function groupLetter(title: string): string {
  const ch = title.trim()[0]?.toUpperCase() || '#';
  return /[A-Z]/.test(ch) ? ch : '#';
}

export function CollectionList({ name, heading }: { name: CollectionName; heading: string }) {
  const items = getCollectionList(name);
  const titleField = TITLE_FIELD[name];
  const subtitle = SUBTITLE[name];

  const indexed: IndexedItem[] = items.map((item) => {
    const title = (item.data[titleField] as string) || item.slug;
    return {
      slug: item.slug,
      href: `/${name}/${item.slug}`,
      title,
      subtitle: subtitle?.(item.data) || undefined,
      group: groupLetter(title),
    };
  });

  return (
    <>
      <h1 className="pagetitle">{heading}</h1>
      {items.length === 0 ? (
        <div className="empty">Nothing tracked yet.</div>
      ) : (
        <IndexedList items={indexed} placeholder={PLACEHOLDER[name]} />
      )}
    </>
  );
}
