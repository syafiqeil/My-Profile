// app/api/siwe/verify/route.ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SiweMessage } from 'siwe';
import { sessionOptions } from '@/app/lib/session';
import { kv } from '@vercel/kv';

export async function POST(request: Request) {
  const session = await getIronSession(await cookies(), sessionOptions);
  
  try {
    const { message, signature } = (await request.json()) as {
      message: string;
      signature: string;
    };
    
    if (!message || !signature) {
      throw new Error('Message and signature are required.');
    }

    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({
      signature,
      nonce: session.nonce,
    });

    if (!result.success) {
      throw new Error('Failed to verify signature.');
    }

    // Tanda tangan valid, buat sesi
    session.address = result.data.address;
    await session.save();

    // Ambil preferensi pengguna dari database (KV)
    const userPrefs = await kv.get(`prefs_${result.data.address}`);
    
    return Response.json({ 
      ok: true,
      animation: (userPrefs as any)?.animation || 'dino' // Default ke 'dino'
    });
  } catch (error) {
    console.error("Error in /api/siwe/verify:", error); 
    return Response.json({ ok: false, message: (error as Error).message }, { status: 500 });
  }
}