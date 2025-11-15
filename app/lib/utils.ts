// app/lib/utils.ts

import { useState, useEffect } from 'react';

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';

/**
 * Mengubah URL IPFS (ipfs://...) atau URL preview (blob:...)
 * menjadi URL HTTP yang dapat di-render oleh browser.
 * Menggunakan gateway Pinata yang andal.
 */
export const resolveIpfsUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  if (url.startsWith('ipfs://')) {
    // Gunakan variabel yang sudah kita definisikan
    return url.replace('ipfs://', `https://${PINATA_GATEWAY}/ipfs/`);
  }
  
  if (url.startsWith('blob:') || url.startsWith('http')) {
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