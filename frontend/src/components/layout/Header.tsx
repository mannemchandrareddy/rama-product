'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/lib/constants';
import { useState } from 'react';
import { useGeolocation, PRESET_LOCATIONS } from '@/hooks/useGeolocation';
import { MapPin, ChevronDown, Crosshair, X, Check } from 'lucide-react';
import LogoutFeedbackModal from './LogoutFeedbackModal';

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [logoutFeedbackOpen, setLogoutFeedbackOpen] = useState(false);
  const { locationName, isLoading, requestLocation, setLocation, latitude, longitude } = useGeolocation();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl transition-all">
        <div className="page-container flex h-16 items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-1 rounded-full bg-orange-500/20 blur-sm group-hover:bg-orange-500/40 transition-all" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl text-white font-bold text-sm bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] shadow-sm group-hover:scale-105 transition-transform">
                  L
                </div>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#0a0a0a]">
                {APP_NAME}
              </span>
            </Link>

            {/* Zepto/Blinkit Style Location Header Pill */}
            <button
              onClick={() => setLocationModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f4f5] hover:bg-[#eaeaea] text-[#0a0a0a] text-xs font-bold transition-all border border-[#e4e4e7] max-w-[220px] group cursor-pointer"
              title="Click to change or detect location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#ea580c] shrink-0 animate-pulse" />
              <span className="truncate">
                {isLoading ? 'Locating...' : locationName || 'Select Location'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black shrink-0 transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-neutral-600">
            <Link
              href="/search"
              className="px-3.5 py-1.5 rounded-lg hover:text-[#0a0a0a] hover:bg-black/[0.04] transition-colors"
            >
              Search
            </Link>
            <Link
              href="/categories"
              className="px-3.5 py-1.5 rounded-lg hover:text-[#0a0a0a] hover:bg-black/[0.04] transition-colors"
            >
              Categories
            </Link>
            {isAuthenticated && user?.role === 'MERCHANT' && (
              <Link
                href="/merchant/dashboard"
                className="px-3.5 py-1.5 rounded-lg hover:text-[#0a0a0a] hover:bg-black/[0.04] transition-colors"
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                className="px-3.5 py-1.5 rounded-lg hover:text-[#0a0a0a] hover:bg-black/[0.04] transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right Navigation & Action Items */}
          <div className="flex items-center gap-3">
            {/* Mobile Location Icon */}
            <button
              onClick={() => setLocationModalOpen(true)}
              className="sm:hidden p-2 rounded-xl bg-[#f4f4f5] text-[#ea580c] border border-[#e4e4e7]"
              title="Change Location"
            >
              <MapPin className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl px-2.5 py-1 text-sm font-medium hover:bg-black/[0.04] transition-colors"
                >
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold bg-[#0a0a0a] text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-neutral-900 font-semibold">
                    {user?.name?.split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={() => setLogoutFeedbackOpen(true)}
                  className="text-xs font-semibold text-neutral-500 hover:text-red-600 hover:bg-red-50/70 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-neutral-700 hover:text-neutral-950 px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-[#0a0a0a] text-white px-4 py-2 text-sm font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-icon md:hidden"
              aria-label="Toggle navigation menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-black/[0.06] md:hidden bg-white/95 backdrop-blur-2xl animate-slide-down">
            <nav className="page-container flex flex-col py-4 gap-1.5 text-sm font-semibold">
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-black/[0.04]"
              >
                Search Products
              </Link>
              <Link
                href="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-black/[0.04]"
              >
                Categories
              </Link>
              {isAuthenticated && user?.role === 'MERCHANT' && (
                <Link
                  href="/merchant/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-black/[0.04]"
                >
                  Merchant Dashboard
                </Link>
              )}
              {isAuthenticated && user?.role === 'ADMIN' && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-black/[0.04]"
                >
                  Admin Control Panel
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ── ZEPO/BLINKIT STYLE LOCATION MODAL ── */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-[#e4e4e7] shadow-2xl animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0a0a0a] text-base">Select Your Location</h3>
                  <p className="text-xs text-[#71717a]">To see real-time distance and store availability</p>
                </div>
              </div>
              <button
                onClick={() => setLocationModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-neutral-400 hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS Auto-detect Button */}
            <button
              onClick={() => {
                requestLocation();
                setLocationModalOpen(false);
              }}
              disabled={isLoading}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crosshair className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Detecting GPS Location...' : 'Use My Exact Real-Time GPS Location'}</span>
            </button>

            {/* Preset Neighborhoods */}
            <div>
              <p className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-2">
                Popular Local Hubs
              </p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {PRESET_LOCATIONS.map((loc) => {
                  const isSelected =
                    latitude &&
                    longitude &&
                    Math.abs(latitude - loc.lat) < 0.01 &&
                    Math.abs(longitude - loc.lng) < 0.01;

                  return (
                    <button
                      key={loc.name}
                      onClick={() => {
                        setLocation(loc.lat, loc.lng, loc.name);
                        setLocationModalOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-[#fff7ed] border border-[#ffedd5] text-[#ea580c]'
                          : 'hover:bg-[#f4f4f5] text-[#0a0a0a] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <div>
                          <p className="font-bold">{loc.name}</p>
                          <p className="text-[10px] text-[#71717a] font-mono">
                            {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#ea580c]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGOUT & USER FEEDBACK MODAL ── */}
      <LogoutFeedbackModal
        isOpen={logoutFeedbackOpen}
        onClose={() => setLogoutFeedbackOpen(false)}
      />
    </>
  );
}
