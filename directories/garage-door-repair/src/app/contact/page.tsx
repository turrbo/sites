import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: `Contact Us - Garage Door Repair Directory | Get Help Finding Local Services`,
  description:
    "Contact the Garage Door Repair Directory team for questions about listings, business submissions, or help finding a garage door repair company near you.",
  openGraph: {
    title: "Contact Us | Garage Door Repair Directory",
    description:
      "Have a question about garage door repair services? Get in touch with our team.",
    url: `${siteConfig.url}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="container py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Contact Us
        </h1>
        <p className="text-gray-600 mb-8">
          Have a question about our garage door repair directory, need help finding
          a local service provider, or want to update your business listing? Fill
          out the form below and we&apos;ll get back to you as soon as possible.
        </p>

        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <ContactForm />
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Business Owners</h3>
            <p className="text-sm text-gray-600">
              Want to get your garage door repair company listed in our directory?
              Visit our{" "}
              <a
                href="/list-your-business"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                List Your Business
              </a>{" "}
              page to get started.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
            <p className="text-sm text-gray-600">
              We typically respond to inquiries within 24 hours during business days.
              For urgent garage door emergencies, we recommend contacting a local
              provider directly from our directory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
