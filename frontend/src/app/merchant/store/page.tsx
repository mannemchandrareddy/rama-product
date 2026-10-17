'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/utils';
import type { Store, Merchant, ApiResponse } from '@/types';

export default function MerchantStorePage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [town, setTown] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const merchantRes = (await api.merchants.getMe()) as ApiResponse<Merchant>;
        if (merchantRes.success && merchantRes.data) {
          setMerchant(merchantRes.data);
          setBusinessName(merchantRes.data.business_name);
        }
      } catch {}

      try {
        const storesRes = (await api.stores.getMy()) as ApiResponse<Store[]>;
        if (storesRes.success && storesRes.data?.length > 0) {
          const s = storesRes.data[0];
          setStore(s);
          setStoreName(s.name || '');
          setPhone(s.phone || '');
          setDescription(s.description || '');
          setAddress(s.address || '');
          setVillage(s.village || '');
          setTown(s.town || '');
          setCity(s.city || '');
          setDistrict(s.district || '');
          setState(s.state || '');
          setPincode(s.pincode || '');
          setLatitude(s.latitude?.toString() || '');
          setLongitude(s.longitude?.toString() || '');
        }
      } catch {}

      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      // Create or update merchant profile
      if (!merchant) {
        const merchantRes = (await api.merchants.createProfile({ business_name: businessName })) as ApiResponse<Merchant>;
        if (merchantRes.success) setMerchant(merchantRes.data);
      } else {
        await api.merchants.updateMe({ business_name: businessName });
      }

      const storeData = {
        name: storeName,
        phone,
        description,
        address,
        village: village || undefined,
        town: town || undefined,
        city,
        district,
        state,
        pincode: pincode || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      };

      const storeId = store?.id || (store as any)?._id;
      if (!storeId) {
        const storeRes = (await api.stores.create(storeData)) as ApiResponse<Store>;
        if (storeRes.success) {
          setStore(storeRes.data);
          setMessage('Store created! It will be visible to customers once approved.');
        }
      } else {
        const storeRes = (await api.stores.update(storeId, storeData)) as ApiResponse<Store>;
        if (storeRes.success) {
          setStore(storeRes.data);
          setMessage('Store details updated successfully.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
        },
        () => setError('Could not get your location')
      );
    }
  };

  if (isLoading) {
    return <div className="space-y-4 max-w-4xl mx-auto"><div className="skeleton h-8 w-48" /><div className="skeleton h-96 rounded-2xl" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">Store Profile</h1>
          <p className="text-xs text-neutral-500 mt-1">Configure your physical store details, address, and GPS coordinates</p>
        </div>
        {store && (
          <span className={cn('badge border text-xs px-3.5 py-1.5 font-semibold rounded-full', APPROVAL_STATUS_COLORS[store.approval_status])}>
            {APPROVAL_STATUS_LABELS[store.approval_status]}
          </span>
        )}
      </div>

      {message && (
        <div className="rounded-xl px-4 py-3 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in">
          ✅ {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl px-4 py-3 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="apple-glow-card p-6 sm:p-8 space-y-8 bg-white border-black/[0.08]">
        {/* Business Info */}
        <div>
          <h2 className="section-title mb-4">Business Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Business Name</label>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input-field" required placeholder="Your business name" />
            </div>
            <div>
              <label className="label">Store Name</label>
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="input-field" required placeholder="Store display name" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="section-title mb-4">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="9876543210" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field min-h-[80px]" placeholder="Describe your store..." />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h2 className="section-title mb-4">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" placeholder="Shop No, Street, Area" />
            </div>
            <div>
              <label className="label">Village</label>
              <input value={village} onChange={(e) => setVillage(e.target.value)} className="input-field" placeholder="Village (if applicable)" />
            </div>
            <div>
              <label className="label">Town</label>
              <input value={town} onChange={(e) => setTown(e.target.value)} className="input-field" placeholder="Town" />
            </div>
            <div>
              <label className="label">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="input-field" placeholder="City" />
            </div>
            <div>
              <label className="label">District</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} className="input-field" placeholder="District" />
            </div>
            <div>
              <label className="label">State</label>
              <input value={state} onChange={(e) => setState(e.target.value)} className="input-field" placeholder="State" />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input value={pincode} onChange={(e) => setPincode(e.target.value)} className="input-field" placeholder="515001" maxLength={6} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Location Coordinates</h2>
            <button type="button" onClick={useCurrentLocation} className="btn-ghost text-sm">📍 Use current location</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input value={latitude} onChange={(e) => setLatitude(e.target.value)} className="input-field" placeholder="14.6819" type="number" step="any" />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input value={longitude} onChange={(e) => setLongitude(e.target.value)} className="input-field" placeholder="77.6006" type="number" step="any" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="btn-primary px-8 py-3">
            {isSaving ? 'Saving...' : store ? 'Update Store' : 'Create Store'}
          </button>
        </div>
      </form>
    </div>
  );
}
