import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import {
  getFeaturedListings,
  getAllCategories,
  getCityGroups,
  getAllListings,
} from "@/lib/sheets";
import { generateItemListJsonLd } from "@/lib/seo";
import Hero from "@/components/Hero";
import ListingCard from "@/components/ListingCard";
import CategoryCard from "@/components/CategoryCard";
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
  const [featuredListings, categories, cityGroups, allListings] =
    await Promise.all([
      getFeaturedListings(),
      getAllCategories(),
      getCityGroups(),
      getAllListings(),
    ]);

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
        <section className="py-16 bg-white" id="featured">
          <div className="container">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Featured Listings
            </h2>
            <p className="text-gray-600 mb-8">
              Discover top-rated local businesses and services
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Category */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50" id="categories">
          <div className="container">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Browse by Category
            </h2>
            <p className="text-gray-600 mb-8">
              Find businesses by what they do
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by City */}
      {cityGroups.length > 0 && (
        <section className="py-16 bg-white" id="cities">
          <div className="container">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Browse by City
            </h2>
            <p className="text-gray-600 mb-8">
              Explore listings in your area
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cityGroups.slice(0, 20).map((city) => (
                <CityCard key={`${city.city}-${city.state}`} cityGroup={city} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
