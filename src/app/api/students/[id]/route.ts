import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/routeAuth";
import { StudentModel } from "@/models/student";
import { syncStudentTextExport } from "@/lib/exportText";
import { normalizeNameAndClassRoll } from "@/lib/normalizeStudent";

export const runtime = "nodejs";

function parsePassNumbers(text: string) {
  return text
    .split(/[\s,\/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupePassNumbers(passNumbers: string[]) {
  return Array.from(new Set(passNumbers));
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
  if (error || !user) return error;

  const { id } = await context.params;

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

  const passNumbers = dedupePassNumbers(parsePassNumbers(body.passNumbers));
  if (!passNumbers.length) {
    return NextResponse.json({ error: "At least one pass number is required." }, { status: 400 });
  }

  const conflictingStudents = await StudentModel.find({
    _id: { $ne: id },
    passNumbers: { $in: passNumbers },
  })
    .select({ passNumbers: 1 })
    .lean();
  const duplicatePassNos = Array.from(
    new Set(
      conflictingStudents.flatMap((student) =>
        student.passNumbers.filter((passNo) => passNumbers.includes(passNo))
      )
    )
  );
  if (duplicatePassNos.length) {
    return NextResponse.json(
      {
        error: `Duplicate pass number(s): ${duplicatePassNos.join(", ")}. Each pass number can exist only once.`,
        duplicatePassNos,
      },
      { status: 409 }
    );
  }

  const student = await StudentModel.findByIdAndUpdate(
    id,
    {
      ...normalizeNameAndClassRoll(body.name, body.classRoll),
      serialNo: Number(body.serialNo) || 0,
      passNumbers,
      phoneNo: body.phoneNo.trim(),
      notes: body.notes?.trim() || "",
      updatedBy: user.username,
    },
    { new: true }
  ).lean();

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  await syncStudentTextExport();

  return NextResponse.json({ student });
}
