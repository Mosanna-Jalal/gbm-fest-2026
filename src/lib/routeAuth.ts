import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ensureBootstrap } from "@/lib/bootstrap";
import { getAuthUserFromToken, SESSION_COOKIE } from "@/lib/auth";

export async function requireAuth(request: NextRequest) {
  await connectToDatabase();
  await ensureBootstrap();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getAuthUserFromToken(token);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }

  return { user, error: null };
}
