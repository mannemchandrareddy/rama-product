'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { CATEGORY_ICONS } from '@/lib/constants';
import type { Category, ApiResponse } from '@/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.categories.list()
      .then((res: unknown) => { 
        const r = res as ApiResponse<Category[]>;
        if (r.success) setCategories(r.data); 
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafc] text-[#111111]">
      <Header />
      <main className="flex-1">
        <div className="page-container py-12">
          <div className="mb-10 text-center sm:text-left">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Index</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] tracking-tight mt-1 animate-fade-in">
              Product Categories
            </h1>
            <p className="mt-2 text-sm text-neutral-500 animate-fade-in stagger-1">
              Explore thousands of components, materials, and retail products across local verified stores.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
            </div>
          ) : categories.length === 0 ? (
            <div className="card-flat py-16 text-center animate-fade-in">
              <p className="text-neutral-500">No categories available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/search?category_id=${cat.id}`}
                  className={`apple-glow-card p-6 text-center group transition-all stagger-${Math.min(i + 1, 8)}`}
                >
                  <span className="text-4xl group-hover:scale-125 transition-transform duration-300 inline-block">
                    {CATEGORY_ICONS[cat.slug] || '📦'}
                  </span>
                  <h3 className="mt-4 font-bold text-neutral-900 group-hover:text-orange-600 transition-colors text-base">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2">{cat.description}</p>
                  )}
                  <span className="mt-4 inline-flex items-center text-xs font-semibold text-orange-600 group-hover:translate-x-1 transition-transform">
                    Browse items →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
