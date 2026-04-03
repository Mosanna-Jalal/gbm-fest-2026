import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { ensureBootstrap } from "@/lib/bootstrap";
import { getServerAuthUser } from "@/lib/auth";
import { StudentModel } from "@/models/student";
import { EntryModel } from "@/models/entry";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  await connectToDatabase();
  await ensureBootstrap();

  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  const students = await StudentModel.find().sort({ serialNo: 1, createdAt: 1 }).lean();
  const allPassNos = students.flatMap((student) => student.passNumbers);

  const [day1Entries, day2Entries] = await Promise.all([
    EntryModel.find({ passNo: { $in: allPassNos }, festDay: "2026-04-06" }).sort({ createdAt: -1 }).lean(),
    EntryModel.find({ passNo: { $in: allPassNos }, festDay: "2026-04-07" }).sort({ createdAt: -1 }).lean(),
  ]);

  const latestDay1ByPass = new Map<string, (typeof day1Entries)[number]>();
  for (const entry of day1Entries) {
    if (!latestDay1ByPass.has(entry.passNo)) latestDay1ByPass.set(entry.passNo, entry);
  }

  const latestDay2ByPass = new Map<string, (typeof day2Entries)[number]>();
  for (const entry of day2Entries) {
    if (!latestDay2ByPass.has(entry.passNo)) latestDay2ByPass.set(entry.passNo, entry);
  }

  function getStatus(
    studentPassNos: string[],
    latestByPass: Map<string, (typeof day1Entries)[number]>
  ) {
    const latest = studentPassNos
      .map((passNo) => latestByPass.get(passNo))
      .filter((entry): entry is NonNullable<(typeof day1Entries)[number]> => Boolean(entry))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!latest) return "NOT_ENTERED";
    return latest.action === "ENTRY" ? "INSIDE" : "OUTSIDE";
  }

  const statusStyle = {
    NOT_ENTERED: "bg-slate-100 text-slate-700",
    INSIDE: "bg-emerald-100 text-emerald-700",
    OUTSIDE: "bg-orange-100 text-orange-700",
  } as const;

  const statusLabel = {
    NOT_ENTERED: "Not Entered",
    INSIDE: "Inside",
    OUTSIDE: "Gone Outside",
  } as const;

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
                <th className="px-3 py-2">Day 1 Status</th>
                <th className="px-3 py-2">Day 2 Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const day1Status = getStatus(student.passNumbers, latestDay1ByPass);
                const day2Status = getStatus(student.passNumbers, latestDay2ByPass);

                return (
                  <tr key={String(student._id)} className="border-t border-slate-100 text-sm">
                    <td className="px-3 py-2">{student.serialNo}</td>
                    <td className="px-3 py-2 font-medium">{student.name}</td>
                    <td className="px-3 py-2">{student.passNumbers.join("/")}</td>
                    <td className="px-3 py-2">{student.phoneNo}</td>
                    <td className="px-3 py-2">{student.classRoll}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusStyle[day1Status]}`}>
                        {statusLabel[day1Status]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusStyle[day2Status]}`}>
                        {statusLabel[day2Status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
