import { Listing } from "./types";

export interface BadgeTier {
  level: 1 | 2 | 3 | 4;
  name: string;
  color: string;
  bgColor: string;
  accentColor: string;
}

const TIERS: Record<number, BadgeTier> = {
  1: {
    level: 1,
    name: "Listed",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    accentColor: "#9CA3AF",
  },
  2: {
    level: 2,
    name: "Verified",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    accentColor: "#3B82F6",
  },
  3: {
    level: 3,
    name: "Top Rated",
    color: "#D97706",
    bgColor: "#FFFBEB",
    accentColor: "#F59E0B",
  },
  4: {
    level: 4,
    name: "Featured",
    color: "#1E3A8A",
    bgColor: "#EFF6FF",
    accentColor: "#F59E0B",
  },
};

export function computeBadgeTier(listing: Listing): BadgeTier {
  const rating = listing.rating ?? 0;
  const reviews = listing.reviewCount ?? 0;
  const hasWebsite = !!listing.website;
  const hasPhotos =
    (listing.galleryUrls && listing.galleryUrls.length > 0) ||
    !!listing.imageUrl;
  const hasServices = listing.services && listing.services.length > 0;

  // Tier 4: Featured (paid) - check featured flag
  if (
    listing.featured &&
    rating >= 4.3 &&
    reviews >= 25 &&
    hasPhotos &&
    hasServices
  ) {
    return TIERS[4];
  }

  // Tier 3: Top Rated
  if (rating >= 4.3 && reviews >= 25 && hasPhotos && hasServices) {
    return TIERS[3];
  }

  // Tier 2: Verified
  if (rating >= 3.5 && hasWebsite && reviews >= 1) {
    return TIERS[2];
  }

  // Tier 1: Listed
  return TIERS[1];
}

export function getTierRequirements(currentTier: BadgeTier): string[] {
  if (currentTier.level >= 3) return [];

  if (currentTier.level === 2) {
    return [
      "Google rating of 4.3 or higher",
      "At least 25 Google reviews",
      "Photos on your listing",
      "Services listed on your profile",
    ];
  }

  // Level 1
  return [
    "Google rating of 3.5 or higher",
    "An active website",
    "At least 1 Google review",
  ];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateName(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + "\u2026";
}

// Shield icon paths for each tier
function getIconSvg(tier: BadgeTier): string {
  if (tier.level === 4) {
    // Crown
    return `<path d="M6 18L3 9l5 3 4-6 4 6 5-3-3 9H6z" fill="${tier.accentColor}" stroke="${tier.color}" stroke-width="1.5"/>`;
  }
  if (tier.level === 3) {
    // Star
    return `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="${tier.accentColor}" stroke="${tier.color}" stroke-width="1"/>`;
  }
  // Shield with checkmark (tiers 1 & 2)
  return `<path d="M12 2L4 6v5c0 5.25 3.4 10.2 8 12 4.6-1.8 8-6.75 8-12V6l-8-4z" fill="${tier.color}" opacity="0.15" stroke="${tier.color}" stroke-width="1.5"/><path d="M9 12l2 2 4-4" fill="none" stroke="${tier.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

export function generateBadgeSVG(
  listing: Listing,
  tier: BadgeTier,
  size: "default" | "compact" = "default"
): string {
  const year = new Date().getFullYear();
  const name = escapeXml(truncateName(listing.name, size === "compact" ? 20 : 32));
  const tierLabel = escapeXml(
    tier.level === 3 || tier.level === 4
      ? `${tier.name} ${year}`
      : tier.name
  );

  if (size === "compact") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="56" viewBox="0 0 200 56">
  <rect width="200" height="56" rx="6" fill="white" stroke="${tier.color}" stroke-width="1.5"/>
  <g transform="translate(8, 8) scale(0.7)">${getIconSvg(tier)}</g>
  <text x="32" y="22" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" fill="${tier.color}">${tierLabel}</text>
  <text x="32" y="36" font-family="system-ui,-apple-system,sans-serif" font-size="9" fill="#6B7280">${name}</text>
  <text x="32" y="48" font-family="system-ui,-apple-system,sans-serif" font-size="7" fill="#9CA3AF">GarageDoorRepair.Directory</text>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="100" viewBox="0 0 280 100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white"/>
      <stop offset="100%" style="stop-color:${tier.bgColor}"/>
    </linearGradient>
  </defs>
  <rect width="280" height="100" rx="8" fill="url(#bg)" stroke="${tier.color}" stroke-width="2"/>
  <rect x="0" y="0" width="6" height="100" rx="8" fill="${tier.color}"/>
  <g transform="translate(18, 16) scale(1.1)">${getIconSvg(tier)}</g>
  <text x="52" y="34" font-family="system-ui,-apple-system,sans-serif" font-size="15" font-weight="700" fill="${tier.color}">${tierLabel}</text>
  <text x="52" y="54" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="500" fill="#374151">${name}</text>
  <line x1="52" y1="64" x2="260" y2="64" stroke="${tier.color}" stroke-width="0.5" opacity="0.3"/>
  <text x="52" y="80" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="#9CA3AF">GarageDoorRepair.Directory</text>
  ${tier.level >= 3 ? `<text x="52" y="92" font-family="system-ui,-apple-system,sans-serif" font-size="8" fill="#9CA3AF">${listing.rating ? listing.rating.toFixed(1) + " ★" : ""} ${listing.reviewCount ? "· " + listing.reviewCount + " reviews" : ""}</text>` : ""}
</svg>`;
}
