// app/lib/utils.ts

import { useState, useEffect } from 'react';

/**
 * Mengubah URL IPFS (ipfs://...) atau URL preview (blob:...)
 * menjadi URL HTTP yang dapat di-render oleh browser.
 * Menggunakan gateway Pinata yang andal.
 */
export const resolveIpfsUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    return `/api/proxy-media?cid=${cid}`;
  }
  
  if (url.startsWith('blob:') || url.startsWith('http')) {
    return url;
  }
  
  // Jika URL-nya sudah /api/proxy-media (dari draf lokal)
  if (url.startsWith('/api/proxy-media')) {
    return url;
  }
  
  return null;
};

// --- HOOK BARU UNTUK AUTO-SAVE ---
/**
 * Hook kustom untuk menunda (debounce) sebuah nilai.
 * Sangat berguna untuk auto-save.
 * @param value Nilai yang ingin ditunda (misal: 'profile.name')
 * @param delay Waktu tunda dalam milidetik (misal: 1000)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Atur timer untuk memperbarui nilai setelah 'delay'
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Bersihkan timer jika 'value' atau 'delay' berubah
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}