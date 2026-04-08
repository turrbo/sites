'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CityItem {
  city: string;
  state: string;
  count: number;
  slug: string;
}

interface Props {
  cities: CityItem[];
}

export default function CityDropdown({ cities }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const totalListings = cities.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="relative max-w-md">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-left hover:border-amber-300 transition-colors shadow-sm"
      >
        <div>
          <span className="block text-base font-semibold text-gray-900">
            Select Your City
          </span>
          <span className="block text-sm text-gray-500 mt-0.5">
            {cities.length} cities &middot; {totalListings} shops
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {cities.map((c) => (
            <button
              key={`${c.city}-${c.state}`}
              onClick={() => {
                setOpen(false);
                router.push(`/${c.slug}`);
              }}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-amber-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <span className="text-sm font-medium text-gray-900">{c.city}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {c.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
