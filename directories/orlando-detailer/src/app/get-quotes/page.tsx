import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { generateFAQJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: `Get Free Quotes | ${siteConfig.name}`,
  description:
    "Request free quotes from top-rated auto detailing, window tinting, and vehicle wrap shops in the Orlando area. Compare prices with no obligation.",
  openGraph: {
    title: `Get Free Quotes | ${siteConfig.name}`,
    description:
      "Request free quotes from top-rated local shops in the Orlando area.",
    url: `${siteConfig.url}/get-quotes`,
  },
};

const faqs = [
  {
    question: "How does the free quote process work?",
    answer:
      "Fill out the form with your service type, vehicle details, and contact info. We send your request to matching shops in your area, and they reach out to you directly with pricing.",
  },
  {
    question: "Is there any cost or obligation?",
    answer:
      "Absolutely none. Requesting quotes is completely free and you are never obligated to book with any shop.",
  },
  {
    question: "How many shops will contact me?",
    answer:
      "Typically 2–4 local shops that offer the service you requested. You can compare their quotes and choose the best fit.",
  },
  {
    question: "How quickly will I hear back?",
    answer:
      "Most shops respond within a few hours during business hours. For urgent needs, calling directly is always fastest.",
  },
  {
    question: "What services can I get quotes for?",
    answer:
      "Auto detailing (full detail, paint correction, ceramic coating), window tinting, and vehicle wraps including partial and full wraps.",
  },
];

const breadcrumbItems = [
  { name: "Home", url: "/" },
  { name: "Get Free Quotes", url: "/get-quotes" },
];

export default function GetQuotesPage() {
  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={generateFAQJsonLd(faqs)} />

      <div className="container py-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero */}
        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Get Free Auto Care Quotes
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Tell us what you need and we&apos;ll connect you with the best local shops
            in the Orlando metro area — fast, free, and no obligation.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-sm font-medium text-gray-700">Free quotes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-sm font-medium text-gray-700">No obligation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-sm font-medium text-gray-700">Compare multiple shops</span>
            </div>
          </div>
        </div>

        {/* Form + FAQ layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Quote form */}
          <div className="lg:col-span-3">
            <QuoteForm />
          </div>

          {/* FAQ sidebar */}
          <aside className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Frequently Asked Questions
            </h2>
            <div className="space-y-5">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-5 last:border-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
