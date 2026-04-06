import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import CostCalculator from "./CostCalculator";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `Garage Door Repair Cost Calculator | ${siteConfig.name}`,
  description:
    "Estimate garage door repair costs instantly. Get pricing for spring replacement, opener repair, panel replacement, and more.",
  openGraph: {
    title: `Garage Door Repair Cost Calculator | ${siteConfig.name}`,
    description:
      "Estimate garage door repair costs instantly. Get pricing for spring replacement, opener repair, panel replacement, and more.",
    url: `${siteConfig.url}/cost-calculator`,
  },
};

const breadcrumbItems = [
  { name: "Home", url: "/" },
  { name: "Cost Calculator", url: "/cost-calculator" },
];

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Garage Door Repair Cost Calculator",
  description:
    "Estimate garage door repair costs instantly. Get pricing for spring replacement, opener repair, panel replacement, and more.",
  url: `${siteConfig.url}/cost-calculator`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function CostCalculatorPage() {
  return (
    <>
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={webAppJsonLd} />

      <div className="container py-8 sm:py-12">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="max-w-4xl mx-auto mt-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Garage Door Repair Cost Calculator
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            Use this free tool to instantly estimate the cost of your garage door
            repair. Select your repair type, door size, and scheduling preference
            to see a realistic price range based on national average data. Once
            you have an estimate, browse local companies to get real quotes from
            professionals in your area.
          </p>

          <CostCalculator />
        </div>
      </div>
    </>
  );
}
