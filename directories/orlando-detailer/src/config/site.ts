export const siteConfig = {
  // --- CUSTOMIZE THESE ---
  name: "Orlando Detailer",
  description: "Find the best auto detailing, window tinting, and vehicle wrap shops in the Orlando area.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://orlandodetailer.com",

  // Used in meta tags, structured data, and footer
  tagline: "Orlando's Premier Auto Care Directory",

  // Default OG image (place in /public)
  ogImage: "/og-image.png",

  // Contact info for footer
  email: "hello@orlandodetailer.com",

  // Social links (leave empty to hide)
  social: {
    twitter: "",
    facebook: "",
    instagram: "",
  },

  // Nav links
  nav: [
    { label: "Home", href: "/" },
    { label: "Browse", href: "/browse" },
    { label: "Get Quotes", href: "/get-quotes" },
    { label: "Cost Calculator", href: "/cost-calculator" },
    { label: "Guides", href: "/guides" },
    { label: "Blog", href: "/blog" },
    { label: "List Your Business", href: "/list-your-business" },
  ],

  // Footer links
  footerLinks: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
  ],

  // Theme colors (used in Tailwind config)
  colors: {
    primary: "#0f172a",
    secondary: "#f59e0b",
    accent: "#3b82f6",
  },

  // How many listings per page on grid views
  listingsPerPage: 24,

  // ISR revalidation in seconds
  revalidate: 3600,
};
