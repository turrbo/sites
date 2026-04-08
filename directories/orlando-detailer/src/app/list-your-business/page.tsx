import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: `List Your Business | ${siteConfig.name}`,
  description:
    "Add your auto detailing, window tinting, or vehicle wrap business to Orlando Detailer. Get found by local customers.",
};

export default function ListYourBusinessPage() {
  return (
    <div className="container py-8 sm:py-12">
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          List Your Business
        </h1>
        <p className="text-gray-600 mb-8">
          Get your auto detailing, window tinting, or vehicle wrap shop in front
          of thousands of Orlando-area vehicle owners searching for services.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <div className="text-2xl font-bold text-amber-600 mb-1">1,000+</div>
            <div className="text-sm text-gray-600">Businesses listed</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <div className="text-2xl font-bold text-amber-600 mb-1">23</div>
            <div className="text-sm text-gray-600">Cities covered</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <div className="text-2xl font-bold text-amber-600 mb-1">Free</div>
            <div className="text-sm text-gray-600">Basic listing</div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          What You Get
        </h2>
        <ul className="space-y-3 text-gray-700 mb-10">
          <li className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Your own business profile page with contact info, services, photos, and reviews</span>
          </li>
          <li className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Appear in city and category pages across the Orlando metro area</span>
          </li>
          <li className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Receive quote requests directly from potential customers</span>
          </li>
          <li className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>SEO-optimized listing to help you rank in local search results</span>
          </li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Get Started
        </h2>
        <p className="text-gray-600 mb-6">
          Fill out the form below and we&apos;ll add your business to the directory.
        </p>

        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
