#!/usr/bin/env node
/**
 * Expand directory to new cities with FULL enhanced data in a single pass.
 *
 * For each city:
 *   1. Google Places Text Search (with photos FieldMask)
 *   2. Scrape each business website: social media, year established, services
 *   3. Build gallery URLs from Places photo references
 *   4. Generate all 10 SEO article types
 *
 * Outputs JSON files, then pushes to Google Sheets.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=xxx node scripts/expand-cities-v2.js
 *   GOOGLE_PLACES_API_KEY=xxx node scripts/expand-cities-v2.js --dry-run
 *   GOOGLE_PLACES_API_KEY=xxx node scripts/expand-cities-v2.js --generate-only
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load env
const envPath = path.join(__dirname, "..", ".env.local");
const env = {};
try {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) {
      let val = m[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      env[m[1].trim()] = val;
    }
  }
} catch {}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || env.GOOGLE_PLACES_API_KEY;
const SHEET_ID = env.GOOGLE_SHEET_ID;
const SERVICE_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

const DRY_RUN = process.argv.includes("--dry-run");
const GENERATE_ONLY = process.argv.includes("--generate-only");

if (!API_KEY) {
  console.error("GOOGLE_PLACES_API_KEY is required");
  process.exit(1);
}

// ─── New cities to add ───────────────────────────────────────────────
// Batch 3: 100 additional cities — suburbs, mid-size metros, growth markets
const NEW_CITIES = [
  // California suburbs & mid-size
  { city: "Ontario", state: "CA", stateFull: "California" },
  { city: "Rancho Cucamonga", state: "CA", stateFull: "California" },
  { city: "Oceanside", state: "CA", stateFull: "California" },
  { city: "Elk Grove", state: "CA", stateFull: "California" },
  { city: "Roseville", state: "CA", stateFull: "California" },
  { city: "Hayward", state: "CA", stateFull: "California" },
  { city: "Escondido", state: "CA", stateFull: "California" },
  { city: "Sunnyvale", state: "CA", stateFull: "California" },
  { city: "Pomona", state: "CA", stateFull: "California" },
  { city: "Visalia", state: "CA", stateFull: "California" },
  // Texas suburbs & mid-size
  { city: "McKinney", state: "TX", stateFull: "Texas" },
  { city: "Frisco", state: "TX", stateFull: "Texas" },
  { city: "Pasadena", state: "TX", stateFull: "Texas" },
  { city: "Killeen", state: "TX", stateFull: "Texas" },
  { city: "McAllen", state: "TX", stateFull: "Texas" },
  { city: "Midland", state: "TX", stateFull: "Texas" },
  { city: "Denton", state: "TX", stateFull: "Texas" },
  { city: "Round Rock", state: "TX", stateFull: "Texas" },
  { city: "Amarillo", state: "TX", stateFull: "Texas" },
  { city: "Brownsville", state: "TX", stateFull: "Texas" },
  // Florida suburbs & mid-size
  { city: "Cape Coral", state: "FL", stateFull: "Florida" },
  { city: "Tallahassee", state: "FL", stateFull: "Florida" },
  { city: "Fort Lauderdale", state: "FL", stateFull: "Florida" },
  { city: "Pembroke Pines", state: "FL", stateFull: "Florida" },
  { city: "Hollywood", state: "FL", stateFull: "Florida" },
  { city: "Gainesville", state: "FL", stateFull: "Florida" },
  { city: "Clearwater", state: "FL", stateFull: "Florida" },
  { city: "Palm Bay", state: "FL", stateFull: "Florida" },
  // Arizona suburbs
  { city: "Tempe", state: "AZ", stateFull: "Arizona" },
  { city: "Surprise", state: "AZ", stateFull: "Arizona" },
  { city: "Peoria", state: "AZ", stateFull: "Arizona" },
  { city: "Goodyear", state: "AZ", stateFull: "Arizona" },
  // Georgia
  { city: "Augusta", state: "GA", stateFull: "Georgia" },
  { city: "Macon", state: "GA", stateFull: "Georgia" },
  { city: "Roswell", state: "GA", stateFull: "Georgia" },
  // North Carolina
  { city: "Fayetteville", state: "NC", stateFull: "North Carolina" },
  { city: "Wilmington", state: "NC", stateFull: "North Carolina" },
  { city: "Cary", state: "NC", stateFull: "North Carolina" },
  { city: "Asheville", state: "NC", stateFull: "North Carolina" },
  // Ohio
  { city: "Akron", state: "OH", stateFull: "Ohio" },
  { city: "Dayton", state: "OH", stateFull: "Ohio" },
  { city: "Canton", state: "OH", stateFull: "Ohio" },
  // Michigan
  { city: "Grand Rapids", state: "MI", stateFull: "Michigan" },
  { city: "Warren", state: "MI", stateFull: "Michigan" },
  { city: "Sterling Heights", state: "MI", stateFull: "Michigan" },
  { city: "Ann Arbor", state: "MI", stateFull: "Michigan" },
  // Virginia
  { city: "Alexandria", state: "VA", stateFull: "Virginia" },
  { city: "Hampton", state: "VA", stateFull: "Virginia" },
  { city: "Newport News", state: "VA", stateFull: "Virginia" },
  // Indiana
  { city: "Evansville", state: "IN", stateFull: "Indiana" },
  { city: "South Bend", state: "IN", stateFull: "Indiana" },
  { city: "Carmel", state: "IN", stateFull: "Indiana" },
  // Colorado
  { city: "Lakewood", state: "CO", stateFull: "Colorado" },
  { city: "Thornton", state: "CO", stateFull: "Colorado" },
  { city: "Fort Collins", state: "CO", stateFull: "Colorado" },
  // Tennessee
  { city: "Clarksville", state: "TN", stateFull: "Tennessee" },
  { city: "Murfreesboro", state: "TN", stateFull: "Tennessee" },
  // Washington
  { city: "Vancouver", state: "WA", stateFull: "Washington" },
  { city: "Bellevue", state: "WA", stateFull: "Washington" },
  { city: "Kent", state: "WA", stateFull: "Washington" },
  // Oregon
  { city: "Eugene", state: "OR", stateFull: "Oregon" },
  { city: "Salem", state: "OR", stateFull: "Oregon" },
  // Nevada
  { city: "Sparks", state: "NV", stateFull: "Nevada" },
  // Missouri
  { city: "Springfield", state: "MO", stateFull: "Missouri" },
  { city: "Independence", state: "MO", stateFull: "Missouri" },
  // Minnesota
  { city: "Rochester", state: "MN", stateFull: "Minnesota" },
  { city: "Bloomington", state: "MN", stateFull: "Minnesota" },
  // Wisconsin
  { city: "Green Bay", state: "WI", stateFull: "Wisconsin" },
  { city: "Kenosha", state: "WI", stateFull: "Wisconsin" },
  // New Jersey
  { city: "Paterson", state: "NJ", stateFull: "New Jersey" },
  { city: "Elizabeth", state: "NJ", stateFull: "New Jersey" },
  { city: "Trenton", state: "NJ", stateFull: "New Jersey" },
  // Pennsylvania
  { city: "Allentown", state: "PA", stateFull: "Pennsylvania" },
  { city: "Erie", state: "PA", stateFull: "Pennsylvania" },
  { city: "Reading", state: "PA", stateFull: "Pennsylvania" },
  // Illinois
  { city: "Naperville", state: "IL", stateFull: "Illinois" },
  { city: "Rockford", state: "IL", stateFull: "Illinois" },
  { city: "Joliet", state: "IL", stateFull: "Illinois" },
  // Maryland
  { city: "Columbia", state: "MD", stateFull: "Maryland" },
  { city: "Frederick", state: "MD", stateFull: "Maryland" },
  // Massachusetts
  { city: "Worcester", state: "MA", stateFull: "Massachusetts" },
  { city: "Springfield", state: "MA", stateFull: "Massachusetts" },
  // Louisiana
  { city: "Shreveport", state: "LA", stateFull: "Louisiana" },
  { city: "Lafayette", state: "LA", stateFull: "Louisiana" },
  // Kentucky
  { city: "Bowling Green", state: "KY", stateFull: "Kentucky" },
  // Oklahoma
  { city: "Norman", state: "OK", stateFull: "Oklahoma" },
  { city: "Broken Arrow", state: "OK", stateFull: "Oklahoma" },
  // Kansas
  { city: "Overland Park", state: "KS", stateFull: "Kansas" },
  { city: "Olathe", state: "KS", stateFull: "Kansas" },
  // Iowa
  { city: "Cedar Rapids", state: "IA", stateFull: "Iowa" },
  { city: "Davenport", state: "IA", stateFull: "Iowa" },
  // Nebraska
  { city: "Bellevue", state: "NE", stateFull: "Nebraska" },
  // Arkansas
  { city: "Fayetteville", state: "AR", stateFull: "Arkansas" },
  { city: "Fort Smith", state: "AR", stateFull: "Arkansas" },
  // Mississippi
  { city: "Gulfport", state: "MS", stateFull: "Mississippi" },
  // Alabama
  { city: "Montgomery", state: "AL", stateFull: "Alabama" },
  { city: "Tuscaloosa", state: "AL", stateFull: "Alabama" },
  // South Carolina
  { city: "Greenville", state: "SC", stateFull: "South Carolina" },
  { city: "North Charleston", state: "SC", stateFull: "South Carolina" },
  // New York
  { city: "Rochester", state: "NY", stateFull: "New York" },
  { city: "Syracuse", state: "NY", stateFull: "New York" },
  { city: "Yonkers", state: "NY", stateFull: "New York" },
  // Connecticut
  { city: "New Haven", state: "CT", stateFull: "Connecticut" },
  { city: "Stamford", state: "CT", stateFull: "Connecticut" },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Google Sheets auth ──────────────────────────────────────────────

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: SERVICE_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const eh = base64url(JSON.stringify(header));
  const ep = base64url(JSON.stringify(payload));
  const si = `${eh}.${ep}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(si);
  const sig = sign
    .sign(PRIVATE_KEY, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const jwt = `${si}.${sig}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Auth failed: " + JSON.stringify(data));
  return data.access_token;
}

// ─── Google Places search ────────────────────────────────────────────

async function searchPlaces(city, state) {
  try {
    const body = JSON.stringify({
      textQuery: `garage door repair in ${city}, ${state}`,
      maxResultCount: 8,
    });

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        // Include photos in the same request - no separate Details call needed
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.nationalPhoneNumber",
          "places.internationalPhoneNumber",
          "places.websiteUri",
          "places.rating",
          "places.userRatingCount",
          "places.currentOpeningHours",
          "places.editorialSummary",
          "places.googleMapsUri",
          "places.location",
          "places.addressComponents",
          "places.shortFormattedAddress",
          "places.photos",
        ].join(","),
      },
      body,
    });

    return await res.json();
  } catch (e) {
    console.error(`  Search failed for ${city}, ${state}: ${e.message}`);
    return { places: [] };
  }
}

// ─── Website scraping ────────────────────────────────────────────────

async function fetchHTML(url, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    const text = await res.text();
    return text.slice(0, 500000);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Social media patterns
const SOCIAL_PATTERNS = {
  facebook: [
    /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"'\s?#]+)/gi,
    /href=["'](https?:\/\/(?:www\.)?fb\.com\/[^"'\s?#]+)/gi,
  ],
  instagram: [/href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'\s?#]+)/gi],
  yelp: [/href=["'](https?:\/\/(?:www\.)?yelp\.com\/biz\/[^"'\s?#]+)/gi],
  twitter: [/href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^"'\s?#]+)/gi],
  youtube: [/href=["'](https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|user|@)[^"'\s?#]+)/gi],
  nextdoor: [/href=["'](https?:\/\/(?:www\.)?nextdoor\.com\/(?:pages|business)\/[^"'\s?#]+)/gi],
};

const SOCIAL_EXCLUDES =
  /\/sharer|\/share\?|\/login|\/signup|\/intent\/|\/hashtag\/|facebook\.com\/?["']|instagram\.com\/?["']|twitter\.com\/?["']|x\.com\/?["']/i;

function extractSocialLinks(html) {
  const results = {};
  for (const [platform, patterns] of Object.entries(SOCIAL_PATTERNS)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1].replace(/\/+$/, "");
        if (!SOCIAL_EXCLUDES.test(url) && url.length > 20) {
          results[platform] = url;
          break;
        }
      }
      if (results[platform]) break;
    }
  }
  return results;
}

function extractYearEstablished(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  const currentYear = new Date().getFullYear();

  const estMatch = text.match(
    /(?:establish|founded?|since|serving\s+since|in\s+business\s+since|est\.?\s*)\s*(?:in\s+)?(\d{4})/i
  );
  if (estMatch) {
    const year = parseInt(estMatch[1]);
    if (year >= 1950 && year <= currentYear) return year;
  }

  const sinceMatch = text.match(/since\s+(\d{4})/i);
  if (sinceMatch) {
    const year = parseInt(sinceMatch[1]);
    if (year >= 1950 && year <= currentYear) return year;
  }

  const yearsMatch = text.match(
    /(?:over\s+)?(\d{1,3})\+?\s*years?\s*(?:of\s+)?(?:experience|in\s+business|serving|of\s+service)/i
  );
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years >= 2 && years <= 80) return currentYear - years;
  }

  return null;
}

// Service keywords
const SERVICE_KEYWORDS =
  /repair|install|replace|spring|opener|door|service|maint|inspect|cable|track|roller|panel|emergency|commercial|custom|insul|lubrication|tune.?up|smart|high.?speed|overhead|rolling|torsion|extension|weather.?seal|remote|keypad|sensor|balance|align/i;
const EXCLUDE_WORDS =
  /home|about|contact|gallery|blog|review|testimonial|location|area|career|job|apply|financ|coupon|special|faq|privacy|terms|sitemap|login|sign|call|free estimate|book|schedule|quote|resource|useful|video|photo|meet|team|why choose|professional|technician|hour|map/i;

const DEFAULT_SERVICES = [
  "Garage Door Repair",
  "Garage Door Installation",
  "Spring Replacement",
  "Garage Door Opener Repair",
  "Garage Door Opener Installation",
  "Emergency Garage Door Service",
  "Garage Door Maintenance",
  "Panel Replacement",
  "Cable Repair",
  "Track Repair & Alignment",
  "Roller Replacement",
  "Garage Door Safety Inspection",
].join(", ");

function extractServices(html) {
  const services = new Set();
  // Check nav links and headings
  const linkMatches = html.matchAll(/<a[^>]*>([^<]{3,80})<\/a>/gi);
  for (const m of linkMatches) {
    const text = m[1].trim();
    if (SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text)) {
      services.add(text.replace(/\s+/g, " "));
    }
  }
  const headingMatches = html.matchAll(/<h[1-4][^>]*>([^<]{3,100})<\/h[1-4]>/gi);
  for (const m of headingMatches) {
    const text = m[1].trim();
    if (SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text)) {
      services.add(text.replace(/\s+/g, " "));
    }
  }
  // List items in service sections
  const listMatches = html.matchAll(/<li[^>]*>([^<]{3,80})<\/li>/gi);
  for (const m of listMatches) {
    const text = m[1].trim();
    if (SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text)) {
      services.add(text.replace(/\s+/g, " "));
    }
  }
  return services.size >= 3 ? [...services].slice(0, 15).join(", ") : DEFAULT_SERVICES;
}

// ─── Photo URL builder ───────────────────────────────────────────────

function buildPhotoUrls(place) {
  if (!place.photos || place.photos.length === 0) return { mainPhoto: "", gallery: "" };

  const mainPhoto = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=400&maxWidthPx=600&key=${API_KEY}`;
  const galleryPhotos = place.photos
    .slice(1, 6)
    .map((p) => `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=400&maxWidthPx=600&key=${API_KEY}`);
  return { mainPhoto, gallery: galleryPhotos.join(", ") };
}

// ─── Format listing ──────────────────────────────────────────────────

function formatListing(place, city, state, stateFull, enhanced) {
  const name = place.displayName?.text || "";
  const addr = place.formattedAddress || place.shortFormattedAddress || "";

  let zip = "";
  if (place.addressComponents) {
    for (const c of place.addressComponents) {
      if (c.types?.includes("postal_code")) zip = c.longText || c.shortText || "";
    }
  }
  if (!zip) {
    const zipMatch = addr.match(/\b(\d{5})\b/);
    if (zipMatch) zip = zipMatch[1];
  }

  const { mainPhoto, gallery } = buildPhotoUrls(place);

  return {
    Name: name,
    Slug: slugify(`${name}-${city}-${state}`),
    Category: "Garage Door Repair",
    Description:
      place.editorialSummary?.text ||
      `${name} provides professional garage door repair services in ${city}, ${stateFull}. Contact us for garage door installation, spring repair, opener replacement, and emergency service.`,
    "Short Description": (
      place.editorialSummary?.text ||
      `Professional garage door repair in ${city}, ${stateFull}.`
    ).slice(0, 150),
    Address: addr,
    City: city,
    State: state,
    "State Full": stateFull,
    Zip: zip,
    Phone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
    Website: place.websiteUri || "",
    Email: "",
    "Image URL": mainPhoto,
    Rating: place.rating ? String(place.rating) : "",
    "Review Count": place.userRatingCount ? String(place.userRatingCount) : "",
    "Price Range": "",
    Amenities: "",
    Hours: place.currentOpeningHours?.weekdayDescriptions?.join("; ") || "",
    Latitude: place.location?.latitude ? String(place.location.latitude) : "",
    Longitude: place.location?.longitude ? String(place.location.longitude) : "",
    Featured: "FALSE",
    Published: "TRUE",
    Tags: "garage door repair",
    "Source URL": place.googleMapsUri || "",
    // Enhanced columns
    Services: enhanced.services || DEFAULT_SERVICES,
    Facebook: enhanced.social?.facebook || "",
    Instagram: enhanced.social?.instagram || "",
    Yelp: enhanced.social?.yelp || "",
    Twitter: enhanced.social?.twitter || "",
    YouTube: enhanced.social?.youtube || "",
    Nextdoor: enhanced.social?.nextdoor || "",
    "Year Established": enhanced.yearEstablished ? String(enhanced.yearEstablished) : "",
    Gallery: gallery,
  };
}

// ─── SEO article templates (all 10) ─────────────────────────────────

const SEO_TEMPLATES = [
  {
    titleFn: (c, s) => `How Much Does Garage Door Repair Cost in ${c}, ${s}? (2026 Price Guide)`,
    slugFn: (c, s) => `garage-door-repair-cost-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Garage Door Repair Costs in ${c}, ${sf}</h2><p>If you're a homeowner in ${c}, ${sf} dealing with a malfunctioning garage door, understanding repair costs can help you budget effectively. Garage door repair prices in ${c} typically range from <strong>$150 to $600</strong>, depending on the type of repair needed.</p><h3>Common Garage Door Repair Costs in ${c}</h3><ul><li><strong>Spring replacement:</strong> $200 - $400 (torsion springs) or $150 - $250 (extension springs)</li><li><strong>Opener repair:</strong> $150 - $350</li><li><strong>Cable replacement:</strong> $150 - $250</li><li><strong>Panel replacement:</strong> $250 - $800</li><li><strong>Track repair/alignment:</strong> $125 - $250</li><li><strong>Roller replacement:</strong> $100 - $200</li><li><strong>Sensor repair:</strong> $100 - $175</li></ul><h3>Factors That Affect Pricing in ${c}</h3><ul><li><strong>Labor rates:</strong> ${c} labor costs may differ from national averages based on local cost of living</li><li><strong>Door type:</strong> Steel, wood, aluminum, and fiberglass doors each have different repair costs</li><li><strong>Emergency service:</strong> After-hours or weekend repairs in ${c} typically cost 25-50% more</li><li><strong>Parts availability:</strong> Common parts are usually stocked locally; specialty parts may need ordering</li><li><strong>Door size:</strong> Double-car garage doors generally cost more to repair than single-car doors</li></ul><h3>How to Save Money on Garage Door Repair in ${c}</h3><ul><li>Get multiple quotes from ${c}-area garage door companies</li><li>Schedule repairs during regular business hours to avoid emergency fees</li><li>Ask about warranties on parts and labor</li><li>Consider annual maintenance plans to prevent costly emergency repairs</li><li>Check if your homeowner's insurance covers the repair</li></ul><h3>When to Repair vs. Replace Your Garage Door</h3><p>If your garage door in ${c} needs frequent repairs or is more than 15-20 years old, replacement may be more cost-effective. A new garage door installation in ${c} typically costs between $800 and $4,000, depending on materials and features. Modern insulated garage doors can also help with ${sf}'s climate, reducing energy costs.</p>`,
      metaTitle: `Garage Door Repair Cost in ${c}, ${s} (2026) | Price Guide`,
      metaDescription: `How much does garage door repair cost in ${c}, ${sf}? Complete 2026 pricing guide for spring replacement, opener repair, and more. Get quotes from local pros.`,
    }),
  },
  {
    titleFn: (c, s) => `Best Garage Door Repair Companies in ${c}, ${s} (2026)`,
    slugFn: (c, s) => `best-garage-door-repair-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Finding the Best Garage Door Repair in ${c}, ${sf}</h2><p>Choosing the right garage door repair company in ${c} can be the difference between a quick, affordable fix and a costly headache. This guide will help you find trusted, reliable garage door professionals in the ${c} area.</p><h3>What to Look for in a ${c} Garage Door Repair Company</h3><ul><li><strong>Licensing and insurance:</strong> Verify the company is licensed to operate in ${sf} and carries liability insurance</li><li><strong>Experience:</strong> Look for companies with at least 5 years of experience serving ${c} homeowners</li><li><strong>Reviews and ratings:</strong> Check Google reviews, BBB ratings, and ask for local references</li><li><strong>Warranty:</strong> Reputable companies offer warranties on both parts and labor</li><li><strong>Response time:</strong> For emergencies, choose a company that offers same-day service in ${c}</li><li><strong>Transparent pricing:</strong> Get a written estimate before work begins</li></ul><h3>Questions to Ask Before Hiring</h3><ul><li>Are you licensed and insured in ${sf}?</li><li>Do you offer free estimates for ${c}-area customers?</li><li>What warranty do you provide on parts and labor?</li><li>How long have you been serving the ${c} area?</li><li>Do you offer emergency or after-hours service?</li><li>Can you provide references from ${c} customers?</li></ul><h3>Red Flags to Watch Out For</h3><ul><li>Demanding full payment upfront before starting work</li><li>No written estimates or contracts</li><li>Pressure to replace the entire door when only a repair is needed</li><li>No physical business address in or near ${c}</li><li>Unusually low quotes that seem too good to be true</li></ul><h3>Browse ${c} Garage Door Repair Companies</h3><p>Our directory features verified garage door repair companies serving ${c}, ${sf}. Each listing includes contact information, customer ratings, and service details to help you make an informed decision.</p>`,
      metaTitle: `Best Garage Door Repair in ${c}, ${s} (2026) | Top Companies`,
      metaDescription: `Find the best garage door repair companies in ${c}, ${sf}. Compare ratings, read reviews, and get quotes from trusted local professionals.`,
    }),
  },
  {
    titleFn: (c, s) => `Garage Door Spring Repair in ${c}, ${s}: Complete Guide`,
    slugFn: (c, s) => `garage-door-spring-repair-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Garage Door Spring Repair in ${c}, ${sf}</h2><p>A broken garage door spring is one of the most common and urgent garage door problems for ${c} homeowners. When a spring breaks, your garage door becomes inoperable and potentially dangerous.</p><h3>Types of Garage Door Springs</h3><ul><li><strong>Torsion springs:</strong> Mounted above the garage door opening. Most common in modern ${c} homes. Typical lifespan: 15,000-20,000 cycles (7-12 years)</li><li><strong>Extension springs:</strong> Mounted on either side of the door track. Found in older ${c} homes. Typical lifespan: 10,000-15,000 cycles (5-9 years)</li></ul><h3>Signs Your Garage Door Spring Needs Repair</h3><ul><li>Loud bang or snapping sound from the garage</li><li>Garage door won't open or feels extremely heavy</li><li>Door opens crookedly or only partway</li><li>Visible gap in the torsion spring coil</li><li>Door slams shut quickly instead of closing slowly</li></ul><h3>Spring Repair Costs in ${c}</h3><ul><li><strong>Single torsion spring:</strong> $200 - $300 installed</li><li><strong>Pair of torsion springs:</strong> $250 - $400 installed</li><li><strong>Extension spring (each):</strong> $150 - $200 installed</li><li><strong>Emergency/weekend service:</strong> Add $50 - $150</li></ul><h3>Why You Should Never DIY Spring Repair</h3><p>Garage door springs are under extreme tension and can cause serious injury or death if handled improperly. In ${c}, always hire a licensed professional for spring replacement.</p>`,
      metaTitle: `Garage Door Spring Repair in ${c}, ${s} | Cost & Guide`,
      metaDescription: `Need garage door spring repair in ${c}, ${sf}? Learn about costs, types, and find trusted local spring repair specialists. Same-day service available.`,
    }),
  },
  {
    titleFn: (c, s) => `Emergency Garage Door Repair in ${c}, ${s}: 24/7 Services`,
    slugFn: (c, s) => `emergency-garage-door-repair-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Emergency Garage Door Repair in ${c}, ${sf}</h2><p>When your garage door breaks unexpectedly, you need fast, reliable service. Whether it's a broken spring at midnight or a door stuck open during a ${sf} storm, knowing where to find 24/7 emergency garage door repair in ${c} is essential.</p><h3>Common Garage Door Emergencies</h3><ul><li><strong>Broken spring:</strong> The most common emergency. Door becomes inoperable instantly</li><li><strong>Door stuck open:</strong> A security risk, especially overnight</li><li><strong>Door off track:</strong> Can damage the door and frame if not repaired quickly</li><li><strong>Snapped cable:</strong> Door may hang at an angle, creating a safety hazard</li><li><strong>Failed opener:</strong> Can't open or close the door remotely or manually</li><li><strong>Storm damage:</strong> Wind, hail, or debris damage requiring immediate repair</li></ul><h3>What to Expect from Emergency Service in ${c}</h3><ul><li><strong>Response time:</strong> Most ${c} emergency services arrive within 30-60 minutes</li><li><strong>Pricing:</strong> Expect to pay $50-$150 more than standard rates for after-hours service</li><li><strong>Availability:</strong> True 24/7 service means nights, weekends, and holidays</li></ul><h3>Emergency Repair Costs in ${c}</h3><p>Emergency garage door repair in ${c} typically costs between <strong>$200 and $600</strong>, depending on the repair needed and time of service.</p>`,
      metaTitle: `Emergency Garage Door Repair ${c}, ${s} | 24/7 Service`,
      metaDescription: `Need emergency garage door repair in ${c}, ${sf}? Find 24/7 garage door repair services near you. Fast response times and fair pricing.`,
    }),
  },
  {
    titleFn: (c, s) => `Garage Door Installation in ${c}, ${s}: Costs & Options`,
    slugFn: (c, s) => `garage-door-installation-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Garage Door Installation in ${c}, ${sf}</h2><p>Whether you're building a new home in ${c} or replacing an aging garage door, choosing the right door and installer makes all the difference.</p><h3>Types of Garage Doors Available in ${c}</h3><ul><li><strong>Steel doors:</strong> Most popular choice. Durable, low maintenance, $800-$2,500 installed</li><li><strong>Wood doors:</strong> Classic look, higher maintenance. $1,200-$4,000 installed</li><li><strong>Aluminum doors:</strong> Lightweight, modern aesthetic. $1,000-$3,000 installed</li><li><strong>Fiberglass doors:</strong> Resistant to dents and corrosion. $1,000-$2,500 installed</li><li><strong>Vinyl doors:</strong> Low maintenance, dent-resistant. $900-$2,000 installed</li></ul><h3>Installation Costs in ${c}</h3><ul><li><strong>Single-car door:</strong> $800 - $2,500 (including installation)</li><li><strong>Double-car door:</strong> $1,200 - $4,000 (including installation)</li><li><strong>Custom/designer doors:</strong> $3,000 - $10,000+</li><li><strong>New opener included:</strong> Add $200 - $500</li></ul><h3>Choosing the Right Door for ${sf}'s Climate</h3><p>The climate in ${c}, ${sf} should influence your garage door choice. Insulated doors (R-value of 12-18) help maintain temperature and reduce energy bills.</p><h3>ROI of a New Garage Door</h3><p>A new garage door offers one of the highest returns on investment of any home improvement project. In ${c}, homeowners can expect a <strong>90-100% return</strong> on a new garage door when selling their home.</p>`,
      metaTitle: `Garage Door Installation ${c}, ${s} | Costs & Guide (2026)`,
      metaDescription: `Planning a garage door installation in ${c}, ${sf}? Compare door types, costs, and find top-rated installers near you. Free quotes available.`,
    }),
  },
  {
    titleFn: (c, s) => `Garage Door Opener Repair in ${c}, ${s}: Troubleshooting & Costs`,
    slugFn: (c, s) => `garage-door-opener-repair-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Garage Door Opener Repair in ${c}, ${sf}</h2><p>A malfunctioning garage door opener can leave you stranded outside or unable to secure your home. ${c} homeowners rely on garage door openers daily, making quick repair essential.</p><h3>Common Opener Problems</h3><ul><li><strong>Remote not working:</strong> Dead batteries, lost signal, or faulty receiver</li><li><strong>Motor runs but door doesn't move:</strong> Stripped gears, broken drive chain, or disconnected arm</li><li><strong>Door reverses before closing:</strong> Misaligned safety sensors or obstruction in path</li><li><strong>Grinding or clicking noises:</strong> Worn gears, loose hardware, or motor bearing failure</li><li><strong>Opener activates on its own:</strong> Faulty wiring, stuck button, or frequency interference</li></ul><h3>Opener Repair Costs in ${c}</h3><ul><li><strong>Sensor realignment:</strong> $75 - $125</li><li><strong>Circuit board replacement:</strong> $150 - $300</li><li><strong>Gear/sprocket replacement:</strong> $100 - $200</li><li><strong>Chain/belt replacement:</strong> $100 - $175</li><li><strong>Full opener replacement:</strong> $300 - $700 (including installation)</li></ul><h3>When to Repair vs. Replace Your Opener</h3><p>If your opener is more than 10-15 years old and needs frequent repairs, replacement is usually more cost-effective. Modern openers offer smartphone connectivity, battery backup, and quieter belt-drive operation.</p><h3>Top Opener Brands Available in ${c}</h3><p>Popular garage door opener brands installed by ${c} professionals include LiftMaster, Chamberlain, Genie, and Craftsman. Each offers chain-drive, belt-drive, and wall-mount options.</p>`,
      metaTitle: `Garage Door Opener Repair ${c}, ${s} | Fix & Cost Guide (2026)`,
      metaDescription: `Garage door opener not working in ${c}, ${sf}? Troubleshoot common problems and find repair costs. Local opener repair specialists available.`,
    }),
  },
  {
    titleFn: (c, s) => `Garage Door Maintenance Tips for ${c}, ${s} Homeowners`,
    slugFn: (c, s) => `garage-door-maintenance-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Garage Door Maintenance in ${c}, ${sf}</h2><p>Regular garage door maintenance can extend the life of your door by 5-10 years and prevent costly emergency repairs. Here's a complete maintenance guide for ${c} homeowners.</p><h3>Monthly Maintenance Checklist</h3><ul><li><strong>Visual inspection:</strong> Check springs, cables, rollers, and pulleys for wear</li><li><strong>Listen for unusual sounds:</strong> Grinding, scraping, or rattling indicates problems</li><li><strong>Test balance:</strong> Disconnect opener, lift door halfway — it should stay in place</li><li><strong>Check safety reversal:</strong> Place a 2x4 under the door; it should reverse on contact</li><li><strong>Test photo-eye sensors:</strong> Wave an object in front; door should reverse</li></ul><h3>Seasonal Maintenance for ${sf}'h3><ul><li><strong>Spring:</strong> Clean tracks, lubricate moving parts, check weather seals</li><li><strong>Summer:</strong> Inspect for heat damage, check opener motor ventilation</li><li><strong>Fall:</strong> Replace weather stripping, test insulation, prepare for winter</li><li><strong>Winter:</strong> Keep tracks clear of ice and debris, lubricate in cold weather</li></ul><h3>DIY vs. Professional Maintenance</h3><p>Basic maintenance like lubrication and visual inspection can be done by homeowners. However, spring adjustment, cable repair, and track alignment should always be handled by a ${c} professional. Annual tune-ups from a professional typically cost $75-$150.</p><h3>Lubrication Guide</h3><p>Use white lithium grease or silicone-based lubricant on hinges, rollers, springs, and the opener chain/screw. Never use WD-40 on garage door parts — it's a solvent, not a lubricant.</p>`,
      metaTitle: `Garage Door Maintenance ${c}, ${s} | Tips & Checklist (2026)`,
      metaDescription: `Keep your garage door running smoothly in ${c}, ${sf}. Complete maintenance checklist, seasonal tips, and when to call a professional.`,
    }),
  },
  {
    titleFn: (c, s) => `Garage Door Insulation Guide for ${c}, ${s} Homes`,
    slugFn: (c, s) => `garage-door-insulation-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Garage Door Insulation in ${c}, ${sf}</h2><p>An insulated garage door can reduce energy costs by up to 20% and keep your garage comfortable year-round in ${c}'s climate. Here's everything you need to know about garage door insulation.</p><h3>Why Insulate Your Garage Door in ${c}?</h3><ul><li><strong>Energy savings:</strong> Reduce heating and cooling costs, especially if rooms are above the garage</li><li><strong>Temperature control:</strong> Keep your garage usable as a workshop or gym in ${sf}'s weather</li><li><strong>Noise reduction:</strong> Insulated doors operate 50% quieter than uninsulated ones</li><li><strong>Durability:</strong> Insulated doors are stronger and more dent-resistant</li></ul><h3>Insulation Types</h3><ul><li><strong>Polystyrene (R-4 to R-8):</strong> Budget-friendly foam boards, $200-$500 for DIY kits</li><li><strong>Polyurethane (R-12 to R-18):</strong> Spray-in foam, best thermal performance, $400-$800 professionally installed</li><li><strong>Reflective foil (R-3 to R-6):</strong> Effective in hot climates, $100-$300 DIY</li></ul><h3>Cost of Insulated Garage Doors in ${c}</h3><ul><li><strong>Retrofit insulation kit (DIY):</strong> $100 - $300</li><li><strong>Professional insulation install:</strong> $200 - $600</li><li><strong>New insulated door:</strong> $1,000 - $3,500 installed</li></ul><h3>R-Value Recommendations for ${sf}</h3><p>For ${c}'s climate, aim for an R-value of at least R-12 for attached garages and R-8 for detached garages. Higher R-values provide better insulation but cost more upfront.</p>`,
      metaTitle: `Garage Door Insulation ${c}, ${s} | R-Values, Costs & Guide`,
      metaDescription: `Should you insulate your garage door in ${c}, ${sf}? Compare insulation types, R-values, costs, and energy savings for your home.`,
    }),
  },
  {
    titleFn: (c, s) => `Garage Door Safety Tips Every ${c}, ${s} Homeowner Should Know`,
    slugFn: (c, s) => `garage-door-safety-tips-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Garage Door Safety in ${c}, ${sf}</h2><p>Garage doors are the largest moving object in most ${c} homes, and they can be dangerous if not properly maintained. Every year, thousands of Americans are injured by garage doors. Follow these safety tips to protect your family.</p><h3>Essential Safety Features</h3><ul><li><strong>Auto-reverse mechanism:</strong> Required by federal law since 1993. Test monthly with a 2x4</li><li><strong>Photo-eye sensors:</strong> Required since 1993. Should be 4-6 inches above the floor</li><li><strong>Manual release:</strong> Red cord allows manual operation during power outages</li><li><strong>Tamper-resistant brackets:</strong> Bottom brackets are under extreme tension — never adjust them yourself</li></ul><h3>Monthly Safety Checks for ${c} Homeowners</h3><ul><li>Test auto-reverse by placing a board under the door</li><li>Test photo-eye sensors by waving an object in the beam path</li><li>Inspect springs, cables, and rollers for signs of wear</li><li>Ensure the door is balanced (disconnect opener and test manually)</li><li>Check that the emergency release cord works properly</li></ul><h3>Child Safety</h3><ul><li>Never let children play with or near the garage door</li><li>Keep remotes and wall buttons out of children's reach</li><li>Teach children that the garage door is not a toy</li><li>Never race under a closing garage door</li></ul><h3>When to Call a Professional in ${c}</h3><p>If you notice any safety concerns — frayed cables, worn springs, sensor issues, or unusual sounds — contact a licensed ${c} garage door professional immediately. Never attempt to repair springs, cables, or bottom brackets yourself.</p>`,
      metaTitle: `Garage Door Safety Tips for ${c}, ${s} Homeowners (2026)`,
      metaDescription: `Essential garage door safety tips for ${c}, ${sf} homeowners. Monthly safety checklist, child safety, and when to call a professional.`,
    }),
  },
  {
    titleFn: (c, s) => `Commercial Garage Door Repair in ${c}, ${s}: Services & Costs`,
    slugFn: (c, s) => `commercial-garage-door-repair-${slugify(c)}-${s.toLowerCase()}`,
    type: "guide",
    gen: (c, s, sf) => ({
      content: `<h2>Commercial Garage Door Repair in ${c}, ${sf}</h2><p>Commercial garage doors in ${c} take a beating — high-frequency use, heavy loads, and extreme weather all contribute to wear. When your commercial door fails, every minute of downtime costs money.</p><h3>Types of Commercial Garage Doors</h3><ul><li><strong>Rolling steel doors:</strong> Most common for warehouses and loading docks</li><li><strong>Sectional overhead doors:</strong> Popular for retail and light commercial</li><li><strong>High-speed doors:</strong> Ideal for temperature-controlled facilities and high-traffic areas</li><li><strong>Fire-rated doors:</strong> Required for certain commercial applications in ${sf}</li><li><strong>Insulated doors:</strong> Energy-efficient option for climate-controlled buildings</li></ul><h3>Common Commercial Repairs in ${c}</h3><ul><li><strong>Spring replacement:</strong> $300 - $600 (heavier-duty than residential)</li><li><strong>Motor/operator repair:</strong> $200 - $800</li><li><strong>Panel replacement:</strong> $400 - $1,500</li><li><strong>Track repair:</strong> $200 - $500</li><li><strong>Safety system repair:</strong> $150 - $400</li></ul><h3>Preventive Maintenance Programs</h3><p>Most ${c} commercial garage door companies offer quarterly or bi-annual maintenance contracts. These typically cost $200-$500 per year per door and can prevent costly emergency repairs and extend door lifespan by 30-50%.</p><h3>Choosing a Commercial Door Specialist in ${c}</h3><p>Commercial garage doors require specialized knowledge. Look for ${c} companies with commercial-specific experience, 24/7 emergency service, and familiarity with ${sf} building codes and fire safety requirements.</p>`,
      metaTitle: `Commercial Garage Door Repair ${c}, ${s} | Services & Pricing`,
      metaDescription: `Commercial garage door repair in ${c}, ${sf}. Rolling steel, sectional, and high-speed door repair. 24/7 emergency service available.`,
    }),
  },
];

// ─── Sheets push ─────────────────────────────────────────────────────

const LISTING_HEADERS = [
  "Name", "Slug", "Category", "Description", "Short Description",
  "Address", "City", "State", "State Full", "Zip", "Phone", "Website",
  "Email", "Image URL", "Rating", "Review Count", "Price Range",
  "Amenities", "Hours", "Latitude", "Longitude", "Featured", "Published",
  "Tags", "Source URL", "Services", "Facebook", "Instagram", "Yelp",
  "Twitter", "YouTube", "Nextdoor", "Year Established", "Gallery",
];

const SEO_HEADERS = [
  "Title", "Slug", "Type", "Content", "Category",
  "City", "State", "Meta Title", "Meta Description", "Published",
];

async function pushToSheets(token, listings, seoPages) {
  // Push listings
  if (listings.length > 0) {
    console.log(`\nPushing ${listings.length} listings to Sheets...`);
    const listingRows = listings.map((l) => LISTING_HEADERS.map((h) => l[h] || ""));
    // Push in batches of 50
    for (let i = 0; i < listingRows.length; i += 50) {
      const batch = listingRows.slice(i, i + 50);
      const startRow = i; // Will append, so row number doesn't matter
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent("Listings")}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: batch }),
        }
      );
      const data = await res.json();
      if (data.error) {
        console.error(`  Listing batch error:`, data.error);
      } else {
        console.log(`  Listings batch ${Math.floor(i / 50) + 1}: appended ${batch.length} rows`);
      }
    }
  }

  // Push SEO pages
  if (seoPages.length > 0) {
    console.log(`\nPushing ${seoPages.length} SEO articles to Sheets...`);
    const seoRows = seoPages.map((p) => SEO_HEADERS.map((h) => p[h] || ""));
    for (let i = 0; i < seoRows.length; i += 50) {
      const batch = seoRows.slice(i, i + 50);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent("SEO Pages")}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: batch }),
        }
      );
      const data = await res.json();
      if (data.error) {
        console.error(`  SEO batch error:`, data.error);
      } else {
        console.log(`  SEO batch ${Math.floor(i / 50) + 1}: appended ${batch.length} rows`);
      }
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  // First, check what cities we already have to avoid duplicates
  let existingCities = new Set();
  if (!GENERATE_ONLY && SHEET_ID && SERVICE_EMAIL && PRIVATE_KEY) {
    const token = await getToken();
    console.log("Checking existing cities in sheet...");
    const data = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent("Listings!G:H")}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).then((r) => r.json());
    const rows = data.values || [];
    for (let i = 1; i < rows.length; i++) {
      const city = (rows[i][0] || "").trim();
      const state = (rows[i][1] || "").trim();
      if (city && state) existingCities.add(`${city},${state}`);
    }
    console.log(`Found ${existingCities.size} existing city/state combos\n`);
  }

  // Filter to only truly new cities
  const citiesToProcess = NEW_CITIES.filter(
    (c) => !existingCities.has(`${c.city},${c.state}`)
  );

  if (citiesToProcess.length === 0) {
    console.log("All cities already exist in the sheet. Nothing to do.");
    return;
  }

  console.log(`Processing ${citiesToProcess.length} new cities...`);
  console.log(`Estimated API cost: ~$${(citiesToProcess.length * 0.032).toFixed(2)} (Text Search only)\n`);

  const allListings = [];
  const allSEOPages = [];
  let apiCost = 0;
  let failedCities = [];
  const stats = {
    socialFound: 0,
    yearFound: 0,
    galleryFound: 0,
    websitesFailed: 0,
    websitesScraped: 0,
  };

  for (let i = 0; i < citiesToProcess.length; i++) {
    const { city, state, stateFull } = citiesToProcess[i];
    console.log(`[${i + 1}/${citiesToProcess.length}] ${city}, ${state}...`);

    // 1. Google Places search (includes photos)
    const searchResult = await searchPlaces(city, state);
    apiCost += 0.032;
    const places = searchResult.places || [];
    console.log(`  Places found: ${places.length}`);

    if (places.length === 0) {
      failedCities.push(`${city}, ${state}`);
    }

    // 2. For each place, scrape website for enhanced data
    const cityListings = [];
    for (const place of places.slice(0, 8)) {
      const name = place.displayName?.text || "";
      if (!name) continue;

      let enhanced = { social: {}, yearEstablished: null, services: DEFAULT_SERVICES };
      const website = place.websiteUri || "";

      if (website && website.startsWith("http")) {
        const html = await fetchHTML(website);
        if (html) {
          enhanced.social = extractSocialLinks(html);
          enhanced.yearEstablished = extractYearEstablished(html);
          enhanced.services = extractServices(html);
          stats.websitesScraped++;
          if (Object.keys(enhanced.social).length > 0) stats.socialFound++;
          if (enhanced.yearEstablished) stats.yearFound++;
          await sleep(200); // polite delay between website fetches
        } else {
          stats.websitesFailed++;
        }
      }

      // Check gallery from photos
      if (place.photos && place.photos.length > 1) stats.galleryFound++;

      const listing = formatListing(place, city, state, stateFull, enhanced);
      cityListings.push(listing);

      const sc = Object.keys(enhanced.social).length;
      const yr = enhanced.yearEstablished || "-";
      const gl = place.photos ? place.photos.length - 1 : 0;
      console.log(`    ${name.slice(0, 35).padEnd(35)} soc:${sc} yr:${yr} gal:${gl > 0 ? gl : "-"}`);
    }

    // Set top 2 rated as featured (only if they have photos)
    cityListings.sort((a, b) => (parseFloat(b.Rating) || 0) - (parseFloat(a.Rating) || 0));
    let featuredCount = 0;
    for (const l of cityListings) {
      if (featuredCount >= 2) break;
      if (l["Image URL"]) {
        l.Featured = "TRUE";
        featuredCount++;
      }
    }

    allListings.push(...cityListings);
    console.log(`  Listings: ${cityListings.length} (${featuredCount} featured)`);

    // 3. Generate all 10 SEO articles
    for (const tpl of SEO_TEMPLATES) {
      const title = tpl.titleFn(city, state);
      const slug = tpl.slugFn(city, state);
      const generated = tpl.gen(city, state, stateFull);
      allSEOPages.push({
        Title: title,
        Slug: slug,
        Type: tpl.type,
        Content: generated.content,
        Category: "Garage Door Repair",
        City: city,
        State: state,
        "Meta Title": generated.metaTitle,
        "Meta Description": generated.metaDescription,
        Published: "TRUE",
      });
    }
    console.log(`  Articles: 10`);

    // Budget check
    if (apiCost > 180) {
      console.log(`\n*** BUDGET WARNING: $${apiCost.toFixed(2)} of $200. Stopping. ***`);
      break;
    }

    await sleep(300); // rate limit between cities
  }

  // ─── Summary ───────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(50)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(50)}`);
  console.log(`Cities processed: ${citiesToProcess.length - failedCities.length}`);
  console.log(`Total listings: ${allListings.length}`);
  console.log(`Total SEO articles: ${allSEOPages.length}`);
  console.log(`Websites scraped: ${stats.websitesScraped}`);
  console.log(`Social media found: ${stats.socialFound}`);
  console.log(`Year established found: ${stats.yearFound}`);
  console.log(`Gallery photos found: ${stats.galleryFound}`);
  console.log(`Website fetch failures: ${stats.websitesFailed}`);
  console.log(`Google Places API cost: ~$${apiCost.toFixed(2)}`);
  if (failedCities.length > 0) {
    console.log(`Failed cities (${failedCities.length}): ${failedCities.join(", ")}`);
  }

  // ─── Write JSON files ─────────────────────────────────────────────
  const outDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "new-listings-v2.json"),
    JSON.stringify(allListings, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, "new-seo-pages-v2.json"),
    JSON.stringify(allSEOPages, null, 2)
  );
  console.log(`\nJSON written to data/new-listings-v2.json and data/new-seo-pages-v2.json`);

  // ─── Push to Sheets ───────────────────────────────────────────────
  if (!GENERATE_ONLY && !DRY_RUN && SHEET_ID && SERVICE_EMAIL && PRIVATE_KEY) {
    const token = await getToken();
    await pushToSheets(token, allListings, allSEOPages);
    console.log(`\nDone! All data pushed to Google Sheets.`);
  } else if (DRY_RUN) {
    console.log(`\nDry run complete. No data pushed to Sheets.`);
  } else if (GENERATE_ONLY) {
    console.log(`\nGenerate-only mode. JSON files created but not pushed.`);
  }
}

main().catch(console.error);
