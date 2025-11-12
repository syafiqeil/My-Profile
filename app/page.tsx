// app/page.tsx

"use client"; 

import ProfileCard from "./components/ProfileCard";
import ProjectCard from "./components/ProjectCard";
import ActivityCard from "./components/ActivityCard";
import { useAnimationStore } from './lib/useAnimationStore'; 
import Link from 'next/link';

export default function Home() {
  // Ambil state global
  const { profile, isAuthenticated, isLoading } = useAnimationStore();

  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full flex-col bg-black p-4 pt-8 md:p-8 items-center justify-center">
        <div className="text-white">Memuat sesi Anda...</div>
      </main>
    );
  }
  
  // Jika terhubung, tapi BELUM mendaftar (membuat profil)
  if (isAuthenticated && !profile) {
    return (
      <main className="flex min-h-screen w-full flex-col bg-black p-4 pt-8 md:p-8 items-center justify-center text-center">
        <div className="text-white text-2xl font-bold mb-4">Selamat Datang!</div>
        <p className="text-zinc-400 mb-6">Profil Anda belum diatur. Silakan ke halaman pengaturan.</p>
        <Link 
          href="/settings"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
        >
          Buka Pengaturan
        </Link>
      </main>
    )
  }

  // Jika sudah login DAN punya profil (atau jika belum login)
  // Kita akan biarkan ProfileCard yang menangani tampilan tombol login
  return (
    <main className="flex min-h-screen w-full flex-col bg-black p-4 pt-8 md:p-8">
      <div className="grid h-full flex-1 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-rows-2">
        <ProfileCard profile={profile} />
        <ProjectCard />
        <ActivityCard />
      </div>
    </main>
  );
}