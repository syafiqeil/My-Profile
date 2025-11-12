// app/settings/layout.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useAnimationStore } from '@/app/lib/useAnimationStore';

// Helper untuk NavLink agar bisa mendeteksi halaman aktif
const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm font-medium ${
        isActive
          ? 'bg-zinc-100 text-zinc-900'
          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
      }`}
    >
      {children}
    </Link>
  );
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 2. Gunakan state global
  const { isPublishing, publishChangesToOnChain, isHydrated } = useAnimationStore();
  
  // 3. Hubungkan handler
  const handlePublish = async () => {
    if (window.confirm("Apakah Anda yakin ingin memublikasikan semua perubahan ke on-chain? Ini akan memerlukan transaksi (gas fee).")) {
      await publishChangesToOnChain();
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-neutral-100 p-4 pt-8 md:p-8">
      
      {/* Tombol Kembali */}
      <div className="mb-4 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          &larr; Kembali ke Dasbor
        </Link>
      </div>

      {/* Kontainer Utama Pengaturan */}
      <div className="max-w-5xl mx-auto w-full rounded-xl bg-white shadow-sm p-6">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Pengaturan Dasbor
          </h1>
          {/* 4. Perbarui Tombol Publikasi */}
          <button
            onClick={handlePublish}
            disabled={!isHydrated || isPublishing} 
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {isPublishing ? "Memublikasikan..." : "Publikasikan ke On-Chain"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Kolom Navigasi */}
          <aside className="md:col-span-1">
            <nav className="flex flex-col gap-1">
              <NavLink href="/settings/profile">Profil Publik</NavLink>
              <NavLink href="/settings/projects">Proyek</NavLink>
              <NavLink href="/settings/activity">Aktivitas</NavLink>
              {/* Tambahkan link pengaturan lain di sini jika perlu */}
            </nav>
          </aside>

          {/* Kolom Konten (Halaman akan dirender di sini) */}
          <div className="md:col-span-3">
            {children}
          </div>
          
        </div>
      </div>
    </main>
  );
}