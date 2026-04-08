"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";

type VehicleSize = "sedan" | "suv" | "van";

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  hasCondition?: boolean;
  hasTier?: boolean;
  hasWindows?: boolean;
  hasCoverage?: boolean;
}

const services: ServiceOption[] = [
  { id: "full-detail", name: "Full Detail (Interior + Exterior)", description: "Complete interior and exterior cleaning and restoration", hasCondition: true },
  { id: "exterior-detail", name: "Exterior Detail Only", description: "Wash, clay bar, polish, and protect exterior surfaces", hasCondition: true },
  { id: "interior-detail", name: "Interior Detail Only", description: "Deep clean seats, carpets, dashboard, and all interior surfaces", hasCondition: true },
  { id: "ceramic-coating", name: "Ceramic Coating", description: "Long-lasting paint protection with hydrophobic properties", hasTier: true },
  { id: "ppf", name: "Paint Protection Film (PPF)", description: "Clear urethane film to protect paint from chips and scratches", hasCoverage: true },
  { id: "window-tint", name: "Window Tinting", description: "UV-blocking window film installation", hasWindows: true },
  { id: "full-wrap", name: "Vehicle Wrap (Full)", description: "Complete color-change or custom wrap", },
  { id: "partial-wrap", name: "Vehicle Wrap (Partial)", description: "Partial wrap, accents, or graphics" },
  { id: "paint-correction", name: "Paint Correction / Polish", description: "Remove swirls, scratches, and oxidation", hasCondition: true },
  { id: "headlight-restore", name: "Headlight Restoration", description: "Restore cloudy, yellowed headlights to clear" },
  { id: "engine-bay", name: "Engine Bay Cleaning", description: "Degrease and detail the engine compartment" },
];

// National average pricing: [sedan-low, sedan-high, suv-low, suv-high, van-low, van-high]
const basePrices: Record<string, number[]> = {
  "full-detail":       [150, 300, 200, 400, 250, 500],
  "exterior-detail":   [75, 150, 100, 200, 125, 250],
  "interior-detail":   [100, 200, 125, 275, 150, 325],
  "ceramic-coating":   [500, 1000, 700, 1500, 900, 2000],
  "ppf":               [1500, 3000, 2000, 4000, 2500, 5000],
  "window-tint":       [150, 300, 200, 400, 250, 500],
  "full-wrap":         [2500, 5000, 3500, 6500, 4500, 8000],
  "partial-wrap":      [500, 1500, 700, 2000, 900, 2500],
  "paint-correction":  [200, 500, 300, 700, 350, 850],
  "headlight-restore": [50, 100, 50, 100, 50, 100],
  "engine-bay":        [75, 150, 100, 200, 100, 200],
};

// Condition multipliers
const conditionMultiplier: Record<string, number> = {
  light: 1.0,
  moderate: 1.3,
  heavy: 1.6,
};

// Ceramic tier multipliers
const tierMultiplier: Record<string, number> = {
  "1-year": 0.7,
  "3-year": 1.0,
  "5-year": 1.4,
};

// PPF coverage multipliers
const coverageMultiplier: Record<string, number> = {
  partial: 0.5,
  front: 0.7,
  full: 1.0,
};

// Window count multipliers
const windowMultiplier: Record<string, number> = {
  "2": 0.5,
  "4": 0.7,
  "5": 0.85,
  "all": 1.0,
};

export default function CostCalculator() {
  const [service, setService] = useState("full-detail");
  const [size, setSize] = useState<VehicleSize>("sedan");
  const [condition, setCondition] = useState("moderate");
  const [tier, setTier] = useState("3-year");
  const [coverage, setCoverage] = useState("full");
  const [windows, setWindows] = useState("all");

  const activeService = services.find((s) => s.id === service)!;

  function calcPrice(): [number, number] {
    const sizeIdx = size === "sedan" ? 0 : size === "suv" ? 2 : 4;
    const base = basePrices[service] || basePrices["full-detail"];
    let low = base[sizeIdx];
    let high = base[sizeIdx + 1];

    if (activeService.hasCondition) {
      const mult = conditionMultiplier[condition] || 1;
      low = Math.round(low * mult);
      high = Math.round(high * mult);
    }

    if (activeService.hasTier) {
      const mult = tierMultiplier[tier] || 1;
      low = Math.round(low * mult);
      high = Math.round(high * mult);
    }

    if (activeService.hasCoverage) {
      const mult = coverageMultiplier[coverage] || 1;
      low = Math.round(low * mult);
      high = Math.round(high * mult);
    }

    if (activeService.hasWindows) {
      const mult = windowMultiplier[windows] || 1;
      low = Math.round(low * mult);
      high = Math.round(high * mult);
    }

    return [low, high];
  }

  const [low, high] = calcPrice();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Controls */}
      <div className="lg:col-span-2 space-y-6">
        {/* Service type */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Service Type
          </label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">{activeService.description}</p>
        </div>

        {/* Vehicle size */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Vehicle Size
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["sedan", "suv", "van"] as VehicleSize[]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  size === s
                    ? "bg-amber-500 border-amber-500 text-gray-900"
                    : "bg-white border-gray-300 text-gray-700 hover:border-amber-300"
                }`}
              >
                {s === "sedan" ? "Sedan / Coupe" : s === "suv" ? "SUV / Truck" : "Van / Large"}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        {activeService.hasCondition && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Condition
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["light", "moderate", "heavy"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    condition === c
                      ? "bg-amber-500 border-amber-500 text-gray-900"
                      : "bg-white border-gray-300 text-gray-700 hover:border-amber-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ceramic tier */}
        {activeService.hasTier && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Coating Tier
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["1-year", "3-year", "5-year"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    tier === t
                      ? "bg-amber-500 border-amber-500 text-gray-900"
                      : "bg-white border-gray-300 text-gray-700 hover:border-amber-300"
                  }`}
                >
                  {t.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PPF coverage */}
        {activeService.hasCoverage && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Coverage Area
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "partial", label: "Partial (Hood Only)" },
                { id: "front", label: "Full Front End" },
                { id: "full", label: "Full Body" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCoverage(c.id)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    coverage === c.id
                      ? "bg-amber-500 border-amber-500 text-gray-900"
                      : "bg-white border-gray-300 text-gray-700 hover:border-amber-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Window count */}
        {activeService.hasWindows && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Windows to Tint
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: "2", label: "Front 2" },
                { id: "4", label: "4 Windows" },
                { id: "5", label: "5 Windows" },
                { id: "all", label: "All + Rear" },
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWindows(w.id)}
                  className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    windows === w.id
                      ? "bg-amber-500 border-amber-500 text-gray-900"
                      : "bg-white border-gray-300 text-gray-700 hover:border-amber-300"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price display */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 bg-gray-900 rounded-2xl p-6 text-white">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">
            Estimated Cost
          </h3>
          <div className="text-3xl font-bold text-amber-400 mb-1">
            ${low.toLocaleString()} -- ${high.toLocaleString()}
          </div>
          <p className="text-sm text-gray-400 mb-6">
            National average for {activeService.name.toLowerCase()}
          </p>

          <div className="space-y-2 text-sm text-gray-300 mb-6">
            <div className="flex justify-between">
              <span>Service</span>
              <span className="font-medium text-white">{activeService.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Vehicle</span>
              <span className="font-medium text-white capitalize">{size}</span>
            </div>
            {activeService.hasCondition && (
              <div className="flex justify-between">
                <span>Condition</span>
                <span className="font-medium text-white capitalize">{condition}</span>
              </div>
            )}
            {activeService.hasTier && (
              <div className="flex justify-between">
                <span>Tier</span>
                <span className="font-medium text-white">{tier.replace("-", " ")}</span>
              </div>
            )}
          </div>

          <a
            href={siteConfig.localDirectory}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-3 rounded-lg font-medium bg-amber-500 text-gray-900 hover:bg-amber-400 transition-colors"
          >
            Find a Local Pro
          </a>
          <p className="text-xs text-gray-500 text-center mt-2">
            Get free quotes from shops near you
          </p>
        </div>
      </div>
    </div>
  );
}
