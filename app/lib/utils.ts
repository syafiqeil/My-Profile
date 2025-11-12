// app/lib/utils.ts

/**
 * Mengubah URL IPFS (ipfs://...) atau URL preview (blob:...)
 * menjadi URL HTTP yang dapat di-render oleh browser.
 * Menggunakan gateway Pinata yang andal.
 */
export const resolveIpfsUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  // Jika ini adalah URL IPFS, ganti dengan gateway Pinata
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  }
  
  // Jika ini sudah blob atau http, biarkan saja
  if (url.startsWith('blob:') || url.startsWith('http')) {
    return url;
  }
  
  return null;
};