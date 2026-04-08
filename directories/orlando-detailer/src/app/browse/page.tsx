import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getCityGroups, getAllCategories, slugify } from "@/lib/sheets";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { resolveIcon } from "@/lib/icons";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Browse Auto Detailing Shops | ${siteConfig.name}`,
  description:
    "Browse auto detailing, window tinting, and vehicle wrap shops across the Orlando metro area. Find local pros by city and service type.",
  openGraph: {
    title: `Browse Auto Detailing Shops | ${siteConfig.name}`,
    description:
      "Browse auto detailing, window tinting, and vehicle wrap shops across the Orlando metro area.",
    url: `${siteConfig.url}/browse`,
  },
};

export default async function BrowsePage() {
  const [cityGroups, categories] = await Promise.all([
    getCityGroups(),
    getAllCategories(),
  ]);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Browse", url: "/browse" },
  ];

  const totalListings = cityGroups.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Auto Detailing Shops
          </h1>
          <p className="text-gray-600 mb-8">
            {totalListings} shops across {cityGroups.length}{" "}
            {cityGroups.length === 1 ? "city" : "cities"} in the Orlando area
          </p>

          {/* Browse by Category */}
          {categories.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Browse by Service
              </h2>
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-800 font-medium text-sm rounded-lg border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all"
                  >
                    {cat.icon && <span>{resolveIcon(cat.icon)}</span>}
                    {cat.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Browse by City */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Browse by City
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityGroups.map((cg) => (
                <Link
                  key={`${cg.city}-${cg.state}`}
                  href={`/${slugify(cg.city)}`}
                  className="group block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-amber-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                        {cg.city}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {cg.count} {cg.count === 1 ? "shop" : "shops"}
                      </p>
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 bg-gray-100 group-hover:bg-amber-50 text-gray-500 group-hover:text-amber-600 rounded-full transition-colors text-sm">
                      &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
