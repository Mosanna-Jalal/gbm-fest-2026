import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/routeAuth";
import { syncStudentTextExport } from "@/lib/exportText";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  await syncStudentTextExport();
  const textPath = path.join(process.cwd(), "data", "student_records.txt");
  const content = await fs.readFile(textPath, "utf8");

  return new NextResponse(content, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": "attachment; filename=student_records.txt",
    },
  });
}
