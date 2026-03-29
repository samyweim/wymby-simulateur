/**
 * calculators/is.ts — Calcul de l'Impôt sur les Sociétés
 */

import type { ResultatIS } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";

type FP = typeof FiscalParamsType;

/**
 * Calcule l'IS sur un résultat fiscal.
 * Taux réduit de 15 % jusqu'au seuil, taux normal de 25 % au-delà.
 * Le seuil est proratisé si l'exercice est incomplet.
 *
 * @param resultat_fiscal — Bénéfice fiscal imposable à l'IS
 * @param params — Paramètres fiscaux
 * @param nb_mois_exercice — Nombre de mois de l'exercice (prorata temporis), défaut 12
 */
export function f_is(
  resultat_fiscal: number,
  params: FP,
  nb_mois_exercice: number = 12
): ResultatIS {
  if (resultat_fiscal <= 0) {
    return {
      resultat_fiscal_is: resultat_fiscal,
      taux_applicable: 0,
      is_du: 0,
      taux_reduit_applique: false,
    };
  }

  const taux_reduit = params.fiscal.CFG_TAUX_IS_REDUIT;
  const taux_normal = params.fiscal.CFG_TAUX_IS_NORMAL;
  const seuil_base = params.fiscal.CFG_SEUIL_IS_REDUIT;

  // Proratisation du seuil IS réduit
  const seuil_proratise = seuil_base * (nb_mois_exercice / 12);

  let is_du: number;
  let taux_reduit_applique: boolean;

  if (resultat_fiscal <= seuil_proratise) {
    is_du = resultat_fiscal * taux_reduit;
    taux_reduit_applique = true;
  } else {
    // Taux réduit sur la tranche inférieure, taux normal sur le reste
    is_du =
      seuil_proratise * taux_reduit +
      (resultat_fiscal - seuil_proratise) * taux_normal;
    taux_reduit_applique = true; // partiellement
  }

  return {
    resultat_fiscal_is: resultat_fiscal,
    taux_applicable: taux_normal,
    is_du: Math.round(is_du * 100) / 100,
    taux_reduit_applique,
  };
}

/**
 * Calcule les dividendes distribuables après IS et réserves légales.
 */
export function f_dividendes_distribuables(
  resultat_apres_is: number,
  reserve_legale_taux: number = 0.05,
  reserve_legale_plafond_fraction_capital: number = 0.1
): number {
  if (resultat_apres_is <= 0) return 0;

  // Réserve légale obligatoire (5 % du résultat jusqu'à 10 % du capital)
  // On applique une simplification : 5 % du résultat pour la réserve
  const reserve = resultat_apres_is * reserve_legale_taux;
  return Math.max(0, resultat_apres_is - reserve);
}

/**
 * Calcule les dividendes nets perçus (après prélèvements sociaux et PFU).
 *
 * Pour assimilé-salarié (SASU/SELAS) : PFU 31,4 % (IR 12,8 % + PS 18,6 %)
 * Pour TNS (EURL/SELARL) : dividendes hors franchise soumis aux cotisations TNS
 */
export function f_dividendes_nets_assimile(
  dividendes_distribuables: number,
  params: FP
): number {
  const ps = params.social.CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_ASSIMILE;
  // Les dividendes assimilé-salarié sont soumis aux PS (18,6 %) mais pas aux cotisations sociales
  // IR sera calculé séparément par méthode différentielle
  return dividendes_distribuables * (1 - ps.taux_prelevements_sociaux_2026);
}
