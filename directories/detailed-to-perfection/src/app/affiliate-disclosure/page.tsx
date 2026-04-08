import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description: `Affiliate disclosure for ${siteConfig.name}. How we earn revenue through product recommendations.`,
};

export default function AffiliateDisclosurePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Affiliate Disclosure
      </h1>

      <div className="prose prose-gray max-w-none">
        <p>
          <strong>{siteConfig.name}</strong> is a participant in the Amazon
          Services LLC Associates Program, an affiliate advertising program
          designed to provide a means for sites to earn advertising fees by
          advertising and linking to Amazon.com.
        </p>

        <h2>How It Works</h2>
        <p>
          When you click on a product link on our site and make a purchase on
          Amazon, we may receive a small commission at no additional cost to you.
          This commission helps us maintain and improve this website, allowing us
          to continue providing free, high-quality content.
        </p>

        <h2>Our Commitment to Honest Reviews</h2>
        <p>
          Earning commissions does not influence our editorial content. Our
          product reviews and recommendations are based on thorough research and
          honest evaluation. We will never recommend a product solely because it
          offers a higher commission.
        </p>
        <p>Our review criteria include:</p>
        <ul>
          <li>Real-world performance and effectiveness</li>
          <li>Value for money</li>
          <li>Ease of use</li>
          <li>Customer reviews and reputation</li>
          <li>Durability and longevity</li>
        </ul>

        <h2>Identifying Affiliate Links</h2>
        <p>
          Affiliate links on our site are typically labeled as "Check Price on
          Amazon" or similar. Product review pages include a disclosure banner at
          the top of the article.
        </p>

        <h2>FTC Compliance</h2>
        <p>
          In accordance with the Federal Trade Commission's guidelines on
          endorsements and testimonials, we disclose our material relationships
          with advertisers. This page serves as our disclosure in compliance with
          the FTC's 16 CFR Part 255.
        </p>

        <h2>Questions?</h2>
        <p>
          If you have any questions about our affiliate relationships, please
          contact us at{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      </div>
    </div>
  );
}
