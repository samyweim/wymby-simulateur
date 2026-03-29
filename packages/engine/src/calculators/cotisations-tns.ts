/**
 * calculators/cotisations-tns.ts — Cotisations sociales TNS (régime réel)
 *
 * Implémente les barèmes SSI/BIC et CIPAV avec :
 * - Cotisations par branche (maladie, retraite base/complémentaire, etc.)
 * - Assiette Sociale Unique (ASU) 2026 — abattement 26 %
 * - Cotisations minimales forfaitaires si résultat nul ou négatif
 */

import type { TrancheCotisation, ResultatCotisationsTNS } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";

type FP = typeof FiscalParamsType;
type TnsParamBIC = FP["social"]["CFG_TAUX_SOCIAL_TNS_BIC"];

/**
 * Calcule l'assiette sociale après application de l'ASU 2026.
 * Assiette = max(plancher, min(revenu_net × 0.74, plafond))
 */
export function f_assiette_sociale_ASU(
  revenu_professionnel_net: number,
  params: FP
): { assiette: number; hypothese?: string } {
  const asuParams = params.social.CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR;
  const abattement = asuParams.abattement_forfaitaire;
  const plancher = asuParams.plancher.valeur_2026;
  const plafond = asuParams.plafond.valeur_2026;

  if (revenu_professionnel_net <= 0) {
    return {
      assiette: plancher,
      hypothese:
        "Résultat nul ou négatif : assiette sociale = plancher ASU. " +
        "Cotisations minimales forfaitaires appliquées.",
    };
  }

  const assiette_calculee = revenu_professionnel_net * (1 - abattement);
  const assiette = Math.max(plancher, Math.min(assiette_calculee, plafond));

  return { assiette };
}

/**
 * Calcule les cotisations TNS BIC/BNC SSI par branche.
 * Retourne le détail par branche et le total.
 */
export function f_cotisations_tns_bic(
  assiette: number,
  params: FP
): ResultatCotisationsTNS {
  const tnsParams: TnsParamBIC = params.social.CFG_TAUX_SOCIAL_TNS_BIC;
  const pass = params.referentiels.CFG_PASS_2026;
  const detail: Record<string, number> = {};
  let cotisations_brutes = 0;

  // ── Maladie-maternité (tranches progressives) ──────────────────────────
  const maladie = _calculerCotisationsTranches(
    assiette,
    tnsParams.maladie_maternite.tranches,
    pass
  );
  detail["maladie_maternite"] = maladie;
  cotisations_brutes += maladie;

  // ── Indemnités journalières (plafonnée à 5 PASS) ─────────────────────
  const assiette_ij = Math.min(assiette, tnsParams.indemnites_journalieres.plafond_pass * pass);
  const ij = assiette_ij * tnsParams.indemnites_journalieres.taux;
  detail["indemnites_journalieres"] = ij;
  cotisations_brutes += ij;

  // ── Retraite base plafonnée (1 PASS) ─────────────────────────────────
  const assiette_rb = Math.min(assiette, tnsParams.retraite_base_plafonnee.plafond_pass * pass);
  const rb = assiette_rb * tnsParams.retraite_base_plafonnee.taux;
  detail["retraite_base_plafonnee"] = rb;
  cotisations_brutes += rb;

  // ── Retraite base déplafonnée (totalité) ─────────────────────────────
  const rb_dep = assiette * tnsParams.retraite_base_deplafonnee.taux;
  detail["retraite_base_deplafonnee"] = rb_dep;
  cotisations_brutes += rb_dep;

  // ── Retraite complémentaire (tranches PASS) ───────────────────────────
  const rc = _calculerCotisationsTranches(
    assiette,
    tnsParams.retraite_complementaire.tranches,
    pass
  );
  detail["retraite_complementaire"] = rc;
  cotisations_brutes += rc;

  // ── Invalidité-décès (plafonné à 1 PASS) ─────────────────────────────
  const assiette_id = Math.min(assiette, tnsParams.invalidite_deces.plafond_pass * pass);
  const id = assiette_id * tnsParams.invalidite_deces.taux;
  detail["invalidite_deces"] = id;
  cotisations_brutes += id;

  // ── Allocations familiales (tranches progressives) ────────────────────
  const af = _calculerCotisationsTranches(
    assiette,
    tnsParams.allocations_familiales.tranches,
    pass
  );
  detail["allocations_familiales"] = af;
  cotisations_brutes += af;

  // ── CSG-CRDS (assiette abattue 26 %) ─────────────────────────────────
  const assiette_csg = assiette * (1 - tnsParams.csg_crds.assiette_abattement);
  const csg = assiette_csg * tnsParams.csg_crds.taux_total;
  detail["csg_crds"] = csg;
  cotisations_brutes += csg;

  // ── CFP (assiette = PASS entier) ──────────────────────────────────────
  const cfp = pass * tnsParams.cfp.taux_commercant; // taux commerçant par défaut
  detail["cfp"] = cfp;
  cotisations_brutes += cfp;

  // ── Vérification cotisations minimales ───────────────────────────────
  const miniParams = params.social.CFG_COTISATIONS_MINIMALES_TNS_SSI;
  const total_minimal = miniParams.total_minimal_hors_cfp;
  const cotisations_minimales_appliquees = cotisations_brutes < total_minimal;

  if (cotisations_minimales_appliquees) {
    return {
      cotisations_brutes: total_minimal + cfp,
      detail_par_branche: detail,
      cotisations_minimales_appliquees: true,
      avertissement_minimales:
        `Résultat faible : cotisations calculées (${cotisations_brutes.toFixed(0)} €) inférieures ` +
        `au minimum forfaitaire (${total_minimal} €). ` +
        "Cotisations minimales appliquées pour garantir les droits sociaux minimaux.",
    };
  }

  return {
    cotisations_brutes,
    detail_par_branche: detail,
    cotisations_minimales_appliquees: false,
  };
}

/**
 * Calcule les cotisations TNS ACRE hors micro (dégressif).
 * Réduction maximale si assiette ≤ 75 % PASS, dégressif jusqu'à 100 % PASS.
 */
export function f_acre_hors_micro(
  cotisations_brutes: number,
  assiette: number,
  params: FP,
  date_creation?: Date
): number {
  const acreParams = params.aides.CFG_TAUX_REDUCTION_ACRE_HORS_MICRO;
  const pass = params.referentiels.CFG_PASS_2026;

  // Sélection du taux max selon date
  const dateCharniere = new Date("2026-07-01");
  const taux_max =
    !date_creation || date_creation < dateCharniere
      ? acreParams.taux_max_avant_01_07_2026
      : acreParams.taux_max_apres_01_07_2026;

  const seuil_exo = acreParams.seuil_exoneration_totale; // 75 % PASS
  const seuil_fin = acreParams.seuil_sortie_exoneration; // 100 % PASS

  if (assiette <= seuil_exo) {
    return cotisations_brutes * taux_max;
  }

  if (assiette >= seuil_fin) {
    return 0;
  }

  // Dégressif linéaire entre 75 % et 100 % PASS
  const fraction = (seuil_fin - assiette) / (seuil_fin - seuil_exo);
  return cotisations_brutes * taux_max * fraction;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────

function _calculerCotisationsTranches(
  assiette: number,
  tranches: TrancheCotisation[],
  pass: number
): number {
  let cotisation = 0;

  for (const tranche of tranches) {
    const borne_inf = tranche.de_pass * pass;
    const borne_sup = tranche.a_pass !== null ? tranche.a_pass * pass : Infinity;

    if (assiette <= borne_inf) break;

    const assiette_tranche =
      Math.min(assiette, borne_sup) - borne_inf;
    cotisation += assiette_tranche * tranche.taux;
  }

  return cotisation;
}
