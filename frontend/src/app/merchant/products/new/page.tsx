'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, Store } from '@/types';

export default function AddListingPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState('');

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(productSearch, 300);

  // Listing fields
  const [price, setPrice] = useState('');
  const [stockStatus, setStockStatus] = useState('IN_STOCK');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.stores.getMy()
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setStores(res.data);
          if (res.data.length === 1) {
            setSelectedStore(res.data[0].id || res.data[0]._id);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debouncedSearch.length < 2) { setProducts([]); return; }
    setIsSearching(true);
    api.products.list({ search: debouncedSearch, page_size: 10 })
      .then((res: any) => { if (res.success) setProducts(res.data); })
      .catch(() => {})
      .finally(() => setIsSearching(false));
  }, [debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productId = selectedProduct?.id || (selectedProduct as any)?._id;
    if (!productId || !selectedStore || !price) return;

    setIsSaving(true);
    setError('');
    try {
      await api.listings.create({
        store_id: selectedStore,
        product_id: productId,
        price: parseFloat(price),
        stock_status: stockStatus,
        image_url: imageUrl.trim() || undefined,
      });
      router.push('/merchant/products');
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">Add Product Listing</h1>
        <p className="text-xs text-neutral-500 mt-1">Select an item from the master catalogue and publish your store&apos;s price and availability</p>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="apple-glow-card p-6 sm:p-8 space-y-6 bg-white border-black/[0.08]">
        {/* Store Selection */}
        <div>
          <label className="label text-xs font-bold text-neutral-800">Select Store</label>
          {stores.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              No registered stores found. <a href="/merchant/store" className="font-bold underline text-orange-600">Create a store first.</a>
            </div>
          ) : (
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="select-field"
              required
            >
              <option value="">Choose a store...</option>
              {stores.map((store) => {
                const sId = store.id || (store as any)._id;
                return (
                  <option key={sId} value={sId}>
                    {store.name} ({store.city || store.town || 'No city'})
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Product Search */}
        <div>
          <label className="label text-xs font-bold text-neutral-800">Search Product Catalogue</label>
          <input
            value={productSearch}
            onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
            className="input-field"
            placeholder="Search by product name, brand, or model..."
            autoComplete="off"
          />

          {/* Search Results */}
          {isSearching && <div className="mt-2 text-xs text-neutral-400">Searching catalogue...</div>}
          {products.length > 0 && !selectedProduct && (
            <div className="mt-2 rounded-2xl divide-y divide-black/[0.06] max-h-64 overflow-y-auto animate-slide-down bg-white border border-black/[0.08] shadow-xl">
              {products.map((product) => {
                const pId = product.id || (product as any)._id;
                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => { setSelectedProduct(product); setProductSearch(product.name); setProducts([]); }}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50/60 transition-colors flex flex-col gap-0.5"
                  >
                    <div className="font-bold text-sm text-[#0a0a0a]">{product.name}</div>
                    <div className="text-xs text-neutral-500">
                      {product.brand}{product.model ? ` · ${product.model}` : ''} {product.category_name ? `· ${product.category_name}` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Product */}
          {selectedProduct && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-orange-50 border border-orange-200/80 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-base">📦</span>
                <span className="text-xs font-bold text-orange-950">
                  {selectedProduct.name} {selectedProduct.brand ? `(${selectedProduct.brand})` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedProduct(null); setProductSearch(''); }}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Product Image */}
        <div>
          <label className="label text-xs font-bold text-neutral-800 flex items-center justify-between">
            <span>Product Listing Image (URL)</span>
            <span className="text-[11px] font-normal text-neutral-400">Optional · Shown to customers</span>
          </label>
          <div className="flex gap-3 items-center">
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input-field flex-1"
              placeholder="https://example.com/product-image.jpg"
            />
            {imageUrl ? (
              <div className="w-11 h-11 rounded-xl border border-black/[0.08] overflow-hidden bg-neutral-100 flex-shrink-0 flex items-center justify-center shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            ) : selectedProduct?.image_url ? (
              <button
                type="button"
                onClick={() => setImageUrl(selectedProduct.image_url || '')}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 whitespace-nowrap"
              >
                Use Catalogue Image
              </button>
            ) : null}
          </div>
        </div>

        {/* Price and Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label text-xs font-bold text-neutral-800">Your Selling Price (₹)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label text-xs font-bold text-neutral-800">Stock Availability</label>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="select-field"
            >
              <option value="IN_STOCK">Available (In Stock)</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="LIMITED">Limited Stock</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-semibold">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !selectedProduct || !selectedStore}
            className="btn-primary px-7 py-2.5 rounded-xl text-xs font-semibold"
          >
            {isSaving ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
