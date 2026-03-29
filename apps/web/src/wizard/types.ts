/**
 * WizardState — données collectées par le wizard, sans jargon fiscal.
 * Le mapper.ts les convertit en UserInput pour le moteur.
 */

export type TypeActivite =
  | "prestation"      // Prestation de service / consulting
  | "vente"           // Vente de marchandises
  | "liberal"         // Profession libérale (avocat, expert-comptable…)
  | "sante"           // Santé (médecin, kiné, infirmier…)
  | "artiste"         // Artiste-auteur
  | "location"        // Location meublée (LMNP/LMP)
  | "";

export type FormeEnvisagee =
  | "non_decide"
  | "EI"
  | "EURL"
  | "SASU"
  | "";

export type SituationFamilialeWizard =
  | "seul"
  | "en_couple"
  | "";

export interface WizardState {
  // Step 0 — Activité
  type_activite: TypeActivite;
  forme_envisagee: FormeEnvisagee;
  date_creation: string;          // "" = démarre maintenant

  // Step 1 — Revenus
  ca_annuel: string;              // saisie libre → parsé en number
  mode_ca: "HT" | "TTC";
  a_des_charges: boolean | null;
  charges_annuelles: string;
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
  zone_speciale: "aucune" | "ZFRR" | "ZFRR_PLUS" | "QPV" | "";
  tva_deja_applicable: boolean | null;
}

export const WIZARD_INITIAL_STATE: WizardState = {
  type_activite: "",
  forme_envisagee: "",
  date_creation: "",
  ca_annuel: "",
  mode_ca: "HT",
  a_des_charges: null,
  charges_annuelles: "",
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
  zone_speciale: "",
  tva_deja_applicable: null,
};
