"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type StatusFilter = "ALL" | "NOT_ENTERED" | "INSIDE" | "OUTSIDE" | "ATTENDED";
type FestDay = "2026-04-06" | "2026-04-07";

const dayLabels: Record<FestDay, string> = {
  "2026-04-06": "Day 1",
  "2026-04-07": "Day 2",
};

const statusLabels: Record<StatusFilter, string> = {
  ALL: "All",
  NOT_ENTERED: "Not Entered",
  INSIDE: "Inside",
  OUTSIDE: "Gone Outside",
  ATTENDED: "Attended",
};

export default function StudentsFilters({
  selectedDay,
  selectedStatus,
}: {
  selectedDay: FestDay;
  selectedStatus: StatusFilter;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function navigate(day: FestDay, status: StatusFilter, key: string) {
    setPendingKey(key);
    startTransition(() => {
      router.push(`/students?day=${day}&status=${status}`);
    });
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(dayLabels) as FestDay[]).map((day) => {
          const key = `day-${day}`;
          const loading = isPending && pendingKey === key;
          return (
            <button
              key={day}
              type="button"
              onClick={() => navigate(day, selectedStatus, key)}
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-xs font-semibold border disabled:opacity-70 ${
                selectedDay === day
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-white text-slate-700 border-slate-300"
              }`}
            >
              {loading ? "Loading..." : dayLabels[day]}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(statusLabels) as StatusFilter[]).map((status) => {
          const key = `status-${status}`;
          const loading = isPending && pendingKey === key;
          return (
            <button
              key={status}
              type="button"
              onClick={() => navigate(selectedDay, status, key)}
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-xs font-semibold border disabled:opacity-70 ${
                selectedStatus === status
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300"
              }`}
            >
              {loading ? "Loading..." : statusLabels[status]}
            </button>
          );
        })}
      </div>
    </>
  );
}
