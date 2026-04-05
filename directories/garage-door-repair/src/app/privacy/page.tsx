import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description:
    "Privacy policy for Garage Door Repair Directory. Learn how we collect, use, and protect your personal information when using our garage door service directory.",
  openGraph: {
    title: `Privacy Policy | ${siteConfig.name}`,
    description:
      "Learn how Garage Door Repair Directory handles your personal data.",
    url: `${siteConfig.url}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="container py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: April 5, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <p className="text-gray-600 leading-relaxed">
              Garage Door Repair Directory (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;) operates the website{" "}
              <strong>garagedoorrepair.directory</strong> (the &quot;Site&quot;).
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our garage door repair
              directory website. Please read this policy carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Information We Collect
            </h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
              Information You Provide
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We collect information you voluntarily provide when using our Site,
              including:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
              <li>
                <strong>Contact form submissions:</strong> Name, email address,
                and message content when you use our contact form.
              </li>
              <li>
                <strong>Business listing submissions:</strong> Business name,
                address, phone number, email, website URL, Google Business
                Profile URL, business description, and hours of operation when
                you submit a listing.
              </li>
              <li>
                <strong>Payment information:</strong> When you purchase a
                business listing, payment is processed securely through Stripe.
                We do not store your credit card number or full payment details
                on our servers.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
              Information Collected Automatically
            </h3>
            <p className="text-gray-600 leading-relaxed">
              When you visit our Site, we may automatically collect certain
              information about your device and usage, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
              <li>IP address and approximate geographic location</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited and time spent on each page</li>
              <li>Referring website or search terms used to find our Site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              How We Use Your Information
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
              <li>
                Operate and maintain our garage door repair directory
              </li>
              <li>
                Process business listing submissions and payments
              </li>
              <li>Respond to your inquiries and contact form messages</li>
              <li>
                Improve our Site, content, and user experience
              </li>
              <li>
                Send transactional emails related to your listing or account
              </li>
              <li>
                Analyze usage patterns to improve our garage door repair guides
                and directory listings
              </li>
              <li>Prevent fraud and ensure the security of our Site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Third-Party Services
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We use the following third-party services to operate our Site:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
              <li>
                <strong>Stripe:</strong> For secure payment processing. Stripe&apos;s
                privacy policy is available at{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  stripe.com/privacy
                </a>
                .
              </li>
              <li>
                <strong>Google Sheets:</strong> For managing directory listing
                data.
              </li>
              <li>
                <strong>Vercel:</strong> For website hosting and analytics.
                Vercel&apos;s privacy policy is available at{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  vercel.com/legal/privacy-policy
                </a>
                .
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              These services may collect information as described in their
              respective privacy policies. We do not control their data
              practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Cookies
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our Site may use cookies and similar tracking technologies to
              enhance your browsing experience. Cookies are small data files
              stored on your device. You can control cookie settings through
              your browser preferences. Disabling cookies may affect some
              features of the Site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Data Security
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We implement reasonable security measures to protect your personal
              information. All data transmission is encrypted using SSL/TLS.
              Payment processing is handled by Stripe, a PCI-compliant payment
              processor. However, no method of electronic storage or transmission
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Data Retention
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information only for as long as necessary
              to fulfill the purposes described in this policy. Business listing
              data is retained for the duration of the listing subscription.
              Contact form submissions are retained for up to 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your Rights
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request data portability</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              To exercise any of these rights, please{" "}
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                contact us
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Children&apos;s Privacy
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our Site is not directed to individuals under the age of 13. We do
              not knowingly collect personal information from children. If you
              believe we have inadvertently collected information from a child,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Changes to This Policy
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated &quot;Last updated&quot;
              date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Contact Us
            </h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy or our data
              practices, please reach out through our{" "}
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                contact page
              </Link>{" "}
              or email us at{" "}
              <a
                href="mailto:garagedoorrepairdirectory@gmail.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                garagedoorrepairdirectory@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
