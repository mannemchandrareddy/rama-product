'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Category, ApiResponse } from '@/types';
import { Tag, Plus, X, FolderTree, Sparkles } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = (await api.categories.listAll()) as ApiResponse<Category[]>;
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.categories.create(formData);
      setShowForm(false);
      setFormData({ name: '', slug: '', description: '' });
      loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating category';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a]">
            Taxonomy & Categories
          </h1>
          <p className="text-sm text-[#71717a] mt-1">
            Organize catalog products into consumer-friendly browsing departments.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Close Form' : 'Add Category'}
        </button>
      </div>

      {/* Add Category Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-2xl bg-white border border-[#e4e4e7] shadow-lg animate-slide-down space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-[#f4f4f5] pb-3 mb-2">
            <Sparkles className="w-5 h-5 text-[#f97316]" />
            <h2 className="text-base font-bold text-[#0a0a0a]">Create New Department / Category</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#52525b] mb-1.5">Category Name *</label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: autoSlug(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all"
                placeholder="e.g. Dairy & Eggs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#52525b] mb-1.5">URL Slug *</label>
              <input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all font-mono"
                placeholder="dairy-and-eggs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#52525b] mb-1.5">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all resize-none"
              placeholder="Fresh farm dairy, milk bottles, artisan cheeses, free-range eggs..."
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-[#0a0a0a] hover:bg-[#27272a] text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Save Category'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-[#71717a] hover:text-[#0a0a0a] hover:bg-[#f4f4f5] transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-[#e4e4e7] animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e4e4e7] p-12 text-center shadow-sm">
          <FolderTree className="w-10 h-10 text-[#a1a1aa] mx-auto mb-3" />
          <h3 className="font-semibold text-[#0a0a0a] text-base">No categories created yet</h3>
          <p className="text-sm text-[#71717a] mt-1 max-w-sm mx-auto">
            Create categories to organize items and allow shoppers to filter products smoothly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className={`p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm hover:shadow-md transition-all flex flex-col justify-between animate-fade-in-up stagger-${Math.min(
                i + 1,
                8
              )}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#fff7ed] text-[#f97316] flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-base text-[#0a0a0a]">{cat.name}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      cat.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="font-mono text-xs text-[#71717a] bg-[#f4f4f5] px-2 py-1 rounded-md w-fit">
                  /{cat.slug}
                </p>

                {cat.description && (
                  <p className="text-xs text-[#52525b] mt-3 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
