import { NextResponse } from "next/server";
import { clearSessionByToken, SESSION_COOKIE } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await connectToDatabase();

  const cookieHeader = request.headers.get("cookie") || "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  if (sessionCookie) {
    const token = decodeURIComponent(sessionCookie.split("=")[1] || "");
    if (token) {
      await clearSessionByToken(token);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
