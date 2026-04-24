import { useEffect, useState, useCallback } from "react";
import type { RiskLevel } from "@/components/RiskBadge";

const SESSION_KEY = "ayursafe.session";
const REPORTS_KEY = "ayursafe.reports";
const PENDING_KEY = "ayursafe.pendingFile";

export type Session = { email: string; name: string; loggedInAt: number };

export type Interaction = {
  a: string;
  b: string;
  severity: RiskLevel;
  summary: string;
};

export type Report = {
  id: string;
  title: string;
  date: string;
  createdAt: number;
  fileName: string;
  score: number;
  level: RiskLevel;
  interactions: Interaction[];
  explanation: string;
};

export type PendingFile = { name: string; size: number; type: string };

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("ayursafe:storage", { detail: { key } }));
}

function removeKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent("ayursafe:storage", { detail: { key } }));
}

/* -------- Session -------- */

export function getSession(): Session | null {
  return readJSON<Session>(SESSION_KEY);
}

export function setSession(s: Session) {
  writeJSON(SESSION_KEY, s);
}

export function clearSession() {
  removeKey(SESSION_KEY);
}

export function useSession(): Session | null {
  const [session, setSessionState] = useState<Session | null>(null);
  useEffect(() => {
    setSessionState(getSession());
    const onChange = () => setSessionState(getSession());
    window.addEventListener("ayursafe:storage", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("ayursafe:storage", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return session;
}

/* -------- Pending file (between Upload → Processing → Results) -------- */

export function setPendingFile(f: PendingFile) {
  writeJSON(PENDING_KEY, f);
}

export function getPendingFile(): PendingFile | null {
  return readJSON<PendingFile>(PENDING_KEY);
}

export function clearPendingFile() {
  removeKey(PENDING_KEY);
}

/* -------- Reports -------- */

export function getReports(): Report[] {
  return readJSON<Report[]>(REPORTS_KEY) ?? [];
}

export function saveReport(r: Report) {
  const all = getReports();
  all.unshift(r);
  writeJSON(REPORTS_KEY, all.slice(0, 50));
}

export function getReport(id: string): Report | null {
  return getReports().find((r) => r.id === id) ?? null;
}

export function useReports(): Report[] {
  const [reports, setReports] = useState<Report[]>([]);
  const refresh = useCallback(() => setReports(getReports()), []);
  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("ayursafe:storage", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("ayursafe:storage", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);
  return reports;
}

/* -------- Simulated AI analysis -------- */

const POOL: Interaction[] = [
  {
    a: "Ashwagandha",
    b: "Sertraline",
    severity: "moderate",
    summary:
      "Ashwagandha may potentiate serotonergic effects, slightly increasing the risk of serotonin syndrome.",
  },
  {
    a: "Brahmi",
    b: "Phenytoin",
    severity: "high",
    summary:
      "Brahmi can reduce phenytoin plasma levels via CYP induction, potentially causing breakthrough seizures.",
  },
  {
    a: "Triphala",
    b: "Metformin",
    severity: "safe",
    summary: "No clinically significant interaction observed at standard doses.",
  },
  {
    a: "St. John's Wort",
    b: "Warfarin",
    severity: "high",
    summary: "Strongly induces CYP2C9, lowering warfarin levels and INR — bleeding risk on dose changes.",
  },
  {
    a: "Tulsi",
    b: "Lisinopril",
    severity: "safe",
    summary: "Co-administration is well tolerated at culinary and standard supplemental doses.",
  },
  {
    a: "Turmeric",
    b: "Atorvastatin",
    severity: "moderate",
    summary: "High-dose curcumin may inhibit CYP3A4, raising statin exposure — monitor for myalgia.",
  },
  {
    a: "Garlic extract",
    b: "Aspirin",
    severity: "moderate",
    summary: "Both have antiplatelet activity — combined use may extend bleeding time.",
  },
];

export function generateAnalysis(fileName: string): Report {
  // Pick 2–4 interactions deterministically based on the file name
  const seed = Array.from(fileName).reduce((s, c) => s + c.charCodeAt(0), 0);
  const count = 2 + (seed % 3); // 2..4
  const picked: Interaction[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(POOL[(seed + i * 3) % POOL.length]);
  }

  const weights = { safe: 0, moderate: 15, high: 35 };
  const penalty = picked.reduce((sum, i) => sum + weights[i.severity], 0);
  const score = Math.max(15, Math.min(98, 100 - penalty + (seed % 10)));
  const level: RiskLevel = score >= 80 ? "safe" : score >= 50 ? "moderate" : "high";

  const now = new Date();
  const id = `r_${now.getTime().toString(36)}`;
  const title = picked
    .slice(0, 2)
    .map((p) => `${p.a} + ${p.b}`)
    .join(", ");

  const explanation =
    level === "high"
      ? "Multiple high-severity interactions detected. Review carefully before dispensing — consider substitutions for the flagged items."
      : level === "moderate"
        ? "Some moderate interactions were detected. Patient monitoring is recommended; substitutions may be advisable."
        : "No significant interactions detected. The combination appears safe at standard clinical doses.";

  return {
    id,
    title,
    date: now.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }),
    createdAt: now.getTime(),
    fileName,
    score,
    level,
    interactions: picked,
    explanation,
  };
}