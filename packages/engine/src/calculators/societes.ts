/**
 * calculators/societes.ts — EURL/SASU IS et IR (C17–C20)
 *
 * Implémente les formules de ALGORITHME.md sections 5.4 et 5.5.
 *
 * EURL IS (C17) : Gérant majoritaire TNS — cotisations TNS sur rémunération
 * EURL IR (C18) : Transparence fiscale — cotisations TNS sur résultat
 * SASU IS (C19) : Président assimilé-salarié — dividendes sans cotisations
 * SASU IR (C20) : Transparence fiscale — cotisations assimilé-salarié sur résultat
 */

import type { NiveauFiabilite, IntermediairesCalcul } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import { f_assiette_sociale_ASU, f_cotisations_tns_bic, f_cotisations_tns_estimees, f_acre_hors_micro } from "./cotisations-tns.js";
import { f_cotisations_assimile_salarie } from "./cotisations-assimile.js";
import { f_ir_attribuable_scenario } from "./ir.js";
import { f_is, f_dividendes_distribuables, f_dividendes_nets_assimile } from "./is.js";
import type { EngineLogger } from "../logger.js";

type FP = typeof FiscalParamsType;

export type TypeSociete = "EURL_IS" | "EURL_IR" | "SASU_IS" | "SASU_IR";

export interface InputCalculSociete {
  scenario_id?: string;
  RECETTES_PRO_RETENUES: number;
  CHARGES_DEDUCTIBLES: number;
  DOTATIONS_AMORTISSEMENTS?: number;
  TVA_NETTE_DUE: number;
  type_societe: TypeSociete;
  remuneration_dirigeant: number;
  dividendes_envisages?: number;
  CHARGES_DECAISSEES: number;
  acre_active?: boolean;
  date_creation?: Date;
  exoneration_fiscale_zone?: number;
  autres_revenus_foyer?: number;
  autres_charges_foyer?: number;
  nombre_parts_fiscales: number;
  nb_mois_exercice?: number;
  droits_are_restants?: number;
  capital_social?: number;
}

export interface ResultatCalculSociete {
  intermediaires: Partial<IntermediairesCalcul>;
  niveau_fiabilite: NiveauFiabilite;
  avertissements: string[];
}

/**
 * Calcule un scénario EURL ou SASU (IS ou IR).
 */
export function calculerSociete(
  input: InputCalculSociete,
  params: FP,
  logger?: EngineLogger
): ResultatCalculSociete {
  const avertissements: string[] = [];
  let niveau_fiabilite: NiveauFiabilite =
    input.type_societe === "SASU_IS" || input.type_societe === "EURL_IR"
      ? "estimation"
      : "complet";

  const nb_mois = input.nb_mois_exercice ?? 12;
  const amortissements = input.DOTATIONS_AMORTISSEMENTS ?? 0;
  const isISMode = input.type_societe === "EURL_IS" || input.type_societe === "SASU_IS";

  // ── Résultat comptable ────────────────────────────────────────────────────
  let cout_total_remuneration = input.remuneration_dirigeant;
  let cotisations_patronales = 0;
  const REMUNERATION_DEDUCTIBLE = input.remuneration_dirigeant;

  let RESULTAT_COMPTABLE = isISMode
    ? input.RECETTES_PRO_RETENUES -
      input.CHARGES_DEDUCTIBLES -
      amortissements -
      REMUNERATION_DEDUCTIBLE
    : input.RECETTES_PRO_RETENUES -
      input.CHARGES_DEDUCTIBLES -
      amortissements;

  let RESULTAT_FISCAL_AVANT_EXONERATIONS = RESULTAT_COMPTABLE;

  const exo_fiscale = input.exoneration_fiscale_zone ?? 0;
  let RESULTAT_FISCAL_APRES_EXONERATIONS = Math.max(
    0,
    RESULTAT_FISCAL_AVANT_EXONERATIONS - exo_fiscale
  );

  // ── Impôt ─────────────────────────────────────────────────────────────────
  let IS_DU_SCENARIO = 0;
  let IR_ATTRIBUABLE_SCENARIO = 0;
  let DIVIDENDES_DISTRIBUABLES = 0;
  let DIVIDENDES_NETS_PERCUS = 0;
  let BASE_IR_SCENARIO = 0;

  if (isISMode) {
    // IS sur résultat fiscal
    const isResult = f_is(RESULTAT_FISCAL_APRES_EXONERATIONS, params, nb_mois);
    IS_DU_SCENARIO = isResult.is_du;

    // Dividendes distribuables après IS
    const resultat_apres_is = Math.max(
      0,
      RESULTAT_FISCAL_APRES_EXONERATIONS - IS_DU_SCENARIO
    );
    DIVIDENDES_DISTRIBUABLES = f_dividendes_distribuables(resultat_apres_is);

    // Dividendes effectivement envisagés (plafonnés au disponible)
    const dividendes_effectifs = Math.min(
      input.dividendes_envisages ?? DIVIDENDES_DISTRIBUABLES,
      DIVIDENDES_DISTRIBUABLES
    );

    if (input.type_societe === "SASU_IS") {
      // Président SASU : dividendes soumis PS uniquement (18,6 %)
      DIVIDENDES_NETS_PERCUS = f_dividendes_nets_assimile(dividendes_effectifs, params);
    } else {
      // Gérant EURL IS : dividendes hors franchise soumis cotisations TNS
      // TODO [AMBIGUÏTÉ] : CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_TNS
      // Variables concernées : CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_TNS
      // Impact : part des dividendes soumise aux cotisations TNS (franchise 10 % capital)
      // Décision requise avant de calculer exactement
      const ps_params = params.social.CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_ASSIMILE;
      // Approximation : appliquer PS 18,6 % (pire cas) + marquer fiabilité partielle
      DIVIDENDES_NETS_PERCUS = dividendes_effectifs * (1 - ps_params.taux_prelevements_sociaux_2026);
      niveau_fiabilite = "partiel";
      if (!input.capital_social) {
        avertissements.push(
          "EURL IS : la franchise de cotisations TNS sur dividendes (10 % du capital social) n'a pas pu être calculée " +
            "faute de montant de capital social. Indiquer votre capital pour affiner ce résultat."
        );
      }
    }

    // Base IR = rémunération brute + dividendes imposables
    BASE_IR_SCENARIO = REMUNERATION_DEDUCTIBLE + dividendes_effectifs;
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
    // Régime IR transparent (EURL IR / SASU IR)
    BASE_IR_SCENARIO = RESULTAT_FISCAL_APRES_EXONERATIONS;
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
  }

  // ── Cotisations sociales ──────────────────────────────────────────────────
  let COTISATIONS_SOCIALES_BRUTES = 0;
  let REMUNERATION_NETTE_DIRIGEANT = 0;
  let ASSIETTE_SOCIALE_BRUTE = 0;

  if (input.type_societe === "SASU_IS" || input.type_societe === "SASU_IR") {
    // Assimilé-salarié
    const result = f_cotisations_assimile_salarie(REMUNERATION_DEDUCTIBLE, params);
    cotisations_patronales = result.cotisations_patronales;
    cout_total_remuneration = result.cout_total_remuneration;
    COTISATIONS_SOCIALES_BRUTES = result.cotisations_salariales;
    REMUNERATION_NETTE_DIRIGEANT = result.remuneration_nette;
    ASSIETTE_SOCIALE_BRUTE = REMUNERATION_DEDUCTIBLE;
    if (isISMode) {
      RESULTAT_COMPTABLE =
        input.RECETTES_PRO_RETENUES -
        input.CHARGES_DEDUCTIBLES -
        amortissements -
        cout_total_remuneration;
    }
  } else {
    // TNS — EURL IS ou EURL IR
    const dividendesTns = isISMode ? (input.dividendes_envisages ?? 0) : 0;
    const assiette_base = isISMode
      ? REMUNERATION_DEDUCTIBLE + dividendesTns
      : RESULTAT_FISCAL_AVANT_EXONERATIONS;

    const asuResult = f_assiette_sociale_ASU(
      assiette_base,
      params,
      logger,
      input.scenario_id
    );
    ASSIETTE_SOCIALE_BRUTE = asuResult.assiette;
    if (asuResult.hypothese) {
      avertissements.push(asuResult.hypothese);
      niveau_fiabilite = "partiel";
    }

    const cotisResult = f_cotisations_tns_bic(
      ASSIETTE_SOCIALE_BRUTE,
      params,
      logger,
      input.scenario_id
    );
    COTISATIONS_SOCIALES_BRUTES = f_cotisations_tns_estimees(
      ASSIETTE_SOCIALE_BRUTE,
      params
    );
    if (cotisResult.cotisations_minimales_appliquees && cotisResult.avertissement_minimales) {
      avertissements.push(cotisResult.avertissement_minimales);
    }
    REMUNERATION_NETTE_DIRIGEANT = isISMode
      ? REMUNERATION_DEDUCTIBLE - COTISATIONS_SOCIALES_BRUTES
      : 0;
  }

  RESULTAT_FISCAL_AVANT_EXONERATIONS = RESULTAT_COMPTABLE;
  RESULTAT_FISCAL_APRES_EXONERATIONS = Math.max(
    0,
    RESULTAT_FISCAL_AVANT_EXONERATIONS - exo_fiscale
  );

  IS_DU_SCENARIO = 0;
  IR_ATTRIBUABLE_SCENARIO = 0;
  DIVIDENDES_DISTRIBUABLES = 0;
  DIVIDENDES_NETS_PERCUS = 0;
  BASE_IR_SCENARIO = 0;

  if (isISMode) {
    const isResult = f_is(RESULTAT_FISCAL_APRES_EXONERATIONS, params, nb_mois);
    IS_DU_SCENARIO = isResult.is_du;

    const resultat_apres_is = Math.max(
      0,
      RESULTAT_FISCAL_APRES_EXONERATIONS - IS_DU_SCENARIO
    );
    DIVIDENDES_DISTRIBUABLES = f_dividendes_distribuables(resultat_apres_is);
    const dividendes_effectifs = Math.min(
      input.dividendes_envisages ?? DIVIDENDES_DISTRIBUABLES,
      DIVIDENDES_DISTRIBUABLES
    );

    if (input.type_societe === "SASU_IS") {
      DIVIDENDES_NETS_PERCUS = f_dividendes_nets_assimile(dividendes_effectifs, params);
    } else {
      const ps_params = params.social.CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_ASSIMILE;
      DIVIDENDES_NETS_PERCUS = dividendes_effectifs * (1 - ps_params.taux_prelevements_sociaux_2026);
      niveau_fiabilite = "estimation";
    }

    BASE_IR_SCENARIO = REMUNERATION_DEDUCTIBLE + dividendes_effectifs;
  } else {
    BASE_IR_SCENARIO = RESULTAT_FISCAL_APRES_EXONERATIONS;
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
  if (irResult.mode === "estimation") niveau_fiabilite = "estimation";

  // ACRE
  let REDUCTION_ACRE = 0;
  if (input.acre_active) {
    if (input.type_societe === "SASU_IS" || input.type_societe === "SASU_IR") {
      // ACRE peu applicable au président SASU (cotisations sociales très différentes)
      // Approximation : réduction sur cotisations
      const acreParams = params.aides.CFG_TAUX_REDUCTION_ACRE_HORS_MICRO;
      const dateCharniere = new Date("2026-07-01");
      const taux_max =
        !input.date_creation || input.date_creation < dateCharniere
          ? acreParams.taux_max_avant_01_07_2026
          : acreParams.taux_max_apres_01_07_2026;
      REDUCTION_ACRE = COTISATIONS_SOCIALES_BRUTES * taux_max * 0.5; // demi-réduction estimée
    } else {
      REDUCTION_ACRE = f_acre_hors_micro(
        COTISATIONS_SOCIALES_BRUTES,
        ASSIETTE_SOCIALE_BRUTE,
        params,
        input.date_creation
      );
    }
  }

  const COTISATIONS_SOCIALES_NETTES = Math.max(
    0,
    COTISATIONS_SOCIALES_BRUTES - REDUCTION_ACRE
  );

  // ── Indicateurs finaux ────────────────────────────────────────────────────
  const NET_AVANT_IR = isISMode
    ? REMUNERATION_NETTE_DIRIGEANT + DIVIDENDES_NETS_PERCUS
    : input.RECETTES_PRO_RETENUES -
      input.CHARGES_DECAISSEES -
      COTISATIONS_SOCIALES_NETTES -
      input.TVA_NETTE_DUE;

  const NET_APRES_IR = NET_AVANT_IR - IR_ATTRIBUABLE_SCENARIO;

  const COUT_TOTAL_SOCIAL_FISCAL =
    COTISATIONS_SOCIALES_NETTES + IR_ATTRIBUABLE_SCENARIO + IS_DU_SCENARIO + input.TVA_NETTE_DUE;

  // ARCE is injected later only for scenarios carrying BOOST_ARCE.
  const AIDE_ARCE_TRESORERIE = 0;
  const SUPER_NET = NET_APRES_IR;

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
      EXONERATION_SOCIALE_ZONE: 0,
      COTISATIONS_SOCIALES_NETTES,
      REMUNERATION_DEDUCTIBLE,
      REMUNERATION_NETTE_DIRIGEANT,
      DIVIDENDES_DISTRIBUABLES,
      DIVIDENDES_NETS_PERCUS,
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
