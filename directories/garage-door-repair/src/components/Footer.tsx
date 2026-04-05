import Link from 'next/link';
import { siteConfig } from '@/config/site';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-white font-bold text-lg mb-2">{siteConfig.name}</h3>
            <p className="text-sm text-gray-400">{siteConfig.tagline}</p>
            {siteConfig.email && (
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {siteConfig.email}
              </a>
            )}
          </div>

          {/* Footer Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Links</h4>
            <ul className="space-y-2">
              {siteConfig.footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2">
              <li><Link href="/browse" className="text-sm text-gray-400 hover:text-white transition-colors">Browse by State</Link></li>
              <li><Link href="/guides" className="text-sm text-gray-400 hover:text-white transition-colors">Repair Guides</Link></li>
              <li><Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          &copy; {currentYear} {siteConfig.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
