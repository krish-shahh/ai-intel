import { CollectionList } from '../collection-list';

export const metadata = { title: 'Topics · ai-intel' };

export default function TopicsPage() {
  return <CollectionList name="topics" heading="Topics" />;
}

export const revalidate = 300;
