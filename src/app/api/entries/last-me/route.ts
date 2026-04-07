import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/routeAuth";
import { EntryModel } from "@/models/entry";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error || !user) return error;

  const latestEntry = await EntryModel.findOne({ operatorUsername: user.username })
    .sort({ createdAt: -1 })
    .lean();

  if (!latestEntry) {
    return NextResponse.json({ entries: [] });
  }

  let entries;
  if (latestEntry.batchId) {
    entries = await EntryModel.find({
      operatorUsername: user.username,
      batchId: latestEntry.batchId,
    })
      .sort({ createdAt: -1 })
      .lean();
  } else {
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

    entries = groupedLegacyBatch.length ? groupedLegacyBatch : [latestEntry];
  }

  const day2PassNos = entries
    .filter((e) => e.festDay === "2026-04-07")
    .map((e) => e.passNo);

  const day1StatusByPass = new Map<string, "NOT_ENTERED" | "INSIDE" | "OUTSIDE">();

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
      }
    }

    for (const passNo of day2PassNos) {
      if (!day1StatusByPass.has(passNo)) {
        day1StatusByPass.set(passNo, "NOT_ENTERED");
      }
    }
  }

  const enrichedEntries = entries.map((entry) => ({
    ...entry,
    day1GateStatus: entry.festDay === "2026-04-07" ? (day1StatusByPass.get(entry.passNo) ?? null) : null,
  }));

  return NextResponse.json({ entries: enrichedEntries });
}
