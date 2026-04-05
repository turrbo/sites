import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `About Us - Garage Door Repair Directory | Find Local Garage Door Services`,
  description:
    "Learn about the Garage Door Repair Directory, the trusted online resource for finding licensed, reviewed garage door repair companies across the United States.",
  openGraph: {
    title: "About Us | Garage Door Repair Directory",
    description:
      "The most comprehensive directory of garage door repair companies in the US. Find trusted local pros for installation, repair, and maintenance.",
    url: `${siteConfig.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="container py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
          About Garage Door Repair Directory
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 leading-relaxed">
            Garage Door Repair Directory is the most comprehensive online resource for
            finding trusted, local garage door repair companies across the United States.
            Whether you need emergency garage door repair, a new garage door installation,
            spring replacement, or routine maintenance, our directory connects homeowners
            with qualified professionals in their area.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Finding a reliable garage door repair service shouldn&apos;t be stressful.
            We built this directory to make it easy for homeowners to compare local
            garage door companies, read real customer reviews, and choose the right
            professional for their needs. Every listing in our directory includes
            verified contact information, service details, and ratings from real
            customers.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            What We Cover
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Our directory features garage door repair professionals who offer a wide
            range of services, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
            <li>Garage door spring repair and replacement (torsion and extension springs)</li>
            <li>Garage door opener installation and repair</li>
            <li>Broken cable and track repair</li>
            <li>New garage door installation (residential and commercial)</li>
            <li>Garage door panel replacement</li>
            <li>Emergency garage door service (24/7 availability)</li>
            <li>Garage door maintenance and tune-ups</li>
            <li>Smart garage door opener upgrades</li>
            <li>Insulated garage door installation</li>
            <li>Commercial overhead door repair</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Cities We Serve
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We currently feature garage door repair companies in major cities including
            New York, Los Angeles, Chicago, Houston, Phoenix, Philadelphia, San Antonio,
            San Diego, Dallas, and Austin. We are continuously expanding our directory
            to include more cities and service areas across all 50 states.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            For Business Owners
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Are you a garage door repair company looking to grow your business? Our
            directory helps thousands of homeowners find local garage door services
            every month.{" "}
            <Link
              href="/list-your-business"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              List your business
            </Link>{" "}
            to increase your online visibility, attract new customers, and stand out
            from the competition with a featured listing.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Helpful Resources
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Beyond our directory listings, we publish in-depth{" "}
            <Link
              href="/#guides"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              garage door repair guides
            </Link>{" "}
            covering topics like repair costs, choosing the right garage door material,
            DIY maintenance tips, and when to call a professional. Our guides are written
            to help homeowners make informed decisions and save money on garage door
            services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Have questions, feedback, or need help finding a garage door repair company
            near you? Visit our{" "}
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              contact page
            </Link>{" "}
            to get in touch with our team. We&apos;re here to help.
          </p>
        </div>
      </div>
    </div>
  );
}
