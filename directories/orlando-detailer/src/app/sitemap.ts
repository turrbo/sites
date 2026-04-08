import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import {
  getAllListings,
  getAllCategories,
  getCityGroups,
  getSEOPagesMeta,
  getBlogPosts,
  slugify,
} from "@/lib/sheets";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [listings, categories, cityGroups, seoPages, blogPosts] =
    await Promise.all([
      getAllListings(),
      getAllCategories(),
      getCityGroups(),
      getSEOPagesMeta(),
      getBlogPosts(),
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
    {
      url: `${base}/browse`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/get-quotes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
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

  // City pages: /{city-slug}
  const cityRoutes: MetadataRoute.Sitemap = cityGroups.map((cg) => ({
    url: `${base}/${slugify(cg.city)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // City + category combo pages: /{city-slug}/{category-slug}
  const cityCategoryRoutes: MetadataRoute.Sitemap = cityGroups.flatMap((cg) =>
    categories.map((cat) => ({
      url: `${base}/${slugify(cg.city)}/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  // SEO / Guide pages
  const guideRoutes: MetadataRoute.Sitemap = seoPages.map((page) => ({
    url: `${base}/guides/${page.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Blog pages
  const blogRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...blogPosts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [
    ...staticRoutes,
    ...listingRoutes,
    ...categoryRoutes,
    ...cityRoutes,
    ...cityCategoryRoutes,
    ...guideRoutes,
    ...blogRoutes,
  ];
}
