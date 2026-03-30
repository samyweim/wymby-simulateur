import type {
  FormeJuridique,
  OptionExonerationZone,
  RegimeFiscalEnvisage,
  SecteurConventionnel as EngineSecteurConventionnel,
  SegmentActivite,
  SousSegmentActivite,
  UserInput,
} from "@wymby/types";
import { resolveZoneFromCodePostal } from "../data/zones_cp.js";
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
  if (enfants === 0) return base;
  if (enfants === 1) return base + 0.5;
  if (enfants === 2) return base + 1;
  return base + 2;
}

function mapSegment(type: WizardState["type_activite"]): SegmentActivite {
  if (type === "sante_medecin" || type === "sante_paramedicale") return "sante";
  if (type === "artiste") return "artiste_auteur";
  if (type === "location") return "immobilier";
  return "generaliste";
}

function mapSousSegment(type: WizardState["type_activite"]): SousSegmentActivite | undefined {
  if (type === "commerce") return "achat_revente";
  if (type === "prestation") return "prestation";
  if (type === "liberal_reglemente" || type === "liberal_non_reglemente") return "liberal";
  if (type === "sante_medecin") return "medecin";
  if (type === "sante_paramedicale") return "paramedical";
  if (type === "artiste") return "artiste_auteur";
  if (type === "location") return "lmnp";
  return undefined;
}

function mapForme(state: WizardState): FormeJuridique {
  if (state.envisage_associes === true) return "SASU";
  return "non_decide";
}

function mapRegime(state: WizardState): RegimeFiscalEnvisage {
  if (state.envisage_associes === true) return "IS";
  return "non_decide";
}

function mapSecteurConventionnel(
  s: WizardState["secteur_conventionnel"]
): EngineSecteurConventionnel | undefined {
  if (!s) return undefined;
  const map: Record<string, EngineSecteurConventionnel> = {
    "1": "secteur_1",
    "2_optam": "secteur_2_optam",
    "2_non_optam": "secteur_2_non_optam",
    "3": "secteur_3",
  };
  return map[s] as EngineSecteurConventionnel;
}

function getDateCreation(state: WizardState): string | undefined {
  if (state.est_deja_en_activite === true && state.annee_debut_activite) {
    return `${state.annee_debut_activite}-01-01`;
  }
  if (state.est_creation === true) {
    return "2026-01-01";
  }
  return undefined;
}

export function mapWizardToUserInput(state: WizardState): UserInput {
  const ca = parseNumRequired(state.ca_annuel);
  const chargesLocaux = parseNum(state.charges_locaux ?? "") ?? 0;
  const chargesMateriel = parseNum(state.charges_materiel ?? "") ?? 0;
  const chargesPersonnel = parseNum(state.charges_personnel ?? "") ?? 0;
  const chargesAutres = parseNum(state.charges_autres ?? "") ?? 0;
  const autresRevenus = state.a_autres_revenus ? parseNum(state.autres_revenus_foyer) : 0;
  const rfr = state.connait_rfr ? parseNum(state.rfr_n2) : undefined;
  const droitsAre = state.percoit_chomage ? parseNum(state.droits_are_restants) : undefined;
  const nbParts = partsFromSituation(state);
  const zoneResolue = resolveZoneFromCodePostal(state.code_postal ?? "");
  const zone = zoneResolue !== "aucune" ? zoneResolue : undefined;
  const secteurConventionnel = mapSecteurConventionnel(state.secteur_conventionnel);

  const SEUIL_AMORTISSEMENT_MATERIEL = 500;
  const materielAmortissable =
    chargesMateriel > SEUIL_AMORTISSEMENT_MATERIEL ? chargesMateriel : 0;
  const chargesCourantes =
    chargesLocaux +
    chargesPersonnel +
    chargesAutres +
    (chargesMateriel <= SEUIL_AMORTISSEMENT_MATERIEL ? chargesMateriel : 0);

  const chargesTotal =
    chargesCourantes > 0
      ? chargesCourantes
      : state.a_des_charges
        ? (parseNum(state.charges_annuelles) ?? 0)
        : 0;

  const amortissementsTotal =
    materielAmortissable > 0
      ? materielAmortissable
      : state.a_des_amortissements
        ? (parseNum(state.amortissements_annuels) ?? 0)
        : undefined;

  return {
    ANNEE_SIMULATION: 2026,
    SEGMENT_ACTIVITE: mapSegment(state.type_activite),
    SOUS_SEGMENT_ACTIVITE: mapSousSegment(state.type_activite),
    FORME_JURIDIQUE_ENVISAGEE: mapForme(state),
    REGIME_FISCAL_ENVISAGE: mapRegime(state),
    INPUT_MODE_CA: state.mode_ca,
    CA_ENCAISSE_UTILISATEUR: ca,
    CHARGES_DECAISSEES: chargesTotal,
    CHARGES_DEDUCTIBLES: chargesTotal,
    DOTATIONS_AMORTISSEMENTS: amortissementsTotal,
    SITUATION_FAMILIALE: state.situation_familiale === "en_couple" ? "marie" : "celibataire",
    NOMBRE_PARTS_FISCALES: nbParts,
    NOMBRE_ENFANTS_A_CHARGE: state.nb_enfants,
    AUTRES_REVENUS_FOYER_IMPOSABLES: autresRevenus,
    RFR_N_2_UTILISATEUR: rfr,
    TVA_DEJA_APPLICABLE: state.tva_deja_applicable ?? undefined,
    DATE_CREATION_ACTIVITE: getDateCreation(state),
    EST_CREATEUR_REPRENEUR: state.est_creation ?? undefined,
    ACRE_DEMANDEE: state.est_creation ?? undefined,
    EST_ELIGIBLE_ACRE_DECLARATIF: state.est_creation ?? undefined,
    ARCE_DEMANDEE: state.percoit_chomage ?? undefined,
    EST_BENEFICIAIRE_ARE: state.percoit_chomage ?? undefined,
    DROITS_ARE_RESTANTS: droitsAre,
    LOCALISATION_CODE_POSTAL: state.code_postal || undefined,
    EST_IMPLANTE_EN_ZFRR: zoneResolue === "ZFRR" || zoneResolue === "ZFRR_PLUS",
    EST_IMPLANTE_EN_ZFRR_PLUS: zoneResolue === "ZFRR_PLUS",
    EST_IMPLANTE_EN_QPV: zoneResolue === "QPV",
    OPTION_EXONERATION_ZONE_CHOISIE: (zoneResolue as OptionExonerationZone) ?? "aucune",
    SECTEUR_CONVENTIONNEL: secteurConventionnel,
    EST_CONVENTIONNE: state.secteur_conventionnel !== "" && state.secteur_conventionnel !== "3",
    EST_ELIGIBLE_AIDE_CPAM:
      state.secteur_conventionnel === "1" || state.secteur_conventionnel === "2_optam",
    NIVEAU_CERTITUDE_CA: state.certitude_ca,
    OPTION_VFL_DEMANDEE: rfr !== undefined,
  } as UserInput;
}
