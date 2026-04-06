"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  ResearchStats,
  StateRating,
} from "./page";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function HBar({
  label,
  value,
  maxValue,
  suffix,
  color = "bg-blue-600",
}: {
  label: string;
  value: number;
  maxValue: number;
  suffix?: string;
  color?: string;
}) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-40 sm:w-52 text-sm text-gray-700 truncate flex-shrink-0">
        {label}
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div
          className={`${color} h-5 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-20 text-sm text-gray-600 text-right flex-shrink-0">
        {typeof value === "number" && value % 1 !== 0
          ? value.toFixed(1)
          : value.toLocaleString()}
        {suffix || ""}
      </div>
    </div>
  );
}

function SectionHeader({ id, title }: { id: string; title: string }) {
  return (
    <h2
      id={id}
      className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200 scroll-mt-20"
    >
      {title}
    </h2>
  );
}

const TOC_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "geography", label: "Quality by Geography" },
  { id: "longevity", label: "Business Longevity" },
  { id: "digital", label: "Digital Presence" },
  { id: "reviews", label: "Reviews & Ratings" },
  { id: "services", label: "Common Services" },
];

type SortKey = "stateFull" | "avgRating" | "count";
type SortDir = "asc" | "desc";

export default function ResearchDashboard({ stats }: { stats: ResearchStats }) {
  const [sortKey, setSortKey] = useState<SortKey>("avgRating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "stateFull" ? "asc" : "desc");
    }
  }

  const sortedStates = [...stats.ratingByState].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";

  const maxCityRating = stats.topCities.length > 0 ? 5 : 1;
  const maxReviewDist =
    stats.reviewDistribution.length > 0
      ? Math.max(...stats.reviewDistribution.map((d) => d.count))
      : 1;
  const maxRatingDist =
    stats.ratingDistribution.length > 0
      ? Math.max(...stats.ratingDistribution.map((d) => d.count))
      : 1;
  const maxAgeDist =
    stats.ageDistribution.length > 0
      ? Math.max(...stats.ageDistribution.map((d) => d.count))
      : 1;
  const maxService =
    stats.topServices.length > 0
      ? Math.max(...stats.topServices.map((s) => s.count))
      : 1;

  return (
    <div className="lg:flex lg:gap-10">
      {/* TOC Sidebar */}
      <nav className="hidden lg:block lg:w-48 flex-shrink-0">
        <div className="sticky top-24">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Sections
          </p>
          <ul className="space-y-2">
            {TOC_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Hero Stats */}
        <section id="overview" className="mb-12 scroll-mt-20">
          <SectionHeader id="overview-h" title="Industry at a Glance" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              label="Businesses Surveyed"
              value={stats.totalBusinesses.toLocaleString()}
            />
            <StatCard
              label="Cities Covered"
              value={stats.totalCities.toLocaleString()}
            />
            <StatCard
              label="States Covered"
              value={stats.totalStates.toString()}
            />
            <StatCard
              label="Avg Rating"
              value={stats.avgRating.toFixed(2)}
              sub="out of 5.0"
            />
            <StatCard
              label="Avg Years in Business"
              value={stats.avgAge > 0 ? stats.avgAge.toFixed(0) : "N/A"}
              sub={stats.avgAge > 0 ? "years" : ""}
            />
          </div>
        </section>

        {/* Quality by Geography */}
        <section id="geography" className="mb-12 scroll-mt-20">
          <SectionHeader id="geography-h" title="Quality by Geography" />

          {/* State Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 overflow-x-auto">
            <h3 className="font-semibold text-gray-900 mb-3">
              Average Rating by State
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th
                    className="py-2 px-2 cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("stateFull")}
                  >
                    State{sortIndicator("stateFull")}
                  </th>
                  <th
                    className="py-2 px-2 cursor-pointer hover:text-blue-600 text-right"
                    onClick={() => handleSort("avgRating")}
                  >
                    Avg Rating{sortIndicator("avgRating")}
                  </th>
                  <th
                    className="py-2 px-2 cursor-pointer hover:text-blue-600 text-right"
                    onClick={() => handleSort("count")}
                  >
                    Businesses{sortIndicator("count")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStates.map((s) => (
                  <tr
                    key={s.state}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-1.5 px-2">
                      <Link
                        href={`/${s.state.toLowerCase()}`}
                        className="text-blue-600 hover:underline"
                      >
                        {s.stateFull}
                      </Link>
                    </td>
                    <td className="py-1.5 px-2 text-right font-medium">
                      {s.avgRating.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-gray-500">
                      {s.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Cities */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Top 10 Highest-Rated Cities
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Minimum 3 businesses per city
            </p>
            {stats.topCities.slice(0, 10).map((c) => (
              <HBar
                key={`${c.city}-${c.state}`}
                label={`${c.city}, ${c.state}`}
                value={c.avgRating}
                maxValue={maxCityRating}
                suffix={` (${c.count})`}
              />
            ))}
          </div>

          {/* Bottom Cities */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              10 Cities With Most Room for Improvement
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Minimum 3 businesses per city
            </p>
            {stats.bottomCities.slice(0, 10).map((c) => (
              <HBar
                key={`${c.city}-${c.state}`}
                label={`${c.city}, ${c.state}`}
                value={c.avgRating}
                maxValue={maxCityRating}
                suffix={` (${c.count})`}
                color="bg-amber-500"
              />
            ))}
          </div>
        </section>

        {/* Business Longevity */}
        <section id="longevity" className="mb-12 scroll-mt-20">
          <SectionHeader id="longevity-h" title="Business Longevity" />
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Years in Business Distribution
            </h3>
            {stats.ageDistribution.map((d) => (
              <HBar
                key={d.range}
                label={d.range}
                value={d.count}
                maxValue={maxAgeDist}
              />
            ))}
            <p className="text-xs text-gray-500 mt-3">
              Based on businesses with available year-established data
            </p>
          </div>
        </section>

        {/* Digital Presence */}
        <section id="digital" className="mb-12 scroll-mt-20">
          <SectionHeader id="digital-h" title="Digital Presence" />
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Platform Adoption Across All Businesses
            </h3>
            {stats.digitalPresence.map((p) => (
              <HBar
                key={p.platform}
                label={p.platform}
                value={p.percentage}
                maxValue={100}
                suffix="%"
                color="bg-blue-500"
              />
            ))}
          </div>
        </section>

        {/* Reviews & Ratings */}
        <section id="reviews" className="mb-12 scroll-mt-20">
          <SectionHeader id="reviews-h" title="Reviews & Ratings" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Review Count Distribution
              </h3>
              {stats.reviewDistribution.map((d) => (
                <HBar
                  key={d.range}
                  label={d.range}
                  value={d.count}
                  maxValue={maxReviewDist}
                />
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Rating Distribution
              </h3>
              {stats.ratingDistribution.map((d) => (
                <HBar
                  key={d.range}
                  label={d.range}
                  value={d.count}
                  maxValue={maxRatingDist}
                  color="bg-amber-500"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Common Services */}
        <section id="services" className="mb-12 scroll-mt-20">
          <SectionHeader id="services-h" title="Most Common Services" />
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Top 15 Services Offered
            </h3>
            {stats.topServices.map((s) => (
              <HBar
                key={s.service}
                label={s.service}
                value={s.count}
                maxValue={maxService}
              />
            ))}
          </div>
        </section>

        {/* Cite This */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Cite This Research
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            You are welcome to reference data from this report. Please include
            attribution:
          </p>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm text-gray-700 font-mono">
            Source: &quot;State of Garage Door Repair 2026&quot; by
            GarageDoorRepair.Directory.{" "}
            <span className="text-blue-600">
              https://garagedoorrepair.directory/research
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
