// app/api/siwe/nonce/route.ts

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { generateNonce } from 'siwe';
import { sessionOptions } from '@/app/lib/session'; 

export async function GET(request: Request) {
  console.log("=============================");
  console.log("API /api/siwe/nonce DIPANGGIL");
  console.log("SESSION_PASSWORD ADA:", !!process.env.SESSION_PASSWORD);

  try {
    const session = await getIronSession(await cookies(), sessionOptions);
    session.nonce = generateNonce();
    await session.save();
    
    console.log("Nonce berhasil dibuat dan disimpan ke sesi."); 
    return new Response(session.nonce, { status: 200 });
  } catch (error) {
    console.error("!!! ERROR DI API NONCE:", error);
    return new Response(String(error), { status: 500 });
  }
}