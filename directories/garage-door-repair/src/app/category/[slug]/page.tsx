import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import {
  getListingsByCategory,
  getAllCategories,
} from "@/lib/sheets";
import { generateBreadcrumbJsonLd, generateItemListJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ListingGrid from "@/components/ListingGrid";

export const revalidate = 3600;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categories = await getAllCategories();
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return {};

  const title =
    category.metaTitle ||
    `Best ${category.name} Near You | ${siteConfig.name}`;
  const description =
    category.metaDescription ||
    category.description ||
    `Browse top-rated ${category.name} businesses and services. Find reviews, contact info, and more.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/category/${category.slug}`,
    },
  };
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const categories = await getAllCategories();
  const category = categories.find((c) => c.slug === params.slug);

  if (!category) notFound();

  const listings = await getListingsByCategory(category.name);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Categories", url: "/#categories" },
    { name: category.name, url: `/category/${category.slug}` },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);
  const itemListJsonLd = generateItemListJsonLd(
    `${category.name} Directory`,
    listings
  );

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6">
          {category.icon && (
            <span className="text-4xl mb-3 block">{category.icon}</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-gray-600 mb-2">{category.description}</p>
          )}
          <p className="text-gray-500 text-sm mb-8">
            {listings.length} listing{listings.length !== 1 ? "s" : ""} found
          </p>

          <ListingGrid listings={listings} />
        </div>
      </div>
    </>
  );
}
