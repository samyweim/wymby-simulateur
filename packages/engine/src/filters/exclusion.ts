/**
 * filters/exclusion.ts — Filtres d'exclusion X01–X04
 *
 * X01 : CA N-1 et N-2 > seuils micro → bascule réel obligatoire
 * X02 : CA > seuil TVA → passage TVA collectée immédiat
 * X03 : RFR > seuil VFL → option VFL caduque
 * X04 : Revenu activité < seuil PUMa + revenus capital élevés → taxe rentier potentielle
 */

import type { UserInput, ScenarioCandidat, ScenarioExclu } from "@wymby/types";
import type { NormalisationResult } from "../normalizer.js";
import type { QualificationResult } from "../qualifier.js";
import type { EngineLogger } from "../logger.js";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";

type FP = typeof FiscalParamsType;

export interface FiltreExclusionResult {
  basculement_reel_oblige: boolean;
  premiere_annee_depassement: boolean;
  tva_collectee_obligatoire: boolean;
  vfl_exclu: boolean;
  puma_applicable: boolean;
  motifs: Record<string, string>;
}

/**
 * Applique les filtres d'exclusion X01–X04 sur les données normalisées.
 * Retourne les flags d'exclusion et leurs motifs.
 */
export function appliquerFiltresExclusion(
  input: UserInput,
  norm: NormalisationResult,
  qual: QualificationResult,
  params: FP,
  logger: EngineLogger
): FiltreExclusionResult {
  const motifs: Record<string, string> = {};

  // ── X01 : Dépassement durable des seuils micro ────────────────────────────
  // Règle fiscale : bascule réel obligatoire si CA N > seuil ET CA N-1 > seuil.
  // Un seul dépassement ne suffit pas — la première année est tolérée.
  let basculement_reel_oblige = false;
  let premiere_annee_depassement = false;
  {
    const seuil = _getSeuilMicroApplicable(input, params);
    const caN1 = input.CA_N1_ANTERIEUR;

    if (qual.flags.FLAG_DEPASSEMENT_SEUIL_MICRO && norm.CA_HT_RETENU > seuil) {
      const caN1DepasseSeuil = caN1 !== undefined && caN1 > seuil;
      // When CA exceeds 2× the micro threshold it is implausible the user was on micro
      // the prior year — enforce basculement even without CA N-1 data.
      const depassement_massif = norm.CA_HT_RETENU > seuil * 2;

      if (caN1DepasseSeuil || depassement_massif) {
        // Two consecutive years confirmed, or CA too far above threshold to tolerate
        basculement_reel_oblige = true;
        motifs["X01"] =
          `CA HT retenu (${norm.CA_HT_RETENU} €) dépasse le seuil micro (${seuil} €) ` +
          (caN1DepasseSeuil
            ? "pour la deuxième année consécutive."
            : `(plus de 2× le seuil — tolérance première année inapplicable).`) +
          " Bascule en régime réel obligatoire (filtre X01).";
      } else {
        // First year of exceeding the threshold, or CA N-1 unknown but marginal overshoot
        premiere_annee_depassement = true;
        motifs["X01_PREMIERE_ANNEE"] =
          `CA HT retenu (${norm.CA_HT_RETENU} €) dépasse le seuil micro (${seuil} €) pour la ` +
          "première fois. Régime micro maintenu jusqu'au 31/12/N. " +
          "Bascule réel obligatoire à partir du 01/01/N+1.";
      }
    }

    logger.calc(3, "Filtre X01", "basculement_reel_oblige", basculement_reel_oblige, {
      CA_HT: norm.CA_HT_RETENU,
      seuil_micro: seuil,
      CA_N1: caN1,
      premiere_annee_depassement,
    });
  }

  // ── X02 : Dépassement seuil TVA ───────────────────────────────────────────
  const tva_collectee_obligatoire = qual.flags.FLAG_DEPASSEMENT_SEUIL_TVA;

  if (tva_collectee_obligatoire) {
    motifs["X02"] =
      `CA HT (${norm.CA_HT_RETENU} €) dépasse le seuil franchise TVA. ` +
      "TVA collectée obligatoire (filtre X02).";
  }

  logger.calc(3, "Filtre X02", "tva_collectee_obligatoire", tva_collectee_obligatoire);

  // ── X03 : RFR > seuil VFL ────────────────────────────────────────────────
  const vfl_exclu = qual.flags.FLAG_VFL_INTERDIT;

  if (vfl_exclu) {
    motifs["X03"] = "RFR N-2 dépasse le seuil VFL (filtre X03) : option Versement Libératoire exclue.";
  }

  logger.calc(3, "Filtre X03", "vfl_exclu", vfl_exclu);

  // ── X04 : Taxe PUMa potentielle ───────────────────────────────────────────
  const puma_applicable = qual.flags.FLAG_TAXE_PUMA_APPLICABLE;

  if (puma_applicable) {
    motifs["X04"] =
      "Revenus d'activité faibles + revenus du capital potentiellement élevés : " +
      "Cotisation Subsidiaire Maladie (taxe PUMa/rentier) potentiellement applicable (filtre X04). " +
      "Calcul estimatif — à confirmer. Fiabilité marquée 'partiel'.";
  }

  logger.calc(3, "Filtre X04", "puma_applicable", puma_applicable);
  logger.info(3, "Filtres d'exclusion appliqués", {
    detail: {
      X01: basculement_reel_oblige,
      X02: tva_collectee_obligatoire,
      X03: vfl_exclu,
      X04: puma_applicable,
    },
  });

  return {
    basculement_reel_oblige,
    premiere_annee_depassement,
    tva_collectee_obligatoire,
    vfl_exclu,
    puma_applicable,
    motifs,
  };
}

/**
 * Applique les filtres d'exclusion aux scénarios générés.
 * Retourne { possibles, exclus } mis à jour.
 */
export function filtrerScenariosParExclusion(
  scenarios: ScenarioCandidat[],
  filtres: FiltreExclusionResult,
  input: UserInput,
  params: FP,
  logger: EngineLogger
): { possibles: ScenarioCandidat[]; exclus: ScenarioExclu[] } {
  const possibles: ScenarioCandidat[] = [];
  const exclus: ScenarioExclu[] = [];

  for (const sc of scenarios) {
    const motifsExclusion: string[] = [];

    // X01 : régimes micro exclus si bascule réel obligatoire (deux années consécutives)
    if (
      filtres.basculement_reel_oblige &&
      _isMicroScenario(sc.base_id)
    ) {
      motifsExclusion.push(filtres.motifs["X01"] ?? "Seuil micro dépassé (deux années consécutives)");
    }

    // X02 : TVA franchise exclue si dépassement TVA
    if (
      filtres.tva_collectee_obligatoire &&
      sc.option_tva === "TVA_FRANCHISE"
    ) {
      motifsExclusion.push(filtres.motifs["X02"] ?? "Dépassement seuil TVA");
    }

    // X03 : VFL exclu
    if (
      filtres.vfl_exclu &&
      sc.option_vfl === "VFL_OUI"
    ) {
      motifsExclusion.push(filtres.motifs["X03"] ?? "RFR > seuil VFL");
    }

    if (motifsExclusion.length > 0) {
      exclus.push({
        scenario_id: sc.scenario_id,
        base_id: sc.base_id,
        motifs_exclusion: motifsExclusion,
      });
      logger.warn(3, "Scénario exclu", {
        scenario_id: sc.scenario_id,
        motif: motifsExclusion.join(" | "),
      });
    } else {
      // X01 première année : micro maintenu mais marqué dernier exercice possible
      if (filtres.premiere_annee_depassement && _isMicroScenario(sc.base_id)) {
        possibles.push({
          ...sc,
          options_supplementaires: [
            ...sc.options_supplementaires,
            "DERNIER_EXERCICE_MICRO_POSSIBLE",
          ],
        });
        logger.warn(3, "Scénario micro — dernier exercice possible (première année de dépassement)", {
          scenario_id: sc.scenario_id,
        });
      } else {
        possibles.push(sc);
      }
    }
  }

  if (filtres.vfl_exclu && input.OPTION_VFL_DEMANDEE === true) {
    const base_id = _getRequestedMicroBase(input);
    if (
      base_id &&
      !exclus.some((sc) => sc.scenario_id.startsWith(`${base_id}__VFL_OUI`))
    ) {
      exclus.push({
        scenario_id: `${base_id}__VFL_OUI`,
        base_id,
        motifs_exclusion: [filtres.motifs["X03"] ?? "RFR > seuil VFL"],
      });
    }
  }

  const rspmSeuilMax = params.social.CFG_TAUX_SOCIAL_RSPM.tranche_2.a ?? 0;
  const isRspmOutOfRange =
    input.SEGMENT_ACTIVITE === "sante" &&
    input.SOUS_SEGMENT_ACTIVITE === "medecin" &&
    input.EST_REMPLACANT === true &&
    input.CA_ENCAISSE_UTILISATEUR > rspmSeuilMax;

  if (
    isRspmOutOfRange &&
    !exclus.some((scenario) => scenario.base_id === "S_RSPM")
  ) {
    for (let index = possibles.length - 1; index >= 0; index -= 1) {
      if (possibles[index]?.base_id === "S_RSPM") {
        possibles.splice(index, 1);
      }
    }
    exclus.push({
      scenario_id: "S_RSPM",
      base_id: "S_RSPM",
      motifs_exclusion: [
        "FLAG_RSPM_DEPASSEMENT_SEUIL",
        "BASCULE_PAMC_AU_1ER_JANVIER_N_PLUS_1",
      ],
    });
    logger.warn(3, "Scénario RSPM exclu", {
      scenario_id: "S_RSPM",
      motif: "FLAG_RSPM_DEPASSEMENT_SEUIL | BASCULE_PAMC_AU_1ER_JANVIER_N_PLUS_1",
    });
  }

  return { possibles, exclus };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────

function _getSeuilMicroApplicable(input: UserInput, params: FP): number {
  const ss = input.SOUS_SEGMENT_ACTIVITE;
  if (ss === "achat_revente") return params.micro.CFG_SEUIL_CA_MICRO_BIC_VENTE;
  if (ss === "liberal") return params.micro.CFG_SEUIL_CA_MICRO_BNC;
  return params.micro.CFG_SEUIL_CA_MICRO_BIC_SERVICE;
}

function _isMicroScenario(baseId: string): boolean {
  return (
    baseId === "G_MBIC_VENTE" ||
    baseId === "G_MBIC_SERVICE" ||
    baseId === "G_MBNC" ||
    baseId === "S_MICRO_BNC_SECTEUR_1" ||
    baseId === "S_MICRO_BNC_SECTEUR_2" ||
    baseId === "A_BNC_MICRO_TVA_FRANCHISE" ||
    baseId === "A_BNC_MICRO_TVA_COLLECTEE" ||
    baseId === "I_LMNP_MICRO"
  );
}

function _getRequestedMicroBase(input: UserInput): ScenarioExclu["base_id"] | null {
  if (input.SOUS_SEGMENT_ACTIVITE === "achat_revente") return "G_MBIC_VENTE";
  if (input.SOUS_SEGMENT_ACTIVITE === "liberal") return "G_MBNC";
  if (input.SOUS_SEGMENT_ACTIVITE === "prestation") return "G_MBIC_SERVICE";
  return null;
}
