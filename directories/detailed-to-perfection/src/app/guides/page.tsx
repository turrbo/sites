import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getGuides } from "@/lib/sheets";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Auto Care Guides",
  description:
    "Step-by-step guides for auto detailing, ceramic coating application, paint correction, window tinting, and vehicle wrap care.",
};

export default async function GuidesPage() {
  const guides = await getGuides();

  // Group by category
  const grouped = new Map<string, typeof guides>();
  for (const g of guides) {
    const cat = g.category || "General";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(g);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Auto Care Guides
      </h1>
      <p className="text-gray-600 mb-10">
        Learn from the pros. Step-by-step guides for every aspect of vehicle
        care and protection.
      </p>

      {guides.length > 0 ? (
        <div className="space-y-12">
          {Array.from(grouped.entries()).map(([category, categoryGuides]) => (
            <section key={category}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="card overflow-hidden hover:border-amber-200"
                  >
                    <div className="relative h-40 bg-gray-100">
                      <Image
                        src={`/images/guides/${guide.slug}.png`}
                        alt={guide.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                        {guide.title}
                      </h3>
                      {guide.publishedAt && (
                        <p className="text-xs text-gray-400">
                          {new Date(guide.publishedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">
            Guides coming soon! We're building a comprehensive library of auto
            care tutorials.
          </p>
        </div>
      )}

      {/* Cross-link to local directory */}
      <div className="mt-16 p-8 bg-gray-900 rounded-2xl text-center text-white">
        <h2 className="text-2xl font-bold mb-3">Rather Leave It to a Pro?</h2>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">
          Find trusted auto detailing, tinting, and wrap professionals in the
          Orlando area.
        </p>
        <a
          href={siteConfig.localDirectory}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Find a Local Pro
        </a>
      </div>
    </div>
  );
}
