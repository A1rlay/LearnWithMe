import { cookies } from "next/headers";
import { cache } from "react";

import { prisma } from "@/server/db";

const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionData = {
  userId: string;
  username: string;
  role: string;
  name: string;
};

async function getKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set.");
  return crypto.subtle.importKey(
    "raw",
    Buffer.from(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getKey("sign");
  const buf = await crypto.subtle.sign("HMAC", key, Buffer.from(payload));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyHmac(payload: string, sig: string): Promise<boolean> {
  const expected = await sign(payload);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSession(data: SessionData): Promise<void> {
  const payload = JSON.stringify({ ...data, exp: Date.now() + SESSION_TTL_MS });
  const encoded = btoa(payload);
  const sig = await sign(payload);
  const value = `${encoded}.${sig}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Valid signature + not expired + the account still exists (a deleted user's cookie is
 * treated as signed out everywhere). Memoised per request.
 */
export const getSession = cache(async (): Promise<SessionData | null> => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie) return null;
  const session = await verifySessionValue(cookie.value);
  if (!session) return null;
  const exists = await prisma.user.count({ where: { id: session.userId } });
  return exists ? session : null;
});

export async function verifySessionValue(
  value: string,
): Promise<SessionData | null> {
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const encoded = value.slice(0, dotIndex);
  const sig = value.slice(dotIndex + 1);

  try {
    const payload = atob(encoded);
    const valid = await verifyHmac(payload, sig);
    if (!valid) return null;

    const data = JSON.parse(payload) as SessionData & { exp: number };
    if (Date.now() > data.exp) return null;

    return {
      userId: data.userId,
      username: data.username ?? "",
      role: data.role,
      name: data.name,
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
