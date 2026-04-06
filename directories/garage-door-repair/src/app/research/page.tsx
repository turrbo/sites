import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getAllListings } from "@/lib/sheets";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ResearchDashboard from "./ResearchDashboard";

export const revalidate = 86400;

export interface StateRating {
  state: string;
  stateFull: string;
  avgRating: number;
  count: number;
}

export interface CityRating {
  city: string;
  state: string;
  stateFull: string;
  avgRating: number;
  count: number;
}

export interface PlatformStat {
  platform: string;
  percentage: number;
  count: number;
}

export interface ResearchStats {
  totalBusinesses: number;
  totalCities: number;
  totalStates: number;
  avgRating: number;
  avgReviews: number;
  avgAge: number;
  ratingByState: StateRating[];
  topCities: CityRating[];
  bottomCities: CityRating[];
  ageDistribution: { range: string; count: number }[];
  digitalPresence: PlatformStat[];
  reviewDistribution: { range: string; count: number }[];
  ratingDistribution: { range: string; count: number }[];
  topServices: { service: string; count: number }[];
}

export async function generateMetadata(): Promise<Metadata> {
  const listings = await getAllListings();
  const citySet = new Set(listings.map((l) => `${l.city}-${l.state}`));
  return {
    title: `State of Garage Door Repair 2026 | Industry Data & Insights`,
    description: `Original research from ${listings.length.toLocaleString()} garage door repair businesses across ${citySet.size} US cities. Ratings, reviews, longevity, and digital presence data.`,
    openGraph: {
      title: "State of Garage Door Repair 2026 | Industry Data & Insights",
      description: `Data-driven insights from ${listings.length.toLocaleString()} businesses across ${citySet.size} cities.`,
      url: `${siteConfig.url}/research`,
    },
  };
}

function round(n: number, decimals = 2): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export default async function ResearchPage() {
  const listings = await getAllListings();
  const currentYear = new Date().getFullYear();

  // --- Core counts ---
  const totalBusinesses = listings.length;
  const citySet = new Set(listings.map((l) => `${l.city}-${l.state}`));
  const stateSet = new Set(listings.map((l) => l.state));
  const totalCities = citySet.size;
  const totalStates = stateSet.size;

  // --- Avg rating (listings that have a rating) ---
  const withRating = listings.filter(
    (l) => typeof l.rating === "number" && l.rating > 0
  );
  const avgRating = withRating.length
    ? round(
        withRating.reduce((s, l) => s + l.rating!, 0) / withRating.length
      )
    : 0;

  // --- Avg reviews ---
  const withReviews = listings.filter(
    (l) => typeof l.reviewCount === "number" && l.reviewCount > 0
  );
  const avgReviews = withReviews.length
    ? round(
        withReviews.reduce((s, l) => s + l.reviewCount!, 0) / withReviews.length,
        0
      )
    : 0;

  // --- Avg age ---
  const withYear = listings.filter(
    (l) =>
      typeof l.yearEstablished === "number" &&
      l.yearEstablished > 1900 &&
      l.yearEstablished <= currentYear
  );
  const avgAge = withYear.length
    ? round(
        withYear.reduce((s, l) => s + (currentYear - l.yearEstablished!), 0) /
          withYear.length,
        1
      )
    : 0;

  // --- Rating by state ---
  const stateMap = new Map<
    string,
    { stateFull: string; ratings: number[]; count: number }
  >();
  for (const l of listings) {
    if (!stateMap.has(l.state)) {
      stateMap.set(l.state, { stateFull: l.stateFull, ratings: [], count: 0 });
    }
    const entry = stateMap.get(l.state)!;
    entry.count++;
    if (typeof l.rating === "number" && l.rating > 0) {
      entry.ratings.push(l.rating);
    }
  }
  const ratingByState: StateRating[] = Array.from(stateMap.entries())
    .map(([state, v]) => ({
      state,
      stateFull: v.stateFull,
      avgRating: v.ratings.length
        ? round(v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length)
        : 0,
      count: v.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating);

  // --- City ratings (min 3 businesses) ---
  const cityMap = new Map<
    string,
    { city: string; state: string; stateFull: string; ratings: number[]; count: number }
  >();
  for (const l of listings) {
    const key = `${l.city}-${l.state}`;
    if (!cityMap.has(key)) {
      cityMap.set(key, {
        city: l.city,
        state: l.state,
        stateFull: l.stateFull,
        ratings: [],
        count: 0,
      });
    }
    const entry = cityMap.get(key)!;
    entry.count++;
    if (typeof l.rating === "number" && l.rating > 0) {
      entry.ratings.push(l.rating);
    }
  }
  const qualifiedCities: CityRating[] = Array.from(cityMap.values())
    .filter((v) => v.count >= 3 && v.ratings.length >= 3)
    .map((v) => ({
      city: v.city,
      state: v.state,
      stateFull: v.stateFull,
      avgRating: round(v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length),
      count: v.count,
    }));
  const sortedCities = [...qualifiedCities].sort(
    (a, b) => b.avgRating - a.avgRating
  );
  const topCities = sortedCities.slice(0, 15);
  const bottomCities = [...sortedCities].reverse().slice(0, 15);

  // --- Age distribution ---
  const ageBuckets: Record<string, number> = {
    "0-5 years": 0,
    "5-10 years": 0,
    "10-20 years": 0,
    "20-30 years": 0,
    "30+ years": 0,
  };
  for (const l of withYear) {
    const age = currentYear - l.yearEstablished!;
    if (age < 5) ageBuckets["0-5 years"]++;
    else if (age < 10) ageBuckets["5-10 years"]++;
    else if (age < 20) ageBuckets["10-20 years"]++;
    else if (age < 30) ageBuckets["20-30 years"]++;
    else ageBuckets["30+ years"]++;
  }
  const ageDistribution = Object.entries(ageBuckets).map(([range, count]) => ({
    range,
    count,
  }));

  // --- Digital presence ---
  const total = totalBusinesses;
  const presenceData = [
    {
      platform: "Website",
      count: listings.filter((l) => l.website && l.website.trim()).length,
    },
    {
      platform: "Facebook",
      count: listings.filter((l) => l.facebook).length,
    },
    { platform: "Yelp", count: listings.filter((l) => l.yelp).length },
    {
      platform: "Instagram",
      count: listings.filter((l) => l.instagram).length,
    },
    {
      platform: "Google Reviews",
      count: listings.filter(
        (l) => typeof l.reviewCount === "number" && l.reviewCount > 0
      ).length,
    },
    { platform: "YouTube", count: listings.filter((l) => l.youtube).length },
    { platform: "Twitter / X", count: listings.filter((l) => l.twitter).length },
    {
      platform: "Nextdoor",
      count: listings.filter((l) => l.nextdoor).length,
    },
  ];
  const digitalPresence: PlatformStat[] = presenceData
    .map((p) => ({
      platform: p.platform,
      count: p.count,
      percentage: round((p.count / total) * 100, 1),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // --- Review distribution ---
  const reviewBuckets: Record<string, number> = {
    "0 reviews": 0,
    "1-10": 0,
    "11-50": 0,
    "51-100": 0,
    "101-250": 0,
    "251-500": 0,
    "500+": 0,
  };
  for (const l of listings) {
    const rc = l.reviewCount ?? 0;
    if (rc === 0) reviewBuckets["0 reviews"]++;
    else if (rc <= 10) reviewBuckets["1-10"]++;
    else if (rc <= 50) reviewBuckets["11-50"]++;
    else if (rc <= 100) reviewBuckets["51-100"]++;
    else if (rc <= 250) reviewBuckets["101-250"]++;
    else if (rc <= 500) reviewBuckets["251-500"]++;
    else reviewBuckets["500+"]++;
  }
  const reviewDistribution = Object.entries(reviewBuckets).map(
    ([range, count]) => ({ range, count })
  );

  // --- Rating distribution ---
  const ratingBuckets: Record<string, number> = {
    "No rating": 0,
    "1.0-2.9": 0,
    "3.0-3.4": 0,
    "3.5-3.9": 0,
    "4.0-4.4": 0,
    "4.5-4.7": 0,
    "4.8-5.0": 0,
  };
  for (const l of listings) {
    const r = l.rating;
    if (!r || r <= 0) ratingBuckets["No rating"]++;
    else if (r < 3.0) ratingBuckets["1.0-2.9"]++;
    else if (r < 3.5) ratingBuckets["3.0-3.4"]++;
    else if (r < 4.0) ratingBuckets["3.5-3.9"]++;
    else if (r < 4.5) ratingBuckets["4.0-4.4"]++;
    else if (r < 4.8) ratingBuckets["4.5-4.7"]++;
    else ratingBuckets["4.8-5.0"]++;
  }
  const ratingDistribution = Object.entries(ratingBuckets).map(
    ([range, count]) => ({ range, count })
  );

  // --- Top services ---
  const serviceCounts = new Map<string, number>();
  for (const l of listings) {
    if (!l.services) continue;
    for (const svc of l.services) {
      const normalized = svc.trim().toLowerCase();
      if (!normalized) continue;
      // Title-case for display
      const display = svc.trim();
      serviceCounts.set(display, (serviceCounts.get(display) ?? 0) + 1);
    }
  }
  const topServices = Array.from(serviceCounts.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const stats: ResearchStats = {
    totalBusinesses,
    totalCities,
    totalStates,
    avgRating,
    avgReviews,
    avgAge,
    ratingByState,
    topCities,
    bottomCities,
    ageDistribution,
    digitalPresence,
    reviewDistribution,
    ratingDistribution,
    topServices,
  };

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Research", url: "/research" },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            State of Garage Door Repair 2026
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Industry data aggregated from {totalBusinesses.toLocaleString()}{" "}
            verified businesses across {totalCities.toLocaleString()} US cities.
            Ratings, reviews, longevity, digital presence, and service
            breakdowns.
          </p>
        </div>

        <ResearchDashboard stats={stats} />

        <section className="mt-16 border-t border-gray-200 pt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Methodology</h2>
          <div className="prose prose-gray max-w-3xl text-sm text-gray-600 space-y-3">
            <p>
              Data for this report was collected from Google Maps via the Google
              Places API. Coverage focuses on US cities with populations above
              50,000, representing the primary markets where consumers search for
              garage door repair services.
            </p>
            <p>
              Business ratings reflect Google Reviews scores at the time of data
              collection. Review counts are taken directly from each business's
              Google Maps profile. Year established data comes from business
              profiles where available and is not available for every listing.
            </p>
            <p>
              Service data is scraped from individual business websites and
              supplemented with industry-standard defaults where website data was
              unavailable. Social media presence is verified by confirming profile
              URLs resolve to a known platform domain.
            </p>
            <p>
              This report covers approximately {totalStates} states and{" "}
              {totalCities.toLocaleString()} cities. Data accuracy is dependent
              on Google Maps listings and individual business website content at
              the time of collection. This report is updated periodically as new
              data is gathered.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
