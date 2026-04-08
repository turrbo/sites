import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuideBySlug, getGuides } from "@/lib/sheets";
import { siteConfig } from "@/config/site";
import { generateArticleJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const guide = await getGuideBySlug(params.slug);
  if (!guide) return {};

  return {
    title: guide.metaTitle || guide.title,
    description: guide.metaDescription || "",
    openGraph: {
      title: guide.metaTitle || guide.title,
      description: guide.metaDescription || "",
      url: `${siteConfig.url}/guides/${guide.slug}`,
      type: "article",
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: { slug: string };
}) {
  const guide = await getGuideBySlug(params.slug);
  if (!guide) notFound();

  const allGuides = await getGuides();
  const related = allGuides
    .filter((g) => g.slug !== guide.slug && g.category === guide.category)
    .slice(0, 4);

  const url = `${siteConfig.url}/guides/${guide.slug}`;

  return (
    <>
      <JsonLd data={generateArticleJsonLd(guide, url)} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guides", href: "/guides" },
          { name: guide.title, href: `/guides/${guide.slug}` },
        ])}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: "/guides" },
            { label: guide.title, href: `/guides/${guide.slug}` },
          ]}
        />

        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded mb-4">
          {guide.category}
        </span>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          {guide.title}
        </h1>

        {guide.publishedAt && (
          <p className="text-sm text-gray-500 mb-8">
            Updated{" "}
            {new Date(guide.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}

        <div
          className="prose prose-gray prose-headings:text-gray-900 prose-a:text-amber-600 hover:prose-a:text-amber-700 prose-strong:text-gray-900 max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: guide.content }}
        />

        {/* Find a pro CTA */}
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Want This Done by a Professional?
          </h2>
          <p className="text-gray-600 mb-4">
            Find trusted detailers, tinters, and wrap installers near you.
          </p>
          <a
            href={siteConfig.localDirectory}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Find a Local Pro
          </a>
        </div>
      </article>

      {/* Related guides */}
      {related.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Related Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {related.map((g) => (
                <a
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="card p-4 hover:border-amber-200"
                >
                  <h3 className="text-sm font-semibold text-gray-900">
                    {g.title}
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
