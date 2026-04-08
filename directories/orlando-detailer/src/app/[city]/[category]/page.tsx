import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  getCityGroups,
  getAllCategories,
  getAllListings,
  getSEOPagesMeta,
  slugify,
} from "@/lib/sheets";
import {
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ListingGrid from "@/components/ListingGrid";

export const revalidate = 3600;

interface Props {
  params: { city: string; category: string };
}

async function resolveParams(citySlug: string, categorySlug: string) {
  const [cityGroups, categories] = await Promise.all([
    getCityGroups(),
    getAllCategories(),
  ]);

  const cityGroup = cityGroups.find((cg) => slugify(cg.city) === citySlug) ?? null;
  const category = categories.find((c) => c.slug === categorySlug) ?? null;

  return { cityGroup, category };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cityGroup, category } = await resolveParams(params.city, params.category);
  if (!cityGroup || !category) return {};

  const title = `${category.name} in ${cityGroup.city}, FL | ${siteConfig.name}`;
  const description =
    category.metaDescription ||
    `Find the best ${category.name.toLowerCase()} shops in ${cityGroup.city}, FL. Browse reviews, services, and get free quotes.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/${params.city}/${params.category}`,
    },
  };
}

export default async function CityCategory({ params }: Props) {
  const { cityGroup, category } = await resolveParams(params.city, params.category);
  if (!cityGroup || !category) notFound();

  const [allListings, seoPages] = await Promise.all([
    getAllListings(),
    getSEOPagesMeta(),
  ]);

  const listings = allListings.filter(
    (l) =>
      l.city.toLowerCase() === cityGroup.city.toLowerCase() &&
      l.category.toLowerCase() === category.name.toLowerCase()
  );

  // Guides relevant to this city + category
  const cityGuides = seoPages.filter(
    (p) =>
      p.city?.toLowerCase() === cityGroup.city.toLowerCase() &&
      (!p.category || p.category.toLowerCase() === category.name.toLowerCase())
  );

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Browse", url: "/browse" },
    { name: cityGroup.city, url: `/${params.city}` },
    { name: category.name, url: `/${params.city}/${params.category}` },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);
  const itemListJsonLd = generateItemListJsonLd(
    `${category.name} in ${cityGroup.city}, FL`,
    listings
  );

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Quote CTA at top */}
        <div className="mt-6 mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Get Free {category.name} Quotes in {cityGroup.city}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Compare prices from top-rated local shops — no obligation.
            </p>
          </div>
          <Link
            href="/get-quotes"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-slate-900 font-semibold text-sm rounded-lg hover:bg-amber-300 transition-colors"
          >
            Get Free Quotes
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div>
          {category.icon && (
            <span className="text-4xl mb-3 block">{category.icon}</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category.name} in {cityGroup.city}, FL
          </h1>
          {category.description && (
            <p className="text-gray-600 mb-2">{category.description}</p>
          )}
          <p className="text-gray-500 text-sm mb-8">
            {listings.length} shop{listings.length !== 1 ? "s" : ""} found in{" "}
            {cityGroup.city}
          </p>

          <ListingGrid listings={listings} />

          {/* Related guides */}
          {cityGuides.length > 0 && (
            <section className="mt-10 sm:mt-14">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                {category.name} Guides for {cityGroup.city}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cityGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-amber-300 hover:shadow-sm transition-all"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                      {guide.title}
                    </h3>
                    <span className="inline-block mt-1 text-xs text-amber-600">
                      Read guide &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back to all city listings */}
          <div className="mt-8">
            <Link
              href={`/${params.city}`}
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-amber-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              All auto care shops in {cityGroup.city}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
