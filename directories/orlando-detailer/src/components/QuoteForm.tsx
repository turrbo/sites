'use client';

import { useState, FormEvent, ChangeEvent } from 'react';

interface Props {
  source?: string;
  serviceType?: string;
  className?: string;
  /** Render a condensed single-column layout for sidebar use */
  compact?: boolean;
  /** Pre-fill shop name context (shown in success message) */
  shopName?: string;
}

type ServiceType = 'Auto Detailing' | 'Window Tinting' | 'Vehicle Wraps' | '';

const SUBCATEGORIES: Record<string, string[]> = {
  'Auto Detailing': [
    'Ceramic Coating',
    'Paint Correction',
    'Interior Detailing',
    'Exterior Detailing',
    'Mobile Detailing',
    'Full Detail',
  ],
  'Window Tinting': [
    'Automotive Tint',
    'Residential Tint',
    'Commercial Tint',
  ],
  'Vehicle Wraps': [
    'Full Wrap',
    'Partial Wrap',
    'Paint Protection Film (PPF)',
    'Color Change Wrap',
    'Commercial Fleet Wraps',
  ],
};

const SERVICE_TYPES: ServiceType[] = ['Auto Detailing', 'Window Tinting', 'Vehicle Wraps'];

interface FormState {
  serviceType: ServiceType;
  subcategory: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  zip: string;
  name: string;
  email: string;
  phone: string;
  details: string;
}

const inputClass =
  'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

export default function QuoteForm({ source = '', serviceType: initialServiceType = '', className = '', compact = false, shopName }: Props) {
  const normalizedInitial: ServiceType =
    SERVICE_TYPES.includes(initialServiceType as ServiceType)
      ? (initialServiceType as ServiceType)
      : '';

  const [form, setForm] = useState<FormState>({
    serviceType: normalizedInitial,
    subcategory: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    zip: '',
    name: '',
    email: '',
    phone: '',
    details: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Reset subcategory when service type changes
      if (name === 'serviceType') {
        next.subcategory = '';
      }
      return next;
    });
    // Clear field error on change
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.serviceType) {
      newErrors.serviceType = 'Please select a service type.';
    }
    if (!form.zip.trim()) {
      newErrors.zip = 'Zip code is required.';
    } else if (!/^\d{5}$/.test(form.zip.trim())) {
      newErrors.zip = 'Please enter a valid 5-digit zip code.';
    }
    if (!form.name.trim()) {
      newErrors.name = 'Name is required.';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        source,
        serviceType: form.serviceType,
        subcategory: form.subcategory,
        vehicleYear: form.vehicleYear,
        vehicleMake: form.vehicleMake,
        vehicleModel: form.vehicleModel,
        zip: form.zip,
        name: form.name,
        email: form.email,
        phone: form.phone,
        details: form.details,
      };

      const res = await fetch('/api/submit-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitError('Unable to submit your request. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={`rounded-xl border border-green-200 bg-green-50 p-8 text-center ${className}`}>
        <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">Quote Request Sent!</h3>
        <p className="text-sm text-green-700 max-w-sm mx-auto">
          Thanks!{shopName ? ` Your request for ${shopName} has been received.` : " We've received your request and will connect you with top-rated shops in your area shortly."}
        </p>
        <button
          className="mt-5 text-sm font-medium text-green-700 underline hover:text-green-900 transition-colors"
          onClick={() => {
            setSubmitted(false);
            setForm({
              serviceType: normalizedInitial,
              subcategory: '',
              vehicleYear: '',
              vehicleMake: '',
              vehicleModel: '',
              zip: '',
              name: '',
              email: '',
              phone: '',
              details: '',
            });
          }}
        >
          Submit another request
        </button>
      </div>
    );
  }

  const subcategoryOptions = form.serviceType ? SUBCATEGORIES[form.serviceType] || [] : [];

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`} noValidate>
      {/* Hidden source field */}
      <input type="hidden" name="source" value={source} />

      {/* Service Type */}
      <div>
        <p className={labelClass}>
          Service Type <span className="text-red-500">*</span>
        </p>
        <div className={`grid gap-2 mt-1 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {SERVICE_TYPES.map((type) => (
            <label
              key={type}
              className={`flex items-center gap-2.5 px-4 py-3 border rounded-lg cursor-pointer transition-all text-sm font-medium select-none ${
                form.serviceType === type
                  ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/40'
              }`}
            >
              <input
                type="radio"
                name="serviceType"
                value={type}
                checked={form.serviceType === type}
                onChange={handleChange}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  form.serviceType === type ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                }`}
              >
                {form.serviceType === type && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                )}
              </span>
              {type}
            </label>
          ))}
        </div>
        {errors.serviceType && (
          <p className="mt-1.5 text-xs text-red-600">{errors.serviceType}</p>
        )}
      </div>

      {/* Subcategory - conditional */}
      {subcategoryOptions.length > 0 && (
        <div>
          <label htmlFor="subcategory" className={labelClass}>
            Subcategory
          </label>
          <select
            id="subcategory"
            name="subcategory"
            value={form.subcategory}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select a subcategory (optional)</option>
            {subcategoryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Vehicle Info Row */}
      <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-3 gap-3'}>
        <div>
          <label htmlFor="vehicleYear" className={labelClass}>
            Year
          </label>
          <input
            id="vehicleYear"
            name="vehicleYear"
            type="text"
            value={form.vehicleYear}
            onChange={handleChange}
            placeholder="2022"
            maxLength={4}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="vehicleMake" className={labelClass}>
            Make
          </label>
          <input
            id="vehicleMake"
            name="vehicleMake"
            type="text"
            value={form.vehicleMake}
            onChange={handleChange}
            placeholder="Toyota"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="vehicleModel" className={labelClass}>
            Model
          </label>
          <input
            id="vehicleModel"
            name="vehicleModel"
            type="text"
            value={form.vehicleModel}
            onChange={handleChange}
            placeholder="Camry"
            className={inputClass}
          />
        </div>
      </div>

      {/* Zip Code */}
      <div>
        <label htmlFor="zip" className={labelClass}>
          Zip Code <span className="text-red-500">*</span>
        </label>
        <input
          id="zip"
          name="zip"
          type="text"
          inputMode="numeric"
          value={form.zip}
          onChange={handleChange}
          placeholder="32801"
          maxLength={5}
          className={`${inputClass} ${errors.zip ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
        />
        {errors.zip && (
          <p className="mt-1.5 text-xs text-red-600">{errors.zip}</p>
        )}
      </div>

      {/* Name + Email row */}
      <div className={compact ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div>
          <label htmlFor="name" className={labelClass}>
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Jane Smith"
            className={`${inputClass} ${errors.name ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="jane@example.com"
            className={`${inputClass} ${errors.email ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="(407) 555-0100"
          className={inputClass}
        />
      </div>

      {/* Details */}
      <div>
        <label htmlFor="details" className={labelClass}>
          Additional Details <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="details"
          name="details"
          rows={3}
          value={form.details}
          onChange={handleChange}
          placeholder="Tell us more about what you're looking for..."
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed text-slate-900 font-bold text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : (
          'Get Free Quotes'
        )}
      </button>
    </form>
  );
}
