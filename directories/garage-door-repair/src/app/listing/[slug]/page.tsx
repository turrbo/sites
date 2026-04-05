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

// Skip generateStaticParams — 1600+ listings exceed Google Sheets API
// rate limits at build time (429 quota errors). Pages render on-demand
// with ISR (revalidate = 3600) instead.

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

              {(listing.rating !== undefined || listing.yearEstablished) && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {listing.rating !== undefined && (
                    <>
                      <span className="text-yellow-400 text-lg">★</span>
                      <span className="font-semibold">{listing.rating.toFixed(1)}</span>
                      {listing.reviewCount && (
                        <span className="text-gray-500 text-sm">
                          ({listing.reviewCount} reviews)
                        </span>
                      )}
                    </>
                  )}
                  {listing.priceRange && (
                    <span className="text-gray-500 text-sm">
                      · {listing.priceRange}
                    </span>
                  )}
                  {listing.yearEstablished && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                      Est. {listing.yearEstablished} · {new Date().getFullYear() - listing.yearEstablished}+ years
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
            {listing.galleryUrls && listing.galleryUrls.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Photos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.galleryUrls.map((url, idx) => (
                    <div
                      key={url}
                      className="relative h-40 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={url}
                        alt={`${listing.name} photo ${idx + 1}`}
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

              {/* Social Media */}
              {(listing.facebook || listing.instagram || listing.yelp || listing.twitter || listing.youtube) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Follow
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.facebook && (
                      <a href={listing.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors" title="Facebook">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </a>
                    )}
                    {listing.instagram && (
                      <a href={listing.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 text-sm rounded-lg hover:bg-pink-100 transition-colors" title="Instagram">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        Instagram
                      </a>
                    )}
                    {listing.yelp && (
                      <a href={listing.yelp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 transition-colors" title="Yelp">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.986-4.375c.546-.8 1.77-.386 1.77.6v3.372c0 .26-.198.508-.585.6zm-8.93 5.236l-.263-5.222c-.05-.98 1.13-1.503 1.782-.79l3.46 3.78c.63.687.037 1.803-.86 1.614l-3.534-.742c-.32-.067-.56-.32-.586-.64zM6.655 9.87l4.86 1.862c.93.355.93 1.687 0 2.042L6.655 15.63c-.866.332-1.71-.52-1.226-1.236l2.06-3.045c.115-.17.115-.394 0-.563L5.43 7.74c-.484-.717.36-1.568 1.226-1.236v3.365zM11.33 2.6l.29 5.223c.054.98-1.127 1.503-1.78.79L6.38 4.833c-.63-.687-.038-1.803.86-1.614l3.505.742c.32.067.56.32.586.64z"/></svg>
                        Yelp
                      </a>
                    )}
                    {listing.twitter && (
                      <a href={listing.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors" title="X / Twitter">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        X
                      </a>
                    )}
                    {listing.youtube && (
                      <a href={listing.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors" title="YouTube">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        YouTube
                      </a>
                    )}
                  </div>
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
