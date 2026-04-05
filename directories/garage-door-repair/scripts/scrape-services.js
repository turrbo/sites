#!/usr/bin/env node
/**
 * Scrape services from business websites and update Google Sheet.
 * Falls back to standard garage door repair services if scraping fails.
 */

const https = require("https");
const http = require("http");
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

// Service-related keywords to filter nav/headings
const SERVICE_KEYWORDS = /repair|install|replace|spring|opener|door|service|maint|inspect|cable|track|roller|panel|emergency|commercial|custom|insul|lubrication|tune.?up|smart|high.?speed|overhead|rolling|torsion|extension|weather.?seal|remote|keypad|sensor|balance|align/i;

// Words to exclude (not actual services)
const EXCLUDE_WORDS = /home|about|contact|gallery|blog|review|testimonial|location|area|career|job|apply|financ|coupon|special|faq|privacy|terms|sitemap|login|sign|call|free estimate|book|schedule|quote|resource|useful|video|photo|meet|team|why choose|professional|technician|hour|map/i;

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

function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const mod = urlObj.protocol === "https:" ? https : http;
    const req = mod.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers || {},
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data, status: res.statusCode }); }
      });
    });
    req.on("error", reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error("timeout")); });
    if (options.body) req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

function fetchHTML(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const mod = urlObj.protocol === "https:" ? https : http;
    const req = mod.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith("/")) redirectUrl = `${urlObj.protocol}//${urlObj.hostname}${redirectUrl}`;
        fetchHTML(redirectUrl, timeout).then(resolve).catch(reject);
        return;
      }
      let data = "";
      res.on("data", chunk => {
        data += chunk;
        if (data.length > 500000) { res.destroy(); resolve(data); } // Cap at 500KB
      });
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error("timeout")); });
    req.end();
  });
}

function extractServices(html) {
  const services = new Set();

  // Extract from nav links and menu items
  const navPattern = /<(?:a|li)[^>]*>([^<]{3,80})<\/(?:a|li)>/gi;
  let match;
  while ((match = navPattern.exec(html)) !== null) {
    const text = match[1].trim().replace(/\s+/g, " ");
    if (SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text) && text.length < 60) {
      services.add(cleanServiceName(text));
    }
  }

  // Extract from headings
  const headingPattern = /<h[1-4][^>]*>([^<]{3,100})<\/h[1-4]>/gi;
  while ((match = headingPattern.exec(html)) !== null) {
    const text = match[1].trim().replace(/\s+/g, " ");
    if (SERVICE_KEYWORDS.test(text) && !EXCLUDE_WORDS.test(text) && text.length < 60) {
      services.add(cleanServiceName(text));
    }
  }

  // Also try extracting from nested heading content (headings with spans inside)
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
  // Remove city names, state abbreviations, and common suffixes
  return text
    .replace(/\s+in\s+.+$/i, "")
    .replace(/\s+for\s+.+$/i, "")
    .replace(/\s+near\s+.+$/i, "")
    .replace(/,\s*[A-Z]{2}$/i, "")
    .replace(/\s*service$/i, "")
    .replace(/^\d+\.\s*/, "")
    .trim();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getToken() {
  const jwt = createJWT();
  const res = await fetchJSON("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });
  if (!res.access_token) { console.error("Auth failed:", res); process.exit(1); }
  return res.access_token;
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

async function main() {
  const token = await getToken();
  console.log("Authenticated with Google Sheets");

  // Read all listings
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent("Listings")}`;
  const data = await fetchJSON(readUrl, { headers: { Authorization: `Bearer ${token}` } });
  const rows = data.values || [];
  if (rows.length < 2) { console.log("No data"); return; }

  const headers = rows[0];
  const nameCol = headers.indexOf("Name");
  const websiteCol = headers.indexOf("Website");
  const cityCol = headers.indexOf("City");

  // Check if Services column exists, if not add it
  let servicesCol = headers.indexOf("Services");
  if (servicesCol === -1) {
    // Add Services header after Tags column (or at end)
    servicesCol = headers.length;
    const headerCell = `Listings!${colLetter(servicesCol)}1`;
    await fetchJSON(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(headerCell)}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [["Services"]] }),
      }
    );
    console.log(`Added "Services" column at position ${colLetter(servicesCol)}`);
  }

  console.log(`\nProcessing ${rows.length - 1} listings...`);

  let scraped = 0;
  let defaulted = 0;
  let skipped = 0;
  const batchUpdates = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameCol] || "";
    const website = row[websiteCol] || "";
    const city = row[cityCol] || "";
    const existingServices = row[servicesCol] || "";

    // Skip if already has services
    if (existingServices && existingServices.length > 10) {
      skipped++;
      continue;
    }

    let services = null;

    if (website && website.startsWith("http")) {
      try {
        const html = await fetchHTML(website);
        const extracted = extractServices(html);
        if (extracted.length >= 2) {
          services = extracted.slice(0, 12).join(", ");
          scraped++;
          process.stdout.write(`\r[${i}/${rows.length - 1}] Scraped: ${name.slice(0, 30)} (${extracted.length} services)`);
        }
      } catch (e) {
        // Site didn't load - will use default
      }
    }

    if (!services) {
      services = DEFAULT_SERVICES;
      defaulted++;
      process.stdout.write(`\r[${i}/${rows.length - 1}] Default: ${name.slice(0, 30)}                    `);
    }

    batchUpdates.push({
      range: `Listings!${colLetter(servicesCol)}${i + 1}`,
      values: [[services]],
    });

    // Batch write every 100 rows
    if (batchUpdates.length >= 100) {
      await fetchJSON(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            valueInputOption: "USER_ENTERED",
            data: batchUpdates,
          }),
        }
      );
      batchUpdates.length = 0;
    }

    // Small delay between website fetches to be polite
    if (website && website.startsWith("http")) await sleep(300);
  }

  // Write remaining batch
  if (batchUpdates.length > 0) {
    await fetchJSON(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          valueInputOption: "USER_ENTERED",
          data: batchUpdates,
        }),
      }
    );
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Scraped from websites: ${scraped}`);
  console.log(`Used default services: ${defaulted}`);
  console.log(`Skipped (already had): ${skipped}`);
  console.log(`Total: ${scraped + defaulted + skipped}`);
}

main().catch(console.error);
