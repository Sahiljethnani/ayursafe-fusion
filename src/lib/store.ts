import { useEffect, useState, useCallback } from "react";
import type { Session as SupabaseSession, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult, ExtractedPatient, Recommendation } from "./analysis.functions";
import type { AnalyzedMedicine, DetectedInteraction, Severity } from "./medical";

export type Session = { id: string; email: string; name: string };

export type RiskLevel = Severity;
export type Interaction = DetectedInteraction;
export type { AnalyzedMedicine, ExtractedPatient, Recommendation };

export type Report = AnalysisResult & {
  id: string;
  title: string;
  date: string;
  createdAt: number;
};

/* -------- Session (derived from the auth provider, never local state) -------- */

export function sessionFromUser(user: User | null | undefined): Session | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta['full_name'] === "string" && meta['full_name']) ||
    (typeof meta['name'] === "string" && meta['name']) ||
    (user.email ?? "").split("@")[0] ||
    "Account";
  return { id: user.id, email: user.email ?? "", name: String(name) };
}

/** Reactive auth state backed by the auth provider's session. */
export function useAuth(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s: SupabaseSession | null) => {
      if (!mounted) return;
      setSession(sessionFromUser(s?.user ?? null));
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(sessionFromUser(data.session?.user ?? null));
      setLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

export function useSession(): Session | null {
  return useAuth().session;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getUser();
  return sessionFromUser(data.user);
}

export async function signOut() {
  await supabase.auth.signOut();
}

/* -------- Pending upload (Upload → Processing) -------- */

export type PendingFile = { file: File; name: string; size: number; type: string; ageYears?: number | null };

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

/* -------- Reports (stored per-user in the database, protected by RLS) -------- */

type ReportRow = {
  id: string;
  title: string;
  created_at: string;
  data: unknown;
};

function rowToReport(row: ReportRow): Report | null {
  const data = row.data as AnalysisResult | null;
  if (!data || !Array.isArray(data.interactions) || !Array.isArray(data.medicines)) return null;
  const created = new Date(row.created_at);
  return {
    ...data,
    id: row.id,
    title: row.title,
    date: created.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }),
    createdAt: created.getTime(),
  };
}

function titleFor(result: AnalysisResult): string {
  const names = result.medicines.map((m) => m.canonical ?? m.raw);
  if (names.length === 0) return result.fileName;
  return names.length <= 3
    ? names.join(", ")
    : `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
}

export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, title, created_at, data")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as ReportRow[]).map(rowToReport).filter((r): r is Report => r !== null);
}

export async function getReport(id: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, title, created_at, data")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToReport(data as ReportRow);
}

/** Persist a fresh analysis for the signed-in user. */
export async function saveReport(result: AnalysisResult): Promise<Report> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Your session expired. Please sign in again.");

  const payload: AnalysisResult = { ...result, extractedText: result.extractedText.slice(0, 4000) };
  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: userId,
      title: titleFor(result),
      file_name: result.fileName,
      safety_score: Math.round(result.score),
      risk_level: result.level,
      status: "complete",
      data: payload as unknown as never,
    })
    .select("id, title, created_at, data")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not save this report.");
  const report = rowToReport(data as ReportRow);
  if (!report) throw new Error("Could not save this report.");
  return report;
}

/** Delete every report owned by the signed-in user (RLS scopes the delete). */
export async function deleteAllReports(): Promise<{ error: Error | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { error: new Error("Not signed in.") };
  const { error } = await supabase.from("reports").delete().eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export function useReports(): { reports: Report[]; loading: boolean; refresh: () => void } {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const refresh = useCallback(() => {
    if (!session) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { reports, loading, refresh };
}
