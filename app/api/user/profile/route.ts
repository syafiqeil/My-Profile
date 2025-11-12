// app/api/user/profile/route.ts

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/app/lib/session';
import { kv } from '@vercel/kv';

// Definisi tipe data Profil
interface Profile {
  name: string;
  bio: string;
  github: string;
  animation: string;
  // projects: any[];
  // activity: any;
}

// FUNGSI GET: Mengambil profil pengguna yang sedang login
export async function GET(request: Request) {
  const session = await getIronSession(await cookies(), sessionOptions);

  if (!session.address) {
    return Response.json({ error: 'Tidak terotentikasi' }, { status: 401 });
  }

  try {
    // Ambil profil dari KV menggunakan alamat wallet sebagai kunci
    const profile = await kv.get(`profile_${session.address}`);
    
    if (!profile) {
      // Ini pengguna baru yang belum mendaftar.
      return Response.json({ profile: null }, { status: 404 });
    }
    
    return Response.json({ profile });

  } catch (error) {
    console.error("Error GET /api/user/profile:", error);
    return Response.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

// FUNGSI POST: Menyimpan/Memperbarui profil pengguna yang sedang login
export async function POST(request: Request) {
  const session = await getIronSession(await cookies(), sessionOptions);

  if (!session.address) {
    return Response.json({ error: 'Tidak terotentikasi' }, { status: 401 });
  }

  try {
    // Ambil data baru dari body permintaan
    const newProfileData = (await request.json()) as Partial<Profile>;

    if (!newProfileData) {
      return Response.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    // Ambil profil yang ada saat ini (jika ada)
    const currentProfile = (await kv.get(`profile_${session.address}`)) || {};

    // Gabungkan data lama dengan data baru
    const updatedProfile = { ...currentProfile, ...newProfileData };

    // Simpan kembali ke KV
    await kv.set(`profile_${session.address}`, updatedProfile);
    
    return Response.json({ ok: true, profile: updatedProfile });

  } catch (error) {
    console.error("Error POST /api/user/profile:", error);
    return Response.json({ error: 'Gagal menyimpan data' }, { status: 500 });
  }
}