/**
 * output-builder.ts — Construction de la sortie structurée EngineOutput
 *
 * Assemble tous les résultats intermédiaires en un objet EngineOutput complet.
 */

import type {
  UserInput,
  EngineOutput,
  InputsNormalises,
  QualificationFlags,
  DetailCalculScenario,
  ScenarioCandidat,
  ScenarioExclu,
  Comparaison,
  Recommandation,
  NiveauFiabilite,
  SegmentActivite,
  OptionTVA,
  OptionExonerationZone,
} from "@wymby/types";
import type { NormalisationResult } from "./normalizer.js";
import type { QualificationResult } from "./qualifier.js";
import type { EngineLogger } from "./logger.js";

export function construireEngineOutput(
  input: UserInput,
  norm: NormalisationResult,
  qual: QualificationResult,
  scenarios_possibles: ScenarioCandidat[],
  scenarios_exclus: ScenarioExclu[],
  calculs: DetailCalculScenario[],
  comparaison: Comparaison,
  recommandation: Recommandation | null,
  avertissements_globaux: string[],
  logger: EngineLogger
): EngineOutput {
  // ── Inputs normalisés ──────────────────────────────────────────────────────
  const inputs_normalises: InputsNormalises = {
    profil: {
      segment: qual.segment as SegmentActivite,
      forme_juridique: input.FORME_JURIDIQUE_ENVISAGEE,
      regime_envisage: input.REGIME_FISCAL_ENVISAGE,
    },
    activite: {
      CA_HT_RETENU: norm.CA_HT_RETENU,
      CA_TTC_RETENU: norm.CA_TTC_RETENU,
      charges_retenues: norm.CHARGES_DEDUCTIBLES_RETENUES,
      recettes_pro_retenues: norm.RECETTES_PRO_RETENUES,
    },
    foyer: {
      situation_familiale: input.SITUATION_FAMILIALE,
      nb_parts: norm.NOMBRE_PARTS_FISCALES,
      autres_revenus: input.AUTRES_REVENUS_FOYER_IMPOSABLES,
      rfr_n2: input.RFR_N_2_UTILISATEUR,
    },
    tva: {
      regime_applicable: qual.regime_tva as OptionTVA,
      tva_nette_due: norm.TVA_NETTE_DUE,
    },
    aides: {
      acre_active: qual.flags.FLAG_ACRE_POSSIBLE,
      arce_active: qual.flags.FLAG_ARCE_POSSIBLE,
      zone_active: _getZoneActive(qual.flags) as OptionExonerationZone | null,
    },
  };

  // ── Qualité du résultat ────────────────────────────────────────────────────
  const niveau_fiabilite = _calculerNiveauFiabiliteGlobal(calculs);
  const score_fiabilite = _calculerScoreFiabilite(
    input,
    norm,
    calculs.length
  );

  const tous_avertissements = [
    ...avertissements_globaux,
    ...qual.avertissements,
    ...norm.avertissements,
    ...calculs.flatMap((c) => c.avertissements_scenario),
  ].filter((v, i, a) => a.indexOf(v) === i); // déduplique

  const hypotheses = [
    ...norm.hypotheses,
    ...calculs
      .flatMap((c) => c.avertissements_scenario)
      .filter((a) => a.toLowerCase().includes("hypothèse") || a.toLowerCase().includes("approximation")),
  ].filter((v, i, a) => a.indexOf(v) === i);

  logger.info(10, "EngineOutput construit", {
    detail: {
      scenarios_possibles: scenarios_possibles.length,
      scenarios_exclus: scenarios_exclus.length,
      scenarios_calcules: calculs.length,
      niveau_fiabilite,
      score_fiabilite,
      nb_avertissements: tous_avertissements.length,
    },
  });

  return {
    inputs_normalises,
    qualification: {
      segment_retenu: qual.segment as SegmentActivite,
      flags: qual.flags,
      elements_a_confirmer: qual.elements_a_confirmer,
    },
    scenarios_possibles,
    scenarios_exclus,
    calculs_par_scenario: calculs,
    comparaison,
    recommandation,
    qualite_resultat: {
      niveau_fiabilite,
      score_fiabilite,
      hypotheses_retenues: hypotheses,
      avertissements: tous_avertissements,
      elements_a_confirmer: qual.elements_a_confirmer,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────

function _getZoneActive(flags: QualificationFlags): string | null {
  if (flags.FLAG_ZFRR_PLUS_POSSIBLE) return "ZFRR_PLUS";
  if (flags.FLAG_ZFRR_POSSIBLE) return "ZFRR";
  if (flags.FLAG_QPV_POSSIBLE) return "QPV";
  if (flags.FLAG_ZFU_STOCK_DROITS_POSSIBLE) return "ZFU_stock";
  return null;
}

function _calculerNiveauFiabiliteGlobal(
  calculs: DetailCalculScenario[]
): NiveauFiabilite {
  if (calculs.length === 0) return "estimation";

  const niveaux = calculs.map((c) => c.niveau_fiabilite);
  if (niveaux.some((n) => n === "estimation")) return "estimation";
  if (niveaux.some((n) => n === "partiel")) return "partiel";
  return "complet";
}

function _calculerScoreFiabilite(
  input: UserInput,
  norm: NormalisationResult,
  nb_scenarios: number
): number {
  // Score de 0 à 10
  let score = 10;

  if (input.CHARGES_DECAISSEES === undefined) score -= 2;
  if (input.AUTRES_REVENUS_FOYER_IMPOSABLES === undefined) score -= 2;
  if (input.RFR_N_2_UTILISATEUR === undefined) score -= 1;
  if (input.DATE_CREATION_ACTIVITE === undefined) score -= 1;
  if (input.NIVEAU_CERTITUDE_CA === "faible") score -= 2;
  if (input.NIVEAU_CERTITUDE_CA === "estimé") score -= 1;
  if (nb_scenarios === 0) score = 0;

  return Math.max(0, score);
}
