import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import {
  getFeaturedListings,
  getCityGroups,
  getAllListings,
  getSEOPages,
} from "@/lib/sheets";
import { generateItemListJsonLd } from "@/lib/seo";
import Hero from "@/components/Hero";
import ListingCard from "@/components/ListingCard";
import CityCard from "@/components/CityCard";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    images: [{ url: siteConfig.ogImage }],
  },
};

export default async function HomePage() {
  const [featuredListings, cityGroups, allListings, seoPages] =
    await Promise.all([
      getFeaturedListings(),
      getCityGroups(),
      getAllListings(),
      getSEOPages(),
    ]);

  // Pick a diverse set of guides for the homepage
  const uniqueCities = Array.from(new Set(seoPages.map((p) => p.city).filter(Boolean)));
  const homepageGuides = uniqueCities
    .map((city) => seoPages.find((p) => p.city === city))
    .filter(Boolean)
    .slice(0, 10);

  const itemListJsonLd = generateItemListJsonLd(
    `Featured listings on ${siteConfig.name}`,
    featuredListings.length > 0 ? featuredListings : allListings
  );

  return (
    <>
      <JsonLd data={itemListJsonLd} />

      <Hero />

      {/* Featured Listings */}
      {featuredListings.length > 0 && (
        <section className="py-10 sm:py-16 bg-white" id="featured">
          <div className="container">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Featured Listings
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Discover top-rated local businesses and services
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by City */}
      {cityGroups.length > 0 && (
        <section className="py-10 sm:py-16 bg-white" id="cities">
          <div className="container">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Browse by City
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Explore listings in your area
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {cityGroups.map((city) => (
                <CityCard key={`${city.city}-${city.state}`} cityGroup={city} />
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Guides & Resources */}
      {homepageGuides.length > 0 && (
        <section className="py-10 sm:py-16 bg-gray-50" id="guides">
          <div className="container">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Garage Door Repair Guides
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Expert guides and cost information for your city
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {homepageGuides.map((guide) => guide && (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="block p-4 sm:p-5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {guide.title}
                  </h3>
                  {guide.city && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {guide.city}, {guide.state}
                    </p>
                  )}
                  <span className="inline-block mt-2 text-xs text-blue-600 font-medium">
                    Read guide →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
