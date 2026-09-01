import { useEffect, useState, useCallback } from "react";
import type { AnalysisResult, ExtractedPatient, Recommendation } from "./analysis.functions";
import type { AnalyzedMedicine, DetectedInteraction, Severity } from "./medical";

const SESSION_KEY = "ayursafe.session";
const REPORTS_KEY = "ayursafe.reports";

export type Session = { email: string; name: string; loggedInAt: number };

export type RiskLevel = Severity;
export type Interaction = DetectedInteraction;
export type { AnalyzedMedicine, ExtractedPatient, Recommendation };

export type Report = AnalysisResult & {
  id: string;
  title: string;
  date: string;
  createdAt: number;
};

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
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full — ignore, in-memory state still valid */
  }
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

/* -------- Pending upload (Upload → Processing) -------- */
/* The actual File is kept in memory: it never leaves the browser except as a
   direct request to our own analysis server function. */

export type PendingFile = { file: File; name: string; size: number; type: string };

let pendingFile: PendingFile | null = null;

export function setPendingFile(f: PendingFile) {
  pendingFile = f;
}

export function getPendingFile(): PendingFile | null {
  return pendingFile;
}

export function clearPendingFile() {
  pendingFile = null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

/* -------- Reports -------- */

export function getReports(): Report[] {
  const all = readJSON<Report[]>(REPORTS_KEY) ?? [];
  return all.filter((r) => r && Array.isArray(r.interactions) && Array.isArray(r.medicines));
}

export function saveReport(r: Report) {
  const all = getReports();
  all.unshift(r);
  writeJSON(REPORTS_KEY, all.slice(0, 50));
}

export function getReport(id: string): Report | null {
  return getReports().find((r) => r.id === id) ?? null;
}

export function clearReports() {
  removeKey(REPORTS_KEY);
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

/** Turn a fresh analysis into a persisted report. */
export function toReport(result: AnalysisResult): Report {
  const now = new Date();
  const names = result.medicines.map((m) => m.canonical ?? m.raw);
  const title =
    names.length === 0
      ? result.fileName
      : names.length <= 3
        ? names.join(", ")
        : `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
  return {
    ...result,
    extractedText: result.extractedText.slice(0, 4000),
    id: `r_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    date: now.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }),
    createdAt: now.getTime(),
  };
}
