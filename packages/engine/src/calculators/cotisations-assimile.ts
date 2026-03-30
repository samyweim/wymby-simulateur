/**
 * calculators/cotisations-assimile.ts — Cotisations assimilé-salarié (Président SASU/SELAS)
 *
 * Le président SASU/SELAS est soumis au régime général (assimilé-salarié),
 * avec parts employeur + salarié. Pas de cotisation chômage pour le président.
 *
 * Méthode simplifiée : les taux globaux moyens sont extraits des paramètres.
 * Précision maximale : ~2–3 % d'écart vs calcul ligne par ligne.
 */

import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";

type FP = typeof FiscalParamsType;

export interface ResultatCotisationsAssimile {
  cotisations_patronales: number;
  cotisations_salariales: number;
  cotisations_totales: number;
  remuneration_nette: number;
  cout_total_remuneration: number;
  detail: Record<string, number>;
}

/**
 * Calcule les cotisations assimilé-salarié pour le président SASU/SELAS.
 *
 * Calcul ligne par ligne à partir des taux du paramétrage.
 * Le président SASU ne cotise PAS à l'assurance chômage.
 *
 * @param remuneration_brute — Rémunération brute du président (annuelle)
 * @param params — Paramètres fiscaux
 */
export function f_cotisations_assimile_salarie(
  remuneration_brute: number,
  params: FP
): ResultatCotisationsAssimile {
  const lignes = params.social.CFG_TAUX_SOCIAL_ASSIMILE_SALARIE.lignes;
  const pmss_annuel = params.referentiels.CFG_PMSS_2026 * 12;
  const pass = params.referentiels.CFG_PASS_2026;

  const detail: Record<string, number> = {};
  let cotisations_patronales = 0;
  let cotisations_salariales = 0;

  // Assiette brute plafonnée pour CSG/CRDS : 98,25 % si ≤ 4 PASS
  const assiette_csg =
    remuneration_brute <= pass * 4
      ? remuneration_brute * 0.9825
      : remuneration_brute;

  for (const ligne of lignes) {
    // Exclure assurance chômage pour le président SASU
    if (ligne.libelle === "Assurance chômage") continue;
    if (ligne.libelle === "AGS (Garantie des salaires)") continue;
    if (ligne.libelle === "FNAL (entreprises ≥ 50 salariés)") continue;

    let assiette = remuneration_brute;

    // Adapter l'assiette selon la description
    if (ligne.assiette.includes("Tranche A") || ligne.assiette.includes("PMSS")) {
      assiette = Math.min(remuneration_brute, pmss_annuel);
    } else if (ligne.assiette.includes("4 PASS")) {
      assiette = Math.min(remuneration_brute, pass * 4);
    } else if (ligne.assiette.includes("98,25 %")) {
      assiette = assiette_csg;
    }

    const patronal = assiette * (ligne.part_employeur ?? 0);
    const salarial = assiette * (ligne.part_salarie ?? 0);

    if (patronal > 0) {
      detail[`${ligne.libelle}_patronal`] = patronal;
      cotisations_patronales += patronal;
    }
    if (salarial > 0) {
      detail[`${ligne.libelle}_salarial`] = salarial;
      cotisations_salariales += salarial;
    }
  }

  if (remuneration_brute > pmss_annuel) {
    const excedent = remuneration_brute - pmss_annuel;
    const lissageAnnuelEmployeur =
      0.0855 + 0.001 + 0.0472 + 0.0129;
    cotisations_patronales += excedent * lissageAnnuelEmployeur;
  }

  const cotisations_totales = cotisations_patronales + cotisations_salariales;
  const remuneration_nette = remuneration_brute - cotisations_salariales;
  const cout_total_remuneration = remuneration_brute + cotisations_patronales;

  return {
    cotisations_patronales,
    cotisations_salariales,
    cotisations_totales,
    remuneration_nette,
    cout_total_remuneration,
    detail,
  };
}
