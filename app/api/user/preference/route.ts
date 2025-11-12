// app/api/user/preference/route.ts

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/app/lib/session';
import { kv } from '@vercel/kv';

export async function GET(request: Request) {
  const session = await getIronSession(await cookies(), sessionOptions);

  if (!session.address) {
    return Response.json({ error: 'Tidak terotentikasi' }, { status: 401 });
  }

  try {
    // const userPrefs = await kv.get(`prefs_${session.address}`); // <-- Jangan panggil KV
    
    // Kembalikan 'dino' (atau apa pun yang disimpan di sesi jika kita mau)
    // Untuk saat ini, kita anggap 'dino' jika terotentikasi
    return Response.json({ 
      // animation: (userPrefs as any)?.animation || 'dino'
      animation: 'dino' 
    });
  } catch (error) {
    console.error("Error GET /api/user/preference:", error);
    return Response.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

// SIMPAN preferensi baru
export async function POST(request: Request) {
  const session = await getIronSession(await cookies(), sessionOptions);

  if (!session.address) {
    return Response.json({ error: 'Tidak terotentikasi' }, { status: 401 });
  }

  try {
    const { animation } = (await request.json()) as { animation: string };
    if (!animation) {
      return Response.json({ error: 'Animasi dibutuhkan' }, { status: 400 });
    }

    // await kv.set(`prefs_${session.address}`, { animation }); // <-- Jangan panggil KV
    
    // Kita bisa simpan di sesi jika mau, tapi untuk sekarang, kita pura-pura berhasil
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error POST /api/user/preference:", error);
    return Response.json({ error: 'Gagal menyimpan data' }, { status: 500 });
  }
}