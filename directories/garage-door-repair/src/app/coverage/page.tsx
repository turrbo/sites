import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getAllListings, getStateGroups, getCityGroups } from "@/lib/sheets";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Coverage Map | ${siteConfig.name}`,
  description:
    "See our nationwide coverage of garage door repair businesses across all 50 US states. Live stats updated automatically.",
  openGraph: {
    title: `Coverage Map | ${siteConfig.name}`,
    description:
      "See our nationwide coverage of garage door repair businesses across all 50 US states.",
    url: `${siteConfig.url}/coverage`,
  },
};

export default async function CoveragePage() {
  const [listings, stateGroups, cityGroups] = await Promise.all([
    getAllListings(),
    getStateGroups(),
    getCityGroups(),
  ]);

  const totalBusinesses = listings.length;
  const totalCities = cityGroups.length;
  const totalStates = stateGroups.length;

  const withWebsite = listings.filter((l) => l.website).length;
  const withRating = listings.filter((l) => l.rating && l.rating > 0).length;
  const withReviews = listings.filter(
    (l) => l.reviewCount && l.reviewCount > 0
  ).length;
  const avgRating =
    withRating > 0
      ? listings.reduce((sum, l) => sum + (l.rating || 0), 0) / withRating
      : 0;
  const totalReviews = listings.reduce(
    (sum, l) => sum + (l.reviewCount || 0),
    0
  );

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Coverage", url: "/coverage" },
  ];

  // Sort states by count descending for the grid
  const sortedStates = [...stateGroups].sort((a, b) => b.count - a.count);

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />

      <div className="container py-8 max-w-6xl mx-auto px-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nationwide Coverage
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl">
            {siteConfig.name} is the most comprehensive free directory of garage
            door repair businesses in the United States. Our data is sourced from
            Google Maps and updated regularly.
          </p>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 text-center">
              <div className="text-3xl font-bold text-blue-900">
                {totalBusinesses.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700 mt-1">Businesses</div>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 text-center">
              <div className="text-3xl font-bold text-blue-900">
                {totalCities.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700 mt-1">Cities</div>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 text-center">
              <div className="text-3xl font-bold text-blue-900">
                {totalStates}
              </div>
              <div className="text-sm text-blue-700 mt-1">States</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="text-3xl font-bold text-gray-900">
                {avgRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500 mt-1">Avg Rating</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="text-3xl font-bold text-gray-900">
                {totalReviews.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">Total Reviews</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="text-3xl font-bold text-gray-900">
                {Math.round((withWebsite / totalBusinesses) * 100)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Have Websites</div>
            </div>
          </div>

          {/* State Grid */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Coverage by State
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {sortedStates.map((sg) => (
              <Link
                key={sg.state}
                href={`/${sg.state.toLowerCase()}`}
                className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {sg.stateFull}
                  </span>
                  <span className="text-xs text-gray-400 ml-1.5">
                    {sg.cities.length}{" "}
                    {sg.cities.length === 1 ? "city" : "cities"}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-500">
                  {sg.count}
                </span>
              </Link>
            ))}
          </div>

          {/* Data Quality */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              About Our Data
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Source</h3>
                <p>
                  All business listings are sourced from Google Maps via the
                  Google Places API. We verify each business has a physical
                  address and active phone number.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Updates</h3>
                <p>
                  Our directory is updated regularly as we expand into new cities
                  and refresh existing data. Stats on this page reflect the
                  current live dataset.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Coverage</h3>
                <p>
                  We focus on US cities with populations above 50,000.{" "}
                  {withRating.toLocaleString()} of our{" "}
                  {totalBusinesses.toLocaleString()} listings have verified
                  Google ratings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
