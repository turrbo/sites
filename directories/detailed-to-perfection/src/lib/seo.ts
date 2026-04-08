import { Review, Guide, BlogPost } from "./types";
import { siteConfig } from "@/config/site";

export function generateArticleJsonLd(article: Guide | BlogPost, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription || "",
    url,
    datePublished: article.publishedAt || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function generateReviewJsonLd(review: Review, url: string) {
  const items = review.products.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Product",
      name: p.name,
      ...(p.rating && {
        review: {
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: p.rating,
            bestRating: 5,
          },
          author: {
            "@type": "Organization",
            name: siteConfig.name,
          },
        },
      }),
    },
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: review.title,
    description: review.metaDescription || "",
    url,
    numberOfItems: review.products.length,
    itemListElement: items,
  };
}

export function generateBlogPostJsonLd(post: BlogPost, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || post.excerpt || "",
    url,
    ...(post.imageUrl && { image: post.imageUrl }),
    datePublished: post.publishedAt || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function generateBreadcrumbJsonLd(
  items: { name: string; href: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.href}`,
    })),
  };
}
