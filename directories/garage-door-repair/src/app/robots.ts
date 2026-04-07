import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
      },
      {
        userAgent: "AhrefsBot",
        allow: "/",
        crawlDelay: 2,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        crawlDelay: 1,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
