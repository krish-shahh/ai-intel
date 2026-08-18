import { CollectionList } from '../collection-list';

export const metadata = { title: 'People · ai-intel' };

export default function PeoplePage() {
  return <CollectionList name="people" heading="People" />;
}
