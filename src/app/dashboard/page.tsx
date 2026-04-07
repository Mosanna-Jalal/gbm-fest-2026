import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";
import { connectToDatabase } from "@/lib/db";
import { ensureBootstrap } from "@/lib/bootstrap";
import { getServerAuthUser } from "@/lib/auth";
import { EntryModel } from "@/models/entry";
import { getCurrentDateInIST, getDayLock } from "@/lib/festDay";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ festDay?: string }>;
}) {
  await connectToDatabase();
  await ensureBootstrap();

  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login");
  }

  const currentDate = getCurrentDateInIST();
  const { allowedDay } = getDayLock(currentDate);
  const params = await searchParams;

  const requestedDay =
    params.festDay === "2026-04-06" || params.festDay === "2026-04-07"
      ? params.festDay
      : null;

  if (!requestedDay) {
    redirect("/select-day");
  }

  const initialFestDay = allowedDay || requestedDay;
  if (allowedDay && requestedDay !== allowedDay) {
    redirect(`/dashboard?festDay=${allowedDay}`);
  }

  const latestEntry = await EntryModel.findOne({ operatorUsername: user.username })
    .sort({ createdAt: -1 })
    .lean();

  const rawLastEntries = latestEntry?.batchId
    ? await EntryModel.find({ operatorUsername: user.username, batchId: latestEntry.batchId })
        .sort({ createdAt: -1 })
        .lean()
    : latestEntry
      ? await (async () => {
          const latestTime = new Date(latestEntry.createdAt).getTime();
          const recentEntries = await EntryModel.find({ operatorUsername: user.username })
            .sort({ createdAt: -1 })
            .limit(25)
            .lean();

          const groupedLegacyBatch = recentEntries.filter((entry) => {
            const diffMs = latestTime - new Date(entry.createdAt).getTime();
            return (
              diffMs >= 0 &&
              diffMs <= 15000 &&
              entry.action === latestEntry.action &&
              entry.festDay === latestEntry.festDay
            );
          });

          return groupedLegacyBatch.length ? groupedLegacyBatch : [latestEntry];
        })()
      : [];

  const day2PassNos = rawLastEntries
    .filter((e) => e.festDay === "2026-04-07")
    .map((e) => e.passNo);

  const day1StatusByPass = new Map<string, "NOT_ENTERED" | "INSIDE" | "OUTSIDE">();
  const day1TimeByPass = new Map<string, string | null>();

  if (day2PassNos.length) {
    const day1Entries = await EntryModel.find({
      passNo: { $in: day2PassNos },
      festDay: "2026-04-06",
    })
      .sort({ createdAt: -1 })
      .lean();

    for (const entry of day1Entries) {
      if (!day1StatusByPass.has(entry.passNo)) {
        day1StatusByPass.set(entry.passNo, entry.action === "ENTRY" ? "INSIDE" : "OUTSIDE");
        day1TimeByPass.set(entry.passNo, String(entry.createdAt));
      }
    }

    for (const passNo of day2PassNos) {
      if (!day1StatusByPass.has(passNo)) {
        day1StatusByPass.set(passNo, "NOT_ENTERED");
        day1TimeByPass.set(passNo, null);
      }
    }
  }

  const initialLastEntries = rawLastEntries.map((entry) => ({
    ...entry,
    day1GateStatus: entry.festDay === "2026-04-07" ? (day1StatusByPass.get(entry.passNo) ?? null) : null,
    day1LastActionTime: entry.festDay === "2026-04-07" ? (day1TimeByPass.get(entry.passNo) ?? null) : null,
  }));

  return (
    <DashboardClient
      username={user.username}
      initialStudents={[]}
      initialLastEntries={JSON.parse(JSON.stringify(initialLastEntries))}
      initialFestDay={initialFestDay}
      lockedDay={allowedDay}
    />
  );
}
