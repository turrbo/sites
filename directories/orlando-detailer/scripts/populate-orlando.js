#!/usr/bin/env node
/**
 * Populate Orlando Detailer directory with business data from Google Places API.
 *
 * For each city x category:
 *   1. Google Places Text Search (New) with fieldMask including photos
 *   2. Scrape each business website: social media, year established, services, brands
 *   3. Build gallery URLs from Places photo references
 *   4. De-duplicate by business name + city
 *
 * Then push to Google Sheets:
 *   - Listings tab (business data)
 *   - Categories tab (3 rows)
 *   - SEO Pages, Blog, Quote Leads tabs (headers only)
 *
 * Usage:
 *   node scripts/populate-orlando.js
 *   node scripts/populate-orlando.js --dry-run
 *
 * Env vars (can also be in .env.local):
 *   GOOGLE_PLACES_API_KEY
 *   GOOGLE_PRIVATE_KEY
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// ─── Load .env.local ─────────────────────────────────────────────────
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

// ─── Config ──────────────────────────────────────────────────────────
const API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  env.GOOGLE_PLACES_API_KEY ||
  "AIzaSyDZXcpIPC8hgg2xuuG-BCeC7tB8INd2Ix8";

const SPREADSHEET_ID = "1egSWQXYXq2sZGq7bh3u0rKcNvB_4-YsyLQptqECOQ78";
const SERVICE_EMAIL = "directory-reader@directory-sites-492400.iam.gserviceaccount.com";
const PRIVATE_KEY = (
  process.env.GOOGLE_PRIVATE_KEY ||
  env.GOOGLE_PRIVATE_KEY ||
  ""
).replace(/\\n/g, "\n");

const DRY_RUN = process.argv.includes("--dry-run");

if (!API_KEY) {
  console.error("GOOGLE_PLACES_API_KEY is required");
  process.exit(1);
}

// ─── Cities ──────────────────────────────────────────────────────────
const CITIES = [
  "Orlando",
  "Kissimmee",
  "Sanford",
  "Lake Mary",
  "Winter Park",
  "Altamonte Springs",
  "Oviedo",
  "Winter Garden",
  "Clermont",
  "Apopka",
  "Ocoee",
  "Daytona Beach",
  "Dr. Phillips",
  "Windermere",
  "Lake Nona",
  "Celebration",
  "St. Cloud",
  "Deltona",
  "DeLand",
  "Casselberry",
  "Longwood",
  "Maitland",
  "Winter Springs",
];

// ─── Categories / search queries ──────────────────────────────────────
const SEARCH_QUERIES = [
  {
    category: "Auto Detailing",
    queryFn: (city) => `auto detailing in ${city} FL`,
  },
  {
    category: "Window Tinting",
    queryFn: (city) => `window tinting in ${city} FL`,
  },
  {
    category: "Vehicle Wraps",
    queryFn: (city) => `vehicle wrap in ${city} FL`,
  },
];

// Rough center of the Orlando metro for location bias
const ORLANDO_CENTER = { latitude: 28.5383, longitude: -81.3792 };

// ─── Sheet tab definitions ────────────────────────────────────────────
const LISTING_HEADERS = [
  "Name",
  "Slug",
  "Category",
  "Subcategory",
  "Description",
  "Short Description",
  "Address",
  "City",
  "State",
  "State Full",
  "Zip",
  "Phone",
  "Website",
  "Email",
  "Image URL",
  "Rating",
  "Review Count",
  "Price Range",
  "Hours",
  "Latitude",
  "Longitude",
  "Featured",
  "Published",
  "Tags",
  "Services",
  "Facebook",
  "Instagram",
  "Yelp",
  "Twitter",
  "YouTube",
  "Nextdoor",
  "Year Established",
  "Gallery",
  "Brands Used",
  "Quote Accepted",
];

const CATEGORY_HEADERS = ["Name", "Slug", "Description", "Icon"];
const CATEGORY_ROWS = [
  [
    "Auto Detailing",
    "auto-detailing",
    "Professional auto detailing services including ceramic coating paint correction and interior cleaning",
    "sparkles",
  ],
  [
    "Window Tinting",
    "window-tinting",
    "Automotive residential and commercial window tinting services",
    "sun",
  ],
  [
    "Vehicle Wraps",
    "vehicle-wraps",
    "Full wraps partial wraps paint protection film and color change wraps",
    "paintbrush",
  ],
];

const SEO_HEADERS = [
  "Title",
  "Slug",
  "City",
  "State",
  "Category",
  "Content",
  "Meta Title",
  "Meta Description",
  "Published",
];

const BLOG_HEADERS = [
  "Title",
  "Slug",
  "Content",
  "Excerpt",
  "Author",
  "Image URL",
  "Category",
  "Tags",
  "City",
  "State",
  "Published At",
  "Meta Title",
  "Meta Description",
  "Published",
];

const QUOTE_LEADS_HEADERS = [
  "Submitted At",
  "Service Type",
  "Subcategory",
  "Vehicle Year",
  "Vehicle Make",
  "Vehicle Model",
  "Zip Code",
  "Name",
  "Email",
  "Phone",
  "Description",
  "Source",
  "Status",
];

// ─── Helpers ──────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Google Sheets JWT auth ───────────────────────────────────────────

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
  if (!data.access_token) {
    throw new Error("Auth failed: " + JSON.stringify(data));
  }
  return data.access_token;
}

// ─── Google Sheets: ensure tab exists with headers ───────────────────

async function ensureTab(token, tabName, headers, extraRows = []) {
  // Get current sheet metadata
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const sheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!sheets.includes(tabName)) {
    // Create the tab
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: tabName } } }],
        }),
      }
    );
    const addData = await addRes.json();
    if (addData.error) {
      console.error(`  Failed to create tab "${tabName}":`, addData.error.message);
      return;
    }
    console.log(`  Created tab: ${tabName}`);
  }

  // Write header row + any extra rows
  const values = [headers, ...extraRows];
  const range = `${tabName}!A1`;
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    }
  );
  const writeData = await writeRes.json();
  if (writeData.error) {
    console.error(`  Failed to write headers for "${tabName}":`, writeData.error.message);
  } else {
    console.log(
      `  Tab "${tabName}" ready (${headers.length} columns, ${extraRows.length} data rows)`
    );
  }
}

// ─── Google Places Text Search (New) ─────────────────────────────────

async function searchPlaces(query, city) {
  try {
    const body = JSON.stringify({
      textQuery: query,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: ORLANDO_CENTER,
          radius: 50000.0,
        },
      },
    });

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": [
          "places.displayName",
          "places.formattedAddress",
          "places.nationalPhoneNumber",
          "places.websiteUri",
          "places.rating",
          "places.userRatingCount",
          "places.location",
          "places.googleMapsUri",
          "places.currentOpeningHours",
          "places.priceLevel",
          "places.photos",
        ].join(","),
      },
      body,
    });

    const data = await res.json();
    if (data.error) {
      console.error(`  Places API error for "${query}": ${data.error.message}`);
      return [];
    }
    return data.places || [];
  } catch (e) {
    console.error(`  Search failed for "${query}": ${e.message}`);
    return [];
  }
}

// ─── Website scraping ─────────────────────────────────────────────────

async function fetchHTML(url, timeout = 10000) {
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
  twitter: [
    /href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^"'\s?#]+)/gi,
  ],
  youtube: [
    /href=["'](https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|user|@)[^"'\s?#]+)/gi,
  ],
  nextdoor: [
    /href=["'](https?:\/\/(?:www\.)?nextdoor\.com\/(?:pages|business)\/[^"'\s?#]+)/gi,
  ],
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

// ─── Service keywords by category ─────────────────────────────────────

const DETAILING_SERVICE_KEYWORDS =
  /ceramic\s*coat|paint\s*correct|interior\s*detail|exterior\s*detail|mobile\s*detail|hand\s*wash|clay\s*bar|polish|wax|buff|decontam|sanitiz|odor|engine\s*bay|headlight|seat\s*clean|carpet\s*clean|paint\s*sealant|full\s*detail|express\s*wash|steam\s*clean/i;

const TINTING_SERVICE_KEYWORDS =
  /window\s*tint|auto\s*tint|car\s*tint|residential\s*tint|commercial\s*tint|ceramic\s*tint|carbon\s*tint|dyed\s*tint|IR\s*reject|UV\s*protect|privacy\s*glass|windshield\s*tint|limo\s*tint/i;

const WRAP_SERVICE_KEYWORDS =
  /vinyl\s*wrap|full\s*wrap|partial\s*wrap|PPF|paint\s*protection\s*film|color\s*change|color\s*wrap|fleet\s*wrap|commercial\s*wrap|clear\s*bra|hood\s*wrap|chrome\s*delete|decal|graphic|matte\s*wrap|gloss\s*wrap|satin\s*wrap/i;

const ALL_SERVICE_KEYWORDS = new RegExp(
  [
    DETAILING_SERVICE_KEYWORDS.source,
    TINTING_SERVICE_KEYWORDS.source,
    WRAP_SERVICE_KEYWORDS.source,
  ].join("|"),
  "i"
);

const EXCLUDE_WORDS =
  /home|about|contact|gallery|blog|review|testimonial|location|area|career|job|apply|financ|coupon|special|faq|privacy|terms|sitemap|login|sign|call|free\s*estimate|book|schedule|quote|resource|video|photo|meet|team|why\s*choose|professional|technician|hour|map/i;

const DEFAULT_SERVICES_BY_CATEGORY = {
  "Auto Detailing":
    "Full Detail, Interior Detailing, Exterior Detailing, Ceramic Coating, Paint Correction, Hand Wash, Clay Bar Treatment, Paint Sealant, Engine Bay Cleaning, Headlight Restoration",
  "Window Tinting":
    "Automotive Window Tinting, Residential Window Tinting, Commercial Window Tinting, Ceramic Tint, Carbon Tint, Dyed Tint, UV Protection, Windshield Tinting",
  "Vehicle Wraps":
    "Full Vehicle Wrap, Partial Wrap, Color Change Wrap, Paint Protection Film, Clear Bra, Commercial Fleet Wraps, Chrome Delete, Decals & Graphics, Matte Wrap, Gloss Wrap",
};

function extractServices(html, category) {
  const services = new Set();
  const linkMatches = html.matchAll(/<a[^>]*>([^<]{3,80})<\/a>/gi);
  for (const m of linkMatches) {
    const text = m[1].trim();
    if (ALL_SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text)) {
      services.add(text.replace(/\s+/g, " "));
    }
  }
  const headingMatches = html.matchAll(/<h[1-4][^>]*>([^<]{3,100})<\/h[1-4]>/gi);
  for (const m of headingMatches) {
    const text = m[1].trim();
    if (ALL_SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text)) {
      services.add(text.replace(/\s+/g, " "));
    }
  }
  const listMatches = html.matchAll(/<li[^>]*>([^<]{3,80})<\/li>/gi);
  for (const m of listMatches) {
    const text = m[1].trim();
    if (ALL_SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text)) {
      services.add(text.replace(/\s+/g, " "));
    }
  }
  return services.size >= 3
    ? [...services].slice(0, 15).join(", ")
    : DEFAULT_SERVICES_BY_CATEGORY[category] || "";
}

// ─── Brand extraction ─────────────────────────────────────────────────

const BRAND_PATTERNS =
  /\b(3M|XPEL|SunTek|Llumar|LLumar|Gtechniq|Ceramic\s*Pro|Modesta|IGL\s*Coatings|Kavaca|Avery\s*Dennison|Hexis|Oracal|3MTM|Tint\s*Tek|Huper\s*Optik|FormulaOne|Vista|EcoFilm|Solar\s*Guard|V-Kool)\b/gi;

function extractBrands(html) {
  const brands = new Set();
  let match;
  BRAND_PATTERNS.lastIndex = 0;
  const re = new RegExp(BRAND_PATTERNS.source, "gi");
  while ((match = re.exec(html)) !== null) {
    brands.add(match[1].trim());
  }
  return [...brands].join(", ");
}

// ─── Photo URL builder ────────────────────────────────────────────────

function buildPhotoUrls(place) {
  if (!place.photos || place.photos.length === 0) {
    return { mainPhoto: "", gallery: "" };
  }
  const mainPhoto = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=800&key=${API_KEY}`;
  const galleryPhotos = place.photos
    .slice(1, 6)
    .map(
      (p) =>
        `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=800&key=${API_KEY}`
    );
  return { mainPhoto, gallery: galleryPhotos.join(", ") };
}

// ─── Price level mapping ──────────────────────────────────────────────

function mapPriceLevel(level) {
  const map = {
    PRICE_LEVEL_FREE: "$",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return map[level] || "";
}

// ─── Format listing row ───────────────────────────────────────────────

function formatListing(place, city, category, enhanced) {
  const name = place.displayName?.text || "";
  const addr = place.formattedAddress || "";

  let zip = "";
  const zipMatch = addr.match(/\b(\d{5})\b/);
  if (zipMatch) zip = zipMatch[1];

  const { mainPhoto, gallery } = buildPhotoUrls(place);
  const slug = slugify(`${name}-${city}-fl`);

  const descriptionBase = `${name} provides professional ${category.toLowerCase()} services in ${city}, Florida.`;

  return {
    Name: name,
    Slug: slug,
    Category: category,
    Subcategory: "",
    Description: descriptionBase,
    "Short Description": descriptionBase.slice(0, 150),
    Address: addr,
    City: city,
    State: "FL",
    "State Full": "Florida",
    Zip: zip,
    Phone: place.nationalPhoneNumber || "",
    Website: place.websiteUri || "",
    Email: "",
    "Image URL": mainPhoto,
    Rating: place.rating != null ? String(place.rating) : "",
    "Review Count": place.userRatingCount != null ? String(place.userRatingCount) : "",
    "Price Range": mapPriceLevel(place.priceLevel),
    Hours: place.currentOpeningHours?.weekdayDescriptions?.join("; ") || "",
    Latitude: place.location?.latitude != null ? String(place.location.latitude) : "",
    Longitude: place.location?.longitude != null ? String(place.location.longitude) : "",
    Featured: "FALSE",
    Published: "TRUE",
    Tags: slugify(category),
    Services: enhanced.services || DEFAULT_SERVICES_BY_CATEGORY[category] || "",
    Facebook: enhanced.social?.facebook || "",
    Instagram: enhanced.social?.instagram || "",
    Yelp: enhanced.social?.yelp || "",
    Twitter: enhanced.social?.twitter || "",
    YouTube: enhanced.social?.youtube || "",
    Nextdoor: enhanced.social?.nextdoor || "",
    "Year Established": enhanced.yearEstablished ? String(enhanced.yearEstablished) : "",
    Gallery: gallery,
    "Brands Used": enhanced.brands || "",
    "Quote Accepted": "TRUE",
  };
}

// ─── Google Sheets: append rows ───────────────────────────────────────

async function appendRows(token, tabName, headers, rows) {
  if (rows.length === 0) return;
  console.log(`  Appending ${rows.length} rows to "${tabName}"...`);

  const valueRows = rows.map((r) =>
    headers.map((h) => (r[h] !== undefined ? r[h] : ""))
  );

  for (let i = 0; i < valueRows.length; i += 50) {
    const batch = valueRows.slice(i, i + 50);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
        tabName
      )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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
      console.error(
        `  Batch ${Math.floor(i / 50) + 1} error for "${tabName}":`,
        data.error.message
      );
    } else {
      console.log(
        `  "${tabName}" batch ${Math.floor(i / 50) + 1}: appended ${batch.length} rows`
      );
    }
    if (i + 50 < valueRows.length) await sleep(500);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Orlando Detailer - Populate Google Sheets");
  console.log("=".repeat(50));
  if (DRY_RUN) console.log("DRY RUN MODE - no writes to Sheets\n");

  // Stats
  const stats = {
    apiCalls: 0,
    placesFound: 0,
    websitesScraped: 0,
    websitesFailed: 0,
    socialFound: 0,
    yearFound: 0,
    brandsFound: 0,
    galleryFound: 0,
  };

  const perCategory = {
    "Auto Detailing": 0,
    "Window Tinting": 0,
    "Vehicle Wraps": 0,
  };
  const perCity = {};

  // De-duplication: key = slugified name + city
  const seen = new Map(); // dedupeKey -> listing (with merged categories)

  // ─── Phase 1: Collect all places ──────────────────────────────────
  console.log("\nPhase 1: Google Places API searches");
  console.log(`  ${CITIES.length} cities x ${SEARCH_QUERIES.length} queries = ${CITIES.length * SEARCH_QUERIES.length} requests\n`);

  for (let ci = 0; ci < CITIES.length; ci++) {
    const city = CITIES[ci];
    console.log(`[${ci + 1}/${CITIES.length}] ${city}`);

    for (const { category, queryFn } of SEARCH_QUERIES) {
      const query = queryFn(city);
      process.stdout.write(`  ${category}: `);

      const places = await searchPlaces(query, city);
      stats.apiCalls++;
      console.log(`${places.length} results`);

      for (const place of places) {
        const name = place.displayName?.text || "";
        if (!name) continue;

        const dedupeKey = `${slugify(name)}|${slugify(city)}`;

        if (seen.has(dedupeKey)) {
          // Merge category if this is a new category for this business
          const existing = seen.get(dedupeKey);
          if (!existing.Category.includes(category)) {
            existing.Category = existing.Category + ", " + category;
          }
        } else {
          // Store raw place data + category for scraping phase
          seen.set(dedupeKey, {
            _place: place,
            _city: city,
            _category: category,
            // These fields will be filled after scraping
            Category: category,
          });
        }
      }

      await sleep(1000); // 1s between Places API requests
    }
  }

  console.log(`\nTotal unique businesses found: ${seen.size}`);
  console.log(`Estimated Places API cost: ~$${(stats.apiCalls * 0.032).toFixed(2)}`);

  // ─── Phase 2: Scrape websites ──────────────────────────────────────
  console.log("\nPhase 2: Website scraping");

  const allListings = [];
  let idx = 0;
  for (const [dedupeKey, entry] of seen) {
    idx++;
    const { _place: place, _city: city, _category: category } = entry;
    const name = place.displayName?.text || "";
    const website = place.websiteUri || "";

    process.stdout.write(
      `[${idx}/${seen.size}] ${name.slice(0, 40).padEnd(40)} `
    );

    let enhanced = {
      social: {},
      yearEstablished: null,
      services: DEFAULT_SERVICES_BY_CATEGORY[category] || "",
      brands: "",
    };

    if (website && website.startsWith("http")) {
      const html = await fetchHTML(website, 10000);
      if (html) {
        enhanced.social = extractSocialLinks(html);
        enhanced.yearEstablished = extractYearEstablished(html);
        enhanced.services = extractServices(html, category);
        enhanced.brands = extractBrands(html);
        stats.websitesScraped++;
        if (Object.keys(enhanced.social).length > 0) stats.socialFound++;
        if (enhanced.yearEstablished) stats.yearFound++;
        if (enhanced.brands) stats.brandsFound++;
        if (place.photos && place.photos.length > 1) stats.galleryFound++;
      } else {
        stats.websitesFailed++;
      }
      await sleep(2000); // 2s between site fetches
    }

    const sc = Object.keys(enhanced.social).length;
    const yr = enhanced.yearEstablished || "-";
    const gl = place.photos ? place.photos.length - 1 : 0;
    console.log(`soc:${sc} yr:${yr} gal:${gl > 0 ? gl : "-"}`);

    const listing = formatListing(place, city, entry.Category, enhanced);
    allListings.push(listing);

    // Update stats
    stats.placesFound++;
    perCity[city] = (perCity[city] || 0) + 1;
    // Count per primary category (first in list)
    const primaryCat = entry.Category.split(",")[0].trim();
    if (perCategory[primaryCat] !== undefined) perCategory[primaryCat]++;
  }

  // ─── Summary ───────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  console.log("SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total unique listings: ${allListings.length}`);
  console.log(`Places API calls: ${stats.apiCalls} (~$${(stats.apiCalls * 0.032).toFixed(2)})`);
  console.log(`Websites scraped: ${stats.websitesScraped}`);
  console.log(`Website fetch failures: ${stats.websitesFailed}`);
  console.log(`Social media found: ${stats.socialFound}`);
  console.log(`Year established found: ${stats.yearFound}`);
  console.log(`Brands found: ${stats.brandsFound}`);
  console.log(`Gallery photos found: ${stats.galleryFound}`);
  console.log("\nPer category:");
  for (const [cat, count] of Object.entries(perCategory)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log("\nPer city:");
  for (const [city, count] of Object.entries(perCity)) {
    console.log(`  ${city}: ${count}`);
  }

  // ─── Dry run: print sample rows ───────────────────────────────────
  if (DRY_RUN) {
    console.log("\nDry run - sample of first 3 listings:");
    for (const l of allListings.slice(0, 3)) {
      console.log(JSON.stringify(l, null, 2));
    }
    console.log("\nDry run complete. No data written to Google Sheets.");
    return;
  }

  // ─── Phase 3: Setup Google Sheets ─────────────────────────────────
  if (!PRIVATE_KEY) {
    console.error("\nGOOGLE_PRIVATE_KEY is required for Sheets writes. Exiting.");
    process.exit(1);
  }

  console.log("\nPhase 3: Setting up Google Sheets tabs...");
  const token = await getToken();

  await ensureTab(token, "Listings", LISTING_HEADERS);
  await sleep(300);
  await ensureTab(token, "Categories", CATEGORY_HEADERS, CATEGORY_ROWS);
  await sleep(300);
  await ensureTab(token, "SEO Pages", SEO_HEADERS);
  await sleep(300);
  await ensureTab(token, "Blog", BLOG_HEADERS);
  await sleep(300);
  await ensureTab(token, "Quote Leads", QUOTE_LEADS_HEADERS);
  await sleep(500);

  // ─── Phase 4: Write listings ───────────────────────────────────────
  console.log("\nPhase 4: Writing listings to Sheets...");
  await appendRows(token, "Listings", LISTING_HEADERS, allListings);

  console.log("\nDone! All data written to Google Sheets.");
  console.log(`Spreadsheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
