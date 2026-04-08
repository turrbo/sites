"use client";

import { useState } from "react";
import Link from "next/link";

interface CityGuide {
  title: string;
  slug: string;
  type: string;
}

interface GuideBrowserProps {
  /** All cities that have guides */
  cities: string[];
  /** Map of city name (lowercase) -> guides for that city */
  guidesByCity: Record<string, CityGuide[]>;
}

export default function GuideBrowser({ cities, guidesByCity }: GuideBrowserProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  if (!selectedCity) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city) => {
          const key = city.toLowerCase();
          const count = (guidesByCity[key] || []).length;
          return (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className="group block text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-amber-200 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                    {city}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {count} {count === 1 ? "guide" : "guides"}
                  </p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 bg-gray-100 group-hover:bg-amber-50 text-gray-500 group-hover:text-amber-600 rounded-full transition-colors text-sm">
                  &rarr;
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const key = selectedCity.toLowerCase();
  const guides = guidesByCity[key] || [];

  return (
    <div>
      <button
        onClick={() => setSelectedCity(null)}
        className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800 mb-6 transition-colors"
      >
        <span>&larr;</span> All Cities
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Auto Care Guides in {selectedCity}
      </h2>

      {guides.length === 0 ? (
        <p className="text-gray-500 text-sm">No guides found for this city yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                {guide.type}
              </span>
              <h4 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2">
                {guide.title}
              </h4>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
