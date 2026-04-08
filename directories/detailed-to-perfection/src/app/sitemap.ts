import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getReviews, getGuides, getBlogPosts } from "@/lib/sheets";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [reviews, guides, blogPosts] = await Promise.all([
    getReviews(),
    getGuides(),
    getBlogPosts(),
  ]);

  const staticPages = [
    { url: siteConfig.url, priority: 1.0 },
    { url: `${siteConfig.url}/reviews`, priority: 0.9 },
    { url: `${siteConfig.url}/guides`, priority: 0.9 },
    { url: `${siteConfig.url}/blog`, priority: 0.8 },
    { url: `${siteConfig.url}/cost-calculator`, priority: 0.8 },
    { url: `${siteConfig.url}/about`, priority: 0.4 },
    { url: `${siteConfig.url}/contact`, priority: 0.4 },
    { url: `${siteConfig.url}/privacy`, priority: 0.3 },
    { url: `${siteConfig.url}/affiliate-disclosure`, priority: 0.3 },
  ].map((p) => ({
    ...p,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  const reviewPages = reviews.map((r) => ({
    url: `${siteConfig.url}/reviews/${r.slug}`,
    lastModified: r.publishedAt ? new Date(r.publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const guidePages = guides.map((g) => ({
    url: `${siteConfig.url}/guides/${g.slug}`,
    lastModified: g.publishedAt ? new Date(g.publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogPages = blogPosts.map((p) => ({
    url: `${siteConfig.url}/blog/${p.slug}`,
    lastModified: p.publishedAt ? new Date(p.publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...reviewPages, ...guidePages, ...blogPages];
}
