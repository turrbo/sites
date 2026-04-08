import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  getListingsByCity,
  getCityGroups,
  getSEOPagesMeta,
  getAllCategories,
  slugify,
} from "@/lib/sheets";
import { generateBreadcrumbJsonLd, generateItemListJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ListingGrid from "@/components/ListingGrid";

export const revalidate = 3600;

interface Props {
  params: { city: string };
}

async function resolveCityGroup(citySlug: string) {
  const cityGroups = await getCityGroups();
  // All listings are FL — match on the city slug portion only
  return (
    cityGroups.find((cg) => slugify(cg.city) === citySlug) ?? null
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityGroup = await resolveCityGroup(params.city);
  if (!cityGroup) return {};

  const title = `Auto Detailing, Tinting & Wraps in ${cityGroup.city}, FL | ${siteConfig.name}`;
  const description = `Find ${cityGroup.count} auto detailing, window tinting, and vehicle wrap shops in ${cityGroup.city}, FL. Browse reviews, services, and contact info.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/${params.city}`,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const cityGroup = await resolveCityGroup(params.city);
  if (!cityGroup) notFound();

  const [listings, cityGroups, seoPages, categories] = await Promise.all([
    getListingsByCity(cityGroup.city, cityGroup.state),
    getCityGroups(),
    getSEOPagesMeta(),
    getAllCategories(),
  ]);

  // Guides for this city
  const cityGuides = seoPages.filter(
    (p) => p.city?.toLowerCase() === cityGroup.city.toLowerCase()
  );

  // Other Orlando metro cities (excluding current)
  const otherCities = cityGroups
    .filter((c) => c.city.toLowerCase() !== cityGroup.city.toLowerCase())
    .slice(0, 16);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Browse", url: "/browse" },
    { name: cityGroup.city, url: `/${params.city}` },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);
  const itemListJsonLd = generateItemListJsonLd(
    `Auto Detailing Shops in ${cityGroup.city}, FL`,
    listings
  );

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Auto Detailing, Tinting &amp; Wraps in {cityGroup.city}, FL
          </h1>
          <p className="text-gray-600 mb-4">
            {listings.length} auto care{" "}
            {listings.length !== 1 ? "shops" : "shop"} in {cityGroup.city}
          </p>

          {/* Category filter links */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${params.city}/${cat.slug}`}
                  className="px-4 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <ListingGrid listings={listings} />

          {/* Get Free Quotes CTA */}
          <section className="mt-10 sm:mt-14 bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 sm:p-10 text-white">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Get Free Quotes in {cityGroup.city}
              </h2>
              <p className="text-slate-300 mb-6">
                Tell us what you need and we&apos;ll match you with the best auto detailing,
                window tinting, and wrap shops near you — no obligation.
              </p>
              <Link
                href="/get-quotes"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-slate-900 font-semibold rounded-lg hover:bg-amber-300 transition-colors"
              >
                Request Free Quotes
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </section>

          {/* City Guides */}
          {cityGuides.length > 0 && (
            <section className="mt-10 sm:mt-14">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Auto Care Guides for {cityGroup.city}
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

          {/* Other Areas */}
          {otherCities.length > 0 && (
            <section className="mt-10 sm:mt-14">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Other Orlando Metro Areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherCities.map((c) => (
                  <Link
                    key={`${c.city}-${c.state}`}
                    href={`/${slugify(c.city)}`}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors"
                  >
                    {c.city} ({c.count})
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
