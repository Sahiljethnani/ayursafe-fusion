/**
 * Patient age context layer. Contextual information ONLY.
 * Never creates, modifies or re-grades herb–drug (HDI) or drug–drug (DDI) findings.
 */

export type AgeGroup = "Pediatric" | "Adolescent" | "Adult" | "Older Adult";

/** Configurable age boundaries (upper bound exclusive, in years). */
export const AGE_BOUNDARIES: { group: AgeGroup; minYears: number; maxYears: number }[] = [
  { group: "Pediatric", minYears: 0, maxYears: 12 },
  { group: "Adolescent", minYears: 12, maxYears: 18 },
  { group: "Adult", minYears: 18, maxYears: 65 },
  { group: "Older Adult", minYears: 65, maxYears: 131 },
];

export const MAX_AGE_YEARS = 130;
export const AGE_NO_EVIDENCE_TEXT =
  "Age-specific evidence is not available in the current AyurSafe knowledge layer.";

export function validateAge(input: string): { ok: true; years: number | null } | { ok: false; error: string } {
  const s = input.trim();
  if (!s) return { ok: true, years: null };
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: "Enter age as a number of years." };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > MAX_AGE_YEARS)
    return { ok: false, error: `Age must be between 0 and ${MAX_AGE_YEARS} years.` };
  return { ok: true, years: n };
}

export function ageFromDob(dob: string, now = new Date()): { ok: true; years: number } | { ok: false; error: string } {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "Invalid date of birth." };
  if (d > now) return { ok: false, error: "Date of birth cannot be in the future." };
  let y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--;
  if (y > MAX_AGE_YEARS) return { ok: false, error: "Date of birth is not realistic." };
  return { ok: true, years: y };
}

/** Parse a stored age string like "72", "72 years", "72y". Returns null if unparseable. */
export function parseAgeYears(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (/month|mo\b/i.test(raw)) return n / 12;
  return n >= 0 && n <= MAX_AGE_YEARS ? n : null;
}

export function classifyAge(years: number): AgeGroup {
  return (AGE_BOUNDARIES.find((b) => years >= b.minYears && years < b.maxYears) ?? AGE_BOUNDARIES[3]).group;
}

/** Validated, deliberately conservative age-context rules. No dose changes, no stop/start advice. */
const AGE_RULES: Record<AgeGroup, string[]> = {
  Pediatric: [
    "Medication safety considerations may differ in children; age-specific clinical information may need to be reviewed.",
    "Additional pharmacist/clinician review may be appropriate for this age group.",
  ],
  Adolescent: [
    "Medication safety considerations may differ across age groups; age-specific clinical information may need to be reviewed.",
  ],
  Adult: [],
  "Older Adult": [
    "Age-specific medication safety information should be reviewed.",
  ],
};

export function buildAgeContext(years: number, medicineCount: number) {
  const group = classifyAge(years);
  const considerations = [...AGE_RULES[group]];
  if (group === "Older Adult" && medicineCount >= 2)
    considerations.push(
      "Additional clinical/pharmacist review may be appropriate where multiple medications are present.",
    );
  return { years, group, considerations };
}

const AGE_CLAIM_RE = /\b(\d+\s*[- ]?(year|yr)s?[- ]?old|pediatric|paediatric|child|children|infant|adolescent|elderly|geriatric|older adult|age[ds]?)\b/i;

/**
 * Remove AI-generated age-specific medication claims (no validated age knowledge source)
 * and replace with a single neutral, non-grading note.
 */
export function sanitizeAgeNotes(notes: string[], ageRaw: string | null | undefined): string[] {
  const kept = notes.filter((n) => !AGE_CLAIM_RE.test(n));
  const years = parseAgeYears(ageRaw);
  if (years != null && classifyAge(years) === "Pediatric") {
    const y = Number.isInteger(years) ? years : Math.round(years * 10) / 10;
    kept.unshift(`Patient is ${y} years old. Pediatric medication-safety considerations may require additional clinical review.`);
  }
  return kept;
}
