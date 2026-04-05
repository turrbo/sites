"use client";

import { useState } from "react";

type Plan = "basic" | "featured";

interface FormData {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  email: string;
  description: string;
  hours: string;
  plan: Plan;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export default function ListingForm() {
  const [form, setForm] = useState<FormData>({
    businessName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    website: "",
    email: "",
    description: "",
    hours: "",
    plan: "featured",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/submit-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Plan Selection */}
      <div>
        <label className={labelClass}>Select Plan</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update("plan", "basic")}
            className={`p-3 border-2 rounded-lg text-center transition-all ${
              form.plan === "basic"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="block font-semibold text-gray-900">Basic</span>
            <span className="block text-sm text-gray-500">$99/yr</span>
          </button>
          <button
            type="button"
            onClick={() => update("plan", "featured")}
            className={`p-3 border-2 rounded-lg text-center transition-all ${
              form.plan === "featured"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="block font-semibold text-gray-900">Featured</span>
            <span className="block text-sm text-gray-500">$299/yr</span>
          </button>
        </div>
      </div>

      {/* Business Name */}
      <div>
        <label htmlFor="businessName" className={labelClass}>
          Business Name *
        </label>
        <input
          id="businessName"
          type="text"
          required
          className={inputClass}
          value={form.businessName}
          onChange={(e) => update("businessName", e.target.value)}
          placeholder="ABC Garage Door Repair"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClass}>
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          required
          className={inputClass}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone Number *
        </label>
        <input
          id="phone"
          type="tel"
          required
          className={inputClass}
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className={labelClass}>
          Street Address *
        </label>
        <input
          id="address"
          type="text"
          required
          className={inputClass}
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="123 Main St"
        />
      </div>

      {/* City / State / Zip */}
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-3">
          <label htmlFor="city" className={labelClass}>
            City *
          </label>
          <input
            id="city"
            type="text"
            required
            className={inputClass}
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Houston"
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="state" className={labelClass}>
            State *
          </label>
          <select
            id="state"
            required
            className={inputClass}
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
          >
            <option value="">--</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label htmlFor="zip" className={labelClass}>
            ZIP *
          </label>
          <input
            id="zip"
            type="text"
            required
            className={inputClass}
            value={form.zip}
            onChange={(e) => update("zip", e.target.value)}
            placeholder="77001"
          />
        </div>
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className={labelClass}>
          Website
        </label>
        <input
          id="website"
          type="url"
          className={inputClass}
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
          placeholder="https://yourwebsite.com"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          Business Description *
        </label>
        <textarea
          id="description"
          required
          rows={4}
          className={inputClass}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Tell customers about your services, experience, and what makes your business stand out..."
        />
      </div>

      {/* Hours */}
      <div>
        <label htmlFor="hours" className={labelClass}>
          Business Hours
        </label>
        <textarea
          id="hours"
          rows={3}
          className={inputClass}
          value={form.hours}
          onChange={(e) => update("hours", e.target.value)}
          placeholder="Mon-Fri: 8am-6pm&#10;Sat: 9am-3pm&#10;Sun: Closed"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting
          ? "Processing..."
          : `Continue to Payment - $${form.plan === "featured" ? "299" : "99"}/yr`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Secure payment powered by Stripe. Your listing will be reviewed and
        published within 24 hours of payment.
      </p>
    </form>
  );
}
