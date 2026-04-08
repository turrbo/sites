import Link from 'next/link';
import { Category } from '@/lib/types';
import { resolveIcon } from '@/lib/icons';

interface Props {
  category: Category;
  count?: number;
}

export default function CategoryCard({ category, count }: Props) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors text-2xl">
        {category.icon ? (
          <span aria-hidden="true">{resolveIcon(category.icon)}</span>
        ) : (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {category.name}
        </h3>
        {count != null && (
          <p className="text-sm text-gray-500 mt-0.5">
            {count} {count === 1 ? 'listing' : 'listings'}
          </p>
        )}
      </div>

      {/* Arrow */}
      <svg
        className="ml-auto w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
