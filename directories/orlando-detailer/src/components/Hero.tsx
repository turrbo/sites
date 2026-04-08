import Link from 'next/link';
import SearchBar from '@/components/SearchBar';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Subtle dot-grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Amber accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Orlando&apos;s #1 Auto Care Directory
        </span>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
          Find the Best{' '}
          <span className="text-amber-400">Auto Detailing</span>
          <br className="hidden sm:block" />
          {' '}in Orlando
        </h1>

        <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Compare top-rated detailing, tinting, and wrap shops across the Orlando metro area.
        </p>

        {/* Search */}
        <div className="mt-8 sm:mt-10 max-w-xl mx-auto shadow-xl shadow-black/30 rounded-lg overflow-hidden">
          <SearchBar placeholder="Search for detailing shops, tinting, wraps..." />
        </div>

        {/* CTA Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/get-quotes"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-sm rounded-lg transition-colors shadow-lg shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Get Free Quotes
          </Link>
          <Link
            href="/browse"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-lg border border-white/20 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Browse Shops
          </Link>
        </div>

        {/* Trust stats */}
        <p className="mt-8 text-xs sm:text-sm text-slate-400">
          Ceramic coating &middot; Window tinting &middot; Vehicle wraps &middot; Paint protection &middot; Mobile detailing
        </p>
      </div>
    </section>
  );
}
