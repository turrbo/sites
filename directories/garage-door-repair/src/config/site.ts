export const siteConfig = {
  // --- CUSTOMIZE THESE ---
  name: "Garage Door Repair Directory",
  description: "Find the best Garage Door Repair in your area.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",

  // Used in meta tags, structured data, and footer
  tagline: "Your trusted Garage Door Repair directory",

  // Default OG image (place in /public)
  ogImage: "/og-default.png",

  // Contact info for footer
  email: "hello@example.com",

  // Social links (leave empty to hide)
  social: {
    twitter: "",
    facebook: "",
    instagram: "",
  },

  // Nav links
  nav: [
    { label: "Home", href: "/" },
    { label: "Cities", href: "/#cities" },
    { label: "Guides", href: "/#guides" },
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
    primary: "#2563eb",
    secondary: "#7c3aed",
    accent: "#f59e0b",
  },

  // How many listings per page on grid views
  listingsPerPage: 24,

  // ISR revalidation in seconds
  revalidate: 3600,
};
