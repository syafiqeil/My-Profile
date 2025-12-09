// app/settings/activity/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react'; 
import { useAnimationStore, ActivityItem } from '@/app/lib/useAnimationStore';
import { useDebounce } from '@/app/lib/utils'; 

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5A2.5 2.5 0 0 1 4 16.5v-11A2.5 2.5 0 0 1 6.5 3H20v11H6.5A2.5 2.5 0 0 1 4 11.5v0Z" /></svg>
);
const AwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88" /></svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);

export default function ActivitySettingsPage() {
  const { profile, saveDraft, isHydrated } = useAnimationStore();
  const isInitialLoadDone = useRef(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // State lokal untuk formulir
  const [email, setEmail] = useState('');
  const [blogPosts, setBlogPosts] = useState<ActivityItem[]>([]);
  const [certificates, setCertificates] = useState<ActivityItem[]>([]);

  // State untuk input baru
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostUrl, setNewPostUrl] = useState('');
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertUrl, setNewCertUrl] = useState('');

  // --- 1. Muat data dari Global ke Lokal saat data SIAP ---
  useEffect(() => {
    // Hanya muat JIKA isHydrated true, profile ada, DAN kita belum memuat
    if (isHydrated && profile && !hasLoaded) {
      setEmail(profile.activity?.contactEmail || '');
      setBlogPosts(profile.activity?.blogPosts || []);
      setCertificates(profile.activity?.certificates || []);
      // Tandai bahwa pemuatan lokal selesai
      setHasLoaded(true);
    }
  }, [isHydrated, profile, hasLoaded]);

  // --- Logika Auto-Save ---
  const debouncedActivity = useDebounce({
    contactEmail: email,
    blogPosts: blogPosts,
    certificates: certificates
  }, 1000); // Tunda 1 detik

  // --- 3. Auto-Save ke Global State ---
  useEffect(() => {
    // JANGAN SIMPAN jika form belum terisi (hasLoaded false)
    if (!hasLoaded) {
      return;
    }
    
    // Simpan draf setiap kali nilai debounced berubah
    saveDraft({ activity: debouncedActivity });
    
  }, [debouncedActivity, saveDraft, hasLoaded]);

  // --- Handlers ---
  const handleAddPost = () => {
    if (!newPostTitle || !newPostUrl) return alert("Blog title and URL cannot be empty.");
    setBlogPosts([...blogPosts, { id: `blog_${Date.now()}`, title: newPostTitle, url: newPostUrl }]);
    setNewPostTitle('');
    setNewPostUrl('');
  };
  const handleRemovePost = (id: string) => {
    setBlogPosts(blogPosts.filter(post => post.id !== id));
  };
  
  const handleAddCert = () => {
    if (!newCertTitle || !newCertUrl) return alert("Certificate title and URL cannot be empty.");
    setCertificates([...certificates, { id: `cert_${Date.now()}`, title: newCertTitle, url: newCertUrl }]);
    setNewCertTitle('');
    setNewCertUrl('');
  };
  const handleRemoveCert = (id: string) => {
    setCertificates(certificates.filter(cert => cert.id !== id));
  };

  if (!isHydrated || !hasLoaded) {
    return <div className="text-zinc-500">Loading activity settings...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* --- 1. Pengaturan Kontak --- */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Contact Information
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700">Contact Email</label>
            <div className="flex items-center gap-2 mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2">
              <MailIcon />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@you.com"
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. Pengaturan Blog --- */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Blog Posts
        </h2>
        {/* Daftar Postingan */}
        <div className="flex flex-col gap-2 mb-4">
          {blogPosts.length > 0 ? blogPosts.map(post => (
            <ItemDisplay key={post.id} item={post} onRemove={handleRemovePost} />
          )) : (
            <p className="text-sm text-zinc-500">No blog posts yet.</p>
          )}
        </div>
        {/* Form Tambah Baru */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Post Title"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            type="url"
            value={newPostUrl}
            onChange={(e) => setNewPostUrl(e.target.value)}
            placeholder="https://link-to-blog.com"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleAddPost}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Add
          </button>
        </div>
      </section>
      
      {/* --- 3. Pengaturan Sertifikat --- */}
      <section>
        <h2 className="text-lg font-medium text-zinc-800 mb-3">
          Certificates
        </h2>
        {/* Daftar Sertifikat */}
        <div className="flex flex-col gap-2 mb-4">
          {certificates.length > 0 ? certificates.map(cert => (
            <ItemDisplay key={cert.id} item={cert} onRemove={handleRemoveCert} />
          )) : (
            <p className="text-sm text-zinc-500">No certificates yet.</p>
          )}
        </div>
        {/* Form Tambah Baru */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCertTitle}
            onChange={(e) => setNewCertTitle(e.target.value)}
            placeholder="Certificate Name"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            type="url"
            value={newCertUrl}
            onChange={(e) => setNewCertUrl(e.target.value)}
            placeholder="https://link-to-certificate.com"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleAddCert}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Add
          </button>
        </div>
      </section>
    </div>
  );
}

// Komponen helper untuk menampilkan item di daftar
const ItemDisplay = ({ item, onRemove }: { item: ActivityItem, onRemove: (id: string) => void }) => (
  <div className="flex items-center gap-2 w-full rounded-lg border border-zinc-200 px-3 py-2">
    <span className="text-zinc-500"><BookIcon /></span>
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm font-medium text-zinc-800 truncate hover:underline">
      {item.title}
    </a>
    <button onClick={() => onRemove(item.id)} className="text-zinc-500 hover:text-red-600" title="Delete">
      <TrashIcon />
    </button>
  </div>
);