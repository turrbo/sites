#!/usr/bin/env node
/**
 * Backfill photos for listings that have no Image URL.
 * Re-searches each city via Google Places API with places.photos in FieldMask,
 * then matches results to existing sheet rows and updates the Image URL column.
 */

const https = require("https");
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

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || env.GOOGLE_PLACES_API_KEY;
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
    iat: now, exp: now + 3600,
  };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(PRIVATE_KEY, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${signingInput}.${signature}`;
}

function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
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

async function readSheet(token, tab) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tab)}`;
  const res = await fetchJSON(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.error) { console.error("Sheet read error:", res.error); process.exit(1); }
  return res.values || [];
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

async function updateCell(token, range, value) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  return fetchJSON(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [[value]] }),
  });
}

async function searchPlacesWithPhotos(city, state) {
  const body = JSON.stringify({
    textQuery: `garage door repair in ${city}, ${state}`,
    maxResultCount: 8,
  });
  try {
    return await fetchJSON("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.photos,places.formattedAddress",
      },
      body,
    });
  } catch (e) {
    console.error(`  Search failed for ${city}, ${state}: ${e.message}`);
    return { places: [] };
  }
}

function buildPhotoUrl(photoName) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${API_KEY}`;
}

async function main() {
  console.log("Reading current sheet data...");
  const token = await getToken();
  const rows = await readSheet(token, "Listings");

  if (rows.length < 2) { console.log("No data in sheet"); return; }

  const headers = rows[0];
  const nameCol = headers.indexOf("Name");
  const cityCol = headers.indexOf("City");
  const stateCol = headers.indexOf("State");
  const imageCol = headers.indexOf("Image URL");

  if (imageCol === -1) { console.error("Image URL column not found"); return; }

  // Find rows that need photos (empty Image URL)
  const needsPhoto = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[imageCol]) {
      needsPhoto.push({
        rowIndex: i,
        name: row[nameCol] || "",
        city: row[cityCol] || "",
        state: row[stateCol] || "",
      });
    }
  }

  console.log(`Found ${needsPhoto.length} listings needing photos`);

  // Group by city+state
  const cityMap = {};
  for (const item of needsPhoto) {
    const key = `${item.city}|${item.state}`;
    if (!cityMap[key]) cityMap[key] = [];
    cityMap[key].push(item);
  }

  const cities = Object.keys(cityMap);
  console.log(`Searching ${cities.length} cities for photos...`);
  console.log(`Estimated API cost: ${cities.length} x $0.032 = $${(cities.length * 0.032).toFixed(2)}`);

  let updated = 0;
  let searched = 0;

  for (const key of cities) {
    const [city, state] = key.split("|");
    const items = cityMap[key];
    searched++;
    process.stdout.write(`[${searched}/${cities.length}] ${city}, ${state}...`);

    const result = await searchPlacesWithPhotos(city, state);
    const places = result.places || [];

    // Match places to sheet rows by name
    for (const item of items) {
      const nameLower = item.name.toLowerCase().trim();
      const match = places.find(p => {
        const pName = (p.displayName?.text || "").toLowerCase().trim();
        return pName === nameLower;
      });

      if (match && match.photos && match.photos.length > 0) {
        const photoUrl = buildPhotoUrl(match.photos[0].name);
        const cellRange = `Listings!${colLetter(imageCol)}${item.rowIndex + 1}`;
        await updateCell(token, cellRange, photoUrl);
        updated++;
      }
    }

    console.log(` ${items.length} listings, matched photos for some`);
    await sleep(250);
  }

  console.log(`\nDone! Updated ${updated} listings with photos.`);
  console.log(`API cost: $${(searched * 0.032).toFixed(2)}`);
}

main().catch(console.error);
