// app/api/proxy-media/route.ts
import { NextRequest } from 'next/server';

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'cloudflare-ipfs.com';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cid = searchParams.get('cid');

  if (!cid) {
    return new Response('CID (Content ID) tidak ditemukan.', { status: 400 });
  }

  try {
    const ipfsUrl = `https://${PINATA_GATEWAY}/ipfs/${cid}`;
    const response = await fetch(ipfsUrl);

    if (!response.ok) {
      throw new Error(`Gagal mengambil dari IPFS: ${response.status} ${response.statusText}`);
    }

    // Ambil sebagai ArrayBuffer (lebih stabil untuk streaming)
    const buffer = await response.arrayBuffer();
    
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error("Gagal mem-proxy media:", error.message);
    return new Response(error.message, { status: 500 });
  }
}