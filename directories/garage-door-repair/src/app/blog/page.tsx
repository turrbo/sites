import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { getBlogPosts } from "@/lib/sheets";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Blog | ${siteConfig.name}`,
  description: `Expert tips, industry news, and guides about garage door repair, installation, and maintenance.`,
  openGraph: {
    title: `Blog | ${siteConfig.name}`,
    description: `Expert tips, industry news, and guides about garage door repair, installation, and maintenance.`,
    url: `${siteConfig.url}/blog`,
  },
};

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog</h1>
          <p className="text-gray-600 mb-8">
            Expert tips, industry news, and guides about garage door repair and
            maintenance.
          </p>

          {posts.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">
              No blog posts yet. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const excerpt =
                  post.excerpt ||
                  stripHtml(post.content).slice(0, 160) + "...";

                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    {post.imageUrl && (
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {post.category && (
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                          {post.category}
                        </span>
                      )}
                      <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                        {excerpt}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                        {post.author && <span>By {post.author}</span>}
                        {post.publishedAt && (
                          <time dateTime={post.publishedAt}>
                            {new Date(post.publishedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </time>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
