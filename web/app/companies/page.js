import { CollectionList } from '../collection-list';

export const metadata = { title: 'Companies · ai-intel' };

export default function CompaniesPage() {
  return <CollectionList name="companies" heading="Companies" />;
}

export const revalidate = 300;
