"use client";
/*
  File ini dibuat BARU (atau DITIMPA) dengan perbaikan keamanan.
  Kita menambahkan try...catch block untuk menangani error
  jika localStorage tidak tersedia.
*/
import { useState, useEffect } from 'react';

// Tipe animasi yang tersedia
export type AnimationType = 'dino' | 'walker' | 'orbs' | string;

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

// --- FUNGSI HELPER BARU YANG LEBIH AMAN ---
function getStorageValue<T>(key: string, defaultValue: T): T {
  // Cek jika kita di server
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    // Coba akses localStorage
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    // Jika gagal (misal: diblokir oleh iframe),
    // log error dan kembalikan nilai default.
    console.warn(`localStorage.getItem gagal untuk key "${key}":`, e);
    return defaultValue;
  }
}

// --- FUNGSI HELPER BARU YANG LEBIH AMAN ---
function setStorageValue<T>(key: string, value: T) {
  // Cek jika kita di server
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Coba set localStorage
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Jika gagal (misal: diblokir oleh iframe),
    // log error.
    console.warn(`localStorage.setItem gagal untuk key "${key}":`, e);
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
  
  // 3. State 'isHydrated'
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Efek untuk MENYIMPAN ke localStorage
  useEffect(() => {
    if (isHydrated) { // Hanya simpan jika sudah di client
      setStorageValue('animation_setting', activeAnimation);
    }
  }, [activeAnimation, isHydrated]);

  useEffect(() => {
    if (isHydrated) { // Hanya simpan jika sudah di client
      setStorageValue('animation_extensions', extensions);
    }
  }, [extensions, isHydrated]);

  // Fungsi untuk menambah ekstensi baru
  const addExtension = (repoUrl: string) => {
    const newExtension: AnimationExtension = {
      id: repoUrl,
      name: repoUrl.split('/').pop() || 'Animasi Kustom',
    };
    setExtensions((prev) => [...prev, newExtension]);
  };
  
  // Kembalikan nilai yang sudah "aman"
  return {
    activeAnimation: isHydrated ? activeAnimation : DEFAULTS.animation,
    extensions: isHydrated ? extensions : DEFAULTS.extensions,
    setActiveAnimation,
    addExtension,
    isHydrated,
  };
};