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

// Circle icon for each tier (100x100 viewBox, used inside a <g> with scaling)
function getIconSvg(tier: BadgeTier): string {
  if (tier.level === 4) {
    // Navy circle with gold crown
    return `<circle cx="50" cy="50" r="46" fill="${tier.color}"/>
      <path d="M26 62L22 36l12 8 16-18 16 18 12-8-4 26H26z" fill="${tier.accentColor}" stroke="${tier.accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="24" y="60" width="52" height="6" rx="2" fill="${tier.accentColor}"/>`;
  }
  if (tier.level === 3) {
    // Gold circle with star
    return `<circle cx="50" cy="50" r="46" fill="${tier.accentColor}"/>
      <path d="M50 18l7.9 16 17.6 2.6-12.7 12.4 3 17.5L50 58.2l-15.8 8.3 3-17.5L24.5 36.6l17.6-2.6L50 18z" fill="white" stroke="white" stroke-width="1"/>`;
  }
  if (tier.level === 2) {
    // Blue circle with shield + checkmark
    return `<circle cx="50" cy="50" r="46" fill="${tier.color}"/>
      <path d="M50 18L30 28v14c0 14.4 8.5 27.8 20 32 11.5-4.2 20-17.6 20-32V28L50 18z" fill="white" opacity="0.25"/>
      <path d="M50 22L33 30.5v12c0 12.5 7.3 24 17 27.5 9.7-3.5 17-15 17-27.5v-12L50 22z" fill="none" stroke="white" stroke-width="2.5"/>
      <path d="M39 50l7 7 15-16" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  // Tier 1: Gray circle with checkmark
  return `<circle cx="50" cy="50" r="46" fill="${tier.color}"/>
    <path d="M25 50l15 15 28-30" fill="none" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function generateBadgeSVG(
  listing: Listing,
  tier: BadgeTier,
  size: "default" | "compact" = "default"
): string {
  const year = new Date().getFullYear();
  const name = escapeXml(truncateName(listing.name, size === "compact" ? 24 : 36));
  const tierLabel = escapeXml(
    tier.level === 3 || tier.level === 4
      ? `${tier.name} ${year}`
      : tier.name
  );
  const font = `system-ui,-apple-system,'Segoe UI',Roboto,sans-serif`;

  if (size === "compact") {
    // Compact: 240x60, transparent, icon left + text right
    return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="60" viewBox="0 0 240 60">
  <g transform="translate(4, 6) scale(0.48)">${getIconSvg(tier)}</g>
  <text x="36" y="20" font-family="${font}" font-size="9" fill="#9CA3AF" font-weight="400">GarageDoorRepair.Directory</text>
  <text x="36" y="36" font-family="${font}" font-size="16" fill="${tier.color}" font-weight="800">${tierLabel.toUpperCase()}</text>
  <text x="36" y="52" font-family="${font}" font-size="11" fill="#6B7280" font-weight="500">${name}</text>
</svg>`;
  }

  // Default: 440x130, transparent background, large circle icon + text
  return `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="130" viewBox="0 0 440 130">
  <g transform="translate(10, 14)">${getIconSvg(tier)}</g>
  <text x="125" y="40" font-family="${font}" font-size="15" fill="#9CA3AF" font-weight="400" letter-spacing="0.5">GarageDoorRepair.Directory</text>
  <text x="125" y="76" font-family="${font}" font-size="30" fill="${tier.color}" font-weight="800" letter-spacing="-0.5">${tierLabel.toUpperCase()}</text>
  <text x="125" y="102" font-family="${font}" font-size="16" fill="#6B7280" font-weight="500">${name}</text>
</svg>`;
}
