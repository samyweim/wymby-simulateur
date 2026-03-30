import type {
  IntermediairesCalcul,
  NiveauFiabilite,
  BaseScenarioId,
  SecteurConventionnel,
  SousSegmentActivite,
} from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import type { EngineLogger } from "../logger.js";
import { f_ir_attribuable_scenario } from "./ir.js";
import { calculerSociete } from "./societes.js";

type FP = typeof FiscalParamsType;

export interface SpecialCalculationResult {
  intermediaires: Partial<IntermediairesCalcul>;
  niveau_fiabilite: NiveauFiabilite;
  avertissements: string[];
}

interface SpecialInput {
  scenario_id: string;
  base_id: BaseScenarioId;
  recettes: number;
  charges_deductibles: number;
  charges_decaissees: number;
  amortissements?: number;
  autres_revenus_foyer?: number;
  autres_charges_foyer?: number;
  nombre_parts_fiscales: number;
  secteur_conventionnel?: SecteurConventionnel;
  sous_segment_activite?: SousSegmentActivite;
  option_raap_taux_reduit?: boolean;
  est_redevable_raap?: boolean;
  autres_revenus_activite_foyer?: number;
}

export function calculerScenarioSpecialise(
  input: SpecialInput,
  params: FP,
  logger?: EngineLogger
): SpecialCalculationResult | null {
  switch (input.base_id) {
    case "S_RSPM":
      return calculerRSPM(input, params, logger);
    case "S_MICRO_BNC_SECTEUR_1":
    case "S_MICRO_BNC_SECTEUR_2":
      return calculerMicroSante(input, params, logger);
    case "S_EI_REEL_SECTEUR_1":
      return calculerReelSanteSecteur1(input, params, logger);
    case "S_EI_REEL_SECTEUR_2_OPTAM":
      return calculerReelSanteAutreSecteur(input, params, logger, "secteur_2_optam");
    case "S_EI_REEL_SECTEUR_2_NON_OPTAM":
      return calculerReelSanteAutreSecteur(input, params, logger, "secteur_2_non_optam");
    case "S_EI_REEL_SECTEUR_3_HORS_CONVENTION":
      return calculerReelSanteAutreSecteur(input, params, logger, "hors_convention");
    case "S_SELARL_IS":
      return calculerSocieteSante(input, params, logger, "SELARL");
    case "S_SELAS_IS":
      return calculerSocieteSante(input, params, logger, "SELAS");
    case "I_LMNP_MICRO":
      return calculerLmnpMicro(input, params, logger);
    case "I_LMNP_REEL":
      return calculerLmnpReel(input, params, logger);
    case "A_BNC_MICRO":
      return calculerArtisteBncMicro(input, params, logger);
    case "A_TS_ABATTEMENT_FORFAITAIRE":
      return calculerArtisteTsForfait(input, params, logger);
    default:
      return null;
  }
}

function calculerRSPM(input: SpecialInput, params: FP, logger?: EngineLogger): SpecialCalculationResult {
  const tranches = params.social.CFG_TAUX_SOCIAL_RSPM;
  const taux =
    input.recettes <= tranches.tranche_1.a
      ? tranches.tranche_1.taux
      : tranches.tranche_2.taux;
  const cotisations = Math.round(input.recettes * taux);
  const baseIr = Math.round(input.recettes * (1 - params.abattements.CFG_ABATTEMENT_MICRO_BNC));
  const ir = f_ir_attribuable_scenario(
    baseIr,
    input.autres_revenus_foyer,
    input.autres_charges_foyer,
    input.nombre_parts_fiscales,
    params,
    logger,
    input.scenario_id
  );
  const netAvantIr = input.recettes - cotisations;
  const netApresIr = netAvantIr - ir.ir_attribuable_scenario;

  return finalize({
    recettes: input.recettes,
    chargesDecaissees: 0,
    chargesDeductibles: 0,
    amortissements: 0,
    cotisations,
    baseIr,
    ir: ir.ir_attribuable_scenario,
    is: 0,
    netAvantIr,
    netApresIr,
  });
}

function calculerMicroSante(input: SpecialInput, params: FP, logger?: EngineLogger): SpecialCalculationResult {
  const tauxBase = params.social.CFG_TAUX_SOCIAL_MICRO_BNC_SSI;
  const aide = input.base_id === "S_MICRO_BNC_SECTEUR_1"
    ? params.sante.CFG_TAUX_MALADIE_SECTEUR_1.prise_en_charge_cpam_max
    : 0;
  const cotisations = Math.round(input.recettes * (tauxBase - aide));
  const baseIr = Math.round(input.recettes * (1 - params.abattements.CFG_ABATTEMENT_MICRO_BNC));
  const ir = f_ir_attribuable_scenario(
    baseIr,
    input.autres_revenus_foyer,
    input.autres_charges_foyer,
    input.nombre_parts_fiscales,
    params,
    logger,
    input.scenario_id
  );
  const netAvantIr = input.recettes - cotisations;
  const netApresIr = netAvantIr - ir.ir_attribuable_scenario;

  return {
    ...finalize({
      recettes: input.recettes,
      chargesDecaissees: 0,
      chargesDeductibles: 0,
      amortissements: 0,
      cotisations,
    baseIr,
    ir: ir.ir_attribuable_scenario,
      is: 0,
      netAvantIr,
      netApresIr,
      aideCpam: Math.round(input.recettes * aide),
    }),
    niveau_fiabilite: "estimation",
  };
}

function calculerReelSanteSecteur1(
  input: SpecialInput,
  params: FP,
  logger?: EngineLogger
): SpecialCalculationResult {
  const deductionsGroupe3 = Math.min(
    input.recettes * params.sante.CFG_PARAM_DEDUCTION_GROUPE_III.taux_sur_honoraires_conventionnels,
    params.sante.CFG_PARAM_DEDUCTION_GROUPE_III.montant_maximum
  );
  const deductionComplementaire =
    input.recettes * params.sante.CFG_PARAM_DEDUCTION_COMPLEMENTAIRE_SANTE.taux_sur_honoraires_conventionnels;
  const resultatComptable = input.recettes - input.charges_deductibles - (input.amortissements ?? 0);
  const resultatFiscal = Math.max(0, resultatComptable - deductionsGroupe3 - deductionComplementaire);
  const assiette = resultatFiscal * (1 - params.social.CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR.abattement_forfaitaire);

  const retraiteBaseBrute = Math.min(assiette, params.sante.CFG_CARMF_2026.retraite_base.plafond_t1) *
    params.sante.CFG_CARMF_2026.retraite_base.taux_t1 +
    Math.max(0, Math.min(assiette, params.sante.CFG_CARMF_2026.retraite_base.plafond_t2) - params.sante.CFG_CARMF_2026.retraite_base.plafond_t1) *
      params.sante.CFG_CARMF_2026.retraite_base.taux_t2;
  const participationCpam = _cotisationParTranches(
    assiette,
    [
      params.sante.CFG_CARMF_2026.participation_cpam_retraite_base.tranche_1,
      params.sante.CFG_CARMF_2026.participation_cpam_retraite_base.tranche_2,
      params.sante.CFG_CARMF_2026.participation_cpam_retraite_base.tranche_3,
    ],
    "taux_cpam"
  );
  const retraiteBaseNette = Math.max(0, retraiteBaseBrute - participationCpam);
  const retraiteComplementaire =
    Math.min(assiette, params.sante.CFG_CARMF_2026.retraite_complementaire.plafond) *
    params.sante.CFG_CARMF_2026.retraite_complementaire.taux;
  const maladie = assiette * params.sante.CFG_TAUX_MALADIE_SECTEUR_1.taux_net_praticien_min;
  const ij = assiette * params.sante.CFG_REGLES_PAMC.indemnites_journalieres_taux;
  const csgCrds = assiette * 0.9825 * (params.sante.CFG_REGLES_PAMC.csg_taux + params.sante.CFG_REGLES_PAMC.crds_taux);
  const cfp = 0;
  const asv = params.sante.CFG_CARMF_2026.asv.part_forfaitaire_secteur_1_medecin +
    Math.min(assiette, params.sante.CFG_CARMF_2026.asv.plafond_assiette) *
      params.sante.CFG_CARMF_2026.asv.ajustement_taux_secteur_1_medecin;
  const cotisations = Math.round(maladie + ij + csgCrds + cfp + retraiteBaseNette + retraiteComplementaire + asv);

  logger?.trace(7, "Calcul santé — secteur 1 réel", {
    scenario_id: input.scenario_id,
    detail: {
      deductions_groupe_3: deductionsGroupe3,
      deduction_complementaire: deductionComplementaire,
      resultat_fiscal: resultatFiscal,
      assiette_sociale: assiette,
      retraite_base_nette: retraiteBaseNette,
      retraite_complementaire: retraiteComplementaire,
      asv,
      csg_crds: csgCrds,
      cfp,
      ij,
      maladie,
    },
  });

  const ir = f_ir_attribuable_scenario(
    Math.round(resultatFiscal),
    input.autres_revenus_foyer,
    input.autres_charges_foyer,
    input.nombre_parts_fiscales,
    params,
    logger,
    input.scenario_id
  );
  const netAvantIr = input.recettes - input.charges_decaissees - cotisations;
  const netApresIr = netAvantIr - ir.ir_attribuable_scenario;

  return {
    ...finalize({
      recettes: input.recettes,
      chargesDecaissees: input.charges_decaissees,
      chargesDeductibles: input.charges_deductibles,
    amortissements: input.amortissements ?? 0,
    cotisations,
    baseIr: Math.round(resultatFiscal),
      ir: ir.ir_attribuable_scenario,
      is: 0,
      netAvantIr,
      netApresIr,
      aideCpam: Math.round(participationCpam),
    }),
    niveau_fiabilite: "estimation",
  };
}

function calculerReelSanteAutreSecteur(
  input: SpecialInput,
  params: FP,
  logger: EngineLogger | undefined,
  variante: "secteur_2_optam" | "secteur_2_non_optam" | "hors_convention"
): SpecialCalculationResult {
  const deductions = _calculerDeductionsFiscalesSante(input, params, variante);
  const resultatComptable = input.recettes - input.charges_deductibles - (input.amortissements ?? 0);
  const resultatFiscal = Math.max(0, resultatComptable - deductions.total);
  const assiette = resultatFiscal * (1 - params.social.CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR.abattement_forfaitaire);

  const branches = _calculerBranchesSante({
    assiette,
    sousSegment: input.sous_segment_activite,
    variante,
    params,
  });

  logger?.trace(7, `Calcul santé — ${variante} réel`, {
    scenario_id: input.scenario_id,
    detail: {
      deductions_fiscales: deductions,
      resultat_fiscal: resultatFiscal,
      assiette_sociale: assiette,
      branches,
    },
  });

  const ir = f_ir_attribuable_scenario(
    Math.round(resultatFiscal),
    input.autres_revenus_foyer,
    input.autres_charges_foyer,
    input.nombre_parts_fiscales,
    params,
    logger,
    input.scenario_id
  );

  const cotisations = Math.round(
    branches.maladie +
      branches.ij +
      branches.csgCrds +
      branches.retraiteBase +
      branches.retraiteComplementaire +
      branches.invaliditeDeces +
      branches.asv +
      branches.curps
  );
  const netAvantIr = input.recettes - input.charges_decaissees - cotisations;
  const netApresIr = netAvantIr - ir.ir_attribuable_scenario;

  const avertissements = [
    "SIMULATION_SANTE_PAMC_ESTIMATIVE",
    "VENTILATION_HONORAIRES_CONVENTIONNES_ET_DEPASSEMENTS_NON_COLLECTEE",
  ];
  if (branches.avertissementInvalidite) avertissements.push(branches.avertissementInvalidite);
  if (variante !== "hors_convention") {
    avertissements.push("AIDE_CPAM_MALADIE_CALCULEE_SUR_ASSIETTE_GLOBALE_FAUTE_DE_VENTILATION");
  }

  return {
    ...finalize({
      recettes: input.recettes,
      chargesDecaissees: input.charges_decaissees,
      chargesDeductibles: input.charges_deductibles,
      amortissements: input.amortissements ?? 0,
      cotisations,
      baseIr: Math.round(resultatFiscal),
      ir: ir.ir_attribuable_scenario,
      is: 0,
      netAvantIr,
      netApresIr,
      aideCpam: Math.round(branches.aideCpam),
    }),
    niveau_fiabilite: "estimation",
    avertissements,
  };
}

function calculerSocieteSante(
  input: SpecialInput,
  params: FP,
  logger: EngineLogger | undefined,
  type: "SELARL" | "SELAS"
): SpecialCalculationResult {
  const societe = calculerSociete(
    {
      scenario_id: input.scenario_id,
      RECETTES_PRO_RETENUES: input.recettes,
      CHARGES_DEDUCTIBLES: input.charges_deductibles,
      CHARGES_DECAISSEES: input.charges_decaissees,
      DOTATIONS_AMORTISSEMENTS: input.amortissements,
      TVA_NETTE_DUE: 0,
      type_societe: type === "SELARL" ? "EURL_IS" : "SASU_IS",
      remuneration_dirigeant: Math.max(0, input.recettes - input.charges_deductibles - (input.amortissements ?? 0)) * 0.5,
      dividendes_envisages: 0,
      acre_active: false,
      autres_revenus_foyer: input.autres_revenus_foyer,
      autres_charges_foyer: input.autres_charges_foyer,
      nombre_parts_fiscales: input.nombre_parts_fiscales,
    },
    params,
    logger
  );

  societe.niveau_fiabilite = "estimation";
  societe.avertissements.push(
    "SIMULATION_SOCIETE_SANTE_BASEE_SUR_MODELE_SOCIETE_GENERALISTE",
    "COTISATIONS_ORDINALES_CPAM_ASV_SPECIFIQUES_NON_INTEGREES_DANS_ARBITRAGE_SOCIETE_SANTE"
  );

  return societe;
}

function calculerLmnpMicro(input: SpecialInput, params: FP, logger?: EngineLogger): SpecialCalculationResult {
  const baseIr = Math.round(
    input.recettes * (1 - params.abattements.CFG_ABATTEMENT_MICRO_LMNP_CLASSIQUE)
  );
  const cotisations = Math.round(
    baseIr * params.fiscal.CFG_PRELEVEMENTS_SOCIAUX_CAPITAL.taux_17_2_pct.taux
  );
  const ir = f_ir_attribuable_scenario(
    baseIr,
    input.autres_revenus_foyer,
    input.autres_charges_foyer,
    input.nombre_parts_fiscales,
    params,
    logger,
    input.scenario_id
  );
  const netAvantIr = input.recettes - cotisations;
  const netApresIr = netAvantIr - ir.ir_attribuable_scenario;
  const avertissements = input.autres_revenus_foyer !== undefined
    ? ["IR_CALCUL_DIFFERENTIEL_AUTRES_REVENUS_FOYER"]
    : [];

  return {
    ...finalize({
      recettes: input.recettes,
      chargesDecaissees: 0,
      chargesDeductibles: 0,
      amortissements: 0,
      cotisations,
      baseIr,
      ir: ir.ir_attribuable_scenario,
      is: 0,
      netAvantIr,
      netApresIr,
    }),
    avertissements,
  };
}

function calculerLmnpReel(input: SpecialInput, params: FP, logger?: EngineLogger): SpecialCalculationResult {
  const resultatHorsAmort = input.recettes - input.charges_deductibles;
  const amortDeductible = Math.min(input.amortissements ?? 0, Math.max(0, resultatHorsAmort));
  const amortDiffere = Math.max(0, (input.amortissements ?? 0) - amortDeductible);
  const baseIr = Math.max(0, Math.round(resultatHorsAmort - amortDeductible));
  const cotisations = Math.round(
    baseIr * params.fiscal.CFG_PRELEVEMENTS_SOCIAUX_CAPITAL.taux_17_2_pct.taux
  );
  const ir = f_ir_attribuable_scenario(
    baseIr,
    input.autres_revenus_foyer,
    input.autres_charges_foyer,
    input.nombre_parts_fiscales,
    params,
    logger,
    input.scenario_id
  );
  const netAvantIr = input.recettes - input.charges_decaissees - cotisations;
  const netApresIr = netAvantIr - ir.ir_attribuable_scenario;
  const avertissements = amortDiffere > 0 ? [`AMORTISSEMENTS_DIFFERES_ARD_${Math.round(amortDiffere)}`] : [];

  return {
    ...finalize({
      recettes: input.recettes,
      chargesDecaissees: input.charges_decaissees,
      chargesDeductibles: input.charges_deductibles,
      amortissements: amortDeductible,
      cotisations,
      baseIr,
      ir: ir.ir_attribuable_scenario,
      is: 0,
      netAvantIr,
      netApresIr,
    }),
    avertissements,
  };
}

function calculerArtisteBncMicro(input: SpecialInput, params: FP, logger?: EngineLogger): SpecialCalculationResult {
  const baseIr = Math.round(input.recettes * (1 - params.abattements.CFG_ABATTEMENT_MICRO_BNC));
  const assietteSociale = baseIr * 1.15;
  const cotisationsHorsRaap = Math.round(assietteSociale * 0.16);
  const raap = input.est_redevable_raap
    ? Math.round(
        assietteSociale *
          (input.option_raap_taux_reduit
            ? params.culture.CFG_TAUX_RAAP_REDUIT
            : params.culture.CFG_TAUX_RAAP_NORMAL)
      )
    : 0;
  const cotisations = cotisationsHorsRaap + raap;
  const ir = f_ir_attribuable_scenario(
    baseIr,
    input.autres_revenus_foyer,
    input.autres_charges_foyer,
    input.nombre_parts_fiscales,
    params,
    logger,
    input.scenario_id
  );
  const netAvantIr = input.recettes - cotisations;
  const netApresIr = netAvantIr - ir.ir_attribuable_scenario;

  return {
    ...finalize({
      recettes: input.recettes,
      chargesDecaissees: 0,
      chargesDeductibles: 0,
    amortissements: 0,
    cotisations,
    baseIr,
      ir: ir.ir_attribuable_scenario,
      is: 0,
      netAvantIr,
      netApresIr,
    }),
    niveau_fiabilite: "estimation",
  };
}

function calculerArtisteTsForfait(input: SpecialInput, params: FP, logger?: EngineLogger): SpecialCalculationResult {
  const assietteSociale = input.recettes * 0.9825;
  const vieillesse = Math.round(
    Math.min(assietteSociale, params.referentiels.CFG_PASS_2026) *
      params.culture.CFG_TAUX_COTISATIONS_ARTISTE_AUTEUR.vieillesse_plafonnee.taux_net_auteur
  );
  const csg = Math.round(assietteSociale * params.culture.CFG_TAUX_COTISATIONS_ARTISTE_AUTEUR.csg.taux);
  const crds = Math.round(assietteSociale * params.culture.CFG_TAUX_COTISATIONS_ARTISTE_AUTEUR.crds.taux);
  const cfp = Math.round(assietteSociale * params.culture.CFG_TAUX_COTISATIONS_ARTISTE_AUTEUR.cfp.taux);
  const raap = Math.round(
    assietteSociale *
      (input.option_raap_taux_reduit
        ? params.culture.CFG_TAUX_RAAP_REDUIT
        : params.culture.CFG_TAUX_RAAP_NORMAL)
  );
  const cotisations = vieillesse + csg + crds + cfp + raap;
  const baseIr = Math.round(
    input.recettes * (1 - params.abattements.CFG_ABATTEMENT_TS_FORFAITAIRE_ARTISTE_AUTEUR)
  );
  const ir = f_ir_attribuable_scenario(
    baseIr,
    input.autres_revenus_foyer,
    input.autres_charges_foyer,
    input.nombre_parts_fiscales,
    params,
    logger,
    input.scenario_id
  );
  const netAvantIr = input.recettes - cotisations;
  const netApresIr = netAvantIr - ir.ir_attribuable_scenario;

  return {
    ...finalize({
      recettes: input.recettes,
      chargesDecaissees: 0,
      chargesDeductibles: 0,
    amortissements: 0,
    cotisations,
    baseIr,
      ir: ir.ir_attribuable_scenario,
      is: 0,
      netAvantIr,
      netApresIr,
    }),
    niveau_fiabilite: "estimation",
  };
}

function finalize(input: {
  recettes: number;
  chargesDecaissees: number;
  chargesDeductibles: number;
  amortissements: number;
  cotisations: number;
  baseIr: number;
  ir: number;
  is: number;
  netAvantIr: number;
  netApresIr: number;
  aideCpam?: number;
}): SpecialCalculationResult {
  return {
    intermediaires: {
      CA_HT_RETENU: input.recettes,
      CA_TTC_RETENU: input.recettes,
      TVA_COLLECTEE_THEORIQUE: 0,
      TVA_DEDUCTIBLE_RETENUE: 0,
      TVA_NETTE_DUE: 0,
      RECETTES_PRO_RETENUES: input.recettes,
      ABATTEMENT_FORFAITAIRE: Math.max(0, input.recettes - input.baseIr),
      RESULTAT_COMPTABLE: input.recettes - input.chargesDeductibles - input.amortissements,
      RESULTAT_FISCAL_AVANT_EXONERATIONS: input.baseIr,
      RESULTAT_FISCAL_APRES_EXONERATIONS: input.baseIr,
      ASSIETTE_SOCIALE_BRUTE: input.baseIr,
      ASSIETTE_SOCIALE_APRES_AIDES: input.baseIr,
      COTISATIONS_SOCIALES_BRUTES: input.cotisations,
      REDUCTION_ACRE: 0,
      AIDE_CPAM_IMPUTEE: input.aideCpam ?? 0,
      EXONERATION_SOCIALE_ZONE: 0,
      COTISATIONS_SOCIALES_NETTES: input.cotisations,
      REMUNERATION_DEDUCTIBLE: 0,
      REMUNERATION_NETTE_DIRIGEANT: 0,
      DIVIDENDES_DISTRIBUABLES: 0,
      DIVIDENDES_NETS_PERCUS: 0,
      BASE_IR_SCENARIO: input.baseIr,
      BASE_IR_FOYER_TOTALE: input.baseIr,
      IR_THEORIQUE_FOYER: input.ir,
      IR_ATTRIBUABLE_SCENARIO: input.ir,
      IS_DU_SCENARIO: input.is,
      NET_AVANT_IR: input.netAvantIr,
      NET_APRES_IR: input.netApresIr,
      COUT_TOTAL_SOCIAL_FISCAL: input.cotisations + input.ir + input.is,
      SUPER_NET: input.netApresIr,
      AIDE_ARCE_TRESORERIE: 0,
    },
    niveau_fiabilite: "complet",
    avertissements: [],
  };
}

function _calculerDeductionsFiscalesSante(
  input: SpecialInput,
  params: FP,
  variante: "secteur_1" | "secteur_2_optam" | "secteur_2_non_optam" | "hors_convention"
): {
  deductionGroupe3: number;
  deductionComplementaire: number;
  total: number;
} {
  const deductionGroupe3 =
    variante === "secteur_1"
      ? Math.min(
          input.recettes * params.sante.CFG_PARAM_DEDUCTION_GROUPE_III.taux_sur_honoraires_conventionnels,
          params.sante.CFG_PARAM_DEDUCTION_GROUPE_III.montant_maximum
        )
      : 0;

  const deductionComplementaire =
    variante === "secteur_1" || variante === "secteur_2_optam"
      ? input.recettes * params.sante.CFG_PARAM_DEDUCTION_COMPLEMENTAIRE_SANTE.taux_sur_honoraires_conventionnels
      : 0;

  return {
    deductionGroupe3,
    deductionComplementaire,
    total: deductionGroupe3 + deductionComplementaire,
  };
}

function _calculerBranchesSante(input: {
  assiette: number;
  sousSegment?: SousSegmentActivite;
  variante: "secteur_2_optam" | "secteur_2_non_optam" | "hors_convention";
  params: FP;
}): {
  maladie: number;
  aideCpam: number;
  retraiteBase: number;
  retraiteComplementaire: number;
  invaliditeDeces: number;
  asv: number;
  curps: number;
  ij: number;
  csgCrds: number;
  avertissementInvalidite?: string;
} {
  const isMedecin = input.sousSegment === "medecin" || input.sousSegment === undefined;
  const ij = input.assiette * input.params.sante.CFG_REGLES_PAMC.indemnites_journalieres_taux;
  const csgCrds =
    input.assiette *
    0.9825 *
    (input.params.sante.CFG_REGLES_PAMC.csg_taux + input.params.sante.CFG_REGLES_PAMC.crds_taux);

  const maladieInfo = _calculerMaladieSante(input.assiette, input.params, input.variante);

  if (isMedecin) {
    const carmf = input.params.sante.CFG_CARMF_2026;
    const retraiteBaseBrute =
      Math.min(input.assiette, carmf.retraite_base.plafond_t1) * carmf.retraite_base.taux_t1 +
      Math.max(0, Math.min(input.assiette, carmf.retraite_base.plafond_t2) - carmf.retraite_base.plafond_t1) *
        carmf.retraite_base.taux_t2;
    const retraiteBase = Math.max(0, retraiteBaseBrute);
    const retraiteComplementaire =
      Math.min(input.assiette, carmf.retraite_complementaire.plafond) * carmf.retraite_complementaire.taux;

    let invaliditeDeces: number = carmf.invalidite_deces.montant_minimum;
    let avertissementInvalidite: string | undefined;
    if (input.assiette >= carmf.invalidite_deces.tranche_maximum) {
      invaliditeDeces = carmf.invalidite_deces.montant_maximum;
    } else if (input.assiette > carmf.invalidite_deces.tranche_minimum) {
      const ratio =
        (input.assiette - carmf.invalidite_deces.tranche_minimum) /
        (carmf.invalidite_deces.tranche_maximum - carmf.invalidite_deces.tranche_minimum);
      invaliditeDeces =
        carmf.invalidite_deces.montant_minimum +
        ratio * (carmf.invalidite_deces.montant_maximum - carmf.invalidite_deces.montant_minimum);
      avertissementInvalidite = "INVALIDITE_DECES_CARMF_INTERPOLEE_A_PARTIR_DU_BAREME";
    }

    const asv =
      input.variante === "hors_convention"
        ? 0
        : input.variante === "secteur_2_optam" || input.variante === "secteur_2_non_optam"
          ? carmf.asv.part_forfaitaire_secteur_2_medecin +
            Math.min(input.assiette, carmf.asv.plafond_assiette) * carmf.asv.ajustement_taux_secteur_2_medecin
          : 0;

    const curps = Math.min(
      input.assiette * input.params.sante.CFG_CURPS.medecins.taux,
      input.params.sante.CFG_CURPS.medecins.plafond_annuel
    );

    return {
      maladie: maladieInfo.maladie,
      aideCpam: maladieInfo.aideCpam,
      retraiteBase,
      retraiteComplementaire,
      invaliditeDeces,
      asv,
      curps,
      ij,
      csgCrds,
      avertissementInvalidite,
    };
  }

  const carpimko = input.params.sante.CFG_CARPIMKO_2026;
  const pass = input.params.referentiels.CFG_PASS_2026;
  const retraiteBase =
    Math.min(input.assiette, carpimko.retraite_base.plafond_t1) * carpimko.retraite_base.taux_t1 +
    Math.max(0, Math.min(input.assiette, carpimko.retraite_base.plafond_t2) - carpimko.retraite_base.plafond_t1) *
      carpimko.retraite_base.taux_t2;
  const retraiteComplementaire =
    input.assiette <= carpimko.retraite_complementaire.assiette_min_pass * pass
      ? carpimko.retraite_complementaire.montant_min_2026
      : input.assiette >= carpimko.retraite_complementaire.assiette_max_pass * pass
        ? carpimko.retraite_complementaire.montant_max_2026
        : input.assiette * carpimko.retraite_complementaire.taux;
  const asv =
    input.variante === "hors_convention"
      ? 0
      : carpimko.asv.part_adherent +
        input.assiette * carpimko.asv.taux_proportionnel;
  const curps = Math.min(
    input.assiette * input.params.sante.CFG_CURPS.auxiliaires_medicaux.taux,
    input.params.sante.CFG_CURPS.auxiliaires_medicaux.plafond_annuel
  );

  return {
    maladie: maladieInfo.maladie,
    aideCpam: maladieInfo.aideCpam,
    retraiteBase,
    retraiteComplementaire,
    invaliditeDeces: carpimko.invalidite_deces.montant_forfaitaire,
    asv,
    curps,
    ij,
    csgCrds,
  };
}

function _calculerMaladieSante(
  assiette: number,
  params: FP,
  variante: "secteur_2_optam" | "secteur_2_non_optam" | "hors_convention"
): { maladie: number; aideCpam: number } {
  if (variante === "secteur_2_optam") {
    const tauxBrut = params.sante.CFG_TAUX_MALADIE_SECTEUR_2_OPTAM.taux_brut_max_assiette_cpam;
    const aideCpam = assiette * params.sante.CFG_TAUX_MALADIE_SECTEUR_2_OPTAM.prise_en_charge_cpam_max;
    return {
      maladie: assiette * tauxBrut - aideCpam,
      aideCpam,
    };
  }

  if (variante === "secteur_2_non_optam") {
    return {
      maladie: assiette * params.sante.CFG_TAUX_MALADIE_SECTEUR_2_NON_OPTAM.taux_brut_max,
      aideCpam: 0,
    };
  }

  return {
    maladie: assiette * params.sante.CFG_TAUX_MALADIE_HORS_CONVENTION.taux_effectif_total,
    aideCpam: 0,
  };
}

function _cotisationParTranches(
  assiette: number,
  tranches: Array<{ de: number; a: number | null; [key: string]: number | null }>,
  key: string
): number {
  let total = 0;
  for (const tranche of tranches) {
    const taux = Number(tranche[key] ?? 0);
    if (assiette <= tranche.de) break;
    const upper = tranche.a ?? Infinity;
    total += (Math.min(assiette, upper) - tranche.de) * taux;
  }
  return total;
}
