"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type FestDay = "2026-04-06" | "2026-04-07";

const dayLabels: Record<FestDay, string> = {
  "2026-04-06": "Day 1 (6 Apr)",
  "2026-04-07": "Day 2 (7 Apr)",
};

export default function SelectDayButtons({
  allowedDay,
  blockedDay,
}: {
  allowedDay: FestDay | null;
  blockedDay: FestDay | null;
}) {
  const router = useRouter();
  const [pendingDay, setPendingDay] = useState<FestDay | null>(null);
  const [isPending, startTransition] = useTransition();

  function openDay(day: FestDay) {
    setPendingDay(day);
    startTransition(() => {
      router.push(`/dashboard?festDay=${day}`);
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(dayLabels) as FestDay[]).map((day) => {
        const isBlocked = blockedDay === day;
        const isLoading = pendingDay === day && isPending;

        if (isBlocked) {
          return (
            <button
              key={day}
              className="rounded-xl border border-slate-200 bg-slate-100 text-slate-400 px-4 py-3 text-left"
              disabled
            >
              <p className="font-semibold">{dayLabels[day]}</p>
              <p className="text-xs mt-1">Blocked for today</p>
            </button>
          );
        }

        return (
          <button
            key={day}
            type="button"
            onClick={() => openDay(day)}
            disabled={isPending}
            className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-left action-btn disabled:opacity-70"
          >
            <p className="font-semibold text-[var(--accent)]">{isLoading ? "Loading..." : dayLabels[day]}</p>
            <p className="text-xs mt-1 text-slate-600">{allowedDay === day ? "Allowed today" : "Manual select"}</p>
          </button>
        );
      })}
    </div>
  );
}
