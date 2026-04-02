import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { ensureBootstrap } from "@/lib/bootstrap";
import { connectToDatabase } from "@/lib/db";
import { AdminModel } from "@/models/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await connectToDatabase();
  await ensureBootstrap();

  const body = (await request.json()) as { username?: string; password?: string };
  const username = body.username?.trim();
  const password = body.password?.trim();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const admin = await AdminModel.findOne({ username }).lean();
  const plainMatch = Boolean(admin && admin.password === password);

  if (!admin || !plainMatch) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const session = await createSession(String(admin._id), admin.username);
  const response = NextResponse.json({ username: admin.username, displayName: admin.displayName });
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: session.expiresAt,
    path: "/",
  });

  return response;
}
