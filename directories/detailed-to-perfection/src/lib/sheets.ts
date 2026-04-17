import { Review, Guide, BlogPost, Product } from "./types";
import reviewsJson from "../data/reviews.json";
import guidesJson from "../data/guides.json";
import blogJson from "../data/blog.json";

// --- Local seed data fallback ---
const USE_SEED_DATA = !process.env.GOOGLE_SHEET_ID;

// --- Google Sheets Configuration ---
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY_BASE64
  ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, "base64").toString("utf8")
  : (process.env.GOOGLE_PRIVATE_KEY || "")
      .replace(/\\\\n/g, "\n")
      .replace(/\\n/g, "\n");

const REVIEWS_SHEET = process.env.SHEETS_REVIEWS_TAB || "Reviews";
const GUIDES_SHEET = process.env.SHEETS_GUIDES_TAB || "Guides";
const BLOG_SHEET = process.env.SHEETS_BLOG_TAB || "Blog";

// --- JWT Auth (zero dependencies) ---

function base64url(input: string | Uint8Array): string {
  const str = Buffer.from(input).toString("base64");
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJWT(scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(GOOGLE_PRIVATE_KEY, "base64");
  const encodedSignature = signature
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${signingInput}.${encodedSignature}`;
}

let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  const jwt = await createJWT(
    "https://www.googleapis.com/auth/spreadsheets.readonly"
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google auth error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

// --- Sheet Data Fetching ---

interface SheetRow {
  [key: string]: string;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 && attempt < retries) {
      const wait = Math.pow(2, attempt + 1) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    return res;
  }
  return fetch(url, options);
}

function parseRows(data: { values?: string[][] }): SheetRow[] {
  const rows: string[][] = data.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: SheetRow = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || "";
    });
    return obj;
  });
}

async function fetchSheet(sheetName: string): Promise<SheetRow[]> {
  const token = await getAccessToken();
  const range = encodeURIComponent(`${sheetName}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(
      `Google Sheets error: ${res.status} ${await res.text()}`
    );
  }

  return parseRows(await res.json());
}

// Uncached fetch for large sheets
let contentCacheData: { rows: SheetRow[]; expires: number; sheet: string } | null = null;

async function fetchSheetUncached(sheetName: string): Promise<SheetRow[]> {
  if (
    contentCacheData &&
    contentCacheData.sheet === sheetName &&
    Date.now() < contentCacheData.expires
  ) {
    return contentCacheData.rows;
  }

  const token = await getAccessToken();
  const range = encodeURIComponent(`${sheetName}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  } as RequestInit);

  if (!res.ok) {
    throw new Error(
      `Google Sheets error: ${res.status} ${await res.text()}`
    );
  }

  const result = parseRows(await res.json());
  contentCacheData = { rows: result, expires: Date.now() + 3600 * 1000, sheet: sheetName };
  return result;
}

// --- Row Mappers ---

function parseBoolean(val: string): boolean {
  const v = val.toLowerCase().trim();
  return v === "true" || v === "yes" || v === "1";
}

function parseProducts(json: string): Product[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function mapReview(row: SheetRow): Review {
  return {
    id: row["Slug"] || row["Title"] || "",
    title: row["Title"] || "",
    slug: row["Slug"] || slugify(row["Title"] || ""),
    content: row["Content"] || "",
    category: row["Category"] || "",
    products: parseProducts(row["Products JSON"]),
    metaTitle: row["Meta Title"] || undefined,
    metaDescription: row["Meta Description"] || undefined,
    publishedAt: row["Published At"] || undefined,
    published: row["Published"] ? parseBoolean(row["Published"]) : true,
  };
}

function mapGuide(row: SheetRow): Guide {
  return {
    id: row["Slug"] || row["Title"] || "",
    title: row["Title"] || "",
    slug: row["Slug"] || slugify(row["Title"] || ""),
    content: row["Content"] || "",
    category: row["Category"] || "",
    metaTitle: row["Meta Title"] || undefined,
    metaDescription: row["Meta Description"] || undefined,
    publishedAt: row["Published At"] || undefined,
    published: row["Published"] ? parseBoolean(row["Published"]) : true,
  };
}

function mapBlogPost(row: SheetRow): BlogPost {
  return {
    id: row["Slug"] || row["Title"] || "",
    title: row["Title"] || "",
    slug: row["Slug"] || slugify(row["Title"] || ""),
    content: row["Content"] || "",
    excerpt: row["Excerpt"] || undefined,
    imageUrl: row["Image URL"] || undefined,
    category: row["Category"] || undefined,
    tags: row["Tags"] ? row["Tags"].split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    publishedAt: row["Published At"] || undefined,
    metaTitle: row["Meta Title"] || undefined,
    metaDescription: row["Meta Description"] || undefined,
    published: row["Published"] ? parseBoolean(row["Published"]) : true,
  };
}

// --- Public API ---

const staticReviews = reviewsJson as Review[];
const staticGuides = guidesJson as Guide[];
const staticBlog = blogJson as BlogPost[];

export async function getReviews(): Promise<Review[]> {
  if (USE_SEED_DATA) return staticReviews;
  try {
    const rows = await fetchSheetUncached(REVIEWS_SHEET);
    const sheetReviews = rows
      .map(mapReview)
      .filter((r) => r.published)
      .sort((a, b) => {
        if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt);
        return a.title.localeCompare(b.title);
      });
    return sheetReviews.length > 0 ? sheetReviews : staticReviews;
  } catch {
    return staticReviews;
  }
}

export async function getReviewBySlug(slug: string): Promise<Review | null> {
  const reviews = await getReviews();
  return reviews.find((r) => r.slug === slug) || null;
}

export async function getReviewsByCategory(category: string): Promise<Review[]> {
  const reviews = await getReviews();
  return reviews.filter(
    (r) => r.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getGuides(): Promise<Guide[]> {
  if (USE_SEED_DATA) return staticGuides;
  try {
    const rows = await fetchSheetUncached(GUIDES_SHEET);
    const sheetGuides = rows
      .map(mapGuide)
      .filter((g) => g.published)
      .sort((a, b) => {
        if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt);
        return a.title.localeCompare(b.title);
      });
    return sheetGuides.length > 0 ? sheetGuides : staticGuides;
  } catch {
    return staticGuides;
  }
}

export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  const guides = await getGuides();
  return guides.find((g) => g.slug === slug) || null;
}

export async function getGuidesByCategory(category: string): Promise<Guide[]> {
  const guides = await getGuides();
  return guides.filter(
    (g) => g.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (USE_SEED_DATA) return staticBlog;
  try {
    const rows = await fetchSheet(BLOG_SHEET);
    const sheetPosts = rows
      .map(mapBlogPost)
      .filter((p) => p.published)
      .sort((a, b) => {
        if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt);
        return a.title.localeCompare(b.title);
      });
    return sheetPosts.length > 0 ? sheetPosts : staticBlog;
  } catch {
    return staticBlog;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}

// --- Helpers ---

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
