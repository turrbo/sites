import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  getListingsByCity,
  getCityGroups,
  getStateGroups,
  getSEOPagesMeta,
  slugify,
} from "@/lib/sheets";
import { generateBreadcrumbJsonLd, generateItemListJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ListingGrid from "@/components/ListingGrid";

export const revalidate = 3600;

interface Props {
  params: { state: string; city: string };
}

async function resolveCityGroup(stateSlug: string, citySlug: string) {
  const cityGroups = await getCityGroups();
  return cityGroups.find(
    (cg) =>
      cg.state.toLowerCase() === stateSlug.toLowerCase() &&
      cg.slug === `${stateSlug.toLowerCase()}/${citySlug}`
  ) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityGroup = await resolveCityGroup(params.state, params.city);
  if (!cityGroup) return {};

  const title = `Best Businesses in ${cityGroup.city}, ${cityGroup.stateFull} | ${siteConfig.name}`;
  const description = `Find ${cityGroup.count} local businesses and services in ${cityGroup.city}, ${cityGroup.stateFull}. Browse listings, reviews, and more.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/${params.state}/${params.city}`,
    },
  };
}

export async function generateStaticParams() {
  const cityGroups = await getCityGroups();
  return cityGroups.map((cg) => ({
    state: cg.state.toLowerCase(),
    city: cg.slug.split("/")[1],
  }));
}

export default async function CityPage({ params }: Props) {
  const cityGroup = await resolveCityGroup(params.state, params.city);
  if (!cityGroup) notFound();

  const [listings, stateGroups, seoPages] = await Promise.all([
    getListingsByCity(cityGroup.city, cityGroup.state),
    getStateGroups(),
    getSEOPagesMeta(),
  ]);

  const stateGroup = stateGroups.find(
    (s) => s.state.toLowerCase() === params.state.toLowerCase()
  );
  const stateFull = stateGroup?.stateFull ?? cityGroup.stateFull;

  // Guides for this city
  const cityGuides = seoPages.filter(
    (p) => p.city?.toLowerCase() === cityGroup.city.toLowerCase()
  );

  // Other cities in this state
  const otherCities = stateGroup?.cities
    .filter(
      (c) => c.city.toLowerCase() !== cityGroup.city.toLowerCase()
    )
    .slice(0, 12) ?? [];

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: stateFull, url: `/${params.state}` },
    { name: cityGroup.city, url: `/${params.state}/${params.city}` },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);
  const itemListJsonLd = generateItemListJsonLd(
    `Businesses in ${cityGroup.city}, ${stateFull}`,
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
            Garage Door Repair in {cityGroup.city}, {stateFull}
          </h1>
          <p className="text-gray-600 mb-8">
            {listings.length} garage door repair{" "}
            {listings.length !== 1 ? "companies" : "company"} in{" "}
            {cityGroup.city}
          </p>

          <ListingGrid listings={listings} />

          {/* City Guides */}
          {cityGuides.length > 0 && (
            <section className="mt-10 sm:mt-14">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Garage Door Guides for {cityGroup.city}
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

          {/* Other Cities in State */}
          {otherCities.length > 0 && (
            <section className="mt-10 sm:mt-14">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                More Cities in{" "}
                <Link
                  href={`/${params.state}`}
                  className="text-blue-600 hover:underline"
                >
                  {stateFull}
                </Link>
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherCities.map((c) => (
                  <Link
                    key={`${c.city}-${c.state}`}
                    href={`/${c.state.toLowerCase()}/${slugify(c.city)}`}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
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
