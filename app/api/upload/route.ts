// app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/app/lib/session';

// Ambil kunci rahasia dari .env.local
// Pastikan nama ini SAMA PERSIS dengan yang ada di file .env.local Anda
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  throw new Error("Kunci API Pinata belum diatur di .env.local");
}

export async function POST(request: NextRequest) {
  // 1. Verifikasi Sesi Pengguna
  // Kita tambahkan ini agar HANYA pengguna yang sudah login
  // yang dapat menggunakan endpoint upload Anda.
  const session = await getIronSession(await cookies(), sessionOptions);
  if (!session.address) {
    return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
  }

  // 2. Dapatkan FormData dari request frontend
  const requestFormData = await request.formData();
  const file = requestFormData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
  }

  // 3. Buat FormData baru untuk dikirim ke Pinata
  const pinataFormData = new FormData();
  // Konversi 'File' menjadi 'Buffer' agar bisa dikirim oleh server Node.js
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  pinataFormData.append('file', fileBuffer, {
    filename: file.name,
    contentType: file.type,
  });

  // Tambahkan metadata (opsional tapi bagus)
  pinataFormData.append('pinataMetadata', JSON.stringify({
    name: `Profil Dasbor - ${file.name}`,
    keyvalues: {
      userAddress: session.address // Tandai file ini milik siapa
    }
  }));

  // 4. Upload ke Pinata
  try {
    const pinataUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    const response = await axios.post(pinataUrl, pinataFormData, {
      maxBodyLength: Infinity, // Wajib untuk file besar (seperti video)
      headers: {
        'Content-Type': `multipart/form-data; boundary=${pinataFormData.getBoundary()}`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
    });

    // 5. Kembalikan IPFS Hash (CID) ke frontend
    return NextResponse.json({ 
      ok: true, 
      ipfsHash: response.data.IpfsHash // Ini adalah CID: "Qm..."
    });

  } catch (error) {
    console.error("Gagal upload ke Pinata:", error);
    return NextResponse.json({ error: 'Gagal mengunggah file.' }, { status: 500 });
  }
}