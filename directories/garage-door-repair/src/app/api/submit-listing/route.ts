import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const PRICE_MAP: Record<string, { amount: number; label: string }> = {
  basic: { amount: 9900, label: "Basic Listing - 1 Year" },
  featured: { amount: 29900, label: "Featured Listing - 1 Year" },
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
      plan,
    } = body;

    // Validate required fields
    if (!businessName || !address || !city || !state || !zip || !phone || !email || !description) {
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

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: priceInfo.label,
              description: `Directory listing for ${businessName} in ${city}, ${state}`,
            },
            unit_amount: priceInfo.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/list-your-business/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/list-your-business`,
      metadata: {
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
        plan,
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err: unknown) {
    console.error("Submit listing error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
