import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import {
  getListingBySlug,
  getAllListings,
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

export default async function ListingPage({ params }: Props) {
  const listing = await getListingBySlug(params.slug);
  if (!listing) notFound();

  const categorySlug = slugify(listing.category);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: listing.category, url: `/category/${categorySlug}` },
    { name: listing.name, url: `/listing/${listing.slug}` },
  ];

  const listingJsonLd = generateListingJsonLd(listing);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <JsonLd data={listingJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">{listing.name}</h1>

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
                <p className="text-gray-700 leading-relaxed">{listing.description}</p>
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
                  {listing.city}, {listing.state}
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
    </>
  );
}
