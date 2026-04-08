import { NextRequest, NextResponse } from "next/server";
import { submitQuoteLead } from "@/lib/sheets";

// Simple in-memory rate limiter: max 5 submissions per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 5) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up expired entries periodically (every 100 requests)
let cleanupCounter = 0;
function maybeCleanup() {
  cleanupCounter++;
  if (cleanupCounter % 100 !== 0) return;
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    maybeCleanup();

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate required fields
    const { serviceType, name, email } = body;
    // Accept either zipCode or zip (QuoteForm sends "zip")
    const zipCode: string = body.zipCode || body.zip || "";

    if (!serviceType || typeof serviceType !== "string" || !serviceType.trim()) {
      return NextResponse.json({ error: "Service type is required." }, { status: 400 });
    }
    if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode.trim())) {
      return NextResponse.json({ error: "A valid 5-digit zip code is required." }, { status: 400 });
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    await submitQuoteLead({
      submittedAt: new Date().toISOString(),
      serviceType: serviceType.trim(),
      subcategory: body.subcategory || undefined,
      vehicleYear: body.vehicleYear || undefined,
      vehicleMake: body.vehicleMake || undefined,
      vehicleModel: body.vehicleModel || undefined,
      zipCode: zipCode.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: body.phone || undefined,
      description: body.notes || body.details || body.description || undefined,
      source: "website",
      notifiedShops: [],
      status: "new",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("submit-quote error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
