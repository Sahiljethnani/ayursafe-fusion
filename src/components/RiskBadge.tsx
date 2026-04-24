import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

export type RiskLevel = "safe" | "moderate" | "high";

const config = {
  safe: {
    label: "Safe",
    icon: ShieldCheck,
    classes: "bg-safe/15 text-safe border-safe/30",
  },
  moderate: {
    label: "Moderate Risk",
    icon: AlertTriangle,
    classes: "bg-warn/20 text-warn-foreground border-warn/40",
  },
  high: {
    label: "High Risk",
    icon: ShieldAlert,
    classes: "bg-danger/15 text-danger border-danger/30",
  },
} as const;

export function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" | "lg" }) {
  const c = config[level];
  const Icon = c.icon;
  const sizing =
    size === "lg"
      ? "px-4 py-2 text-sm"
      : size === "sm"
        ? "px-2.5 py-1 text-xs"
        : "px-3 py-1.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${c.classes} ${sizing}`}
    >
      <Icon className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={2.4} />
      {c.label}
    </span>
  );
}
