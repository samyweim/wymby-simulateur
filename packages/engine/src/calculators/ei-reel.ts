/**
 * calculators/ei-reel.ts — EI Réel BIC/BNC IR/IS (C13–C16)
 *
 * Implémente les formules de ALGORITHME.md sections 5.3 et 5.4.
 */

import type { NiveauFiabilite, IntermediairesCalcul } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import { f_assiette_sociale_ASU, f_cotisations_tns_bic, f_cotisations_tns_estimees, f_acre_hors_micro } from "./cotisations-tns.js";
import { f_ir_attribuable_scenario } from "./ir.js";
import { f_is } from "./is.js";
import type { EngineLogger } from "../logger.js";

type FP = typeof FiscalParamsType;

export type TypeEIReel = "BIC_IR" | "BIC_IS" | "BNC_IR" | "BNC_IS";

export interface InputCalculEIReel {
  scenario_id?: string;
  RECETTES_PRO_RETENUES: number;
  CHARGES_DECAISSEES: number;
  CHARGES_DEDUCTIBLES: number;
  DOTATIONS_AMORTISSEMENTS?: number;
  TVA_NETTE_DUE: number;
  type_ei: TypeEIReel;
  acre_active?: boolean;
  date_creation?: Date;
  exoneration_fiscale_zone?: number;
  exoneration_sociale_zone?: number;
  autres_revenus_foyer?: number;
  autres_charges_foyer?: number;
  nombre_parts_fiscales: number;
  nb_mois_exercice?: number;
  droits_are_restants?: number;
  remuneration_dirigeant?: number; // pour EI IS
}

export interface ResultatCalculEIReel {
  intermediaires: Partial<IntermediairesCalcul>;
  niveau_fiabilite: NiveauFiabilite;
  avertissements: string[];
}

/**
 * Calcule un scénario EI au régime réel (BIC ou BNC, IR ou IS).
 * Conforme à ALGORITHME.md sections 5.3 et 5.4.
 */
export function calculerEIReel(
  input: InputCalculEIReel,
  params: FP,
  logger?: EngineLogger
): ResultatCalculEIReel {
  const avertissements: string[] = [];
  let niveau_fiabilite: NiveauFiabilite = "complet";

  const nb_mois = input.nb_mois_exercice ?? 12;

  if (input.CHARGES_DECAISSEES === 0 && input.CHARGES_DEDUCTIBLES === 0) {
    avertissements.push(
      "Charges nulles : résultat = recettes. Probable sous-estimation du résultat réel si des charges existent."
    );
    niveau_fiabilite = "partiel";
  }

  // ── Résultat comptable ────────────────────────────────────────────────────
  const amortissements = input.DOTATIONS_AMORTISSEMENTS ?? 0;

  const isISMode = input.type_ei === "BIC_IS" || input.type_ei === "BNC_IS";

  const REMUNERATION_DEDUCTIBLE = isISMode
    ? (input.remuneration_dirigeant ?? 0)
    : 0;

  const RESULTAT_COMPTABLE =
    input.RECETTES_PRO_RETENUES -
    input.CHARGES_DEDUCTIBLES -
    amortissements -
    REMUNERATION_DEDUCTIBLE;

  // ── Résultat fiscal ───────────────────────────────────────────────────────
  const RESULTAT_FISCAL_AVANT_EXONERATIONS = RESULTAT_COMPTABLE;

  const exo_fiscale = input.exoneration_fiscale_zone ?? 0;
  const RESULTAT_FISCAL_APRES_EXONERATIONS = Math.max(
    0,
    RESULTAT_FISCAL_AVANT_EXONERATIONS - exo_fiscale
  );

  // ── Assiette sociale (ASU 2026) ────────────────────────────────────────────
  // TODO [AMBIGUÏTÉ] : CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR — règles 2026 EI réel IR
  // Variables concernées : CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR
  // Impact : assiette cotisations EI réel IR — entrée en vigueur avril 2026
  // Décision requise : confirmer si la réforme ASU s'applique à toute l'année 2026 ou au prorata
  const asuResult = f_assiette_sociale_ASU(
    RESULTAT_FISCAL_AVANT_EXONERATIONS,
    params,
    logger,
    input.scenario_id
  );
  const ASSIETTE_SOCIALE_BRUTE = isISMode
    ? f_assiette_sociale_ASU(REMUNERATION_DEDUCTIBLE, params, logger, input.scenario_id).assiette
    : asuResult.assiette;

  if (asuResult.hypothese) {
    avertissements.push(asuResult.hypothese);
    niveau_fiabilite = "partiel";
  }

  // ── Cotisations sociales ──────────────────────────────────────────────────
  const cotisResult = f_cotisations_tns_bic(
    ASSIETTE_SOCIALE_BRUTE,
    params,
    logger,
    input.scenario_id
  );
  let COTISATIONS_SOCIALES_BRUTES = f_cotisations_tns_estimees(
    ASSIETTE_SOCIALE_BRUTE,
    params
  );

  if (cotisResult.cotisations_minimales_appliquees && cotisResult.avertissement_minimales) {
    avertissements.push(cotisResult.avertissement_minimales);
  }

  niveau_fiabilite = "estimation";

  // ── ACRE ─────────────────────────────────────────────────────────────────
  let REDUCTION_ACRE = 0;
  if (input.acre_active) {
    REDUCTION_ACRE = f_acre_hors_micro(
      COTISATIONS_SOCIALES_BRUTES,
      ASSIETTE_SOCIALE_BRUTE,
      params,
      input.date_creation
    );
  }

  // ── Cotisations nettes ────────────────────────────────────────────────────
  const EXONERATION_SOCIALE_ZONE = input.exoneration_sociale_zone ?? 0;
  const COTISATIONS_SOCIALES_NETTES = Math.max(
    0,
    COTISATIONS_SOCIALES_BRUTES - REDUCTION_ACRE - EXONERATION_SOCIALE_ZONE
  );

  // ── Calcul impôt ──────────────────────────────────────────────────────────
  let IR_ATTRIBUABLE_SCENARIO = 0;
  let IS_DU_SCENARIO = 0;
  let BASE_IR_SCENARIO = 0;

  if (isISMode) {
    // IS sur le résultat fiscal
    const isResult = f_is(RESULTAT_FISCAL_APRES_EXONERATIONS, params, nb_mois);
    IS_DU_SCENARIO = isResult.is_du;

    // IR sur la rémunération et les dividendes (après IS)
    BASE_IR_SCENARIO = REMUNERATION_DEDUCTIBLE; // rémunération brute imposable
    const irResult = f_ir_attribuable_scenario(
      BASE_IR_SCENARIO,
      input.autres_revenus_foyer,
      input.autres_charges_foyer,
      input.nombre_parts_fiscales,
      params,
      logger,
      input.scenario_id
    );
    IR_ATTRIBUABLE_SCENARIO = irResult.ir_attribuable_scenario;
    if (irResult.avertissement) avertissements.push(irResult.avertissement);
    if (irResult.mode === "estimation") niveau_fiabilite = "estimation";
  } else {
    // IR barème progressif
    BASE_IR_SCENARIO = RESULTAT_FISCAL_APRES_EXONERATIONS;
    if (input.autres_revenus_foyer === undefined) {
      niveau_fiabilite = "estimation";
    }
    const irResult = f_ir_attribuable_scenario(
      BASE_IR_SCENARIO,
      input.autres_revenus_foyer,
      input.autres_charges_foyer,
      input.nombre_parts_fiscales,
      params,
      logger,
      input.scenario_id
    );
    IR_ATTRIBUABLE_SCENARIO = irResult.ir_attribuable_scenario;
    if (irResult.avertissement) avertissements.push(irResult.avertissement);
  }

  // ── Indicateurs finaux ────────────────────────────────────────────────────
  const NET_AVANT_IR = isISMode
    ? REMUNERATION_DEDUCTIBLE - COTISATIONS_SOCIALES_NETTES
    : input.RECETTES_PRO_RETENUES -
      input.CHARGES_DECAISSEES -
      COTISATIONS_SOCIALES_NETTES -
      input.TVA_NETTE_DUE;

  const NET_APRES_IR = NET_AVANT_IR - IR_ATTRIBUABLE_SCENARIO;

  const COUT_TOTAL_SOCIAL_FISCAL =
    COTISATIONS_SOCIALES_NETTES + IR_ATTRIBUABLE_SCENARIO + IS_DU_SCENARIO + input.TVA_NETTE_DUE;

  const AIDE_ARCE_TRESORERIE =
    (input.droits_are_restants ?? 0) * params.aides.CFG_TAUX_ARCE;

  const SUPER_NET = NET_APRES_IR + AIDE_ARCE_TRESORERIE;

  return {
    intermediaires: {
      CA_HT_RETENU: input.RECETTES_PRO_RETENUES,
      CA_TTC_RETENU: input.RECETTES_PRO_RETENUES,
      TVA_NETTE_DUE: input.TVA_NETTE_DUE,
      RECETTES_PRO_RETENUES: input.RECETTES_PRO_RETENUES,
      ABATTEMENT_FORFAITAIRE: 0,
      RESULTAT_COMPTABLE,
      RESULTAT_FISCAL_AVANT_EXONERATIONS,
      RESULTAT_FISCAL_APRES_EXONERATIONS,
      ASSIETTE_SOCIALE_BRUTE,
      ASSIETTE_SOCIALE_APRES_AIDES: ASSIETTE_SOCIALE_BRUTE - REDUCTION_ACRE,
      COTISATIONS_SOCIALES_BRUTES,
      REDUCTION_ACRE,
      AIDE_CPAM_IMPUTEE: 0,
      EXONERATION_SOCIALE_ZONE,
      COTISATIONS_SOCIALES_NETTES,
      REMUNERATION_DEDUCTIBLE,
      REMUNERATION_NETTE_DIRIGEANT: REMUNERATION_DEDUCTIBLE,
      DIVIDENDES_DISTRIBUABLES: 0,
      DIVIDENDES_NETS_PERCUS: 0,
      BASE_IR_SCENARIO,
      BASE_IR_FOYER_TOTALE: BASE_IR_SCENARIO + (input.autres_revenus_foyer ?? 0),
      IR_THEORIQUE_FOYER: 0,
      IR_ATTRIBUABLE_SCENARIO,
      IS_DU_SCENARIO,
      NET_AVANT_IR,
      NET_APRES_IR,
      COUT_TOTAL_SOCIAL_FISCAL,
      SUPER_NET,
      AIDE_ARCE_TRESORERIE,
    },
    niveau_fiabilite,
    avertissements,
  };
}
