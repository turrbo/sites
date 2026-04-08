import type { Metadata } from "next";
import CostCalculator from "@/components/CostCalculator";

export const metadata: Metadata = {
  title: "Auto Care Cost Calculator",
  description:
    "Estimate the cost of auto detailing, ceramic coating, PPF, window tinting, and vehicle wraps. Compare national average prices by service and vehicle size.",
};

export default function CostCalculatorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Auto Care Cost Calculator
      </h1>
      <p className="text-gray-600 mb-10 max-w-2xl">
        Get an instant estimate for professional auto care services. Select your
        service type, vehicle size, and options to see national average pricing.
      </p>

      <CostCalculator />

      <div className="mt-16 max-w-3xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          How We Calculate Prices
        </h2>
        <div className="prose prose-gray prose-sm max-w-none">
          <p>
            Our estimates are based on national average pricing data collected
            from professional detailing shops across the United States. Actual
            prices may vary based on your location, the specific products used,
            and the shop you choose.
          </p>
          <p>
            <strong>Factors that affect pricing:</strong>
          </p>
          <ul>
            <li>Vehicle size and type (compact cars cost less than full-size trucks)</li>
            <li>Current condition (heavily neglected vehicles require more work)</li>
            <li>Product quality (professional-grade vs. entry-level products)</li>
            <li>Geographic location (major metro areas tend to be higher)</li>
            <li>Shop reputation and certifications</li>
          </ul>
          <p>
            For the most accurate pricing, we recommend getting quotes from
            multiple shops in your area.
          </p>
        </div>
      </div>
    </div>
  );
}
