/**
 * mapper.ts — Convertit WizardState (langage utilisateur) → UserInput (moteur fiscal).
 *
 * Ce fichier est la seule couche de traduction jargon ↔ langage courant.
 * Aucun calcul fiscal ici — uniquement du mapping et de la normalisation.
 */

import type { UserInput, SegmentActivite, SousSegmentActivite, FormeJuridique, RegimeFiscalEnvisage, OptionExonerationZone } from "@wymby/types";
import type { WizardState } from "./types.js";

function parseNum(s: string): number | undefined {
  if (!s || s.trim() === "") return undefined;
  const n = parseFloat(s.replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? undefined : n;
}

function parseNumRequired(s: string): number {
  return parseNum(s) ?? 0;
}

function partsFromSituation(state: WizardState): number {
  const base = state.situation_familiale === "en_couple" ? 2 : 1;
  const enfants = state.nb_enfants;
  // Approximation QF : 0.5 part par enfant jusqu'à 2, 1 part à partir du 3e
  if (enfants === 0) return base;
  if (enfants === 1) return base + 0.5;
  if (enfants === 2) return base + 1;
  return base + 2; // 3 enfants ou plus
}

function mapSegment(type: WizardState["type_activite"]): SegmentActivite {
  if (type === "sante") return "sante";
  if (type === "artiste") return "artiste_auteur";
  if (type === "location") return "immobilier";
  return "generaliste";
}

function mapSousSegment(type: WizardState["type_activite"]): SousSegmentActivite | undefined {
  if (type === "vente") return "achat_revente";
  if (type === "prestation") return "prestation";
  if (type === "liberal") return "liberal";
  if (type === "sante") return "medecin";
  if (type === "artiste") return "artiste_auteur";
  if (type === "location") return "lmnp";
  return undefined;
}

function mapForme(f: WizardState["forme_envisagee"]): FormeJuridique {
  if (f === "EI") return "EI";
  if (f === "EURL") return "EURL";
  if (f === "SASU") return "SASU";
  return "non_decide";
}

function mapRegime(state: WizardState): RegimeFiscalEnvisage {
  if (state.forme_envisagee === "EURL") return "non_decide"; // peut être IR ou IS
  if (state.forme_envisagee === "SASU") return "IS";
  return "non_decide";
}

function mapZone(z: WizardState["zone_speciale"]): OptionExonerationZone | undefined {
  if (z === "ZFRR") return "ZFRR";
  if (z === "ZFRR_PLUS") return "ZFRR_PLUS";
  if (z === "QPV") return "QPV";
  return undefined;
}

export function mapWizardToUserInput(state: WizardState): UserInput {
  const ca = parseNumRequired(state.ca_annuel);
  const charges = state.a_des_charges ? parseNum(state.charges_annuelles) : 0;
  const amortissements = state.a_des_amortissements ? parseNum(state.amortissements_annuels) : undefined;
  const autres_revenus = state.a_autres_revenus ? parseNum(state.autres_revenus_foyer) : 0;
  const rfr = state.connait_rfr ? parseNum(state.rfr_n2) : undefined;
  const droits_are = state.percoit_chomage ? parseNum(state.droits_are_restants) : undefined;
  const zone = mapZone(state.zone_speciale);
  const nb_parts = partsFromSituation(state);

  return {
    // Profil
    ANNEE_SIMULATION: 2026,
    SEGMENT_ACTIVITE: mapSegment(state.type_activite),
    SOUS_SEGMENT_ACTIVITE: mapSousSegment(state.type_activite),
    FORME_JURIDIQUE_ENVISAGEE: mapForme(state.forme_envisagee),
    REGIME_FISCAL_ENVISAGE: mapRegime(state),

    // Activité
    INPUT_MODE_CA: state.mode_ca,
    CA_ENCAISSE_UTILISATEUR: ca,
    CHARGES_DECAISSEES: charges,
    CHARGES_DEDUCTIBLES: charges,
    DOTATIONS_AMORTISSEMENTS: amortissements,

    // Foyer
    SITUATION_FAMILIALE:
      state.situation_familiale === "en_couple" ? "marie" : "celibataire",
    NOMBRE_PARTS_FISCALES: nb_parts,
    NOMBRE_ENFANTS_A_CHARGE: state.nb_enfants,
    AUTRES_REVENUS_FOYER_IMPOSABLES: autres_revenus,
    RFR_N_2_UTILISATEUR: rfr,

    // TVA
    TVA_DEJA_APPLICABLE: state.tva_deja_applicable ?? undefined,

    // Temporalité
    DATE_CREATION_ACTIVITE: state.date_creation || undefined,

    // Aides
    EST_CREATEUR_REPRENEUR: state.est_creation ?? undefined,
    ACRE_DEMANDEE: state.est_creation ?? undefined,
    EST_ELIGIBLE_ACRE_DECLARATIF: state.est_creation ?? undefined,
    ARCE_DEMANDEE: state.percoit_chomage ?? undefined,
    EST_BENEFICIAIRE_ARE: state.percoit_chomage ?? undefined,
    DROITS_ARE_RESTANTS: droits_are,
    EST_IMPLANTE_EN_ZFRR: zone === "ZFRR" || zone === "ZFRR_PLUS",
    EST_IMPLANTE_EN_ZFRR_PLUS: zone === "ZFRR_PLUS",
    EST_IMPLANTE_EN_QPV: zone === "QPV",
    OPTION_EXONERATION_ZONE_CHOISIE: zone ?? "aucune",

    // Qualité
    NIVEAU_CERTITUDE_CA: state.certitude_ca,
    OPTION_VFL_DEMANDEE: rfr !== undefined,
  } as UserInput;
}
