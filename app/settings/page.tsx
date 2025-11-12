"use client";

import { useState } from 'react';
import { useAnimationStore } from '../lib/useAnimationStore'; 
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const {
    activeAnimation,
    setActiveAnimation,
    extensions,
    addExtension,
    isHydrated, 
    logout
  } = useAnimationStore();

  const [repoUrl, setRepoUrl] = useState('');
  const router = useRouter();
  
  const handleImport = () => {
    if (repoUrl.trim()) {
      addExtension(repoUrl.trim());
      setRepoUrl(''); 
    }
  };

  const handleDisconnect = () => { 
    logout();
    router.push('/'); 
  };
 
  if (!isHydrated) {
    return (
      <div className="text-zinc-500">
        Memuat pengaturan...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Bagian 1. Animasi Bawaan */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Animasi Bawaan
        </h2>
        <div className="flex flex-col gap-2">
          {/* Opsi 1 */}
          <label className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300">
            <input
              type="radio"
              name="animation"
              value="dino"
              checked={activeAnimation === 'dino'}
              onChange={(e) => setActiveAnimation(e.target.value)}
            />
            Dino (Error 404)
          </label>
          {/* Opsi 2 */}
          <label className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300">
            <input
              type="radio"
              name="animation"
              value="walker"
              checked={activeAnimation === 'walker'}
              onChange={(e) => setActiveAnimation(e.target.value)}
            />
            Walker & Bird
          </label>
          {/* Opsi 3 */}
          <label className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300">
            <input
              type="radio"
              name="animation"
              value="orbs"
              checked={activeAnimation === 'orbs'}
              onChange={(e) => setActiveAnimation(e.target.value)}
            />
            Floating Orbs
          </label>
        </div>
      </section>

      {/* Bagian 2. Impor Ekstensi */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Impor Ekstensi (dari GitHub)
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="username/nama-repo"
            className="flex-grow rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleImport}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Impor
          </button>
        </div>
      </section>

      {/* Bagian 3. Gunakan Ekstensi */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Ekstensi Terpasang
        </h2>
        {extensions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Belum ada ekstensi yang diimpor.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {extensions.map((ext) => (
              <label
                key={ext.id}
                className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300"
              >
                <input
                  type="radio"
                  name="animation"
                  value={ext.id}
                  checked={activeAnimation === ext.id}
                  onChange={(e) => setActiveAnimation(e.target.value)}
                />
                {ext.name}
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Bagian 5. Disconnect */}
      <section className="pt-6">
        <button
          onClick={handleDisconnect}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Disconnect Wallet
        </button>
      </section>
    </div>
  );
}