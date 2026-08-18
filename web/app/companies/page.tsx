import type { Metadata } from 'next';
import { CollectionList } from '../collection-list';

export const metadata: Metadata = { title: 'Companies · ai-intel' };

export default function CompaniesPage() {
  return <CollectionList name="companies" heading="Companies" />;
}

export const revalidate = 300;
