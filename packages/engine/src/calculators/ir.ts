/**
 * calculators/ir.ts — Calcul de l'Impôt sur le Revenu (méthode différentielle)
 *
 * Implémente la méthode différentielle décrite dans ALGORITHME.md section 5.1 :
 *   IR_scenario = IR_foyer(avec_revenu) − IR_foyer(sans_revenu_scenario)
 *
 * Les calculs IR sont TOUJOURS des estimations si les données foyer
 * sont incomplètes — la qualité est systématiquement qualifiée.
 */

import type { TrancheIR } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import type { ResultatIR } from "@wymby/types";

type FP = typeof FiscalParamsType;

/**
 * Applique le barème progressif IR sur une base imposable et un nombre de parts.
 * Implémente le mécanisme du quotient familial avec plafonnement.
 *
 * @param base_imposable — Revenu net global imposable du foyer
 * @param nb_parts — Nombre de parts fiscales
 * @param params — Paramètres fiscaux
 * @returns Impôt brut sur le revenu avant décote
 */
export function f_bareme_progressif(
  base_imposable: number,
  nb_parts: number,
  params: FP
): number {
  if (base_imposable <= 0) return 0;

  const tranches: TrancheIR[] = params.fiscal.CFG_BAREME_IR_TRANCHES;
  const qfParams = params.fiscal.CFG_REGLE_QUOTIENT_FAMILIAL;
  const plafondQF = params.fiscal.CFG_PLAFOND_AVANTAGE_QF;

  // Calcul de l'impôt pour le quotient familial exact
  const impot_avec_qf = _calculerImpotBrut(base_imposable, nb_parts, tranches);

  // Calcul de l'impôt pour une seule part (référence pour le plafonnement)
  const nb_parts_reference =
    qfParams.parts.couple_marie_pacse !== nb_parts
      ? qfParams.parts.celibataire
      : qfParams.parts.couple_marie_pacse;

  const impot_reference = _calculerImpotBrut(
    base_imposable,
    nb_parts_reference,
    tranches
  );

  // Plafonnement de l'avantage QF
  const demi_parts_suplm = (nb_parts - nb_parts_reference) * 2;
  const avantage_max = demi_parts_suplm * plafondQF.par_demi_part_droit_commun;
  const avantage_reel = impot_reference - impot_avec_qf;

  const impot_plafonne =
    avantage_reel > avantage_max
      ? impot_reference - avantage_max
      : impot_avec_qf;

  // Application de la décote
  const impot_apres_decote = _appliquerDecote(impot_plafonne, nb_parts, params);

  return Math.max(0, impot_apres_decote);
}

/**
 * Calcule l'IR attribuable au scénario par la méthode différentielle.
 *
 * Si AUTRES_REVENUS_FOYER_IMPOSABLES est absent, bascule en mode estimation
 * et émet un avertissement.
 */
export function f_ir_attribuable_scenario(
  base_ir_scenario: number,
  autres_revenus_foyer: number | undefined,
  autres_charges_foyer: number | undefined,
  nb_parts: number,
  params: FP
): ResultatIR {
  const base_hors_scenario = Math.max(
    0,
    (autres_revenus_foyer ?? 0) - (autres_charges_foyer ?? 0)
  );

  const base_avec_scenario = Math.max(0, base_hors_scenario + base_ir_scenario);

  const ir_foyer_avec = f_bareme_progressif(base_avec_scenario, nb_parts, params);
  const ir_foyer_sans = f_bareme_progressif(base_hors_scenario, nb_parts, params);
  const ir_attribuable = Math.max(0, ir_foyer_avec - ir_foyer_sans);

  const mode: ResultatIR["mode"] =
    autres_revenus_foyer === undefined ? "estimation" : "complet";

  return {
    ir_theorique_foyer: ir_foyer_avec,
    ir_foyer_sans_scenario: ir_foyer_sans,
    ir_attribuable_scenario: ir_attribuable,
    mode,
    avertissement:
      mode === "estimation"
        ? "Autres revenus du foyer non renseignés : IR calculé par méthode différentielle " +
          "en supposant l'activité comme seul revenu. Fiabilité marquée 'estimation'. " +
          "Fournir les revenus du foyer pour un calcul précis."
        : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────

function _calculerImpotBrut(
  base_imposable: number,
  nb_parts: number,
  tranches: TrancheIR[]
): number {
  if (base_imposable <= 0 || nb_parts <= 0) return 0;

  const quotient = base_imposable / nb_parts;
  let impot_par_part = 0;

  for (const tranche of tranches) {
    const borne_inf = tranche.de;
    const borne_sup = tranche.a ?? Infinity;
    const taux = tranche.taux;

    if (quotient <= borne_inf) break;

    const tranche_imposable = Math.min(quotient, borne_sup) - borne_inf;
    impot_par_part += tranche_imposable * taux;
  }

  return impot_par_part * nb_parts;
}

function _appliquerDecote(
  impot_brut: number,
  nb_parts: number,
  params: FP
): number {
  const decoteParams = params.fiscal.CFG_DECOTE_IR;
  const isCouple = nb_parts >= 2;

  const forfait = isCouple
    ? decoteParams.forfait_couple
    : decoteParams.forfait_celibataire;

  const seuil = isCouple
    ? decoteParams.seuil_couple
    : decoteParams.seuil_celibataire;

  if (impot_brut > seuil) return impot_brut;

  const decote = Math.max(
    0,
    forfait - decoteParams.taux * impot_brut
  );

  return Math.max(0, impot_brut - decote);
}
