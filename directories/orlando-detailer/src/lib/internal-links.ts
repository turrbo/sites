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
  const currentState = ctx.currentState?.toLowerCase();

  // 1. City page links (high priority for cities in same state)
  for (const cg of ctx.cityGroups) {
    // Skip current city
    if (
      cg.city.toLowerCase() === currentCity &&
      cg.state.toLowerCase() === currentState
    ) {
      continue;
    }

    const href = `/${cg.state.toLowerCase()}/${slugify(cg.city)}`;
    const sameState = cg.state.toLowerCase() === currentState;

    // Link "City, ST" format
    targets.push({
      text: `${cg.city}, ${cg.state}`,
      href,
      priority: sameState ? 8 : 3,
    });

    // Also link just the city name if it's distinctive enough (>5 chars)
    if (cg.city.length > 5 && sameState) {
      targets.push({
        text: cg.city,
        href,
        priority: 5,
      });
    }
  }

  // 2. State page links
  for (const sg of ctx.stateGroups) {
    if (sg.state.toLowerCase() === currentState) continue;

    targets.push({
      text: sg.stateFull,
      href: `/${sg.state.toLowerCase()}`,
      priority: 2,
    });
  }

  // 3. Guide page links (high priority for same-city guides)
  for (const page of ctx.seoPages) {
    if (page.slug === ctx.currentSlug) continue;

    // Extract a linkable phrase from the title
    const phrase = extractLinkPhrase(page.title);
    if (!phrase || phrase.length < 8) continue;

    const sameCity =
      page.city?.toLowerCase() === currentCity && currentCity !== undefined;

    targets.push({
      text: phrase,
      href: `/guides/${page.slug}`,
      priority: sameCity ? 7 : 4,
    });
  }

  // 4. Short service keyword links → same-city guide pages
  // Maps common short phrases in article content to the correct guide slug pattern
  if (currentCity && currentState) {
    const citySlug = slugify(ctx.currentCity || "");
    const stateSlug = currentState;
    const keywordGuideMap: [string, string][] = [
      ["spring replacement", `garage-door-spring-repair-${citySlug}-${stateSlug}`],
      ["spring repair", `garage-door-spring-repair-${citySlug}-${stateSlug}`],
      ["opener repair", `garage-door-opener-repair-${citySlug}-${stateSlug}`],
      ["opener replacement", `garage-door-opener-repair-${citySlug}-${stateSlug}`],
      ["garage door installation", `garage-door-installation-${citySlug}-${stateSlug}`],
      ["garage door maintenance", `garage-door-maintenance-${citySlug}-${stateSlug}`],
      ["garage door insulation", `garage-door-insulation-${citySlug}-${stateSlug}`],
      ["emergency garage door", `emergency-garage-door-repair-${citySlug}-${stateSlug}`],
      ["commercial garage door", `commercial-garage-door-repair-${citySlug}-${stateSlug}`],
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
    // Remove leading "Best" / "Top" / "Guide to"
    .replace(/^(?:Best|Top|Guide to|How to Choose|Finding)\s+/i, "")
    // Remove trailing "Guide" / "Services"
    .replace(/\s+(?:Guide|Services|Companies|Providers|Experts)$/i, "")
    .trim();

  // If the phrase is just the original title minus a city, use it
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
 * Generate a contextual "Related Resources" section for any page.
 * Returns an array of { title, href, description } objects.
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

  // Same-state cities
  if (ctx.currentState) {
    for (const cg of ctx.cityGroups) {
      if (
        cg.city.toLowerCase() === ctx.currentCity?.toLowerCase() &&
        cg.state.toLowerCase() === ctx.currentState?.toLowerCase()
      ) {
        continue;
      }
      if (cg.state.toLowerCase() === ctx.currentState?.toLowerCase()) {
        resources.push({
          title: `Garage Door Repair in ${cg.city}, ${cg.state}`,
          href: `/${cg.state.toLowerCase()}/${slugify(cg.city)}`,
          type: "city",
          priority: 6,
        });
      }
    }
  }

  // State page
  if (ctx.currentState) {
    for (const sg of ctx.stateGroups) {
      if (sg.state.toLowerCase() === ctx.currentState?.toLowerCase()) {
        resources.push({
          title: `All Cities in ${sg.stateFull}`,
          href: `/${sg.state.toLowerCase()}`,
          type: "state",
          priority: 5,
        });
      }
    }
  }

  return resources
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map(({ title, href, type }) => ({ title, href, type }));
}
