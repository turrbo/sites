import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

const PRICE_MAP: Record<string, { amount: number; label: string }> = {
  basic: { amount: 9900, label: "Basic Listing" },
  featured: { amount: 29900, label: "Featured Listing" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      businessName,
      address,
      city,
      state,
      zip,
      phone,
      website,
      email,
      description,
      hours,
      googleBusinessUrl,
      plan,
    } = body;

    // Validate required fields
    if (!businessName || !address || !city || !state || !zip || !phone || !email || !description || !googleBusinessUrl) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (!plan || !PRICE_MAP[plan]) {
      return NextResponse.json(
        { error: "Please select a valid plan." },
        { status: 400 }
      );
    }

    const priceInfo = PRICE_MAP[plan];

    // Business metadata (stored on subscription for webhook access)
    const metadata = {
      businessName,
      address,
      city,
      state,
      zip,
      phone,
      website: website || "",
      email,
      description: description.slice(0, 500),
      hours: (hours || "").slice(0, 500),
      googleBusinessUrl: (googleBusinessUrl || "").slice(0, 500),
      plan,
    };

    // Create Stripe Checkout session with annual subscription
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: priceInfo.label,
              description: `Annual directory listing for ${businessName} in ${city}, ${state}`,
            },
            unit_amount: priceInfo.amount,
            recurring: {
              interval: "year",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        metadata,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/list-your-business/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/list-your-business`,
      metadata,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err: unknown) {
    console.error("Submit listing error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
