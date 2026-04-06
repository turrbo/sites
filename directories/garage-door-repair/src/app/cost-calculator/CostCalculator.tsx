"use client";

import { useState } from "react";
import Link from "next/link";

interface RepairType {
  id: string;
  name: string;
  icon: string;
  low: number;
  high: number;
  description: string;
}

const REPAIR_TYPES: RepairType[] = [
  {
    id: "spring-torsion",
    name: "Torsion Spring",
    icon: "🔧",
    low: 200,
    high: 400,
    description: "Most common spring type for residential doors",
  },
  {
    id: "spring-extension",
    name: "Extension Spring",
    icon: "🔧",
    low: 150,
    high: 250,
    description: "Found on lighter single-car doors",
  },
  {
    id: "opener-repair",
    name: "Opener Repair",
    icon: "⚡",
    low: 150,
    high: 350,
    description: "Motor, gear, circuit board, or sensor issues",
  },
  {
    id: "opener-replace",
    name: "Opener Replacement",
    icon: "⚡",
    low: 300,
    high: 700,
    description: "Full opener unit swap with installation",
  },
  {
    id: "cable",
    name: "Cable Replacement",
    icon: "🔗",
    low: 150,
    high: 250,
    description: "Frayed or snapped lift cables",
  },
  {
    id: "panel",
    name: "Panel Replacement",
    icon: "🪟",
    low: 250,
    high: 800,
    description: "Single damaged panel swap",
  },
  {
    id: "track",
    name: "Track Repair",
    icon: "📐",
    low: 125,
    high: 250,
    description: "Bent or misaligned track realignment",
  },
  {
    id: "roller",
    name: "Roller Replacement",
    icon: "⚙️",
    low: 100,
    high: 200,
    description: "Worn or broken rollers",
  },
  {
    id: "sensor",
    name: "Sensor Repair",
    icon: "👁️",
    low: 100,
    high: 175,
    description: "Photo-eye sensor alignment or replacement",
  },
  {
    id: "full-door",
    name: "New Door Installation",
    icon: "🚪",
    low: 800,
    high: 4000,
    description: "Complete garage door replacement",
  },
];

const DOUBLE_CAR_MULTIPLIER = 1.3;
const EMERGENCY_LOW_ADDER = 50;
const EMERGENCY_HIGH_ADDER = 150;

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

// Returns a 0–100 value representing where the midpoint of the range falls
// relative to all repair types (for the visual bar). We cap the high end at
// the max across all types so the bar is meaningful.
const ALL_HIGHS = REPAIR_TYPES.map((r) => r.high * DOUBLE_CAR_MULTIPLIER + EMERGENCY_HIGH_ADDER);
const GLOBAL_MAX = Math.max(...ALL_HIGHS);

function getRangePosition(low: number, high: number): number {
  const mid = (low + high) / 2;
  return Math.min(100, Math.round((mid / GLOBAL_MAX) * 100));
}

type DoorSize = "single" | "double";
type ServiceTime = "standard" | "emergency";

export default function CostCalculator() {
  const [selectedRepair, setSelectedRepair] = useState<RepairType | null>(null);
  const [doorSize, setDoorSize] = useState<DoorSize>("single");
  const [serviceTime, setServiceTime] = useState<ServiceTime>("standard");

  function handleReset() {
    setSelectedRepair(null);
    setDoorSize("single");
    setServiceTime("standard");
  }

  const estimatedLow = selectedRepair
    ? Math.round(
        selectedRepair.low *
          (doorSize === "double" ? DOUBLE_CAR_MULTIPLIER : 1) +
          (serviceTime === "emergency" ? EMERGENCY_LOW_ADDER : 0)
      )
    : 0;

  const estimatedHigh = selectedRepair
    ? Math.round(
        selectedRepair.high *
          (doorSize === "double" ? DOUBLE_CAR_MULTIPLIER : 1) +
          (serviceTime === "emergency" ? EMERGENCY_HIGH_ADDER : 0)
      )
    : 0;

  const barPosition = selectedRepair
    ? getRangePosition(estimatedLow, estimatedHigh)
    : 0;

  const barColor =
    barPosition < 34
      ? "bg-green-500"
      : barPosition < 67
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="space-y-8">
      {/* Step 1: Select repair type */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Step 1: Select Repair Type
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Choose the service that best matches your situation.
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          role="radiogroup"
          aria-label="Repair type"
        >
          {REPAIR_TYPES.map((repair) => {
            const isSelected = selectedRepair?.id === repair.id;
            return (
              <button
                key={repair.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedRepair(repair)}
                className={[
                  "relative text-left rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                  isSelected
                    ? "border-blue-600 bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50",
                ].join(" ")}
              >
                <span className="block font-semibold text-gray-900 text-sm leading-snug mb-1">
                  {repair.name}
                </span>
                <span className="block text-xs text-gray-500 leading-snug">
                  {repair.description}
                </span>
                {isSelected && (
                  <span
                    className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: Options — shown after selecting a repair type */}
      {selectedRepair && (
        <section
          className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-6 transition-all duration-200"
          aria-label="Repair options"
        >
          <h2 className="text-xl font-semibold text-gray-900">
            Step 2: Refine Your Estimate
          </h2>

          {/* Door size */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              Door size
            </legend>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {(["single", "double"] as DoorSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setDoorSize(size)}
                  aria-pressed={doorSize === size}
                  className={[
                    "px-5 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600",
                    doorSize === size
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {size === "single" ? "Single Car" : "Double Car"}
                </button>
              ))}
            </div>
            {doorSize === "double" && (
              <p className="mt-2 text-xs text-gray-500">
                Double-car pricing is approximately 30% higher due to larger
                components and increased labor.
              </p>
            )}
          </fieldset>

          {/* Service time */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              Scheduling
            </legend>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {(["standard", "emergency"] as ServiceTime[]).map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setServiceTime(time)}
                  aria-pressed={serviceTime === time}
                  className={[
                    "px-5 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600",
                    serviceTime === time
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {time === "standard" ? "Standard Hours" : "Emergency / After-Hours"}
                </button>
              ))}
            </div>
            {serviceTime === "emergency" && (
              <p className="mt-2 text-xs text-gray-500">
                Emergency and after-hours calls typically add $50–$150 to the
                base repair cost.
              </p>
            )}
          </fieldset>
        </section>
      )}

      {/* Result section */}
      {selectedRepair && (
        <section
          className="bg-white rounded-xl border-2 border-blue-100 p-6 sm:p-8 space-y-6"
          aria-label="Cost estimate"
        >
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
              Estimated cost range
            </p>
            <p className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              {formatCurrency(estimatedLow)}&nbsp;&ndash;&nbsp;{formatCurrency(estimatedHigh)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {selectedRepair.name}
              {doorSize === "double" ? " &middot; Double Car" : " \u00b7 Single Car"}
              {serviceTime === "emergency" ? " \u00b7 Emergency" : " \u00b7 Standard Hours"}
            </p>
          </div>

          {/* Visual cost bar */}
          <div aria-hidden="true">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Lower cost</span>
              <span>Higher cost</span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              {/* Filled segment representing the midpoint position */}
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${barPosition}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span className="text-green-600 font-medium">Budget-friendly</span>
              <span className="text-yellow-600 font-medium">Mid-range</span>
              <span className="text-red-600 font-medium">Premium</span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
            Estimates based on national average pricing data. Actual costs vary
            by location, door type, brand, and service provider. Always get
            multiple quotes before proceeding with repairs.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/browse"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Find Repair Companies in Your Area
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="flex-initial inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              Reset
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
