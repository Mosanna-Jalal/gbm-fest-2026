import initialStudents from "../../data/initial_students.json";
import { syncStudentTextExport } from "@/lib/exportText";
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
  if (count === 0) {
    const docs = (initialStudents as SeedStudent[]).map((student) => ({
      ...student,
      notes: "",
      source: "pdf-import",
      updatedBy: "system",
    }));

    if (docs.length) {
      await StudentModel.insertMany(docs, { ordered: false });
      await syncStudentTextExport();
    }
  }

  bootstrapped = true;
}
