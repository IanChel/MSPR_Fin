import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "primary" | "accent" | "success" | "warning";
  delay?: number;
}

const accentMap = {
  primary: "border-l-primary",
  accent: "border-l-primary/70",
  success: "border-l-emerald-600",
  warning: "border-l-amber-600",
};

export function KpiCard({ label, value, hint, accent = "primary", delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-md border border-border bg-card p-4 shadow-sm border-l-[3px] ${accentMap[accent]}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}