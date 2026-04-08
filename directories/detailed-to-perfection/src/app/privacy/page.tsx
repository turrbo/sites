import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${siteConfig.name}.`,
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

      <div className="prose prose-gray max-w-none">
        <p><em>Last updated: April 2026</em></p>

        <h2>Information We Collect</h2>
        <p>
          We collect minimal information to improve your experience on our site.
          This may include anonymized usage data through Google Analytics, such
          as pages visited, time on site, and general location (country/region).
        </p>

        <h2>Cookies</h2>
        <p>
          We use essential cookies required for site functionality and analytics
          cookies (Google Analytics) to understand how visitors use our site. You
          can disable cookies in your browser settings.
        </p>

        <h2>Affiliate Links</h2>
        <p>
          Our site contains affiliate links to Amazon.com and other retailers.
          When you click these links and make a purchase, we may earn a
          commission. These links use cookies to track purchases and attribute
          them to our site. See our{" "}
          <a href="/affiliate-disclosure">Affiliate Disclosure</a> for details.
        </p>

        <h2>Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>Google Analytics</strong> -- website traffic analysis</li>
          <li><strong>Amazon Associates</strong> -- affiliate program</li>
          <li><strong>Cloudflare</strong> -- CDN and security</li>
        </ul>

        <h2>Data Retention</h2>
        <p>
          Analytics data is retained according to Google Analytics default
          settings (26 months). We do not store personal information on our
          servers.
        </p>

        <h2>Your Rights</h2>
        <p>
          You have the right to opt out of analytics tracking by using browser
          extensions like Google Analytics Opt-out or by enabling Do Not Track in
          your browser.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy-related inquiries, email us at{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      </div>
    </div>
  );
}
