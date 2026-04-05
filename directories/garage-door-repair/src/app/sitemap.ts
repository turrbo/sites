import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import {
  getAllListings,
  getAllCategories,
  getCityGroups,
  getStateGroups,
  getSEOPages,
} from "@/lib/sheets";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [listings, categories, cityGroups, stateGroups, seoPages] =
    await Promise.all([
      getAllListings(),
      getAllCategories(),
      getCityGroups(),
      getStateGroups(),
      getSEOPages(),
    ]);

  const base = siteConfig.url;

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Listing pages
  const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${base}/listing/${listing.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Category pages
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/category/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // State pages
  const stateRoutes: MetadataRoute.Sitemap = stateGroups.map((stateGroup) => ({
    url: `${base}/${stateGroup.state.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // City pages
  const cityRoutes: MetadataRoute.Sitemap = cityGroups.map((cityGroup) => ({
    url: `${base}/${cityGroup.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // SEO / Guide pages
  const guideRoutes: MetadataRoute.Sitemap = seoPages.map((page) => ({
    url: `${base}/guides/${page.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...listingRoutes,
    ...categoryRoutes,
    ...stateRoutes,
    ...cityRoutes,
    ...guideRoutes,
  ];
}
