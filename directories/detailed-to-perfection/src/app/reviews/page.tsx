import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getReviews } from "@/lib/sheets";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Product Reviews",
  description:
    "In-depth reviews of the best auto detailing products, ceramic coatings, polishers, and car care equipment.",
};

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const reviews = await getReviews();
  const categoryFilter = searchParams.category;

  const filtered = categoryFilter
    ? reviews.filter(
        (r) =>
          r.category.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-").replace(/-+/g, "-") ===
          categoryFilter
      )
    : reviews;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Product Reviews
      </h1>
      <p className="text-gray-600 mb-8">
        Honest, in-depth reviews to help you choose the right products for your
        vehicle.
      </p>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/reviews"
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !categoryFilter
              ? "bg-amber-500 text-gray-900 border-amber-500"
              : "bg-white text-gray-700 border-gray-300 hover:border-amber-300"
          }`}
        >
          All
        </Link>
        {siteConfig.categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/reviews?category=${cat.slug}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              categoryFilter === cat.slug
                ? "bg-amber-500 text-gray-900 border-amber-500"
                : "bg-white text-gray-700 border-gray-300 hover:border-amber-300"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Reviews grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((review) => (
            <Link
              key={review.slug}
              href={`/reviews/${review.slug}`}
              className="card overflow-hidden hover:border-amber-200"
            >
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={`/images/reviews/${review.slug}.png`}
                  alt={review.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded mb-3">
                  {review.category}
                </span>
                <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {review.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {review.products.length} products compared
                </p>
                {review.publishedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">
            {categoryFilter
              ? "No reviews found in this category yet."
              : "Reviews coming soon! Check back for honest product recommendations."}
          </p>
        </div>
      )}
    </div>
  );
}
