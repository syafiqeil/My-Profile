"use client";

import Link from 'next/link';
import React from 'react';

// Layout ini akan memberi tombol "Kembali"
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full flex-col bg-neutral-100 p-4 pt-8 md:p-8">
      <div className="mb-4 max-w-3xl mx-auto w-full">
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          &larr; Kembali ke Dasbor
        </Link>
      </div>
      <div className="max-w-3xl mx-auto w-full rounded-xl bg-white shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-6">
          Pengaturan Dasbor
        </h1>
        {children}
      </div>
    </main>
  );
}