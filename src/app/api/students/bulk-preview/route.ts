import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/routeAuth";
import { StudentModel } from "@/models/student";
import { EntryModel } from "@/models/entry";

export const runtime = "nodejs";

function parsePassNumbers(text: string) {
  return text
    .split(/[\s,\/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const body = (await request.json()) as {
    passNos?: string;
    festDay?: "2026-04-06" | "2026-04-07";
    action?: "ENTRY" | "EXIT";
  };
  const passNos = parsePassNumbers(body.passNos || "");

  if (!passNos.length) {
    return NextResponse.json({ error: "Provide at least one pass number." }, { status: 400 });
  }

  const students = await StudentModel.find({ passNumbers: { $in: passNos } }).lean();
  const festDay = body.festDay;
  const action = body.action;

  const latestEntries =
    festDay === "2026-04-06" || festDay === "2026-04-07"
      ? await EntryModel.find({ passNo: { $in: passNos }, festDay }).sort({ createdAt: -1 }).lean()
      : [];

  const byPass = new Map<string, (typeof students)[number]>();
  for (const student of students) {
    for (const pass of student.passNumbers) {
      if (!byPass.has(pass)) {
        byPass.set(pass, student);
      }
    }
  }

  const latestEntryByPass = new Map<string, (typeof latestEntries)[number]>();
  for (const entry of latestEntries) {
    if (!latestEntryByPass.has(entry.passNo)) {
      latestEntryByPass.set(entry.passNo, entry);
    }
  }

  const preview = passNos.map((passNo) => {
    const student = byPass.get(passNo);
    if (!student) {
      return { passNo, status: "NOT_FOUND" as const };
    }

    return {
      passNo,
      status: "FOUND" as const,
      gateStatus:
        latestEntryByPass.get(passNo)?.action === "ENTRY"
          ? ("INSIDE" as const)
          : latestEntryByPass.get(passNo)?.action === "EXIT"
            ? ("OUTSIDE" as const)
            : ("NOT_ENTERED" as const),
      blockedForEntry:
        action === "ENTRY" && latestEntryByPass.get(passNo)?.action === "ENTRY",
      student: {
        _id: student._id,
        serialNo: student.serialNo,
        name: student.name,
        classRoll: student.classRoll,
        phoneNo: student.phoneNo,
        passNumbers: student.passNumbers,
      },
    };
  });

  return NextResponse.json({ preview });
}
