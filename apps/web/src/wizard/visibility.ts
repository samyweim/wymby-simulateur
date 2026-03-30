import type { WizardState } from "./types.js";

type VisibleField =
  | "charges_detail"
  | "amortissements"
  | "rfr_n2"
  | "droits_are"
  | "activite_sante"
  | "numero_adeli"
  | "secteur_sante"
  | "statut_exercice_sante"
  | "charges_retrocession"
  | "envisage_associes"
  | "tva_question";

export function shouldShow(field: VisibleField, state: WizardState): boolean {
  const ca = parseFloat(state.ca_annuel) || 0;

  switch (field) {
    case "charges_detail":
      return state.a_des_charges === true && state.mode_saisie_charges === "detail";

    case "amortissements":
      return (
        state.a_des_amortissements === true &&
        (ca > 40_000 ||
          ["liberal_reglemente", "sante_medecin", "sante_paramedicale"].includes(
            state.type_activite
          ))
      );

    case "rfr_n2":
      return state.connait_rfr === true;

    case "droits_are":
      return state.percoit_chomage === true;

    case "activite_sante":
      return false;

    case "numero_adeli":
      return false;

    case "secteur_sante":
      return (
        state.type_activite === "sante_medecin" ||
        state.type_activite === "sante_paramedicale"
      );

    case "statut_exercice_sante":
      return (
        state.type_activite === "sante_medecin" ||
        state.type_activite === "sante_paramedicale"
      );

    case "charges_retrocession":
      return (
        state.type_activite === "sante_medecin" ||
        state.type_activite === "sante_paramedicale"
      );

    case "envisage_associes":
      return (
        ca > 40_000 || ["liberal_reglemente", "sante_medecin"].includes(state.type_activite)
      );

    case "tva_question":
      return state.est_deja_en_activite === true;

    default:
      return true;
  }
}
