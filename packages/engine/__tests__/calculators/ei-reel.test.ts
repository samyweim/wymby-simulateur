/**
 * Tests unitaires — calculators/ei-reel.ts
 *
 * Couvre : BIC IR, BIC IS, BNC IR, résultat négatif (cotisations minimales),
 * ACRE, TVA, fiabilité partielle/estimation.
 */

import { describe, it, expect } from "vitest";
import { calculerEIReel } from "../../src/calculators/ei-reel.js";
import { FISCAL_PARAMS_2026 } from "@wymby/config";

const P = FISCAL_PARAMS_2026;

const BASE_INPUT = {
  RECETTES_PRO_RETENUES: 60_000,
  CHARGES_DECAISSEES: 15_000,
  CHARGES_DEDUCTIBLES: 15_000,
  TVA_NETTE_DUE: 0,
  nombre_parts_fiscales: 1,
};

describe("calculerEIReel — BIC IR", () => {
  it("Résultat comptable = recettes - charges déductibles", () => {
    const result = calculerEIReel({ ...BASE_INPUT, type_ei: "BIC_IR" }, P);
    const rc = result.intermediaires.RESULTAT_COMPTABLE;
    expect(rc).toBeCloseTo(BASE_INPUT.RECETTES_PRO_RETENUES - BASE_INPUT.CHARGES_DEDUCTIBLES, 0);
  });

  it("Sans autres revenus foyer : fiabilité = estimation", () => {
    const result = calculerEIReel({ ...BASE_INPUT, type_ei: "BIC_IR" }, P);
    expect(result.niveau_fiabilite).toBe("estimation");
  });

  it("Avec autres revenus foyer : fiabilité complet", () => {
    const result = calculerEIReel(
      { ...BASE_INPUT, type_ei: "BIC_IR", autres_revenus_foyer: 20_000 },
      P
    );
    expect(result.niveau_fiabilite).toBe("complet");
  });

  it("ACRE réduit les cotisations nettes", () => {
    const sans = calculerEIReel({ ...BASE_INPUT, type_ei: "BIC_IR" }, P);
    const avec = calculerEIReel(
      { ...BASE_INPUT, type_ei: "BIC_IR", acre_active: true, date_creation: new Date("2026-01-01") },
      P
    );
    expect(avec.intermediaires.COTISATIONS_SOCIALES_NETTES!).toBeLessThan(
      sans.intermediaires.COTISATIONS_SOCIALES_NETTES!
    );
  });

  it("Résultat fiscal négatif : cotisations minimales TNS appliquées", () => {
    const result = calculerEIReel(
      {
        RECETTES_PRO_RETENUES: 5_000,
        CHARGES_DECAISSEES: 30_000,
        CHARGES_DEDUCTIBLES: 30_000,
        TVA_NETTE_DUE: 0,
        type_ei: "BIC_IR",
        nombre_parts_fiscales: 1,
        autres_revenus_foyer: 0,
      },
      P
    );

    const minimum = P.social.CFG_COTISATIONS_MINIMALES_TNS_SSI.total_minimal_hors_cfp;
    expect(result.intermediaires.COTISATIONS_SOCIALES_BRUTES!).toBeGreaterThanOrEqual(minimum);
    expect(result.avertissements.some((a) => a.toLowerCase().includes("minimal"))).toBe(true);
  });
});

describe("calculerEIReel — BIC IS", () => {
  it("IS calculé sur le résultat après rémunération dirigeant", () => {
    const result = calculerEIReel(
      {
        ...BASE_INPUT,
        type_ei: "BIC_IS",
        remuneration_dirigeant: 20_000,
        autres_revenus_foyer: 0,
      },
      P
    );

    // Résultat comptable = recettes - charges - rémunération
    const rc_attendu =
      BASE_INPUT.RECETTES_PRO_RETENUES -
      BASE_INPUT.CHARGES_DEDUCTIBLES -
      20_000;
    expect(result.intermediaires.RESULTAT_COMPTABLE).toBeCloseTo(rc_attendu, 0);
    expect(result.intermediaires.IS_DU_SCENARIO!).toBeGreaterThan(0);
    expect(result.intermediaires.IR_ATTRIBUABLE_SCENARIO!).toBeGreaterThanOrEqual(0);
  });

  it("ARCE : SUPER_NET ≠ NET_APRES_IR quand droits ARE présents", () => {
    const DROITS = 8_000;
    const result = calculerEIReel(
      {
        ...BASE_INPUT,
        type_ei: "BIC_IS",
        remuneration_dirigeant: 25_000,
        autres_revenus_foyer: 0,
        droits_are_restants: DROITS,
      },
      P
    );

    const arce = result.intermediaires.AIDE_ARCE_TRESORERIE ?? 0;
    const expected_arce = DROITS * P.aides.CFG_TAUX_ARCE;
    expect(arce).toBeCloseTo(expected_arce, 0);
    expect(result.intermediaires.SUPER_NET!).toBeCloseTo(
      (result.intermediaires.NET_APRES_IR ?? 0) + arce,
      0
    );
  });
});

describe("calculerEIReel — BNC IR", () => {
  it("Mêmes règles que BIC IR pour résultat fiscal", () => {
    const result_bic = calculerEIReel(
      { ...BASE_INPUT, type_ei: "BIC_IR", autres_revenus_foyer: 0 },
      P
    );
    const result_bnc = calculerEIReel(
      { ...BASE_INPUT, type_ei: "BNC_IR", autres_revenus_foyer: 0 },
      P
    );

    // Résultat comptable identique (même charges)
    expect(result_bnc.intermediaires.RESULTAT_COMPTABLE).toBeCloseTo(
      result_bic.intermediaires.RESULTAT_COMPTABLE!,
      0
    );
  });

  it("Charges nulles : avertissement émis et fiabilité dégradée", () => {
    const result = calculerEIReel(
      {
        RECETTES_PRO_RETENUES: 40_000,
        CHARGES_DECAISSEES: 0,
        CHARGES_DEDUCTIBLES: 0,
        TVA_NETTE_DUE: 0,
        type_ei: "BNC_IR",
        nombre_parts_fiscales: 1,
        // Sans autres_revenus_foyer → IR mode estimation → fiabilité "estimation"
      },
      P
    );

    expect(result.avertissements.some((a) => a.toLowerCase().includes("charges nulles"))).toBe(true);
    // Fiabilité dégradée (partiel ou estimation selon les données manquantes)
    expect(result.niveau_fiabilite).not.toBe("complet");
  });
});
