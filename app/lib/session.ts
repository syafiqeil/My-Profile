// app/lib/session.ts

import type { SessionOptions } from 'iron-session';

const SESSION_PASSWORD = process.env.SESSION_PASSWORD as string;

if (!SESSION_PASSWORD) {
  throw new Error('SESSION_PASSWORD is empty, this is unexpected.');
}

export const sessionOptions: SessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: 'user-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};