import { describe, expect, it } from "vitest";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import { runEngine } from "../index.js";

describe("Couverture santé complémentaire", () => {
  it("calcule les scénarios EI réel santé secteurs 2 OPTAM, 2 non-OPTAM et 3", () => {
    const common = {
      ANNEE_SIMULATION: "2026" as const,
      SEGMENT_ACTIVITE: "santé" as const,
      SOUS_SEGMENT_ACTIVITE: "medecin" as const,
      CA_ENCAISSE_UTILISATEUR: 120_000,
      INPUT_MODE_CA: "HT" as const,
      CHARGES_DEDUCTIBLES: 30_000,
      DOTATIONS_AMORTISSEMENTS: 5_000,
      EST_PROFESSION_SANTE: true,
      SITUATION_FAMILIALE: "célibataire" as const,
      NOMBRE_PARTS_FISCALES: 1,
      AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
      DATE_CREATION_ACTIVITE: "2022-01-01",
    };

    const optam = runEngine(
      {
        ...common,
        EST_CONVENTIONNE: true,
        EST_ELIGIBLE_AIDE_CPAM: true,
        SECTEUR_CONVENTIONNEL: "secteur_2_optam",
      },
      FISCAL_PARAMS_2026
    );
    const nonOptam = runEngine(
      {
        ...common,
        EST_CONVENTIONNE: true,
        EST_ELIGIBLE_AIDE_CPAM: false,
        SECTEUR_CONVENTIONNEL: "secteur_2_non_optam",
      },
      FISCAL_PARAMS_2026
    );
    const horsConvention = runEngine(
      {
        ...common,
        EST_CONVENTIONNE: false,
        EST_ELIGIBLE_AIDE_CPAM: false,
        SECTEUR_CONVENTIONNEL: "hors_convention",
      },
      FISCAL_PARAMS_2026
    );

    const calcOptam = optam.calculs_par_scenario.find((c) => c.base_id === "S_EI_REEL_SECTEUR_2_OPTAM");
    const calcNonOptam = nonOptam.calculs_par_scenario.find((c) => c.base_id === "S_EI_REEL_SECTEUR_2_NON_OPTAM");
    const calcHorsConvention = horsConvention.calculs_par_scenario.find(
      (c) => c.base_id === "S_EI_REEL_SECTEUR_3_HORS_CONVENTION"
    );

    expect(calcOptam).toBeTruthy();
    expect(calcNonOptam).toBeTruthy();
    expect(calcHorsConvention).toBeTruthy();

    expect(calcOptam?.niveau_fiabilite).toBe("estimation");
    expect(calcNonOptam?.niveau_fiabilite).toBe("estimation");
    expect(calcHorsConvention?.niveau_fiabilite).toBe("estimation");

    expect(calcOptam?.intermediaires.COTISATIONS_SOCIALES_NETTES ?? 0).toBeGreaterThan(0);
    expect(calcNonOptam?.intermediaires.COTISATIONS_SOCIALES_NETTES ?? 0).toBeGreaterThan(
      calcOptam?.intermediaires.COTISATIONS_SOCIALES_NETTES ?? 0
    );
    expect(calcHorsConvention?.intermediaires.AIDE_CPAM_IMPUTEE).toBe(0);
  });

  it("calcule les scénarios SELARL et SELAS santé avec avertissements explicites", () => {
    const output = runEngine(
      {
        ANNEE_SIMULATION: "2026",
        SEGMENT_ACTIVITE: "santé",
        SOUS_SEGMENT_ACTIVITE: "medecin",
        CA_ENCAISSE_UTILISATEUR: 180_000,
        INPUT_MODE_CA: "HT",
        CHARGES_DEDUCTIBLES: 40_000,
        DOTATIONS_AMORTISSEMENTS: 10_000,
        EST_PROFESSION_SANTE: true,
        EST_CONVENTIONNE: true,
        EST_ELIGIBLE_AIDE_CPAM: true,
        SECTEUR_CONVENTIONNEL: "secteur_1",
        SITUATION_FAMILIALE: "célibataire",
        NOMBRE_PARTS_FISCALES: 1,
        AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
        DATE_CREATION_ACTIVITE: "2021-01-01",
      },
      FISCAL_PARAMS_2026
    );

    const selarl = output.calculs_par_scenario.find((c) => c.base_id === "S_SELARL_IS");
    const selas = output.calculs_par_scenario.find((c) => c.base_id === "S_SELAS_IS");

    expect(selarl).toBeTruthy();
    expect(selas).toBeTruthy();
    expect(selarl?.niveau_fiabilite).toBe("estimation");
    expect(selas?.niveau_fiabilite).toBe("estimation");
    expect(selarl?.avertissements_scenario).toContain(
      "SIMULATION_SOCIETE_SANTE_BASEE_SUR_MODELE_SOCIETE_GENERALISTE"
    );
    expect(selas?.avertissements_scenario).toContain(
      "SIMULATION_SOCIETE_SANTE_BASEE_SUR_MODELE_SOCIETE_GENERALISTE"
    );
  });
});
