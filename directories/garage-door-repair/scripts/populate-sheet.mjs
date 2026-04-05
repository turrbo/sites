#!/usr/bin/env node
/**
 * Populate Google Sheet with seed data for the directory site.
 * Creates three tabs: Listings, Categories, SEO Pages
 *
 * Usage: node scripts/populate-sheet.mjs
 */

import { createSign } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env.local manually
const envPath = join(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  let val = trimmed.slice(eqIdx + 1);
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

const SPREADSHEET_ID = env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error("Missing Google Sheets credentials in .env.local");
  process.exit(1);
}

// --- JWT Auth ---

function base64url(input) {
  return Buffer.from(input).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: SERVICE_ACCOUNT_EMAIL,
    // Need read+write scope to populate the sheet
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(PRIVATE_KEY, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${signature}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

// --- Sheets API helpers ---

async function sheetsRequest(token, endpoint, method = "GET", body = null) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${endpoint}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API error (${method} ${endpoint}): ${res.status} ${text}`);
  }
  return res.json();
}

async function getSpreadsheetInfo(token) {
  return sheetsRequest(token, "");
}

async function addSheet(token, title) {
  return sheetsRequest(token, ":batchUpdate", "POST", {
    requests: [{ addSheet: { properties: { title } } }],
  });
}

async function writeValues(token, range, values) {
  const encoded = encodeURIComponent(range);
  return sheetsRequest(
    token,
    `/values/${encoded}?valueInputOption=RAW`,
    "PUT",
    { range, values }
  );
}

// --- Data preparation ---

function loadSeedData() {
  const seedPath = join(__dirname, "..", "src", "lib", "seed-data.json");
  return JSON.parse(readFileSync(seedPath, "utf8"));
}

function buildListingsRows(data) {
  const headers = [
    "Name", "Slug", "Category", "Description", "Short Description",
    "Address", "City", "State", "State Full", "Zip",
    "Phone", "Website", "Email", "Image URL",
    "Rating", "Review Count", "Price Range",
    "Amenities", "Hours", "Latitude", "Longitude",
    "Featured", "Published", "Tags"
  ];

  const rows = data.map(item => [
    item["Name"] || "",
    item["Slug"] || "",
    item["Category"] || "",
    item["Description"] || "",
    item["Short Description"] || "",
    item["Address"] || "",
    item["City"] || "",
    item["State"] || "",
    item["State Full"] || "",
    item["Zip"] || "",
    item["Phone"] || "",
    item["Website"] || "",
    item["Email"] || "",
    item["Image URL"] || "",
    item["Rating"] || "",
    item["Review Count"] || "",
    item["Price Range"] || "",
    item["Amenities"] || "",
    item["Hours"] || "",
    item["Latitude"] || "",
    item["Longitude"] || "",
    item["Featured"] || "FALSE",
    item["Published"] || "TRUE",
    item["Tags"] || "",
  ]);

  return [headers, ...rows];
}

function buildCategoriesRows() {
  const headers = ["Name", "Slug", "Description", "Icon", "Meta Title", "Meta Description"];
  const categories = [
    ["Garage Door Repair", "garage-door-repair", "Professional garage door repair services including spring replacement, opener repair, panel replacement, and emergency services.", "wrench", "Garage Door Repair Services Near You", "Find trusted garage door repair companies in your area. Compare ratings, reviews, and get quotes from local pros."],
    ["Garage Door Installation", "garage-door-installation", "New garage door installation services for residential and commercial properties.", "plus-circle", "Garage Door Installation Services", "Professional garage door installation by licensed contractors near you."],
    ["Garage Door Opener", "garage-door-opener", "Garage door opener repair, replacement, and installation services.", "zap", "Garage Door Opener Services", "Expert garage door opener repair and installation services in your area."],
    ["Spring Replacement", "spring-replacement", "Torsion and extension spring replacement services for garage doors.", "refresh-cw", "Garage Door Spring Replacement", "Fast, reliable garage door spring replacement by certified technicians."],
    ["Emergency Services", "emergency-services", "24/7 emergency garage door repair services available day and night.", "alert-circle", "Emergency Garage Door Repair", "24/7 emergency garage door repair services when you need help fast."],
  ];
  return [headers, ...categories];
}

function buildSEOPagesRows() {
  const headers = ["Title", "Slug", "Type", "Content", "Category", "City", "State", "Meta Title", "Meta Description", "Published"];
  const pages = [
    [
      "The Complete Guide to Garage Door Repair",
      "complete-guide-garage-door-repair",
      "pillar",
      "<h2>Everything You Need to Know About Garage Door Repair</h2><p>Your garage door is the largest moving part of your home and one of the most used entry points. When it breaks down, you need a reliable repair service fast. This comprehensive guide covers everything from common problems and DIY fixes to when you should call a professional.</p><h3>Common Garage Door Problems</h3><p><strong>Broken Springs:</strong> The most common garage door issue. Torsion springs typically last 10,000 cycles (about 7-10 years). When they break, the door becomes extremely heavy and dangerous to operate manually.</p><p><strong>Worn Cables:</strong> Cables work with springs to lift the door. Frayed or broken cables can cause the door to hang unevenly or fall suddenly.</p><p><strong>Misaligned Tracks:</strong> If your door squeaks, sticks, or moves unevenly, the tracks may be misaligned. This can worsen over time and cause the door to come off its tracks entirely.</p><p><strong>Opener Malfunctions:</strong> From remote control issues to motor failures, opener problems are frustrating but usually fixable. Check batteries first, then the photo-eye sensors.</p><h3>When to Call a Professional</h3><p>Always call a professional for spring replacement (high tension = high danger), cable repairs, track realignment, and any repair involving the door's counterbalance system. DIY is fine for lubrication, weather stripping, and minor cosmetic fixes.</p><h3>How to Choose a Garage Door Repair Company</h3><p>Look for licensed and insured technicians, upfront pricing with written estimates, warranty on parts and labor, same-day or emergency service availability, and positive reviews from verified customers.</p>",
      "", "", "",
      "Complete Guide to Garage Door Repair | Tips, Costs & When to Call a Pro",
      "Everything you need to know about garage door repair: common problems, DIY vs professional repair, cost estimates, and how to choose the right repair company.",
      "TRUE"
    ],
    [
      "How Much Does Garage Door Repair Cost in 2026?",
      "garage-door-repair-cost-guide-2026",
      "pillar",
      "<h2>Garage Door Repair Cost Guide for 2026</h2><p>Understanding repair costs helps you budget and avoid overpaying. Here's what to expect for common garage door repairs in 2026.</p><h3>Average Repair Costs</h3><p><strong>Spring Replacement:</strong> $150-$350 for a single spring, $200-$500 for a pair. Torsion springs cost more than extension springs.</p><p><strong>Cable Repair:</strong> $100-$200 per cable, including labor.</p><p><strong>Opener Repair:</strong> $100-$300 depending on the issue. Full replacement runs $200-$600.</p><p><strong>Panel Replacement:</strong> $250-$800 per panel, depending on material and style.</p><p><strong>Track Repair:</strong> $125-$250 for realignment. Full track replacement: $200-$400.</p><p><strong>Emergency Service:</strong> Add $50-$150 for after-hours or weekend calls.</p><h3>Factors That Affect Cost</h3><p>Location (urban areas cost more), door type and size, material quality, warranty coverage, and whether it's an emergency call all impact your final bill.</p><h3>How to Save Money</h3><p>Get multiple quotes, ask about package deals, schedule during regular business hours, and invest in preventive maintenance to avoid costly emergency repairs.</p>",
      "", "", "",
      "Garage Door Repair Costs in 2026 | Price Guide & Estimates",
      "How much does garage door repair cost? Average prices for spring replacement, opener repair, panel replacement, and more in 2026.",
      "TRUE"
    ],
    [
      "Garage Door Safety Tips Every Homeowner Should Know",
      "garage-door-safety-tips",
      "pillar",
      "<h2>Essential Garage Door Safety Tips</h2><p>Garage doors weigh 150-400+ pounds and operate under high spring tension. Follow these safety tips to protect your family.</p><h3>Monthly Safety Checks</h3><p><strong>Test the auto-reverse:</strong> Place a 2x4 on the ground under the door and press close. The door should reverse immediately upon contact.</p><p><strong>Check the photo-eye sensors:</strong> These sensors near the bottom of the door tracks prevent the door from closing on people or objects. Keep them clean and aligned.</p><p><strong>Inspect springs and cables visually:</strong> Look for rust, fraying, or gaps in torsion springs. Never attempt to adjust or replace springs yourself.</p><p><strong>Lubricate moving parts:</strong> Apply garage door lubricant (not WD-40) to rollers, hinges, and springs every 3-6 months.</p><h3>Safety Rules</h3><p>Never let children play with garage door remotes or wall buttons. Don't stand or walk under a moving door. Keep fingers away from door sections when the door is moving. If a spring breaks, do not attempt to open the door -- call a professional.</p>",
      "", "", "",
      "Garage Door Safety Tips | Protect Your Family & Home",
      "Essential garage door safety tips every homeowner should know. Monthly checks, auto-reverse testing, and when to call a professional.",
      "TRUE"
    ],
  ];
  return [headers, ...pages];
}

// --- Main ---

async function main() {
  console.log("Authenticating with Google Sheets API...");
  const token = await getAccessToken();
  console.log("Authenticated successfully.\n");

  // Get existing sheet info
  const info = await getSpreadsheetInfo(token);
  const existingSheets = info.sheets.map(s => s.properties.title);
  console.log(`Existing sheets: ${existingSheets.join(", ")}`);

  // Create tabs if they don't exist
  for (const tab of ["Listings", "Categories", "SEO Pages"]) {
    if (!existingSheets.includes(tab)) {
      console.log(`Creating "${tab}" tab...`);
      await addSheet(token, tab);
    } else {
      console.log(`"${tab}" tab already exists.`);
    }
  }

  // Load seed data
  console.log("\nLoading seed data...");
  const seedData = loadSeedData();
  console.log(`Found ${seedData.length} listings.`);

  // Write Listings
  const listingsRows = buildListingsRows(seedData);
  console.log(`\nWriting ${listingsRows.length - 1} listings to "Listings" tab...`);
  await writeValues(token, "Listings!A1", listingsRows);
  console.log("Listings written.");

  // Write Categories
  const categoriesRows = buildCategoriesRows();
  console.log(`\nWriting ${categoriesRows.length - 1} categories to "Categories" tab...`);
  await writeValues(token, "Categories!A1", categoriesRows);
  console.log("Categories written.");

  // Write SEO Pages
  const seoRows = buildSEOPagesRows();
  console.log(`\nWriting ${seoRows.length - 1} SEO pages to "SEO Pages" tab...`);
  await writeValues(token, "SEO Pages!A1", seoRows);
  console.log("SEO Pages written.");

  console.log("\nDone! Your Google Sheet is fully populated.");
  console.log(`View it at: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
