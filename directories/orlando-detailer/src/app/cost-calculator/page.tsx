import { Metadata } from 'next';
import CostCalculator from '@/components/CostCalculator';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Auto Detailing Cost Calculator',
  description:
    'Estimate the cost of auto detailing, ceramic coating, window tinting, PPF, vehicle wraps, and more in the Orlando area. Get instant price ranges by vehicle size and service type.',
  openGraph: {
    title: 'Auto Detailing Cost Calculator',
    description:
      'Estimate the cost of auto detailing, ceramic coating, window tinting, PPF, vehicle wraps, and more in the Orlando area.',
    url: 'https://orlandodetailer.com/cost-calculator',
  },
};

export default function CostCalculatorPage() {
  const breadcrumbs = [{ name: 'Cost Calculator', url: '/cost-calculator' }];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does a full car detail cost in Orlando?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A full interior and exterior detail in Orlando typically costs $150-$250 for a sedan, $195-$325 for an SUV, and $225-$375 for a van or large vehicle. Prices increase for moderate to heavy soiling.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does ceramic coating cost in Orlando?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ceramic coating in Orlando ranges from $300-$600 for a 1-year coating, $600-$1,000 for a 3-year coating, and $1,000-$1,800 for a 5-year coating on a sedan. SUVs and larger vehicles cost 25-40% more.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does window tinting cost in Orlando?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Window tinting in Orlando costs approximately $40-$80 per window. A full sedan (4 windows) runs $160-$320, while a full vehicle with 7 windows costs $280-$560.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does a full vehicle wrap cost in Orlando?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A full vehicle wrap in Orlando typically costs $2,500-$5,000 for a sedan, $3,375-$6,750 for an SUV, and $4,000-$8,000 for a van. Partial wraps (hood, roof, accents) run $500-$1,500.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does paint protection film (PPF) cost in Orlando?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PPF in Orlando costs $320-$800 for a partial front-end package (bumper, hood, fenders) and $800-$2,000 for full-body coverage on a sedan. Larger vehicles cost 30-50% more.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={breadcrumbs} />

          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Auto Care Cost Calculator
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get instant price estimates for detailing, coatings, tinting, wraps, and more
              in the Orlando area. Select a service and customize your options below.
            </p>
          </div>

          <CostCalculator />

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqJsonLd.mainEntity.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                    <span>{faq.name}</span>
                    <svg
                      className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center bg-blue-50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Ready to get an exact quote?
            </h2>
            <p className="text-gray-600 mb-4">
              Connect with top-rated Orlando detailers, tinters, and wrap shops for free.
            </p>
            <a
              href="/get-quotes"
              className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors shadow-sm"
            >
              Get Free Quotes
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
