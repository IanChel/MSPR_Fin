import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { fetchPredictions, type Level, type PredictionEntity } from "@/lib/predictions";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PoliticalSpectrum } from "@/components/dashboard/PoliticalSpectrum";
import { PartyDonut } from "@/components/dashboard/PartyDonut";
import { PredictionTable } from "@/components/dashboard/PredictionTable";
import { Activity, Brain, MapPin, Sparkles, Database, BarChart3 } from "lucide-react";

// L'état économique est stocké en anglais dans le JSON — affichage FR
const ECO_FR: Record<string, string> = {
  boom: "Boom",
  growth: "Croissance",
  stable: "Stable",
  decline: "Déclin",
  crisis: "Crise",
};

export const Route = createFileRoute("/")({
  component: Index,
});

const MODELS = [
  { id: "xgboost", name: "XGBoost" },
  { id: "random_forest", name: "Random Forest" },
  { id: "gradient_boosting", name: "Gradient Boosting" },
  { id: "logistic_regression", name: "Logistic Regression" },
  { id: "svm_(linear)", name: "SVM (Linear)" }
];

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Index() {
  const [selectedModel, setSelectedModel] = useState<string>("xgboost");

  const { data, isLoading, error } = useQuery({
    queryKey: ['predictions', selectedModel],
    queryFn: async () => {
      const res = await fetch(`/data/predictions_${selectedModel}.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Les prédictions de ce modèle ne sont pas disponibles.");
      return res.json();
    },
  });

  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedCanton, setSelectedCanton] = useState<string>("ALL");

  const { activeEntity, tableLevel, tableData } = useMemo(() => {
    if (!data) return { activeEntity: null, tableLevel: "Région", tableData: [] };

    let active = data.levels.region[0];
    let tLevel = "Départements";
    let tData = data.levels.departement || [];

    if (selectedDept !== "ALL") {
      active = data.levels.departement.find((d: PredictionEntity) => d.entity === selectedDept) || active;
      tLevel = "Cantons";
      tData = (data.levels.canton || []).filter((c: PredictionEntity) => c.parent === selectedDept);

      if (selectedCanton !== "ALL") {
        active = data.levels.canton.find((c: PredictionEntity) => c.entity === selectedCanton) || active;
        tLevel = "Canton Sélectionné";
        tData = [active];
      }
    }

    return { activeEntity: active, tableLevel: tLevel, tableData: tData };
  }, [data, selectedDept, selectedCanton]);

  return (
    <div className="min-h-screen text-foreground">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              G
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">GouvData</p>
              <p className="text-[11px] text-muted-foreground">Analyse prédictive · Présidentielle 2022</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/visualisation"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Visualisation
            </Link>
            <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              {data?.summary.model_name ?? "—"} · {data?.summary.model_accuracy ?? "—"}% acc.
            </span>
            <span className="flex items-center gap-1.5 rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Actif
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Présidentielle 2022 · Région Nouvelle-Aquitaine
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Analyse prédictive du vote par indicateurs socio-économiques
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base leading-relaxed">
              Collecte, ingénierie de variables, entraînement multi-modèles et lecture macro-politique
              des résultats à l'échelle <span className="font-medium text-foreground">région · département · canton</span>.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge icon={<Database className="h-3.5 w-3.5" />}>Données traitées</Badge>
              <Badge icon={<Brain className="h-3.5 w-3.5" />}>Machine Learning</Badge>
              <Badge icon={<Activity className="h-3.5 w-3.5" />}>Croissance · Stable · Déclin</Badge>
              <Badge icon={<MapPin className="h-3.5 w-3.5" />}>Filtrage géographique</Badge>
            </div>

            <div className="mt-6">
              <Link
                to="/visualisation"
                className="group inline-flex items-center gap-2.5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors duration-200 hover:bg-primary/90"
              >
                <BarChart3 className="h-4 w-4" />
                Accéder aux visualisations
                <span className="ml-0.5 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {data && (
          <motion.section
            variants={itemVariant}
            initial="hidden"
            animate="show"
            className="grid gap-6 rounded-lg border border-border bg-card p-5 md:p-6 lg:grid-cols-[1.35fr_0.95fr]"
            style={{
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div>
              <p className="text-[11px] font-medium text-primary">
                Synthèse et visualisation
              </p>
              <h2 className="mt-2 max-w-2xl font-serif text-xl font-bold tracking-tight text-foreground md:text-2xl">
                Visualisation détaillée des performances des modèles prédictifs
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                Consultez les résultats d'apprentissage automatique : matrice de corrélation,
                courbes d'apprentissage et comparaison inter-modèles.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  to="/visualisation"
                  className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors duration-200 hover:bg-primary/90"
                >
                  <BarChart3 className="h-4 w-4" />
                  Consulter les visualisations
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>
                <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                  {data.summary.model_name} · {data.summary.model_accuracy}% accuracy
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-muted/50 p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Modèle actif</p>
                <p className="mt-2 text-xl font-bold text-foreground">{data.summary.model_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Score global du tableau de bord</p>
              </div>
              <div className="rounded-md border border-border bg-muted/50 p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Accuracy</p>
                <p className="mt-2 text-xl font-bold text-foreground">{data.summary.model_accuracy}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Taux de précision du modèle</p>
              </div>
              <div className="rounded-md border border-border bg-muted/50 p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Entité affichée</p>
                <p className="mt-2 text-xl font-bold text-foreground">{activeEntity?.entity || "Région"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Selon le filtre géographique actif</p>
              </div>
              <div className="rounded-md border border-border bg-muted/50 p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Graphiques</p>
                <p className="mt-2 text-xl font-bold text-foreground">5+</p>
                <p className="mt-1 text-xs text-muted-foreground">Corrélations, courbes, comparaisons</p>
              </div>
            </div>
          </motion.section>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive-foreground">
            Impossible de charger <code>predictions.json</code>. Lance le notebook ML pour le générer dans <code>/public/data/</code>.
          </div>
        )}

        {/* Filters */}
        <section className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-4 shadow-sm mb-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Modèle prédictif</label>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring outline-none transition-colors"
              style={{ appearance: 'auto' }}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </section>

        {data && (
          <section className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Région</label>
              <select disabled className="bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground opacity-60">
                <option>Nouvelle-Aquitaine</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Département</label>
              <select
                value={selectedDept}
                onChange={e => {
                  setSelectedDept(e.target.value);
                  setSelectedCanton("ALL");
                }}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring outline-none transition-colors"
              >
                <option value="ALL">Tous les départements</option>
                {data.levels.departement?.map((d: PredictionEntity) => (
                  <option key={d.entity} value={d.entity}>{d.entity}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Canton</label>
              <select
                value={selectedCanton}
                onChange={e => setSelectedCanton(e.target.value)}
                disabled={selectedDept === "ALL"}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring outline-none transition-colors disabled:opacity-50"
              >
                <option value="ALL">Tous les cantons</option>
                {selectedDept !== "ALL" && data.levels.canton
                  ?.filter((c: PredictionEntity) => c.parent === selectedDept)
                  .map((c: PredictionEntity) => (
                    <option key={c.entity} value={c.entity}>{c.entity}</option>
                  ))
                }
              </select>
            </div>
          </section>
        )}

        {/* Political spectrum for active entity */}
        {activeEntity && (
          <PoliticalSpectrum entityName={activeEntity.entity} ecoState={activeEntity.economic_state} />
        )}

        {/* Tables */}
        {data && <PredictionTable data={tableData} levelLabel={tableLevel} />}

        {/* KPI grid */}
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label={`Vainqueur prédit (${activeEntity?.entity || '—'})`}
            value={activeEntity?.predicted ?? "—"}
            hint={`Réel : ${activeEntity?.real ?? "—"}`}
            accent="primary"
            delay={0}
          />
          <KpiCard
            label="État économique calculé"
            value={activeEntity ? (ECO_FR[activeEntity.economic_state] ?? activeEntity.economic_state).toUpperCase() : "—"}
            hint={`Score : ${activeEntity?.economic_score?.toFixed(2) ?? "—"}`}
            accent="accent"
            delay={0.05}
          />
          <KpiCard
            label={`Accuracy modèle (${data?.summary.model_name ?? '—'})`}
            value={data ? `${data.summary.model_accuracy}%` : "—"}
            hint="Entraînement sur variables socio-éco"
            accent="success"
            delay={0.1}
          />
        </section>

        {/* Donuts */}
        {data && selectedDept === "ALL" && (
          <section className="grid gap-3 md:grid-cols-2">
            <PartyDonut title="Réel · Départements" data={data.political_real} />
            <PartyDonut title="Prédit · Départements" data={data.political_predicted} />
          </section>
        )}

        {isLoading && <div className="text-center text-sm text-muted-foreground">Chargement…</div>}
      </main>
    </div>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}
