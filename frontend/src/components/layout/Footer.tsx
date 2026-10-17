import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-[#fafafc] mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl text-white font-bold text-xs bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] shadow-sm">
                L
              </div>
              <span className="text-lg font-bold tracking-tight text-[#0a0a0a]">{APP_NAME}</span>
            </div>
            <p className="text-xs leading-relaxed text-neutral-500">
              Find products at nearby physical stores. Compare prices, check availability, and get directions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-xs text-neutral-500 hover:text-orange-600 transition-colors">Search Products</Link></li>
              <li><Link href="/categories" className="text-xs text-neutral-500 hover:text-orange-600 transition-colors">Categories</Link></li>
            </ul>
          </div>

          {/* For Merchants */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] mb-3">For Merchants</h3>
            <ul className="space-y-2">
              <li><Link href="/register" className="text-xs text-neutral-500 hover:text-orange-600 transition-colors">List Your Store</Link></li>
              <li><Link href="/merchant/dashboard" className="text-xs text-neutral-500 hover:text-orange-600 transition-colors">Merchant Dashboard</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] mb-3">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/report" className="text-xs text-neutral-500 hover:text-orange-600 transition-colors">Report an Issue</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-black/[0.06] pt-6 text-center">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} {APP_NAME}. Connecting customers with local stores.
          </p>
        </div>
      </div>
    </footer>
  );
}
