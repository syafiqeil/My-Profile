// app/settings/page.tsx

"use client";
import { useState, useEffect } from 'react';
import { useAnimationStore } from '../lib/useAnimationStore';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const {
    // State & Fungsi Baru
    profile,
    saveProfile,
    
    // State & Fungsi Lama
    activeAnimation,
    setActiveAnimation,
    extensions,
    addExtension,
    isHydrated, 
    logout
  } = useAnimationStore();

  const router = useRouter();
  
  // State lokal untuk form
  const [repoUrl, setRepoUrl] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');

  // Efek untuk mengisi form saat profil dimuat
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setGithub(profile.github || '');
    }
  }, [profile]); 

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
  
  // Fungsi Simpan Profil
  const handleSaveProfile = async () => {
    await saveProfile({
      name: name,
      bio: bio,
      github: github,
    });
    alert("Profil Disimpan!");
  };

  if (!isHydrated) {
    return <div className="text-zinc-500">Memuat pengaturan...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Bagian 1: Edit Profil */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Profil Publik
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Informasi ini akan ditampilkan di halaman utama Anda.
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap Anda"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan tentang diri Anda..."
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Username GitHub</label>
            <div className="flex gap-2">
              <input
              type="text"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="cth: syafiqeil"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleSaveProfile}
              className="mt-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Simpan
            </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 2: Animasi Bawaan */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Animasi Bawaan
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Pilih salah satu animasi bawaan untuk ditampilkan di banner Anda.
        </p>
        <div className="flex flex-col gap-2">
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

      {/* Bagian 3: Impor Ekstensi */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Impor Ekstensi (dari GitHub)
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Tempel URL repositori GitHub. (Contoh: syafiqeil/animasi-hujan)
        </p>
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

      {/* Bagian 4: Gunakan Ekstensi */}
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

      {/* Bagian 5: Disconnect */}
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