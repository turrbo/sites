#!/usr/bin/env node
/**
 * Generate blog posts with AI-generated header images for Orlando Detailer.
 *
 * Generates 20 blog posts across auto detailing, window tinting, and vehicle wrap topics.
 * Each post gets a header image generated via AI image generation.
 * Results are pushed to the "Blog" tab in Google Sheets.
 *
 * Usage:
 *   node scripts/generate-blog.js
 *   node scripts/generate-blog.js --dry-run
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

const AI_GATEWAY_URL =
  "https://ai-gateway.happycapy.ai/api/v1/chat/completions";
const AI_IMAGE_URL =
  "https://ai-gateway.happycapy.ai/api/v1/images/generations";
const AI_GATEWAY_KEY =
  process.env.AI_GATEWAY_API_KEY || env.AI_GATEWAY_API_KEY || "";

const MODEL = "anthropic/claude-haiku-4.5";
const IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";
const DRY_RUN = process.argv.includes("--dry-run");

const BLOG_TAB = "Blog";
const BLOG_HEADERS = [
  "Title",
  "Slug",
  "Content",
  "Excerpt",
  "Author",
  "Image URL",
  "Category",
  "Tags",
  "City",
  "State",
  "Published At",
  "Meta Title",
  "Meta Description",
  "Published",
];

// ─── Blog post topics ─────────────────────────────────────────────────
const BLOG_TOPICS = [
  {
    title: "How Often Should You Detail Your Car in Florida?",
    slug: "how-often-detail-car-florida",
    category: "Auto Detailing",
    tags: "car care, detailing frequency, Florida climate",
    imagePrompt:
      "A freshly detailed black luxury car gleaming in bright Florida sunshine, parked near palm trees with a clear blue sky. Professional auto detailing result, water beading on hood. Photorealistic.",
    prompt:
      "Write a 1200-word blog post about how often car owners in Florida should get their vehicles detailed. Cover: Florida-specific factors (UV intensity, humidity, salt air near coasts, pollen, love bugs, frequent rain), recommended schedules for different use cases (daily commuter, garaged weekend car, outdoor-parked), seasonal considerations, signs your car needs detailing, quick maintenance tips between details. Practical and conversational tone. Format as HTML with h2/h3 headings.",
  },
  {
    title: "Ceramic Coating vs Wax: Which Is Better for Florida Cars?",
    slug: "ceramic-coating-vs-wax-florida",
    category: "Auto Detailing",
    tags: "ceramic coating, wax, paint protection, comparison",
    imagePrompt:
      "Split image showing car wax application on the left side and ceramic coating application on the right side of a car hood. Professional detailing studio lighting. Clean, editorial style photo.",
    prompt:
      "Write a 1200-word blog comparing ceramic coating and traditional wax for cars in Florida. Cover: what each product is, how they work, durability (wax 1-3 months vs ceramic 2-5 years), cost comparison, UV protection differences, hydrophobic properties, ease of maintenance, which is better for Florida's climate. Include pros/cons for each. Honest and helpful tone. Format as HTML.",
  },
  {
    title: "Florida Window Tint Laws: Everything You Need to Know",
    slug: "florida-window-tint-laws-complete-guide",
    category: "Window Tinting",
    tags: "window tint, Florida law, VLT, legal limits",
    imagePrompt:
      "Close-up of a car window with professional window tint film being measured with a VLT meter by a professional installer. Clean automotive workshop setting. Photorealistic.",
    prompt:
      "Write a 1200-word comprehensive guide to Florida window tinting laws. Cover: VLT percentages by window (windshield AS-1 line, front side 28%+, rear side any, back window any), reflectivity rules (25% max), allowed colors, medical exemptions (DHSMV form), penalties ($116 fine, fix-it ticket), how to check your tint with a meter, common myths debunked, what happens during a traffic stop. Authoritative but accessible tone. Format as HTML with tables.",
  },
  {
    title: "The Complete Guide to Paint Protection Film (PPF)",
    slug: "complete-guide-paint-protection-film-ppf",
    category: "Auto Detailing",
    tags: "PPF, paint protection, clear bra, rock chips",
    imagePrompt:
      "Professional installer carefully applying clear paint protection film (PPF) to the front bumper of a white luxury sports car in a clean detailing studio. Bright lighting. Photorealistic.",
    prompt:
      "Write a 1200-word guide about Paint Protection Film (PPF) for Florida car owners. Cover: what PPF is, how it works (self-healing, impact absorption), coverage options (full front, full body, partial), top brands (XPEL, 3M, SunTek), longevity (7-10 years), cost ranges, maintenance, why it matters in Florida (highway rock chips on I-4/turnpike, UV exposure), PPF + ceramic coating combo. Format as HTML.",
  },
  {
    title: "5 Signs Your Car Needs Professional Detailing",
    slug: "signs-car-needs-professional-detailing",
    category: "Auto Detailing",
    tags: "car care, detailing tips, maintenance",
    imagePrompt:
      "Before and after comparison of a neglected car being professionally detailed. Left side shows faded, dirty paint. Right side shows glossy, clean result. Photorealistic automotive photography.",
    prompt:
      "Write a 1000-word blog about the telltale signs your car needs professional detailing. Cover: 1) Faded/oxidized paint from sun, 2) Water spots that won't wash off, 3) Interior odors/stains, 4) Swirl marks visible in sunlight, 5) Bug/tar/sap buildup. For each sign, explain what causes it, why DIY isn't enough, and what a detailer will do. Florida-specific examples. Format as HTML.",
  },
  {
    title: "Vehicle Wraps: A Complete Cost Breakdown for Orlando",
    slug: "vehicle-wraps-cost-breakdown-orlando",
    category: "Vehicle Wraps",
    tags: "vehicle wraps, cost, vinyl wrap, Orlando",
    city: "Orlando",
    imagePrompt:
      "A matte black vinyl-wrapped sports car parked in front of a modern Orlando storefront, reflecting city lights. Sleek and premium look. Photorealistic automotive photography.",
    prompt:
      "Write a 1200-word cost breakdown for vehicle wraps in the Orlando area. Cover: full wrap ($2500-6000), partial wrap ($500-2000), color change ($3000-5000), chrome delete ($500-1500), commercial wraps ($1500-3500), factors affecting price (vehicle size, vinyl quality cast vs calendered, design complexity, paint condition), how long wraps last (5-7 years), maintenance tips, what to ask the shop before committing. Format as HTML with a price table.",
  },
  {
    title: "Why Ceramic Window Tint Is Worth the Extra Cost",
    slug: "why-ceramic-window-tint-worth-cost",
    category: "Window Tinting",
    tags: "ceramic tint, window film, heat rejection",
    imagePrompt:
      "Interior view of a car with ceramic window tint showing the sun outside but cool, comfortable cabin. Infrared heat being blocked visualization concept. Clean modern car interior. Photorealistic.",
    prompt:
      "Write a 1000-word blog making the case for ceramic window tint over cheaper alternatives. Cover: types of tint (dyed, metallic, carbon, ceramic), how ceramic tint works (nano-ceramic particles), heat rejection comparison (ceramic 50-80% IR rejection vs dyed 5-15%), UV blocking (99%), no signal interference (unlike metallic), color stability over time, price comparison ($250-400 ceramic vs $100-200 dyed for full car), why it pays for itself in Florida AC savings. Format as HTML.",
  },
  {
    title: "How to Choose an Auto Detailing Shop: Red Flags to Watch For",
    slug: "choose-auto-detailing-shop-red-flags",
    category: "Auto Detailing",
    tags: "choosing a detailer, tips, consumer guide",
    imagePrompt:
      "Clean professional auto detailing garage with organized tools, good lighting, and a car being detailed by a uniformed professional. Premium workspace. Photorealistic.",
    prompt:
      "Write a 1000-word consumer guide on choosing an auto detailing shop. Cover: green flags (certifications like IDA, clean facility, clear pricing, portfolio/reviews, quality products), red flags (no pricing transparency, unrealistic promises, no before/after photos, pushy upselling, working outdoors in dirt), questions to ask before booking, what to expect during a detail, how to evaluate results. Practical and honest tone. Format as HTML.",
  },
  {
    title: "Mobile Detailing vs Shop Detailing: Pros and Cons",
    slug: "mobile-detailing-vs-shop-pros-cons",
    category: "Auto Detailing",
    tags: "mobile detailing, comparison, convenience",
    imagePrompt:
      "Split scene: left side shows a mobile detailing van setup in a residential driveway, right side shows a professional detailing bay in a shop. Both clean and professional. Photorealistic.",
    prompt:
      "Write a 1000-word comparison of mobile detailing versus shop-based detailing. Cover: convenience factor, quality differences, equipment limitations (mobile water supply, power), pricing comparison, services available (mobile can't do paint correction as well, limited ceramic coating), Florida considerations (heat makes outdoor work harder, water restrictions in some HOAs), when to choose each option. Balanced and helpful. Format as HTML with a comparison table.",
  },
  {
    title: "The Business Owner's Guide to Fleet Vehicle Wraps",
    slug: "business-owners-guide-fleet-vehicle-wraps",
    category: "Vehicle Wraps",
    tags: "fleet wraps, business marketing, ROI",
    imagePrompt:
      "A fleet of three white commercial vans with professional branded vehicle wraps parked in a row, showing company branding and contact information. Clean parking lot, bright day. Photorealistic.",
    prompt:
      "Write a 1200-word guide for Orlando business owners considering fleet wraps. Cover: marketing ROI (30,000-70,000 daily impressions per vehicle, $0.04 per 1000 impressions vs $3-5 for billboards), design best practices (high contrast, large phone number, simple message), fleet wrap pricing at volume ($1500-3500 per vehicle), turnaround time, wrap vs paint vs magnets, tax deductions (advertising expense), maintaining wrapped vehicles, case for consistent branding across fleet. Format as HTML.",
  },
  {
    title: "Interior Detailing: Deep Cleaning Your Car's Cabin",
    slug: "interior-detailing-deep-cleaning-car-cabin",
    category: "Auto Detailing",
    tags: "interior detailing, cleaning, car cabin, upholstery",
    imagePrompt:
      "Professional auto detailer steam cleaning a luxury car leather interior. Close-up showing the cleaning process with steam extraction. Clean, well-lit detailing studio. Photorealistic.",
    prompt:
      "Write a 1000-word guide about professional interior detailing. Cover: what's included (vacuum, steam clean, leather conditioning, dashboard treatment, glass, air vents, door jambs), common interior problems in Florida (mold/mildew from humidity, sunscreen stains, sand/beach residue), leather vs cloth vs vinyl care differences, odor elimination techniques, how often to do it, DIY vs professional, expected pricing ($100-300). Format as HTML.",
  },
  {
    title: "Paint Correction 101: Removing Swirl Marks and Scratches",
    slug: "paint-correction-removing-swirl-marks-scratches",
    category: "Auto Detailing",
    tags: "paint correction, swirl marks, polishing, compound",
    imagePrompt:
      "Close-up of a professional detailer using a dual-action polisher on a dark blue car panel, with bright LED inspection light showing swirl mark removal. Dramatic lighting. Photorealistic.",
    prompt:
      "Write a 1200-word guide about paint correction for car owners. Cover: what paint correction is (leveling clear coat with abrasives), stages (1-step polish, 2-step compound+polish, 3-step heavy cut), common defects (swirl marks from automatic washes, water spots, oxidation, light scratches), the process (wash, clay bar, compound, polish, protect), realistic expectations (can't fix deep scratches to primer), pricing ($300-800+), why paint correction should come before ceramic coating. Format as HTML.",
  },
  {
    title: "Protecting Your Car from Florida's Sun: A Complete Guide",
    slug: "protecting-car-florida-sun-complete-guide",
    category: "Auto Detailing",
    tags: "UV protection, Florida sun, paint care, sun damage",
    imagePrompt:
      "A car parked under the intense Florida sun with visible heat waves, palm trees in background. Golden hour lighting showing UV intensity. The car has a glossy protected finish. Photorealistic.",
    prompt:
      "Write a 1200-word guide about protecting your car from Florida's intense UV and sun damage. Cover: how the sun damages paint (UV oxidation, clear coat failure, color fading), interior damage (dashboard cracking, leather fading, steering wheel deterioration), protection strategies ranked by effectiveness (garage > car cover > ceramic coating > PPF > wax > nothing), window tint for interior protection, dashboard protectant, the cost of NOT protecting (respray $3000-5000 vs ceramic $500-1500), seasonal considerations. Format as HTML.",
  },
  {
    title: "What Is a Ceramic Coating and How Does It Work?",
    slug: "what-is-ceramic-coating-how-does-it-work",
    category: "Auto Detailing",
    tags: "ceramic coating, SiO2, paint protection, explained",
    imagePrompt:
      "Extreme close-up of water beading on a ceramic-coated car surface, showing perfect hydrophobic effect with dozens of water droplets. Dark metallic paint underneath. Macro photography style. Photorealistic.",
    prompt:
      "Write a 1000-word explainer about ceramic coatings for car owners who know nothing about them. Cover: what it is (liquid polymer with SiO2/silicon dioxide), how it bonds to paint at a molecular level, what it does (hydrophobic, UV protection, chemical resistance, easier cleaning), what it does NOT do (not scratch-proof, not a replacement for PPF), application process (decontamination, correction, coating, curing), maintenance requirements, tiers (consumer spray vs professional multi-layer), lifespan. Keep it simple and jargon-free. Format as HTML.",
  },
  {
    title: "Window Tint Film Types Explained: Dyed, Carbon, Ceramic & More",
    slug: "window-tint-film-types-explained",
    category: "Window Tinting",
    tags: "tint types, ceramic, carbon, dyed, metallic film",
    imagePrompt:
      "Side-by-side display of four different window tint film samples in different shades, with labels showing each type. Professional product display on a clean white surface. Photorealistic.",
    prompt:
      "Write a 1000-word guide comparing window tint film types. Cover each type: dyed (cheapest, fades, low heat rejection), metallic (good heat rejection, signal interference, shiny look), carbon (no signal issues, good heat rejection, matte look), ceramic (best heat rejection, no interference, most expensive, color-stable). Include: price ranges for each, lifespan comparison, which is best for Florida, brand recommendations (3M, XPEL, SunTek, Llumar), warranty differences. Format as HTML with comparison table.",
  },
  {
    title: "Color Change Wraps: Transform Your Car Without Paint",
    slug: "color-change-wraps-transform-car-without-paint",
    category: "Vehicle Wraps",
    tags: "color change, vinyl wrap, car customization",
    imagePrompt:
      "A stunning matte purple vinyl-wrapped sports car next to its original white color version in a wrap shop. Dramatic reveal lighting. Professional automotive photography. Photorealistic.",
    prompt:
      "Write a 1000-word blog about color change vehicle wraps. Cover: how it works (full vinyl wrap over existing paint), popular colors/finishes (matte, gloss, satin, metallic, chrome, color-shift), benefits over paint (reversible, protects original paint, faster, cheaper than quality paint job), the process (design, print/order, surface prep, application, post-heat, trim), care and maintenance, how long it lasts (5-7 years), removal process, resale value considerations. Format as HTML.",
  },
  {
    title: "Love Bug Season in Florida: How to Protect Your Car",
    slug: "love-bug-season-florida-protect-car",
    category: "Auto Detailing",
    tags: "love bugs, Florida, paint damage, seasonal care",
    imagePrompt:
      "Front bumper and hood of a car covered in love bug splatter on a Florida highway, with the Sunshine State road in the background. Realistic and relatable. Photorealistic.",
    prompt:
      "Write a 1000-word seasonal blog about love bug season in Florida (May and September). Cover: why love bugs are a problem for cars (acidic body chemistry damages paint within 24-48 hours), prevention strategies (wax, ceramic coating, PPF, bug deflectors), removal techniques (soaking, bug remover products, dryer sheets trick), what NOT to do (don't scrub dry, don't use harsh chemicals), why professional detailing after love bug season is a good idea, how different protection levels handle love bugs. Fun and practical tone. Format as HTML.",
  },
  {
    title: "Is PPF Worth It? A Honest Cost-Benefit Analysis",
    slug: "is-ppf-worth-it-cost-benefit-analysis",
    category: "Auto Detailing",
    tags: "PPF, paint protection film, cost analysis, worth it",
    imagePrompt:
      "Close-up of paint protection film on a car hood with a small rock chip impact that the PPF absorbed, showing the self-healing property. Professional lighting. Photorealistic.",
    prompt:
      "Write a 1200-word honest analysis of whether PPF is worth the investment. Cover: costs (partial front $1000-1800, full front $1500-2500, full body $5000-8000), what you're protecting against (rock chips, scratches, bug damage, UV), scenarios where PPF makes sense (new car, high-value vehicle, highway commuter, Florida rock chip zones on I-4 and turnpike), scenarios where it doesn't (beater car, mostly garaged), math comparison (PPF cost vs touch-up paint vs respray over ownership period), self-healing feature, when to combine with ceramic coating. Be honest, not salesy. Format as HTML.",
  },
  {
    title: "How to Maintain Your Ceramic Coating: Do's and Don'ts",
    slug: "maintain-ceramic-coating-dos-donts",
    category: "Auto Detailing",
    tags: "ceramic coating, maintenance, car wash, care tips",
    imagePrompt:
      "Person hand-washing a ceramic-coated car with a foam cannon and microfiber mitt, water sheeting off the surface. Sunny driveway setting. Clean and aspirational. Photorealistic.",
    prompt:
      "Write a 1000-word maintenance guide for ceramic-coated cars. Cover: DO's (hand wash with pH-neutral soap, use SiO2 spray as booster, dry with clean microfiber, wash in shade, regular maintenance washes), DON'Ts (automatic car washes with brushes, dish soap, waxing over coating, letting contaminants sit, pressure washing too close), washing schedule (every 1-2 weeks), annual maintenance detail recommendation, signs your coating needs professional attention, topper/booster products. Format as HTML.",
  },
  {
    title: "Commercial Vehicle Lettering vs Full Wraps: What's Right for Your Business?",
    slug: "commercial-vehicle-lettering-vs-full-wraps",
    category: "Vehicle Wraps",
    tags: "commercial wraps, lettering, business vehicles, branding",
    imagePrompt:
      "Side-by-side comparison: a white work van with simple vinyl lettering on the left, and a fully wrapped colorful branded van on the right. Professional business setting. Photorealistic.",
    prompt:
      "Write a 1000-word comparison for business owners choosing between vehicle lettering and full wraps. Cover: lettering (cost $200-800, quick install, professional look, easy to update), partial wraps ($500-2000, more visual impact, mid-range cost), full wraps ($2500-5000, maximum impact, complete brand transformation), factors to consider (budget, number of vehicles, brand complexity, how often branding changes, vehicle condition), ROI comparison, which industries benefit from which option, Orlando-specific advice. Format as HTML with comparison table.",
  },
];

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

// ─── Google Sheets helpers ────────────────────────────────────────────

async function ensureHeaders(token) {
  const range = encodeURIComponent(`${BLOG_TAB}!A1:N1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const existing = data.values?.[0] || [];
  if (existing.length === 0) {
    console.log("  Setting up Blog headers...");
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [BLOG_HEADERS] }),
      }
    );
  }
}

async function getExistingSlugs(token) {
  const range = encodeURIComponent(`${BLOG_TAB}!B:B`);
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
  const slugs = new Set(rows.slice(1).map((r) => r[0]).filter(Boolean));
  console.log(`  Found ${slugs.size} existing blog posts in sheet.`);
  return slugs;
}

async function appendRows(token, rows) {
  if (rows.length === 0) return;
  const range = encodeURIComponent(BLOG_TAB);
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
    throw new Error(`Sheets append failed: ${data.error.message}`);
  }
  return data;
}

// ─── AI: Generate article content ─────────────────────────────────────

const SYSTEM_PROMPT =
  "You are an expert automotive content writer specializing in auto detailing, window tinting, and vehicle wraps in Florida. Write engaging, informative blog posts that help car owners make smart decisions. Use a conversational but knowledgeable tone. Never mention specific business names. Use HTML formatting.";

async function generateContent(topic) {
  const userPrompt = `${topic.prompt}

Also generate:
1. An excerpt (1-2 sentences summarizing the post, plain text, max 200 chars)
2. A meta title (max 60 characters, plain text)
3. A meta description (max 155 characters, plain text)

Format your response exactly as:
<EXCERPT>
your excerpt here
</EXCERPT>
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

  const excerpt =
    text.match(/<EXCERPT>\s*([\s\S]*?)\s*<\/EXCERPT>/)?.[1]?.trim() ||
    topic.title;

  const metaTitle =
    text.match(/<META_TITLE>\s*([\s\S]*?)\s*<\/META_TITLE>/)?.[1]?.trim() ||
    topic.title.slice(0, 60);

  const metaDesc =
    text
      .match(/<META_DESCRIPTION>\s*([\s\S]*?)\s*<\/META_DESCRIPTION>/)?.[1]
      ?.trim() || excerpt.slice(0, 155);

  const content =
    text.match(/<CONTENT>\s*([\s\S]*?)\s*<\/CONTENT>/)?.[1]?.trim() ||
    text
      .replace(/<EXCERPT>[\s\S]*?<\/EXCERPT>/g, "")
      .replace(/<META_TITLE>[\s\S]*?<\/META_TITLE>/g, "")
      .replace(/<META_DESCRIPTION>[\s\S]*?<\/META_DESCRIPTION>/g, "")
      .trim();

  // Strip injected tags
  const cleanContent = content
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, "")
    .replace(/<\/?(!DOCTYPE|html|head|body|title)[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<title>[^<]*<\/title>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .trim();

  return {
    content: cleanContent,
    excerpt: excerpt.slice(0, 200),
    metaTitle: metaTitle.slice(0, 60),
    metaDescription: metaDesc.slice(0, 155),
  };
}

// ─── AI: Generate header image ────────────────────────────────────────

async function generateImage(imagePrompt) {
  const res = await fetch(AI_IMAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_GATEWAY_KEY}`,
      "Content-Type": "application/json",
      Origin: "https://trickle.so",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: imagePrompt,
      response_format: "url",
      n: 1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Image generation error ${res.status}: ${errText.slice(0, 200)}`
    );
  }

  const json = await res.json();
  const imageUrl = json.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error("No image URL in response");
  }
  return imageUrl;
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Orlando Detailer - Generate Blog Posts");
  console.log("=".repeat(50));

  if (DRY_RUN) {
    console.log("DRY RUN MODE - generating first post only, no Sheets write\n");
  }

  if (!AI_GATEWAY_KEY) {
    console.error("AI_GATEWAY_API_KEY is required");
    process.exit(1);
  }

  // Dry run
  if (DRY_RUN) {
    const topic = BLOG_TOPICS[0];
    console.log(`Generating: ${topic.title}`);
    try {
      console.log("  Content...");
      const result = await generateContent(topic);
      console.log(`  Content OK (${result.content.length} chars)`);
      console.log("  Image...");
      const imageUrl = await generateImage(topic.imagePrompt);
      console.log(`  Image OK: ${imageUrl.slice(0, 80)}...`);
      console.log("\n--- EXCERPT ---");
      console.log(result.excerpt);
      console.log("\n--- META TITLE ---");
      console.log(result.metaTitle);
      console.log("\n--- CONTENT (first 500 chars) ---");
      console.log(result.content.slice(0, 500));
      console.log("\n[Dry run complete.]");
    } catch (err) {
      console.error("Failed:", err.message);
    }
    return;
  }

  // Production run
  if (!PRIVATE_KEY) {
    console.error("GOOGLE_PRIVATE_KEY is required for Sheets writes.");
    process.exit(1);
  }

  console.log("\nAuthenticating with Google Sheets...");
  const token = await getToken();
  console.log("Authenticated.");

  await ensureHeaders(token);
  const existingSlugs = await getExistingSlugs(token);

  const queue = BLOG_TOPICS.filter((t) => !existingSlugs.has(t.slug));
  console.log(`\nTotal posts: ${BLOG_TOPICS.length}`);
  console.log(`Already exist: ${BLOG_TOPICS.length - queue.length}`);
  console.log(`To generate: ${queue.length}`);

  if (queue.length === 0) {
    console.log("\nAll blog posts already exist. Nothing to do.");
    return;
  }

  // Generate date strings spread over last 2 months
  const now = new Date();
  const dates = queue.map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor((i * 60) / queue.length));
    return d.toISOString().split("T")[0];
  });

  let generated = 0;
  let errors = 0;

  for (let i = 0; i < queue.length; i++) {
    const topic = queue[i];
    console.log(`\n[${i + 1}/${queue.length}] ${topic.title}`);

    try {
      // Generate content
      process.stdout.write("  Content... ");
      const result = await generateContent(topic);
      console.log(`OK (${result.content.length} chars)`);

      // Generate image
      process.stdout.write("  Image... ");
      let imageUrl = "";
      try {
        imageUrl = await generateImage(topic.imagePrompt);
        console.log("OK");
      } catch (imgErr) {
        console.log(`SKIP (${imgErr.message.slice(0, 60)})`);
      }

      // Build row
      const row = [
        topic.title,
        topic.slug,
        result.content,
        result.excerpt,
        "Orlando Detailer",
        imageUrl,
        topic.category,
        topic.tags,
        topic.city || "",
        topic.city ? "FL" : "",
        dates[i],
        result.metaTitle,
        result.metaDescription,
        "TRUE",
      ];

      // Push to Sheets immediately
      process.stdout.write("  Sheets... ");
      await appendRows(token, [row]);
      console.log("OK");

      generated++;
    } catch (err) {
      errors++;
      console.error(`  FAILED - ${err.message}`);
    }

    // Rate limit
    if (i < queue.length - 1) {
      await sleep(2000);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("DONE");
  console.log("=".repeat(50));
  console.log(`Generated: ${generated}`);
  console.log(`Errors: ${errors}`);
  console.log(`Skipped: ${BLOG_TOPICS.length - queue.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
