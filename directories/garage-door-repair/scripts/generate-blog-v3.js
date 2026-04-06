#!/usr/bin/env node
/**
 * Generate blog posts (batch 3) for the Garage Door Repair Directory.
 * Topics derived from AnswerSocrates "Garage door repair" research.
 *
 * Creates ~10 new blog posts from unique AnswerSocrates questions.
 * Uses AI Gateway to generate quality HTML content for each article.
 *
 * Usage:
 *   node scripts/generate-blog-v3.js
 *   node scripts/generate-blog-v3.js --generate-only
 */

const fs = require("fs");
const path = require("path");

// Load env from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const env = {};
try {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) {
      let val = m[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[m[1].trim()] = val;
    }
  }
} catch {}

const SPREADSHEET_ID = env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL =
  env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (
  env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || ""
).replace(/\\n/g, "\n");

const AI_GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY;
const AI_GATEWAY_URL =
  "https://ai-gateway.happycapy.ai/api/v1/chat/completions";

const GENERATE_ONLY = process.argv.includes("--generate-only");

if (
  !GENERATE_ONLY &&
  (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY)
) {
  console.error(
    "Missing env vars. Use --generate-only to just create JSON, or set up .env.local"
  );
  process.exit(1);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Blog Post Topics (from AnswerSocrates data) ---

const BLOG_TOPICS = [
  {
    title: "Do You Tip a Garage Door Repairman? Etiquette Guide",
    category: "Tips & Maintenance",
    tags: "tipping,etiquette,service,repairman",
    prompt:
      "Write an article answering whether you should tip a garage door repairman. Cover: industry norms (tipping is not expected but appreciated), when tipping makes sense (exceptional service, going above and beyond, emergency/after-hours call), appropriate tip amounts ($10-$20 for good service, $20-$50 for exceptional), alternatives to tipping (positive online review, referrals, offering water/snacks), how garage door techs are typically compensated (hourly wage vs commission), and cultural considerations.",
  },
  {
    title: "How Long Does Garage Door Replacement Take?",
    category: "Buying Guides",
    tags: "replacement,installation,timeline,planning",
    prompt:
      "Write an article about how long garage door replacement takes. Cover: typical timeline for different scenarios (existing door swap 3-5 hours, new opening 1-2 days, custom doors 2-4 weeks lead time + 1 day install), factors that affect timing (weather, permits, custom sizing, old door removal complications, track/frame modifications), what to expect during each phase (ordering, old door removal, track installation, new door hanging, opener setup, testing), how to prepare your garage, and tips for scheduling to minimize disruption.",
  },
  {
    title: "Garage Door Repair vs Replacement: How to Decide",
    category: "Cost & Pricing",
    tags: "repair,replacement,cost-comparison,decision",
    prompt:
      "Write a comprehensive comparison guide helping homeowners decide between repairing and replacing their garage door. Cover: the 50% rule (if repair costs more than 50% of replacement, replace), age-based guidance (under 10 years usually repair, 15+ usually replace), issues that are always worth repairing (springs, cables, sensors, opener), issues that warrant replacement (multiple panel damage, severe rust, structural warping, outdated safety), ROI of new garage door (98% return on investment per Remodeling Magazine), energy efficiency gains from modern insulated doors, and a decision flowchart.",
  },
  {
    title: "Is Garage Door Repair Covered by Home Warranty?",
    category: "Cost & Pricing",
    tags: "home-warranty,coverage,insurance,cost",
    prompt:
      "Write an article about home warranty coverage for garage doors (distinct from homeowners insurance). Cover: what home warranties typically cover (garage door opener mechanical/electrical failure, springs, remote), what they usually exclude (the door panels themselves, cosmetic damage, pre-existing conditions, improper installation), major home warranty providers and their garage door coverage (American Home Shield, Choice Home Warranty, First American), typical service call fees ($75-125), how to file a claim, and whether adding garage door coverage is worth it.",
  },
  {
    title: "Can Garage Door Dents Be Repaired? Cost and Methods",
    category: "Tips & Maintenance",
    tags: "dents,repair,panels,diy,cost",
    prompt:
      "Write a practical guide on repairing garage door dents. Cover: types of dents (small dings, large dents, creased dents), DIY methods by material (aluminum - suction cup or boiling water method, steel - auto body filler and sand, wood - wood filler), when professional repair makes sense vs panel replacement, cost of DIY repair ($10-50 in materials) vs professional dent repair ($100-300) vs panel replacement ($250-800), and prevention tips (parking carefully, installing bumper guards, choosing dent-resistant doors).",
  },
  {
    title: "How Much Do Garage Door Repairmen Charge Per Hour?",
    category: "Cost & Pricing",
    tags: "cost,labor,pricing,hourly-rate,service-call",
    prompt:
      "Write an article breaking down garage door repair labor costs. Cover: typical hourly rates ($75-150/hour), service call/trip fees ($50-100), flat-rate vs hourly pricing models, how pricing varies by repair type (spring replacement flat rate $200-400, opener repair hourly $75-150/hr, track realignment $100-200), geographic pricing differences (urban vs rural, high vs low cost-of-living areas), weekend/emergency premiums (1.5-2x normal rate), how to get accurate estimates, and red flags in pricing (extremely low quotes, refusal to give written estimates).",
  },
  {
    title: "Are Garage Doors Dangerous? Safety Risks You Should Know",
    category: "Safety & Industry",
    tags: "safety,danger,injuries,children,prevention",
    prompt:
      "Write an important safety article about garage door dangers. Cover: injury statistics (about 30,000 injuries per year in the US), the most dangerous components (torsion springs under extreme tension, heavy door weight 150-400 lbs, pinch points between panels), risks to children and pets, required safety features (auto-reverse since 1993, photo-eye sensors), how to test your safety features, spring-related dangers (why DIY spring repair kills people every year), entrapment risks, carbon monoxide risks from running cars in closed garages, and a safety checklist for families.",
  },
  {
    title: "How Often Should You Service Your Garage Door?",
    category: "Tips & Maintenance",
    tags: "maintenance,service,schedule,frequency,lubrication",
    prompt:
      "Write a guide on garage door maintenance frequency. Cover: recommended maintenance schedule (visual inspection monthly, lubrication every 3-6 months, professional tune-up annually), what DIY monthly checks include (listen for unusual sounds, watch for uneven movement, check sensor alignment, inspect weather stripping), what to do every 6 months (lubricate rollers/hinges/springs, tighten hardware, clean tracks), what a professional annual service includes (spring tension check, cable inspection, opener force adjustment, safety feature testing), signs you need service sooner, and cost of annual professional service ($75-200).",
  },
  {
    title: "Is Garage Door Replacement Tax Deductible?",
    category: "Cost & Pricing",
    tags: "tax,deduction,energy-credit,home-improvement",
    prompt:
      "Write an article about tax implications of garage door replacement. Cover: general rule (home improvements are NOT tax deductible for primary residences), the major exception: energy-efficient improvements (insulated garage doors may qualify for the Energy Efficient Home Improvement Credit under IRS Section 25C - up to $500 for insulated doors meeting ENERGY STAR criteria), how to claim the credit (IRS Form 5695), requirements (must be ENERGY STAR certified, primary residence), rental property deductions (depreciation, repairs as business expense), home office considerations, and consulting a tax professional. Note: tax laws change, always verify current rules.",
  },
  {
    title: "Garage Door Repair Scams: How to Protect Yourself",
    category: "Safety & Industry",
    tags: "scams,fraud,consumer-protection,hiring",
    prompt:
      "Write an article exposing common garage door repair scams. Cover: the bait-and-switch (advertise $49 spring repair, upsell to $500+), the 'your door is dangerous' scam (claiming perfectly fine doors need immediate replacement), fake Google reviews and companies, price gouging during emergencies, unnecessary part replacement, the broken spring scare (claiming both springs need replacing when only one is worn), companies with no physical address, and how to protect yourself (get multiple quotes, check BBB, verify insurance/license, never pay full amount upfront, read the contract, check online reviews on multiple platforms, ask for the old parts back).",
  },
];

// --- AI Content Generation ---

async function generateContent(topic) {
  const systemPrompt = `You are an expert blog writer for a garage door repair directory website. Write informative, helpful, SEO-friendly blog content in HTML format. Use <h2>, <h3>, <p>, <ul>, <li>, <strong> tags. Do NOT include <h1> (the title is rendered separately). Write at 8th-grade reading level. Be specific with numbers, costs, and actionable advice. Content should be 800-1200 words. Do not include any introductory pleasantries or sign-offs.`;

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_GATEWAY_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.6",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Write an HTML blog article for the title: "${topic.title}"\n\nGuidance: ${topic.prompt}\n\nAlso generate:\n1. An excerpt (1-2 sentences, plain text, no HTML)\n2. A meta title (under 60 chars)\n3. A meta description (under 160 chars)\n\nFormat your response as:\n<EXCERPT>\nyour excerpt here\n</EXCERPT>\n<META_TITLE>\nyour meta title here\n</META_TITLE>\n<META_DESCRIPTION>\nyour meta description here\n</META_DESCRIPTION>\n<CONTENT>\nyour HTML content here\n</CONTENT>`,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content;

  const excerpt =
    text.match(/<EXCERPT>\s*([\s\S]*?)\s*<\/EXCERPT>/)?.[1]?.trim() ||
    topic.prompt.slice(0, 150);
  const metaTitle =
    text.match(/<META_TITLE>\s*([\s\S]*?)\s*<\/META_TITLE>/)?.[1]?.trim() ||
    topic.title;
  const metaDesc =
    text
      .match(/<META_DESCRIPTION>\s*([\s\S]*?)\s*<\/META_DESCRIPTION>/)?.[1]
      ?.trim() || excerpt.slice(0, 160);
  const content =
    text.match(/<CONTENT>\s*([\s\S]*?)\s*<\/CONTENT>/)?.[1]?.trim() || text;

  return { excerpt, metaTitle, metaDescription: metaDesc, content };
}

// --- Google Sheets Auth ---

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createJWT() {
  const crypto = require("crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: SERVICE_ACCOUNT_EMAIL,
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
    .replace(/=+$/, "");
  return `${signingInput}.${signature}`;
}

async function getAccessToken() {
  const jwt = await createJWT();
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  }).toString();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok)
    throw new Error(`Auth error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function appendRows(token, sheetName, rows) {
  const range = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: rows }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Append error: ${res.status} ${errText}`);
  }
  return res.json();
}

// --- Main ---

async function main() {
  console.log(
    `Generating ${BLOG_TOPICS.length} blog posts using AI Gateway...`
  );

  const allPosts = [];
  const errors = [];

  for (let i = 0; i < BLOG_TOPICS.length; i++) {
    const topic = BLOG_TOPICS[i];
    console.log(`\n[${i + 1}/${BLOG_TOPICS.length}] Generating: ${topic.title}`);

    try {
      const generated = await generateContent(topic);

      // Stagger published dates across the past month
      const daysAgo = Math.floor((BLOG_TOPICS.length - i) * 3);
      const pubDate = new Date(Date.now() - daysAgo * 86400000)
        .toISOString()
        .split("T")[0];

      allPosts.push({
        Title: topic.title,
        Slug: slugify(topic.title),
        Content: generated.content,
        Excerpt: generated.excerpt,
        Author: "Garage Door Repair Directory",
        "Image URL": "",
        Category: topic.category,
        Tags: topic.tags,
        City: "",
        State: "",
        "Published At": pubDate,
        "Meta Title": generated.metaTitle,
        "Meta Description": generated.metaDescription,
        Published: "TRUE",
      });

      console.log(`  OK (${generated.content.length} chars)`);

      if (i < BLOG_TOPICS.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      errors.push({ title: topic.title, error: err.message });
    }
  }

  console.log(`\nGenerated ${allPosts.length} of ${BLOG_TOPICS.length} blog posts.`);
  if (errors.length) {
    console.log(`Errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e.title}: ${e.error}`));
  }

  // Save to JSON
  const outDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "blog-posts-v3.json"),
    JSON.stringify(allPosts, null, 2)
  );
  console.log(`Saved to data/blog-posts-v3.json`);

  if (GENERATE_ONLY) {
    console.log("\n--generate-only mode. Skipping Google Sheets push.");
    return;
  }

  if (allPosts.length === 0) {
    console.log("No posts to push.");
    return;
  }

  console.log("\nAuthenticating with Google Sheets...");
  const token = await getAccessToken();
  console.log("Authenticated.");

  const rows = allPosts.map((p) => [
    p.Title,
    p.Slug,
    p.Content,
    p.Excerpt,
    p.Author,
    p["Image URL"],
    p.Category,
    p.Tags,
    p.City,
    p.State,
    p["Published At"],
    p["Meta Title"],
    p["Meta Description"],
    p.Published,
  ]);

  const BATCH_SIZE = 50;
  let pushed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    console.log(
      `Pushing rows ${i + 1}-${i + batch.length} of ${rows.length}...`
    );
    await appendRows(token, "Blog", batch);
    pushed += batch.length;
  }

  console.log(`\nDone! Pushed ${pushed} blog posts to Google Sheets "Blog" tab.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
