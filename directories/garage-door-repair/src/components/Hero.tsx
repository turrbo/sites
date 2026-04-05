import { siteConfig } from '@/config/site';
import SearchBar from '@/components/SearchBar';

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          {siteConfig.name}
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
          {siteConfig.tagline}
        </p>
        <div className="mt-8 max-w-xl mx-auto">
          <SearchBar />
        </div>
        <p className="mt-4 text-sm text-blue-200">{siteConfig.description}</p>
      </div>
    </section>
  );
}
