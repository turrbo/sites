import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  getStateGroups,
  getSEOPages,
} from "@/lib/sheets";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import CityCard from "@/components/CityCard";

export const revalidate = 3600;

interface Props {
  params: { state: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateGroups = await getStateGroups();
  const stateGroup = stateGroups.find(
    (s) => s.state.toLowerCase() === params.state.toLowerCase()
  );
  if (!stateGroup) return {};

  const title = `${stateGroup.stateFull} Directory — Local Businesses & Services | ${siteConfig.name}`;
  const description = `Browse ${stateGroup.count} local businesses and services across ${stateGroup.cities.length} cities in ${stateGroup.stateFull}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/${params.state}`,
    },
  };
}

export async function generateStaticParams() {
  const stateGroups = await getStateGroups();
  return stateGroups.map((s) => ({ state: s.state.toLowerCase() }));
}

export default async function StatePage({ params }: Props) {
  const [stateGroups, seoPages] = await Promise.all([
    getStateGroups(),
    getSEOPages(),
  ]);

  const stateGroup = stateGroups.find(
    (s) => s.state.toLowerCase() === params.state.toLowerCase()
  );

  if (!stateGroup) notFound();

  // Guides for cities in this state
  const stateGuides = seoPages.filter(
    (p) => p.state?.toLowerCase() === params.state.toLowerCase()
  ).slice(0, 10);

  // Other state pages for cross-linking
  const otherStates = stateGroups
    .filter((s) => s.state.toLowerCase() !== params.state.toLowerCase())
    .slice(0, 10);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: stateGroup.stateFull, url: `/${params.state}` },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Garage Door Repair in {stateGroup.stateFull}
          </h1>
          <p className="text-gray-600 mb-8">
            Browse {stateGroup.count} garage door repair companies across{" "}
            {stateGroup.cities.length} cities in {stateGroup.stateFull}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stateGroup.cities.map((cityGroup) => (
              <CityCard
                key={`${cityGroup.city}-${cityGroup.state}`}
                cityGroup={cityGroup}
              />
            ))}
          </div>
        </div>

        {/* Guides for this state */}
        {stateGuides.length > 0 && (
          <section className="mt-10 sm:mt-14">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Garage Door Guides in {stateGroup.stateFull}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stateGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {guide.title}
                  </h3>
                  {guide.city && (
                    <p className="text-xs text-gray-500 mt-1">
                      {guide.city}, {guide.state}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Other States */}
        <section className="mt-10 sm:mt-14">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Browse Other States
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherStates.map((s) => (
              <Link
                key={s.state}
                href={`/${s.state.toLowerCase()}`}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                {s.stateFull} ({s.count})
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
