"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { hashPassword, verifyPassword } from "@/lib/password";
import { normalizeUsername, passwordError, usernameError } from "@/lib/identity";
import { clientIp } from "@/lib/request";
import { clearSession, createSession } from "@/lib/session";
import { allow, record, used } from "@/server/data/rate-limit";
import { createLearner, getUserByLogin, getUsersByEmail } from "@/server/data/users";

const FIFTEEN_MIN = 15 * 60_000;

let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword("timing-equaliser-not-a-password"));

export async function loginAction(formData: FormData) {
  const login = formData.get("login")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const ip = await clientIp();

  let user = await getUserByLogin(login);
  if (login.includes("@")) {
    // Legacy accounts may share an email up to letter case: pick the one whose password matches.
    for (const candidate of await getUsersByEmail(login)) {
      if (await verifyPassword(password, candidate.passwordHash).catch(() => false)) {
        user = candidate;
        break;
      }
    }
  }
  // Lockout per ACCOUNT (username and email share one bucket) and per IP, 15 minutes.
  const acctKey = `login-fail:acct:${user?.id ?? login}`;
  if ((await used(acctKey, FIFTEEN_MIN)) >= 10 || (await used(`login-fail:ip:${ip}`, FIFTEEN_MIN)) >= 50) {
    redirect("/login?error=locked");
  }

  // Always run one scrypt so response time doesn't reveal whether the account exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash())).catch(() => false);
  if (!user || !valid) {
    await record(acctKey);
    await record(`login-fail:ip:${ip}`);
    redirect("/login?error=1");
  }

  await createSession({ userId: user.id, username: user.username, role: user.role, name: user.name });
  redirect(user.role === "STUDENT" ? "/" : "/admin");
}

export type SignupState = { error?: string; username?: string };

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const username = normalizeUsername(formData.get("username")?.toString() ?? "");
  const password = formData.get("password")?.toString() ?? "";

  const uErr = usernameError(username);
  if (uErr) return { error: uErr, username };
  const pErr = passwordError(password);
  if (pErr) return { error: pErr, username };

  if (!(await allow(`signup:ip:${await clientIp()}`, 5, 60 * 60_000))) {
    return { error: "Too many new accounts from this network. Try again in an hour.", username };
  }

  let user;
  try {
    user = await createLearner({ username, passwordHash: await hashPassword(password) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "That username is taken. Try another.", username };
    }
    throw e;
  }

  await createSession({ userId: user.id, username: user.username, role: user.role, name: user.name });
  redirect("/welcome");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
