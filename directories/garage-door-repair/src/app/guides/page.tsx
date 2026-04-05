import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getSEOPagesMeta, getStateGroups } from "@/lib/sheets";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import GuideBrowser from "@/components/GuideBrowser";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Browse Garage Door Repair Guides by State | ${siteConfig.name}`,
  description:
    "Browse garage door repair guides across all 50 states. Find expert advice for spring repair, opener installation, maintenance, and more in your city.",
  openGraph: {
    title: `Browse Guides by State | ${siteConfig.name}`,
    description:
      "Browse garage door repair guides across all 50 states. Find expert advice in your city.",
    url: `${siteConfig.url}/guides`,
  },
};

export default async function GuidesPage() {
  const [seoPages, stateGroups] = await Promise.all([
    getSEOPagesMeta(),
    getStateGroups(),
  ]);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
  ];

  // Group guides by "city|state" key
  const guidesByCity: Record<
    string,
    { title: string; slug: string; type: string }[]
  > = {};
  const guidesCountByState: Record<string, number> = {};

  for (const page of seoPages) {
    const sk = page.state?.toUpperCase() ?? "";
    guidesCountByState[sk] = (guidesCountByState[sk] ?? 0) + 1;

    if (page.city && page.state) {
      const ck = `${page.city.toLowerCase()}|${page.state.toLowerCase()}`;
      if (!guidesByCity[ck]) guidesByCity[ck] = [];
      guidesByCity[ck].push({
        title: page.title,
        slug: page.slug,
        type: page.type,
      });
    }
  }

  // Build state info for the browser component
  const stateGuideInfos = stateGroups
    .filter((sg) => (guidesCountByState[sg.state.toUpperCase()] ?? 0) > 0)
    .map((sg) => ({
      state: sg.state.toUpperCase(),
      stateFull: sg.stateFull,
      guideCount: guidesCountByState[sg.state.toUpperCase()] ?? 0,
      cities: sg.cities.map((c) => c.city),
    }));

  const totalGuides = seoPages.length;
  const totalCities = Object.keys(guidesByCity).length;

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Garage Door Repair Guides
          </h1>
          <p className="text-gray-600 mb-8">
            {totalGuides} guides across {totalCities} cities in{" "}
            {stateGuideInfos.length} states
          </p>

          <GuideBrowser
            stateGuideInfos={stateGuideInfos}
            guidesByCity={guidesByCity}
          />
        </div>
      </div>
    </>
  );
}
