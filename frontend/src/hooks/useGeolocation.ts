/**
 * Geolocation hook — automatic real-time browser location with fallback and persistence.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  error: string | null;
  isLoading: boolean;
  isReady: boolean;
  requestLocation: () => void;
  setLocation: (lat: number, lng: number, name?: string) => void;
}

export const PRESET_LOCATIONS = [
  { name: 'Ghatkesar, Hyderabad', lat: 17.4868, lng: 78.7023 },
  { name: 'Shyampet, Warangal', lat: 18.0468, lng: 79.6079 },
  { name: 'Hitech City, Hyderabad', lat: 17.4483, lng: 78.3915 },
  { name: 'Secunderabad', lat: 17.4399, lng: 78.4983 },
  { name: 'Ameerpet, Hyderabad', lat: 17.4375, lng: 78.4482 },
];

export function useGeolocation(): LocationData {
  // Start with null to match SSR and avoid Next.js hydration mismatch
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const setLocation = useCallback((lat: number, lng: number, name?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    const resolvedName = name || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    setLocationName(resolvedName);
    setError(null);
    setIsReady(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_lat', String(lat));
      localStorage.setItem('user_lng', String(lng));
      localStorage.setItem('user_location_name', resolvedName);
      window.dispatchEvent(new CustomEvent('location_changed', { detail: { lat, lng, name: resolvedName } }));
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'User-Agent': 'LocalMartHyperlocal/1.0' },
      });
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const locality =
          address.suburb ||
          address.neighbourhood ||
          address.residential ||
          address.village ||
          address.town ||
          address.city_district ||
          address.city ||
          'Nearby';
        const city = address.city || address.state_district || address.state || '';
        const name = city ? `${locality}, ${city}` : locality;
        setLocationName(name);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_location_name', name);
          window.dispatchEvent(new CustomEvent('location_changed', { detail: { lat, lng, name } }));
        }
      }
    } catch {
      // Fallback to coordinates
      const fallback = `Near ${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      setLocationName(fallback);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_location_name', fallback);
      }
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setIsLoading(false);
        setIsReady(true);

        if (typeof window !== 'undefined') {
          localStorage.setItem('user_lat', String(lat));
          localStorage.setItem('user_lng', String(lng));
        }

        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLoading(false);
        setIsReady(true);
        const denied = err.code === 1;
        setError(
          denied
            ? 'Location permission denied. Select your neighborhood manually.'
            : 'Unable to detect real-time GPS.'
        );

        // If no location stored yet, use the closest default local hub (Ghatkesar, Hyderabad)
        if (typeof window !== 'undefined') {
          const savedLat = localStorage.getItem('user_lat');
          if (!savedLat) {
            const defaultLoc = PRESET_LOCATIONS[0];
            setLocation(defaultLoc.lat, defaultLoc.lng, defaultLoc.name);
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  }, [reverseGeocode, setLocation]);

  // Read saved location on client mount or trigger auto-request
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLat = localStorage.getItem('user_lat');
      const savedLng = localStorage.getItem('user_lng');
      const savedName = localStorage.getItem('user_location_name');

      if (savedLat && savedLng) {
        setLatitude(parseFloat(savedLat));
        setLongitude(parseFloat(savedLng));
        if (savedName) setLocationName(savedName);
        setIsReady(true);
      } else {
        requestLocation();
      }
    }
  }, [requestLocation]);

  // Sync across tabs/components
  useEffect(() => {
    function handleLocationSync(e: Event) {
      const customEvent = e as CustomEvent<{ lat: number; lng: number; name: string }>;
      if (customEvent.detail) {
        setLatitude(customEvent.detail.lat);
        setLongitude(customEvent.detail.lng);
        setLocationName(customEvent.detail.name);
        setIsReady(true);
      }
    }

    window.addEventListener('location_changed', handleLocationSync);
    return () => window.removeEventListener('location_changed', handleLocationSync);
  }, []);

  return { latitude, longitude, locationName, error, isLoading, isReady, requestLocation, setLocation };
}
