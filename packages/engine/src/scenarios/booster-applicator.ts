/**
 * scenarios/booster-applicator.ts — Application des boosters aux calculs
 *
 * Chaque booster agit sur une assiette précise :
 * - B01 ZFRR / B02 ZFRR+ : agit sur RESULTAT_FISCAL (IS ou IR)
 * - B03 QPV/ZFU : agit sur RESULTAT_FISCAL avec proratisation CA zone
 * - B04 ACRE : gérée dans les calculateurs, car l'assiette dépend du régime
 * - B05 ARCE : flux trésorerie externe à NET_APRES_IR (SUPER_NET uniquement)
 * - B06 ZIP/ZAC : aide forfaitaire ajoutée à SUPER_NET (Santé, V2)
 */

import type { BoosterId, UserInput } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";

type FP = typeof FiscalParamsType;

export interface BoosterApplicationResult {
  reduction_cotisations: number;
  exoneration_fiscale: number;
  aide_tresorerie: number;
  fiabilite_degradee: boolean;
  avertissement?: string;
}

/**
 * Applique l'ensemble des boosters actifs sur les valeurs calculées.
 * Chaque booster n'agit que sur son assiette précise.
 */
export function appliquerBoosters(
  boosters: BoosterId[],
  cotisations_brutes: number,
  resultat_fiscal: number,
  input: UserInput,
  params: FP,
  annee_dans_dispositif: number,
  scenario_id: string
): BoosterApplicationResult {
  let reduction_cotisations = 0;
  let exoneration_fiscale = 0;
  let aide_tresorerie = 0;
  let fiabilite_degradee = false;
  const avertissements: string[] = [];

  for (const booster of boosters) {
    switch (booster) {
      case "BOOST_ACRE": {
        // ACRE is computed in the calculators where the definitive social base is known.
        void cotisations_brutes;
        void input;
        void params;
        break;
      }

      case "BOOST_ARCE": {
        // TODO [AMBIGUÏTÉ] : CFG_ARCE_ACTIVE / CFG_TAUX_ARCE — modalités 2026 à confirmer
        // Variables concernées : CFG_ARCE_ACTIVE, CFG_TAUX_ARCE
        // Impact : montant ARCE versé en capital (flux trésorerie, pas NET_APRES_IR)
        // Décision requise avant de finaliser
        const arceResult = _appliquerARCE(input, params);
        aide_tresorerie += arceResult.aide;
        fiabilite_degradee = true;
        avertissements.push(
          "ARCE modélisée comme flux de trésorerie externe — non incluse dans NET_APRES_IR récurrent. " +
            "Montant estimé d'après les droits ARE déclarés."
        );
        break;
      }

      case "BOOST_ZFRR":
      case "BOOST_ZFRR_PLUS": {
        const r = _appliquerZFRR(resultat_fiscal, annee_dans_dispositif, params);
        exoneration_fiscale += r.exoneration;
        if (r.avertissement) avertissements.push(r.avertissement);
        break;
      }

      case "BOOST_QPV": {
        const r = _appliquerQPV(resultat_fiscal, annee_dans_dispositif, input, params);
        exoneration_fiscale += r.exoneration;
        if (r.avertissement) avertissements.push(r.avertissement);
        break;
      }

      case "BOOST_ZFU_STOCK": {
        const r = _appliquerZFUStock(resultat_fiscal, annee_dans_dispositif, params);
        exoneration_fiscale += r.exoneration;
        if (r.avertissement) avertissements.push(r.avertissement);
        break;
      }

      case "BOOST_ZIP_ZAC": {
        // V2 — professionnel de santé uniquement
        aide_tresorerie += _getMontantZIPZAC(params);
        break;
      }

      case "BOOST_CPAM":
      case "BOOST_RAAP_REDUIT":
        // Gérés dans les calculators spécifiques santé/artiste
        break;
    }
  }

  return {
    reduction_cotisations,
    exoneration_fiscale,
    aide_tresorerie,
    fiabilite_degradee,
    avertissement: avertissements.length > 0 ? avertissements.join(" | ") : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers boosters
// ─────────────────────────────────────────────────────────────────────────────

function _appliquerARCE(
  input: UserInput,
  params: FP
): { aide: number } {
  const droits = input.DROITS_ARE_RESTANTS ?? 0;
  const taux = params.aides.CFG_TAUX_ARCE;
  return { aide: droits * taux };
}

function _appliquerZFRR(
  resultat_fiscal: number,
  annee_dans_dispositif: number,
  params: FP
): { exoneration: number; avertissement?: string } {
  const phases = params.zones.CFG_ZFRR_TAUX_PHASES;
  const phase = phases.find((p) => p.annee === annee_dans_dispositif);

  if (!phase) {
    return {
      exoneration: 0,
      avertissement:
        `ZFRR : aucune phase trouvée pour l'année ${annee_dans_dispositif} dans le dispositif. ` +
        "Exonération non appliquée.",
    };
  }

  const plafond = params.zones.CFG_ZFRR_IMPOTS_CIBLES.plafond_benefice_exonere_par_an;
  const base_exoneree = Math.min(resultat_fiscal, plafond);
  const exoneration = base_exoneree * phase.taux;

  return { exoneration };
}

function _appliquerQPV(
  resultat_fiscal: number,
  annee_dans_dispositif: number,
  input: UserInput,
  params: FP
): { exoneration: number; avertissement?: string } {
  // TODO [AMBIGUÏTÉ] : CFG_QPV_CONDITIONS_EFFECTIF — critères 2026 à confirmer
  // Variables concernées : CFG_QPV_CONDITIONS_EFFECTIF, CFG_QPV_CONDITIONS_CA_BILAN
  // Impact : éligibilité QPV selon taille d'entreprise
  // Décision requise avant de finaliser

  const phases = params.zones.CFG_QPV_DUREE_ET_PHASES;
  const phase = phases.find((p) => p.annee === annee_dans_dispositif);

  if (!phase) {
    return {
      exoneration: 0,
      avertissement:
        `QPV : aucune phase trouvée pour l'année ${annee_dans_dispositif}. ` +
        "Exonération non appliquée.",
    };
  }

  // Proratisation si activité non sédentaire
  const partCA = input.PART_CA_REALISEE_EN_ZONE ?? 1.0;
  const base_exoneree = resultat_fiscal * partCA;
  const exoneration = base_exoneree * phase.taux;

  return {
    exoneration,
    avertissement:
      partCA < 1
        ? `QPV : exonération proratisée à ${partCA * 100} % du bénéfice (part CA en zone).`
        : undefined,
  };
}

function _appliquerZFUStock(
  resultat_fiscal: number,
  annee_dans_dispositif: number,
  params: FP
): { exoneration: number; avertissement?: string } {
  // TODO [AMBIGUÏTÉ] : CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS — modalités de sortie à confirmer
  // Variables concernées : CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS
  // Impact : calcul de l'exonération résiduelle pour les entreprises déjà en ZFU

  const phases = params.zones.CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS.phases_degressivite;
  const phase = phases.find((p) => p.annee_relative === annee_dans_dispositif);

  if (!phase) {
    return {
      exoneration: 0,
      avertissement:
        "ZFU stock droits antérieurs : phase non trouvée. " +
        "Fiabilité partielle — à confirmer avec un expert.",
    };
  }

  return {
    exoneration: resultat_fiscal * phase.taux,
    avertissement: "ZFU stock droits antérieurs : calcul basé sur droits acquis. Fiabilité partielle.",
  };
}

function _getMontantZIPZAC(params: FP): number {
  // ZIP/ZAC — V2 Santé uniquement
  const sante = params.sante;
  if (!sante || !("CFG_PARAM_ZIP_ZAC_MONTANT_FORFAITAIRE" in sante)) return 0;
  const montant = (sante as Record<string, unknown>)["CFG_PARAM_ZIP_ZAC_MONTANT_FORFAITAIRE"];
  return typeof montant === "number" ? montant : 0;
}
