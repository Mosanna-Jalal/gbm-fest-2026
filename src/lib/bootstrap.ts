import initialStudents from "../../data/initial_students.json";
import { syncStudentTextExport } from "@/lib/exportText";
import { normalizeNameAndClassRoll } from "@/lib/normalizeStudent";
import { AdminModel } from "@/models/admin";
import { StudentModel } from "@/models/student";

let bootstrapped = false;

const adminSeeds = [
  { username: "admin1", password: "theycallmemj", displayName: "Gate Admin 1" },
  { username: "admin2", password: "theycallmemj", displayName: "Gate Admin 2" },
  { username: "admin3", password: "theycallmemj", displayName: "Gate Admin 3" },
  { username: "admin4", password: "theycallmemj", displayName: "Gate Admin 4" },
];

type SeedStudent = {
  serialNo: number;
  name: string;
  classRoll: string;
  passNumbers: string[];
  phoneNo: string;
};

export async function ensureBootstrap() {
  if (bootstrapped) return;

  for (const admin of adminSeeds) {
    const exists = await AdminModel.findOne({ username: admin.username }).lean();
    if (!exists) {
      await AdminModel.create({
        username: admin.username,
        password: admin.password,
        displayName: admin.displayName,
      });
    } else {
      await AdminModel.updateOne(
        { username: admin.username },
        {
          $set: { password: admin.password, displayName: admin.displayName },
          $unset: { passwordHash: "" },
        }
      );
    }
  }

  const count = await StudentModel.estimatedDocumentCount();
  let needsTextSync = false;

  if (count === 0) {
    const docs = (initialStudents as SeedStudent[]).map((student) => {
      const normalized = normalizeNameAndClassRoll(student.name, student.classRoll);
      return {
      ...student,
      name: normalized.name,
      classRoll: normalized.classRoll,
      notes: "",
      source: "pdf-import",
      updatedBy: "system",
      };
    });

    if (docs.length) {
      await StudentModel.insertMany(docs, { ordered: false });
      needsTextSync = true;
    }
  }

  const existingStudents = await StudentModel.find().lean();
  for (const student of existingStudents) {
    const normalized = normalizeNameAndClassRoll(student.name, student.classRoll);
    if (!normalized.changed) continue;

    await StudentModel.updateOne(
      { _id: student._id },
      { $set: { name: normalized.name, classRoll: normalized.classRoll, updatedBy: "system" } }
    );
    needsTextSync = true;
  }

  if (needsTextSync) {
    await syncStudentTextExport();
  }

  bootstrapped = true;
}
