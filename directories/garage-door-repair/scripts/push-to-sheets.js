#!/usr/bin/env node
/**
 * Push new listings and SEO pages to Google Sheets.
 * Reads from data/new-listings.json and data/new-seo-pages.json
 */

const https = require("https");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load env from .env.local
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
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(PRIVATE_KEY, "base64");
  const encodedSig = signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${signingInput}.${encodedSig}`;
}

function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
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

async function getToken() {
  const jwt = createJWT();
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  }).toString();

  const res = await fetchJSON("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.access_token) {
    console.error("Auth failed:", JSON.stringify(res));
    process.exit(1);
  }
  return res.access_token;
}

async function appendRows(token, tab, rows) {
  const range = encodeURIComponent(tab);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  // Batch in chunks of 100 rows
  const BATCH_SIZE = 100;
  let appended = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const res = await fetchJSON(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: batch }),
    });

    if (res.error) {
      console.error(`Error appending to ${tab}:`, JSON.stringify(res.error));
      return appended;
    }

    appended += batch.length;
    process.stdout.write(`  ${appended}/${rows.length} rows\r`);
  }
  console.log(`  ${appended}/${rows.length} rows appended to ${tab}`);
  return appended;
}

async function main() {
  const listingsPath = path.join(__dirname, "..", "data", "new-listings.json");
  const seoPath = path.join(__dirname, "..", "data", "new-seo-pages.json");

  const listings = JSON.parse(fs.readFileSync(listingsPath, "utf-8"));
  const seoPages = JSON.parse(fs.readFileSync(seoPath, "utf-8"));

  console.log(`Loaded ${listings.length} listings and ${seoPages.length} SEO pages`);

  const token = await getToken();
  console.log("Authenticated with Google Sheets API");

  // Push listings to "Listings" tab
  // Column order must match the existing sheet headers
  console.log("\nPushing listings...");
  const listingRows = listings.map(l => [
    l.Name,
    l.Slug,
    l.Category,
    l.Description,
    l["Short Description"],
    l.Address,
    l.City,
    l.State,
    l["State Full"],
    l.Zip,
    l.Phone,
    l.Website,
    l.Email,
    l["Image URL"],
    l.Rating,
    l["Review Count"],
    l["Price Range"],
    l.Amenities,
    l.Hours,
    l.Latitude,
    l.Longitude,
    l.Featured,
    l.Published,
    l.Tags,
    l["Source URL"],
    "", // Plan
    "", // Submitted Date
    "", // Contact Email
    "", // Payment Status
    "", // Google Business URL
    "", // Stripe Subscription ID
    "", // Expiration Date
  ]);
  await appendRows(token, "Listings", listingRows);

  // Push SEO pages to "SEO Pages" tab
  console.log("\nPushing SEO pages...");
  const seoRows = seoPages.map(s => [
    s.Title,
    s.Slug,
    s.Type,
    s.Content,
    s.Category,
    s.City,
    s.State,
    s["Meta Title"],
    s["Meta Description"],
    s.Published,
  ]);
  await appendRows(token, "SEO Pages", seoRows);

  console.log("\nDone!");
}

main().catch(console.error);
