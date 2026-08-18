import type { Metadata } from 'next';
import { CollectionDetail } from '../../collection-detail';
import { getCollectionList, getCollectionItem } from '../../../lib/vault';

export function generateStaticParams() {
  return getCollectionList('companies').map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getCollectionItem('companies', slug);
  return item ? { title: `${item.data.name || slug} · ai-intel` } : {};
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CollectionDetail name="companies" slug={slug} />;
}

export const revalidate = 300;
