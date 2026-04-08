import { Listing } from "./types";
import { siteConfig } from "@/config/site";

export function generateListingJsonLd(listing: Listing) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.name,
    description: listing.shortDescription || listing.description?.slice(0, 160),
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip,
    },
    ...(listing.phone && { telephone: listing.phone }),
    ...(listing.website && { url: listing.website }),
    ...(listing.email && { email: listing.email }),
    ...(listing.imageUrl && { image: listing.imageUrl }),
    ...(listing.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: listing.rating,
        reviewCount: listing.reviewCount || 1,
      },
    }),
    ...(listing.latitude &&
      listing.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: listing.latitude,
          longitude: listing.longitude,
        },
      }),
    ...(listing.priceRange && { priceRange: listing.priceRange }),
  };
}

export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

export function generateItemListJsonLd(
  name: string,
  listings: Listing[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 20).map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: l.name,
      url: `${siteConfig.url}/listing/${l.slug}`,
    })),
  };
}

export function generateFAQJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
