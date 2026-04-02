import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SessionModel } from "@/models/session";

const SESSION_COOKIE = "fest_session";

export type AuthUser = {
  userId: string;
  username: string;
};

export function hashPassword(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createSession(userId: string, username: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await SessionModel.create({ token, userId, username, expiresAt });

  return { token, expiresAt };
}

export async function clearSessionByToken(token: string) {
  await SessionModel.deleteOne({ token });
}

export async function getAuthUserFromToken(token?: string | null): Promise<AuthUser | null> {
  if (!token) return null;

  const session = await SessionModel.findOne({ token, expiresAt: { $gt: new Date() } }).lean();
  if (!session) return null;

  return {
    userId: session.userId,
    username: session.username,
  };
}

export async function getServerAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getAuthUserFromToken(token);
}

export { SESSION_COOKIE };
