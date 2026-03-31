/**
 * calculators/micro.ts — Calcul Micro-BIC / Micro-BNC (C01–C12)
 *
 * Implémente les formules décrites dans ALGORITHME.md section 5.2.
 */

import type { NiveauFiabilite, IntermediairesCalcul } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import { f_ir_attribuable_scenario } from "./ir.js";
import type { EngineLogger } from "../logger.js";

type FP = typeof FiscalParamsType;

export type TypeMicro =
  | "BIC_VENTE"
  | "BIC_SERVICE"
  | "BNC";

export interface InputCalculMicro {
  scenario_id?: string;
  CA_HT_RETENU: number;
  TVA_NETTE_DUE: number;
  type_micro: TypeMicro;
  option_vfl: boolean;
  acre_active: boolean;
  date_creation?: Date;
  exoneration_fiscale_zone?: number;
  exoneration_sociale_zone?: number;
  autres_revenus_foyer?: number;
  autres_charges_foyer?: number;
  nombre_parts_fiscales: number;
  droits_are_restants?: number;
}

export interface ResultatCalculMicro {
  intermediaires: Partial<IntermediairesCalcul>;
  niveau_fiabilite: NiveauFiabilite;
  avertissements: string[];
}

/**
 * Calcule un scénario Micro-BIC ou Micro-BNC.
 * Conforme à ALGORITHME.md section 5.2.
 */
export function calculerMicro(
  input: InputCalculMicro,
  params: FP,
  logger?: EngineLogger
): ResultatCalculMicro {
  const avertissements: string[] = [];
  let niveau_fiabilite: NiveauFiabilite = "complet";

  const CA_HT_RETENU = input.CA_HT_RETENU;

  // ── Abattement forfaitaire ─────────────────────────────────────────────────
  const taux_abattement = _getTauxAbattement(input.type_micro, params);
  const min_abattement = params.abattements.CFG_MINIMUM_ABATTEMENT_MICRO ?? 305;
  const ABATTEMENT_FORFAITAIRE = Math.max(
    CA_HT_RETENU * taux_abattement,
    min_abattement
  );
  logger?.trace(7, "Calcul micro — abattement fiscal", {
    scenario_id: input.scenario_id,
    detail: {
      CA_HT_RETENU,
      taux_abattement,
      abattement_montant: ABATTEMENT_FORFAITAIRE,
      abattement_plancher: min_abattement,
      base_ir_avant_vfl: Math.max(0, CA_HT_RETENU - ABATTEMENT_FORFAITAIRE),
    },
  });

  // ── Cotisations sociales brutes ───────────────────────────────────────────
  const taux_social = _getTauxSocialMicro(input.type_micro, params);
  const ASSIETTE_SOCIALE_BRUTE = CA_HT_RETENU;
  let COTISATIONS_SOCIALES_BRUTES = ASSIETTE_SOCIALE_BRUTE * taux_social;
  logger?.trace(7, "Calcul micro — assiette cotisations", {
    scenario_id: input.scenario_id,
    detail: {
      CA_HT_RETENU,
      taux_cotisations: taux_social,
      cotisations_brutes: COTISATIONS_SOCIALES_BRUTES,
    },
  });

  // ── Réduction ACRE ────────────────────────────────────────────────────────
  let REDUCTION_ACRE = 0;
  if (input.acre_active) {
    const acreParams = params.aides.CFG_TAUX_REDUCTION_ACRE_MICRO;
    const dateCharniere = new Date("2026-07-01");
    const taux_acre =
      !input.date_creation || input.date_creation < dateCharniere
        ? acreParams.avant_01_07_2026
        : acreParams.apres_01_07_2026;

    REDUCTION_ACRE = COTISATIONS_SOCIALES_BRUTES * taux_acre;
  }

  // ── Exonération zone ───────────────────────────────────────────────────────
  // Note : ZFRR incompatible avec micro — exoneration_zone ne doit être que QPV/ZFU
  const EXONERATION_SOCIALE_ZONE = input.exoneration_sociale_zone ?? 0;

  // ── Cotisations nettes ────────────────────────────────────────────────────
  const COTISATIONS_SOCIALES_NETTES = Math.max(
    0,
    COTISATIONS_SOCIALES_BRUTES - REDUCTION_ACRE - EXONERATION_SOCIALE_ZONE
  );

  // ── Calcul impôt ──────────────────────────────────────────────────────────
  let IR_ATTRIBUABLE_SCENARIO = 0;
  let IMPOT_SCENARIO = 0;
  let BASE_IR_SCENARIO = 0;
  const RESULTAT_FISCAL_AVANT_EXONERATIONS = Math.max(0, CA_HT_RETENU - ABATTEMENT_FORFAITAIRE);
  const RESULTAT_FISCAL_APRES_EXONERATIONS = Math.max(
    0,
    RESULTAT_FISCAL_AVANT_EXONERATIONS - (input.exoneration_fiscale_zone ?? 0)
  );

  if (input.option_vfl) {
    // Versement Libératoire — impôt calculé directement sur le CA
    const taux_vfl = _getTauxVFL(input.type_micro, params);
    IMPOT_SCENARIO = CA_HT_RETENU * taux_vfl;
    IR_ATTRIBUABLE_SCENARIO = IMPOT_SCENARIO;
    BASE_IR_SCENARIO = 0; // Hors base IR foyer
    logger?.trace(7, "Calcul micro — VFL", {
      scenario_id: input.scenario_id,
      detail: {
        option_vfl: input.option_vfl,
        taux_vfl,
        montant_vfl: IMPOT_SCENARIO,
        vfl_inclus_dans_net_avant_ir: true,
      },
    });
  } else {
    // IR barème progressif par méthode différentielle
    BASE_IR_SCENARIO = RESULTAT_FISCAL_APRES_EXONERATIONS;
    const seuilPuma = params.social.CFG_SEUIL_PUMA as unknown as {
      seuil_activite_insuffisante?: number;
      seuil_patrimoine_declencheur?: number;
    };
    const revenuActiviteEstime = CA_HT_RETENU - COTISATIONS_SOCIALES_NETTES;
    const autresRevenusPourIr =
      input.autres_revenus_foyer !== undefined &&
      revenuActiviteEstime < (seuilPuma.seuil_activite_insuffisante ?? 0) &&
      input.autres_revenus_foyer > (seuilPuma.seuil_patrimoine_declencheur ?? 0)
        ? 0
        : input.autres_revenus_foyer;
    if (autresRevenusPourIr === 0 && (input.autres_revenus_foyer ?? 0) > 0) {
      niveau_fiabilite = "estimation";
    }

    if (autresRevenusPourIr === undefined) {
      niveau_fiabilite = "estimation";
    }

    const irResult = f_ir_attribuable_scenario(
      BASE_IR_SCENARIO,
      autresRevenusPourIr,
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
  const NET_AVANT_IR = input.option_vfl
    ? CA_HT_RETENU - COTISATIONS_SOCIALES_NETTES - input.TVA_NETTE_DUE - IMPOT_SCENARIO
    : CA_HT_RETENU - COTISATIONS_SOCIALES_NETTES - input.TVA_NETTE_DUE;

  const NET_APRES_IR = input.option_vfl
    ? NET_AVANT_IR
    : NET_AVANT_IR - IR_ATTRIBUABLE_SCENARIO;

  const COUT_TOTAL_SOCIAL_FISCAL =
    COTISATIONS_SOCIALES_NETTES + IR_ATTRIBUABLE_SCENARIO + input.TVA_NETTE_DUE;

  // ARCE is injected later only when BOOST_ARCE is active on the scenario.
  const AIDE_ARCE_TRESORERIE = 0;
  const SUPER_NET = NET_APRES_IR;

  return {
    intermediaires: {
      CA_HT_RETENU,
      CA_TTC_RETENU: CA_HT_RETENU,
      TVA_COLLECTEE_THEORIQUE: 0,
      TVA_DEDUCTIBLE_RETENUE: 0,
      TVA_NETTE_DUE: input.TVA_NETTE_DUE,
      RECETTES_PRO_RETENUES: CA_HT_RETENU,
      ABATTEMENT_FORFAITAIRE,
      RESULTAT_COMPTABLE: RESULTAT_FISCAL_AVANT_EXONERATIONS,
      RESULTAT_FISCAL_AVANT_EXONERATIONS,
      RESULTAT_FISCAL_APRES_EXONERATIONS,
      ASSIETTE_SOCIALE_BRUTE,
      ASSIETTE_SOCIALE_APRES_AIDES: ASSIETTE_SOCIALE_BRUTE - REDUCTION_ACRE,
      COTISATIONS_SOCIALES_BRUTES,
      REDUCTION_ACRE,
      AIDE_CPAM_IMPUTEE: 0,
      EXONERATION_SOCIALE_ZONE,
      COTISATIONS_SOCIALES_NETTES,
      REMUNERATION_DEDUCTIBLE: 0,
      REMUNERATION_NETTE_DIRIGEANT: 0,
      DIVIDENDES_DISTRIBUABLES: 0,
      DIVIDENDES_NETS_PERCUS: 0,
      BASE_IR_SCENARIO,
      BASE_IR_FOYER_TOTALE: BASE_IR_SCENARIO + (input.autres_revenus_foyer ?? 0),
      IR_THEORIQUE_FOYER: 0,
      IR_ATTRIBUABLE_SCENARIO,
      IS_DU_SCENARIO: 0,
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function _getTauxAbattement(type: TypeMicro, params: FP): number {
  switch (type) {
    case "BIC_VENTE": return params.abattements.CFG_ABATTEMENT_MICRO_BIC_VENTE;
    case "BIC_SERVICE": return params.abattements.CFG_ABATTEMENT_MICRO_BIC_SERVICE;
    case "BNC": return params.abattements.CFG_ABATTEMENT_MICRO_BNC;
  }
}

function _getTauxSocialMicro(type: TypeMicro, params: FP): number {
  switch (type) {
    case "BIC_VENTE": return params.social.CFG_TAUX_SOCIAL_MICRO_BIC_VENTE;
    case "BIC_SERVICE": return params.social.CFG_TAUX_SOCIAL_MICRO_BIC_SERVICE;
    case "BNC": return params.social.CFG_TAUX_SOCIAL_MICRO_BNC_SSI; // SSI par défaut
  }
}

function _getTauxVFL(type: TypeMicro, params: FP): number {
  switch (type) {
    case "BIC_VENTE": return params.vfl.CFG_TAUX_VFL_MICRO_BIC_VENTE;
    case "BIC_SERVICE": return params.vfl.CFG_TAUX_VFL_MICRO_BIC_SERVICE;
    case "BNC": return params.vfl.CFG_TAUX_VFL_MICRO_BNC;
  }
}
