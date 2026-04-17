import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyBase64 = process.env.GOOGLE_PRIVATE_KEY_BASE64;
  const keyRaw = process.env.GOOGLE_PRIVATE_KEY;

  const checks = {
    GOOGLE_SHEET_ID: sheetId ? `set (${sheetId.slice(0, 8)}...)` : "MISSING",
    GOOGLE_SERVICE_ACCOUNT_EMAIL: email ? `set (${email})` : "MISSING",
    GOOGLE_PRIVATE_KEY_BASE64: keyBase64
      ? `set (${keyBase64.length} chars)`
      : "not set",
    GOOGLE_PRIVATE_KEY: keyRaw
      ? `set (starts: ${keyRaw.slice(0, 20)}...)`
      : "not set",
    key_source: keyBase64 ? "GOOGLE_PRIVATE_KEY_BASE64" : keyRaw ? "GOOGLE_PRIVATE_KEY" : "NONE",
  };

  // Try raw sheet fetches to count rows before any filtering
  let sheetsTest: Record<string, string> = {};
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
    const keyB64 = process.env.GOOGLE_PRIVATE_KEY_BASE64!;
    const pk = Buffer.from(keyB64, "base64").toString("utf8");
    const svcEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;

    // Build JWT
    const crypto = await import("crypto");
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
    const payload = btoa(JSON.stringify({ iss: svcEmail, scope: "https://www.googleapis.com/auth/spreadsheets.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
    const sig = crypto.createSign("RSA-SHA256");
    sig.update(`${header}.${payload}`);
    const signed = sig.sign(pk, "base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
    const jwt = `${header}.${payload}.${signed}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) });
    const { access_token } = await tokenRes.json();

    for (const tab of ["Reviews", "Guides", "Blog"]) {
      const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(tab)}`, { headers: { Authorization: `Bearer ${access_token}` } });
      if (!r.ok) { sheetsTest[tab] = `HTTP ${r.status}`; continue; }
      const d = await r.json();
      const rows = (d.values || []).length;
      sheetsTest[tab] = rows <= 1 ? "EMPTY (header only or no data)" : `${rows - 1} data rows`;
    }
  } catch (err: unknown) {
    sheetsTest["error"] = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({ env: checks, sheets_raw: sheetsTest });
}
