// app/settings/profile/page.tsx

"use client";
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useAnimationStore } from '@/app/lib/useAnimationStore'; 
import { useRouter } from 'next/navigation';
import { resolveIpfsUrl, useDebounce } from '@/app/lib/utils';

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
);
const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);

export default function ProfileSettingsPage() {
  const {
    profile,
    saveDraft, 
    activeAnimation,
    setActiveAnimation,
    extensions,
    addExtension,
    isHydrated,
    logout
  } = useAnimationStore();

  const router = useRouter();

  // --- State LOKAL untuk form ---
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [readmeFile, setReadmeFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [readmeFileName, setReadmeFileName] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const readmeInputRef = useRef<HTMLInputElement>(null);

  const isInitialLoadDone = useRef(false);

  // --- 1. Muat data dari Global ke Lokal saat komponen dimuat ---
  useEffect(() => {
    // Hanya muat JIKA isHydrated true, profile ada, DAN kita belum memuat
    if (isHydrated && profile && !hasLoaded) { 
      setName(profile.name || '');
      setBio(profile.bio || '');
      setGithub(profile.github || '');
      // @ts-ignore
      setProfileImagePreview(resolveIpfsUrl(profile.imageUrl) || "/profilgue.png");
      // @ts-ignore
      setReadmeFileName(profile.readmeName || null);
      
      // Tandai bahwa pemuatan lokal selesai
      setHasLoaded(true);
    }
  }, [isHydrated, profile, hasLoaded]);

  // --- 2. Buat Draf Debounced ---
  const debouncedDraft = useDebounce({
    name,
    bio,
    github,
    // Cek profileImageFile dulu, baru cek profile.imageUrl
    imageUrl: profileImageFile ? profileImagePreview : (profile?.imageUrl || null),
    readmeUrl: readmeFile ? URL.createObjectURL(readmeFile) : (profile?.readmeUrl || null),
    readmeName: readmeFileName,
  }, 1000); //

  // --- 3. Auto-Save ke Global State ---
  useEffect(() => {
    // JANGAN SIMPAN jika form belum terisi (hasLoaded false)
    if (!hasLoaded) {
      return; 
    }
    
    // Sekarang aman untuk auto-save
    saveDraft(debouncedDraft);
    
  }, [debouncedDraft, saveDraft, hasLoaded]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Simpan sebagai Base64 (data:url) 
        setProfileImagePreview(reader.result as string);
        setProfileImageFile(file); // Kita masih simpan file untuk upload
      };
      reader.readAsDataURL(file); // Baca sebagai Data URL
    }
  };
  const handleReadmeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.md') || file.type === 'text/markdown')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReadmeFile(file); 
        setReadmeFileName(file.name);
        // Perbarui draf dengan URL data
        saveDraft({ 
          readmeUrl: reader.result as string, 
          readmeName: file.name 
        });
      };
      reader.readAsDataURL(file); // Baca sebagai Data URL
    }
  };
  const handleRemoveReadme = () => {
    setReadmeFile(null);
    setReadmeFileName(null);
    // Kosongkan URL di draf
    saveDraft({ readmeUrl: null, readmeName: null });
    if(readmeInputRef.current) readmeInputRef.current.value = ""; 
  };
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

  // Tampilkan loading jika data global belum siap ATAU form lokal belum terisi
  if (!isHydrated || !hasLoaded) {
    return <div className="text-zinc-500">Memuat pengaturan profil...</div>;
  }

  // Gunakan 'displayImage' yang sudah ada
  const displayImage = profileImageFile ? profileImagePreview : resolveIpfsUrl(profile?.imageUrl) || "/profilgue.png";

  return (
    <div className="flex flex-col gap-8">
      
      {/* Bagian 1: Edit Profil */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-4">
          Profil Publik
        </h2>
      
        <div className="flex items-center gap-4 mb-6">
          <img
            src={displayImage}
            alt="Preview Foto Profil"
            width={80}
            height={80}
            className="rounded-full w-20 h-20 object-cover bg-zinc-100 border"
          />
          <div>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <ImageIcon /> Ganti Foto
            </button>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-xs text-zinc-500 mt-2">PNG, JPG, atau GIF. Ukuran 800x800px disarankan.</p>
          </div>
        </div>

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
            <input
              type="text"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="cth: syafiqeil"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">README.md</label>
            <div className="mt-1 flex items-center gap-3 w-full rounded-lg border border-zinc-300 px-3 py-2">
              <FileTextIcon />
              <span className="flex-1 text-sm text-zinc-700 truncate">
                {readmeFileName ? readmeFileName : <span className="text-zinc-400">Belum ada file README.md</span>}
              </span>
              {readmeFileName && (
                <button 
                  onClick={handleRemoveReadme} 
                  className="text-zinc-500 hover:text-red-600 flex-shrink-0"
                  title="Hapus file"
                >
                  <TrashIcon />
                </button>
              )}
              <button
                onClick={() => readmeInputRef.current?.click()}
                className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-200 flex-shrink-0"
              >
                Upload
              </button>
              <input
                type="file"
                ref={readmeInputRef}
                onChange={handleReadmeChange}
                accept=".md,text/markdown"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Garis pemisah */}
      <hr className="my-4 border-zinc-200" />

      {/* Bagian 2: Animasi Bawaan */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Animasi Bawaan
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Pilih salah satu animasi bawaan untuk ditampilkan di banner Anda.
        </p>
        <div className="flex flex-col gap-2">
          {/* Opsi Animasi Dino */}
          <label className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300 cursor-pointer">
            <input
              type="radio"
              name="animation"
              value="dino"
              checked={activeAnimation === 'dino'}
              onChange={(e) => setActiveAnimation(e.target.value)}
            />
            Dino (Error 404)
          </label>
          {/* Opsi Animasi Walker */}
          <label className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300 cursor-pointer">
            <input
              type="radio"
              name="animation"
              value="walker"
              checked={activeAnimation === 'walker'}
              onChange={(e) => setActiveAnimation(e.target.value)}
            />
            Walker & Bird
          </label>
          {/* Opsi Animasi Orbs */}
          <label className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300 cursor-pointer">
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
                className="flex items-center justify-between gap-3 p-3 border rounded-lg has-[:checked]:bg-zinc-50 has-[:checked]:border-zinc-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="animation"
                    value={ext.id}
                    checked={activeAnimation === ext.id}
                    onChange={(e) => setActiveAnimation(e.target.value)}
                  />
                  {ext.name}
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault(); 
                    alert('Logika hapus ekstensi akan ditambahkan di sini');
                    // Nanti: panggil fungsi removeExtension(ext.id)
                  }}
                  className="text-zinc-500 hover:text-red-600"
                  title="Hapus ekstensi"
                >
                  <TrashIcon />
                </button>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Garis pemisah */}
      <hr className="my-4 border-zinc-200" />

      {/* Bagian 5: Disconnect */}
      <section>
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