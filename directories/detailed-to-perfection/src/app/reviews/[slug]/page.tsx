import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getReviewBySlug, getReviews } from "@/lib/sheets";
import { siteConfig } from "@/config/site";
import { generateReviewJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import ProductCard from "@/components/ProductCard";
import ReviewSummaryTable from "@/components/ReviewSummaryTable";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const review = await getReviewBySlug(params.slug);
  if (!review) return {};

  return {
    title: review.metaTitle || review.title,
    description: review.metaDescription || `In-depth review of the best ${review.category.toLowerCase()} products.`,
    openGraph: {
      title: review.metaTitle || review.title,
      description: review.metaDescription || "",
      url: `${siteConfig.url}/reviews/${review.slug}`,
      type: "article",
    },
  };
}

export default async function ReviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const review = await getReviewBySlug(params.slug);
  if (!review) notFound();

  const allReviews = await getReviews();
  const related = allReviews
    .filter((r) => r.slug !== review.slug && r.category === review.category)
    .slice(0, 3);

  const url = `${siteConfig.url}/reviews/${review.slug}`;

  return (
    <>
      <JsonLd data={generateReviewJsonLd(review, url)} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Reviews", href: "/reviews" },
          { name: review.title, href: `/reviews/${review.slug}` },
        ])}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Reviews", href: "/reviews" },
            { label: review.title, href: `/reviews/${review.slug}` },
          ]}
        />

        <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded mb-4">
          {review.category}
        </span>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          {review.title}
        </h1>

        {review.publishedAt && (
          <p className="text-sm text-gray-500 mb-6">
            Updated{" "}
            {new Date(review.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}

        <AffiliateDisclosure />

        {/* Quick comparison table */}
        <ReviewSummaryTable products={review.products} />

        {/* Article content */}
        {review.content && (
          <div
            className="prose prose-gray prose-headings:text-gray-900 prose-a:text-amber-600 hover:prose-a:text-amber-700 prose-strong:text-gray-900 max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: review.content }}
          />
        )}

        {/* Product cards */}
        {review.products.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Detailed Product Breakdown
            </h2>
            <div className="space-y-6">
              {review.products.map((product, i) => (
                <ProductCard key={i} product={product} rank={i + 1} />
              ))}
            </div>
          </section>
        )}

        <AffiliateDisclosure compact />
      </article>

      {/* Related reviews */}
      {related.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              More {review.category} Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((r) => (
                <a
                  key={r.slug}
                  href={`/reviews/${r.slug}`}
                  className="card p-4 hover:border-amber-200"
                >
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {r.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.products.length} products
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
