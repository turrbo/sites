import { Listing, Category, SEOPage, CityGroup, StateGroup } from "./types";

// --- Local seed data fallback (for development without Google Sheets) ---

const USE_SEED_DATA = !process.env.GOOGLE_SHEET_ID;

let seedListings: Listing[] | null = null;
async function getSeedListings(): Promise<Listing[]> {
  if (seedListings) return seedListings;
  try {
    const data = await import("./seed-data.json");
    const raw = Array.isArray(data.default) ? data.default : data;
    seedListings = (raw as any[]).map((item: any) => ({
      id: item["Slug"] || item.slug || item["Name"] || item.name || "",
      name: item["Name"] || item.name || "",
      slug: item["Slug"] || item.slug || slugify(item["Name"] || item.name || ""),
      category: item["Category"] || item.category || "Garage Door Repair",
      description: item["Description"] || item.description || "",
      shortDescription: item["Short Description"] || item.short_description || (item["Description"] || item.description || "").slice(0, 150),
      address: item["Address"] || item.address || "",
      city: item["City"] || item.city || "",
      state: item["State"] || item.state || "",
      stateFull: item["State Full"] || item.state_full || "",
      zip: item["Zip"] || item.zip,
      phone: item["Phone"] || item.phone,
      website: item["Website"] || item.website,
      email: item["Email"] || item.email,
      imageUrl: item["Image URL"] || item.image_url,
      rating: (item["Rating"] || item.rating) ? parseFloat(String(item["Rating"] || item.rating)) : undefined,
      reviewCount: (item["Review Count"] || item.review_count) ? parseInt(String(item["Review Count"] || item.review_count)) : undefined,
      priceRange: item["Price Range"] || item.price_range,
      amenities: item["Amenities"] || item.amenities,
      hours: item["Hours"] || item.hours,
      latitude: (item["Latitude"] || item.latitude) ? parseFloat(String(item["Latitude"] || item.latitude)) : undefined,
      longitude: (item["Longitude"] || item.longitude) ? parseFloat(String(item["Longitude"] || item.longitude)) : undefined,
      featured: item["Featured"] === true || item["Featured"] === "TRUE" || item.featured === true || item.featured === "TRUE",
      published: true,
      tags: item["Tags"] || item.tags,
    }));
    return seedListings;
  } catch {
    return [];
  }
}

// --- Google Sheets Configuration ---

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(
  /\\n/g,
  "\n"
);

const LISTINGS_SHEET = process.env.SHEETS_LISTINGS_TAB || "Listings";
const CATEGORIES_SHEET = process.env.SHEETS_CATEGORIES_TAB || "Categories";
const SEO_PAGES_SHEET = process.env.SHEETS_SEO_PAGES_TAB || "SEO Pages";

// --- JWT Auth for Google Sheets API (no dependencies) ---

function base64url(input: string | Uint8Array): string {
  const str =
    typeof input === "string"
      ? Buffer.from(input).toString("base64")
      : Buffer.from(input).toString("base64");
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Use Node.js crypto to sign with RSA
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

  const jwt = await createJWT();
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

async function fetchSheet(sheetName: string): Promise<SheetRow[]> {
  const token = await getAccessToken();
  const range = encodeURIComponent(`${sheetName}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(
      `Google Sheets error: ${res.status} ${await res.text()}`
    );
  }

  const data = await res.json();
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

// --- Row Mappers ---

function parseBoolean(val: string): boolean {
  const v = val.toLowerCase().trim();
  return v === "true" || v === "yes" || v === "1";
}

function parseNumber(val: string): number | undefined {
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

function parseList(val: string): string[] | undefined {
  if (!val.trim()) return undefined;
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function mapListing(row: SheetRow): Listing {
  return {
    id: row["Slug"] || row["Name"] || "",
    name: row["Name"] || "",
    slug: row["Slug"] || slugify(row["Name"] || ""),
    category: row["Category"] || "",
    description: row["Description"] || "",
    shortDescription: row["Short Description"] || undefined,
    address: row["Address"] || "",
    city: row["City"] || "",
    state: row["State"] || "",
    stateFull: row["State Full"] || "",
    zip: row["Zip"] || undefined,
    phone: row["Phone"] || undefined,
    website: row["Website"] || undefined,
    email: row["Email"] || undefined,
    imageUrl: row["Image URL"] || undefined,
    gallery: undefined, // Sheets doesn't support file attachments natively
    rating: parseNumber(row["Rating"]),
    reviewCount: parseNumber(row["Review Count"])
      ? Math.round(parseNumber(row["Review Count"])!)
      : undefined,
    priceRange: row["Price Range"] || undefined,
    amenities: parseList(row["Amenities"]),
    hours: row["Hours"] || undefined,
    latitude: parseNumber(row["Latitude"]),
    longitude: parseNumber(row["Longitude"]),
    featured: row["Featured"] ? parseBoolean(row["Featured"]) : undefined,
    published: row["Published"] ? parseBoolean(row["Published"]) : true,
    tags: parseList(row["Tags"]),
  };
}

function mapCategory(row: SheetRow): Category {
  return {
    id: row["Slug"] || row["Name"] || "",
    name: row["Name"] || "",
    slug: row["Slug"] || slugify(row["Name"] || ""),
    description: row["Description"] || undefined,
    icon: row["Icon"] || undefined,
    metaTitle: row["Meta Title"] || undefined,
    metaDescription: row["Meta Description"] || undefined,
  };
}

function mapSEOPage(row: SheetRow): SEOPage {
  return {
    id: row["Slug"] || row["Title"] || "",
    title: row["Title"] || "",
    slug: row["Slug"] || slugify(row["Title"] || ""),
    type: (row["Type"] as SEOPage["type"]) || "pillar",
    content: row["Content"] || "",
    category: row["Category"] || undefined,
    city: row["City"] || undefined,
    state: row["State"] || undefined,
    metaTitle: row["Meta Title"] || undefined,
    metaDescription: row["Meta Description"] || undefined,
    published: row["Published"] ? parseBoolean(row["Published"]) : true,
  };
}

// --- Public API (same interface as before) ---

export async function getAllListings(): Promise<Listing[]> {
  if (USE_SEED_DATA) {
    return getSeedListings();
  }
  const rows = await fetchSheet(LISTINGS_SHEET);
  return rows
    .map(mapListing)
    .filter((l) => l.published !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getListingBySlug(
  slug: string
): Promise<Listing | null> {
  const listings = await getAllListings();
  return listings.find((l) => l.slug === slug) || null;
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const listings = await getAllListings();
  return listings.filter((l) => l.featured);
}

export async function getListingsByCity(
  city: string,
  state: string
): Promise<Listing[]> {
  const listings = await getAllListings();
  return listings
    .filter(
      (l) =>
        l.city.toLowerCase() === city.toLowerCase() &&
        l.state.toLowerCase() === state.toLowerCase()
    )
    .sort((a, b) => {
      // Featured listings first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });
}

export async function getListingsByState(
  state: string
): Promise<Listing[]> {
  const listings = await getAllListings();
  return listings
    .filter((l) => l.state.toLowerCase() === state.toLowerCase())
    .sort((a, b) => a.city.localeCompare(b.city));
}

export async function getListingsByCategory(
  category: string
): Promise<Listing[]> {
  const listings = await getAllListings();
  return listings.filter(
    (l) => l.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getCityGroups(): Promise<CityGroup[]> {
  const listings = await getAllListings();
  const groups = new Map<string, CityGroup>();

  for (const l of listings) {
    const key = `${l.city.toLowerCase()}-${l.state.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, {
        city: l.city,
        state: l.state,
        stateFull: l.stateFull,
        count: 0,
        slug: `${l.state.toLowerCase()}/${slugify(l.city)}`,
      });
    }
    groups.get(key)!.count++;
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.city.localeCompare(b.city)
  );
}

export async function getStateGroups(): Promise<StateGroup[]> {
  const cityGroups = await getCityGroups();
  const stateMap = new Map<string, StateGroup>();

  for (const cg of cityGroups) {
    if (!stateMap.has(cg.state)) {
      stateMap.set(cg.state, {
        state: cg.state,
        stateFull: cg.stateFull,
        cities: [],
        count: 0,
      });
    }
    const sg = stateMap.get(cg.state)!;
    sg.cities.push(cg);
    sg.count += cg.count;
  }

  return Array.from(stateMap.values()).sort((a, b) =>
    a.stateFull.localeCompare(b.stateFull)
  );
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    const rows = await fetchSheet(CATEGORIES_SHEET);
    if (rows.length > 0) {
      return rows.map(mapCategory);
    }
  } catch {
    // Categories sheet doesn't exist -- fall through
  }

  // Fallback: derive categories from listings
  const listings = await getAllListings();
  const cats = new Map<string, Category>();
  for (const l of listings) {
    if (l.category && !cats.has(l.category)) {
      cats.set(l.category, {
        id: l.category,
        name: l.category,
        slug: slugify(l.category),
      });
    }
  }
  return Array.from(cats.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function getSEOPages(): Promise<SEOPage[]> {
  try {
    const rows = await fetchSheet(SEO_PAGES_SHEET);
    return rows.map(mapSEOPage).filter((p) => p.published !== false);
  } catch {
    return [];
  }
}

export async function getSEOPageBySlug(
  slug: string
): Promise<SEOPage | null> {
  const pages = await getSEOPages();
  return pages.find((p) => p.slug === slug) || null;
}

// --- Helpers ---

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
