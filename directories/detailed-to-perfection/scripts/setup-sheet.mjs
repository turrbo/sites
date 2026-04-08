/**
 * Creates the Google Sheet with proper headers for all tabs.
 * Usage: node scripts/setup-sheet.mjs
 */
import { readFileSync } from "fs";
import { createSign } from "crypto";

// Load env vars from .env.local
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
  : (env.GOOGLE_PRIVATE_KEY || "")
      .replace(/\\\\n/g, "\n")
      .replace(/\\n/g, "\n");

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
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

async function getToken() {
  const jwt = await createJWT();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function main() {
  console.log("Setting up Google Sheet...");
  const token = await getToken();

  // Get existing sheets info
  const infoRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const info = await infoRes.json();
  const existingSheets = (info.sheets || []).map(
    (s) => s.properties.title
  );
  console.log("Existing sheets:", existingSheets);

  const tabs = [
    {
      name: "Reviews",
      headers: [
        "Title", "Slug", "Content", "Category", "Products JSON",
        "Meta Title", "Meta Description", "Published At", "Published",
      ],
    },
    {
      name: "Guides",
      headers: [
        "Title", "Slug", "Content", "Category",
        "Meta Title", "Meta Description", "Published At", "Published",
      ],
    },
    {
      name: "Blog",
      headers: [
        "Title", "Slug", "Content", "Excerpt", "Image URL", "Category",
        "Tags", "Published At", "Meta Title", "Meta Description", "Published",
      ],
    },
  ];

  // Add missing sheets
  const requests = [];
  for (const tab of tabs) {
    if (!existingSheets.includes(tab.name)) {
      requests.push({
        addSheet: { properties: { title: tab.name } },
      });
    }
  }

  if (requests.length > 0) {
    const batchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      }
    );
    if (!batchRes.ok) {
      console.error("Error creating sheets:", await batchRes.text());
    } else {
      console.log(`Created ${requests.length} new sheets`);
    }
  }

  // Add headers to each tab
  for (const tab of tabs) {
    const range = `${tab.name}!A1`;
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          range: `${tab.name}!A1`,
          values: [tab.headers],
        }),
      }
    );
    if (!res.ok) {
      console.error(`Error setting headers for ${tab.name}:`, await res.text());
    } else {
      console.log(`Set headers for ${tab.name}: ${tab.headers.join(", ")}`);
    }
  }

  console.log("Done!");
}

main().catch(console.error);
