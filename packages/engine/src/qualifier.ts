/**
 * qualifier.ts — Étape 2 du pipeline : qualification du profil
 *
 * Détermine le segment, les flags d'éligibilité aux régimes de base,
 * les options TVA, VFL, et les boosters potentiels.
 */

import type {
  UserInput,
  QualificationFlags,
  SegmentActivite,
  OptionTVA,
} from "@wymby/types";
import type { NormalisationResult } from "./normalizer.js";
import type { EngineLogger } from "./logger.js";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";

type FP = typeof FiscalParamsType;

export interface QualificationResult {
  segment: SegmentActivite;
  flags: QualificationFlags;
  regime_tva: OptionTVA;
  elements_a_confirmer: string[];
  avertissements: string[];
}

/**
 * Qualifie le profil utilisateur et détermine les flags d'éligibilité.
 */
export function qualifierProfil(
  input: UserInput,
  norm: NormalisationResult,
  params: FP,
  logger: EngineLogger
): QualificationResult {
  const elements_a_confirmer: string[] = [];
  const avertissements: string[] = [];

  // ── Segment ────────────────────────────────────────────────────────────────
  const segment = _normalizeSegment(input.SEGMENT_ACTIVITE);

  logger.info(2, "Qualification segment", { variable: "segment", valeur: segment });

  // ── Régime TVA ─────────────────────────────────────────────────────────────
  let regime_tva: OptionTVA = norm.regime_tva_applicable;

  const seuil_tva = _getSeuilTVAFranchise(
    input,
    params,
    norm.CA_HT_RETENU
  );
  const seuil_tva_tolerance = _getSeuilTVATolerance(input, params, norm.CA_HT_RETENU);

  const tvaExonereeSante = _isTvaExonereeSante(input);
  if (
    input.EST_PROFESSION_SANTE === true &&
    input.A_NUMERO_ADELI === undefined &&
    input.SEGMENT_ACTIVITE === "generaliste"
  ) {
    elements_a_confirmer.push(
      "Profession liberale de sante detectee : confirmer la presence d'un numero ADELI pour qualifier correctement l'exoneration de TVA."
    );
  }

  if (tvaExonereeSante) {
    regime_tva = "TVA_FRANCHISE";
    if (input.TVA_DEJA_APPLICABLE === true) {
      avertissements.push("TVA_EXONERATION_SANTE_ADELI_A_VERIFIER");
    }
  } else if (input.DATE_DEPASSEMENT_TVA_DECLARATIVE) {
    regime_tva = "TVA_COLLECTEE";
    avertissements.push(
      `DEPASSEMENT_SEUIL_TVA_MAJORE_${_getTvaLabelSuffix(input)}`,
    );
    avertissements.push(
      `TVA applicable dès le ${new Date(input.DATE_DEPASSEMENT_TVA_DECLARATIVE).toLocaleDateString("fr-FR")} après dépassement déclaratif du seuil majoré.`
    );
  } else if (input.TVA_DEJA_APPLICABLE === true) {
    regime_tva = "TVA_COLLECTEE";
  } else if (norm.CA_HT_RETENU > seuil_tva) {
    // Dépassement du seuil de base mais pas du seuil majoré
    avertissements.push(
      `CA (${norm.CA_HT_RETENU} €) dépasse le seuil de franchise TVA (${seuil_tva} €) : ` +
        "passage TVA au 1er janvier N+1."
    );
  }

  logger.calc(2, "Qualification TVA", "regime_tva", regime_tva, {
    CA_HT: norm.CA_HT_RETENU,
    seuil_franchise: seuil_tva,
    seuil_tolerance: seuil_tva_tolerance,
  });

  // ── Flags micro ────────────────────────────────────────────────────────────
  const ca = norm.CA_HT_RETENU;
  const microParams = params.micro;

  const FLAG_MICRO_BIC_VENTE_POSSIBLE =
    segment === "generaliste" &&
    (input.SOUS_SEGMENT_ACTIVITE === "achat_revente" || input.SOUS_SEGMENT_ACTIVITE === undefined) &&
    ca <= microParams.CFG_SEUIL_CA_MICRO_BIC_VENTE;

  const FLAG_MICRO_BIC_SERVICE_POSSIBLE =
    segment === "generaliste" &&
    (input.SOUS_SEGMENT_ACTIVITE === "prestation" || input.SOUS_SEGMENT_ACTIVITE === undefined) &&
    ca <= microParams.CFG_SEUIL_CA_MICRO_BIC_SERVICE;

  const FLAG_MICRO_BNC_POSSIBLE =
    segment === "generaliste" &&
    (input.SOUS_SEGMENT_ACTIVITE === "liberal" ||
      input.SOUS_SEGMENT_ACTIVITE === undefined) &&
    ca <= microParams.CFG_SEUIL_CA_MICRO_BNC;

  const microThresholdBreaches = _getMicroThresholdBreaches(input, params, segment, ca);
  const FLAG_DEPASSEMENT_SEUIL_MICRO = microThresholdBreaches.length > 0;

  if (FLAG_DEPASSEMENT_SEUIL_MICRO) {
    for (const breach of microThresholdBreaches) {
      avertissements.push(`DEPASSEMENT_SEUIL_MICRO_${breach}`);
    }
    // Note : BASCULEMENT_REEL_OBLIGE est déterminé dans exclusion.ts
    // selon la règle de tolérance (deux années consécutives requises).
  }

  logger.calc(2, "Qualification micro", "FLAG_MICRO_BIC_VENTE_POSSIBLE", FLAG_MICRO_BIC_VENTE_POSSIBLE);
  logger.calc(2, "Qualification micro", "FLAG_MICRO_BIC_SERVICE_POSSIBLE", FLAG_MICRO_BIC_SERVICE_POSSIBLE);
  logger.calc(2, "Qualification micro", "FLAG_MICRO_BNC_POSSIBLE", FLAG_MICRO_BNC_POSSIBLE);

  // ── EI réel ────────────────────────────────────────────────────────────────
  // EI réel BIC toujours possible pour les généralistes activité commerce/artisanat
  const FLAG_EI_REEL_BIC_IR_POSSIBLE =
    segment === "generaliste" &&
    (input.SOUS_SEGMENT_ACTIVITE === "achat_revente" ||
      input.SOUS_SEGMENT_ACTIVITE === "prestation" ||
      input.SOUS_SEGMENT_ACTIVITE === undefined);

  // EI réel BIC IS : option IS possible dans la fenêtre temporelle paramétrée
  const FLAG_EI_REEL_BIC_IS_POSSIBLE =
    FLAG_EI_REEL_BIC_IR_POSSIBLE && _isOptionISEIValide(input, params);

  const FLAG_EI_REEL_BNC_IR_POSSIBLE =
    segment === "generaliste" &&
    (input.SOUS_SEGMENT_ACTIVITE === "liberal" ||
      input.SOUS_SEGMENT_ACTIVITE === undefined);

  const FLAG_EI_REEL_BNC_IS_POSSIBLE =
    FLAG_EI_REEL_BNC_IR_POSSIBLE && _isOptionISEIValide(input, params);

  // ── EURL / SASU ────────────────────────────────────────────────────────────
  const formeJuridique = input.FORME_JURIDIQUE_ENVISAGEE;

  const FLAG_EURL_IS_POSSIBLE =
    segment === "generaliste" &&
    (formeJuridique === "EURL" ||
      formeJuridique === "non_decide" ||
      formeJuridique === undefined);

  // EURL IR temporaire : limité à 5 exercices (CFG_DUREE_OPTION_IR_TEMPORAIRE_SOCIETE)
  const FLAG_EURL_IR_POSSIBLE =
    FLAG_EURL_IS_POSSIBLE &&
    _isIRTemporaireValide(input, params);

  const FLAG_SASU_IS_POSSIBLE =
    segment === "generaliste" &&
    (formeJuridique === "SASU" ||
      formeJuridique === "non_decide" ||
      formeJuridique === undefined);

  const FLAG_SASU_IR_POSSIBLE =
    FLAG_SASU_IS_POSSIBLE &&
    _isIRTemporaireValide(input, params);

  const recettesImmobilieres = input.RECETTES_LOCATION_MEUBLEE ?? input.CA_ENCAISSE_UTILISATEUR;
  const autresRevenusActivite = input.AUTRES_REVENUS_ACTIVITE_FOYER ?? 0;
  // S01 RSPM : réservé aux remplaçants (EST_REMPLACANT = true), sous le plafond de recettes RSPM
  const FLAG_RSPM_POSSIBLE =
    segment === "sante" &&
    input.EST_REMPLACANT === true &&
    input.SOUS_SEGMENT_ACTIVITE === "medecin" &&
    input.CA_ENCAISSE_UTILISATEUR <= params.social.CFG_SEUIL_ELIGIBILITE_RSPM;
  const FLAG_SANTE_MICRO_POSSIBLE =
    segment === "sante" && ca <= microParams.CFG_SEUIL_CA_MICRO_BNC;
  const FLAG_SANTE_REEL_POSSIBLE = segment === "sante";
  const FLAG_AIDE_CPAM_POSSIBLE =
    segment === "sante" &&
    (input.EST_ELIGIBLE_AIDE_CPAM === true ||
      input.SECTEUR_CONVENTIONNEL === "secteur_1" ||
      input.SECTEUR_CONVENTIONNEL === "secteur_2_optam");
  const FLAG_ARTISTE_AUTEUR_BNC_MICRO_POSSIBLE =
    segment === "artiste_auteur" &&
    (input.MODE_DECLARATION_ARTISTE_AUTEUR === "BNC" ||
      input.MODE_DECLARATION_ARTISTE_AUTEUR === undefined);
  const FLAG_ARTISTE_AUTEUR_TS_POSSIBLE =
    segment === "artiste_auteur" && input.MODE_DECLARATION_ARTISTE_AUTEUR === "TS";
  const FLAG_RAAP_APPLICABLE =
    segment === "artiste_auteur" &&
    (input.EST_REDEVABLE_RAAP === true || ca >= params.culture.CFG_SEUIL_RAAP);
  const FLAG_LMP_POSSIBLE =
    segment === "immobilier" &&
    recettesImmobilieres >= params.immobilier.CFG_SEUIL_LMP_RECETTES &&
    recettesImmobilieres > autresRevenusActivite;
  const FLAG_LMNP_MICRO_POSSIBLE =
    segment === "immobilier" &&
    FLAG_LMP_POSSIBLE === false &&
    recettesImmobilieres <= params.micro.CFG_SEUIL_CA_MICRO_LMNP_CLASSIQUE;

  if (FLAG_EURL_IR_POSSIBLE || FLAG_SASU_IR_POSSIBLE) {
    elements_a_confirmer.push(
      "Régime IR temporaire (EURL/SASU) : durée limitée à 5 exercices. " +
        "Vérifier la date de début de l'option."
    );
  }

  // ── VFL ────────────────────────────────────────────────────────────────────
  const { FLAG_VFL_POSSIBLE, FLAG_VFL_INTERDIT } = _qualifierVFL(
    input,
    params,
    avertissements,
    elements_a_confirmer
  );

  // ── TVA et dépassement ────────────────────────────────────────────────────
  const FLAG_TVA_APPLICABLE =
    tvaExonereeSante
      ? false
      : input.TVA_DEJA_APPLICABLE === true || input.DATE_DEPASSEMENT_TVA_DECLARATIVE !== undefined;
  const FLAG_DEPASSEMENT_SEUIL_TVA =
    tvaExonereeSante
      ? false
      : input.DATE_DEPASSEMENT_TVA_DECLARATIVE !== undefined || ca > seuil_tva_tolerance;
  const FLAG_CA_SAISI_EN_TTC = input.INPUT_MODE_CA === "TTC";

  // ── ACRE ──────────────────────────────────────────────────────────────────
  const FLAG_ACRE_POSSIBLE = _isAcrePossible(input, params, avertissements);

  // ── ARCE ──────────────────────────────────────────────────────────────────
  const FLAG_ARCE_POSSIBLE = _isArcePossible(input, params);

  if (FLAG_ARCE_POSSIBLE) {
    elements_a_confirmer.push(
      "Éligibilité ARCE déclarée — à confirmer avec Pôle Emploi (France Travail). " +
        "ARCE modélisée comme flux trésorerie externe, non comme gain récurrent."
    );
  }

  // ── Zones ─────────────────────────────────────────────────────────────────
  const FLAG_ZFRR_POSSIBLE = input.EST_IMPLANTE_EN_ZFRR === true;
  const FLAG_ZFRR_PLUS_POSSIBLE = input.EST_IMPLANTE_EN_ZFRR_PLUS === true;
  const FLAG_QPV_POSSIBLE =
    input.EST_IMPLANTE_EN_QPV === true && params.zones.CFG_QPV_ACTIVE === true;
  const FLAG_ZFU_STOCK_DROITS_POSSIBLE =
    input.EST_IMPLANTE_EN_ANCIENNE_ZFU_OUVRANT_DROITS === true &&
    params.zones.CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS.maintien_droits_acquis === true;

  if (FLAG_ZFRR_POSSIBLE || FLAG_QPV_POSSIBLE || FLAG_ZFU_STOCK_DROITS_POSSIBLE) {
    elements_a_confirmer.push(
      "Exonération de zone détectée. Vérifier le code postal et la liste officielle des communes éligibles."
    );
  }

  if (
    [FLAG_ZFRR_POSSIBLE, FLAG_QPV_POSSIBLE, FLAG_ZFU_STOCK_DROITS_POSSIBLE].filter(Boolean).length > 1
  ) {
    avertissements.push(
      "Plusieurs régimes de zone détectés : " +
        params.zones.CFG_NON_CUMUL_EXONERATIONS_ZONE.principe +
        " — les deux scénarios seront calculés et présentés pour arbitrage."
    );
  }

  // ── Taxe PUMa ─────────────────────────────────────────────────────────────
  // TODO [AMBIGUÏTÉ] : CFG_FORMULE_TAXE_PUMA — assiette et calcul 2026 non confirmés
  // Variables concernées : CFG_SEUIL_PUMA, CFG_FORMULE_TAXE_PUMA
  // Impact : potentielle taxe sur les revenus du capital pour les faibles revenus d'activité
  // Décision requise avant de coder la formule exacte
  const FLAG_TAXE_PUMA_APPLICABLE = _isPumaPotentielle(input, params);

  if (FLAG_TAXE_PUMA_APPLICABLE) {
    avertissements.push("TAXE_PUMA_POTENTIELLEMENT_APPLICABLE");
    avertissements.push(
      "Taxe PUMa (cotisation subsidiaire maladie) potentiellement applicable. " +
        "Calcul exact à confirmer avec un expert. Fiabilité marquée 'partiel' pour les scénarios concernés."
    );
    elements_a_confirmer.push("Taxe PUMa : formule 2026 à confirmer (CFG_FORMULE_TAXE_PUMA)");
  }

  const FLAG_DONNEES_A_COMPLETER =
    input.CHARGES_DECAISSEES === undefined ||
    input.AUTRES_REVENUS_FOYER_IMPOSABLES === undefined ||
    input.RFR_N_2_UTILISATEUR === undefined;

  const flags: QualificationFlags = {
    FLAG_CA_SAISI_EN_TTC,
    FLAG_TVA_APPLICABLE,
    FLAG_DEPASSEMENT_SEUIL_MICRO,
    FLAG_DEPASSEMENT_SEUIL_TVA,
    FLAG_VFL_POSSIBLE,
    FLAG_VFL_INTERDIT,
    FLAG_MICRO_BIC_VENTE_POSSIBLE,
    FLAG_MICRO_BIC_SERVICE_POSSIBLE,
    FLAG_MICRO_BNC_POSSIBLE,
    FLAG_EI_REEL_BIC_IR_POSSIBLE,
    FLAG_EI_REEL_BIC_IS_POSSIBLE,
    FLAG_EI_REEL_BNC_IR_POSSIBLE,
    FLAG_EI_REEL_BNC_IS_POSSIBLE,
    FLAG_EURL_IS_POSSIBLE,
    FLAG_EURL_IR_POSSIBLE,
    FLAG_SASU_IS_POSSIBLE,
    FLAG_SASU_IR_POSSIBLE,
    FLAG_RSPM_POSSIBLE,
    FLAG_SANTE_MICRO_POSSIBLE,
    FLAG_SANTE_REEL_POSSIBLE,
    FLAG_AIDE_CPAM_POSSIBLE,
    FLAG_ARTISTE_AUTEUR_BNC_MICRO_POSSIBLE,
    FLAG_ARTISTE_AUTEUR_TS_POSSIBLE,
    FLAG_RAAP_APPLICABLE,
    FLAG_LMNP_MICRO_POSSIBLE,
    FLAG_LMP_POSSIBLE,
    FLAG_ACRE_POSSIBLE,
    FLAG_ARCE_POSSIBLE,
    FLAG_ZFRR_POSSIBLE,
    FLAG_ZFRR_PLUS_POSSIBLE,
    FLAG_QPV_POSSIBLE,
    FLAG_ZFU_STOCK_DROITS_POSSIBLE,
    FLAG_TAXE_PUMA_APPLICABLE,
    FLAG_DONNEES_A_COMPLETER,
    FLAG_PREMIERE_ANNEE_DEPASSEMENT: false, // updated in index.ts after exclusion filters
  };

  logger.info(2, "Qualification complète", {
    detail: {
      segment,
      regime_tva,
      flags_actifs: Object.entries(flags)
        .filter(([, v]) => v === true)
        .map(([k]) => k),
    },
  });

  return {
    segment,
    flags,
    regime_tva,
    elements_a_confirmer,
    avertissements,
  };
}

function _normalizeSegment(segment: UserInput["SEGMENT_ACTIVITE"] | string): SegmentActivite {
  const normalise = String(segment)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalise === "sante") return "sante";
  if (normalise === "artiste_auteur") return "artiste_auteur";
  if (normalise === "immobilier") return "immobilier";
  return "generaliste";
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────

function _getSeuilTVAFranchise(
  input: UserInput,
  params: FP,
  _ca: number
): number {
  const ss = input.SOUS_SEGMENT_ACTIVITE;
  if (ss === "achat_revente") return params.tva.CFG_SEUIL_TVA_FRANCHISE_BIC_VENTE;
  if (ss === "liberal" || ss === "medecin" || ss === "paramedical") {
    return params.tva.CFG_SEUIL_TVA_FRANCHISE_BNC;
  }
  return params.tva.CFG_SEUIL_TVA_FRANCHISE_BIC_SERVICE;
}

function _getSeuilTVATolerance(
  input: UserInput,
  params: FP,
  _ca: number
): number {
  const ss = input.SOUS_SEGMENT_ACTIVITE;
  if (ss === "achat_revente") return params.tva.CFG_SEUIL_TVA_TOLERANCE_BIC_VENTE;
  if (ss === "liberal" || ss === "medecin" || ss === "paramedical") {
    return params.tva.CFG_SEUIL_TVA_TOLERANCE_BNC;
  }
  return params.tva.CFG_SEUIL_TVA_TOLERANCE_BIC_SERVICE;
}

function _qualifierVFL(
  input: UserInput,
  params: FP,
  avertissements: string[],
  elements_a_confirmer: string[]
): { FLAG_VFL_POSSIBLE: boolean; FLAG_VFL_INTERDIT: boolean } {
  // VFL nécessite : micro + RFR N-2 ≤ seuil par part
  const rfr = input.RFR_N_2_UTILISATEUR;
  const nbParts = input.NOMBRE_PARTS_FISCALES ?? 1;
  const seuilRFR = params.vfl.CFG_SEUIL_RFR_VFL_PAR_PART * nbParts;

  if (rfr === undefined) {
    // Impossible de déterminer l'éligibilité VFL sans le RFR
    elements_a_confirmer.push(
      "RFR N-2 non renseigné : éligibilité au Versement Libératoire calculée en mode estimation. " +
        "Fournir le RFR pour un calcul précis."
    );
    return { FLAG_VFL_POSSIBLE: true, FLAG_VFL_INTERDIT: false }; // optimiste avec alerte
  }

  if (rfr > seuilRFR) {
    avertissements.push("VFL_INTERDIT_RFR_DEPASSE");
    avertissements.push(
      `RFR N-2 (${rfr} €) dépasse le seuil VFL (${seuilRFR} € pour ${nbParts} parts) : ` +
        "option Versement Libératoire exclue (filtre X03)."
    );
    return { FLAG_VFL_POSSIBLE: false, FLAG_VFL_INTERDIT: true };
  }

  return { FLAG_VFL_POSSIBLE: true, FLAG_VFL_INTERDIT: false };
}

function _getMicroThresholdBreaches(
  input: UserInput,
  params: FP,
  segment: SegmentActivite,
  ca: number
): Array<"BIC_VENTE" | "BIC_SERVICE" | "BNC"> {
  if (segment !== "generaliste") return [];

  const breaches: Array<"BIC_VENTE" | "BIC_SERVICE" | "BNC"> = [];
  const sousSegment = input.SOUS_SEGMENT_ACTIVITE;

  if (
    (sousSegment === "achat_revente" || sousSegment === undefined) &&
    ca > params.micro.CFG_SEUIL_CA_MICRO_BIC_VENTE
  ) {
    breaches.push("BIC_VENTE");
  }

  if (
    (sousSegment === "prestation" || sousSegment === undefined) &&
    ca > params.micro.CFG_SEUIL_CA_MICRO_BIC_SERVICE
  ) {
    breaches.push("BIC_SERVICE");
  }

  if (
    (sousSegment === "liberal" || sousSegment === undefined) &&
    ca > params.micro.CFG_SEUIL_CA_MICRO_BNC
  ) {
    breaches.push("BNC");
  }

  return breaches;
}

function _getTvaLabelSuffix(input: UserInput): string {
  if (input.SOUS_SEGMENT_ACTIVITE === "achat_revente") return "BIC_VENTE";
  if (
    input.SOUS_SEGMENT_ACTIVITE === "liberal" ||
    input.SOUS_SEGMENT_ACTIVITE === "medecin" ||
    input.SOUS_SEGMENT_ACTIVITE === "paramedical"
  ) {
    return "BNC";
  }
  return "BIC_SERVICE";
}

function _isTvaExonereeSante(input: UserInput): boolean {
  return input.EST_PROFESSION_SANTE === true && input.A_NUMERO_ADELI === true;
}

function _isIRTemporaireValide(input: UserInput, params: FP): boolean {
  const dureeMax =
    params.temporalite.CFG_DUREE_OPTION_IR_TEMPORAIRE_SOCIETE.nb_exercices_max;
  if (!input.DATE_CREATION_ACTIVITE) return true; // on laisse passer, alerte émise par qualifier

  const dateCreation = new Date(input.DATE_CREATION_ACTIVITE);
  const now = new Date();
  const anneesDiff =
    (now.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  return anneesDiff <= dureeMax;
}

function _isOptionISEIValide(input: UserInput, params: FP): boolean {
  const optionConfig = params.temporalite.CFG_DATE_LIMITE_OPTION_IS_EI;
  const today = new Date();
  const simulationYear = input.ANNEE_SIMULATION ?? today.getFullYear();
  const dateLimiteExercice = new Date(
    simulationYear,
    optionConfig.mois_limite_exercice - 1,
    optionConfig.jour_limite_exercice,
    23,
    59,
    59,
    999
  );

  if (input.DATE_CREATION_ACTIVITE) {
    const dateCreation = new Date(input.DATE_CREATION_ACTIVITE);
    const moisDepuisCreation =
      (today.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

    if (moisDepuisCreation <= optionConfig.delai_creation_mois) {
      return true;
    }
  }

  return today <= dateLimiteExercice;
}

function _isAcrePossible(
  input: UserInput,
  params: FP,
  avertissements: string[]
): boolean {
  if (!params.aides.CFG_ACRE_ACTIVE) return false;
  if (input.ACRE_DEMANDEE === false) return false;

  // ACRE réservée aux créateurs/repreneurs dans les 24 mois de création
  if (input.EST_CREATEUR_REPRENEUR === false) return false;

  // Vérification ancienneté si date connue
  if (input.DATE_CREATION_ACTIVITE) {
    const dateCreation = new Date(input.DATE_CREATION_ACTIVITE);
    const moisDepuisCreation =
      (new Date().getTime() - dateCreation.getTime()) /
      (1000 * 60 * 60 * 24 * 30.44);

    const dureeMois = params.aides.CFG_DUREE_ACRE.hors_micro.duree_mois;
    if (moisDepuisCreation > dureeMois) {
      avertissements.push(
        `ACRE : durée maximale (${params.aides.CFG_DUREE_ACRE.hors_micro.duree_mois} mois) potentiellement dépassée. ` +
          "Vérifier la date de création."
      );
      return false;
    }
  }

  return true;
}

function _isArcePossible(input: UserInput, params: FP): boolean {
  // TODO [AMBIGUÏTÉ] : CFG_ARCE_ACTIVE / CFG_TAUX_ARCE — modalités 2026 à confirmer
  // Variables concernées : CFG_ARCE_ACTIVE, CFG_TAUX_ARCE
  // Impact : activation/désactivation de la branche ARCE
  // Décision requise avant de finaliser
  const arceConfig = params.aides.CFG_ARCE_ACTIVE;
  if (!arceConfig) return false;

  return (
    input.ARCE_DEMANDEE === true &&
    input.EST_BENEFICIAIRE_ARE === true &&
    (input.DROITS_ARE_RESTANTS ?? 0) > 0
  );
}

function _isPumaPotentielle(input: UserInput, params: FP): boolean {
  // Taxe PUMa potentielle si revenus d'activité très faibles et revenus du capital élevés
  const seuilPuma = params.social.CFG_SEUIL_PUMA;
  if (!seuilPuma) return false;

  const autresRevenus = input.AUTRES_REVENUS_FOYER_IMPOSABLES ?? 0;
  const ca = input.CA_ENCAISSE_UTILISATEUR;
  const revenuActiviteEstime = ca * (1 - params.social.CFG_TAUX_SOCIAL_MICRO_BNC_SSI);

  // Condition : revenus activité < seuil_activite ET revenus capital > seuil_capital
  const pumaObj = seuilPuma as unknown as Record<string, number>;
  const seuilActivite = pumaObj["seuil_activite_insuffisante"] ?? 0;
  const seuilCapital = pumaObj["seuil_patrimoine_declencheur"] ?? 0;

  return revenuActiviteEstime < seuilActivite && autresRevenus > seuilCapital;
}
