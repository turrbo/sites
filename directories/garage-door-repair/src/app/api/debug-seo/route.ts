import { NextResponse } from "next/server";
import { getSEOPages } from "@/lib/sheets";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  const pages = await getSEOPages();

  if (city) {
    const matching = pages.filter(
      (p) => p.city?.toLowerCase() === city.toLowerCase()
    );
    const allCities = [...new Set(pages.map((p) => p.city).filter(Boolean))];
    return NextResponse.json({
      totalPages: pages.length,
      searchCity: city,
      matchingCount: matching.length,
      matchingSlugs: matching.map((p) => p.slug),
      allCities: allCities.sort(),
    });
  }

  const cityCounts: Record<string, number> = {};
  for (const p of pages) {
    const c = p.city || "(none)";
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  }

  return NextResponse.json({
    totalPages: pages.length,
    cityCounts,
  });
}
