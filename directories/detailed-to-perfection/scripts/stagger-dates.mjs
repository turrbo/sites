/**
 * Staggers "Published At" dates across all content tabs so articles
 * appear to have been published over the past ~3 months.
 * Usage: node scripts/stagger-dates.mjs
 */
import { readFileSync } from "fs";
import { createSign } from "crypto";

// --- Load env ---
const envFile = readFileSync(".env.local", "utf8");
const env = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
}

const SPREADSHEET_ID = env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = env.GOOGLE_PRIVATE_KEY_BASE64
  ? Buffer.from(env.GOOGLE_PRIVATE_KEY_BASE64, "base64").toString("utf8")
  : (env.GOOGLE_PRIVATE_KEY || "").replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = JSON.stringify({ alg: "RS256", typ: "JWT" });
  const payload = JSON.stringify({
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  });
  const signingInput = `${base64url(header)}.${base64url(payload)}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(PRIVATE_KEY, "base64");
  return `${signingInput}.${signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

async function getToken() {
  const jwt = await createJWT();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth error: ${JSON.stringify(data)}`);
  return data.access_token;
}

function generateDates(count, startDaysAgo, endDaysAgo) {
  // Spread dates between startDaysAgo and endDaysAgo, with some randomness
  const dates = [];
  const now = new Date();
  const range = startDaysAgo - endDaysAgo;
  const step = range / (count - 1);

  for (let i = 0; i < count; i++) {
    const daysAgo = startDaysAgo - (step * i) + (Math.random() * 3 - 1.5); // +/- 1.5 day jitter
    const date = new Date(now);
    date.setDate(date.getDate() - Math.max(0, Math.round(daysAgo)));
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

async function updateDateColumn(token, sheetName, dateColLetter, rowCount, dates) {
  const range = `${sheetName}!${dateColLetter}2:${dateColLetter}${rowCount + 1}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      range,
      values: dates.map(d => [d]),
    }),
  });

  if (!res.ok) {
    console.error(`Error updating ${sheetName}:`, await res.text());
  } else {
    console.log(`Updated ${dates.length} dates in ${sheetName} (${dates[0]} to ${dates[dates.length - 1]})`);
  }
}

async function main() {
  const token = await getToken();

  // Reviews: 25 articles, "Published At" is column H, spread over 90 days
  const reviewDates = generateDates(25, 90, 2);
  await updateDateColumn(token, "Reviews", "H", 25, reviewDates);

  // Guides: 25 articles, "Published At" is column G, spread over 85 days
  const guideDates = generateDates(25, 85, 3);
  await updateDateColumn(token, "Guides", "G", 25, guideDates);

  // Blog: 20 articles, "Published At" is column H, spread over 80 days
  const blogDates = generateDates(20, 80, 1);
  await updateDateColumn(token, "Blog", "H", 20, blogDates);

  console.log("Done! Dates staggered across all content.");
}

main().catch(console.error);
