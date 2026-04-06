#!/usr/bin/env node
/**
 * Generate blog posts (batch 2) for the Garage Door Repair Directory.
 * Topics derived from AnswerThePublic "Garage door repair" report.
 *
 * Creates ~15 new blog posts that DON'T overlap with existing 18 posts.
 * Uses AI Gateway to generate quality HTML content for each article.
 *
 * Usage:
 *   node scripts/generate-blog-v2.js
 *   node scripts/generate-blog-v2.js --generate-only
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

// --- Blog Post Topics (from AnswerThePublic data) ---

const BLOG_TOPICS = [
  // Insurance (high search interest from PAA)
  {
    title: "Is Garage Door Damage Covered by Homeowners Insurance?",
    category: "Cost & Pricing",
    tags: "insurance,cost,homeowners,coverage,claims",
    prompt:
      "Write a comprehensive article about whether homeowners insurance covers garage door damage. Cover: what types of damage are typically covered (storm, vehicle, vandalism) vs not covered (wear and tear, maintenance), how to file a claim, deductibles vs repair cost, when it makes sense to file vs pay out of pocket, what to document, and tips for working with adjusters. Include specific cost examples.",
  },
  // Common problems (top PAA question)
  {
    title: "The 10 Most Common Garage Door Problems and How to Fix Them",
    category: "Tips & Maintenance",
    tags: "troubleshooting,common-problems,repair,diy,maintenance",
    prompt:
      "Write an article covering the 10 most common garage door problems homeowners face: 1) Door won't open/close, 2) Noisy operation, 3) Door reverses before closing, 4) Remote not working, 5) Door opens unevenly/crooked, 6) Door moves slowly, 7) Door falls too fast, 8) Gaps at bottom/sides, 9) Frozen door in winter, 10) Keypad not responding. For each, explain the cause, whether it's DIY-safe or needs a pro, and estimated fix cost.",
  },
  // Noisy garage door (specific PAA question)
  {
    title: "How to Fix a Noisy Garage Door: Causes and Solutions",
    category: "Tips & Maintenance",
    tags: "noise,maintenance,lubrication,rollers,diy",
    prompt:
      "Write a detailed guide on fixing a noisy garage door. Cover the different types of noises (grinding, squeaking, rattling, popping, banging) and what each means. Explain solutions: lubricating rollers/hinges/springs, replacing worn nylon rollers, tightening loose hardware, checking the opener drive mechanism, insulating with rubber pads. Include which fixes are DIY vs need a professional, and product recommendations (white lithium grease, silicone spray).",
  },
  // Garage door lifespan (PAA question)
  {
    title: "How Long Does a Garage Door Last? Average Lifespan Guide",
    category: "Buying Guides",
    tags: "lifespan,replacement,materials,durability",
    prompt:
      "Write an article about garage door lifespan. Cover: average lifespan by material (steel 20-30 years, wood 15-20, aluminum 20+, fiberglass 15-20, vinyl 20-30), factors that shorten lifespan (climate, maintenance, usage frequency), signs it's time to replace rather than repair, how to extend your door's life, and the cost-benefit of early replacement vs continued repairs. Include a comparison table of materials and their expected lifespans.",
  },
  // Installation cost (PAA question, 246K search volume topic)
  {
    title: "How Much Does It Cost to Install a New Garage Door in 2026?",
    category: "Cost & Pricing",
    tags: "installation,cost,new-door,pricing,budget",
    prompt:
      "Write a comprehensive cost guide for new garage door installation in 2026. Cover: average costs by door type (single $750-1500, double $1000-2500, custom $2000-5000+), material cost breakdowns (steel, wood, aluminum, composite), labor costs ($200-500), factors affecting price (insulation R-value, windows, hardware, smart features), regional price variations, tips for getting quotes, and whether to DIY install or hire a pro. Include financing options.",
  },
  // Cable repair (3.6K search volume)
  {
    title: "Garage Door Cable Repair: What You Need to Know",
    category: "Tips & Maintenance",
    tags: "cables,repair,safety,springs,professional",
    prompt:
      "Write a detailed article about garage door cable repair. Cover: what cables do and how they work with the spring system, signs of cable damage (fraying, slack, door hanging crooked), why cables break (wear, rust, spring failure), why you should NEVER attempt cable repair yourself (extreme tension danger), what to expect from a professional repair ($150-350), how long cables last, and preventive maintenance tips.",
  },
  // Panel replacement (1.3K search volume)
  {
    title: "Garage Door Panel Replacement: Cost, Process, and Options",
    category: "Cost & Pricing",
    tags: "panels,replacement,dents,damage,cost",
    prompt:
      "Write an article about garage door panel replacement. Cover: when to replace a panel vs the whole door, common panel damage (dents, cracks, rot, rust), cost of replacing individual panels ($250-800 per panel), the replacement process, challenges (matching colors/styles on older doors, discontinued panels), panel vs full door replacement cost comparison, and tips for preventing panel damage.",
  },
  // Garage door won't close (PAA question)
  {
    title: "Garage Door Won't Close? Here Are the Most Common Causes",
    category: "Tips & Maintenance",
    tags: "troubleshooting,won't-close,sensors,repair,diy",
    prompt:
      "Write a troubleshooting guide for when a garage door won't close. Cover the most common causes in order of likelihood: 1) Blocked or misaligned photo-eye sensors, 2) Something in the door's path, 3) Close-limit switch needs adjusting, 4) Broken springs or cables, 5) Track obstruction or misalignment, 6) Logic board failure, 7) Remote/wall button issues. For each, explain how to diagnose it, whether it's DIY-fixable, and what it costs to fix professionally.",
  },
  // Sensor issues (from AI model ideas)
  {
    title: "Garage Door Sensor Not Working? Complete Troubleshooting Guide",
    category: "Tips & Maintenance",
    tags: "sensors,photo-eye,safety,troubleshooting,diy",
    prompt:
      "Write a comprehensive troubleshooting guide for garage door sensor (photo-eye) problems. Cover: how sensors work (infrared beam), common issues (misalignment, dirty lenses, sun interference, wiring damage, LED indicators), step-by-step troubleshooting (clean, realign, check wiring, test with sun shade), when sensors need replacing vs adjusting, cost of sensor replacement ($50-100 DIY, $100-200 with labor), and safety regulations requiring sensors.",
  },
  // Garage door trends (PAA question)
  {
    title: "Garage Door Trends in 2026: Styles, Technology, and Materials",
    category: "Buying Guides",
    tags: "trends,2026,smart-home,design,modern",
    prompt:
      "Write an article about the latest garage door trends in 2026. Cover: popular styles (modern/contemporary flush panels, farmhouse carriage house, black garage doors, glass/aluminum full-view), technology trends (smart openers with WiFi/camera, battery backup, smartphone control, integration with Ring/Alexa/HomeKit), material innovations (composite overlays, insulated polyurethane, recycled steel), color trends (black, dark gray, wood-tone finishes), and energy efficiency improvements.",
  },
  // Opener lifespan (PAA question)
  {
    title: "How Long Do Garage Door Openers Last? Signs It's Time to Replace",
    category: "Buying Guides",
    tags: "opener,lifespan,replacement,maintenance",
    prompt:
      "Write a guide about garage door opener lifespan. Cover: average lifespan (10-15 years), factors that affect longevity (usage frequency, maintenance, door weight/balance, climate), drive type lifespan comparison (chain 10-15yr, belt 12-15yr, screw 10-12yr, direct/wall mount 15-20yr), signs it's dying vs just needs repair, the technology gap between old and new openers (safety features, smart home, battery backup, quiet operation), and when repair vs replacement makes sense financially.",
  },
  // Off track (common problem)
  {
    title: "How to Fix a Garage Door That's Off Track",
    category: "Safety & Industry",
    tags: "off-track,repair,safety,tracks,professional",
    prompt:
      "Write an article about garage doors going off track. Cover: what causes it (impact, broken cable, worn rollers, obstructed track, loose brackets), dangers of operating an off-track door, immediate safety steps (don't operate it, disconnect opener), why this is NOT a DIY repair (spring tension, door weight), what the professional repair process looks like, cost ($125-400), how long the repair takes, and prevention tips (regular roller and track inspection, keeping tracks clean).",
  },
  // Choosing a company (from AI content ideas)
  {
    title: "How to Choose the Right Garage Door Repair Company",
    category: "Safety & Industry",
    tags: "hiring,contractor,reviews,scams,tips",
    prompt:
      "Write a guide on choosing a garage door repair company. Cover: what to look for (licensing, insurance, BBB rating, online reviews, years in business), red flags (no physical address, won't give written estimate, pressure tactics, extremely low prices, cash-only), questions to ask before hiring, how to verify credentials, getting multiple quotes, understanding warranties, and how to avoid common scams in the garage door industry. Include a checklist of things to verify before hiring.",
  },
  // Garage door won't open (PAA question variant)
  {
    title: "Garage Door Won't Open All the Way? Here's What to Check",
    category: "Tips & Maintenance",
    tags: "troubleshooting,won't-open,repair,diy,professional",
    prompt:
      "Write a troubleshooting guide for when a garage door won't open fully. Cover causes: 1) Open-limit switch adjustment, 2) Broken or weakened springs, 3) Track obstruction or bent track, 4) Snapped cable, 5) Stripped opener gear, 6) Disconnect switch engaged, 7) Opener travel limits need reprogramming. For each, explain symptoms, diagnosis steps, DIY vs pro repair guidance, and expected costs. Also explain the difference between 'won't open at all' vs 'opens partially'.",
  },
  // Garage door opener repair kit (110K search volume on related terms)
  {
    title: "Garage Door Opener Repair: Common Fixes Before Replacing",
    category: "Cost & Pricing",
    tags: "opener,repair,cost,parts,troubleshooting",
    prompt:
      "Write an article about repairing (rather than replacing) a garage door opener. Cover the most common fixable issues: stripped drive gear ($20 part, $100-150 repair), logic board replacement ($100-200), capacitor replacement ($15-30 part), chain/belt adjustment, sensor realignment, remote reprogramming, and lubrication. For each, list the part cost, professional labor cost, and difficulty level for DIY. Include a decision tree: when to repair vs replace based on opener age and issue severity.",
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

  // Parse structured response
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

      // Stagger published dates across the past 2 months
      const daysAgo = Math.floor((BLOG_TOPICS.length - i) * 4);
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

      // Rate limit: wait 2s between API calls
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
    path.join(outDir, "blog-posts-v2.json"),
    JSON.stringify(allPosts, null, 2)
  );
  console.log(`Saved to data/blog-posts-v2.json`);

  if (GENERATE_ONLY) {
    console.log("\n--generate-only mode. Skipping Google Sheets push.");
    return;
  }

  if (allPosts.length === 0) {
    console.log("No posts to push.");
    return;
  }

  // Push to Google Sheets
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

  // Append in batches
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
