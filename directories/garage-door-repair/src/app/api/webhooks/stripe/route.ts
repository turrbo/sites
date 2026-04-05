import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Google Sheets write helpers
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(
  /\\n/g,
  "\n"
);

function base64url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createWriteJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
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

async function getWriteToken(): Promise<string> {
  const jwt = await createWriteJWT();
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
  return data.access_token;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

async function appendToSheet(metadata: Record<string, string>) {
  const token = await getWriteToken();
  const tab = process.env.SHEETS_LISTINGS_TAB || "Listings";
  const range = encodeURIComponent(tab);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const slug = slugify(`${metadata.businessName}-${metadata.city}-${metadata.state}`);
  const stateFull = STATE_NAMES[metadata.state] || metadata.state;
  const isFeatured = metadata.plan === "featured" ? "TRUE" : "FALSE";
  const now = new Date().toISOString().split("T")[0];

  // Row must match the Listings sheet column order
  const row = [
    metadata.businessName,      // Name
    slug,                       // Slug
    "Garage Door Repair",       // Category
    metadata.description,       // Description
    metadata.description.slice(0, 150), // Short Description
    metadata.address,           // Address
    metadata.city,              // City
    metadata.state,             // State
    stateFull,                  // State Full
    metadata.zip,               // Zip
    metadata.phone,             // Phone
    metadata.website || "",     // Website
    metadata.email,             // Email
    "",                         // Image URL
    "",                         // Rating
    "",                         // Review Count
    "",                         // Price Range
    "",                         // Amenities
    metadata.hours || "",       // Hours
    "",                         // Latitude
    "",                         // Longitude
    isFeatured,                 // Featured
    "FALSE",                    // Published (manual review)
    "garage door repair",       // Tags
    "",                         // Source URL
    metadata.plan,              // Plan
    now,                        // Submitted Date
    metadata.email,             // Contact Email
    "paid",                     // Payment Status
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [row],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Sheets append error: ${res.status} ${text}`);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid" && session.metadata) {
      try {
        await appendToSheet(session.metadata);
        console.log(
          `New listing submitted: ${session.metadata.businessName} (${session.metadata.plan})`
        );
      } catch (err) {
        console.error("Failed to write to Google Sheet:", err);
        // Don't return error to Stripe - payment was successful
        // We'll handle the sheet write failure manually
      }
    }
  }

  return NextResponse.json({ received: true });
}
