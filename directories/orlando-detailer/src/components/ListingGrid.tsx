import { Listing } from '@/lib/types';
import ListingCard from '@/components/ListingCard';

interface Props {
  listings: Listing[];
  title?: string;
}

export default function ListingGrid({ listings, title }: Props) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">No listings found.</p>
      </div>
    );
  }

  return (
    <section>
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
