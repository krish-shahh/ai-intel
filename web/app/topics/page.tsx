import type { Metadata } from 'next';
import { CollectionList } from '../collection-list';

export const metadata: Metadata = { title: 'Topics' };

export default function TopicsPage() {
  return <CollectionList name="topics" heading="Topics" />;
}

export const revalidate = 300;
