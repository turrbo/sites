'use client';

import { useState, FormEvent, ChangeEvent } from 'react';

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const initialState: FormState = {
  name: '',
  email: '',
  phone: '',
  message: '',
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // TODO: Replace with your actual form submission logic
    // Example Web3Forms payload:
    // {
    //   access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
    //   from_name: 'Orlando Detailer',
    //   subject: `New Contact Form Submission - Orlando Detailer`,
    //   ...form,
    // }
    console.log('Form submitted:', form);
    await new Promise((res) => setTimeout(res, 500)); // simulate async
    setLoading(false);
    setSubmitted(true);
    setForm(initialState);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <svg className="w-10 h-10 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-green-800">Message sent!</h3>
        <p className="text-sm text-green-700 mt-1">Thanks for reaching out to Orlando Detailer. We&apos;ll be in touch soon.</p>
        <button
          className="mt-4 text-sm text-green-700 underline hover:text-green-900"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-400';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Hidden fields for Web3Forms branding */}
      <input type="hidden" name="from_name" value="Orlando Detailer" />
      <input type="hidden" name="subject" value="New Contact Form Submission - Orlando Detailer" />

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          placeholder="Your full name"
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone
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

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          value={form.message}
          onChange={handleChange}
          placeholder="How can we help you?"
          className={`${inputClass} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed text-slate-900 font-bold text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      >
        {loading ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
