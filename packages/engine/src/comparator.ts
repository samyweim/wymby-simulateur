/**
 * comparator.ts — Comparaison et classement des scénarios
 *
 * Implémente ALGORITHME.md sections 9.1–9.5.
 */

import type {
  DetailCalculScenario,
  Comparaison,
  EcartVsReference,
  ScenarioId,
  Recommandation,
  UserInput,
} from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import type { EngineLogger } from "./logger.js";

type FP = typeof FiscalParamsType;
type ScoreWeights = {
  w_net: number;
  w_complexite: number;
  w_dependance: number;
  w_robustesse: number;
};

/**
 * Détermine le scénario de référence selon le cas classique du segment/profil.
 * On privilégie un régime de base "standard" avant tout tri par simplicité ou net.
 */
export function determinerScenarioReference(
  calculs: DetailCalculScenario[],
  input?: UserInput
): ScenarioId | null {
  if (calculs.length === 0) return null;

  const preferredBaseIds = _getReferenceBasePriority(input);

  for (const baseId of preferredBaseIds) {
    const candidate = [...calculs]
      .filter((scenario) => scenario.base_id === baseId)
      .sort(_compareReferenceCandidates)[0];

    if (candidate) return candidate.scenario_id;
  }

  return [...calculs].sort(_compareReferenceCandidates)[0]?.scenario_id ?? null;
}

/**
 * Calcule les écarts de chaque scénario vs le scénario de référence.
 */
export function calculerEcarts(
  calculs: DetailCalculScenario[],
  scenario_reference_id: ScenarioId
): EcartVsReference[] {
  const reference = calculs.find((c) => c.scenario_id === scenario_reference_id);
  if (!reference) return [];

  const ref = reference.intermediaires;

  return calculs.map((sc) => {
    const inter = sc.intermediaires;

    return {
      scenario_id: sc.scenario_id,
      DELTA_NET_AVANT_IR: (inter.NET_AVANT_IR ?? 0) - (ref.NET_AVANT_IR ?? 0),
      DELTA_NET_APRES_IR: (inter.NET_APRES_IR ?? 0) - (ref.NET_APRES_IR ?? 0),
      DELTA_COTISATIONS:
        (inter.COTISATIONS_SOCIALES_NETTES ?? 0) -
        (ref.COTISATIONS_SOCIALES_NETTES ?? 0),
      DELTA_FISCAL:
        (inter.IR_ATTRIBUABLE_SCENARIO ?? 0) +
        (inter.IS_DU_SCENARIO ?? 0) -
        ((ref.IR_ATTRIBUABLE_SCENARIO ?? 0) + (ref.IS_DU_SCENARIO ?? 0)),
      DELTA_COUT_TOTAL:
        (inter.COUT_TOTAL_SOCIAL_FISCAL ?? 0) -
        (ref.COUT_TOTAL_SOCIAL_FISCAL ?? 0),
      DELTA_TRESORERIE: (inter.AIDE_ARCE_TRESORERIE ?? 0) - (ref.AIDE_ARCE_TRESORERIE ?? 0),
    };
  });
}

/**
 * Calcule les scores de chaque scénario (robustesse, complexité, global).
 */
export function calculerScores(
  calcul: DetailCalculScenario,
  params: FP,
  input?: UserInput
): DetailCalculScenario["scores"] {
  const inter = calcul.intermediaires;
  const net = inter.NET_APRES_IR ?? 0;
  const ca = inter.CA_HT_RETENU ?? 1;

  // Score complexité : basé sur le registre (1–5)
  // Déjà calculé dans le registre des scénarios — on récupère depuis le scenario_id
  const score_complexite_base = _getScoreComplexiteBase(calcul.base_id);

  // Pénalité si dépendance aux aides temporaires
  const aides_val =
    (inter.REDUCTION_ACRE ?? 0) + (inter.AIDE_ARCE_TRESORERIE ?? 0);
  const DEPENDANCE_AIDES_RATIO =
    net > 0 ? aides_val / Math.abs(net) : 0;

  // Score robustesse : plus le taux de prélèvement est élevé, moins robuste
  const TAUX_PRELEVEMENTS_GLOBAL =
    ca > 0 ? (inter.COUT_TOTAL_SOCIAL_FISCAL ?? 0) / ca : 0;

  const SCORE_ROBUSTESSE = Math.max(0, 1 - TAUX_PRELEVEMENTS_GLOBAL);

  const { w_net, w_complexite, w_dependance, w_robustesse } =
    _getScoreWeights(params, input);

  const net_normalise = Math.min(1, Math.max(0, net / Math.max(1, ca)));
  const complexite_normalise = (score_complexite_base - 1) / 4; // 1–5 → 0–1
  const dependance_normalise = Math.min(1, DEPENDANCE_AIDES_RATIO);
  const robustesse_normalise = SCORE_ROBUSTESSE;

  const SCORE_GLOBAL_SCENARIO =
    w_net * net_normalise -
    w_complexite * complexite_normalise -
    w_dependance * dependance_normalise +
    w_robustesse * robustesse_normalise;

  return {
    SCORE_COMPLEXITE_ADMIN: score_complexite_base,
    SCORE_ROBUSTESSE,
    DEPENDANCE_AIDES_RATIO,
    SCORE_GLOBAL_SCENARIO,
    TAUX_PRELEVEMENTS_GLOBAL,
  };
}

/**
 * Construit l'objet Comparaison complet.
 */
export function construireComparaison(
  calculs: DetailCalculScenario[],
  scenario_reference_id: ScenarioId,
  input: UserInput,
  logger: EngineLogger
): Comparaison {
  const ecarts = calculerEcarts(calculs, scenario_reference_id);

  // Classement par NET_APRES_IR décroissant
  const classement_net_apres_ir = [...calculs]
    .sort(
      (a, b) =>
        (b.intermediaires.NET_APRES_IR ?? 0) -
        (a.intermediaires.NET_APRES_IR ?? 0)
    )
    .map((c) => c.scenario_id);

  // Classement par SUPER_NET décroissant
  const classement_super_net = [...calculs]
    .sort(
      (a, b) =>
        (b.intermediaires.SUPER_NET ?? 0) -
        (a.intermediaires.SUPER_NET ?? 0)
    )
    .map((c) => c.scenario_id);

  // Classement par score de robustesse décroissant
  const classement_robustesse = [...calculs]
    .sort((a, b) => b.scores.SCORE_ROBUSTESSE - a.scores.SCORE_ROBUSTESSE)
    .map((c) => c.scenario_id);

  // Classement par complexité croissant
  const classement_complexite = [...calculs]
    .sort((a, b) => a.scores.SCORE_COMPLEXITE_ADMIN - b.scores.SCORE_COMPLEXITE_ADMIN)
    .map((c) => c.scenario_id);

  logger.info(8, "Comparaison construite", {
    detail: {
      nb_scenarios: calculs.length,
      optimal_net: classement_net_apres_ir[0],
      optimal_super_net: classement_super_net[0],
      objectif_tresorerie: input.OBJECTIF_TRESORERIE ?? "par_defaut",
    },
  });

  return {
    scenario_reference_id,
    classement_net_apres_ir,
    classement_super_net,
    classement_robustesse,
    classement_complexite,
    ecarts,
  };
}

/**
 * Détermine le scénario recommandé.
 * Critère principal : score global (pondération robustesse + net + complexité).
 */
export function determinerRecommandation(
  calculs: DetailCalculScenario[],
  comparaison: Comparaison,
  logger: EngineLogger
): Recommandation | null {
  if (calculs.length === 0) return null;

  // Scénario optimal selon score global
  const optimal = calculs.reduce((best, cur) =>
    cur.scores.SCORE_GLOBAL_SCENARIO > best.scores.SCORE_GLOBAL_SCENARIO ? cur : best
  );

  const reference = calculs.find(
    (c) => c.scenario_id === comparaison.scenario_reference_id
  );

  const ecart_ref = comparaison.ecarts.find(
    (e) => e.scenario_id === optimal.scenario_id
  );
  const gain_annuel = ecart_ref?.DELTA_NET_APRES_IR ?? 0;

  const points_de_vigilance: string[] = [];

  if (optimal.scores.DEPENDANCE_AIDES_RATIO > 0.3) {
    points_de_vigilance.push(
      `Ce scénario dépend à ${Math.round(optimal.scores.DEPENDANCE_AIDES_RATIO * 100)} % ` +
        "d'aides temporaires (ACRE, ARCE). La rentabilité hors aides doit être évaluée séparément."
    );
  }

  if (optimal.scores.SCORE_COMPLEXITE_ADMIN >= 4) {
    points_de_vigilance.push(
      "Complexité administrative élevée (société IS). Coûts de gestion comptable à prévoir."
    );
  }

  if (optimal.niveau_fiabilite !== "complet") {
    points_de_vigilance.push(
      `Résultat de fiabilité "${optimal.niveau_fiabilite}" — certaines données sont estimées. ` +
        "Les valeurs peuvent différer selon la situation réelle."
    );
  }

  for (const av of optimal.avertissements_scenario) {
    points_de_vigilance.push(av);
  }

  const motif = _buildMotifRecommandation(optimal, comparaison, gain_annuel);

  logger.info(9, "Recommandation déterminée", {
    scenario_id: optimal.scenario_id,
    detail: {
      score_global: optimal.scores.SCORE_GLOBAL_SCENARIO,
      gain_vs_reference: gain_annuel,
      fiabilite: optimal.niveau_fiabilite,
    },
  });

  return {
    scenario_recommande_id: optimal.scenario_id,
    motif,
    points_de_vigilance,
    gain_vs_reference_annuel: gain_annuel,
    gain_vs_reference_mensuel: gain_annuel / 12,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────

function _compareReferenceCandidates(
  left: DetailCalculScenario,
  right: DetailCalculScenario
): number {
  const boosterDelta = left.boosters_actifs.length - right.boosters_actifs.length;
  if (boosterDelta !== 0) return boosterDelta;

  const vflDelta =
    (left.option_vfl === "VFL_OUI" ? 1 : 0) - (right.option_vfl === "VFL_OUI" ? 1 : 0);
  if (vflDelta !== 0) return vflDelta;

  const tvaDelta =
    (left.option_tva === "TVA_COLLECTEE" ? 1 : 0) -
    (right.option_tva === "TVA_COLLECTEE" ? 1 : 0);
  if (tvaDelta !== 0) return tvaDelta;

  const complexityDelta =
    _getScoreComplexiteBase(left.base_id) - _getScoreComplexiteBase(right.base_id);
  if (complexityDelta !== 0) return complexityDelta;

  return (right.intermediaires.NET_APRES_IR ?? 0) - (left.intermediaires.NET_APRES_IR ?? 0);
}

function _getReferenceBasePriority(input?: UserInput): string[] {
  if (!input) {
    return [
      "G_EI_REEL_BNC_IR",
      "G_EI_REEL_BIC_IR",
      "S_EI_REEL_SECTEUR_1",
      "A_BNC_REEL",
      "I_LMNP_REEL",
    ];
  }

  if (input.SEGMENT_ACTIVITE === "sante") {
    if (input.EST_REMPLACANT === true) {
      return ["S_RSPM", "S_EI_REEL_SECTEUR_1", "S_EI_REEL_SECTEUR_2_NON_OPTAM"];
    }
    if (input.SECTEUR_CONVENTIONNEL === "secteur_1") {
      return ["S_EI_REEL_SECTEUR_1", "S_MICRO_BNC_SECTEUR_1"];
    }
    if (input.SECTEUR_CONVENTIONNEL === "secteur_2_optam") {
      return ["S_EI_REEL_SECTEUR_2_OPTAM", "S_MICRO_BNC_SECTEUR_2"];
    }
    if (
      input.SECTEUR_CONVENTIONNEL === "secteur_2" ||
      input.SECTEUR_CONVENTIONNEL === "secteur_2_non_optam"
    ) {
      return ["S_EI_REEL_SECTEUR_2_NON_OPTAM", "S_MICRO_BNC_SECTEUR_2"];
    }
    if (
      input.SECTEUR_CONVENTIONNEL === "secteur_3" ||
      input.SECTEUR_CONVENTIONNEL === "hors_convention"
    ) {
      return ["S_EI_REEL_SECTEUR_3_HORS_CONVENTION"];
    }
    return [
      "S_EI_REEL_SECTEUR_1",
      "S_EI_REEL_SECTEUR_2_OPTAM",
      "S_EI_REEL_SECTEUR_2_NON_OPTAM",
      "S_MICRO_BNC_SECTEUR_1",
      "S_MICRO_BNC_SECTEUR_2",
    ];
  }

  if (input.SEGMENT_ACTIVITE === "artiste_auteur") {
    if (input.MODE_DECLARATION_ARTISTE_AUTEUR === "TS") {
      return ["A_TS_ABATTEMENT_FORFAITAIRE", "A_TS_FRAIS_REELS"];
    }
    return ["A_BNC_REEL", "A_BNC_MICRO_TVA_FRANCHISE", "A_BNC_MICRO"];
  }

  if (input.SEGMENT_ACTIVITE === "immobilier") {
    if (input.EST_LMP === true) {
      return ["I_LMP", "I_LMNP_REEL", "I_LMNP_MICRO"];
    }
    return ["I_LMNP_REEL", "I_LMNP_MICRO", "I_LMP"];
  }

  if (input.SOUS_SEGMENT_ACTIVITE === "liberal") {
    return ["G_EI_REEL_BNC_IR", "G_MBNC", "G_EI_REEL_BNC_IS", "G_EURL_IS", "G_SASU_IS"];
  }

  return [
    "G_EI_REEL_BIC_IR",
    "G_MBIC_SERVICE",
    "G_MBIC_VENTE",
    "G_EI_REEL_BIC_IS",
    "G_EURL_IS",
    "G_SASU_IS",
  ];
}

function _getScoreComplexiteBase(baseId: string): number {
  const complexites: Record<string, number> = {
    G_MBIC_VENTE: 1, G_MBIC_SERVICE: 1, G_MBNC: 1,
    G_EI_REEL_BIC_IR: 3, G_EI_REEL_BNC_IR: 3,
    G_EI_REEL_BIC_IS: 4, G_EI_REEL_BNC_IS: 4,
    G_EURL_IS: 4, G_EURL_IR: 4,
    G_SASU_IS: 5, G_SASU_IR: 5,
    S_RSPM: 1, S_MICRO_BNC_SECTEUR_1: 2, S_MICRO_BNC_SECTEUR_2: 2,
    S_EI_REEL_SECTEUR_1: 3, S_EI_REEL_SECTEUR_2_OPTAM: 3,
    S_EI_REEL_SECTEUR_2_NON_OPTAM: 3, S_EI_REEL_SECTEUR_3_HORS_CONVENTION: 3,
    S_SELARL_IS: 5, S_SELAS_IS: 5,
    A_BNC_MICRO: 1, A_BNC_MICRO_TVA_FRANCHISE: 1, A_BNC_MICRO_TVA_COLLECTEE: 2,
    A_BNC_REEL: 3, A_TS_ABATTEMENT_FORFAITAIRE: 2, A_TS_FRAIS_REELS: 3,
    I_LMNP_MICRO: 1, I_LMNP_REEL: 4, I_LMP: 4,
  };
  return complexites[baseId] ?? 3;
}

function _getScoreWeights(params: FP, input?: UserInput): ScoreWeights {
  if (input?.OBJECTIF_TRESORERIE === "flux_mensuel") {
    return params.fiscal.CFG_POIDS_SCORE_GLOBAL.flux_mensuel;
  }

  if (input?.OBJECTIF_TRESORERIE === "capitalisation") {
    return params.fiscal.CFG_POIDS_SCORE_GLOBAL.capitalisation;
  }

  return params.fiscal.CFG_POIDS_SCORE_GLOBAL.par_defaut;
}

function _buildMotifRecommandation(
  optimal: DetailCalculScenario,
  comparaison: Comparaison,
  gain_annuel: number
): string {
  const parts: string[] = [];

  const estOptimalNetApresIR = comparaison.classement_net_apres_ir[0] === optimal.scenario_id;
  const estOptimalRobustesse = comparaison.classement_robustesse[0] === optimal.scenario_id;

  if (estOptimalNetApresIR) {
    parts.push("meilleur revenu net après impôt");
  }
  if (estOptimalRobustesse) {
    parts.push("meilleure robustesse");
  }

  if (gain_annuel > 0) {
    parts.push(`+${Math.round(gain_annuel)} €/an vs scénario de référence`);
  }

  return parts.length > 0
    ? `Scénario recommandé : ${optimal.base_id} — ${parts.join(", ")}.`
    : `Scénario recommandé : ${optimal.base_id} (meilleur score global).`;
}
