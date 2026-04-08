import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: `Contact Us | ${siteConfig.name}`,
  description:
    "Get in touch with Orlando Detailer. Questions about our directory, listing your business, or partnership opportunities.",
};

export default function ContactPage() {
  return (
    <div className="container py-8 sm:py-12 max-w-2xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
        Contact Us
      </h1>
      <p className="text-gray-600 mb-8">
        Have a question, feedback, or want to partner with us? Drop us a line
        and we&apos;ll get back to you.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
        <ContactForm />
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          You can also email us directly at{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-amber-600 hover:text-amber-700"
          >
            {siteConfig.email}
          </a>
        </p>
      </div>
    </div>
  );
}
