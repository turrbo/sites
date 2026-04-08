import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getSEOPagesMeta } from "@/lib/sheets";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import GuideBrowser from "@/components/GuideBrowser";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Browse Auto Care Guides by City | ${siteConfig.name}`,
  description:
    "Browse auto detailing, window tinting, and vehicle wrap guides across the Orlando area. Find expert advice for ceramic coating, paint correction, and more.",
  openGraph: {
    title: `Browse Auto Care Guides | ${siteConfig.name}`,
    description:
      "Browse auto care guides across the Orlando area. Find expert advice in your city.",
    url: `${siteConfig.url}/guides`,
  },
};

export default async function GuidesPage() {
  const seoPages = await getSEOPagesMeta();

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
  ];

  // Group guides by city name (lowercase key) - single state/local site
  const guidesByCity: Record<
    string,
    { title: string; slug: string; type: string }[]
  > = {};

  const citySet = new Set<string>();

  for (const page of seoPages) {
    if (page.city) {
      const ck = page.city.toLowerCase();
      citySet.add(page.city);
      if (!guidesByCity[ck]) guidesByCity[ck] = [];
      guidesByCity[ck].push({
        title: page.title,
        slug: page.slug,
        type: page.type,
      });
    }
  }

  // Sort cities alphabetically
  const cities = Array.from(citySet).sort((a, b) => a.localeCompare(b));

  const totalGuides = seoPages.length;
  const totalCities = cities.length;

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Auto Care Guides
          </h1>
          <p className="text-gray-600 mb-8">
            {totalGuides} guides across {totalCities}{" "}
            {totalCities === 1 ? "city" : "cities"} in the Orlando area
          </p>

          <GuideBrowser cities={cities} guidesByCity={guidesByCity} />
        </div>
      </div>
    </>
  );
}
