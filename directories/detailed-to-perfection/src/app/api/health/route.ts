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

  // Try a live sheets call
  let sheetsTest: string;
  try {
    const { getReviews } = await import("@/lib/sheets");
    const reviews = await getReviews();
    sheetsTest = `OK - ${reviews.length} reviews`;
  } catch (err: unknown) {
    sheetsTest = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({ env: checks, sheets_test: sheetsTest });
}
