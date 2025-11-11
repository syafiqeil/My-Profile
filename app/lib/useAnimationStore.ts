"use client";
/*
  Ini adalah "penyimpanan" (store) kustom kita.
  Ini menggunakan localStorage untuk menyimpan pilihan animasi
  sehingga bisa di-share antara halaman utama dan halaman settings.
*/
import { useState, useEffect } from 'react';

// Tipe animasi yang tersedia
export type AnimationType = 'dino' | 'walker' | 'orbs' | string; // string untuk ekstensi kustom

// Tipe data untuk ekstensi
export interface AnimationExtension {
  id: string; // nama repo, cth: "syafiqeil/animasi-hujan"
  name: string; // nama Tampilan, cth: "Animasi Hujan"
}

// Nilai default
const DEFAULTS = {
  animation: 'dino' as AnimationType,
  extensions: [] as AnimationExtension[],
};

// Fungsi helper untuk mendapatkan data dari localStorage dengan aman
function getStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const saved = localStorage.getItem(key);
  try {
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error("Gagal parse localStorage", e);
    return defaultValue;
  }
}

export const useAnimationStore = () => {
  // 1. State untuk animasi yang sedang aktif
  const [activeAnimation, setActiveAnimation] = useState<AnimationType>(() =>
    getStorageValue('animation_setting', DEFAULTS.animation)
  );

  // 2. State untuk daftar ekstensi yang diimpor
  const [extensions, setExtensions] = useState<AnimationExtension[]>(() =>
    getStorageValue('animation_extensions', DEFAULTS.extensions)
  );
  
  // 3. State ini 'hack' untuk memastikan localStorage terbaca setelah
  //    komponen di-mount (dihidrasi) di klien, menghindari error server/client mismatch.
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    // Saat komponen mount, set isHydrated
    setIsHydrated(true);
  }, []);

  // Efek untuk MENYIMPAN ke localStorage setiap kali state berubah
  useEffect(() => {
    localStorage.setItem('animation_setting', JSON.stringify(activeAnimation));
  }, [activeAnimation]);

  useEffect(() => {
    localStorage.setItem('animation_extensions', JSON.stringify(extensions));
  }, [extensions]);

  // Fungsi untuk menambah ekstensi baru (dari "GitHub")
  const addExtension = (repoUrl: string) => {
    // Logika impor GitHub yang sebenarnya rumit (perlu API route).
    // Untuk SAAT INI, kita hanya tambahkan placeholder:
    const newExtension: AnimationExtension = {
      id: repoUrl,
      name: repoUrl.split('/').pop() || 'Animasi Kustom', // Ambil nama repo
    };
    setExtensions((prev) => [...prev, newExtension]);
  };
  
  // Hanya kembalikan nilai SETELAH terhidrasi
  return {
    activeAnimation: isHydrated ? activeAnimation : DEFAULTS.animation,
    extensions: isHydrated ? extensions : DEFAULTS.extensions,
    setActiveAnimation,
    addExtension,
    isHydrated, // Kita kembalikan ini agar UI tahu kapan harus render
  };
};