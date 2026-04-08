import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `About | ${siteConfig.name}`,
  description:
    "Orlando Detailer is the Orlando area's most comprehensive directory for auto detailing, window tinting, and vehicle wrap services.",
};

export default function AboutPage() {
  return (
    <div className="container py-8 sm:py-12 max-w-3xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
        About Orlando Detailer
      </h1>

      <div className="prose prose-gray max-w-none">
        <p>
          Orlando Detailer is the Orlando metro area&apos;s most comprehensive
          directory for auto detailing, window tinting, and vehicle wrap
          services. We connect vehicle owners with trusted local professionals
          across 23 cities in Central Florida.
        </p>

        <h2>Our Mission</h2>
        <p>
          Finding the right auto care professional shouldn&apos;t be difficult.
          Whether you need a full detail before selling your car, ceramic coating
          to protect against Florida&apos;s brutal sun, or a custom vehicle wrap
          for your business fleet, we make it easy to compare shops, read
          reviews, and request quotes — all in one place.
        </p>

        <h2>What We Cover</h2>
        <ul>
          <li>
            <strong>Auto Detailing</strong> — Interior and exterior detailing,
            paint correction, ceramic coating, and mobile detailing services
          </li>
          <li>
            <strong>Window Tinting</strong> — Automotive window film
            installation, ceramic tint, and Florida tinting law guidance
          </li>
          <li>
            <strong>Vehicle Wraps</strong> — Full and partial vehicle wraps,
            commercial fleet wraps, paint protection film (PPF), and color
            change wraps
          </li>
        </ul>

        <h2>Coverage Area</h2>
        <p>
          We cover the entire Orlando metropolitan area including Orlando,
          Kissimmee, Winter Park, Lake Mary, Sanford, Altamonte Springs, Oviedo,
          Clermont, Apopka, Daytona Beach, and more. Our directory includes over
          1,000 verified business listings.
        </p>

        <h2>Get in Touch</h2>
        <p>
          Have a question or want to list your business?{" "}
          <Link href="/contact" className="text-amber-600 hover:text-amber-700">
            Contact us
          </Link>{" "}
          or{" "}
          <Link
            href="/list-your-business"
            className="text-amber-600 hover:text-amber-700"
          >
            submit your business listing
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
