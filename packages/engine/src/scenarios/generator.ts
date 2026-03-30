/**
 * scenarios/generator.ts — Génération des scénarios compatibles
 *
 * Produit le produit cartésien contrôlé : BASE × TVA × OPTIONS × AIDES
 * en respectant la matrice de compatibilité.
 */

import type {
  UserInput,
  ScenarioCandidat,
  BoosterId,
  OptionTVA,
  OptionVFL,
} from "@wymby/types";
import type { QualificationResult } from "../qualifier.js";
import type { FiltreExclusionResult } from "../filters/exclusion.js";
import type { EngineLogger } from "../logger.js";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import { SCENARIO_REGISTRY, getScenariosForSegment } from "./registry.js";

type FP = typeof FiscalParamsType;

/**
 * Génère tous les scénarios compatibles pour un profil donné.
 * Chaque scénario est identifié par un scenario_id unique.
 */
export function genererScenarios(
  input: UserInput,
  qual: QualificationResult,
  filtres: FiltreExclusionResult,
  params: FP,
  logger: EngineLogger
): ScenarioCandidat[] {
  const scenarios: ScenarioCandidat[] = [];
  const metasBase = getScenariosForSegment(qual.segment);

  logger.info(4, "Génération scénarios", {
    detail: {
      segment: qual.segment,
      nb_bases: metasBase.length,
    },
  });

  for (const meta of metasBase) {
    // Vérifier éligibilité de la base
    if (!_isBaseEligible(meta.id, qual)) continue;

    // Générer les combinaisons TVA
    for (const optTva of meta.options_tva) {
      // Vérifier conditions TVA
      if (optTva === "TVA_FRANCHISE" && filtres.tva_collectee_obligatoire) continue;

      // Générer les options VFL si disponibles
      const vflOptions: OptionVFL[] = ["VFL_NON"];
      if (
        meta.vfl_disponible &&
        (qual.flags.FLAG_VFL_POSSIBLE || input.OPTION_VFL_DEMANDEE === true || filtres.vfl_exclu)
      ) {
        vflOptions.push("VFL_OUI");
      }

      for (const optVfl of vflOptions) {
        // Générer les combinaisons de boosters
        const boosterCombinations = _genererCombinaisonsBoosters(
          meta.id,
          optTva,
          input,
          qual,
          params
        );

        for (const boosters of boosterCombinations) {
          const scenario_id = _buildScenarioId(meta.id, optTva, optVfl, boosters);

          const sc: ScenarioCandidat = {
            scenario_id,
            base_id: meta.id,
            option_tva: optTva,
            option_vfl: optVfl,
            boosters_actifs: boosters,
            options_supplementaires: [],
            motif_admission: _buildMotifAdmission(meta, optTva, optVfl, boosters),
          };

          scenarios.push(sc);
        }
      }
    }
  }

  logger.info(4, "Scénarios générés (avant incompatibilités)", {
    detail: { nb_scenarios: scenarios.length },
  });

  return scenarios;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────

function _isBaseEligible(
  baseId: string,
  qual: QualificationResult
): boolean {
  const f = qual.flags;

  switch (baseId) {
    case "G_MBIC_VENTE":
      return qual.segment === "generaliste" &&
        (qual.flags.FLAG_MICRO_BIC_VENTE_POSSIBLE ||
          qual.flags.FLAG_DEPASSEMENT_SEUIL_MICRO ||
          inputCompatibleWithBase(qual, "achat_revente"));
    case "G_MBIC_SERVICE":
      return qual.segment === "generaliste" &&
        (qual.flags.FLAG_MICRO_BIC_SERVICE_POSSIBLE ||
          qual.flags.FLAG_DEPASSEMENT_SEUIL_MICRO ||
          inputCompatibleWithBase(qual, "prestation"));
    case "G_MBNC":
      return qual.segment === "generaliste" &&
        (qual.flags.FLAG_MICRO_BNC_POSSIBLE ||
          qual.flags.FLAG_DEPASSEMENT_SEUIL_MICRO ||
          inputCompatibleWithBase(qual, "liberal"));
    case "G_EI_REEL_BIC_IR": return f.FLAG_EI_REEL_BIC_IR_POSSIBLE;
    case "G_EI_REEL_BIC_IS": return f.FLAG_EI_REEL_BIC_IS_POSSIBLE;
    case "G_EI_REEL_BNC_IR": return f.FLAG_EI_REEL_BNC_IR_POSSIBLE;
    case "G_EI_REEL_BNC_IS": return f.FLAG_EI_REEL_BNC_IS_POSSIBLE;
    case "G_EURL_IS": return f.FLAG_EURL_IS_POSSIBLE;
    case "G_EURL_IR": return f.FLAG_EURL_IR_POSSIBLE;
    case "G_SASU_IS": return f.FLAG_SASU_IS_POSSIBLE;
    case "G_SASU_IR": return f.FLAG_SASU_IR_POSSIBLE;
    case "S_RSPM": return f.FLAG_RSPM_POSSIBLE;
    case "S_MICRO_BNC_SECTEUR_1":
    case "S_MICRO_BNC_SECTEUR_2":
      return qual.segment === "sante" && f.FLAG_SANTE_MICRO_POSSIBLE;
    case "S_EI_REEL_SECTEUR_1":
    case "S_EI_REEL_SECTEUR_2_OPTAM":
    case "S_EI_REEL_SECTEUR_2_NON_OPTAM":
    case "S_EI_REEL_SECTEUR_3_HORS_CONVENTION":
    case "S_SELARL_IS":
    case "S_SELAS_IS":
      return qual.segment === "sante" && f.FLAG_SANTE_REEL_POSSIBLE;
    // Artiste-auteur (V2)
    case "A_BNC_MICRO":
      return qual.segment === "artiste_auteur" && f.FLAG_ARTISTE_AUTEUR_BNC_MICRO_POSSIBLE;
    case "A_BNC_MICRO_TVA_FRANCHISE":
    case "A_BNC_MICRO_TVA_COLLECTEE":
      return qual.segment === "artiste_auteur" && f.FLAG_ARTISTE_AUTEUR_BNC_MICRO_POSSIBLE;
    case "A_BNC_REEL":
      case "A_TS_ABATTEMENT_FORFAITAIRE":
    case "A_TS_FRAIS_REELS":
      return qual.segment === "artiste_auteur";
    // Immobilier (V2)
    case "I_LMNP_MICRO":
      return qual.segment === "immobilier" && f.FLAG_LMNP_MICRO_POSSIBLE;
    case "I_LMNP_REEL":
      return qual.segment === "immobilier";
    case "I_LMP":
      return qual.segment === "immobilier" && f.FLAG_LMP_POSSIBLE;
    default:
      return false;
  }
}

function inputCompatibleWithBase(
  qual: QualificationResult,
  sousSegment: "achat_revente" | "prestation" | "liberal"
): boolean {
  const actif = Object.entries(qual.flags)
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  if (sousSegment === "achat_revente") {
    return actif.includes("FLAG_EI_REEL_BIC_IR_POSSIBLE");
  }
  if (sousSegment === "prestation") {
    return actif.includes("FLAG_EI_REEL_BIC_IR_POSSIBLE");
  }
  return actif.includes("FLAG_EI_REEL_BNC_IR_POSSIBLE");
}

function _genererCombinaisonsBoosters(
  baseId: string,
  optTva: OptionTVA,
  input: UserInput,
  qual: QualificationResult,
  params: FP
): BoosterId[][] {
  const boosters_disponibles: BoosterId[] = [];
  const f = qual.flags;
  const meta = SCENARIO_REGISTRY[baseId as keyof typeof SCENARIO_REGISTRY];

  // ACRE
  if (f.FLAG_ACRE_POSSIBLE) {
    boosters_disponibles.push("BOOST_ACRE");
  }

  // ARCE
  if (f.FLAG_ARCE_POSSIBLE) {
    boosters_disponibles.push("BOOST_ARCE");
  }

  // ZFRR (régime réel obligatoire)
  if (f.FLAG_ZFRR_POSSIBLE) {
    boosters_disponibles.push("BOOST_ZFRR");
  }

  // ZFRR+ (idem mais aussi exonération sociale)
  if (f.FLAG_ZFRR_PLUS_POSSIBLE) {
    boosters_disponibles.push("BOOST_ZFRR_PLUS");
  }

  // QPV
  if (f.FLAG_QPV_POSSIBLE && meta?.zfrr_compatible === true) {
    boosters_disponibles.push("BOOST_QPV");
  }

  // ZFU stock droits antérieurs
  if (f.FLAG_ZFU_STOCK_DROITS_POSSIBLE && meta?.zfrr_compatible === true) {
    boosters_disponibles.push("BOOST_ZFU_STOCK");
  }

  // Générer combinaisons : sans booster + chaque booster unique
  // (pas de combinaisons doubles pour limiter l'explosion combinatoire
  // sauf ACRE+ZFRR qui sont compatibles et ACRE+ARCE)
  const zoneChoisie = input.OPTION_EXONERATION_ZONE_CHOISIE;
  const onlyZoneMode = zoneChoisie !== undefined && zoneChoisie !== "aucune";
  const combinaisons: BoosterId[][] = onlyZoneMode ? [] : [[]];

  // Chaque booster seul
  for (const b of boosters_disponibles) {
    combinaisons.push([b]);
  }

  // ACRE + ARCE combinés (compatibles)
  if (
    boosters_disponibles.includes("BOOST_ACRE") &&
    boosters_disponibles.includes("BOOST_ARCE")
  ) {
    combinaisons.push(["BOOST_ACRE", "BOOST_ARCE"]);
  }

  // ACRE + zone (si non-cumul pas violé)
  const zonesBoosters = boosters_disponibles.filter((b) =>
    ["BOOST_ZFRR", "BOOST_ZFRR_PLUS", "BOOST_QPV", "BOOST_ZFU_STOCK"].includes(b)
  );
  for (const zone of zonesBoosters) {
    if (boosters_disponibles.includes("BOOST_ACRE")) {
      combinaisons.push(["BOOST_ACRE", zone]);
    }
    if (boosters_disponibles.includes("BOOST_ARCE")) {
      combinaisons.push(["BOOST_ARCE", zone]);
    }
    if (
      boosters_disponibles.includes("BOOST_ACRE") &&
      boosters_disponibles.includes("BOOST_ARCE")
    ) {
      combinaisons.push(["BOOST_ACRE", "BOOST_ARCE", zone]);
    }
  }

  return combinaisons;
}

function _buildScenarioId(
  baseId: string,
  optTva: OptionTVA,
  optVfl: OptionVFL,
  boosters: BoosterId[]
): string {
  const suffixes: string[] = [];

  if (optTva === "TVA_COLLECTEE") suffixes.push("TVA_COLLECTEE");
  if (optVfl === "VFL_OUI") suffixes.push("VFL_OUI");
  if (boosters.length > 0) {
    suffixes.push(...boosters.map((b) => b.replace("BOOST_", "")));
  }

  return suffixes.length > 0
    ? `${baseId}__${suffixes.join("__")}`
    : baseId;
}

function _buildMotifAdmission(
  meta: (typeof SCENARIO_REGISTRY)[keyof typeof SCENARIO_REGISTRY],
  optTva: OptionTVA,
  optVfl: OptionVFL,
  boosters: BoosterId[]
): string {
  const parts = [`Régime ${meta.label}`];
  if (optTva === "TVA_COLLECTEE") parts.push("avec TVA collectée");
  if (optVfl === "VFL_OUI") parts.push("avec Versement Libératoire");
  if (boosters.length > 0) {
    parts.push(`Boosters : ${boosters.join(", ")}`);
  }
  return parts.join(" — ");
}
