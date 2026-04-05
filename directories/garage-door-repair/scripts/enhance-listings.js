#!/usr/bin/env node
/**
 * Enhanced listing scraper - single pass to:
 * 1. Scrape services from business websites
 * 2. Scrape logos from websites for listings missing photos
 * 3. Set featured=FALSE for listings with no real photo
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

// Our site logo as fallback for missing photos
const PLACEHOLDER_LOGO = "https://garagedoorrepair.directory/icon-512.png";

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

const SERVICE_KEYWORDS = /repair|install|replace|spring|opener|door|service|maint|inspect|cable|track|roller|panel|emergency|commercial|custom|insul|lubrication|tune.?up|smart|high.?speed|overhead|rolling|torsion|extension|weather.?seal|remote|keypad|sensor|balance|align/i;
const EXCLUDE_WORDS = /home|about|contact|gallery|blog|review|testimonial|location|area|career|job|apply|financ|coupon|special|faq|privacy|terms|sitemap|login|sign|call|free estimate|book|schedule|quote|resource|useful|video|photo|meet|team|why choose|professional|technician|hour|map/i;

// --- Auth ---

function base64url(input) {
  return Buffer.from(input).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: SERVICE_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  };
  const eh = base64url(JSON.stringify(header));
  const ep = base64url(JSON.stringify(payload));
  const si = `${eh}.${ep}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(si);
  const sig = sign.sign(PRIVATE_KEY, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
  if (!data.access_token) { console.error("Auth failed:", data); process.exit(1); }
  return data.access_token;
}

// --- Sheets helpers ---

async function sheetsGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

async function sheetsBatchUpdate(token, updates) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    const text = await res.text();
    return text.slice(0, 500000); // Cap at 500KB
  } finally {
    clearTimeout(timer);
  }
}

function extractServices(html) {
  const services = new Set();
  let match;

  const navPattern = /<(?:a|li)[^>]*>([^<]{3,80})<\/(?:a|li)>/gi;
  while ((match = navPattern.exec(html)) !== null) {
    const text = match[1].trim().replace(/\s+/g, " ");
    if (SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text) && text.length < 60) {
      services.add(cleanServiceName(text));
    }
  }

  const headingPattern = /<h[1-4][^>]*>([^<]{3,100})<\/h[1-4]>/gi;
  while ((match = headingPattern.exec(html)) !== null) {
    const text = match[1].trim().replace(/\s+/g, " ");
    if (SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text) && text.length < 60) {
      services.add(cleanServiceName(text));
    }
  }

  const nestedHeadingPattern = /<h[1-4][^>]*>([\s\S]{3,150}?)<\/h[1-4]>/gi;
  while ((match = nestedHeadingPattern.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
    if (text.length > 3 && text.length < 60 && SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text)) {
      services.add(cleanServiceName(text));
    }
  }

  return [...services].filter(s => s.length > 3);
}

function cleanServiceName(text) {
  return text
    .replace(/\s+in\s+.+$/i, "")
    .replace(/\s+for\s+.+$/i, "")
    .replace(/\s+near\s+.+$/i, "")
    .replace(/,\s*[A-Z]{2}$/i, "")
    .replace(/\s*service$/i, "")
    .replace(/^\d+\.\s*/, "")
    .trim();
}

function extractLogo(html, baseUrl) {
  // Try multiple patterns to find a logo image

  // 1. Look for <img> with "logo" in class, id, alt, or src
  const imgLogoPattern = /<img[^>]*(?:class|id|alt|src)=[^>]*logo[^>]*>/gi;
  let match;
  while ((match = imgLogoPattern.exec(html)) !== null) {
    const srcMatch = match[0].match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      const url = resolveUrl(srcMatch[1], baseUrl);
      if (url && isImageUrl(url)) return url;
    }
  }

  // 2. Look for <link rel="icon"> with large size
  const iconPattern = /<link[^>]*rel=["'](?:icon|apple-touch-icon|shortcut icon)["'][^>]*>/gi;
  let bestIcon = null;
  let bestSize = 0;
  while ((match = iconPattern.exec(html)) !== null) {
    const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
    const sizeMatch = match[0].match(/sizes=["'](\d+)x\d+["']/i);
    if (hrefMatch) {
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 32;
      if (size > bestSize) {
        bestSize = size;
        bestIcon = resolveUrl(hrefMatch[1], baseUrl);
      }
    }
  }
  if (bestIcon && bestSize >= 64) return bestIcon;

  // 3. Look for og:image
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogMatch) {
    const url = resolveUrl(ogMatch[1], baseUrl);
    if (url) return url;
  }

  // 4. Return best icon even if small
  if (bestIcon) return bestIcon;

  return null;
}

function resolveUrl(url, baseUrl) {
  if (!url || url.startsWith("data:")) return null;
  if (url.startsWith("http")) return url;
  try {
    const base = new URL(baseUrl);
    if (url.startsWith("//")) return base.protocol + url;
    if (url.startsWith("/")) return base.origin + url;
    return base.origin + "/" + url;
  } catch {
    return null;
  }
}

function isImageUrl(url) {
  const lower = url.toLowerCase();
  return !lower.includes(".svg") || lower.includes(".png") || lower.includes(".jpg") ||
    lower.includes(".jpeg") || lower.includes(".webp") || lower.includes("image");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
  if (rows.length < 2) { console.log("No data"); return; }

  const headers = rows[0];
  const nameCol = headers.indexOf("Name");
  const websiteCol = headers.indexOf("Website");
  const imageCol = headers.indexOf("Image URL");
  const featuredCol = headers.indexOf("Featured");

  // Find or create Services column
  let servicesCol = headers.indexOf("Services");
  if (servicesCol === -1) {
    servicesCol = headers.length;
    const headerCell = `Listings!${colLetter(servicesCol)}1`;
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(headerCell)}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [["Services"]] }),
      }
    );
    const addData = await addRes.json();
    if (addData.error) {
      console.error("Failed to add Services column:", addData.error);
      return;
    }
    console.log(`Added "Services" column at position ${colLetter(servicesCol)}`);
  } else {
    console.log(`Services column exists at ${colLetter(servicesCol)}`);
  }

  const totalListings = rows.length - 1;
  console.log(`\nProcessing ${totalListings} listings...\n`);

  let stats = { servicesScraped: 0, servicesDefault: 0, servicesSkipped: 0, logoFound: 0, placeholderSet: 0, photoExists: 0, unfeatured: 0 };
  let batchUpdates = [];
  let batchCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[nameCol] || "").trim();
    const website = (row[websiteCol] || "").trim();
    const existingImage = (row[imageCol] || "").trim();
    const existingServices = (row[servicesCol] || "").trim();

    let html = null;
    let services = null;
    let newImageUrl = null;
    let setFeatured = null;

    // Fetch website HTML if we need services or photos
    const needsServices = !existingServices || existingServices.length < 10;
    const needsPhoto = !existingImage || existingImage === PLACEHOLDER_LOGO;
    const hasGooglePhoto = existingImage && existingImage.includes("places.googleapis.com");

    if (website && website.startsWith("http") && (needsServices || needsPhoto)) {
      try {
        html = await fetchHTML(website);
      } catch {
        // Site didn't load
      }
    }

    // --- Services ---
    if (needsServices) {
      if (html) {
        const extracted = extractServices(html);
        if (extracted.length >= 2) {
          services = extracted.slice(0, 12).join(", ");
          stats.servicesScraped++;
        }
      }
      if (!services) {
        services = DEFAULT_SERVICES;
        stats.servicesDefault++;
      }
      batchUpdates.push({
        range: `Listings!${colLetter(servicesCol)}${i + 1}`,
        values: [[services]],
      });
    } else {
      stats.servicesSkipped++;
    }

    // --- Photo ---
    if (hasGooglePhoto) {
      stats.photoExists++;
    } else if (needsPhoto) {
      // Try to scrape logo from website
      if (html && website) {
        const logo = extractLogo(html, website);
        if (logo) {
          newImageUrl = logo;
          stats.logoFound++;
        }
      }
      if (!newImageUrl) {
        newImageUrl = PLACEHOLDER_LOGO;
        stats.placeholderSet++;
      }
      batchUpdates.push({
        range: `Listings!${colLetter(imageCol)}${i + 1}`,
        values: [[newImageUrl]],
      });
    } else {
      stats.photoExists++;
    }

    // --- Featured: only if they have a real photo (not placeholder) ---
    const finalImage = newImageUrl || existingImage;
    if (finalImage === PLACEHOLDER_LOGO) {
      if (row[featuredCol] !== "FALSE") {
        setFeatured = "FALSE";
        stats.unfeatured++;
        batchUpdates.push({
          range: `Listings!${colLetter(featuredCol)}${i + 1}`,
          values: [["FALSE"]],
        });
      }
    }

    // Progress
    const svc = services ? `svc:${services.split(",").length}` : "svc:skip";
    const img = newImageUrl ? (newImageUrl === PLACEHOLDER_LOGO ? "img:placeholder" : "img:logo") : (hasGooglePhoto ? "img:google" : "img:exists");
    process.stdout.write(`\r[${i}/${totalListings}] ${name.slice(0, 35).padEnd(35)} ${svc.padEnd(10)} ${img}`);

    // Batch write every 50 rows
    if (batchUpdates.length >= 50) {
      batchCount++;
      const ok = await sheetsBatchUpdate(token, batchUpdates);
      if (ok) {
        console.log(`\n  -> Batch ${batchCount}: wrote ${batchUpdates.length} cells`);
      }
      batchUpdates = [];
    }

    // Small delay between website fetches
    if (html) await sleep(300);
  }

  // Write remaining batch
  if (batchUpdates.length > 0) {
    batchCount++;
    const ok = await sheetsBatchUpdate(token, batchUpdates);
    if (ok) {
      console.log(`\n  -> Batch ${batchCount}: wrote ${batchUpdates.length} cells (final)`);
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Services scraped: ${stats.servicesScraped}`);
  console.log(`Services defaulted: ${stats.servicesDefault}`);
  console.log(`Services skipped (already had): ${stats.servicesSkipped}`);
  console.log(`Photos already exist (Google): ${stats.photoExists}`);
  console.log(`Logos scraped from websites: ${stats.logoFound}`);
  console.log(`Placeholder logo set: ${stats.placeholderSet}`);
  console.log(`Listings unfeatured (no real photo): ${stats.unfeatured}`);
  console.log(`Total: ${totalListings}`);
}

main().catch(console.error);
