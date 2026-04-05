import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  getListingsByCity,
  getCityGroups,
  getStateGroups,
  getSEOPages,
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

  const listings = await getListingsByCity(cityGroup.city, cityGroup.state);

  const stateGroups = await getStateGroups();
  const stateGroup = stateGroups.find(
    (s) => s.state.toLowerCase() === params.state.toLowerCase()
  );
  const stateFull = stateGroup?.stateFull ?? cityGroup.stateFull;

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
            {cityGroup.city}, {stateFull}
          </h1>
          <p className="text-gray-600 mb-8">
            {listings.length} listing{listings.length !== 1 ? "s" : ""} found in{" "}
            {cityGroup.city}
          </p>

          <ListingGrid listings={listings} />

          {/* City Guides */}
          {await (async () => {
            const guides = (await getSEOPages()).filter(
              (p) => p.city === cityGroup.city
            );
            if (guides.length === 0) return null;
            return (
              <section className="mt-10 sm:mt-14">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                  Garage Door Guides for {cityGroup.city}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guides.map((guide) => (
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
            );
          })()}
        </div>
      </div>
    </>
  );
}
