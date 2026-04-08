/**
 * Generates all content for DetailedToPerfection.com via AI Gateway
 * and pushes it to Google Sheets.
 *
 * Usage: node scripts/generate-content.mjs [reviews|guides|blog|all]
 */
import { readFileSync } from "fs";
import { createSign } from "crypto";

// --- Config ---
const AI_GATEWAY_URL = "https://ai-gateway.happycapy.ai/api/v1/chat/completions";
const AI_GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY;
const AI_MODEL = "anthropic/claude-sonnet-4.6";
const AMAZON_TAG = "dealsinyourar-20";
const CONCURRENCY = 2; // parallel AI calls

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

// --- Google Auth ---
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
    iat: now,
    exp: now + 3600,
  });
  const signingInput = `${base64url(header)}.${base64url(payload)}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(PRIVATE_KEY, "base64");
  return `${signingInput}.${signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

let cachedToken = null;
async function getToken() {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;
  const jwt = await createJWT();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth error: ${JSON.stringify(data)}`);
  cachedToken = { token: data.access_token, expires: Date.now() + 3500 * 1000 };
  return data.access_token;
}

// --- Sheet Writer ---
async function appendRows(sheetName, rows) {
  const token = await getToken();
  const range = encodeURIComponent(`${sheetName}!A2`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: rows }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Sheets append error: ${res.status} ${txt}`);
  }
  return res.json();
}

// --- AI Gateway ---
async function generateContent(systemPrompt, userPrompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${AI_GATEWAY_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 8000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        if (res.status === 429 && attempt < retries) {
          console.log(`  Rate limited, waiting ${(attempt + 1) * 15}s...`);
          await new Promise((r) => setTimeout(r, (attempt + 1) * 15000));
          continue;
        }
        throw new Error(`AI Gateway error: ${res.status} ${txt}`);
      }
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (err) {
      if (attempt < retries) {
        console.log(`  Retrying (${attempt + 1})...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw err;
    }
  }
}

// --- Slugify ---
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// --- Concurrency helper ---
async function processInBatches(items, fn, concurrency = CONCURRENCY) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await new Promise((r) => setTimeout(r, 2000)); // brief pause between batches
    }
  }
  return results;
}

// ===== CONTENT DEFINITIONS =====

const REVIEWS = [
  { title: "Best Ceramic Coating Sprays 2026", category: "Ceramic Coatings" },
  { title: "Best Professional Ceramic Coating Kits 2026", category: "Ceramic Coatings" },
  { title: "Best Graphene Ceramic Coatings 2026", category: "Ceramic Coatings" },
  { title: "Best DA Polishers Under $200", category: "Tools & Equipment" },
  { title: "Best Foam Cannons and Foam Guns 2026", category: "Tools & Equipment" },
  { title: "Best Pressure Washers for Car Detailing", category: "Tools & Equipment" },
  { title: "Best Detailing Brush Sets 2026", category: "Tools & Equipment" },
  { title: "Best Clay Bar Kits for Paint Decontamination", category: "Detailing Products" },
  { title: "Best Microfiber Towels for Detailing 2026", category: "Detailing Products" },
  { title: "Best Iron Removers and Fallout Removers 2026", category: "Detailing Products" },
  { title: "Best Interior Detailing Kits 2026", category: "Detailing Products" },
  { title: "Best Car Wash Soaps and Shampoos 2026", category: "Car Care Basics" },
  { title: "Best Tire Shine and Dressing Products 2026", category: "Car Care Basics" },
  { title: "Best Wheel Cleaners 2026", category: "Car Care Basics" },
  { title: "Best Paint Sealants for Long-Lasting Protection", category: "Paint Protection" },
  { title: "Best Paint Protection Film (PPF) Kits 2026", category: "Paint Protection" },
  { title: "Best Clear Bra Kits for DIY Installation", category: "Paint Protection" },
  { title: "Best Window Tint Films for Cars 2026", category: "Window Tinting" },
  { title: "Best Ceramic Window Tints 2026", category: "Window Tinting" },
  { title: "Best Polishing Compounds and Pads 2026", category: "Polishing & Correction" },
  { title: "Best Scratch Removers and Touch-Up Paints", category: "Polishing & Correction" },
  { title: "Best Swirl Removers 2026", category: "Polishing & Correction" },
  { title: "Best Vinyl Wrap Tool Kits 2026", category: "Vehicle Wraps" },
  { title: "Best Vinyl Wrap Films for Color Change", category: "Vehicle Wraps" },
  { title: "Best Leather Cleaners and Conditioners 2026", category: "Detailing Products" },
];

const GUIDES = [
  { title: "How to Clay Bar Your Car: Complete Guide", category: "Car Care Basics" },
  { title: "Paint Correction 101: A Beginner's Guide", category: "Polishing & Correction" },
  { title: "Ceramic Coating vs PPF: Which Is Right for You?", category: "Ceramic Coatings" },
  { title: "How to Apply Ceramic Coating at Home", category: "Ceramic Coatings" },
  { title: "How to Maintain Your Ceramic Coating", category: "Ceramic Coatings" },
  { title: "Window Tinting Laws by State: 2026 Guide", category: "Window Tinting" },
  { title: "How to Choose the Right Window Tint Shade", category: "Window Tinting" },
  { title: "How to Polish Your Car Like a Pro", category: "Polishing & Correction" },
  { title: "How to Remove Swirl Marks from Car Paint", category: "Polishing & Correction" },
  { title: "The Complete Car Wash Guide: Two-Bucket Method", category: "Car Care Basics" },
  { title: "How to Remove Water Spots from Car Paint", category: "Car Care Basics" },
  { title: "Headlight Restoration: Step-by-Step Guide", category: "Car Care Basics" },
  { title: "Interior Detailing: Complete Step-by-Step Guide", category: "Detailing Products" },
  { title: "Engine Bay Detailing: Safe Cleaning Methods", category: "Detailing Products" },
  { title: "Understanding Paint Protection Film: Complete Guide", category: "Paint Protection" },
  { title: "Vinyl Wrap vs Paint: Pros, Cons, and Costs", category: "Vehicle Wraps" },
  { title: "How to Use a Foam Cannon Properly", category: "Tools & Equipment" },
  { title: "How to Use a DA Polisher for Beginners", category: "Tools & Equipment" },
  { title: "Paint Decontamination: Iron, Tar, and Overspray Removal", category: "Detailing Products" },
  { title: "How to Protect Your Car from Sun Damage", category: "Paint Protection" },
  { title: "Convertible Top Care and Cleaning Guide", category: "Car Care Basics" },
  { title: "How to Detail a Black Car Without Swirl Marks", category: "Polishing & Correction" },
  { title: "Ceramic Coating Maintenance Schedule", category: "Ceramic Coatings" },
  { title: "How to Remove Tree Sap and Bird Droppings Safely", category: "Car Care Basics" },
  { title: "PPF Installation: What to Expect from a Professional", category: "Paint Protection" },
];

const BLOG_POSTS = [
  { title: "Is Graphene Coating Worth It in 2026?", category: "Ceramic Coatings", tags: "graphene,ceramic coating,technology" },
  { title: "Florida Window Tint Laws: What You Need to Know in 2026", category: "Window Tinting", tags: "florida,tint laws,legal" },
  { title: "5 Detailing Mistakes That Ruin Your Paint", category: "Car Care Basics", tags: "mistakes,paint care,tips" },
  { title: "DIY vs Professional Ceramic Coating: An Honest Comparison", category: "Ceramic Coatings", tags: "diy,professional,ceramic coating" },
  { title: "How Often Should You Detail Your Car?", category: "Car Care Basics", tags: "maintenance,schedule,tips" },
  { title: "The Rise of Mobile Detailing Services in 2026", category: "Detailing Products", tags: "mobile detailing,trends,business" },
  { title: "PPF vs Ceramic Coating vs Vinyl Wrap: Complete Comparison", category: "Paint Protection", tags: "ppf,ceramic coating,vinyl wrap,comparison" },
  { title: "Best Time of Year to Get Your Car Detailed", category: "Car Care Basics", tags: "seasonal,timing,tips" },
  { title: "Electric Vehicle Detailing: What's Different?", category: "Car Care Basics", tags: "electric vehicles,ev,tesla,detailing" },
  { title: "Why Professional Detailing Is Worth the Investment", category: "Detailing Products", tags: "professional,value,investment" },
  { title: "How to Start a Car Detailing Business in 2026", category: "Tools & Equipment", tags: "business,startup,entrepreneurship" },
  { title: "The Truth About Touchless Car Washes", category: "Car Care Basics", tags: "car wash,touchless,automatic" },
  { title: "Ceramic Coating Myths Debunked", category: "Ceramic Coatings", tags: "myths,facts,ceramic coating" },
  { title: "What Is Paint Correction and Do You Need It?", category: "Polishing & Correction", tags: "paint correction,polish,swirl marks" },
  { title: "Top Detailing Trends to Watch in 2026", category: "Detailing Products", tags: "trends,industry,2026" },
  { title: "How to Protect Your Car During Florida Summers", category: "Paint Protection", tags: "florida,summer,heat,protection" },
  { title: "The Environmental Impact of Car Detailing Products", category: "Car Care Basics", tags: "environment,eco-friendly,green" },
  { title: "Understanding Ceramic Coating Hardness Ratings (9H Explained)", category: "Ceramic Coatings", tags: "9h,hardness,ceramic coating,science" },
  { title: "Should You Tip Your Detailer? Etiquette Guide", category: "Car Care Basics", tags: "tipping,etiquette,professional" },
  { title: "Matte Paint and Wrap Care: Special Considerations", category: "Vehicle Wraps", tags: "matte,wrap care,special finishes" },
];

// ===== GENERATION FUNCTIONS =====

const REVIEW_SYSTEM_PROMPT = `You are an expert automotive detailing product reviewer writing for DetailedToPerfection.com, a trusted product review and education site.

Write product review roundup articles. Each review covers 5-6 real, popular products in the category.

Output format (strictly follow this):
---CONTENT---
<article HTML content here - use h2, h3, p, ul/li tags. Include intro, why trust us section, how we tested, individual product sections, buying guide, FAQ, and verdict. Write 1500-2000 words. DO NOT include product cards or Amazon links in the HTML - those come from the Products JSON.>
---PRODUCTS---
<valid JSON array of 5-6 products, each with: name (string), price (string like "$29.99"), rating (number 1-5, use decimals like 4.7), amazonUrl (string - use format https://www.amazon.com/s?k=PRODUCT+NAME+KEYWORDS&tag=${AMAZON_TAG}), pros (array of 3-4 strings), cons (array of 2-3 strings), verdict (string, 1 sentence)>
---META_TITLE---
<SEO title, 50-60 chars>
---META_DESC---
<SEO description, 150-160 chars>

Use REAL product names from major brands (Chemical Guys, Meguiar's, Adam's Polishes, Griot's Garage, CarPro, Gtechniq, Koch Chemie, XPEL, 3M, Rupes, etc). Make ratings realistic (not all 5.0). Include genuine pros/cons.`;

const GUIDE_SYSTEM_PROMPT = `You are an expert automotive detailing educator writing for DetailedToPerfection.com.

Write comprehensive educational guides. These are informational how-to articles, NOT product reviews.

Output format:
---CONTENT---
<article HTML content - use h2, h3, p, ul/li, ol/li tags. Include step-by-step instructions where applicable, tips, common mistakes, and pro tips. Write 1500-2000 words. Include a "Find a Professional" note mentioning that readers can find qualified detailers at OrlandoDetailer.com.>
---META_TITLE---
<SEO title, 50-60 chars>
---META_DESC---
<SEO description, 150-160 chars>`;

const BLOG_SYSTEM_PROMPT = `You are a knowledgeable automotive detailing writer for DetailedToPerfection.com blog.

Write engaging, informative blog posts about detailing trends, tips, and industry insights.

Output format:
---CONTENT---
<blog post HTML content - use h2, h3, p, ul/li tags. Write 1000-1500 words. Conversational but authoritative tone. Include data points and specific examples where possible.>
---EXCERPT---
<2-3 sentence excerpt/summary for the blog index page>
---META_TITLE---
<SEO title, 50-60 chars>
---META_DESC---
<SEO description, 150-160 chars>`;

function parseReviewResponse(text) {
  const content = text.match(/---CONTENT---\s*([\s\S]*?)---PRODUCTS---/)?.[1]?.trim() || "";
  const productsRaw = text.match(/---PRODUCTS---\s*([\s\S]*?)---META_TITLE---/)?.[1]?.trim() || "[]";
  const metaTitle = text.match(/---META_TITLE---\s*([\s\S]*?)---META_DESC---/)?.[1]?.trim() || "";
  const metaDesc = text.match(/---META_DESC---\s*([\s\S]*?)$/)?.[1]?.trim() || "";

  let products = [];
  try {
    products = JSON.parse(productsRaw);
  } catch {
    // Try to extract JSON array
    const jsonMatch = productsRaw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try { products = JSON.parse(jsonMatch[0]); } catch { /* skip */ }
    }
  }

  return { content, products, metaTitle, metaDesc };
}

function parseGuideResponse(text) {
  const content = text.match(/---CONTENT---\s*([\s\S]*?)---META_TITLE---/)?.[1]?.trim() || "";
  const metaTitle = text.match(/---META_TITLE---\s*([\s\S]*?)---META_DESC---/)?.[1]?.trim() || "";
  const metaDesc = text.match(/---META_DESC---\s*([\s\S]*?)$/)?.[1]?.trim() || "";
  return { content, metaTitle, metaDesc };
}

function parseBlogResponse(text) {
  const content = text.match(/---CONTENT---\s*([\s\S]*?)---EXCERPT---/)?.[1]?.trim() || "";
  const excerpt = text.match(/---EXCERPT---\s*([\s\S]*?)---META_TITLE---/)?.[1]?.trim() || "";
  const metaTitle = text.match(/---META_TITLE---\s*([\s\S]*?)---META_DESC---/)?.[1]?.trim() || "";
  const metaDesc = text.match(/---META_DESC---\s*([\s\S]*?)$/)?.[1]?.trim() || "";
  return { content, excerpt, metaTitle, metaDesc };
}

// ===== MAIN =====
const mode = process.argv[2] || "all";
const today = new Date().toISOString().split("T")[0];

async function generateReviews() {
  console.log(`\n=== Generating ${REVIEWS.length} Reviews ===\n`);
  const rows = [];

  await processInBatches(REVIEWS, async (review, idx) => {
    const i = REVIEWS.indexOf(review);
    console.log(`[${i + 1}/${REVIEWS.length}] ${review.title}...`);
    const raw = await generateContent(
      REVIEW_SYSTEM_PROMPT,
      `Write a comprehensive product review roundup article: "${review.title}"\nCategory: ${review.category}\nInclude 5-6 real products from well-known brands.`
    );
    const parsed = parseReviewResponse(raw);
    const slug = slugify(review.title);
    rows.push([
      review.title,
      slug,
      parsed.content,
      review.category,
      JSON.stringify(parsed.products),
      parsed.metaTitle,
      parsed.metaDesc,
      today,
      "TRUE",
    ]);
    console.log(`  Done: ${slug} (${parsed.products.length} products)`);
  });

  if (rows.length > 0) {
    console.log(`\nPushing ${rows.length} reviews to Google Sheets...`);
    await appendRows("Reviews", rows);
    console.log("Reviews pushed successfully!");
  }
}

async function generateGuides() {
  console.log(`\n=== Generating ${GUIDES.length} Guides ===\n`);
  const rows = [];

  await processInBatches(GUIDES, async (guide) => {
    const i = GUIDES.indexOf(guide);
    console.log(`[${i + 1}/${GUIDES.length}] ${guide.title}...`);
    const raw = await generateContent(
      GUIDE_SYSTEM_PROMPT,
      `Write a comprehensive educational guide: "${guide.title}"\nCategory: ${guide.category}`
    );
    const parsed = parseGuideResponse(raw);
    const slug = slugify(guide.title);
    rows.push([
      guide.title,
      slug,
      parsed.content,
      guide.category,
      parsed.metaTitle,
      parsed.metaDesc,
      today,
      "TRUE",
    ]);
    console.log(`  Done: ${slug}`);
  });

  if (rows.length > 0) {
    console.log(`\nPushing ${rows.length} guides to Google Sheets...`);
    await appendRows("Guides", rows);
    console.log("Guides pushed successfully!");
  }
}

async function generateBlogPosts() {
  console.log(`\n=== Generating ${BLOG_POSTS.length} Blog Posts ===\n`);
  const rows = [];

  await processInBatches(BLOG_POSTS, async (post) => {
    const i = BLOG_POSTS.indexOf(post);
    console.log(`[${i + 1}/${BLOG_POSTS.length}] ${post.title}...`);
    const raw = await generateContent(
      BLOG_SYSTEM_PROMPT,
      `Write an engaging blog post: "${post.title}"\nCategory: ${post.category}`
    );
    const parsed = parseBlogResponse(raw);
    const slug = slugify(post.title);
    rows.push([
      post.title,
      slug,
      parsed.content,
      parsed.excerpt,
      "", // Image URL (empty for now)
      post.category,
      post.tags || "",
      today,
      parsed.metaTitle,
      parsed.metaDesc,
      "TRUE",
    ]);
    console.log(`  Done: ${slug}`);
  });

  if (rows.length > 0) {
    console.log(`\nPushing ${rows.length} blog posts to Google Sheets...`);
    await appendRows("Blog", rows);
    console.log("Blog posts pushed successfully!");
  }
}

async function main() {
  console.log("DetailedToPerfection Content Generator");
  console.log(`Mode: ${mode} | Sheet: ${SPREADSHEET_ID}`);
  console.log(`AI Model: ${AI_MODEL} | Concurrency: ${CONCURRENCY}`);
  console.log("---");

  if (mode === "all" || mode === "reviews") await generateReviews();
  if (mode === "all" || mode === "guides") await generateGuides();
  if (mode === "all" || mode === "blog") await generateBlogPosts();

  console.log("\n=== All done! ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
