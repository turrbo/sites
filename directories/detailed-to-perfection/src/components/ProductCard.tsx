import { Product } from "@/lib/types";
import { siteConfig } from "@/config/site";
import StarRating from "./StarRating";

function appendTag(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("tag", siteConfig.amazonTag);
    return u.toString();
  } catch {
    return url;
  }
}

export default function ProductCard({
  product,
  rank,
}: {
  product: Product;
  rank?: number;
}) {
  const affiliateUrl = appendTag(product.amazonUrl);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {rank && (
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-gray-900 font-bold text-sm flex items-center justify-center">
            {rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {product.name}
          </h3>
          {product.price && (
            <p className="text-sm text-gray-500 mt-1">{product.price}</p>
          )}
        </div>
      </div>

      {/* Rating */}
      {product.rating > 0 && (
        <div className="mb-4">
          <StarRating rating={product.rating} />
        </div>
      )}

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {product.pros.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">
              Pros
            </h4>
            <ul className="space-y-1">
              {product.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        )}
        {product.cons.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-700 mb-2">
              Cons
            </h4>
            <ul className="space-y-1">
              {product.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Verdict */}
      {product.verdict && (
        <p className="text-sm text-gray-600 italic mb-4">{product.verdict}</p>
      )}

      {/* CTA */}
      <a
        href={affiliateUrl}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg font-medium text-sm bg-amber-500 text-gray-900 hover:bg-amber-400 transition-colors"
      >
        Check Price on Amazon
        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
