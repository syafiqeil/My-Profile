// app/api/upload-json/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/app/lib/session';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  throw new Error("Kunci API Pinata belum diatur di .env.local");
}

export async function POST(request: NextRequest) {
  // 1. Verifikasi Sesi Pengguna
  const session = await getIronSession(await cookies(), sessionOptions);
  if (!session.address) {
    return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
  }

  try {
    // 2. Ambil data JSON dari body request
    const jsonData = await request.json();

    if (!jsonData) {
      return NextResponse.json({ error: 'Data JSON tidak ditemukan' }, { status: 400 });
    }

    // 3. Buat wrapper yang diminta oleh Pinata
    const pinataData = JSON.stringify({
      pinataContent: jsonData,
      pinataMetadata: {
        name: `Dasbor JSON - ${session.address}`,
        keyvalues: {
          userAddress: session.address
        }
      }
    });

    // 4. Upload ke Pinata menggunakan endpoint pinJSONToIPFS
    const pinataUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    const response = await axios.post(pinataUrl, pinataData, {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
    });

    // 5. Kembalikan IPFS Hash (CID) dari JSON tersebut
    return NextResponse.json({
      ok: true,
      ipfsHash: response.data.IpfsHash // Ini adalah "Master CID" kita
    });

  } catch (error) {
    console.error("Gagal upload JSON ke Pinata:", error);
    return NextResponse.json({ error: 'Gagal mengunggah JSON.' }, { status: 500 });
  }
}