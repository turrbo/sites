'use client';

import { useState } from 'react';
import Link from 'next/link';

type ServiceId =
  | 'full-detail'
  | 'exterior-detail'
  | 'interior-detail'
  | 'ceramic-coating'
  | 'ppf'
  | 'window-tinting'
  | 'full-wrap'
  | 'partial-wrap'
  | 'paint-correction'
  | 'headlight-restoration'
  | 'engine-bay';

type VehicleSize = 'sedan' | 'suv' | 'van';
type Condition = 'light' | 'moderate' | 'heavy';
type CoatingTier = '1yr' | '3yr' | '5yr';
type TintWindows = '2' | '4' | '5' | '7';
type CoverageArea = 'partial' | 'full';

interface ServiceDef {
  id: ServiceId;
  name: string;
  description: string;
  icon: string;
  category: 'detailing' | 'protection' | 'enhancement';
  hasCondition?: boolean;
  hasCoatingTier?: boolean;
  hasTintWindows?: boolean;
  hasCoverage?: boolean;
  // Base prices: [low, high] for sedan
  base: [number, number];
  // Multipliers for vehicle size
  suvMult: number;
  vanMult: number;
  // Condition multipliers (light=1.0)
  moderateMult?: number;
  heavyMult?: number;
  // Coating tier overrides
  coatingTiers?: Record<CoatingTier, [number, number]>;
  // Tint per-window pricing
  tintPerWindow?: [number, number];
  // Coverage multiplier for partial
  partialMult?: number;
}

const services: ServiceDef[] = [
  {
    id: 'full-detail',
    name: 'Full Detail',
    description: 'Complete interior and exterior detail',
    icon: '🚗',
    category: 'detailing',
    hasCondition: true,
    base: [150, 250],
    suvMult: 1.3,
    vanMult: 1.5,
    moderateMult: 1.25,
    heavyMult: 1.5,
  },
  {
    id: 'exterior-detail',
    name: 'Exterior Detail',
    description: 'Wash, clay bar, polish, and wax',
    icon: '✨',
    category: 'detailing',
    hasCondition: true,
    base: [80, 150],
    suvMult: 1.25,
    vanMult: 1.45,
    moderateMult: 1.2,
    heavyMult: 1.4,
  },
  {
    id: 'interior-detail',
    name: 'Interior Detail',
    description: 'Deep clean, shampoo, leather care',
    icon: '🧹',
    category: 'detailing',
    hasCondition: true,
    base: [80, 140],
    suvMult: 1.3,
    vanMult: 1.55,
    moderateMult: 1.3,
    heavyMult: 1.6,
  },
  {
    id: 'ceramic-coating',
    name: 'Ceramic Coating',
    description: 'Long-lasting paint protection',
    icon: '🛡️',
    category: 'protection',
    hasCoatingTier: true,
    base: [500, 800],
    suvMult: 1.25,
    vanMult: 1.4,
    coatingTiers: {
      '1yr': [300, 600],
      '3yr': [600, 1000],
      '5yr': [1000, 1800],
    },
  },
  {
    id: 'ppf',
    name: 'Paint Protection Film',
    description: 'Clear bra / PPF for paint protection',
    icon: '🔒',
    category: 'protection',
    hasCoverage: true,
    base: [800, 2000],
    suvMult: 1.3,
    vanMult: 1.5,
    partialMult: 0.4,
  },
  {
    id: 'window-tinting',
    name: 'Window Tinting',
    description: 'Professional window film installation',
    icon: '🪟',
    category: 'protection',
    hasTintWindows: true,
    base: [150, 400],
    suvMult: 1.15,
    vanMult: 1.3,
    tintPerWindow: [40, 80],
  },
  {
    id: 'full-wrap',
    name: 'Full Vehicle Wrap',
    description: 'Complete color change or custom wrap',
    icon: '🎨',
    category: 'enhancement',
    base: [2500, 5000],
    suvMult: 1.35,
    vanMult: 1.6,
  },
  {
    id: 'partial-wrap',
    name: 'Partial Wrap',
    description: 'Hood, roof, mirrors, or accent wrap',
    icon: '🖌️',
    category: 'enhancement',
    base: [500, 1500],
    suvMult: 1.2,
    vanMult: 1.35,
  },
  {
    id: 'paint-correction',
    name: 'Paint Correction',
    description: 'Swirl removal and paint restoration',
    icon: '💎',
    category: 'enhancement',
    hasCondition: true,
    base: [200, 500],
    suvMult: 1.3,
    vanMult: 1.5,
    moderateMult: 1.4,
    heavyMult: 1.8,
  },
  {
    id: 'headlight-restoration',
    name: 'Headlight Restoration',
    description: 'Remove yellowing and haze',
    icon: '💡',
    category: 'enhancement',
    base: [50, 100],
    suvMult: 1.0,
    vanMult: 1.0,
  },
  {
    id: 'engine-bay',
    name: 'Engine Bay Cleaning',
    description: 'Degrease and detail engine compartment',
    icon: '⚙️',
    category: 'detailing',
    hasCondition: true,
    base: [50, 100],
    suvMult: 1.1,
    vanMult: 1.2,
    moderateMult: 1.3,
    heavyMult: 1.5,
  },
];

const vehicleSizes: { id: VehicleSize; label: string; desc: string }[] = [
  { id: 'sedan', label: 'Sedan / Coupe', desc: 'Cars, hatchbacks, small crossovers' },
  { id: 'suv', label: 'SUV / Truck', desc: 'Mid to full-size SUVs, pickups' },
  { id: 'van', label: 'Van / Large', desc: 'Minivans, full-size vans, large trucks' },
];

const conditions: { id: Condition; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'heavy', label: 'Heavy' },
];

const coatingTiers: { id: CoatingTier; label: string }[] = [
  { id: '1yr', label: '1-Year' },
  { id: '3yr', label: '3-Year' },
  { id: '5yr', label: '5-Year' },
];

const tintWindowOptions: { id: TintWindows; label: string }[] = [
  { id: '2', label: '2 Windows (front)' },
  { id: '4', label: '4 Windows (sedan)' },
  { id: '5', label: '5 Windows (SUV/hatch)' },
  { id: '7', label: '7 Windows (full vehicle)' },
];

const coverageOptions: { id: CoverageArea; label: string }[] = [
  { id: 'partial', label: 'Partial (front end)' },
  { id: 'full', label: 'Full Body' },
];

function calcPrice(
  service: ServiceDef,
  size: VehicleSize,
  condition: Condition,
  coatingTier: CoatingTier,
  tintWindows: TintWindows,
  coverage: CoverageArea
): [number, number] {
  let [low, high] = service.base;

  // Coating tier overrides base
  if (service.hasCoatingTier && service.coatingTiers) {
    [low, high] = service.coatingTiers[coatingTier];
  }

  // Tint window pricing
  if (service.hasTintWindows && service.tintPerWindow) {
    const numWindows = parseInt(tintWindows);
    low = service.tintPerWindow[0] * numWindows;
    high = service.tintPerWindow[1] * numWindows;
  }

  // Vehicle size multiplier
  if (size === 'suv') {
    low *= service.suvMult;
    high *= service.suvMult;
  } else if (size === 'van') {
    low *= service.vanMult;
    high *= service.vanMult;
  }

  // Condition multiplier
  if (service.hasCondition) {
    if (condition === 'moderate' && service.moderateMult) {
      low *= service.moderateMult;
      high *= service.moderateMult;
    } else if (condition === 'heavy' && service.heavyMult) {
      low *= service.heavyMult;
      high *= service.heavyMult;
    }
  }

  // Coverage (PPF partial vs full)
  if (service.hasCoverage && coverage === 'partial' && service.partialMult) {
    low *= service.partialMult;
    high *= service.partialMult;
  }

  return [Math.round(low), Math.round(high)];
}

function categoryLabel(cat: string) {
  if (cat === 'detailing') return 'Detailing';
  if (cat === 'protection') return 'Protection';
  return 'Enhancement';
}

export default function CostCalculator() {
  const [selectedService, setSelectedService] = useState<ServiceId>('full-detail');
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>('sedan');
  const [condition, setCondition] = useState<Condition>('light');
  const [coatingTier, setCoatingTier] = useState<CoatingTier>('3yr');
  const [tintWindows, setTintWindows] = useState<TintWindows>('4');
  const [coverage, setCoverage] = useState<CoverageArea>('full');

  const service = services.find((s) => s.id === selectedService)!;
  const [low, high] = calcPrice(service, vehicleSize, condition, coatingTier, tintWindows, coverage);

  const groupedServices = {
    detailing: services.filter((s) => s.category === 'detailing'),
    protection: services.filter((s) => s.category === 'protection'),
    enhancement: services.filter((s) => s.category === 'enhancement'),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Service Selection */}
      <div className="lg:col-span-2 space-y-6">
        {(['detailing', 'protection', 'enhancement'] as const).map((cat) => (
          <div key={cat}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {categoryLabel(cat)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupedServices[cat].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedService === s.id
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" role="img">{s.icon}</span>
                    <div>
                      <div className={`font-semibold ${selectedService === s.id ? 'text-blue-900' : 'text-gray-900'}`}>
                        {s.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{s.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right: Options + Price */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
          {/* Vehicle Size */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Vehicle Size</h3>
            <div className="space-y-2">
              {vehicleSizes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVehicleSize(v.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    vehicleSize === v.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`font-medium text-sm ${vehicleSize === v.id ? 'text-blue-900' : 'text-gray-900'}`}>
                    {v.label}
                  </div>
                  <div className="text-xs text-gray-500">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Options */}
          {service.hasCondition && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Condition</h3>
              <div className="flex gap-2">
                {conditions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCondition(c.id)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      condition === c.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {condition === 'light' && 'Regular maintenance, minor dust/dirt'}
                {condition === 'moderate' && 'Pet hair, stains, some neglect'}
                {condition === 'heavy' && 'Heavy soiling, smoke, major neglect'}
              </p>
            </div>
          )}

          {service.hasCoatingTier && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Coating Tier</h3>
              <div className="flex gap-2">
                {coatingTiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCoatingTier(t.id)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      coatingTier === t.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {service.hasTintWindows && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Number of Windows</h3>
              <div className="space-y-2">
                {tintWindowOptions.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setTintWindows(w.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                      tintWindows === w.id
                        ? 'border-blue-600 bg-blue-50 font-medium text-blue-900'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {service.hasCoverage && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Coverage Area</h3>
              <div className="flex gap-2">
                {coverageOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCoverage(c.id)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      coverage === c.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Result */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
            <div className="text-sm font-medium text-slate-300 mb-1">Estimated Cost in Orlando</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold">${low.toLocaleString()}</span>
              <span className="text-slate-400">-</span>
              <span className="text-3xl font-bold">${high.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-400 mb-4">
              {service.name} &middot; {vehicleSizes.find((v) => v.id === vehicleSize)?.label}
              {service.hasCondition && ` &middot; ${condition} condition`}
            </div>
            <Link
              href="/get-quotes"
              className="block w-full text-center px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors"
            >
              Get Free Quotes
            </Link>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Prices are estimates based on Orlando-area averages. Actual costs vary by shop, products used, and vehicle condition.
          </p>
        </div>
      </div>
    </div>
  );
}
