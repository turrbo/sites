"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface FeaturedListing {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  featured?: boolean;
  shortDescription?: string;
}

interface NearbyResult {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  featured?: boolean;
  distance: number;
}

interface Props {
  featuredListings: FeaturedListing[];
}

export default function NearbyListings({ featuredListings }: Props) {
  const [nearbyResults, setNearbyResults] = useState<NearbyResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFindNearby() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `/api/nearby?lat=${latitude}&lng=${longitude}`
          );
          const data = await res.json();
          setNearbyResults(data.listings || []);
        } catch {
          setError("Failed to find nearby listings. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access was denied. Please enable location permissions and try again.");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function handleShowAll() {
    setNearbyResults(null);
    setError(null);
  }

  const showingNearby = nearbyResults !== null;
  const displayListings = showingNearby ? nearbyResults : featuredListings;

  return (
    <section className="py-10 sm:py-16 bg-white" id="featured">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {showingNearby ? "Auto Care Shops Near You" : "Featured Listings"}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {showingNearby
                ? `${nearbyResults.length} companies found near your location`
                : "Top-rated auto detailing, tinting, and wrap shops in Orlando"}
            </p>
          </div>
          <div className="flex-shrink-0">
            {showingNearby ? (
              <button
                onClick={handleShowAll}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Show All Featured
              </button>
            ) : (
              <button
                onClick={handleFindNearby}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Finding...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Find Near Me
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {showingNearby && nearbyResults.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600 mb-4">
              No listings found within 75 miles of your location yet.
            </p>
            <Link
              href="/browse"
              className="inline-block px-6 py-3 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-600 transition-colors"
            >
              Browse All Locations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {displayListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.slug}`}
                className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-amber-200 transition-all duration-200"
              >
                {listing.imageUrl ? (
                  <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
                    <Image
                      src={listing.imageUrl}
                      alt={listing.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1 text-sm sm:text-base">
                      {listing.name}
                    </h3>
                    {listing.featured && (
                      <span className="flex-shrink-0 text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {listing.city}, {listing.state}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    {"distance" in listing ? (
                      <span className="text-xs text-amber-600 font-medium">
                        {(listing as NearbyResult).distance.toFixed(1)} miles away
                      </span>
                    ) : (
                      listing.rating ? (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs text-gray-600">{listing.rating.toFixed(1)}</span>
                        </div>
                      ) : <span />
                    )}
                    {listing.reviewCount ? (
                      <span className="text-xs text-gray-400">
                        {listing.reviewCount} reviews
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
