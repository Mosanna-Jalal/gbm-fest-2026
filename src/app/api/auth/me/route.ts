import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/routeAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error || !user) return error;

  return NextResponse.json({ username: user.username });
}
