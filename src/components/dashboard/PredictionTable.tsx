import { motion } from "framer-motion";
import type { PredictionEntity } from "@/lib/predictions";
import { Check, X } from "lucide-react";

interface Props {
  data: PredictionEntity[];
  levelLabel: string;
}

// L'état économique est stocké en anglais dans le JSON — affichage FR
const ECO_FR: Record<string, string> = {
  boom: "Boom",
  growth: "Croissance",
  stable: "Stable",
  decline: "Déclin",
  crisis: "Crise",
};

// Bord politique du vainqueur réel (pour la colonne « Réel »)
function sideForCandidate(candidate: string): string {
  if (candidate === "MACRON") return "Centre";
  if (candidate === "LE PEN") return "Extrême droite";
  return "";
}

export function PredictionTable({ data, levelLabel }: Props) {
  return (
    <section className="rounded-3xl border border-border bg-card/50 p-6 md:p-8 backdrop-blur-xl shadow-[var(--shadow-card)]">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">Prédictions XGBoost</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-foreground">Détail {levelLabel}</h2>
        </div>
      </header>

      {data.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Aucune donnée à ce niveau.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Entité</th>
                <th className="px-4 py-3">Bord & Gagnant</th>
                <th className="px-4 py-3">État Économique</th>
                <th className="px-4 py-3">Réel</th>
                <th className="px-4 py-3 w-[30%]">Probabilités</th>
                <th className="px-4 py-3 text-center">✓</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <motion.tr
                  key={r.entity}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="border-t border-border/60 hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{r.entity}</td>
                  <td className="px-4 py-3">
                    <Pill candidate={r.predicted} side={r.political_side} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                      {ECO_FR[r.economic_state] ?? r.economic_state}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Pill candidate={r.real} side={sideForCandidate(r.real)} />
                  </td>
                  <td className="px-4 py-3">
                    <ProbBar macron={r.proba?.MACRON ?? 0} opposition={r.proba?.Opposition ?? 0} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.is_correct ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Pill({ candidate, side }: { candidate: string; side: string }) {
  const isMacron = candidate === "MACRON";
  const color = isMacron ? "var(--color-primary)" : candidate === "LE PEN" ? "var(--pol-far-right)" : "var(--pol-left)";
  
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-semibold">
        {side?.replace('-', ' ')}
      </span>
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium w-fit"
        style={{
          background: `color-mix(in oklab, ${color} 18%, transparent)`,
          color: color,
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {candidate}
      </span>
    </div>
  );
}

function ProbBar({ macron, opposition }: { macron: number; opposition: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full" style={{ width: `${macron}%`, background: "var(--color-primary)" }} />
        <div className="h-full" style={{ width: `${opposition}%`, background: "#e11d48" }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>M {macron.toFixed(1)}%</span>
        <span>Opp. {opposition.toFixed(1)}%</span>
      </div>
    </div>
  );
}