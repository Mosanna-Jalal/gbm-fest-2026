import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAuth } from "@/lib/routeAuth";
import { StudentModel } from "@/models/student";
import { EntryModel } from "@/models/entry";

export const runtime = "nodejs";

type FestDay = "2026-04-06" | "2026-04-07";
type EntryAction = "ENTRY" | "EXIT";

function parsePassNumbers(text: string) {
  return text
    .split(/[\s,\/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error || !user) return error;

  const body = (await request.json()) as {
    passNos?: string;
    action?: EntryAction;
    festDay?: FestDay;
  };

  const passNos = parsePassNumbers(body.passNos || "");
  if (!passNos.length) {
    return NextResponse.json({ error: "Provide at least one pass number." }, { status: 400 });
  }

  if (body.action !== "ENTRY" && body.action !== "EXIT") {
    return NextResponse.json({ error: "Action must be ENTRY or EXIT." }, { status: 400 });
  }

  if (body.festDay !== "2026-04-06" && body.festDay !== "2026-04-07") {
    return NextResponse.json({ error: "Fest day must be 2026-04-06 or 2026-04-07." }, { status: 400 });
  }

  const students = await StudentModel.find({ passNumbers: { $in: passNos } }).lean();

  const byPass = new Map<string, (typeof students)[number]>();
  for (const student of students) {
    for (const pass of student.passNumbers) {
      if (!byPass.has(pass)) byPass.set(pass, student);
    }
  }

  const batchId = crypto.randomUUID();

  const latestEntries = await EntryModel.find({
    passNo: { $in: passNos },
    festDay: body.festDay,
  })
    .sort({ createdAt: -1 })
    .lean();

  const latestEntryByPass = new Map<string, (typeof latestEntries)[number]>();
  for (const entry of latestEntries) {
    if (!latestEntryByPass.has(entry.passNo)) {
      latestEntryByPass.set(entry.passNo, entry);
    }
  }

  const blockedAlreadyInside: string[] = [];

  const logsToCreate = passNos
    .map((passNo) => {
      const student = byPass.get(passNo);
      if (!student) return null;

      const latest = latestEntryByPass.get(passNo);
      if (body.action === "ENTRY" && latest?.action === "ENTRY") {
        blockedAlreadyInside.push(passNo);
        return null;
      }

      return {
        passNo,
        studentId: String(student._id),
        studentName: student.name,
        phoneNo: student.phoneNo,
        classRoll: student.classRoll,
        action: body.action,
        festDay: body.festDay,
        operatorUsername: user.username,
        batchId,
      };
    })
    .filter(Boolean);

  const createdLogs = logsToCreate.length ? await EntryModel.insertMany(logsToCreate) : [];
  const missingPassNos = passNos.filter((passNo) => !byPass.has(passNo));

  return NextResponse.json({
    createdCount: createdLogs.length,
    missingPassNos,
    blockedPassNos: blockedAlreadyInside,
    createdLogs,
    batchId,
  });
}
