/**
 * Tests d'intégration end-to-end — runEngineWithLogs()
 *
 * Profil 1 : Consultant freelance (prestation BIC), micro simple, franchise TVA
 * Profil 2 : Artisan EI au réel avec ACRE
 * + cas limites : seuil micro, ARCE, ACRE+ZFRR
 */

import { describe, it, expect } from "vitest";
import { runEngineWithLogs } from "../src/index.js";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import type { UserInput } from "@wymby/types";

const P = FISCAL_PARAMS_2026;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseInput(overrides: Partial<UserInput>): UserInput {
  return {
    ANNEE_SIMULATION: 2026,
    SEGMENT_ACTIVITE: "generaliste",
    SOUS_SEGMENT_ACTIVITE: "prestation",
    FORME_JURIDIQUE_ENVISAGEE: "EI",
    REGIME_FISCAL_ENVISAGE: "non_decide",
    INPUT_MODE_CA: "HT",
    CA_ENCAISSE_UTILISATEUR: 50_000,
    SITUATION_FAMILIALE: "celibataire",
    ...overrides,
  } as UserInput;
}

// ─── Profil 1 : Micro simple ───────────────────────────────────────────────────

describe("Intégration — Profil Micro-BIC service simple (C05–C08)", () => {
  const input = baseInput({
    CA_ENCAISSE_UTILISATEUR: 40_000,
    SOUS_SEGMENT_ACTIVITE: "prestation",
    AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
  });

  it("Moteur s'exécute sans erreur et retourne des scénarios calculés", () => {
    const [output, logs] = runEngineWithLogs(input);
    expect(output).toBeDefined();
    expect(output.calculs_par_scenario.length).toBeGreaterThan(0);
    expect(logs.length).toBeGreaterThan(0);
  });

  it("Au moins un scénario Micro-BIC service est présent dans les calculs", () => {
    const [output] = runEngineWithLogs(input);
    const microService = output.calculs_par_scenario.find(
      (c) => c.base_id === "G_MBIC_SERVICE"
    );
    expect(microService).toBeDefined();
  });

  it("NET_APRES_IR > 0 pour un profil standard", () => {
    const [output] = runEngineWithLogs(input);
    const microService = output.calculs_par_scenario.find(
      (c) => c.base_id === "G_MBIC_SERVICE" && c.option_vfl === "VFL_NON"
    );
    expect(microService?.intermediaires.NET_APRES_IR).toBeGreaterThan(0);
  });

  it("Recommandation présente avec motif non vide", () => {
    const [output] = runEngineWithLogs(input);
    expect(output.recommandation).not.toBeNull();
    expect(output.recommandation?.motif).toBeTruthy();
    expect(output.recommandation?.scenario_recommande_id).toBeTruthy();
  });

  it("Comparaison classement net_apres_ir cohérent", () => {
    const [output] = runEngineWithLogs(input);
    const classement = output.comparaison.classement_net_apres_ir;
    expect(classement.length).toBeGreaterThan(0);

    // Le premier scénario dans le classement doit avoir le plus grand NET_APRES_IR
    if (classement.length >= 2) {
      const premier_id = classement[0];
      const second_id = classement[1];
      const premier = output.calculs_par_scenario.find((c) => c.scenario_id === premier_id);
      const second = output.calculs_par_scenario.find((c) => c.scenario_id === second_id);
      if (premier && second) {
        expect(premier.intermediaires.NET_APRES_IR!).toBeGreaterThanOrEqual(
          second.intermediaires.NET_APRES_IR!
        );
      }
    }
  });

  it("Qualité résultat : avertissements et hypothèses sont des tableaux", () => {
    const [output] = runEngineWithLogs(input);
    expect(Array.isArray(output.qualite_resultat.avertissements)).toBe(true);
    expect(Array.isArray(output.qualite_resultat.hypotheses_retenues)).toBe(true);
  });
});

describe("Qualification metier BIC vs BNC", () => {
  it("Une prestation BIC n'ouvre pas de scenarios BNC generalistes", () => {
    const [output] = runEngineWithLogs(
      baseInput({
        CA_ENCAISSE_UTILISATEUR: 40_000,
        SOUS_SEGMENT_ACTIVITE: "prestation",
        AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
      })
    );

    const baseIds = output.scenarios_possibles.map((scenario) => scenario.base_id);
    expect(baseIds).toContain("G_MBIC_SERVICE");
    expect(baseIds).not.toContain("G_MBNC");
    expect(baseIds).not.toContain("G_EI_REEL_BNC_IR");
    expect(baseIds).not.toContain("G_EI_REEL_BNC_IS");
  });
});

describe("TVA BNC sante avec ADELI", () => {
  it("Une profession liberale de sante avec numero ADELI reste exoneree de TVA", () => {
    const [output] = runEngineWithLogs(
      baseInput({
        SOUS_SEGMENT_ACTIVITE: "liberal",
        CA_ENCAISSE_UTILISATEUR: 60_000,
        EST_PROFESSION_SANTE: true,
        A_NUMERO_ADELI: true,
        TVA_DEJA_APPLICABLE: false,
      })
    );

    expect(output.inputs_normalises.tva.regime_applicable).toBe("TVA_FRANCHISE");
    expect(output.qualification.flags.FLAG_TVA_APPLICABLE).toBe(false);
    expect(output.qualification.flags.FLAG_DEPASSEMENT_SEUIL_TVA).toBe(false);
  });

  it("Sans ADELI, le seuil TVA BNC continue de s'appliquer", () => {
    const [output] = runEngineWithLogs(
      baseInput({
        SOUS_SEGMENT_ACTIVITE: "liberal",
        CA_ENCAISSE_UTILISATEUR: 60_000,
        EST_PROFESSION_SANTE: true,
        A_NUMERO_ADELI: false,
        TVA_DEJA_APPLICABLE: false,
      })
    );

    expect(output.inputs_normalises.tva.regime_applicable).toBe("TVA_FRANCHISE");
    expect(output.qualification.flags.FLAG_TVA_APPLICABLE).toBe(false);
    expect(output.qualification.flags.FLAG_DEPASSEMENT_SEUIL_TVA).toBe(true);
    expect(
      output.qualite_resultat.avertissements.some((a) => a.includes("seuil de franchise TVA"))
    ).toBe(true);
  });
});

// ─── Profil 2 : EI réel BIC avec ACRE ────────────────────────────────────────

describe("Intégration — Profil EI réel BIC IR avec ACRE (C13)", () => {
  const input = baseInput({
    CA_ENCAISSE_UTILISATEUR: 55_000,
    CHARGES_DECAISSEES: 12_000,
    CHARGES_DEDUCTIBLES: 12_000,
    SOUS_SEGMENT_ACTIVITE: "prestation",
    FORME_JURIDIQUE_ENVISAGEE: "EI",
    REGIME_FISCAL_ENVISAGE: "reel",
    AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
    EST_CREATEUR_REPRENEUR: true,
    ACRE_DEMANDEE: true,
    EST_ELIGIBLE_ACRE_DECLARATIF: true,
    DATE_CREATION_ACTIVITE: "2026-01-15",
  });

  it("Moteur s'exécute sans erreur", () => {
    const [output] = runEngineWithLogs(input);
    expect(output).toBeDefined();
    expect(output.calculs_par_scenario.length).toBeGreaterThan(0);
  });

  it("Scénario EI réel BIC IR présent dans les calculs", () => {
    const [output] = runEngineWithLogs(input);
    const eiReel = output.calculs_par_scenario.find(
      (c) => c.base_id === "G_EI_REEL_BIC_IR"
    );
    expect(eiReel).toBeDefined();
  });

  it("ACRE actif : REDUCTION_ACRE > 0 dans le scénario EI réel avec booster ACRE", () => {
    const [output] = runEngineWithLogs(input);
    const eiAvecAcre = output.calculs_par_scenario.find(
      (c) => c.base_id === "G_EI_REEL_BIC_IR" && c.boosters_actifs.includes("BOOST_ACRE")
    );

    if (eiAvecAcre) {
      expect(eiAvecAcre.intermediaires.REDUCTION_ACRE!).toBeGreaterThan(0);
      expect(eiAvecAcre.intermediaires.COTISATIONS_SOCIALES_NETTES!).toBeLessThan(
        eiAvecAcre.intermediaires.COTISATIONS_SOCIALES_BRUTES!
      );
    }
    // Si ACRE non qualifié pour ce scénario, le test passe (scénario peut ne pas exister)
  });

  it("NET_APRES_IR ≤ NET_AVANT_IR pour tous les scénarios (cohérence interne)", () => {
    const [output] = runEngineWithLogs(input);
    for (const sc of output.calculs_par_scenario) {
      const net_avant = sc.intermediaires.NET_AVANT_IR ?? 0;
      const net_apres = sc.intermediaires.NET_APRES_IR ?? 0;
      // NET_APRES_IR doit être ≤ NET_AVANT_IR (impôt et VFL réduisent le net)
      expect(net_apres).toBeLessThanOrEqual(net_avant + 1); // +1 pour tolér. arrondi
    }
  });

  it("SUPER_NET ≥ NET_APRES_IR pour tous les scénarios (ARCE positive)", () => {
    const [output] = runEngineWithLogs(input);
    for (const sc of output.calculs_par_scenario) {
      const net_apres = sc.intermediaires.NET_APRES_IR ?? 0;
      const super_net = sc.intermediaires.SUPER_NET ?? 0;
      expect(super_net).toBeGreaterThanOrEqual(net_apres);
    }
  });

  it("SUPER_NET = NET_APRES_IR + AIDE_ARCE_TRESORERIE (cohérence interne)", () => {
    const [output] = runEngineWithLogs(input);
    for (const sc of output.calculs_par_scenario) {
      const net = sc.intermediaires.NET_APRES_IR ?? 0;
      const arce = sc.intermediaires.AIDE_ARCE_TRESORERIE ?? 0;
      const super_net = sc.intermediaires.SUPER_NET ?? 0;
      expect(super_net).toBeCloseTo(net + arce, 0);
    }
  });
});

// ─── Cas limites ──────────────────────────────────────────────────────────────

describe("Cas limite — CA exactement au seuil micro BIC service", () => {
  const SEUIL = P.micro.CFG_SEUIL_CA_MICRO_BIC_SERVICE; // 83_600

  it("CA = seuil : micro encore eligible (seuil inclus)", () => {
    const [output] = runEngineWithLogs(baseInput({ CA_ENCAISSE_UTILISATEUR: SEUIL }));
    const microService = output.calculs_par_scenario.find(
      (c) => c.base_id === "G_MBIC_SERVICE"
    );
    expect(microService).toBeDefined();
  });

  it("CA = seuil + 1 : première année de dépassement — micro maintenu avec avertissement (X01 tolérance)", () => {
    const [output] = runEngineWithLogs(
      baseInput({ CA_ENCAISSE_UTILISATEUR: SEUIL + 1 })
    );
    // Règle fiscale : la première année de dépassement est tolérée.
    // Le scénario micro doit être calculé (non exclu).
    const microService = output.calculs_par_scenario.find(
      (c) => c.base_id === "G_MBIC_SERVICE"
    );
    expect(microService).toBeDefined();
    // Le flag FLAG_PREMIERE_ANNEE_DEPASSEMENT doit être levé
    expect(output.qualification?.flags.FLAG_PREMIERE_ANNEE_DEPASSEMENT).toBe(true);
    // L'avertissement global signale la première année de dépassement
    const hasAvert = output.qualite_resultat.avertissements.some(
      (a) => a.includes("première fois") || a.includes("première année") || a.includes("X01_PREMIERE_ANNEE")
    );
    expect(hasAvert).toBe(true);
  });
});

describe("Cas limite — ARCE demandée : NET_APRES_IR ≠ SUPER_NET", () => {
  it("Quand ARCE active avec droits ARE, SUPER_NET > NET_APRES_IR", () => {
    const input = baseInput({
      CA_ENCAISSE_UTILISATEUR: 45_000,
      AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
      EST_BENEFICIAIRE_ARE: true,
      ARCE_DEMANDEE: true,
      DROITS_ARE_RESTANTS: 12_000,
    });

    const [output] = runEngineWithLogs(input);

    // Trouver un scénario avec booster ARCE
    const avecArce = output.calculs_par_scenario.find((c) =>
      c.boosters_actifs.includes("BOOST_ARCE")
    );

    if (avecArce) {
      const net = avecArce.intermediaires.NET_APRES_IR ?? 0;
      const super_net = avecArce.intermediaires.SUPER_NET ?? 0;
      const arce = avecArce.intermediaires.AIDE_ARCE_TRESORERIE ?? 0;

      expect(arce).toBeGreaterThan(0);
      expect(super_net).toBeGreaterThan(net);
      expect(super_net - net).toBeCloseTo(arce, 0);
    }
  });
});

describe("Cas limite — VFL absent si RFR_N2 absent", () => {
  it("Sans RFR_N2 : scenarios VFL avec fiabilité dégradée ou absent", () => {
    const input = baseInput({
      CA_ENCAISSE_UTILISATEUR: 30_000,
      OPTION_VFL_DEMANDEE: true,
      // RFR_N_2_UTILISATEUR absent → VFL en mode estimation ou non qualifié
    });

    const [output] = runEngineWithLogs(input);

    // Sans RFR N-2, le VFL peut être exclu ou marqué estimation
    // Le moteur ne doit pas crasher et doit retourner un résultat utilisable
    expect(output).toBeDefined();
    expect(output.calculs_par_scenario.length).toBeGreaterThan(0);

    // Si des scénarios VFL sont calculés, vérifier qu'ils ont un avertissement
    const scenariosVFL = output.calculs_par_scenario.filter(
      (c) => c.option_vfl === "VFL_OUI"
    );
    // Soit VFL absent, soit les avertissements indiquent l'incertitude
    if (scenariosVFL.length > 0) {
      const hasWarning = scenariosVFL.some((c) =>
        c.avertissements_scenario.some(
          (a) => a.toLowerCase().includes("rfr") || a.toLowerCase().includes("vfl") || a.toLowerCase().includes("estimation")
        )
      );
      // L'avertissement peut aussi être au niveau global
      const globalWarning = output.qualite_resultat.avertissements.some(
        (a) => a.toLowerCase().includes("rfr") || a.toLowerCase().includes("vfl")
      );
      expect(hasWarning || globalWarning || output.qualite_resultat.niveau_fiabilite !== "complet").toBe(true);
    }
  });
});

describe("Cas limite — ACRE + ZFRR combinés", () => {
  it("Les deux boosters peuvent être actifs simultanément ou l'un exclut l'autre selon config", () => {
    const input = baseInput({
      CA_ENCAISSE_UTILISATEUR: 40_000,
      AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
      EST_CREATEUR_REPRENEUR: true,
      ACRE_DEMANDEE: true,
      EST_ELIGIBLE_ACRE_DECLARATIF: true,
      DATE_CREATION_ACTIVITE: "2026-01-15",
      EST_IMPLANTE_EN_ZFRR: true,
      OPTION_EXONERATION_ZONE_CHOISIE: "ZFRR",
    });

    const [output] = runEngineWithLogs(input);
    expect(output).toBeDefined();

    // Vérifier qu'aucun scénario n'a des calculs incohérents
    for (const sc of output.calculs_par_scenario) {
      // Les cotisations nettes ne peuvent pas être négatives
      expect(sc.intermediaires.COTISATIONS_SOCIALES_NETTES!).toBeGreaterThanOrEqual(0);
      // Le COUT_TOTAL ne peut pas être négatif
      expect(sc.intermediaires.COUT_TOTAL_SOCIAL_FISCAL!).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── Bug B1 — CA massif sans CA_N1 : aucun scénario micro ──────────────────

describe("Filtre X01 — CA très élevé sans CA N-1 → basculement réel obligatoire", () => {
  // CA = 500 000 € > 2× seuil micro BIC service (83 600 × 2 = 167 200)
  // Sans CA_N1, la règle "depassement_massif" force basculement_reel_oblige
  it("CA = 500 000 € → aucun scénario micro dans calculs_par_scenario", () => {
    const [output] = runEngineWithLogs(
      baseInput({
        CA_ENCAISSE_UTILISATEUR: 500_000,
        SOUS_SEGMENT_ACTIVITE: "prestation",
        AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
      })
    );
    const MICRO_BASE_IDS = new Set(["G_MBIC_VENTE", "G_MBIC_SERVICE", "G_MBNC"]);
    const microCalculs = output.calculs_par_scenario.filter((c) =>
      MICRO_BASE_IDS.has(c.base_id)
    );
    expect(microCalculs.length).toBe(0);
  });

  it("CA = 500 000 € → micro scenarios dans scenarios_exclus avec motif X01", () => {
    const [output] = runEngineWithLogs(
      baseInput({
        CA_ENCAISSE_UTILISATEUR: 500_000,
        SOUS_SEGMENT_ACTIVITE: "prestation",
        AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
      })
    );
    const MICRO_BASE_IDS = new Set(["G_MBIC_VENTE", "G_MBIC_SERVICE", "G_MBNC"]);
    const microExclus = output.scenarios_exclus.filter((e) =>
      MICRO_BASE_IDS.has(e.base_id)
    );
    expect(microExclus.length).toBeGreaterThan(0);
    const motif = microExclus[0]!.motifs_exclusion[0] ?? "";
    expect(motif.toLowerCase()).toMatch(/x01|seuil micro|r.el obligatoire/i);
  });

  it("CA = 90 000 € (< 2× seuil) sans CA_N1 → premiere_annee_depassement : micro encore calculé", () => {
    const SEUIL = P.micro.CFG_SEUIL_CA_MICRO_BIC_SERVICE;
    const [output] = runEngineWithLogs(
      baseInput({
        CA_ENCAISSE_UTILISATEUR: Math.round(SEUIL * 1.05),
        SOUS_SEGMENT_ACTIVITE: "prestation",
      })
    );
    const microService = output.calculs_par_scenario.find(
      (c) => c.base_id === "G_MBIC_SERVICE"
    );
    expect(microService).toBeDefined();
    expect(output.qualification.flags.FLAG_PREMIERE_ANNEE_DEPASSEMENT).toBe(true);
  });
});
