import { User, Info } from "lucide-react";
import { AGE_NO_EVIDENCE_TEXT, buildAgeContext, parseAgeYears } from "@/lib/ageContext";

export function PatientContext({ age, medicineCount }: { age: string | null; medicineCount: number }) {
  const years = parseAgeYears(age);
  const ctx = years === null ? null : buildAgeContext(years, medicineCount);
  return (
    <section className="glass shadow-card mb-8 rounded-3xl p-6 sm:p-8">
      <div className="mb-1 flex items-center gap-2">
        <User className="text-primary h-5 w-5" />
        <h2 className="text-xl font-bold">Patient Context</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Source: patient age + AyurSafe age-context rules. This layer never creates or changes herb–drug or drug–drug findings, evidence levels or record numbers.
      </p>
      {!ctx ? (
        <p className="text-sm text-muted-foreground">Patient age not provided.</p>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="bg-muted/50 rounded-2xl p-4">
              <div className="text-xs text-muted-foreground">Patient Age</div>
              <div className="text-lg font-semibold">{Number.isInteger(ctx.years) ? ctx.years : ctx.years.toFixed(1)} years</div>
            </div>
            <div className="bg-muted/50 rounded-2xl p-4">
              <div className="text-xs text-muted-foreground">Age Group</div>
              <div className="text-lg font-semibold">{ctx.group}</div>
            </div>
          </div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Patient-Specific Considerations</h3>
          <ul className="space-y-1.5 text-sm">
            {(ctx.considerations.length ? ctx.considerations : [AGE_NO_EVIDENCE_TEXT]).map((c) => (
              <li key={c}>• {c} <span className="text-xs text-muted-foreground">(Patient-age context)</span></li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Why is this shown? Because the patient's recorded age places them in the {ctx.group} age group. Age did not create, remove or re-grade any interaction above — herb–drug results come only from the Master HDI Evidence Table.
          </p>
        </>
      )}
    </section>
  );
}
