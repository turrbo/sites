import { NextRequest, NextResponse } from "next/server";
import { getAllListings } from "@/lib/sheets";

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 }
    );
  }

  const listings = await getAllListings();

  const nearby = listings
    .filter((l) => l.latitude && l.longitude)
    .map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      city: l.city,
      state: l.state,
      phone: l.phone,
      rating: l.rating,
      reviewCount: l.reviewCount,
      imageUrl: l.imageUrl,
      featured: l.featured,
      distance: haversineDistance(lat, lng, l.latitude!, l.longitude!),
    }))
    .filter((l) => l.distance <= 75) // within 75 miles
    .sort((a, b) => {
      // Featured first, then by distance
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.distance - b.distance;
    })
    .slice(0, 12);

  return NextResponse.json({ listings: nearby });
}
