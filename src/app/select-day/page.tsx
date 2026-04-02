import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { ensureBootstrap } from "@/lib/bootstrap";
import { getServerAuthUser } from "@/lib/auth";
import { getCurrentDateInIST, getDayLock } from "@/lib/festDay";

const dayLabels: Record<"2026-04-06" | "2026-04-07", string> = {
  "2026-04-06": "Day 1 (6 Apr)",
  "2026-04-07": "Day 2 (7 Apr)",
};

export const dynamic = "force-dynamic";

export default async function SelectDayPage() {
  await connectToDatabase();
  await ensureBootstrap();

  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  const currentDate = getCurrentDateInIST();
  const { allowedDay, blockedDay } = getDayLock(currentDate);

  return (
    <main className="min-h-screen p-4 sm:p-8 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-2xl glass-card p-6 sm:p-8 space-y-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">GBM FEST 2026</p>
        <h1 className="text-2xl font-bold">Choose Fest Day</h1>
        <p className="text-sm text-slate-600">
          Logged in as <span className="font-semibold">{user.username}</span>. Date (IST): {currentDate}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(dayLabels) as Array<"2026-04-06" | "2026-04-07">).map((day) => {
            const isBlocked = blockedDay === day;
            return isBlocked ? (
              <button
                key={day}
                className="rounded-xl border border-slate-200 bg-slate-100 text-slate-400 px-4 py-3 text-left"
                disabled
              >
                <p className="font-semibold">{dayLabels[day]}</p>
                <p className="text-xs mt-1">Blocked for today</p>
              </button>
            ) : (
              <Link
                key={day}
                href={`/dashboard?festDay=${day}`}
                className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-left action-btn"
              >
                <p className="font-semibold text-[var(--accent)]">{dayLabels[day]}</p>
                <p className="text-xs mt-1 text-slate-600">
                  {allowedDay === day ? "Allowed today" : "Manual select"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
