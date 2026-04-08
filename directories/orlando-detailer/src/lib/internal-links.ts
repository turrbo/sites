import { CityGroup, SEOPage, StateGroup } from "./types";
import { slugify } from "./sheets";

interface LinkContext {
  cityGroups: CityGroup[];
  stateGroups: StateGroup[];
  seoPages: SEOPage[];
  currentSlug?: string;
  currentCity?: string;
  currentState?: string;
}

interface LinkTarget {
  text: string;
  href: string;
  priority: number; // higher = more important to link
}

/**
 * Inject internal links into HTML content.
 * Only links first occurrence of each term, avoids linking inside
 * existing <a> tags, headings, or already-linked text.
 */
export function injectInternalLinks(
  html: string,
  ctx: LinkContext,
  maxLinks: number = 15
): string {
  const targets = buildLinkTargets(ctx);
  if (targets.length === 0) return html;

  // Sort by priority (highest first), then by text length (longest first to avoid partial matches)
  targets.sort((a, b) => b.priority - a.priority || b.text.length - a.text.length);

  // Track which hrefs we've already linked to avoid duplicate destinations
  const linkedHrefs = new Set<string>();
  let linkCount = 0;
  let result = html;

  for (const target of targets) {
    if (linkCount >= maxLinks) break;
    if (linkedHrefs.has(target.href)) continue;

    const linked = linkFirstOccurrence(result, target.text, target.href);
    if (linked !== result) {
      result = linked;
      linkedHrefs.add(target.href);
      linkCount++;
    }
  }

  return result;
}

function buildLinkTargets(ctx: LinkContext): LinkTarget[] {
  const targets: LinkTarget[] = [];
  const currentCity = ctx.currentCity?.toLowerCase();

  // 1. City page links (high priority for nearby cities)
  for (const cg of ctx.cityGroups) {
    if (cg.city.toLowerCase() === currentCity) continue;

    const href = `/${cg.slug || slugify(cg.city)}`;

    // Link "City" name
    targets.push({
      text: cg.city,
      href,
      priority: 6,
    });

    // Link "City, FL" format
    targets.push({
      text: `${cg.city}, FL`,
      href,
      priority: 7,
    });
  }

  // 2. Guide page links (high priority for same-city guides)
  for (const page of ctx.seoPages) {
    if (page.slug === ctx.currentSlug) continue;

    const phrase = extractLinkPhrase(page.title);
    if (!phrase || phrase.length < 8) continue;

    const sameCity =
      page.city?.toLowerCase() === currentCity && currentCity !== undefined;

    targets.push({
      text: phrase,
      href: `/guides/${page.slug}`,
      priority: sameCity ? 8 : 4,
    });
  }

  // 3. Service keyword links -> same-city guide pages
  if (currentCity) {
    const citySlug = slugify(ctx.currentCity || "");
    const keywordGuideMap: [string, string][] = [
      ["auto detailing", `best-auto-detailing-${citySlug}-fl`],
      ["car detailing", `best-auto-detailing-${citySlug}-fl`],
      ["ceramic coating", `ceramic-coating-cost-${citySlug}-fl`],
      ["ceramic coat", `ceramic-coating-cost-${citySlug}-fl`],
      ["window tinting", `window-tinting-laws-${citySlug}-fl`],
      ["window tint", `best-window-tint-shops-${citySlug}-fl`],
      ["tint shops", `best-window-tint-shops-${citySlug}-fl`],
      ["vehicle wrap", `vehicle-wrap-cost-${citySlug}-fl`],
      ["car wrap", `vehicle-wrap-cost-${citySlug}-fl`],
      ["paint protection film", `ppf-vs-ceramic-coating-${citySlug}-fl`],
      ["PPF", `ppf-vs-ceramic-coating-${citySlug}-fl`],
      ["mobile detailing", `mobile-detailing-services-${citySlug}-fl`],
      ["fleet wraps", `commercial-fleet-wraps-${citySlug}-fl`],
      ["commercial wraps", `commercial-fleet-wraps-${citySlug}-fl`],
      ["paint correction", `best-auto-detailing-${citySlug}-fl`],
      ["interior detailing", `best-auto-detailing-${citySlug}-fl`],
    ];

    // Only add if the target guide page actually exists
    const slugSet = new Set(ctx.seoPages.map((p) => p.slug));
    for (const [text, guideSlug] of keywordGuideMap) {
      if (guideSlug === ctx.currentSlug) continue;
      if (slugSet.has(guideSlug)) {
        targets.push({ text, href: `/guides/${guideSlug}`, priority: 6 });
      }
    }
  }

  // 4. Cross-page links: cost calculator, browse, blog
  targets.push({ text: "cost calculator", href: "/cost-calculator", priority: 5 });
  targets.push({ text: "browse shops", href: "/browse", priority: 3 });
  targets.push({ text: "get quotes", href: "/get-quotes", priority: 3 });

  return targets;
}

/**
 * Extract a short linkable phrase from a guide title.
 * Removes city/state suffixes and common prefixes.
 */
function extractLinkPhrase(title: string): string | null {
  let phrase = title
    // Remove "Best ... in City, ST" pattern
    .replace(/\s+in\s+[A-Z][a-zA-Z\s]+,?\s*[A-Z]{0,2}\s*$/i, "")
    // Remove trailing " - City, FL" or " City FL"
    .replace(/\s*[-–]\s*[A-Z][a-zA-Z\s]+,?\s*FL\s*$/i, "")
    // Remove leading "Best" / "Top" / "Guide to"
    .replace(/^(?:Best|Top|Guide to|How to Choose|Finding)\s+/i, "")
    // Remove trailing "Guide" / "Services"
    .replace(/\s+(?:Guide|Services|Companies|Providers|Experts|Shops)$/i, "")
    .trim();

  if (phrase.length >= 8 && phrase.length <= 60) {
    return phrase;
  }

  return null;
}

/**
 * Link the first occurrence of `text` in `html` that is NOT inside:
 * - An existing <a> tag
 * - A heading tag (<h1>-<h6>)
 * - An HTML attribute
 *
 * Uses a simple state-machine approach that's safe for server-side rendering.
 */
function linkFirstOccurrence(
  html: string,
  text: string,
  href: string
): string {
  // Build a case-insensitive regex that matches whole words
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");

  // Split HTML into segments: tags vs text content
  const segments = html.split(/(<[^>]+>)/);
  let insideAnchor = 0;
  let insideHeading = 0;
  let linked = false;

  const result = segments.map((segment) => {
    if (linked) return segment;

    // Check if this is an HTML tag
    if (segment.startsWith("<")) {
      const tagLower = segment.toLowerCase();

      // Track anchor nesting
      if (tagLower.startsWith("<a ") || tagLower.startsWith("<a>")) {
        insideAnchor++;
      } else if (tagLower === "</a>") {
        insideAnchor = Math.max(0, insideAnchor - 1);
      }

      // Track heading nesting
      if (/^<h[1-6][\s>]/i.test(tagLower)) {
        insideHeading++;
      } else if (/^<\/h[1-6]>/i.test(tagLower)) {
        insideHeading = Math.max(0, insideHeading - 1);
      }

      return segment;
    }

    // This is text content - only link if not inside anchor or heading
    if (insideAnchor > 0 || insideHeading > 0) return segment;

    const match = pattern.exec(segment);
    if (match) {
      linked = true;
      const before = segment.slice(0, match.index);
      const matched = segment.slice(match.index, match.index + match[0].length);
      const after = segment.slice(match.index + match[0].length);
      return `${before}<a href="${href}" class="text-blue-600 hover:underline">${matched}</a>${after}`;
    }

    return segment;
  });

  return result.join("");
}

/**
 * DTP cross-site callout: keyword in page content -> relevant DTP review/guide URL.
 * Returns the first matching callout for the given content, or null.
 */
export interface DTPCallout {
  label: string;
  url: string;
  description: string;
}

const DTP_BASE = "https://detailedtoperfection.com";

const DTP_CALLOUTS: { keywords: RegExp; callout: DTPCallout }[] = [
  {
    keywords: /ceramic\s+coat/i,
    callout: {
      label: "Best Ceramic Coating Sprays 2026",
      url: `${DTP_BASE}/reviews/best-ceramic-coating-sprays-2026`,
      description: "See our hands-on reviews of the top ceramic coating sprays.",
    },
  },
  {
    keywords: /paint\s+correct|polish|compound/i,
    callout: {
      label: "Best Polishing Compounds Reviewed",
      url: `${DTP_BASE}/reviews/best-polishing-compounds-for-paint-correction`,
      description: "Compare polishing compounds rated by cut, finish, and ease of use.",
    },
  },
  {
    keywords: /foam\s+cannon|foam\s+gun|pre.?wash/i,
    callout: {
      label: "Best Foam Cannons 2026",
      url: `${DTP_BASE}/reviews/best-foam-cannons-for-car-washing`,
      description: "Find the right foam cannon for your wash setup.",
    },
  },
  {
    keywords: /pressure\s+wash|power\s+wash/i,
    callout: {
      label: "Best Pressure Washers for Detailing",
      url: `${DTP_BASE}/reviews/best-pressure-washers-for-auto-detailing`,
      description: "Pressure washers reviewed specifically for auto detailing use.",
    },
  },
  {
    keywords: /interior\s+detail|leather\s+clean|upholster/i,
    callout: {
      label: "Best Interior Detailing Kits",
      url: `${DTP_BASE}/reviews/best-interior-detailing-kits`,
      description: "Complete interior kits reviewed for leather, fabric, and plastics.",
    },
  },
  {
    keywords: /clay\s+bar|decontam/i,
    callout: {
      label: "How to Clay Bar Your Car",
      url: `${DTP_BASE}/guides/how-to-clay-bar-your-car-complete-guide`,
      description: "Step-by-step clay bar guide from our detailing experts.",
    },
  },
  {
    keywords: /wax|sealant|paint\s+protect/i,
    callout: {
      label: "Best Car Waxes and Sealants",
      url: `${DTP_BASE}/reviews/best-car-waxes-and-sealants-2026`,
      description: "Waxes and sealants compared for durability and gloss.",
    },
  },
  {
    keywords: /microfiber|towel|dry/i,
    callout: {
      label: "Best Microfiber Towels Reviewed",
      url: `${DTP_BASE}/reviews/best-microfiber-towels-for-detailing`,
      description: "We tested dozens of microfiber towels for wash, buff, and detail.",
    },
  },
  {
    keywords: /wheel\s+clean|rim|brake\s+dust/i,
    callout: {
      label: "Best Wheel Cleaners 2026",
      url: `${DTP_BASE}/reviews/best-wheel-cleaners-2026`,
      description: "Acid-free and heavy-duty wheel cleaners put to the test.",
    },
  },
  {
    keywords: /window\s+tint|tint\s+film/i,
    callout: {
      label: "Window Tint Maintenance Guide",
      url: `${DTP_BASE}/guides/window-tint-care-and-maintenance`,
      description: "How to care for window tint so it lasts.",
    },
  },
  {
    keywords: /PPF|paint\s+protection\s+film|clear\s+bra/i,
    callout: {
      label: "PPF vs Ceramic Coating vs Vinyl Wrap",
      url: `${DTP_BASE}/blog/ppf-vs-ceramic-coating-vs-vinyl-wrap-complete-comparison`,
      description: "In-depth comparison to help you choose the right protection.",
    },
  },
  {
    keywords: /detail|wash|car\s+care/i,
    callout: {
      label: "Detailed to Perfection",
      url: DTP_BASE,
      description: "Product reviews and how-to guides for auto detailing enthusiasts.",
    },
  },
];

export function getDTPCallout(content: string): DTPCallout | null {
  for (const entry of DTP_CALLOUTS) {
    if (entry.keywords.test(content)) {
      return entry.callout;
    }
  }
  return null;
}

/**
 * Generate a contextual "Related Resources" section for any page.
 * Returns an array of { title, href, type } objects.
 */
export function getRelatedResources(
  ctx: LinkContext,
  limit: number = 8
): { title: string; href: string; type: string }[] {
  const resources: { title: string; href: string; type: string; priority: number }[] = [];

  // Same-city guides
  if (ctx.currentCity) {
    for (const page of ctx.seoPages) {
      if (page.slug === ctx.currentSlug) continue;
      if (page.city?.toLowerCase() === ctx.currentCity?.toLowerCase()) {
        resources.push({
          title: page.title,
          href: `/guides/${page.slug}`,
          type: "guide",
          priority: 10,
        });
      }
    }
  }

  // Other cities
  for (const cg of ctx.cityGroups) {
    if (cg.city.toLowerCase() === ctx.currentCity?.toLowerCase()) continue;

    resources.push({
      title: `Auto Detailing in ${cg.city}, FL`,
      href: `/${cg.slug || slugify(cg.city)}`,
      type: "city",
      priority: 6,
    });
  }

  // Cost calculator
  resources.push({
    title: "Auto Care Cost Calculator",
    href: "/cost-calculator",
    type: "tool",
    priority: 7,
  });

  return resources
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map(({ title, href, type }) => ({ title, href, type }));
}
