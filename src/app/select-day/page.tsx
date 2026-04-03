import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { ensureBootstrap } from "@/lib/bootstrap";
import { getServerAuthUser } from "@/lib/auth";
import { getCurrentDateInIST, getDayLock } from "@/lib/festDay";
import SelectDayButtons from "@/components/SelectDayButtons";

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

        <SelectDayButtons allowedDay={allowedDay} blockedDay={blockedDay} />
      </section>
    </main>
  );
}
