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

  return NextResponse.json({ entries });
}
