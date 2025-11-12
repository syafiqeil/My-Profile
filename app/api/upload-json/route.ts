// app/api/upload-json/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/app/lib/session';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.error("Kunci API Pinata belum diatur di .env.local");
}

export async function POST(request: NextRequest) {
  // 1. Verifikasi Kunci API (Pengecekan runtime)
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    return NextResponse.json(
      { error: 'Kunci API Pinata belum dikonfigurasi di server.' }, 
      { status: 500 }
    );
  }

  // 2. Verifikasi Sesi Pengguna
  const session = await getIronSession(await cookies(), sessionOptions);
  if (!session.address) {
    return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
  }

  try {
    // 3. Ambil data JSON dari body request
    const jsonData = await request.json();

    if (!jsonData) {
      return NextResponse.json({ error: 'Data JSON tidak ditemukan' }, { status: 400 });
    }

    // 4. Buat wrapper yang diminta oleh Pinata
    const pinataData = JSON.stringify({
      pinataContent: jsonData,
      pinataMetadata: {
        name: `Dasbor JSON - ${session.address}`,
        keyvalues: {
          userAddress: session.address
        }
      }
    });

    // 5. Upload ke Pinata
    const pinataUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    const response = await axios.post(pinataUrl, pinataData, {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
    });

    // 6. Kembalikan IPFS Hash (CID) dari JSON tersebut
    return NextResponse.json({ 
      ok: true, 
      ipfsHash: response.data.IpfsHash 
    });

  } catch (error: any) {
    console.error("Gagal upload JSON ke Pinata:", error);
    let errorMessage = 'Gagal mengunggah JSON.';
    // Jika error datang dari Axios (Pinata)
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = `Error dari Pinata (${error.response.status}): ${JSON.stringify(error.response.data)}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}