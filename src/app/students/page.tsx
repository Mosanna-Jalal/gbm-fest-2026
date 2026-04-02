import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { ensureBootstrap } from "@/lib/bootstrap";
import { getServerAuthUser } from "@/lib/auth";
import { StudentModel } from "@/models/student";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  await connectToDatabase();
  await ensureBootstrap();

  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  const students = await StudentModel.find().sort({ serialNo: 1, createdAt: 1 }).lean();

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <section className="max-w-6xl mx-auto rounded-2xl bg-white/95 border border-white shadow-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">Record View</p>
            <h1 className="text-lg sm:text-2xl font-bold">Full Pass List</h1>
            <p className="text-xs text-slate-600 mt-1">Total records: {students.length}</p>
          </div>
          <Link href="/select-day" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-center">
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-4 overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50 text-xs text-slate-700">
              <tr>
                <th className="px-3 py-2">Serial</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Pass No.</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Class / Roll</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={String(student._id)} className="border-t border-slate-100 text-sm">
                  <td className="px-3 py-2">{student.serialNo}</td>
                  <td className="px-3 py-2 font-medium">{student.name}</td>
                  <td className="px-3 py-2">{student.passNumbers.join("/")}</td>
                  <td className="px-3 py-2">{student.phoneNo}</td>
                  <td className="px-3 py-2">{student.classRoll}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
