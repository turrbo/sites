import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Detailed To Perfection team.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>

      <div className="prose prose-gray max-w-none mb-8">
        <p>
          Have a question, suggestion, or want to partner with us? We'd love to
          hear from you.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h2>
        <p className="text-gray-600 mb-2">
          Email us at{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            {siteConfig.email}
          </a>
        </p>
        <p className="text-sm text-gray-500">
          We typically respond within 1-2 business days.
        </p>
      </div>

      <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Product Review Requests
        </h2>
        <p className="text-gray-600">
          Are you a manufacturer or brand that would like us to review your
          product? Email us with details about your product and we'll let you
          know if it's a fit for our audience.
        </p>
      </div>
    </div>
  );
}
