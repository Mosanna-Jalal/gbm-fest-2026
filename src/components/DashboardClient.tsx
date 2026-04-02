"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Student = {
  _id: string;
  serialNo: number;
  name: string;
  classRoll: string;
  passNumbers: string[];
  phoneNo: string;
  notes?: string;
  gateStatus?: "NOT_ENTERED" | "INSIDE" | "OUTSIDE";
  lastGateAction?: "ENTRY" | "EXIT" | null;
  lastGateTime?: string | null;
  timeline?: Array<{
    passNo: string;
    action: "ENTRY" | "EXIT";
    festDay: "2026-04-06" | "2026-04-07";
    operatorUsername: string;
    createdAt: string;
  }>;
};

type LastEntry = {
  passNo: string;
  studentName: string;
  action: "ENTRY" | "EXIT";
  festDay: "2026-04-06" | "2026-04-07";
  createdAt: string;
};

type PreviewRow = {
  passNo: string;
  status: "FOUND" | "NOT_FOUND";
  gateStatus?: "NOT_ENTERED" | "INSIDE" | "OUTSIDE";
  blockedForEntry?: boolean;
  blockedForExit?: boolean;
  student?: Student;
};

const dayLabels: Record<"2026-04-06" | "2026-04-07", string> = {
  "2026-04-06": "Day 1 (6 Apr)",
  "2026-04-07": "Day 2 (7 Apr)",
};

const actionColors: Record<"ENTRY" | "EXIT", string> = {
  ENTRY: "text-emerald-700 bg-emerald-100",
  EXIT: "text-orange-700 bg-orange-100",
};

const gateStatusLabel: Record<"NOT_ENTERED" | "INSIDE" | "OUTSIDE", string> = {
  NOT_ENTERED: "Not Entered",
  INSIDE: "Entered (Inside)",
  OUTSIDE: "Gone Outside",
};

const gateStatusClass: Record<"NOT_ENTERED" | "INSIDE" | "OUTSIDE", string> = {
  NOT_ENTERED: "text-slate-700",
  INSIDE: "text-emerald-700",
  OUTSIDE: "text-orange-700",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

export default function DashboardClient({
  username,
  initialStudents,
  initialLastEntries,
  initialFestDay,
  lockedDay,
}: {
  username: string;
  initialStudents: Student[];
  initialLastEntries: LastEntry[];
  initialFestDay: "2026-04-06" | "2026-04-07";
  lockedDay: "2026-04-06" | "2026-04-07" | null;
}) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [lastEntries, setLastEntries] = useState<LastEntry[]>(initialLastEntries);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    id: "",
    serialNo: "",
    name: "",
    classRoll: "",
    passNumbers: "",
    phoneNo: "",
    notes: "",
  });

  const [bulkPassNos, setBulkPassNos] = useState("");
  const [bulkAction, setBulkAction] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [festDay, setFestDay] = useState<"2026-04-06" | "2026-04-07">(initialFestDay);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);

  const previewStats = useMemo(() => {
    const found = previewRows.filter((row) => row.status === "FOUND").length;
    return { found, notFound: previewRows.length - found };
  }, [previewRows]);

  async function loadStudents(searchQuery?: string, day?: "2026-04-06" | "2026-04-07") {
    const search = searchQuery ?? query;
    const selectedDay = day ?? festDay;
    if (!search.trim()) {
      setStudents([]);
      return;
    }
    const params = new URLSearchParams();
    params.set("query", search.trim());
    params.set("festDay", selectedDay);
    const response = await fetch(`/api/students?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setStudents(data.students || []);
    }
  }

  async function loadLastEntry() {
    const response = await fetch("/api/entries/last-me");
    if (!response.ok) return;
    const data = await response.json();
    setLastEntries(data.entries || []);
  }

  function updateFormField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setHasSearched(true);
    await loadStudents();
  }

  async function handleSaveBuyer(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/students/${form.id}` : "/api/students";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serialNo: Number(form.serialNo),
        name: form.name,
        classRoll: form.classRoll,
        passNumbers: form.passNumbers,
        phoneNo: form.phoneNo,
        notes: form.notes,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || "Failed to save buyer");
      return;
    }

    setMessage(form.id ? "Buyer updated successfully." : "Buyer added successfully.");
    setForm({ id: "", serialNo: "", name: "", classRoll: "", passNumbers: "", phoneNo: "", notes: "" });
    await loadStudents();
  }

  function startEdit(student: Student) {
    setForm({
      id: student._id,
      serialNo: String(student.serialNo),
      name: student.name,
      classRoll: student.classRoll,
      passNumbers: student.passNumbers.join("/"),
      phoneNo: student.phoneNo,
      notes: student.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePreview() {
    setMessage("");
    const response = await fetch("/api/students/bulk-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passNos: bulkPassNos, festDay, action: bulkAction }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || "Failed to preview.");
      return;
    }

    setPreviewRows(data.preview || []);
  }

  async function handleSubmitBulk() {
    setMessage("");
    const response = await fetch("/api/entries/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passNos: bulkPassNos, action: bulkAction, festDay }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || "Bulk submit failed");
      return;
    }

    const missing = data.missingPassNos?.length ? ` Missing: ${data.missingPassNos.join(", ")}` : "";
    const blocked = data.blockedPassNos?.length
      ? ` Blocked (already entered): ${data.blockedPassNos.join(", ")}`
      : "";
    const blockedExit = data.blockedExitPassNos?.length
      ? ` Blocked (cannot exit without active entry): ${data.blockedExitPassNos.join(", ")}`
      : "";
    const invalidHint = data.missingPassNos?.length
      ? ` Invalid pass no. Add pass no.: ${data.missingPassNos.join(", ")}`
      : "";
    setMessage(`${data.createdCount} records submitted.${missing}${blocked}${blockedExit}${invalidHint}`);
    setPreviewRows([]);
    setBulkPassNos("");
    if (Array.isArray(data.createdLogs) && data.createdLogs.length) {
      setLastEntries(data.createdLogs);
    } else {
      await loadLastEntry();
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen p-2 sm:p-6">
      <section className="max-w-6xl mx-auto rounded-2xl sm:rounded-3xl bg-[var(--card)]/95 backdrop-blur border border-white shadow-xl p-3 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">Centralized Gate Control</p>
            <h1 className="text-lg sm:text-2xl font-bold">GBM Fest Entry Recorder</h1>
            <p className="text-xs text-slate-600 mt-1">Logged in as {username}. Last record panel is private per admin.</p>
          </div>
          <div className="grid grid-cols-1 sm:flex gap-2 w-full sm:w-auto">
            <Link
              href="/students"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 text-center w-full sm:w-auto"
            >
              Full List
            </Link>
            <button
              type="button"
              onClick={() => window.open("/api/students/export-text", "_blank")}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 w-full sm:w-auto"
            >
              Download Text File
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-semibold w-full sm:w-auto"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
          <p className="text-xs font-semibold">Active Fest Day</p>
          <div className="grid grid-cols-1 sm:flex gap-2 mt-2">
            {(Object.keys(dayLabels) as Array<"2026-04-06" | "2026-04-07">).map((day) => (
              <button
                key={day}
                onClick={() => {
                  if (lockedDay && lockedDay !== day) return;
                  setFestDay(day);
                  if (query.trim()) {
                    void loadStudents(query, day);
                  }
                }}
                disabled={Boolean(lockedDay && lockedDay !== day)}
                className={`rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold ${
                  festDay === day ? "bg-[var(--accent)] text-white" : "bg-white border border-slate-300"
                } ${lockedDay && lockedDay !== day ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {dayLabels[day]}
              </button>
            ))}
          </div>
          {lockedDay ? (
            <p className="text-[11px] text-slate-500 mt-2">
              Today only {dayLabels[lockedDay]} is allowed.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h2 className="text-base font-bold">Search by Pass No. / Phone</h2>
            <form className="mt-3 flex flex-col sm:flex-row gap-2" onSubmit={handleSearch}>
              <input
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
                placeholder="e.g. 0210 or 8102890923"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (!event.target.value.trim()) {
                    setHasSearched(false);
                    setStudents([]);
                  }
                }}
              />
              <button className="rounded-xl bg-[var(--accent)] text-white px-4 py-2 font-semibold w-full sm:w-auto" type="submit">
                Search
              </button>
            </form>

            <div className="mt-3 max-h-80 overflow-auto space-y-2">
              {students.map((student) => (
                <div key={student._id} className="rounded-xl border border-slate-200 p-3 bg-white">
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-xs text-slate-600">Pass: {student.passNumbers.join("/")} | Phone: {student.phoneNo}</p>
                  <p className="text-xs text-slate-600">Class/Roll: {student.classRoll}</p>
                  {student.gateStatus ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${gateStatusClass[student.gateStatus]}`}
                      >
                        {gateStatusLabel[student.gateStatus]}
                      </span>
                      {student.lastGateTime ? (
                        <span className="text-xs text-slate-500">
                          {formatTime(student.lastGateTime)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <button
                    className="mt-2 text-xs font-semibold text-[var(--accent)]"
                    onClick={() => startEdit(student)}
                    type="button"
                  >
                    Edit
                  </button>
                  {student.timeline?.length ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                        Timeline ({student.timeline.length})
                      </summary>
                      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                        {student.timeline.map((event, idx) => (
                          <p key={`${event.passNo}-${event.createdAt}-${idx}`} className="text-xs text-slate-600">
                            {formatDateTime(event.createdAt)} | {dayLabels[event.festDay]} | Pass {event.passNo} |{" "}
                            <span className={event.action === "ENTRY" ? "text-emerald-700 font-semibold" : "text-orange-700 font-semibold"}>
                              {event.action}
                            </span>{" "}
                            | by {event.operatorUsername}
                          </p>
                        ))}
                      </div>
                    </details>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">Timeline: No in/out records yet.</p>
                  )}
                </div>
              ))}
              {!students.length && query.trim() && hasSearched ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-700">Invalid pass no. / phone no.</p>
                  <p className="text-xs text-red-700 mt-1">Please add pass no. from the Add / Edit Buyer section.</p>
                </div>
              ) : !query.trim() ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">
                    Search by pass/phone to view a record, or open Full List for all students.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h2 className="text-base font-bold">Add / Edit Buyer</h2>
            <form className="grid gap-2 mt-3" onSubmit={handleSaveBuyer}>
              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Serial no"
                value={form.serialNo}
                onChange={(event) => updateFormField("serialNo", event.target.value)}
                required
              />
              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Name"
                value={form.name}
                onChange={(event) => updateFormField("name", event.target.value)}
                required
              />
              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Class / Roll"
                value={form.classRoll}
                onChange={(event) => updateFormField("classRoll", event.target.value)}
                required
              />
              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Pass numbers (e.g. 0207/0213)"
                value={form.passNumbers}
                onChange={(event) => updateFormField("passNumbers", event.target.value)}
                required
              />
              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Phone"
                value={form.phoneNo}
                onChange={(event) => updateFormField("phoneNo", event.target.value)}
                required
              />
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Optional notes"
                value={form.notes}
                onChange={(event) => updateFormField("notes", event.target.value)}
                rows={2}
              />

              <div className="grid grid-cols-1 sm:flex gap-2">
                <button className="rounded-xl bg-[var(--accent)] text-white px-4 py-2 font-semibold w-full sm:w-auto" type="submit">
                  {form.id ? "Update Buyer" : "Add Buyer"}
                </button>
                {form.id ? (
                  <button
                    className="rounded-xl border border-slate-300 px-4 py-2 font-semibold w-full sm:w-auto"
                    type="button"
                    onClick={() =>
                      setForm({
                        id: "",
                        serialNo: "",
                        name: "",
                        classRoll: "",
                        passNumbers: "",
                        phoneNo: "",
                        notes: "",
                      })
                    }
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h2 className="text-base font-bold">Bulk Pass Submission</h2>
            <p className="text-xs text-slate-600 mt-1">Paste pass numbers separated by comma, slash, space, or new line.</p>

            <textarea
              className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2"
              rows={4}
              placeholder="0210, 0211, 0212"
              value={bulkPassNos}
              onChange={(event) => setBulkPassNos(event.target.value)}
            />

            <div className="mt-3 grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 w-full sm:w-auto"
                value={bulkAction}
                onChange={(event) => setBulkAction(event.target.value as "ENTRY" | "EXIT")}
              >
                <option value="ENTRY">ENTRY (in gate)</option>
                <option value="EXIT">EXIT (out gate)</option>
              </select>

              <button className="rounded-xl border border-slate-300 px-4 py-2 font-semibold w-full sm:w-auto" type="button" onClick={handlePreview}>
                Preview Details
              </button>
              <button className="rounded-xl bg-[var(--accent)] text-white px-4 py-2 font-semibold w-full sm:w-auto" type="button" onClick={handleSubmitBulk}>
                Submit Bulk
              </button>
            </div>

            <p className="text-xs mt-3 text-slate-700">Preview: {previewStats.found} found, {previewStats.notFound} not found</p>

            <div className="mt-2 max-h-72 overflow-auto space-y-2">
              {previewRows.map((row) => (
                <div key={`${row.passNo}-${row.status}`} className="rounded-xl border border-slate-200 p-3 bg-white">
                  <p className="font-semibold">Pass {row.passNo}</p>
                  {row.status === "FOUND" && row.student ? (
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>{row.student.name} | {row.student.phoneNo} | {row.student.classRoll}</p>
                      {row.gateStatus ? (
                        <p>
                          Status:{" "}
                          <span className={`font-semibold ${gateStatusClass[row.gateStatus]}`}>
                            {gateStatusLabel[row.gateStatus]}
                          </span>
                        </p>
                      ) : null}
                      {row.blockedForEntry ? (
                        <p className="text-[var(--danger)] font-semibold">Blocked: already entered (inside gate)</p>
                      ) : null}
                      {row.blockedForExit ? (
                        <p className="text-[var(--danger)] font-semibold">Blocked: cannot exit before valid entry.</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--danger)]">Invalid pass no. Add pass no. in Add / Edit Buyer.</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <h2 className="text-base font-bold">Your Last Submission</h2>
            {lastEntries.length ? (
              <div className="mt-3 space-y-2 max-h-64 overflow-auto">
                {lastEntries.map((entry, index) => (
                  <div key={`${entry.passNo}-${entry.createdAt}-${index}`} className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="font-semibold">{entry.studentName}</p>
                    <p className="text-xs text-slate-600">Pass: {entry.passNo}</p>
                    <p className="text-xs text-slate-600">Day: {dayLabels[entry.festDay]}</p>
                    <p className={`inline-flex mt-2 rounded-full px-2 py-1 text-xs font-bold ${actionColors[entry.action]}`}>
                      {entry.action}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{formatDateTime(entry.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 mt-3">No entries submitted by you yet.</p>
            )}
          </div>
        </div>

        {message ? <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-medium">{message}</p> : null}
      </section>
    </main>
  );
}
