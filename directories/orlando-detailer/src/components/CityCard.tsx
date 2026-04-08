import Link from 'next/link';
import { CityGroup } from '@/lib/types';

interface Props {
  cityGroup: CityGroup;
}

export default function CityCard({ cityGroup }: Props) {
  const { city, state, stateFull, count, slug } = cityGroup;

  return (
    <Link
      href={`/${slug}`}
      className="group block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-amber-200 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors truncate">
            {city}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{stateFull}</p>
        </div>

        <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[2rem] h-6 px-2 bg-gray-100 group-hover:bg-amber-50 text-gray-600 group-hover:text-amber-700 text-xs font-medium rounded-full transition-colors">
          {count}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {count} {count === 1 ? 'listing' : 'listings'}
      </p>
    </Link>
  );
}
