import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getAllListings } from "@/lib/sheets";
import ListingGrid from "@/components/ListingGrid";
import SearchBar from "@/components/SearchBar";

export const revalidate = 3600;

interface Props {
  searchParams: { q?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = searchParams.q || "";
  return {
    title: q
      ? `Search results for "${q}" | ${siteConfig.name}`
      : `Search | ${siteConfig.name}`,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = (searchParams.q || "").trim().toLowerCase();
  const allListings = await getAllListings();

  const results = query
    ? allListings.filter((l) => {
        const searchable = [
          l.name,
          l.city,
          l.state,
          l.stateFull,
          l.description,
          l.address,
          l.tags?.join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return query.split(/\s+/).every((word) => searchable.includes(word));
      })
    : [];

  // Sort featured to top
  results.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="container py-8 sm:py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Listings</h1>

      <div className="max-w-xl mb-8">
        <SearchBar
          placeholder="Search by city, state, or business name..."
          initialValue={searchParams.q || ""}
        />
      </div>

      {query ? (
        <>
          <p className="text-gray-600 mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{searchParams.q}&rdquo;
          </p>
          <ListingGrid listings={results} />
        </>
      ) : (
        <p className="text-gray-500">Enter a search term above to find listings.</p>
      )}
    </div>
  );
}
