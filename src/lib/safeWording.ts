/**
 * Informational-only wording for clinical-engine (DDI / drug-condition) output.
 * Replaces any prescribing, dosing, start/stop or avoid instructions with a neutral review note.
 * Never applied to Master HDI evidence-table records (their text is shown verbatim).
 */
const PRESCRIPTIVE_RE =
  /\b(avoid|do not take|don't take|stop|discontinu|start|initiat|switch|replace|substitut|reduce|increase|decrease|lower|limit|adjust|titrat|maximum|max\.?|dose|dosage|dosing|mg\b|mcg\b|monitor|check (inr|levels?)|take|consider|use an? |alternative|instead)/i;

type Sev = "safe" | "moderate" | "high";
const sevWord = (s: Sev) => (s === "high" ? "high-risk" : s === "moderate" ? "moderate" : "low-risk");

export function neutralInteractionAdvice(i: { a: string; b: string; severity: Sev; kind: string }): string {
  const type = i.kind === "drug-condition" ? "drug–condition interaction" : "drug–drug interaction";
  if (i.severity === "high")
    return `Potential high-risk ${type} detected between ${i.a} and ${i.b}. Clinical review is recommended before any medication changes.`;
  return `Potential ${sevWord(i.severity)} ${type} detected between ${i.a} and ${i.b}. Clinical review is recommended.`;
}

export function neutralRecommendation<T extends { title: string; detail: string; severity: Sev }>(r: T): T {
  const pair = r.title.split(/\s\+\s/);
  if (pair.length === 2)
    return { ...r, detail: neutralInteractionAdvice({ a: pair[0], b: pair[1], severity: r.severity, kind: "drug-drug" }) };
  if (PRESCRIPTIVE_RE.test(`${r.title} ${r.detail}`))
    return { ...r, detail: "Clinical review is recommended. AyurSafe does not provide dosing or prescribing instructions." };
  return r;
}

export function neutralNote(note: string): string {
  if (!PRESCRIPTIVE_RE.test(note)) return note;
  if (/high/i.test(note)) return "Potential high-risk drug–drug interaction detected. Clinical review is recommended.";
  return "Potential drug–drug interaction detected. Clinical review is recommended.";
}

export const isEvidenceTable = (i: { source?: string }) => i.source === "evidence-table";
