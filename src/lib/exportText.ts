import fs from "node:fs/promises";
import path from "node:path";
import { StudentModel } from "@/models/student";

export async function syncStudentTextExport() {
  const students = await StudentModel.find().sort({ serialNo: 1, createdAt: 1 }).lean();
  const lines = students.map((student) => {
    const pass = student.passNumbers.join("/");
    const note = student.notes ? ` | Notes:${student.notes}` : "";
    return `Pass:${pass} | Name:${student.name} | Class/Roll:${student.classRoll} | Phone:${student.phoneNo} | Serial:${student.serialNo}${note}`;
  });

  const dataDir = path.join(process.cwd(), "data");
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, "student_records.txt"), lines.join("\n"), "utf8");
}
