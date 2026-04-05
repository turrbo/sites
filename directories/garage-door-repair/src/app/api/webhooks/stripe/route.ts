import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

// Google Sheets write helpers
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
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
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

async function appendToSheet(
  metadata: Record<string, string>,
  subscriptionId: string
) {
  const token = await getWriteToken();
  const tab = process.env.SHEETS_LISTINGS_TAB || "Listings";
  const range = encodeURIComponent(tab);
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || "";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const slug = slugify(
    `${metadata.businessName}-${metadata.city}-${metadata.state}`
  );
  const stateFull = STATE_NAMES[metadata.state] || metadata.state;
  const isFeatured = metadata.plan === "featured" ? "TRUE" : "FALSE";
  const now = new Date();
  const submittedDate = now.toISOString().split("T")[0];
  const expirationDate = new Date(now);
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  const expiresOn = expirationDate.toISOString().split("T")[0];

  // Row must match the Listings sheet column order
  const row = [
    metadata.businessName, // Name
    slug, // Slug
    "Garage Door Repair", // Category
    metadata.description, // Description
    metadata.description.slice(0, 150), // Short Description
    metadata.address, // Address
    metadata.city, // City
    metadata.state, // State
    stateFull, // State Full
    metadata.zip, // Zip
    metadata.phone, // Phone
    metadata.website || "", // Website
    metadata.email, // Email
    "", // Image URL
    "", // Rating
    "", // Review Count
    "", // Price Range
    "", // Amenities
    metadata.hours || "", // Hours
    "", // Latitude
    "", // Longitude
    isFeatured, // Featured
    "FALSE", // Published (manual review)
    "garage door repair", // Tags
    "", // Source URL
    metadata.plan, // Plan
    submittedDate, // Submitted Date
    metadata.email, // Contact Email
    "active", // Payment Status
    metadata.googleBusinessUrl || "", // Google Business URL
    subscriptionId, // Stripe Subscription ID
    expiresOn, // Expiration Date
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

// Find a row by subscription ID and update its Published / Payment Status columns
async function updateListingStatus(
  subscriptionId: string,
  published: string,
  paymentStatus: string
) {
  const token = await getWriteToken();
  const tab = process.env.SHEETS_LISTINGS_TAB || "Listings";
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || "";

  // Read all rows to find the one with this subscription ID
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tab)}`;
  const readRes = await fetch(readUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!readRes.ok) {
    throw new Error(
      `Google Sheets read error: ${readRes.status} ${await readRes.text()}`
    );
  }

  const data = await readRes.json();
  const rows: string[][] = data.values || [];
  if (rows.length < 2) return;

  const headers = rows[0];
  const subIdCol = headers.indexOf("Subscription ID");
  const publishedCol = headers.indexOf("Published");
  const paymentCol = headers.indexOf("Payment Status");

  if (subIdCol === -1) {
    console.error("Subscription ID column not found in sheet");
    return;
  }

  // Find the row with matching subscription ID
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][subIdCol] === subscriptionId) {
      const rowNum = i + 1; // 1-indexed

      // Update Published column
      if (publishedCol !== -1) {
        const cellRange = `${tab}!${colLetter(publishedCol)}${rowNum}`;
        await updateCell(token, spreadsheetId, cellRange, published);
      }

      // Update Payment Status column
      if (paymentCol !== -1) {
        const cellRange = `${tab}!${colLetter(paymentCol)}${rowNum}`;
        await updateCell(token, spreadsheetId, cellRange, paymentStatus);
      }

      console.log(
        `Updated listing row ${rowNum}: Published=${published}, Payment=${paymentStatus}`
      );
      return;
    }
  }

  console.warn(`No listing found with subscription ID: ${subscriptionId}`);
}

function colLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

async function updateCell(
  token: string,
  spreadsheetId: string,
  range: string,
  value: string
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [[value]] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Sheets update error: ${res.status} ${text}`);
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
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Webhook verification failed";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      // New subscription created (first payment successful)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.metadata) {
          const subscriptionId = String(session.subscription || "");
          await appendToSheet(session.metadata, subscriptionId);
          console.log(
            `New listing submitted: ${session.metadata.businessName} (${session.metadata.plan}) [${subscriptionId}]`
          );
        }
        break;
      }

      // Subscription cancelled or expired - unpublish the listing
      case "customer.subscription.deleted": {
        const subscription = event.data
          .object as Stripe.Subscription;
        await updateListingStatus(subscription.id, "FALSE", "cancelled");
        console.log(`Subscription cancelled: ${subscription.id}`);
        break;
      }

      // Payment failed on renewal - mark as past due
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = String(invoice.subscription || "");
        if (subId) {
          await updateListingStatus(subId, "FALSE", "past_due");
          console.log(`Payment failed for subscription: ${subId}`);
        }
        break;
      }

      // Successful renewal payment - keep listing active
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Only handle renewal invoices (not the first one)
        if (invoice.billing_reason === "subscription_cycle") {
          const subId = String(invoice.subscription || "");
          if (subId) {
            await updateListingStatus(subId, "TRUE", "active");
            console.log(`Subscription renewed: ${subId}`);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    // Don't return error to Stripe - acknowledge receipt
  }

  return NextResponse.json({ received: true });
}
