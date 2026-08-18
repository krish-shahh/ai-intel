import type { Metadata } from 'next';
import { CollectionDetail } from '../../collection-detail';
import { getCollectionList, getCollectionItem } from '../../../lib/vault';

export function generateStaticParams() {
  return getCollectionList('topics').map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getCollectionItem('topics', slug);
  return item ? { title: `${item.data.title || slug} · ai-intel` } : {};
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CollectionDetail name="topics" slug={slug} />;
}

export const revalidate = 300;
