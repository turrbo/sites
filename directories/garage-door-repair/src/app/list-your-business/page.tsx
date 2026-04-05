import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import ListingForm from "./ListingForm";

export const metadata: Metadata = {
  title: `List Your Business | ${siteConfig.name}`,
  description:
    "Get your garage door repair business listed on the top directory. Reach local customers searching for garage door services.",
};

export default function ListYourBusinessPage() {
  return (
    <div className="container py-8 sm:py-12">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          List Your Garage Door Business
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get found by customers searching for garage door repair services in
          your area. Join the directory trusted by homeowners nationwide.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 sm:mb-16">
        {/* Basic */}
        <div className="border border-gray-200 rounded-xl p-6 sm:p-8 bg-white">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Basic Listing
          </h2>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold text-gray-900">$99</span>
            <span className="text-gray-500">/year</span>
          </div>
          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              Business name, address, phone, website
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              Listed on your city page
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              Dedicated listing page with SEO
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              Business description and hours
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              Click-to-call and website link
            </li>
          </ul>
        </div>

        {/* Featured */}
        <div className="border-2 border-blue-600 rounded-xl p-6 sm:p-8 bg-white relative">
          <span className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Most Popular
          </span>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Featured Listing
          </h2>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold text-blue-600">$299</span>
            <span className="text-gray-500">/year</span>
          </div>
          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              Everything in Basic
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">&#9733;</span>
              <strong>Pinned to top</strong> of your city page
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">&#9733;</span>
              <strong>Featured on homepage</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">&#9733;</span>
              Highlighted card with badge
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">&#9733;</span>
              Priority placement in search
            </li>
          </ul>
        </div>
      </div>

      {/* Submission Form */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Submit Your Business
          </h2>
          <p className="text-gray-600 mb-6">
            Fill out the form below and select your plan. After payment, your
            listing will be reviewed and published within 24 hours.
          </p>
          <ListingForm />
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-12 sm:mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-2">
              How long until my listing is live?
            </h3>
            <p className="text-gray-600 text-sm">
              Listings are reviewed and published within 24 hours of payment.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I upgrade from Basic to Featured later?
            </h3>
            <p className="text-gray-600 text-sm">
              Yes. Contact us and we will upgrade your listing. You only pay the
              difference for the remainder of your term.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-2">
              What happens after my year is up?
            </h3>
            <p className="text-gray-600 text-sm">
              We will send a renewal reminder before your listing expires. If you
              do not renew, your listing will be removed from the directory.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I edit my listing after it is published?
            </h3>
            <p className="text-gray-600 text-sm">
              Yes. Email us with your changes and we will update your listing
              within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
