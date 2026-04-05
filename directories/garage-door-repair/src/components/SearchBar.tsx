'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({ placeholder = 'Search listings...', initialValue = '' }: Props) {
  const [query, setQuery] = useState(initialValue);
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full" role="search">
      <label htmlFor="search-input" className="sr-only">
        Search listings
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300 text-sm"
      />
      <button
        type="submit"
        className="px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold rounded-r-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm whitespace-nowrap"
      >
        Search
      </button>
    </form>
  );
}
