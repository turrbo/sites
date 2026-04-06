import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getListingBySlug } from "@/lib/sheets";
import {
  computeBadgeTier,
  getTierRequirements,
  type BadgeTier,
} from "@/lib/badges";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import BadgeEmbed from "./BadgeEmbed";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return {};

  return {
    title: `${listing.name} Badge | ${siteConfig.name}`,
    description: `Get your trust badge for ${listing.name} in ${listing.city}, ${listing.state}. Embed it on your website to build credibility with homeowners.`,
    robots: { index: false },
  };
}

const TIER_DESCRIPTIONS: Record<number, string> = {
  1: "Your business is listed in our directory. This is the base tier for all businesses.",
  2: "Your business meets our verification standards: a solid Google rating, active website, and customer reviews.",
  3: "Your business stands out with exceptional ratings, strong review volume, photos, and listed services.",
  4: "Your business is a featured partner with top-tier ratings and premium placement in our directory.",
};

const TIER_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700" },
  2: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
  4: { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700" },
};

function TierCard({ tier, isCurrent }: { tier: BadgeTier; isCurrent: boolean }) {
  const colors = TIER_COLORS[tier.level];
  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        isCurrent
          ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ${colors.border}`
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-bold ${isCurrent ? colors.text : "text-gray-400"}`}>
          {tier.name}
        </span>
        {isCurrent && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
            Your Tier
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500">
        {TIER_DESCRIPTIONS[tier.level]}
      </p>
    </div>
  );
}

export default async function BadgePage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const tier = computeBadgeTier(listing);
  const nextTierReqs = getTierRequirements(tier);
  const siteUrl = siteConfig.url;
  const badgeUrl = `${siteUrl}/api/badge/${listing.slug}`;
  const listingUrl = `${siteUrl}/listing/${listing.slug}`;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: listing.name, url: `/listing/${listing.slug}` },
    { name: "Badge", url: `/badge/${listing.slug}` },
  ];

  const allTiers: BadgeTier[] = [
    { level: 1, name: "Listed", color: "#6B7280", bgColor: "#F3F4F6", accentColor: "#9CA3AF" },
    { level: 2, name: "Verified", color: "#2563EB", bgColor: "#EFF6FF", accentColor: "#3B82F6" },
    { level: 3, name: "Top Rated", color: "#D97706", bgColor: "#FFFBEB", accentColor: "#F59E0B" },
    { level: 4, name: "Featured", color: "#1E3A8A", bgColor: "#EFF6FF", accentColor: "#F59E0B" },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />

      <div className="container py-8 max-w-4xl mx-auto px-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Trust Badge
          </h1>
          <p className="text-gray-600 mb-8">
            Embed this badge on your website to show homeowners that{" "}
            <strong>{listing.name}</strong> is recognized on{" "}
            {siteConfig.name}.
          </p>

          {/* Badge Preview */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Badge Preview
            </h2>
            <div className="flex flex-col gap-6 items-start">
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
                  Standard (440 x 130)
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={badgeUrl}
                  alt={`${tier.name} badge for ${listing.name}`}
                  width={440}
                  height={130}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
                  Compact (240 x 60)
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${badgeUrl}?size=compact`}
                  alt={`${tier.name} badge for ${listing.name} (compact)`}
                  width={240}
                  height={60}
                />
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <BadgeEmbed
            badgeUrl={badgeUrl}
            listingUrl={listingUrl}
            businessName={listing.name}
            tierName={tier.name}
          />

          {/* Current Tier */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Badge Tiers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allTiers.map((t) => (
                <TierCard
                  key={t.level}
                  tier={t}
                  isCurrent={t.level === tier.level}
                />
              ))}
            </div>
          </div>

          {/* Upgrade Guide */}
          {nextTierReqs.length > 0 && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                How to Upgrade Your Badge
              </h2>
              <p className="text-sm text-blue-700 mb-3">
                Meet the following criteria to reach the next tier:
              </p>
              <ul className="space-y-2">
                {nextTierReqs.map((req) => (
                  <li key={req} className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="mt-0.5 text-blue-400">&#9675;</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Why Add a Badge */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Why Add This Badge to Your Website?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">
                  Build Trust
                </h3>
                <p className="text-sm text-gray-600">
                  Third-party verification badges increase customer confidence,
                  similar to BBB or Yelp badges.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">
                  Improve SEO
                </h3>
                <p className="text-sm text-gray-600">
                  The badge links back to your listing on our directory, which
                  ranks for &ldquo;garage door repair&rdquo; in hundreds of cities.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">
                  Stand Out
                </h3>
                <p className="text-sm text-gray-600">
                  Show homeowners you are recognized and rated by an independent
                  directory covering {listing.city} and beyond.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href={`/listing/${listing.slug}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              &larr; Back to your listing
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
