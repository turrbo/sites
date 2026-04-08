import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/sheets";
import { siteConfig } from "@/config/site";
import { generateBlogPostJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || "",
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || "",
      url: `${siteConfig.url}/blog/${post.slug}`,
      type: "article",
      ...(post.imageUrl && { images: [post.imageUrl] }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const allPosts = await getBlogPosts();
  const related = allPosts
    .filter(
      (p) =>
        p.slug !== post.slug &&
        (p.category === post.category ||
          p.tags?.some((t) => post.tags?.includes(t)))
    )
    .slice(0, 3);

  const url = `${siteConfig.url}/blog/${post.slug}`;

  return (
    <>
      <JsonLd data={generateBlogPostJsonLd(post, url)} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ])}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title, href: `/blog/${post.slug}` },
          ]}
        />

        {post.imageUrl && (
          <div className="aspect-video rounded-xl overflow-hidden mb-6">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {post.category && (
          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded mb-4">
            {post.category}
          </span>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {post.publishedAt && (
          <p className="text-sm text-gray-500 mb-8">
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}

        <div
          className="prose prose-gray prose-headings:text-gray-900 prose-a:text-amber-600 hover:prose-a:text-amber-700 prose-strong:text-gray-900 max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {related.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((p) => (
                <a
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="card p-4 hover:border-amber-200"
                >
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {p.title}
                  </h3>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
