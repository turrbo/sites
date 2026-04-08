import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: `Privacy policy for ${siteConfig.name}. How we collect, use, and protect your information.`,
};

export default function PrivacyPage() {
  return (
    <div className="container py-8 sm:py-12 max-w-3xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
        Privacy Policy
      </h1>

      <div className="prose prose-gray max-w-none">
        <p>
          <em>Last updated: April 2026</em>
        </p>

        <h2>Information We Collect</h2>
        <p>
          When you use Orlando Detailer, we may collect the following
          information:
        </p>
        <ul>
          <li>
            <strong>Quote requests:</strong> Name, email, phone number, vehicle
            information, and service details you provide when requesting quotes
          </li>
          <li>
            <strong>Contact forms:</strong> Name, email, and message content
            when you contact us
          </li>
          <li>
            <strong>Usage data:</strong> Anonymous analytics data including
            pages visited, time on site, and general location (city-level)
          </li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To connect you with relevant auto care service providers</li>
          <li>To respond to your inquiries and support requests</li>
          <li>To improve our website and services</li>
          <li>To send service-related communications</li>
        </ul>

        <h2>Information Sharing</h2>
        <p>
          When you submit a quote request, your contact information and vehicle
          details may be shared with the auto care businesses you are requesting
          quotes from. We do not sell your personal information to third parties
          for marketing purposes.
        </p>

        <h2>Data Storage</h2>
        <p>
          Your data is stored securely using Google Workspace infrastructure. We
          retain quote request data for up to 12 months to facilitate follow-up
          and improve our services.
        </p>

        <h2>Cookies</h2>
        <p>
          We use essential cookies for site functionality and analytics cookies
          (Google Analytics) to understand how visitors use our site. You can
          disable cookies in your browser settings.
        </p>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Request access to your personal data</li>
          <li>Request deletion of your personal data</li>
          <li>Opt out of analytics tracking</li>
        </ul>

        <h2>Contact</h2>
        <p>
          For privacy-related questions, email us at{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      </div>
    </div>
  );
}
