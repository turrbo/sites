import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Detailed To Perfection - your trusted source for auto care product reviews and guides.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About Us</h1>

      <div className="prose prose-gray max-w-none">
        <p>
          <strong>Detailed To Perfection</strong> is your go-to resource for
          honest, in-depth product reviews and expert guides covering auto
          detailing, ceramic coating, paint protection film (PPF), window
          tinting, and vehicle wraps.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe every car owner deserves access to unbiased, expert-level
          information about vehicle care products. Whether you're a weekend
          warrior doing your first detail or a seasoned enthusiast looking for
          the best ceramic coating on the market, we're here to help you make
          informed decisions.
        </p>

        <h2>What We Cover</h2>
        <ul>
          <li><strong>Product Reviews</strong> -- honest, hands-on evaluations of detailing products, coatings, polishers, and more</li>
          <li><strong>How-To Guides</strong> -- step-by-step tutorials for DIY enthusiasts</li>
          <li><strong>Cost Calculators</strong> -- estimate what professional services cost in your area</li>
          <li><strong>Industry News</strong> -- the latest trends and innovations in auto care</li>
        </ul>

        <h2>Our Review Process</h2>
        <p>
          Every product we review is evaluated on real-world performance, value
          for money, ease of use, and durability. We compare products
          side-by-side and provide clear recommendations so you know exactly
          what you're getting.
        </p>

        <h2>Need a Professional?</h2>
        <p>
          If you'd rather leave the work to the experts, check out{" "}
          <a href={siteConfig.localDirectory} target="_blank" rel="noopener noreferrer">
            Orlando Detailer
          </a>{" "}
          -- our local directory of trusted auto detailing, tinting, and wrap
          shops in the Orlando area.
        </p>
      </div>
    </div>
  );
}
