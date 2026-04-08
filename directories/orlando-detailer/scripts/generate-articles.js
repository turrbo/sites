#!/usr/bin/env node
/**
 * Generate SEO guide articles for the Orlando Detailer directory.
 *
 * For each of 23 cities, generates 8 articles covering:
 *   1. Best Auto Detailing
 *   2. Ceramic Coating Cost
 *   3. Window Tinting Laws
 *   4. Best Window Tint Shops
 *   5. Vehicle Wrap Cost
 *   6. PPF vs Ceramic Coating
 *   7. Mobile Detailing Services
 *   8. Commercial Fleet Wraps
 *
 * Pushes results to "SEO Pages" tab in Google Sheets.
 *
 * Usage:
 *   node scripts/generate-articles.js
 *   node scripts/generate-articles.js --dry-run
 *
 * Env vars (can also be in .env.local):
 *   AI_GATEWAY_API_KEY
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  (optional, falls back to hardcoded)
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// ─── Load .env.local ──────────────────────────────────────────────────
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

// ─── Config ───────────────────────────────────────────────────────────
const SPREADSHEET_ID = "1egSWQXYXq2sZGq7bh3u0rKcNvB_4-YsyLQptqECOQ78";
const SERVICE_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  "directory-reader@directory-sites-492400.iam.gserviceaccount.com";
const PRIVATE_KEY = (
  process.env.GOOGLE_PRIVATE_KEY ||
  env.GOOGLE_PRIVATE_KEY ||
  ""
).replace(/\\n/g, "\n");

const AI_GATEWAY_URL = "https://ai-gateway.happycapy.ai/api/v1/chat/completions";
const AI_GATEWAY_KEY =
  process.env.AI_GATEWAY_API_KEY || env.AI_GATEWAY_API_KEY || "";

const MODEL = "anthropic/claude-haiku-4.5";
const YEAR = 2026;
const DRY_RUN = process.argv.includes("--dry-run");

const SEO_TAB = "SEO Pages";
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

// ─── Cities ───────────────────────────────────────────────────────────
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

// ─── Article type definitions ─────────────────────────────────────────
function buildArticleTypes(city) {
  const citySlug = slugify(city);
  return [
    {
      slug: `best-auto-detailing-${citySlug}-fl`,
      title: `Best Auto Detailing in ${city}, FL (${YEAR})`,
      category: "Auto Detailing",
      prompt: `Write a 1200-word guide about finding the best auto detailing shops in ${city}, Florida. Cover what to look for in a quality detailer, types of services (basic wash, full detail, ceramic coating, paint correction), expected price ranges ($50-150 basic detail, $150-300 full detail, $500-2000 ceramic coating in Florida), why detailing matters in Florida's climate (UV, humidity, salt air). Include practical tips for choosing a shop. End with a 3-question FAQ section. Format as HTML with h2/h3 headings, p tags, and ul/li lists.`,
    },
    {
      slug: `ceramic-coating-cost-${citySlug}-fl`,
      title: `Ceramic Coating Cost in ${city}, FL - Complete Price Guide (${YEAR})`,
      category: "Auto Detailing",
      prompt: `Write a 1000-word cost guide for ceramic coating in ${city}, FL. Include: DIY consumer-grade ($50-200), professional entry-level 1-year ($300-800), professional mid-tier 3-5 year ($800-1500), professional premium 7-9H multi-layer ($1500-4000). Factors affecting cost: vehicle size, paint condition, coating tier, paint correction needed. Compare ceramic coating to wax and PPF. Why ceramic coating is especially valuable in Florida (UV protection, humidity resistance, easier cleaning). Include an HTML table comparing tiers. End with 3-question FAQ. Format as HTML.`,
    },
    {
      slug: `window-tinting-laws-${citySlug}-fl`,
      title: `Window Tinting Laws in ${city}, FL - Legal Limits & Requirements (${YEAR})`,
      category: "Window Tinting",
      prompt: `Write a 1000-word guide on Florida window tinting laws relevant to ${city} residents. Florida law: front side windows must allow 28%+ VLT (visible light transmission), rear side and back windows have no VLT restriction, windshield allows non-reflective tint above the AS-1 line. Medical exemptions available through DHSMV. Cover: legal tint percentages by window, how to check compliance, penalties for illegal tint ($116 fine), medical exemption process, why quality film matters in Florida heat (cheap films bubble/peel). Mention differences between ceramic, carbon, dyed, and metallic film types. Format as HTML with a table of legal limits by window position. End with 3-question FAQ.`,
    },
    {
      slug: `best-window-tint-shops-${citySlug}-fl`,
      title: `Best Window Tint Shops in ${city}, FL (${YEAR})`,
      category: "Window Tinting",
      prompt: `Write a 1000-word guide about finding quality window tint shops in ${city}, FL. Cover: what makes a good tint shop (certified installers, quality film brands like 3M, XPEL, SunTek, Llumar), questions to ask before booking, types of window film (ceramic vs carbon vs dyed vs metallic), typical pricing ($150-400 full car), warranty expectations, red flags to avoid. Why professional installation matters vs DIY. Florida-specific considerations (heat rejection performance matters more here). Format as HTML. End with 3-question FAQ.`,
    },
    {
      slug: `vehicle-wrap-cost-${citySlug}-fl`,
      title: `Vehicle Wrap Cost in ${city}, FL - Full Price Breakdown (${YEAR})`,
      category: "Vehicle Wraps",
      prompt: `Write a 1000-word cost guide for vehicle wraps in ${city}, FL. Price ranges: full wrap $2500-6000 for average car, partial wrap $500-2000, color change wrap $3000-5000, commercial/fleet wraps $1500-3500 per vehicle, clear bra/PPF $1500-5000 full car front. Factors: vehicle size (sedan vs SUV vs truck), wrap complexity, vinyl quality (cast vs calendered), design complexity. Benefits of wrapping vs painting. Longevity: quality vinyl lasts 5-7 years, PPF 7-10 years. Florida considerations: UV exposure tests vinyl quality, choose films with UV inhibitors. Include HTML price comparison table. End with 3-question FAQ. Format as HTML.`,
    },
    {
      slug: `ppf-vs-ceramic-coating-${citySlug}-fl`,
      title: `PPF vs Ceramic Coating in ${city}, FL - Which Is Better? (${YEAR})`,
      category: "Auto Detailing",
      prompt: `Write a 1000-word comparison guide between PPF (Paint Protection Film) and ceramic coating for car owners in ${city}, FL. Cover: what each product does (PPF = physical barrier against chips/scratches, ceramic = chemical hydrophobic layer), price comparison (PPF full front $1500-2500 vs ceramic $500-1500), durability (PPF 7-10yr vs ceramic 2-5yr), maintenance differences, can you combine both (yes - PPF first then ceramic on top). Pros and cons of each. Florida-specific advice: rock chips on I-4 and turnpike make PPF valuable, but ceramic coating's UV protection and hydrophobic properties are essential in rain/humidity. Include HTML comparison table. Format as HTML. End with 3-question FAQ.`,
    },
    {
      slug: `mobile-detailing-services-${citySlug}-fl`,
      title: `Mobile Detailing Services in ${city}, FL (${YEAR})`,
      category: "Auto Detailing",
      prompt: `Write a 1000-word guide about mobile auto detailing in ${city}, FL. Cover: what mobile detailing is, advantages (convenience, no driving to a shop), typical services offered (exterior wash, interior cleaning, clay bar, wax, ceramic spray), pricing ($75-150 basic mobile detail, $200-400 full mobile detail), what to expect during a mobile detail appointment. How to choose a reputable mobile detailer (insurance, reviews, equipment quality). Florida considerations: mobile detailing is popular due to hot weather (easier than driving to a shop), but water restrictions in some communities may limit services. Format as HTML. End with 3-question FAQ.`,
    },
    {
      slug: `commercial-fleet-wraps-${citySlug}-fl`,
      title: `Commercial Fleet Wraps in ${city}, FL - Business Vehicle Branding (${YEAR})`,
      category: "Vehicle Wraps",
      prompt: `Write a 1000-word guide about commercial fleet wraps for businesses in ${city}, FL. Cover: why fleet wraps are effective marketing (30,000-70,000 daily impressions per vehicle), types of fleet wraps (full wrap, partial wrap, spot graphics, lettering), pricing ($1500-3500 per vehicle for fleet rates), design considerations, turnaround time (3-5 days per vehicle), maintenance and care. ROI comparison: fleet wraps vs traditional advertising. Florida business considerations: bright colors and high contrast work well in Florida sunshine, UV-resistant vinyl is essential. Format as HTML. End with 3-question FAQ.`,
    },
  ];
}

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
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: SERVICE_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign
    .sign(PRIVATE_KEY, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const jwt = `${signingInput}.${signature}`;

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

// ─── Google Sheets: read existing slugs ──────────────────────────────

async function getExistingSlugs(token) {
  const range = encodeURIComponent(`${SEO_TAB}!B:B`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.error) {
    console.warn("  Could not read existing slugs:", data.error.message);
    return new Set();
  }
  const rows = data.values || [];
  // Skip header row (index 0 = "Slug")
  const slugs = new Set(rows.slice(1).map((r) => r[0]).filter(Boolean));
  console.log(`  Found ${slugs.size} existing articles in sheet.`);
  return slugs;
}

// ─── Google Sheets: append rows in batches ───────────────────────────

async function appendRows(token, rows, attempt = 1) {
  if (rows.length === 0) return;

  const range = encodeURIComponent(SEO_TAB);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: rows }),
  });

  const data = await res.json();
  if (data.error) {
    if (attempt < 2) {
      console.warn(`  Sheets write failed, retrying... (${data.error.message})`);
      await sleep(2000);
      return appendRows(token, rows, 2);
    }
    throw new Error(`Sheets append failed: ${data.error.message}`);
  }
  return data;
}

// ─── AI Gateway: generate article content ────────────────────────────

const SYSTEM_PROMPT =
  "You are an expert SEO content writer for the auto detailing industry in Florida. Write engaging, informative content that helps car owners make informed decisions. Never mention specific business names. Use HTML formatting.";

async function generateArticle(articleType) {
  const userPrompt = `${articleType.prompt}

Also generate:
1. A meta title (max 60 characters, plain text)
2. A meta description (max 155 characters, plain text)

Format your response exactly as:
<META_TITLE>
your meta title here
</META_TITLE>
<META_DESCRIPTION>
your meta description here
</META_DESCRIPTION>
<CONTENT>
your HTML content here
</CONTENT>`;

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_GATEWAY_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || "";

  const metaTitle =
    text.match(/<META_TITLE>\s*([\s\S]*?)\s*<\/META_TITLE>/)?.[1]?.trim() ||
    articleType.title.slice(0, 60);

  const metaDesc =
    text.match(/<META_DESCRIPTION>\s*([\s\S]*?)\s*<\/META_DESCRIPTION>/)?.[1]?.trim() ||
    `Find the best ${articleType.category.toLowerCase()} services in ${articleType.title}.`.slice(0, 155);

  const content =
    text.match(/<CONTENT>\s*([\s\S]*?)\s*<\/CONTENT>/)?.[1]?.trim() ||
    // Fallback: use entire response if tags not found
    text.replace(/<META_TITLE>[\s\S]*?<\/META_TITLE>/g, "")
       .replace(/<META_DESCRIPTION>[\s\S]*?<\/META_DESCRIPTION>/g, "")
       .trim();

  // Strip any injected system tags that may appear in AI output
  const cleanContent = content
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, "")
    .replace(/<\/?(!DOCTYPE|html|head|body|title)[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<\/?html[^>]*>/gi, "")
    .replace(/<\/?head[^>]*>/gi, "")
    .replace(/<\/?body[^>]*>/gi, "")
    .replace(/<title>[^<]*<\/title>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .trim();

  return {
    content: cleanContent,
    metaTitle: metaTitle.slice(0, 60),
    metaDescription: metaDesc.slice(0, 155),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Orlando Detailer - Generate SEO Articles");
  console.log("=".repeat(50));

  if (DRY_RUN) {
    console.log("DRY RUN MODE - generating first article only, no Sheets write\n");
  }

  if (!AI_GATEWAY_KEY) {
    console.error("AI_GATEWAY_API_KEY is required (env var or .env.local)");
    process.exit(1);
  }

  // ─── Dry run: generate first article and exit ─────────────────────
  if (DRY_RUN) {
    const firstCity = CITIES[0];
    const firstArticle = buildArticleTypes(firstCity)[0];
    console.log(`Generating: ${firstArticle.title}`);
    try {
      const result = await generateArticle(firstArticle);
      console.log("\n--- META TITLE ---");
      console.log(result.metaTitle);
      console.log("\n--- META DESCRIPTION ---");
      console.log(result.metaDescription);
      console.log("\n--- CONTENT (first 1000 chars) ---");
      console.log(result.content.slice(0, 1000));
      console.log("\n[Dry run complete. No data written to Sheets.]");
    } catch (err) {
      console.error("Generation failed:", err.message);
    }
    return;
  }

  // ─── Production run ───────────────────────────────────────────────
  if (!PRIVATE_KEY) {
    console.error("GOOGLE_PRIVATE_KEY is required for Sheets writes.");
    process.exit(1);
  }

  console.log("\nAuthenticating with Google Sheets...");
  const token = await getToken();
  console.log("Authenticated.");

  // Check which articles already exist
  console.log("\nChecking existing articles...");
  const existingSlugs = await getExistingSlugs(token);

  // Build full article queue, skipping already-generated ones
  const queue = [];
  for (const city of CITIES) {
    for (const articleType of buildArticleTypes(city)) {
      if (!existingSlugs.has(articleType.slug)) {
        queue.push({ city, articleType });
      }
    }
  }

  const totalArticles = CITIES.length * 8;
  const skipped = totalArticles - queue.length;
  console.log(`\nTotal articles: ${totalArticles}`);
  console.log(`Already generated: ${skipped}`);
  console.log(`To generate: ${queue.length}`);

  if (queue.length === 0) {
    console.log("\nAll articles already generated. Nothing to do.");
    return;
  }

  // ─── Generate and push in batches of 10 ──────────────────────────
  const BATCH_SIZE = 10;
  let generated = 0;
  let errors = 0;
  const batch = [];

  let lastCity = null;
  let cityIndex = 0;

  for (let qi = 0; qi < queue.length; qi++) {
    const { city, articleType } = queue[qi];

    // Print city progress header when city changes
    if (city !== lastCity) {
      cityIndex++;
      const overallCityIdx = CITIES.indexOf(city) + 1;
      console.log(`\nGenerating articles for ${city} (${overallCityIdx}/${CITIES.length})...`);
      lastCity = city;
    }

    process.stdout.write(`  [${qi + 1}/${queue.length}] ${articleType.slug} ... `);

    try {
      const result = await generateArticle(articleType);

      const row = [
        articleType.title,
        articleType.slug,
        city,
        "FL",
        articleType.category,
        result.content,
        result.metaTitle,
        result.metaDescription,
        "TRUE",
      ];

      batch.push(row);
      generated++;
      console.log(`OK (${result.content.length} chars)`);
    } catch (err) {
      errors++;
      console.error(`FAILED - ${err.message}`);
    }

    // Push to Sheets when batch is full or we're done
    if (batch.length >= BATCH_SIZE || qi === queue.length - 1) {
      if (batch.length > 0) {
        process.stdout.write(`  Pushing ${batch.length} rows to Sheets... `);
        try {
          await appendRows(token, batch);
          console.log("OK");
        } catch (err) {
          console.error(`FAILED - ${err.message}`);
          errors += batch.length;
          generated -= batch.length;
        }
        batch.length = 0; // clear the batch
      }
    }

    // Rate limit: 1 second between AI calls (skip after last item)
    if (qi < queue.length - 1) {
      await sleep(1000);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("DONE");
  console.log("=".repeat(50));
  console.log(`Generated: ${generated}`);
  console.log(`Errors: ${errors}`);
  console.log(`Skipped (already existed): ${skipped}`);
  console.log(`\nSpreadsheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
