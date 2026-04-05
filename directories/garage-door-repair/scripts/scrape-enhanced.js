#!/usr/bin/env node
/**
 * Enhanced listing scraper - single pass to:
 * 1. Scrape social media links from business websites
 * 2. Extract "years in business" / "established since" from websites
 * 3. Fetch additional Google Places photos (gallery)
 *
 * Adds columns: Facebook, Instagram, Yelp, Twitter, YouTube, Nextdoor,
 *               Year Established, Gallery
 *
 * Usage:
 *   node scripts/scrape-enhanced.js              # Full run
 *   node scripts/scrape-enhanced.js --skip-photos # Skip Google Places photo fetch
 *   node scripts/scrape-enhanced.js --dry-run     # Don't write to sheet
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load env
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) {
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[m[1].trim()] = val;
  }
}

const SHEET_ID = env.GOOGLE_SHEET_ID;
const SERVICE_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const API_KEY = env.GOOGLE_PLACES_API_KEY;

const SKIP_PHOTOS = process.argv.includes("--skip-photos");
const DRY_RUN = process.argv.includes("--dry-run");

// --- Auth ---

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createJWT() {
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
  return `${si}.${sig}`;
}

async function getToken() {
  const jwt = createJWT();
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
    console.error("Auth failed:", data);
    process.exit(1);
  }
  return data.access_token;
}

// --- Sheets helpers ---

async function sheetsGet(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function sheetsBatchUpdate(token, updates) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: updates }),
    }
  );
  const data = await res.json();
  if (data.error) {
    console.error("\n  BATCH ERROR:", JSON.stringify(data.error));
    return false;
  }
  return true;
}

function colLetter(index) {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

// --- Website scraping ---

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
  } finally {
    clearTimeout(timer);
  }
}

// --- Social media extraction ---

const SOCIAL_PATTERNS = {
  facebook: [
    /href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"'\s?#]+)/gi,
    /href=["'](https?:\/\/(?:www\.)?fb\.com\/[^"'\s?#]+)/gi,
  ],
  instagram: [
    /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"'\s?#]+)/gi,
  ],
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

// Exclude patterns (login pages, share links, generic platform pages)
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

// --- Year established extraction ---

function extractYearEstablished(html) {
  // Remove HTML tags for text analysis
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  const currentYear = new Date().getFullYear();

  // Pattern 1: "Established in YYYY" / "Est. YYYY" / "Founded YYYY"
  const estMatch = text.match(
    /(?:establish|founded?|since|serving\s+since|in\s+business\s+since|est\.?\s*)\s*(?:in\s+)?(\d{4})/i
  );
  if (estMatch) {
    const year = parseInt(estMatch[1]);
    if (year >= 1950 && year <= currentYear) return year;
  }

  // Pattern 2: "Since YYYY"
  const sinceMatch = text.match(/since\s+(\d{4})/i);
  if (sinceMatch) {
    const year = parseInt(sinceMatch[1]);
    if (year >= 1950 && year <= currentYear) return year;
  }

  // Pattern 3: "XX+ years" / "over XX years" / "XX years of experience"
  const yearsMatch = text.match(
    /(?:over\s+)?(\d{1,3})\+?\s*years?\s*(?:of\s+)?(?:experience|in\s+business|serving|of\s+service)/i
  );
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years >= 2 && years <= 80) {
      return currentYear - years;
    }
  }

  return null;
}

// --- Google Places photos ---

async function fetchPlacesPhotos(name, city, state) {
  if (!API_KEY) return [];

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "places.displayName,places.photos",
        },
        body: JSON.stringify({
          textQuery: `${name} garage door repair ${city}, ${state}`,
          maxResultCount: 3,
        }),
      }
    );
    const data = await res.json();
    const places = data.places || [];

    // Find best match by name
    const nameLower = name.toLowerCase().trim();
    const match = places.find((p) => {
      const pName = (p.displayName?.text || "").toLowerCase().trim();
      return pName === nameLower || pName.includes(nameLower) || nameLower.includes(pName);
    });

    if (match && match.photos && match.photos.length > 1) {
      // Skip first photo (already used as main image), take up to 5 more
      return match.photos.slice(1, 6).map((photo) => {
        return `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=600&key=${API_KEY}`;
      });
    }
    return [];
  } catch {
    return [];
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Main ---

async function main() {
  const token = await getToken();
  console.log("Authenticated with Google Sheets");

  // Read all listings
  const data = await sheetsGet(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent("Listings")}`,
    token
  );
  const rows = data.values || [];
  if (rows.length < 2) {
    console.log("No data");
    return;
  }

  const headers = rows[0];
  const nameCol = headers.indexOf("Name");
  const websiteCol = headers.indexOf("Website");
  const cityCol = headers.indexOf("City");
  const stateCol = headers.indexOf("State");

  // New columns to add/find
  const newCols = [
    "Facebook",
    "Instagram",
    "Yelp",
    "Twitter",
    "YouTube",
    "Nextdoor",
    "Year Established",
    "Gallery",
  ];
  const colIndices = {};

  for (const col of newCols) {
    let idx = headers.indexOf(col);
    if (idx === -1) {
      idx = headers.length;
      headers.push(col);
      // Add header to sheet
      const headerCell = `Listings!${colLetter(idx)}1`;
      const addRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(headerCell)}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: [[col]] }),
        }
      );
      const addData = await addRes.json();
      if (addData.error) {
        console.error(`Failed to add ${col} column:`, addData.error);
        return;
      }
      console.log(`Added "${col}" column at ${colLetter(idx)}`);
    } else {
      console.log(`"${col}" column exists at ${colLetter(idx)}`);
    }
    colIndices[col] = idx;
  }

  const totalListings = rows.length - 1;
  console.log(`\nProcessing ${totalListings} listings...`);
  if (SKIP_PHOTOS) console.log("(Skipping Google Places photos)");
  if (DRY_RUN) console.log("(DRY RUN - no writes)");
  console.log("");

  const stats = {
    socialFound: 0,
    yearFound: 0,
    galleryFound: 0,
    websitesFailed: 0,
    skippedComplete: 0,
    processed: 0,
  };
  let batchUpdates = [];
  let batchCount = 0;

  // Track unique cities for Places API cost estimation
  const citiesQueried = new Set();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[nameCol] || "").trim();
    const website = (row[websiteCol] || "").trim();
    const city = (row[cityCol] || "").trim();
    const state = (row[stateCol] || "").trim();

    // Check if already has all data
    const existingFb = (row[colIndices["Facebook"]] || "").trim();
    const existingIg = (row[colIndices["Instagram"]] || "").trim();
    const existingYear = (row[colIndices["Year Established"]] || "").trim();
    const existingGallery = (row[colIndices["Gallery"]] || "").trim();

    // If already has social + year + gallery, skip
    if (existingFb && existingYear && existingGallery) {
      stats.skippedComplete++;
      process.stdout.write(
        `\r[${i}/${totalListings}] ${name.slice(0, 35).padEnd(35)} SKIP (complete)`
      );
      continue;
    }

    stats.processed++;

    let html = null;
    let socialLinks = {};
    let yearEstablished = null;
    let galleryUrls = [];

    // --- Website scraping (social + year) ---
    const needsWebScrape = !existingFb || !existingYear;
    if (needsWebScrape && website && website.startsWith("http")) {
      try {
        html = await fetchHTML(website);
        socialLinks = extractSocialLinks(html);
        yearEstablished = extractYearEstablished(html);
      } catch {
        stats.websitesFailed++;
      }
    }

    // --- Google Places photos ---
    if (!SKIP_PHOTOS && !existingGallery && name && city && state) {
      const cityKey = `${city}|${state}`;
      if (!citiesQueried.has(cityKey)) {
        citiesQueried.add(cityKey);
      }
      galleryUrls = await fetchPlacesPhotos(name, city, state);
      if (galleryUrls.length > 0) stats.galleryFound++;
      await sleep(100); // Rate limit for Places API
    }

    // --- Build updates ---
    const hasSocial = Object.keys(socialLinks).length > 0;
    if (hasSocial) stats.socialFound++;
    if (yearEstablished) stats.yearFound++;

    // Only write cells that are currently empty
    const socialPlatforms = [
      "Facebook",
      "Instagram",
      "Yelp",
      "Twitter",
      "YouTube",
      "Nextdoor",
    ];
    const platformKeys = [
      "facebook",
      "instagram",
      "yelp",
      "twitter",
      "youtube",
      "nextdoor",
    ];

    for (let p = 0; p < socialPlatforms.length; p++) {
      const colName = socialPlatforms[p];
      const key = platformKeys[p];
      const existing = (row[colIndices[colName]] || "").trim();
      if (!existing && socialLinks[key]) {
        batchUpdates.push({
          range: `Listings!${colLetter(colIndices[colName])}${i + 1}`,
          values: [[socialLinks[key]]],
        });
      }
    }

    if (!existingYear && yearEstablished) {
      batchUpdates.push({
        range: `Listings!${colLetter(colIndices["Year Established"])}${i + 1}`,
        values: [[String(yearEstablished)]],
      });
    }

    if (!existingGallery && galleryUrls.length > 0) {
      batchUpdates.push({
        range: `Listings!${colLetter(colIndices["Gallery"])}${i + 1}`,
        values: [[galleryUrls.join(", ")]],
      });
    }

    // Progress
    const socialCount = Object.keys(socialLinks).length;
    const sc = socialCount > 0 ? `soc:${socialCount}` : "soc:0";
    const yr = yearEstablished ? `yr:${yearEstablished}` : "yr:-";
    const gl = galleryUrls.length > 0 ? `gal:${galleryUrls.length}` : "gal:-";
    process.stdout.write(
      `\r[${i}/${totalListings}] ${name.slice(0, 30).padEnd(30)} ${sc.padEnd(6)} ${yr.padEnd(8)} ${gl}`
    );

    // Batch write every 50 rows
    if (batchUpdates.length >= 50) {
      batchCount++;
      if (!DRY_RUN) {
        const ok = await sheetsBatchUpdate(token, batchUpdates);
        if (ok) {
          console.log(
            `\n  -> Batch ${batchCount}: wrote ${batchUpdates.length} cells`
          );
        }
      } else {
        console.log(
          `\n  -> Batch ${batchCount}: would write ${batchUpdates.length} cells (dry run)`
        );
      }
      batchUpdates = [];
    }

    // Small delay between website fetches
    if (html) await sleep(300);
  }

  // Write remaining batch
  if (batchUpdates.length > 0) {
    batchCount++;
    if (!DRY_RUN) {
      const ok = await sheetsBatchUpdate(token, batchUpdates);
      if (ok) {
        console.log(
          `\n  -> Batch ${batchCount}: wrote ${batchUpdates.length} cells (final)`
        );
      }
    } else {
      console.log(
        `\n  -> Batch ${batchCount}: would write ${batchUpdates.length} cells (final, dry run)`
      );
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Total listings: ${totalListings}`);
  console.log(`Processed: ${stats.processed}`);
  console.log(`Skipped (already complete): ${stats.skippedComplete}`);
  console.log(`Social media found: ${stats.socialFound}`);
  console.log(`Year established found: ${stats.yearFound}`);
  console.log(`Gallery photos found: ${stats.galleryFound}`);
  console.log(`Website fetch failures: ${stats.websitesFailed}`);
  if (!SKIP_PHOTOS) {
    console.log(
      `Places API calls: ~${stats.processed - stats.skippedComplete}`
    );
    console.log(
      `Estimated Places API cost: ~$${((stats.processed - stats.skippedComplete) * 0.032).toFixed(2)}`
    );
  }
}

main().catch(console.error);
