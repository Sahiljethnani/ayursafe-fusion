import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  computeSafetyScore,
  findInteractions,
  normalizeMedicineName,
  severityRank,
  type AnalyzedMedicine,
  type DetectedInteraction,
  type Severity,
} from "./medical";
import { evaluateHdi, isEvidenceHerb } from "./hdi";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

const inputSchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(100),
  // data URL: data:<mime>;base64,<payload>
  dataUrl: z.string().min(32).max(14_000_000),
});

export type ExtractedPatient = {
  name: string | null;
  age: string | null;
  gender: string | null;
  diagnosis: string | null;
  conditions: string[];
  allergies: string[];
  prescriber: string | null;
  date: string | null;
};

export type Recommendation = {
  kind: "action" | "alternative" | "monitor";
  title: string;
  detail: string;
  severity: Severity;
};

export type AnalysisResult = {
  fileName: string;
  extractedText: string;
  patient: ExtractedPatient;
  medicines: AnalyzedMedicine[];
  unidentified: string[];
  interactions: DetectedInteraction[];
  score: number;
  level: Severity;
  scoreBreakdown: string[];
  explanation: string;
  recommendations: Recommendation[];
  warnings: string[];
};

class AnalysisError extends Error {}

async function callGateway(body: unknown, apiKey: string): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      message = JSON.parse(text)?.error?.message ?? JSON.parse(text)?.message ?? text;
    } catch {
      /* keep raw text */
    }
    if (res.status === 429) throw new AnalysisError("The AI service is rate limited right now. Please retry in a moment.");
    if (res.status === 402) throw new AnalysisError(message || "AI credits are exhausted for this workspace. Add credits to continue analysing prescriptions.");
    if (res.status === 403) throw new AnalysisError(message || "AI access is blocked for this workspace.");
    if (res.status === 401) throw new AnalysisError("AI service is not configured correctly (missing API key).");
    if (res.status === 400) throw new AnalysisError(`The prescription file could not be processed: ${message || "unsupported file"}`);
    throw new AnalysisError("The AI service is temporarily unavailable. Please try again.");
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new AnalysisError("The AI service returned an empty response. Please try again.");
  return content;
}

function parseJsonBlock<T>(raw: string): T | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

const str = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || /^(n\/?a|none|unknown|not (stated|mentioned|specified|legible))$/i.test(t)) return null;
  return t.slice(0, 200);
};

const strList = (v: unknown): string[] =>
  Array.isArray(v)
    ? (v.map(str).filter(Boolean) as string[]).slice(0, 12)
    : [];

const EXTRACTION_PROMPT = `You are a clinical OCR and information-extraction engine for prescriptions.
Read the supplied prescription (photo, scan or PDF) and return STRICT JSON only, no prose, no markdown:

{
  "readable": true|false,
  "extracted_text": "the full raw text you can read, line by line",
  "patient": {
    "name": string|null, "age": string|null, "gender": string|null,
    "diagnosis": string|null,
    "conditions": [string],
    "allergies": [string],
    "prescriber": string|null, "date": string|null
  },
  "medicines": [
    { "name": "as written", "strength": string|null, "dosage": string|null,
      "frequency": string|null, "route": string|null, "duration": string|null,
      "instructions": string|null }
  ]
}

Rules:
- Include BOTH modern/allopathic drugs AND Ayurvedic/herbal/supplement products.
- Never invent medicines, patients or dosages. If a field is not present, use null / [].
- Typed, printed, handwritten, digital or sample/demo prescriptions and medicine lists all count as prescriptions.
- Extract every medicine you can read even if parts of the page are blurry; set "readable": true whenever at least one medicine is legible.
- Only if no medicine at all can be read, set "readable": false and "medicines": [].`;

type ExtractionPayload = {
  readable?: boolean;
  extracted_text?: string;
  patient?: Record<string, unknown>;
  medicines?: Record<string, unknown>[];
};

type AiInteractionPayload = {
  interactions?: {
    a?: string;
    b?: string;
    severity?: string;
    kind?: string;
    summary?: string;
    advice?: string;
  }[];
  recommendations?: { kind?: string; title?: string; detail?: string; severity?: string }[];
  patient_notes?: string[];
};

const asSeverity = (v: unknown): Severity => {
  const s = String(v ?? "").toLowerCase();
  if (s.startsWith("high") || s === "severe" || s === "major") return "high";
  if (s.startsWith("mod") || s === "minor" || s === "caution") return "moderate";
  return "safe";
};

export const analyzePrescription = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI service is not configured (missing API key).");

    const { fileName, mimeType, dataUrl } = data;
    if (!/^data:[\w.+-]+\/[\w.+-]+;base64,/.test(dataUrl)) {
      throw new Error("The uploaded file could not be read. Please re-upload a PNG, JPG or PDF.");
    }
    const isPdf = mimeType === "application/pdf" || /\.pdf$/i.test(fileName);
    const isImage = mimeType.startsWith("image/");
    if (!isPdf && !isImage) {
      throw new Error("Unsupported file type. Upload a PNG, JPG or PDF prescription.");
    }

    const filePart = isPdf
      ? { type: "file", file: { filename: fileName, file_data: dataUrl } }
      : { type: "image_url", image_url: { url: dataUrl } };

    let extraction: ExtractionPayload | null = null;
    try {
      const raw = await callGateway(
        {
          model: MODEL,
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: EXTRACTION_PROMPT }, filePart],
            },
          ],
        },
        apiKey,
      );
      extraction = parseJsonBlock<ExtractionPayload>(raw);
    } catch (err) {
      throw new Error(err instanceof AnalysisError ? err.message : "Prescription extraction failed. Please try again.");
    }

    if (!extraction) {
      throw new Error("We could not read structured data from this prescription. Try a sharper, well-lit photo.");
    }
    const hasMeds = Array.isArray(extraction.medicines) && extraction.medicines.length > 0;
    // Only reject when the model also found no medicines — it sometimes flags typed,
    // digital or partially blurry prescriptions as "unreadable" while still extracting them.
    if (extraction.readable === false && !hasMeds) {
      throw new Error(
        "The prescription could not be read. Make sure the whole page is in frame, in focus and well lit, then upload again.",
      );
    }

    const rawMeds = Array.isArray(extraction.medicines) ? extraction.medicines.slice(0, 30) : [];
    if (rawMeds.length === 0) {
      throw new Error(
        "No medicines could be identified in this document. Check that it is a prescription and that the medicine list is visible.",
      );
    }

    const medicines: AnalyzedMedicine[] = rawMeds
      .map((m) => {
        const name = str(m.name);
        if (!name) return null;
        const norm = normalizeMedicineName(name);
        return {
          raw: name,
          canonical: norm.canonical,
          kind: norm.kind,
          class: norm.class,
          confidence: norm.confidence,
          strength: str(m.strength),
          dosage: str(m.dosage),
          frequency: str(m.frequency),
          route: str(m.route),
          duration: str(m.duration),
          instructions: str(m.instructions),
        } satisfies AnalyzedMedicine;
      })
      .filter(Boolean) as AnalyzedMedicine[];

    if (medicines.length === 0) {
      throw new Error("No medicine names could be extracted from this prescription. Please upload a clearer image.");
    }

    const patientRaw = (extraction.patient ?? {}) as Record<string, unknown>;
    const patient: ExtractedPatient = {
      name: str(patientRaw.name),
      age: str(patientRaw.age),
      gender: str(patientRaw.gender),
      diagnosis: str(patientRaw.diagnosis),
      conditions: strList(patientRaw.conditions),
      allergies: strList(patientRaw.allergies),
      prescriber: str(patientRaw.prescriber),
      date: str(patientRaw.date),
    };
    if (patient.diagnosis && !patient.conditions.length) patient.conditions = [patient.diagnosis];

    /* ---- Knowledge-base pass ---- */
    const kbInteractions = findInteractions(medicines, patient.conditions, patient.allergies);

    /* ---- Evidence-based HDI pass: deterministic match against the 30-record Master table ---- */
    const isHerb = (m: AnalyzedMedicine) => m.kind === "herb" || isEvidenceHerb(m.canonical ?? m.raw);
    const herbNames = medicines.filter(isHerb).map((m) => m.canonical ?? m.raw);
    const drugNames = medicines.filter((m) => !isHerb(m)).map((m) => m.canonical ?? m.raw);
    const hdi = evaluateHdi(herbNames, drugNames);
    const seenHdi = new Set<string>();
    for (const { herb, drug, ev } of hdi.matches) {
      const k = `${herb}|${drug}`;
      if (seenHdi.has(k)) continue;
      seenHdi.add(k);
      const severity: Severity =
        ev.category === "no-effect" ? "safe" : ev.category === "mixed" ? "moderate"
          : ev.riskLevel === "CRITICAL" || ev.riskLevel === "HIGH" ? "high" : ev.riskLevel === "MODERATE" ? "moderate" : "safe";
      kbInteractions.push({
        a: herb,
        b: drug,
        severity,
        kind: "herb-drug",
        summary: `${ev.mechanism} ${ev.direction}. ${ev.outcome}`,
        advice:
          ev.category === "no-effect"
            ? "Evidence table reports no significant human effect."
            : ev.category === "mixed"
              ? "Mixed / Conflicting Evidence — review with the prescribing clinician."
              : `Evidence ${ev.evidenceLevel} (Record ${ev.id}). Review with the prescribing clinician.`,
        source: "evidence-table",
        evidence: { ...ev },
      });
    }

    /* ---- AI clinical pass for pairs the rule base does not cover ---- */
    const known = medicines.filter((m) => m.canonical || m.raw);
    let aiPayload: AiInteractionPayload | null = null;
    if (known.length >= 1) {
      const covered = kbInteractions.map((i) => `${i.a} + ${i.b}`).join("; ") || "none";
      const medList = medicines
        .map((m) => `- ${m.canonical ?? m.raw}${m.strength ? ` ${m.strength}` : ""}${m.frequency ? ` (${m.frequency})` : ""}`)
        .join("\n");
      try {
        const raw = await callGateway(
          {
            model: MODEL,
            messages: [
              {
                role: "system",
                content:
                  "You are a clinical pharmacology assistant specialising in drug-drug and drug-condition interactions. Never report herb-drug interactions — those are handled by a curated evidence table. Reply with STRICT JSON only.",
              },
              {
                role: "user",
                content: `Prescription medicines:\n${medList}\n\nPatient: age ${patient.age ?? "unknown"}, gender ${patient.gender ?? "unknown"}, conditions: ${patient.conditions.join(", ") || "none stated"}, allergies: ${patient.allergies.join(", ") || "none stated"}.\n\nAlready covered by our rule base (do NOT repeat these pairs): ${covered}.\n\nReturn JSON:\n{\n  "interactions": [{"a": "medicine", "b": "medicine or condition", "severity": "safe|moderate|high", "kind": "drug-drug|herb-drug|drug-condition", "summary": "1-2 sentence mechanism", "advice": "clinical action"}],\n  "recommendations": [{"kind": "action|alternative|monitor", "title": "short", "detail": "1-2 sentences", "severity": "safe|moderate|high"}],\n  "patient_notes": ["short patient-specific caution"]\n}\nOnly list interactions that genuinely apply to these medicines. Return empty arrays if there is nothing clinically relevant.`,
              },
            ],
          },
          apiKey,
        );
        aiPayload = parseJsonBlock<AiInteractionPayload>(raw);
      } catch {
        aiPayload = null; // rule-base result still stands
      }
    }

    const pairKey = (a: string, b: string) => [a.toLowerCase(), b.toLowerCase()].sort().join("||");
    const seen = new Set(kbInteractions.map((i) => pairKey(i.a, i.b)));
    const aiInteractions: DetectedInteraction[] = [];
    for (const i of aiPayload?.interactions ?? []) {
      const a = str(i.a);
      const b = str(i.b);
      const summary = str(i.summary);
      if (!a || !b || !summary) continue;
      const k = pairKey(a, b);
      if (seen.has(k)) continue;
      seen.add(k);
      // The LLM may never decide that a herb-drug interaction exists.
      if (String(i.kind) === "herb-drug") continue;
      const herbSide = [a, b].some((x) => isEvidenceHerb(x) || medicines.some((m) => m.kind === "herb" && (m.canonical ?? m.raw).toLowerCase() === x.toLowerCase()));
      if (herbSide) continue;
      const kind = ["drug-drug", "drug-condition"].includes(String(i.kind))
        ? (i.kind as DetectedInteraction["kind"])
        : "drug-drug";
      aiInteractions.push({
        a,
        b,
        severity: asSeverity(i.severity),
        kind,
        summary,
        advice: str(i.advice) ?? "Review with the prescribing clinician.",
        source: "ai",
      });
    }

    const interactions = [...kbInteractions, ...aiInteractions].sort(
      (x, y) => severityRank(y.severity) - severityRank(x.severity),
    );

    const unidentified = medicines.filter((m) => !m.canonical).map((m) => m.raw);
    const { score, level, breakdown } = computeSafetyScore(interactions, unidentified.length);

    const highCount = interactions.filter((i) => i.severity === "high").length;
    const modCount = interactions.filter((i) => i.severity === "moderate").length;

    const explanation =
      highCount > 0
        ? `${highCount} high-severity interaction${highCount > 1 ? "s were" : " was"} detected across ${medicines.length} prescribed item${medicines.length > 1 ? "s" : ""}. Review these before dispensing and consider substitutions.`
        : modCount > 0
          ? `${modCount} moderate interaction${modCount > 1 ? "s were" : " was"} detected. Dispensing is possible with monitoring and patient counselling.`
          : `No clinically significant interactions were detected between the ${medicines.length} item${medicines.length > 1 ? "s" : ""} on this prescription.`;

    const recommendations: Recommendation[] = [];
    for (const i of interactions.filter((x) => x.severity !== "safe").slice(0, 6)) {
      recommendations.push({
        kind: i.severity === "high" ? "action" : "monitor",
        title: `${i.a} + ${i.b}`,
        detail: i.advice,
        severity: i.severity,
      });
    }
    for (const r of aiPayload?.recommendations ?? []) {
      const title = str(r.title);
      const detail = str(r.detail);
      if (!title || !detail) continue;
      if (recommendations.some((x) => x.title.toLowerCase() === title.toLowerCase())) continue;
      const kind = ["action", "alternative", "monitor"].includes(String(r.kind))
        ? (r.kind as Recommendation["kind"])
        : "monitor";
      recommendations.push({ kind, title, detail, severity: asSeverity(r.severity) });
    }

    const warnings: string[] = [...(strList(aiPayload?.patient_notes) ?? [])];
    const unmatchedHerbs = unidentified.filter((n) => isEvidenceHerb(n));
    const unmatchedOther = unidentified.filter((n) => !isEvidenceHerb(n));
    if (unmatchedOther.length) {
      warnings.unshift(
        `${unmatchedOther.length} item${unmatchedOther.length > 1 ? "s" : ""} could not be matched to our clinical dictionary (${unmatchedOther.join(", ")}). They were excluded from rule-based checks — verify manually.`,
      );
    }
    if (unmatchedHerbs.length) {
      warnings.unshift(
        `Some herbal products were not matched to the standard drug dictionary (${unmatchedHerbs.join(", ")}). They are evaluated separately through the dedicated AyurSafe Master Herb-Drug Interaction Evidence Table.`,
      );
    }

    return {
      fileName,
      extractedText: (str(extraction.extracted_text) ?? "").slice(0, 8000),
      patient,
      medicines,
      unidentified,
      interactions,
      score,
      level,
      scoreBreakdown: breakdown,
      explanation,
      recommendations,
      warnings,
    };
  });
