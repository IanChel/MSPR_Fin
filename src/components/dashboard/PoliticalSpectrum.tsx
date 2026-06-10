import { motion, AnimatePresence } from "framer-motion";
import { ECO_SCENARIOS, SIDE_META, type EcoState, type EcoScenario } from "@/lib/predictions";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

const trendIcon = {
  up: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
  down: <TrendingDown className="h-3.5 w-3.5 text-rose-400" />,
  flat: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

interface Props {
  entityName: string;
  ecoState: EcoState;
}

export function PoliticalSpectrum({ entityName, ecoState }: Props) {
  const active: EcoScenario = ECO_SCENARIOS.find(s => s.state === ecoState) || ECO_SCENARIOS[2];
  const meta = SIDE_META[active.winner];

  return (
    <section className="rounded-3xl border border-border bg-card/50 p-6 md:p-8 backdrop-blur-xl shadow-[var(--shadow-card)]">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">Lecture économie → vote ({entityName})</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-foreground">L'échiquier politique selon l'économie</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Modèle dérivé des indicateurs <span className="text-foreground">chômage, revenu, sécurité, diplôme, population, entreprises</span>.
            Affiche l'état économique RÉEL calculé par le modèle pour <strong className="text-foreground">{entityName}</strong>.
          </p>
        </div>
      </header>

      {/* Scenario selector (now just indicators) */}
      <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-5">
        {ECO_SCENARIOS.map((s) => {
          const isActive = s.state === active.state;
          return (
            <div
              key={s.state}
              className={`group relative rounded-xl border p-3 text-left transition-all ${
                isActive
                  ? "border-primary bg-primary/15 shadow-[0_0_0_1px_var(--color-primary)]"
                  : "border-border bg-secondary/40 opacity-50 grayscale"
              }`}
            >
              <p className={`text-[10px] uppercase tracking-widest ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {s.delta}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{s.shortLabel}</p>
            </div>
          );
        })}
      </div>

      {/* Spectrum bar */}
      <div className="relative mt-8">
        <div
          className="h-3 w-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--pol-far-left) 0%, var(--pol-left) 25%, var(--pol-center) 50%, var(--pol-right) 75%, var(--pol-far-right) 100%)",
          }}
        />
        {/* Marker */}
        <motion.div
          className="absolute -top-2 h-7 w-7 -translate-x-1/2 rounded-full border-[3px] border-background shadow-lg"
          animate={{ left: `${meta.position}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          style={{ background: meta.color }}
        />
        <div className="mt-3 grid grid-cols-5 text-[10px] uppercase tracking-widest text-muted-foreground">
          {(Object.keys(SIDE_META) as Array<keyof typeof SIDE_META>).map((k) => (
            <span key={k} className="text-center first:text-left last:text-right">
              {SIDE_META[k].label}
            </span>
          ))}
        </div>
      </div>

      {/* Result panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.state}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr]"
        >
          <div className="rounded-2xl border border-border bg-secondary/40 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <span>Scénario évalué pour {entityName}</span>
              <ArrowRight className="h-3 w-3" />
              <span>Prédiction</span>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{active.label}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{active.description}</p>
            <div className="mt-5 flex items-center gap-3">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: `color-mix(in oklab, ${meta.color} 25%, transparent)`, color: meta.color }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                {active.winnerLabel} gagne
              </span>
              <span className="text-xs text-muted-foreground">candidat probable : {active.candidate}</span>
            </div>
            <p className="mt-4 border-l-2 border-primary/60 pl-4 text-sm text-foreground/80 italic">
              {active.rationale}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Signaux économiques clés</p>
            <ul className="mt-4 space-y-3">
              {active.signals.map((sig) => (
                <li key={sig.label} className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2.5">
                  <span className="text-sm text-foreground">{sig.label}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {trendIcon[sig.trend]}
                    {sig.trend === "up" ? "Hausse" : sig.trend === "down" ? "Baisse" : "Stable"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}