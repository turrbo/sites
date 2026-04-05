"use client";

import { useState } from "react";
import Link from "next/link";

interface StateGuideInfo {
  state: string;
  stateFull: string;
  guideCount: number;
  cities: string[];
}

interface CityGuide {
  title: string;
  slug: string;
  type: string;
}

interface GuideBrowserProps {
  stateGuideInfos: StateGuideInfo[];
  guidesByCity: Record<string, CityGuide[]>;
}

export default function GuideBrowser({
  stateGuideInfos,
  guidesByCity,
}: GuideBrowserProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  if (!selectedState) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stateGuideInfos.map((sg) => (
          <button
            key={sg.state}
            onClick={() => setSelectedState(sg.state)}
            className="group block text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {sg.stateFull}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {sg.cities.length}{" "}
                  {sg.cities.length === 1 ? "city" : "cities"} &middot;{" "}
                  {sg.guideCount} {sg.guideCount === 1 ? "guide" : "guides"}
                </p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 bg-gray-100 group-hover:bg-blue-50 text-gray-500 group-hover:text-blue-600 rounded-full transition-colors text-sm">
                &rarr;
              </span>
            </div>
            {sg.cities.length > 0 && (
              <p className="mt-3 text-xs text-gray-400 line-clamp-1">
                {sg.cities.join(", ")}
              </p>
            )}
          </button>
        ))}
      </div>
    );
  }

  const stateInfo = stateGuideInfos.find((s) => s.state === selectedState);
  if (!stateInfo) return null;

  return (
    <div>
      <button
        onClick={() => setSelectedState(null)}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <span>&larr;</span> All States
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Garage Door Guides in {stateInfo.stateFull}
      </h2>

      <div className="space-y-8">
        {stateInfo.cities.map((city) => {
          const key = `${city.toLowerCase()}|${selectedState.toLowerCase()}`;
          const guides = guidesByCity[key] || [];
          if (guides.length === 0) return null;

          return (
            <div key={city}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {city}, {selectedState}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                      {guide.type}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2">
                      {guide.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
