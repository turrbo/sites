import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getReviews, getGuides, getBlogPosts } from "@/lib/sheets";

export const revalidate = 3600;

export default async function HomePage() {
  const [reviews, guides, blogPosts] = await Promise.all([
    getReviews(),
    getGuides(),
    getBlogPosts(),
  ]);

  const featuredReviews = reviews.slice(0, 6);
  const latestGuides = guides.slice(0, 4);
  const latestPosts = blogPosts.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Auto Care,{" "}
            <span className="text-amber-400">Detailed To Perfection</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Expert product reviews, how-to guides, and cost calculators for auto
            detailing, ceramic coating, window tinting, PPF, and vehicle wraps.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/reviews" className="btn-primary text-lg px-8 py-4">
              Browse Reviews
            </Link>
            <Link href="/guides" className="btn-secondary text-lg px-8 py-4">
              Read Guides
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {siteConfig.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/reviews?category=${cat.slug}`}
                className="bg-white rounded-xl p-5 text-center border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all"
              >
                <span className="text-sm font-medium text-gray-900">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Reviews */}
      {featuredReviews.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Latest Product Reviews
              </h2>
              <Link
                href="/reviews"
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredReviews.map((review) => (
                <Link
                  key={review.slug}
                  href={`/reviews/${review.slug}`}
                  className="card p-6 hover:border-amber-200"
                >
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded mb-3">
                    {review.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {review.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {review.products.length} products reviewed
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Guides */}
      {latestGuides.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Expert Guides
              </h2>
              <Link
                href="/guides"
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="card p-6 hover:border-amber-200"
                >
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded mb-3">
                    {guide.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {guide.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog */}
      {latestPosts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                From the Blog
              </h2>
              <Link
                href="/blog"
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="card overflow-hidden hover:border-amber-200"
                >
                  {post.imageUrl && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Find a Pro CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need a Professional?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Find trusted auto detailing, tinting, and wrap shops in the Orlando
            area through our local directory.
          </p>
          <a
            href={siteConfig.localDirectory}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-lg px-8 py-4"
          >
            Find a Local Pro
          </a>
        </div>
      </section>

      {/* Empty state for no content */}
      {reviews.length === 0 && guides.length === 0 && blogPosts.length === 0 && (
        <section className="py-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Content Coming Soon
            </h2>
            <p className="text-gray-600">
              We're building out our library of expert product reviews, how-to
              guides, and auto care tips. Check back soon!
            </p>
          </div>
        </section>
      )}
    </>
  );
}
