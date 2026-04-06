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

      {/* Trust Badge Section */}
      <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Get Your Trust Badge
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every listed business gets an embeddable trust badge to display on
              their website. Badges build credibility with homeowners and link
              back to your listing in our directory.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mb-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-semibold text-gray-700 text-sm">Listed</h3>
              <p className="text-xs text-gray-500 mt-1">All businesses</p>
            </div>
            <div className="bg-white rounded-lg border border-blue-200 p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="font-semibold text-blue-700 text-sm">Verified</h3>
              <p className="text-xs text-gray-500 mt-1">3.5+ rating, website, reviews</p>
            </div>
            <div className="bg-white rounded-lg border border-amber-200 p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 mb-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              </div>
              <h3 className="font-semibold text-amber-700 text-sm">Top Rated</h3>
              <p className="text-xs text-gray-500 mt-1">4.3+ rating, 25+ reviews</p>
            </div>
            <div className="bg-white rounded-lg border border-indigo-200 p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 mb-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <h3 className="font-semibold text-indigo-700 text-sm">Featured</h3>
              <p className="text-xs text-gray-500 mt-1">Top Rated + Featured plan</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">How It Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-900">1. Get listed</span>
                <p className="mt-0.5">Submit your business and your badge is generated automatically based on your Google ratings and reviews.</p>
              </div>
              <div>
                <span className="font-medium text-gray-900">2. Copy the embed code</span>
                <p className="mt-0.5">Visit your badge page and copy a simple HTML snippet to paste on your website footer or sidebar.</p>
              </div>
              <div>
                <span className="font-medium text-gray-900">3. Build trust</span>
                <p className="mt-0.5">The badge shows homeowners you are recognized by an independent directory, and links back to your listing for SEO value.</p>
              </div>
            </div>
          </div>
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
