export const siteConfig = {
  name: "Detailed To Perfection",
  description:
    "Expert product reviews, how-to guides, and cost calculators for auto detailing, ceramic coating, window tinting, PPF, and vehicle wraps.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://detailedtoperfection.com",
  tagline: "Your Trusted Guide to Professional Auto Care",
  ogImage: "/og-image.png",
  email: "hello@detailedtoperfection.com",

  // Amazon Associates
  amazonTag: "dealsinyourar-20",

  // Cross-site links
  localDirectory: "https://orlandodetailer.com",

  social: {
    twitter: "",
    facebook: "",
    instagram: "",
    youtube: "",
  },

  nav: [
    { label: "Home", href: "/" },
    { label: "Reviews", href: "/reviews" },
    { label: "Guides", href: "/guides" },
    { label: "Cost Calculator", href: "/cost-calculator" },
    { label: "Blog", href: "/blog" },
  ],

  footerLinks: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
  ],

  colors: {
    primary: "#111827", // gray-900
    accent: "#f59e0b", // amber-500
    highlight: "#fbbf24", // amber-400
  },

  revalidate: 3600,

  // Content categories
  categories: [
    { name: "Detailing Products", slug: "detailing-products", icon: "sparkles" },
    { name: "Ceramic Coatings", slug: "ceramic-coatings", icon: "shield" },
    { name: "Paint Protection", slug: "paint-protection", icon: "shield" },
    { name: "Window Tinting", slug: "window-tinting", icon: "sun" },
    { name: "Polishing & Correction", slug: "polishing-correction", icon: "gem" },
    { name: "Tools & Equipment", slug: "tools-equipment", icon: "wrench" },
    { name: "Vehicle Wraps", slug: "vehicle-wraps", icon: "paintbrush" },
    { name: "Car Care Basics", slug: "car-care-basics", icon: "droplet" },
  ],
};
