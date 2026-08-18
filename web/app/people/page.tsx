import type { Metadata } from 'next';
import { CollectionList } from '../collection-list';

export const metadata: Metadata = { title: 'People · ai-intel' };

export default function PeoplePage() {
  return <CollectionList name="people" heading="People" />;
}

export const revalidate = 300;
