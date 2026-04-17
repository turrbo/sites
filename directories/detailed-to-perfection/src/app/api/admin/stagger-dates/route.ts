import { NextRequest, NextResponse } from "next/server";
import { createSign } from "crypto";

export const dynamic = "force-dynamic";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY_BASE64
  ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, "base64").toString("utf8")
  : (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");

function base64url(input: string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getWriteToken(): Promise<string> {
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
  const jwt = `${signingInput}.${signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json() as { access_token?: string; error?: string };
  if (!res.ok) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  return data.access_token!;
}

function generateDates(count: number, startDaysAgo: number, endDaysAgo: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  const range = startDaysAgo - endDaysAgo;
  const step = range / Math.max(count - 1, 1);
  for (let i = 0; i < count; i++) {
    const jitter = Math.random() * 3 - 1.5;
    const daysAgo = startDaysAgo - step * i + jitter;
    const date = new Date(now);
    date.setDate(date.getDate() - Math.max(0, Math.round(daysAgo)));
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

async function updateDates(token: string, sheetName: string, dateColLetter: string, rowCount: number, dates: string[]) {
  const range = `${sheetName}!${dateColLetter}2:${dateColLetter}${rowCount + 1}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ range, values: dates.map((d) => [d]) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update ${sheetName}: ${text}`);
  }
  return { sheet: sheetName, count: dates.length, from: dates[0], to: dates[dates.length - 1] };
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getWriteToken();
    const results = await Promise.all([
      updateDates(token, "Reviews", "H", 25, generateDates(25, 90, 2)),
      updateDates(token, "Guides", "G", 25, generateDates(25, 85, 3)),
      updateDates(token, "Blog", "H", 20, generateDates(20, 80, 1)),
    ]);
    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
