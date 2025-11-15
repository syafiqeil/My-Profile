// app/api/proxy-json/route.ts
import { NextRequest, NextResponse } from 'next/server';

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'cloudflare-ipfs.com';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cid = searchParams.get('cid');

  if (!cid) {
    return NextResponse.json({ error: 'CID tidak ditemukan' }, { status: 400 });
  }

  try {
    const ipfsUrl = `https://${PINATA_GATEWAY}/ipfs/${cid}`;
    const response = await fetch(ipfsUrl);

    if (!response.ok) {
      throw new Error(`Gagal mengambil JSON dari IPFS: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Kembalikan JSON yang berhasil diambil
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Gagal mem-proxy JSON:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}