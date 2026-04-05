import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import {
  getListingsByState,
  getStateGroups,
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
  const [stateGroups] = await Promise.all([getStateGroups()]);

  const stateGroup = stateGroups.find(
    (s) => s.state.toLowerCase() === params.state.toLowerCase()
  );

  if (!stateGroup) notFound();

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
            {stateGroup.stateFull} Directory
          </h1>
          <p className="text-gray-600 mb-8">
            Browse {stateGroup.count} listings across {stateGroup.cities.length} cities in{" "}
            {stateGroup.stateFull}
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
      </div>
    </>
  );
}
