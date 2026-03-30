/**
 * WizardState — données collectées par le wizard, sans jargon fiscal.
 * Le mapper.ts les convertit en UserInput pour le moteur.
 */

export type TypeActivite =
  | "prestation"
  | "commerce"
  | "liberal_reglemente"
  | "liberal_non_reglemente"
  | "sante_medecin"
  | "sante_paramedicale"
  | "artiste"
  | "location"
  | "";

export type SecteurConventionnel =
  | "1"
  | "2_optam"
  | "2_non_optam"
  | "3"
  | "";

export type SituationFamilialeWizard =
  | "seul"
  | "en_couple"
  | "";

export interface WizardState {
  // Step 0 — Activité
  type_activite: TypeActivite;
  secteur_conventionnel: SecteurConventionnel;
  est_deja_en_activite: boolean | null;
  annee_debut_activite: string;

  // Step 1 — Revenus
  ca_annuel: string;
  mode_ca: "HT" | "TTC";
  a_des_charges: boolean | null;
  charges_annuelles: string;
  charges_locaux: string;
  charges_materiel: string;
  charges_personnel: string;
  charges_autres: string;
  a_des_amortissements: boolean | null;
  amortissements_annuels: string;
  certitude_ca: "certain" | "estimé" | "faible";

  // Step 2 — Situation personnelle
  situation_familiale: SituationFamilialeWizard;
  nb_enfants: number;
  a_autres_revenus: boolean | null;
  autres_revenus_foyer: string;
  connait_rfr: boolean | null;
  rfr_n2: string;

  // Step 3 — Aides et situations particulières
  est_creation: boolean | null;
  percoit_chomage: boolean | null;
  droits_are_restants: string;
  code_postal: string;
  tva_deja_applicable: boolean | null;
  envisage_associes: boolean | null;
}

export const WIZARD_INITIAL_STATE: WizardState = {
  type_activite: "",
  secteur_conventionnel: "",
  est_deja_en_activite: null,
  annee_debut_activite: "",
  ca_annuel: "",
  mode_ca: "HT",
  a_des_charges: null,
  charges_annuelles: "",
  charges_locaux: "",
  charges_materiel: "",
  charges_personnel: "",
  charges_autres: "",
  a_des_amortissements: null,
  amortissements_annuels: "",
  certitude_ca: "estimé",
  situation_familiale: "",
  nb_enfants: 0,
  a_autres_revenus: null,
  autres_revenus_foyer: "",
  connait_rfr: null,
  rfr_n2: "",
  est_creation: null,
  percoit_chomage: null,
  droits_are_restants: "",
  code_postal: "",
  tva_deja_applicable: null,
  envisage_associes: null,
};
