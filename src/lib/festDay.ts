export function getDayLock(currentDateISO: string) {
  if (currentDateISO === "2026-04-06") {
    return { allowedDay: "2026-04-06" as const, blockedDay: "2026-04-07" as const };
  }

  if (currentDateISO === "2026-04-07") {
    return { allowedDay: "2026-04-07" as const, blockedDay: "2026-04-06" as const };
  }

  return { allowedDay: null, blockedDay: null };
}

export function getCurrentDateInIST() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(now);
}
