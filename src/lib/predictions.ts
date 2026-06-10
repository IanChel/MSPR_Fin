export type Level = "region" | "departement" | "canton" | "commune";

export interface PredictionEntity {
  entity: string;
  parent?: string;
  predicted: string;
  political_side: PoliticalSide;
  economic_state: EcoState;
  economic_score: number;
  real: string;
  is_correct: boolean;
  proba: { MACRON: number; Opposition: number };
}

export interface PoliticalCount {
  party: string;
  count: number;
  color: string;
}

export interface PredictionsData {
  summary: {
    region_name: string;
    predicted_winner: string;
    real_winner: string;
    model_accuracy: number;
    economic_state: EcoState;
    political_side: PoliticalSide;
  };
  political_real: PoliticalCount[];
  political_predicted: PoliticalCount[];
  levels: Record<Level, PredictionEntity[]>;
}

export async function fetchPredictions(): Promise<PredictionsData> {
  const res = await fetch("/data/predictions.json");
  if (!res.ok) throw new Error("Impossible de charger predictions.json");
  return res.json();
}

/**
 * Mapping économie → échiquier politique.
 * Logique fondée sur la science politique des élections françaises 2012/2017/2022 :
 *  - Indicateurs agrégés : emploi (chômage ↓ = +), revenu, population active,
 *    logement, entreprises (création), sécurité, diplôme.
 *  - Économie en forte croissance & sécurité haute → électeurs récompensent
 *    l'incumbent / vote modéré → CENTRE / DROITE.
 *  - Économie stable → statu quo → CENTRE.
 *  - Économie en déclin + chômage élevé → vote protestataire de gauche → GAUCHE / EXTRÊME GAUCHE.
 *  - Économie en déclin + insécurité + tension migratoire → EXTRÊME DROITE.
 */
export type EcoState = "boom" | "growth" | "stable" | "decline" | "crisis";
export type PoliticalSide =
  | "extreme-gauche"
  | "gauche"
  | "centre"
  | "droite"
  | "extreme-droite";

export interface EcoScenario {
  state: EcoState;
  label: string;
  shortLabel: string;
  description: string;
  delta: string;
  winner: PoliticalSide;
  winnerLabel: string;
  candidate: string;
  rationale: string;
  signals: { label: string; trend: "up" | "down" | "flat" }[];
}

export const ECO_SCENARIOS: EcoScenario[] = [
  {
    state: "boom",
    label: "Forte croissance économique",
    shortLabel: "Boom",
    description: "Chômage en baisse marquée, revenus en hausse, créations d'entreprises soutenues.",
    delta: "Δ éco > +5%",
    winner: "droite",
    winnerLabel: "Droite libérale",
    candidate: "ex. Pécresse / LR",
    rationale: "En période de prospérité, l'électorat valorise la gestion économique et récompense la droite de gouvernement.",
    signals: [
      { label: "Chômage", trend: "down" },
      { label: "Revenu", trend: "up" },
      { label: "Entreprises", trend: "up" },
      { label: "Sécurité", trend: "up" },
    ],
  },
  {
    state: "growth",
    label: "Croissance modérée",
    shortLabel: "Croissance",
    description: "Indicateurs majoritairement positifs, dynamique de l'emploi continue.",
    delta: "Δ éco +1% à +5%",
    winner: "centre",
    winnerLabel: "Centre",
    candidate: "Macron (Renaissance)",
    rationale: "Le centre capitalise sur une dynamique perçue comme stable et progressive — profil dominant en Nouvelle-Aquitaine.",
    signals: [
      { label: "Chômage", trend: "down" },
      { label: "Revenu", trend: "up" },
      { label: "Diplôme", trend: "up" },
      { label: "Population", trend: "up" },
    ],
  },
  {
    state: "stable",
    label: "Économie stable",
    shortLabel: "Stable",
    description: "Aucune variation significative — statu quo socio-économique.",
    delta: "Δ éco −1% à +1%",
    winner: "centre",
    winnerLabel: "Centre",
    candidate: "Macron (Renaissance)",
    rationale: "L'absence de choc favorise la continuité institutionnelle : l'électorat reconduit le centre.",
    signals: [
      { label: "Chômage", trend: "flat" },
      { label: "Revenu", trend: "flat" },
      { label: "Sécurité", trend: "flat" },
      { label: "Population", trend: "flat" },
    ],
  },
  {
    state: "decline",
    label: "Déclin économique",
    shortLabel: "Déclin",
    description: "Chômage qui remonte, revenus stagnants, fermetures d'entreprises localisées.",
    delta: "Δ éco −1% à −5%",
    winner: "gauche",
    winnerLabel: "Gauche sociale",
    candidate: "Mélenchon (LFI) / écologistes",
    rationale: "En déclin économique mesuré, le vote protestataire se reporte vers la gauche sociale qui promet la redistribution.",
    signals: [
      { label: "Chômage", trend: "up" },
      { label: "Revenu", trend: "down" },
      { label: "Entreprises", trend: "down" },
      { label: "Diplôme", trend: "flat" },
    ],
  },
  {
    state: "crisis",
    label: "Crise socio-économique",
    shortLabel: "Crise",
    description: "Chômage élevé, paupérisation, insécurité ressentie en hausse, sentiment de déclassement.",
    delta: "Δ éco < −5%",
    winner: "extreme-droite",
    winnerLabel: "Extrême droite",
    candidate: "Le Pen (RN)",
    rationale: "Cumul déclin + insécurité + déclassement → vote de rupture vers l'extrême droite (cf. zones rurales du Lot-et-Garonne).",
    signals: [
      { label: "Chômage", trend: "up" },
      { label: "Sécurité", trend: "down" },
      { label: "Revenu", trend: "down" },
      { label: "Population", trend: "down" },
    ],
  },
];

export const SIDE_META: Record<PoliticalSide, { label: string; color: string; position: number }> = {
  "extreme-gauche": { label: "Extrême gauche", color: "var(--pol-far-left)", position: 0 },
  gauche:           { label: "Gauche",         color: "var(--pol-left)",     position: 25 },
  centre:           { label: "Centre",         color: "var(--pol-center)",   position: 50 },
  droite:           { label: "Droite",         color: "var(--pol-right)",    position: 75 },
  "extreme-droite": { label: "Extrême droite", color: "var(--pol-far-right)",position: 100 },
};