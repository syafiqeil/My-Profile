// app/api/siwe/logout/route.ts

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/app/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getIronSession(await cookies(), sessionOptions);
    session.destroy(); // Hancurkan sesi
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, message: (error as Error).message }, { status: 500 });
  }
}