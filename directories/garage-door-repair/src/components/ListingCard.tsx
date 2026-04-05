import Link from 'next/link';
import Image from 'next/image';
import { Listing } from '@/lib/types';

interface Props {
  listing: Listing;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
}

export default function ListingCard({ listing }: Props) {
  const rawText = listing.shortDescription || listing.description;
  const displayText = stripHtml(rawText);
  const truncated = displayText.length > 120 ? displayText.slice(0, 120).trimEnd() + '…' : displayText;

  return (
    <Link
      href={`/listing/${listing.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {listing.featured && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">{listing.category}</span>

        {/* Name */}
        <h3 className="mt-1 text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {listing.name}
        </h3>

        {/* Location */}
        <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {listing.city}, {listing.state}
        </p>

        {/* Rating */}
        {listing.rating != null && (
          <div className="mt-2 flex items-center gap-1.5">
            <StarRating rating={listing.rating} />
            <span className="text-xs text-gray-500">
              {listing.rating.toFixed(1)}
              {listing.reviewCount != null && ` (${listing.reviewCount})`}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{truncated}</p>
      </div>
    </Link>
  );
}
