"use client";

import { useState } from "react";
import Link from "next/link";

interface NearbyListing {
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

export default function NearbyListings() {
  const [listings, setListings] = useState<NearbyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

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
          setListings(data.listings || []);
          setSearched(true);
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

  if (!searched) {
    return (
      <section className="py-10 sm:py-16 bg-gray-50">
        <div className="container text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Find Garage Door Repair Near You
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Share your location to see top-rated companies in your area
          </p>
          <button
            onClick={handleFindNearby}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Finding nearby...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Find Near Me
              </>
            )}
          </button>
          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section className="py-10 sm:py-16 bg-gray-50">
        <div className="container text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            No Listings Found Nearby
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            We don&apos;t have listings within 75 miles of your location yet.
          </p>
          <Link
            href="/browse"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Locations
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-16 bg-gray-50">
      <div className="container">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          Garage Door Repair Near You
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          {listings.length} companies found within 75 miles of your location
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listing/${listing.slug}`}
              className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              {listing.imageUrl && (
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={listing.imageUrl}
                    alt={listing.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
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
                  <span className="text-xs text-blue-600 font-medium">
                    {listing.distance.toFixed(1)} miles away
                  </span>
                  {listing.rating && (
                    <span className="text-xs text-gray-500">
                      {listing.rating.toFixed(1)} ({listing.reviewCount} reviews)
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
