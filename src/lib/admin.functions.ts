import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminOverview = {
  totalUsers: number;
  totalPrescriptions: number;
  totalAnalyses: number;
  highRisk: number;
  moderateRisk: number;
  safeRisk: number;
  recent: {
    id: string;
    title: string;
    fileName: string | null;
    createdAt: string;
    score: number | null;
    level: string | null;
    userEmail: string | null;
  }[];
};

export type AdminPatient = {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
  reportCount: number;
  lastActivity: string | null;
  isAdmin: boolean;
};

export type AdminPatientReport = {
  id: string;
  title: string;
  fileName: string | null;
  createdAt: string;
  score: number | null;
  level: string | null;
  status: string | null;
  medicines: string[];
  interactionCount: number;
};

/** Throws unless the calling (authenticated) user holds the admin role. */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: data === true };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: totalUsers }, reportsRes, profilesRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("reports")
        .select("id, user_id, title, file_name, created_at, safety_score, risk_level, status, data")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("profiles").select("id, email"),
    ]);

    const rows = reportsRes.data ?? [];
    const emailById = new Map((profilesRes.data ?? []).map((p) => [p.id, p.email]));

    const levelOf = (r: (typeof rows)[number]) => {
      const fromCol = r.risk_level;
      if (fromCol) return fromCol;
      const d = r.data as { level?: string } | null;
      return d?.level ?? null;
    };

    let high = 0;
    let moderate = 0;
    let safe = 0;
    for (const r of rows) {
      const lvl = (levelOf(r) ?? "").toLowerCase();
      if (lvl === "high") high += 1;
      else if (lvl === "moderate") moderate += 1;
      else if (lvl) safe += 1;
    }

    return {
      totalUsers: totalUsers ?? 0,
      totalPrescriptions: rows.length,
      totalAnalyses: rows.filter((r) => (r.status ?? "complete") === "complete").length,
      highRisk: high,
      moderateRisk: moderate,
      safeRisk: safe,
      recent: rows.slice(0, 8).map((r) => ({
        id: r.id,
        title: r.title,
        fileName: r.file_name,
        createdAt: r.created_at,
        score: r.safety_score,
        level: levelOf(r),
        userEmail: emailById.get(r.user_id) ?? null,
      })),
    };
  });

export const listPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string }) =>
    z.object({ search: z.string().max(120).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<AdminPatient[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    const search = data.search?.trim();
    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

    const [profilesRes, reportsRes, rolesRes] = await Promise.all([
      query,
      supabaseAdmin.from("reports").select("user_id, created_at"),
      supabaseAdmin.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);

    const counts = new Map<string, { n: number; last: string }>();
    for (const r of reportsRes.data ?? []) {
      const cur = counts.get(r.user_id);
      if (!cur) counts.set(r.user_id, { n: 1, last: r.created_at });
      else {
        cur.n += 1;
        if (r.created_at > cur.last) cur.last = r.created_at;
      }
    }
    const admins = new Set((rolesRes.data ?? []).map((r) => r.user_id));

    return (profilesRes.data ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      createdAt: p.created_at,
      reportCount: counts.get(p.id)?.n ?? 0,
      lastActivity: counts.get(p.id)?.last ?? null,
      isAdmin: admins.has(p.id),
    }));
  });

export const getPatientReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<AdminPatientReport[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin
      .from("reports")
      .select("id, title, file_name, created_at, safety_score, risk_level, status, data")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: false })
      .limit(100);

    return (rows ?? []).map((r) => {
      const d = (r.data ?? {}) as {
        level?: string;
        medicines?: { canonical?: string | null; raw?: string }[];
        interactions?: unknown[];
      };
      return {
        id: r.id,
        title: r.title,
        fileName: r.file_name,
        createdAt: r.created_at,
        score: r.safety_score,
        level: r.risk_level ?? d.level ?? null,
        status: r.status ?? "complete",
        medicines: (d.medicines ?? []).map((m) => m.canonical ?? m.raw ?? "").filter(Boolean),
        interactionCount: Array.isArray(d.interactions) ? d.interactions.length : 0,
      };
    });
  });
