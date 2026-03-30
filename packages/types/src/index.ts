/**
 * @wymby/types — Interfaces partagées du moteur fiscal WYMBY 2026
 *
 * Ce fichier définit l'intégralité des types TypeScript utilisés
 * par les packages engine, config et les applications consommatrices.
 *
 * Aucune valeur numérique ne figure ici — uniquement des définitions de types.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES DE BASE RÉUTILISÉS
// ─────────────────────────────────────────────────────────────────────────────

export type NiveauFiabilite = "complet" | "partiel" | "estimation";
export type NiveauCertitude = "certain" | "estimé" | "faible";
export type LogLevel = "info" | "debug" | "trace" | "warn" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS / UNIONS MÉTIER
// ─────────────────────────────────────────────────────────────────────────────

export type SegmentActivite =
  | "generaliste"
  | "sante"
  | "artiste_auteur"
  | "immobilier";

export type SousSegmentActivite =
  | "achat_revente"
  | "prestation"
  | "liberal"
  | "medecin"
  | "paramedical"
  | "artiste_auteur"
  | "lmnp"
  | "lmp";

export type FormeJuridique =
  | "EI"
  | "EURL"
  | "SASU"
  | "SELARL"
  | "SELAS"
  | "non_decide"
  | "autre";

export type RegimeFiscalEnvisage =
  | "micro"
  | "reel"
  | "IR"
  | "IS"
  | "TS"
  | "non_decide"
  | "autre";

export type InputModeCA = "HT" | "TTC";

export type SituationFamiliale =
  | "celibataire"
  | "marie"
  | "pacse"
  | "autre";

export type RegimeTVA =
  | "franchise"
  | "reel_simplifie"
  | "reel_normal"
  | "inconnu";

export type SecteurConventionnel =
  | "secteur_1"
  | "secteur_2"
  | "secteur_2_optam"
  | "secteur_2_non_optam"
  | "secteur_3"
  | "hors_convention";

export type ModeDeclarationArtisteAuteur = "BNC" | "TS";

export type TypeLocationMeublee =
  | "longue_duree"
  | "tourisme_classe"
  | "tourisme_non_classe"
  | "chambre_hotes"
  | "autre";

export type OptionExonerationZone =
  | "ZFRR"
  | "ZFRR_PLUS"
  | "QPV"
  | "ZFU_stock"
  | "aucune";

// ─────────────────────────────────────────────────────────────────────────────
// IDENTIFIANTS DE SCÉNARIOS
// ─────────────────────────────────────────────────────────────────────────────

export type BaseScenarioId =
  // Généralistes
  | "G_MBIC_VENTE"
  | "G_MBIC_SERVICE"
  | "G_MBNC"
  | "G_EI_REEL_BIC_IR"
  | "G_EI_REEL_BIC_IS"
  | "G_EI_REEL_BNC_IR"
  | "G_EI_REEL_BNC_IS"
  | "G_EURL_IS"
  | "G_EURL_IR"
  | "G_SASU_IS"
  | "G_SASU_IR"
  // Santé
  | "S_RSPM"
  | "S_MICRO_BNC_SECTEUR_1"
  | "S_MICRO_BNC_SECTEUR_2"
  | "S_EI_REEL_SECTEUR_1"
  | "S_EI_REEL_SECTEUR_2_OPTAM"
  | "S_EI_REEL_SECTEUR_2_NON_OPTAM"
  | "S_EI_REEL_SECTEUR_3_HORS_CONVENTION"
  | "S_SELARL_IS"
  | "S_SELAS_IS"
  // Artistes-auteurs
  | "A_BNC_MICRO"
  | "A_BNC_MICRO_TVA_FRANCHISE"
  | "A_BNC_MICRO_TVA_COLLECTEE"
  | "A_BNC_REEL"
  | "A_TS_ABATTEMENT_FORFAITAIRE"
  | "A_TS_FRAIS_REELS"
  // Immobilier
  | "I_LMNP_MICRO"
  | "I_LMNP_REEL"
  | "I_LMP";

export type BoosterId =
  | "BOOST_ACRE"
  | "BOOST_ARCE"
  | "BOOST_ZFRR"
  | "BOOST_ZFRR_PLUS"
  | "BOOST_QPV"
  | "BOOST_ZFU_STOCK"
  | "BOOST_ZIP_ZAC"
  | "BOOST_CPAM"
  | "BOOST_RAAP_REDUIT";

export type OptionTVA = "TVA_FRANCHISE" | "TVA_COLLECTEE";
export type OptionVFL = "VFL_OUI" | "VFL_NON";

/** Identifiant complet d'un scénario incluant les options et boosters */
export type ScenarioId = string;

// ─────────────────────────────────────────────────────────────────────────────
// ENTRÉES UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────

export interface UserInputProfil {
  ANNEE_SIMULATION: number;
  SEGMENT_ACTIVITE: SegmentActivite;
  SOUS_SEGMENT_ACTIVITE?: SousSegmentActivite;
  PROFESSION_EXACTE?: string;
  FORME_JURIDIQUE_ENVISAGEE?: FormeJuridique;
  REGIME_FISCAL_ENVISAGE?: RegimeFiscalEnvisage;
}

export interface UserInputActivite {
  INPUT_MODE_CA: InputModeCA;
  CA_ENCAISSE_UTILISATEUR: number;
  TVA_COLLECTEE_UTILISATEUR?: number;
  TVA_DEDUCTIBLE_UTILISATEUR?: number;
  AUTRES_RECETTES_PRO?: number;
  CHARGES_DECAISSEES?: number;
  CHARGES_DEDUCTIBLES?: number;
  CHARGES_NON_DEDUCTIBLES?: number;
  DOTATIONS_AMORTISSEMENTS?: number;
  REMUNERATION_DIRIGEANT_ENVISAGEE?: number;
  DIVIDENDES_ENVISAGES?: number;
  LOYERS_MEUBLES?: number;
  FRAIS_REELS_TS?: number;
}

export interface UserInputFoyer {
  SITUATION_FAMILIALE: SituationFamiliale;
  NOMBRE_PARTS_FISCALES?: number;
  NOMBRE_ENFANTS_A_CHARGE?: number;
  AUTRES_REVENUS_FOYER_IMPOSABLES?: number;
  AUTRES_CHARGES_DEDUCTIBLES_FOYER?: number;
  RFR_N_2_UTILISATEUR?: number;
  OPTION_VFL_DEMANDEE?: boolean;
}

export interface UserInputTVA {
  TVA_DEJA_APPLICABLE?: boolean;
  REGIME_TVA_SOUHAITE?: RegimeTVA;
  DATE_DEPASSEMENT_TVA_DECLARATIVE?: string;
}

export interface UserInputTemporalite {
  DATE_CREATION_ACTIVITE?: string;
  DATE_DEBUT_EXERCICE?: string;
  DATE_FIN_EXERCICE?: string;
  ANCIENNETE_ACTIVITE?: number;
  CHANGEMENT_REGIME_EN_COURS_D_ANNEE?: boolean;
  DATE_CHANGEMENT_REGIME?: string;
  OPTION_IR_TEMPORAIRE_ACTIVE?: boolean;
  ANNEE_OPTION_IR?: number;
}

export interface UserInputSante {
  EST_PROFESSION_SANTE?: boolean;
  EST_CONVENTIONNE?: boolean;
  SECTEUR_CONVENTIONNEL?: SecteurConventionnel;
  EST_ELIGIBLE_AIDE_CPAM?: boolean;
  EST_ELIGIBLE_ZIP_ZAC?: boolean;
  AIDE_INSTALLATION_SANTE_DEMANDEE?: boolean;
}

export interface UserInputArtisteAuteur {
  EST_ARTISTE_AUTEUR?: boolean;
  MODE_DECLARATION_ARTISTE_AUTEUR?: ModeDeclarationArtisteAuteur;
  OPTION_FRAIS_REELS_TS?: boolean;
  EST_REDEVABLE_RAAP?: boolean;
  OPTION_RAAP_TAUX_REDUIT?: boolean;
}

export interface UserInputImmobilier {
  TYPE_LOCATION_MEUBLEE?: TypeLocationMeublee;
  EST_LMNP?: boolean;
  EST_LMP?: boolean;
  RECETTES_LOCATION_MEUBLEE?: number;
  AUTRES_REVENUS_ACTIVITE_FOYER?: number;
}

export interface UserInputAides {
  EST_CREATEUR_REPRENEUR?: boolean;
  ACRE_DEMANDEE?: boolean;
  EST_ELIGIBLE_ACRE_DECLARATIF?: boolean;
  ARCE_DEMANDEE?: boolean;
  EST_BENEFICIAIRE_ARE?: boolean;
  DROITS_ARE_RESTANTS?: number;
  LOCALISATION_COMMUNE?: string;
  LOCALISATION_CODE_POSTAL?: string;
  EST_IMPLANTE_EN_ZFRR?: boolean;
  EST_IMPLANTE_EN_ZFRR_PLUS?: boolean;
  EST_IMPLANTE_EN_QPV?: boolean;
  EST_IMPLANTE_EN_ANCIENNE_ZFU_OUVRANT_DROITS?: boolean;
  EFFECTIF_ENTREPRISE?: number;
  TOTAL_BILAN?: number;
  PART_CA_REALISEE_EN_ZONE?: number;
  OPTION_EXONERATION_ZONE_CHOISIE?: OptionExonerationZone;
}

export interface UserInputQualite {
  NIVEAU_CERTITUDE_CA?: NiveauCertitude;
  NIVEAU_CERTITUDE_CHARGES?: NiveauCertitude;
  NIVEAU_CERTITUDE_FOYER?: NiveauCertitude;
  NIVEAU_CERTITUDE_AIDES?: NiveauCertitude;
  DONNEES_INCOMPLETES?: boolean;
}

/** Entrée complète utilisateur */
export interface UserInput
  extends UserInputProfil,
    UserInputActivite,
    UserInputFoyer,
    UserInputTVA,
    UserInputTemporalite,
    UserInputSante,
    UserInputArtisteAuteur,
    UserInputImmobilier,
    UserInputAides,
    UserInputQualite {}

// ─────────────────────────────────────────────────────────────────────────────
// FLAGS LOGIQUES (QUALIFICATION)
// ─────────────────────────────────────────────────────────────────────────────

export interface QualificationFlags {
  FLAG_CA_SAISI_EN_TTC: boolean;
  FLAG_TVA_APPLICABLE: boolean;
  FLAG_DEPASSEMENT_SEUIL_MICRO: boolean;
  FLAG_DEPASSEMENT_SEUIL_TVA: boolean;
  FLAG_VFL_POSSIBLE: boolean;
  FLAG_VFL_INTERDIT: boolean;
  FLAG_MICRO_BIC_VENTE_POSSIBLE: boolean;
  FLAG_MICRO_BIC_SERVICE_POSSIBLE: boolean;
  FLAG_MICRO_BNC_POSSIBLE: boolean;
  FLAG_EI_REEL_BIC_IR_POSSIBLE: boolean;
  FLAG_EI_REEL_BIC_IS_POSSIBLE: boolean;
  FLAG_EI_REEL_BNC_IR_POSSIBLE: boolean;
  FLAG_EI_REEL_BNC_IS_POSSIBLE: boolean;
  FLAG_EURL_IS_POSSIBLE: boolean;
  FLAG_EURL_IR_POSSIBLE: boolean;
  FLAG_SASU_IS_POSSIBLE: boolean;
  FLAG_SASU_IR_POSSIBLE: boolean;
  FLAG_RSPM_POSSIBLE: boolean;
  FLAG_SANTE_MICRO_POSSIBLE: boolean;
  FLAG_SANTE_REEL_POSSIBLE: boolean;
  FLAG_AIDE_CPAM_POSSIBLE: boolean;
  FLAG_ARTISTE_AUTEUR_BNC_MICRO_POSSIBLE: boolean;
  FLAG_ARTISTE_AUTEUR_TS_POSSIBLE: boolean;
  FLAG_RAAP_APPLICABLE: boolean;
  FLAG_LMNP_MICRO_POSSIBLE: boolean;
  FLAG_LMP_POSSIBLE: boolean;
  FLAG_ACRE_POSSIBLE: boolean;
  FLAG_ARCE_POSSIBLE: boolean;
  FLAG_ZFRR_POSSIBLE: boolean;
  FLAG_ZFRR_PLUS_POSSIBLE: boolean;
  FLAG_QPV_POSSIBLE: boolean;
  FLAG_ZFU_STOCK_DROITS_POSSIBLE: boolean;
  FLAG_TAXE_PUMA_APPLICABLE: boolean;
  FLAG_DONNEES_A_COMPLETER: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIABLES INTERMÉDIAIRES DE CALCUL
// ─────────────────────────────────────────────────────────────────────────────

export interface IntermediairesCalcul {
  CA_HT_RETENU: number;
  CA_TTC_RETENU: number;
  TVA_COLLECTEE_THEORIQUE: number;
  TVA_DEDUCTIBLE_RETENUE: number;
  TVA_NETTE_DUE: number;
  RECETTES_PRO_RETENUES: number;
  ABATTEMENT_FORFAITAIRE: number;
  RESULTAT_COMPTABLE: number;
  RESULTAT_FISCAL_AVANT_EXONERATIONS: number;
  RESULTAT_FISCAL_APRES_EXONERATIONS: number;
  ASSIETTE_SOCIALE_BRUTE: number;
  ASSIETTE_SOCIALE_APRES_AIDES: number;
  COTISATIONS_SOCIALES_BRUTES: number;
  REDUCTION_ACRE: number;
  AIDE_CPAM_IMPUTEE: number;
  EXONERATION_SOCIALE_ZONE: number;
  COTISATIONS_SOCIALES_NETTES: number;
  REMUNERATION_DEDUCTIBLE: number;
  REMUNERATION_NETTE_DIRIGEANT: number;
  DIVIDENDES_DISTRIBUABLES: number;
  DIVIDENDES_NETS_PERCUS: number;
  BASE_IR_SCENARIO: number;
  BASE_IR_FOYER_TOTALE: number;
  IR_THEORIQUE_FOYER: number;
  IR_ATTRIBUABLE_SCENARIO: number;
  IS_DU_SCENARIO: number;
  NET_AVANT_IR: number;
  NET_APRES_IR: number;
  COUT_TOTAL_SOCIAL_FISCAL: number;
  SUPER_NET: number;
  AIDE_ARCE_TRESORERIE: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCÉNARIO CANDIDAT
// ─────────────────────────────────────────────────────────────────────────────

export interface ScenarioCandidat {
  scenario_id: ScenarioId;
  base_id: BaseScenarioId;
  option_tva: OptionTVA;
  option_vfl: OptionVFL;
  boosters_actifs: BoosterId[];
  options_supplementaires: string[];
  motif_admission: string;
}

export interface ScenarioExclu {
  scenario_id: ScenarioId;
  base_id: BaseScenarioId;
  motifs_exclusion: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL DE CALCUL PAR SCÉNARIO
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoresScenario {
  SCORE_COMPLEXITE_ADMIN: number;
  SCORE_ROBUSTESSE: number;
  DEPENDANCE_AIDES_RATIO: number;
  SCORE_GLOBAL_SCENARIO: number;
  TAUX_PRELEVEMENTS_GLOBAL: number;
}

export interface DetailCalculScenario {
  scenario_id: ScenarioId;
  base_id: BaseScenarioId;
  option_tva: OptionTVA;
  option_vfl: OptionVFL;
  boosters_actifs: BoosterId[];
  intermediaires: IntermediairesCalcul;
  scores: ScoresScenario;
  niveau_fiabilite: NiveauFiabilite;
  avertissements_scenario: string[];
  explication?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARAISON
// ─────────────────────────────────────────────────────────────────────────────

export interface EcartVsReference {
  scenario_id: ScenarioId;
  DELTA_NET_AVANT_IR: number;
  DELTA_NET_APRES_IR: number;
  DELTA_COTISATIONS: number;
  DELTA_FISCAL: number;
  DELTA_COUT_TOTAL: number;
  DELTA_TRESORERIE: number;
}

export interface Comparaison {
  scenario_reference_id: ScenarioId;
  classement_net_apres_ir: ScenarioId[];
  classement_super_net: ScenarioId[];
  classement_robustesse: ScenarioId[];
  classement_complexite: ScenarioId[];
  ecarts: EcartVsReference[];
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMANDATION
// ─────────────────────────────────────────────────────────────────────────────

export interface Recommandation {
  scenario_recommande_id: ScenarioId;
  motif: string;
  points_de_vigilance: string[];
  gain_vs_reference_annuel: number;
  gain_vs_reference_mensuel: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUALITÉ DU RÉSULTAT
// ─────────────────────────────────────────────────────────────────────────────

export interface QualiteResultat {
  niveau_fiabilite: NiveauFiabilite;
  score_fiabilite: number;
  hypotheses_retenues: string[];
  avertissements: string[];
  elements_a_confirmer: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SORTIE COMPLÈTE DU MOTEUR
// ─────────────────────────────────────────────────────────────────────────────

export interface InputsNormalises {
  profil: {
    segment: SegmentActivite;
    forme_juridique?: FormeJuridique;
    regime_envisage?: RegimeFiscalEnvisage;
  };
  activite: {
    CA_HT_RETENU: number;
    CA_TTC_RETENU: number;
    charges_retenues: number;
    recettes_pro_retenues: number;
  };
  foyer: {
    situation_familiale: SituationFamiliale;
    nb_parts: number;
    autres_revenus?: number;
    rfr_n2?: number;
  };
  tva: {
    regime_applicable: OptionTVA;
    tva_nette_due: number;
  };
  aides: {
    acre_active: boolean;
    arce_active: boolean;
    zone_active: OptionExonerationZone | null;
  };
}

export interface EngineOutput {
  inputs_normalises: InputsNormalises;
  qualification: {
    segment_retenu: SegmentActivite;
    flags: QualificationFlags;
    elements_a_confirmer: string[];
  };
  scenarios_possibles: ScenarioCandidat[];
  scenarios_exclus: ScenarioExclu[];
  calculs_par_scenario: DetailCalculScenario[];
  comparaison: Comparaison;
  recommandation: Recommandation | null;
  qualite_resultat: QualiteResultat;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGS DEBUG
// ─────────────────────────────────────────────────────────────────────────────

export interface EngineLog {
  /** Numéro d'étape pipeline (1–10) */
  etape: number;
  /** Nom lisible de l'étape */
  label: string;
  level: LogLevel;
  scenario_id?: string;
  variable?: string;
  valeur?: number | boolean | string;
  detail?: Record<string, unknown>;
  motif?: string;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/** Résultat d'exclusion d'un scénario — jamais une exception silencieuse */
export interface ExclusionResult {
  exclu: true;
  motif: string;
}

/** Résultat d'admission d'un scénario */
export interface AdmissionResult {
  exclu: false;
  motif_admission: string;
}

export type EligibiliteResult = ExclusionResult | AdmissionResult;

/** Résultat d'une application de booster */
export interface BoosterResult {
  booster_id: BoosterId;
  applicable: boolean;
  motif?: string;
  impact_cotisations?: number;
  impact_impot?: number;
  impact_tresorerie?: number;
}

/** Calcul intermédiaire TNS */
export interface ResultatCotisationsTNS {
  cotisations_brutes: number;
  detail_par_branche: Record<string, number>;
  cotisations_minimales_appliquees: boolean;
  avertissement_minimales?: string;
}

/** Calcul IR */
export interface ResultatIR {
  ir_theorique_foyer: number;
  ir_foyer_sans_scenario: number;
  ir_attribuable_scenario: number;
  mode: "complet" | "estimation";
  avertissement?: string;
}

/** Calcul IS */
export interface ResultatIS {
  resultat_fiscal_is: number;
  taux_applicable: number;
  is_du: number;
  taux_reduit_applique: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES FISCAUX (interface générique, implémentée dans @wymby/config)
// ─────────────────────────────────────────────────────────────────────────────

export type TrancheIR = {
  de: number;
  a: number | null;
  taux: number;
};

export type TrancheCotisation = {
  de_pass: number;
  a_pass: number | null;
  taux: number;
};

export type PhaseExoneration = {
  annee: number;
  taux: number;
};

export type CotisationLigne = {
  libelle: string;
  part_employeur: number | null;
  part_salarie: number | null;
  assiette: string;
};
