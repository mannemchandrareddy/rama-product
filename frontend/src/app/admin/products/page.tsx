'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Product, Category, PaginatedResponse } from '@/types';
import { Package, Plus, Search, Image as ImageIcon, Sparkles, X, CheckCircle2 } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    model: '',
    category_id: '',
    description: '',
    image_url: '',
    search_keywords: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = async () => {
    try {
      const res = (await api.categories.list()) as { success: boolean; data: Category[] };
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, page_size: 50 };
      if (search) params.search = search;
      const res = (await api.products.list(params)) as PaginatedResponse<Product>;
      if (res.success) setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: newProduct.name.trim(),
        brand: newProduct.brand.trim() || undefined,
        model: newProduct.model.trim() || undefined,
        description: newProduct.description.trim() || undefined,
        image_url: newProduct.image_url.trim() || undefined,
        search_keywords: newProduct.search_keywords.trim() || undefined,
      };
      if (newProduct.category_id) {
        payload.category_id = newProduct.category_id;
      }

      await api.products.create(payload);
      setShowCreateForm(false);
      setNewProduct({
        name: '',
        brand: '',
        model: '',
        category_id: '',
        description: '',
        image_url: '',
        search_keywords: '',
      });
      loadProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product';
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
            Product Master Catalogue
          </h1>
          <p className="text-sm text-[#71717a] mt-1">
            Global catalog of products that merchants can attach their inventory to.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-all"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Close Form' : 'Add New Product'}
        </button>
      </div>

      {/* Create Product Card */}
      {showCreateForm && (
        <form
          onSubmit={createProduct}
          className="p-6 rounded-2xl bg-white border border-[#e4e4e7] shadow-lg animate-slide-down space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-[#f4f4f5] pb-3 mb-2">
            <Sparkles className="w-5 h-5 text-[#f97316]" />
            <h2 className="text-base font-bold text-[#0a0a0a]">Create Master Product</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#52525b] mb-1.5">
                Product Name *
              </label>
              <input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all"
                placeholder="e.g. Aashirvaad Shudh Chakki Atta 5kg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#52525b] mb-1.5">Brand</label>
              <input
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all"
                placeholder="e.g. Aashirvaad"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#52525b] mb-1.5">Model / Variant</label>
              <input
                value={newProduct.model}
                onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all"
                placeholder="e.g. 5 kg Pack"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#52525b] mb-1.5">Category</label>
              <select
                value={newProduct.category_id}
                onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all"
              >
                <option value="">Select a Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#52525b] mb-1.5">
                Image URL (Direct link to photo)
              </label>
              <input
                value={newProduct.image_url}
                onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          {/* Image Preview */}
          {newProduct.image_url && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fafafc] border border-[#e4e4e7] w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={newProduct.image_url}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover border border-[#e4e4e7]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-xs text-[#71717a]">Live Image Preview</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#52525b] mb-1.5">Description</label>
            <textarea
              rows={2}
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all resize-none"
              placeholder="Product details, ingredients, or specifications..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#52525b] mb-1.5">
              Search Keywords (Comma-separated)
            </label>
            <input
              value={newProduct.search_keywords}
              onChange={(e) => setNewProduct({ ...newProduct, search_keywords: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f9fa] border border-[#e4e4e7] text-sm text-[#0a0a0a] focus:bg-white focus:border-[#f97316] outline-none transition-all"
              placeholder="atta, wheat, flour, aashirvaad, grocery"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-[#0a0a0a] hover:bg-[#27272a] text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? 'Creating Product...' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-[#71717a] hover:text-[#0a0a0a] hover:bg-[#f4f4f5] transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#a1a1aa] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm text-sm text-[#0a0a0a] focus:border-[#f97316] outline-none transition-all"
          placeholder="Search products by name, brand, model..."
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-white border border-[#e4e4e7] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e4e4e7] p-12 text-center shadow-sm">
          <Package className="w-10 h-10 text-[#a1a1aa] mx-auto mb-3" />
          <h3 className="font-semibold text-[#0a0a0a] text-base">No products found</h3>
          <p className="text-sm text-[#71717a] mt-1 max-w-sm mx-auto">
            {search
              ? `No catalog items matched "${search}".`
              : 'Add your first master product to let merchants stock it.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e4e4e7] shadow-sm overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f4f4f5] bg-[#fafafc]">
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Item</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Brand</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Category</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f5]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafafc] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center shrink-0 overflow-hidden">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-[#a1a1aa]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0a0a0a] truncate">{p.name}</p>
                          {p.model && (
                            <p className="text-xs text-[#71717a] truncate">{p.model}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#52525b] font-medium">
                      {p.brand || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {p.category_name ? (
                        <span className="px-2.5 py-1 rounded-lg bg-[#f4f4f5] text-[#52525b] font-medium">
                          {p.category_name}
                        </span>
                      ) : (
                        <span className="text-[#a1a1aa]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
