import { NextRequest, NextResponse } from "next/server";
import { getListingBySlug } from "@/lib/sheets";
import { computeBadgeTier, generateBadgeSVG } from "@/lib/badges";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const listing = await getListingBySlug(slug);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const tier = computeBadgeTier(listing);
  const size =
    request.nextUrl.searchParams.get("size") === "compact"
      ? "compact"
      : "default";

  const svg = generateBadgeSVG(listing, tier, size);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
