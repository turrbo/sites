import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import {
  getBlogPostBySlug,
  getBlogPosts,
  getSEOPagesMeta,
  getCityGroups,
  getStateGroups,
} from "@/lib/sheets";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { injectInternalLinks, getRelatedResources, getDTPCallout } from "@/lib/internal-links";
import DTPCalloutBox from "@/components/DTPCallout";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return {};

  const title = post.metaTitle || `${post.title} | ${siteConfig.name}`;
  const description =
    post.metaDescription ||
    post.excerpt ||
    post.content
      ?.replace(/<[^>]*>/g, "")
      .slice(0, 160)
      .replace(/\s+/g, " ") ||
    post.title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/blog/${post.slug}`,
      ...(post.imageUrl && { images: [{ url: post.imageUrl }] }),
    },
  };
}

// Skip generateStaticParams to reduce Sheets API calls at build time.

export default async function BlogPostPage({ params }: Props) {
  const [post, allPosts, seoPages, cityGroups, stateGroups] = await Promise.all(
    [
      getBlogPostBySlug(params.slug),
      getBlogPosts(),
      getSEOPagesMeta(),
      getCityGroups(),
      getStateGroups(),
    ]
  );
  if (!post) notFound();

  // Inject internal links into blog content
  const linkCtx = {
    cityGroups,
    stateGroups,
    seoPages,
    currentSlug: post.slug,
    currentCity: post.city,
    currentState: post.state,
  };
  const linkedContent = injectInternalLinks(post.content, linkCtx);
  const dtpCallout = getDTPCallout(post.content);
  const relatedResources = getRelatedResources(linkCtx);

  // Related blog posts: same category or same city
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .filter(
      (p) =>
        (post.category && p.category === post.category) ||
        (post.city && p.city === post.city)
    )
    .slice(0, 4);

  // Related guides for this city
  const cityGuides = post.city
    ? seoPages.filter((p) => p.city === post.city).slice(0, 4)
    : [];

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ];

  // Article JSON-LD
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.imageUrl && { image: post.imageUrl }),
    ...(post.publishedAt && { datePublished: post.publishedAt }),
    ...(post.author && {
      author: { "@type": "Person", name: post.author },
    }),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
  };

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={articleJsonLd} />

      <div className="container py-4 sm:py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <article className="mt-4 sm:mt-6 max-w-3xl">
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {post.category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium rounded-full">
                  {post.category}
                </span>
              )}
              {post.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
              {post.author && <span>By {post.author}</span>}
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
            </div>
          </header>

          {post.imageUrl && (
            <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden mb-8">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div
            className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: linkedContent }}
          />

          {dtpCallout && <DTPCalloutBox callout={dtpCallout} />}
        </article>

        {/* Related Blog Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-10 sm:mt-16 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {rp.title}
                  </h3>
                  {rp.publishedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(rp.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* City Guides */}
        {cityGuides.length > 0 && (
          <section className="mt-10 sm:mt-16 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Auto Care Guides for {post.city}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cityGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {guide.title}
                  </h3>
                  <span className="inline-block mt-1 text-xs text-blue-600">
                    Read guide →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Resources */}
        {relatedResources.length > 0 && (
          <section className="mt-10 sm:mt-16 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              More Resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedResources.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <span className="mt-0.5 text-blue-500 flex-shrink-0" aria-hidden="true">
                    {r.type === "tool" && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" /></svg>
                    )}
                    {r.type === "city" && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    )}
                    {r.type === "guide" && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                    )}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {r.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
