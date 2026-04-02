import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/routeAuth";
import { StudentModel } from "@/models/student";
import { syncStudentTextExport } from "@/lib/exportText";
import { EntryModel } from "@/models/entry";

export const runtime = "nodejs";

function parsePassNumbers(input: string) {
  return input
    .split(/[\s,\/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const query = request.nextUrl.searchParams.get("query")?.trim();
  const festDay = request.nextUrl.searchParams.get("festDay");
  const limit = Number(request.nextUrl.searchParams.get("limit") || "50");

  const filter = query
    ? {
        $or: [
          { passNumbers: query },
          { phoneNo: query },
          { name: { $regex: query, $options: "i" } },
        ],
      }
    : {};

  const students = await StudentModel.find(filter).sort({ serialNo: 1, createdAt: 1 }).limit(limit).lean();

  if (festDay !== "2026-04-06" && festDay !== "2026-04-07") {
    return NextResponse.json({ students });
  }

  const allPassNos = students.flatMap((student) => student.passNumbers);
  const dayEntries = allPassNos.length
    ? await EntryModel.find({ passNo: { $in: allPassNos }, festDay }).sort({ createdAt: -1 }).lean()
    : [];
  const timelineEntries = allPassNos.length
    ? await EntryModel.find({ passNo: { $in: allPassNos } }).sort({ createdAt: -1 }).lean()
    : [];

  const latestEntryByPass = new Map<string, (typeof dayEntries)[number]>();
  for (const entry of dayEntries) {
    if (!latestEntryByPass.has(entry.passNo)) {
      latestEntryByPass.set(entry.passNo, entry);
    }
  }

  const timelineByPass = new Map<string, (typeof timelineEntries)>();
  for (const entry of timelineEntries) {
    const existing = timelineByPass.get(entry.passNo);
    if (existing) existing.push(entry);
    else timelineByPass.set(entry.passNo, [entry]);
  }

  const studentsWithStatus = students.map((student) => {
    const studentEntries = student.passNumbers
      .map((passNo) => latestEntryByPass.get(passNo))
      .filter((entry): entry is NonNullable<(typeof dayEntries)[number]> => Boolean(entry));

    const latestForStudent = studentEntries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    const gateStatus = !latestForStudent
      ? "NOT_ENTERED"
      : latestForStudent.action === "ENTRY"
        ? "INSIDE"
        : "OUTSIDE";

    const history = student.passNumbers
      .flatMap((passNo) => timelineByPass.get(passNo) || [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((entry, index, arr) => {
        if (index === 0) return true;
        const prev = arr[index - 1];
        // Hide consecutive duplicate actions for same pass/day to keep timeline logical.
        return !(prev.passNo === entry.passNo && prev.festDay === entry.festDay && prev.action === entry.action);
      })
      .map((entry) => ({
        passNo: entry.passNo,
        action: entry.action,
        festDay: entry.festDay,
        operatorUsername: entry.operatorUsername,
        createdAt: entry.createdAt,
      }));

    return {
      ...student,
      gateStatus,
      lastGateAction: latestForStudent?.action || null,
      lastGateTime: latestForStudent?.createdAt || null,
      timeline: history,
    };
  });

  return NextResponse.json({ students: studentsWithStatus });
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error || !user) return error;

  const body = (await request.json()) as {
    serialNo?: number;
    name?: string;
    classRoll?: string;
    passNumbers?: string;
    phoneNo?: string;
    notes?: string;
  };

  if (!body.name || !body.classRoll || !body.passNumbers || !body.phoneNo) {
    return NextResponse.json(
      { error: "name, classRoll, passNumbers, and phoneNo are required." },
      { status: 400 }
    );
  }

  const passNos = parsePassNumbers(body.passNumbers);
  if (!passNos.length) {
    return NextResponse.json({ error: "At least one pass number is required." }, { status: 400 });
  }

  const lastStudent = await StudentModel.findOne().sort({ serialNo: -1 }).lean();
  const serialNo = Number.isFinite(body.serialNo)
    ? Number(body.serialNo)
    : lastStudent?.serialNo
      ? lastStudent.serialNo + 1
      : 1;

  const student = await StudentModel.create({
    serialNo,
    name: body.name.trim(),
    classRoll: body.classRoll.trim(),
    passNumbers: passNos,
    phoneNo: body.phoneNo.trim(),
    notes: body.notes?.trim() || "",
    source: "manual",
    updatedBy: user.username,
  });

  await syncStudentTextExport();

  return NextResponse.json({ student });
}
