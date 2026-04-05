import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import {
  getListingBySlug,
  getAllListings,
  getListingsByCity,
  getSEOPagesMeta,
  slugify,
} from "@/lib/sheets";
import {
  generateListingJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListingBySlug(params.slug);
  if (!listing) return {};

  const title = `${listing.name} — ${listing.category} in ${listing.city}, ${listing.state}`;
  const description =
    listing.shortDescription ||
    listing.description?.slice(0, 160) ||
    `${listing.name} is a ${listing.category} located in ${listing.city}, ${listing.state}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/listing/${listing.slug}`,
      images: listing.imageUrl ? [{ url: listing.imageUrl }] : [],
    },
  };
}

export async function generateStaticParams() {
  const listings = await getAllListings();
  return listings.map((l) => ({ slug: l.slug }));
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
}

export default async function ListingPage({ params }: Props) {
  const listing = await getListingBySlug(params.slug);
  if (!listing) notFound();

  const [cityListings, seoPages] = await Promise.all([
    getListingsByCity(listing.city, listing.state),
    getSEOPagesMeta(),
  ]);

  const relatedListings = cityListings.filter((l) => l.slug !== listing.slug).slice(0, 4);
  const cityGuides = seoPages.filter((p) => p.city === listing.city).slice(0, 4);

  const categorySlug = slugify(listing.category);

  const citySlug = `/${listing.state.toLowerCase()}/${slugify(listing.city)}`;
  const stateSlug = `/${listing.state.toLowerCase()}`;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: listing.stateFull || listing.state, url: stateSlug },
    { name: listing.city, url: citySlug },
    { name: listing.name, url: `/listing/${listing.slug}` },
  ];

  const listingJsonLd = generateListingJsonLd(listing);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <JsonLd data={listingJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="container py-4 sm:py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Image */}
            {listing.imageUrl && (
              <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden">
                <Image
                  src={listing.imageUrl}
                  alt={listing.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Name & Category */}
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-3">
                {listing.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{listing.name}</h1>

              {listing.rating !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-yellow-400 text-lg">★</span>
                  <span className="font-semibold">{listing.rating.toFixed(1)}</span>
                  {listing.reviewCount && (
                    <span className="text-gray-500 text-sm">
                      ({listing.reviewCount} reviews)
                    </span>
                  )}
                  {listing.priceRange && (
                    <span className="text-gray-500 text-sm ml-2">
                      · {listing.priceRange}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-gray-700 leading-relaxed">{stripHtml(listing.description)}</p>
              </div>
            )}

            {/* Services */}
            {listing.services && listing.services.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Services Offered</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {listing.services.map((service) => (
                    <li
                      key={service}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <span className="text-blue-500 text-sm">&#9679;</span>
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Amenities & Features
                </h2>
                <ul className="grid grid-cols-2 gap-2">
                  {listing.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <span className="text-green-500">✓</span>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gallery */}
            {listing.gallery && listing.gallery.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.gallery.map((img) => (
                    <div
                      key={img.url}
                      className="relative h-40 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={img.url}
                        alt={img.filename}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="card p-6 space-y-4">
              {/* Address */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Address
                </h3>
                <p className="text-gray-800">
                  {listing.address}
                  <br />
                  <Link href={citySlug} className="text-blue-600 hover:underline">
                    {listing.city}
                  </Link>
                  ,{" "}
                  <Link href={stateSlug} className="text-blue-600 hover:underline">
                    {listing.state}
                  </Link>
                  {listing.zip && ` ${listing.zip}`}
                </p>
              </div>

              {/* Phone */}
              {listing.phone && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Phone
                  </h3>
                  <a
                    href={`tel:${listing.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {listing.phone}
                  </a>
                </div>
              )}

              {/* Website */}
              {listing.website && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Website
                  </h3>
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {listing.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              {/* Hours */}
              {listing.hours && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Hours
                  </h3>
                  <p className="text-gray-800 whitespace-pre-line">{listing.hours}</p>
                </div>
              )}

              {/* CTA */}
              {listing.website && (
                <a
                  href={listing.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full text-center mt-2"
                >
                  Visit Website
                </a>
              )}
            </div>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
      {/* Related Listings in Same City */}
      {relatedListings.length > 0 && (
        <section className="container py-8 sm:py-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            More Garage Door Services in{" "}
            <Link href={citySlug} className="text-blue-600 hover:underline">
              {listing.city}, {listing.state}
            </Link>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedListings.map((rl) => (
              <Link
                key={rl.slug}
                href={`/listing/${rl.slug}`}
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{rl.name}</h3>
                {rl.rating != null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {rl.rating.toFixed(1)} stars · {rl.reviewCount || 0} reviews
                  </p>
                )}
                {rl.phone && <p className="text-xs text-blue-600 mt-1">{rl.phone}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* City Guides */}
      {cityGuides.length > 0 && (
        <section className="container pb-8 sm:pb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Garage Door Guides for {listing.city}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cityGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="block p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-white transition-all"
              >
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{guide.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky CTA */}
      {listing.phone && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 lg:hidden z-40">
          <div className="flex gap-2 max-w-lg mx-auto">
            <a
              href={`tel:${listing.phone}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Now
            </a>
            {listing.website && (
              <a
                href={listing.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Visit Website
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
