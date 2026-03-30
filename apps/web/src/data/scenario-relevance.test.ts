import { describe, expect, it } from "vitest";
import type { DetailCalculScenario, IntermediairesCalcul } from "@wymby/types";
import { isRelevantForProfile } from "./scenario-relevance.js";

function buildScenario(base_id: DetailCalculScenario["base_id"]): DetailCalculScenario {
  const intermediaires: IntermediairesCalcul = {
    CA_HT_RETENU: 60_000,
    CA_TTC_RETENU: 60_000,
    TVA_COLLECTEE_THEORIQUE: 0,
    TVA_DEDUCTIBLE_RETENUE: 0,
    TVA_NETTE_DUE: 0,
    RECETTES_PRO_RETENUES: 60_000,
    ABATTEMENT_FORFAITAIRE: 0,
    CHARGES_DEDUCTIBLES: 0,
    DOTATIONS_AMORTISSEMENTS: 0,
    RESULTAT_COMPTABLE: 0,
    RESULTAT_FISCAL_AVANT_EXONERATIONS: 0,
    RESULTAT_FISCAL_APRES_EXONERATIONS: 0,
    ASSIETTE_SOCIALE_BRUTE: 0,
    ASSIETTE_SOCIALE_APRES_AIDES: 0,
    COTISATIONS_SOCIALES_BRUTES: 0,
    REDUCTION_ACRE: 0,
    AIDE_CPAM_IMPUTEE: 0,
    EXONERATION_SOCIALE_ZONE: 0,
    COTISATIONS_SOCIALES_NETTES: 0,
    REMUNERATION_DEDUCTIBLE: 0,
    REMUNERATION_NETTE_DIRIGEANT: 0,
    DIVIDENDES_DISTRIBUABLES: 0,
    DIVIDENDES_NETS_PERCUS: 0,
    BASE_IR_SCENARIO: 0,
    BASE_IR_FOYER_TOTALE: 0,
    IR_THEORIQUE_FOYER: 0,
    IR_ATTRIBUABLE_SCENARIO: 0,
    IS_DU_SCENARIO: 0,
    NET_AVANT_IR: 0,
    NET_APRES_IR: 50_000,
    COUT_TOTAL_SOCIAL_FISCAL: 0,
    SUPER_NET: 0,
    AIDE_ARCE_TRESORERIE: 0,
  };

  return {
    scenario_id: `${base_id}__TEST`,
    base_id,
    option_tva: "TVA_FRANCHISE",
    option_vfl: "VFL_NON",
    boosters_actifs: [],
    intermediaires,
    scores: {
      SCORE_COMPLEXITE_ADMIN: 0,
      SCORE_ROBUSTESSE: 0,
      DEPENDANCE_AIDES_RATIO: 0,
      SCORE_GLOBAL_SCENARIO: 0,
      TAUX_PRELEVEMENTS_GLOBAL: 0,
    },
    niveau_fiabilite: "complet",
    avertissements_scenario: [],
  };
}

describe("isRelevantForProfile", () => {
  it("ne masque pas un scenario societe quand la question n'a pas ete renseignee", () => {
    const scenario = buildScenario("G_EURL_IS");

    expect(
      isRelevantForProfile(scenario, {
        ca: 60_000,
        interet_societe_explicite: false,
        question_societe_renseignee: false,
        reference_net: 45_000,
      })
    ).toBe(true);
  });

  it("masque un scenario societe si l'utilisateur a explicitement refuse", () => {
    const scenario = buildScenario("G_EURL_IS");

    expect(
      isRelevantForProfile(scenario, {
        ca: 60_000,
        interet_societe_explicite: false,
        question_societe_renseignee: true,
        reference_net: 45_000,
      })
    ).toBe(false);
  });

  it("conserve un scenario societe si l'utilisateur a explicitement exprime son interet", () => {
    const scenario = buildScenario("G_EURL_IS");

    expect(
      isRelevantForProfile(scenario, {
        ca: 60_000,
        interet_societe_explicite: true,
        question_societe_renseignee: true,
        reference_net: 45_000,
      })
    ).toBe(true);
  });
});
