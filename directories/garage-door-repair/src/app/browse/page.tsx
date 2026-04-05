import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getStateGroups } from "@/lib/sheets";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Browse Garage Door Repair by State | ${siteConfig.name}`,
  description:
    "Browse garage door repair companies across all 50 states. Find local pros in your city for spring repair, opener installation, and more.",
  openGraph: {
    title: `Browse by State | ${siteConfig.name}`,
    description:
      "Browse garage door repair companies across all 50 states. Find local pros in your city.",
    url: `${siteConfig.url}/browse`,
  },
};

export default async function BrowsePage() {
  const stateGroups = await getStateGroups();

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Browse", url: "/browse" },
  ];

  const totalListings = stateGroups.reduce((sum, s) => sum + s.count, 0);
  const totalCities = stateGroups.reduce(
    (sum, s) => sum + s.cities.length,
    0
  );

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Garage Door Repair by State
          </h1>
          <p className="text-gray-600 mb-8">
            {totalListings} companies across {totalCities} cities in{" "}
            {stateGroups.length} states
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stateGroups.map((sg) => (
              <Link
                key={sg.state}
                href={`/${sg.state.toLowerCase()}`}
                className="group block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {sg.stateFull}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {sg.cities.length}{" "}
                      {sg.cities.length === 1 ? "city" : "cities"} &middot;{" "}
                      {sg.count} {sg.count === 1 ? "listing" : "listings"}
                    </p>
                  </div>
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 bg-gray-100 group-hover:bg-blue-50 text-gray-500 group-hover:text-blue-600 rounded-full transition-colors text-sm">
                    &rarr;
                  </span>
                </div>
                {sg.cities.length > 0 && (
                  <p className="mt-3 text-xs text-gray-400 line-clamp-1">
                    {sg.cities.map((c) => c.city).join(", ")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
