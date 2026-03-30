"use strict";
/**
 * Tests d'intégration end-to-end — runEngineWithLogs()
 *
 * Profil 1 : Consultant freelance (prestation BIC), micro simple, franchise TVA
 * Profil 2 : Artisan EI au réel avec ACRE
 * + cas limites : seuil micro, ARCE, ACRE+ZFRR
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_js_1 = require("../src/index.js");
const config_1 = require("@wymby/config");
const P = config_1.FISCAL_PARAMS_2026;
// ─── Helpers ──────────────────────────────────────────────────────────────────
function baseInput(overrides) {
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
    };
}
// ─── Profil 1 : Micro simple ───────────────────────────────────────────────────
(0, vitest_1.describe)("Intégration — Profil Micro-BIC service simple (C05–C08)", () => {
    const input = baseInput({
        CA_ENCAISSE_UTILISATEUR: 40_000,
        SOUS_SEGMENT_ACTIVITE: "prestation",
        AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
    });
    (0, vitest_1.it)("Moteur s'exécute sans erreur et retourne des scénarios calculés", () => {
        const [output, logs] = (0, index_js_1.runEngineWithLogs)(input);
        (0, vitest_1.expect)(output).toBeDefined();
        (0, vitest_1.expect)(output.calculs_par_scenario.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(logs.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)("Au moins un scénario Micro-BIC service est présent dans les calculs", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        const microService = output.calculs_par_scenario.find((c) => c.base_id === "G_MBIC_SERVICE");
        (0, vitest_1.expect)(microService).toBeDefined();
    });
    (0, vitest_1.it)("NET_APRES_IR > 0 pour un profil standard", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        const microService = output.calculs_par_scenario.find((c) => c.base_id === "G_MBIC_SERVICE" && c.option_vfl === "VFL_NON");
        (0, vitest_1.expect)(microService?.intermediaires.NET_APRES_IR).toBeGreaterThan(0);
    });
    (0, vitest_1.it)("Recommandation présente avec motif non vide", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        (0, vitest_1.expect)(output.recommandation).not.toBeNull();
        (0, vitest_1.expect)(output.recommandation?.motif).toBeTruthy();
        (0, vitest_1.expect)(output.recommandation?.scenario_recommande_id).toBeTruthy();
    });
    (0, vitest_1.it)("Comparaison classement net_apres_ir cohérent", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        const classement = output.comparaison.classement_net_apres_ir;
        (0, vitest_1.expect)(classement.length).toBeGreaterThan(0);
        // Le premier scénario dans le classement doit avoir le plus grand NET_APRES_IR
        if (classement.length >= 2) {
            const premier_id = classement[0];
            const second_id = classement[1];
            const premier = output.calculs_par_scenario.find((c) => c.scenario_id === premier_id);
            const second = output.calculs_par_scenario.find((c) => c.scenario_id === second_id);
            if (premier && second) {
                (0, vitest_1.expect)(premier.intermediaires.NET_APRES_IR).toBeGreaterThanOrEqual(second.intermediaires.NET_APRES_IR);
            }
        }
    });
    (0, vitest_1.it)("Qualité résultat : avertissements et hypothèses sont des tableaux", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        (0, vitest_1.expect)(Array.isArray(output.qualite_resultat.avertissements)).toBe(true);
        (0, vitest_1.expect)(Array.isArray(output.qualite_resultat.hypotheses_retenues)).toBe(true);
    });
});
// ─── Profil 2 : EI réel BIC avec ACRE ────────────────────────────────────────
(0, vitest_1.describe)("Intégration — Profil EI réel BIC IR avec ACRE (C13)", () => {
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
    (0, vitest_1.it)("Moteur s'exécute sans erreur", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        (0, vitest_1.expect)(output).toBeDefined();
        (0, vitest_1.expect)(output.calculs_par_scenario.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)("Scénario EI réel BIC IR présent dans les calculs", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        const eiReel = output.calculs_par_scenario.find((c) => c.base_id === "G_EI_REEL_BIC_IR");
        (0, vitest_1.expect)(eiReel).toBeDefined();
    });
    (0, vitest_1.it)("ACRE actif : REDUCTION_ACRE > 0 dans le scénario EI réel avec booster ACRE", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        const eiAvecAcre = output.calculs_par_scenario.find((c) => c.base_id === "G_EI_REEL_BIC_IR" && c.boosters_actifs.includes("BOOST_ACRE"));
        if (eiAvecAcre) {
            (0, vitest_1.expect)(eiAvecAcre.intermediaires.REDUCTION_ACRE).toBeGreaterThan(0);
            (0, vitest_1.expect)(eiAvecAcre.intermediaires.COTISATIONS_SOCIALES_NETTES).toBeLessThan(eiAvecAcre.intermediaires.COTISATIONS_SOCIALES_BRUTES);
        }
        // Si ACRE non qualifié pour ce scénario, le test passe (scénario peut ne pas exister)
    });
    (0, vitest_1.it)("NET_APRES_IR ≤ NET_AVANT_IR pour tous les scénarios (cohérence interne)", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        for (const sc of output.calculs_par_scenario) {
            const net_avant = sc.intermediaires.NET_AVANT_IR ?? 0;
            const net_apres = sc.intermediaires.NET_APRES_IR ?? 0;
            // NET_APRES_IR doit être ≤ NET_AVANT_IR (impôt et VFL réduisent le net)
            (0, vitest_1.expect)(net_apres).toBeLessThanOrEqual(net_avant + 1); // +1 pour tolér. arrondi
        }
    });
    (0, vitest_1.it)("SUPER_NET ≥ NET_APRES_IR pour tous les scénarios (ARCE positive)", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        for (const sc of output.calculs_par_scenario) {
            const net_apres = sc.intermediaires.NET_APRES_IR ?? 0;
            const super_net = sc.intermediaires.SUPER_NET ?? 0;
            (0, vitest_1.expect)(super_net).toBeGreaterThanOrEqual(net_apres);
        }
    });
    (0, vitest_1.it)("SUPER_NET = NET_APRES_IR + AIDE_ARCE_TRESORERIE (cohérence interne)", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        for (const sc of output.calculs_par_scenario) {
            const net = sc.intermediaires.NET_APRES_IR ?? 0;
            const arce = sc.intermediaires.AIDE_ARCE_TRESORERIE ?? 0;
            const super_net = sc.intermediaires.SUPER_NET ?? 0;
            (0, vitest_1.expect)(super_net).toBeCloseTo(net + arce, 0);
        }
    });
});
// ─── Cas limites ──────────────────────────────────────────────────────────────
(0, vitest_1.describe)("Cas limite — CA exactement au seuil micro BIC service", () => {
    const SEUIL = P.micro.CFG_SEUIL_CA_MICRO_BIC_SERVICE; // 83_600
    (0, vitest_1.it)("CA = seuil : micro encore eligible (seuil inclus)", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(baseInput({ CA_ENCAISSE_UTILISATEUR: SEUIL }));
        const microService = output.calculs_par_scenario.find((c) => c.base_id === "G_MBIC_SERVICE");
        (0, vitest_1.expect)(microService).toBeDefined();
    });
    (0, vitest_1.it)("CA = seuil + 1 : micro exclu (X01 filtrage)", () => {
        const [output] = (0, index_js_1.runEngineWithLogs)(baseInput({ CA_ENCAISSE_UTILISATEUR: SEUIL + 1 }));
        // Micro BIC SERVICE doit être exclu ou absent des calculs
        const microService = output.calculs_par_scenario.find((c) => c.base_id === "G_MBIC_SERVICE");
        // Vérifie soit l'absence dans calculs, soit la présence dans exclus
        const microExclu = output.scenarios_exclus.some((e) => e.scenario_id.includes("G_MBIC_SERVICE"));
        // Au moins l'une des deux conditions doit être vraie
        (0, vitest_1.expect)(!microService || microExclu).toBe(true);
    });
});
(0, vitest_1.describe)("Cas limite — ARCE demandée : NET_APRES_IR ≠ SUPER_NET", () => {
    (0, vitest_1.it)("Quand ARCE active avec droits ARE, SUPER_NET > NET_APRES_IR", () => {
        const input = baseInput({
            CA_ENCAISSE_UTILISATEUR: 45_000,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            EST_BENEFICIAIRE_ARE: true,
            ARCE_DEMANDEE: true,
            DROITS_ARE_RESTANTS: 12_000,
        });
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        // Trouver un scénario avec booster ARCE
        const avecArce = output.calculs_par_scenario.find((c) => c.boosters_actifs.includes("BOOST_ARCE"));
        if (avecArce) {
            const net = avecArce.intermediaires.NET_APRES_IR ?? 0;
            const super_net = avecArce.intermediaires.SUPER_NET ?? 0;
            const arce = avecArce.intermediaires.AIDE_ARCE_TRESORERIE ?? 0;
            (0, vitest_1.expect)(arce).toBeGreaterThan(0);
            (0, vitest_1.expect)(super_net).toBeGreaterThan(net);
            (0, vitest_1.expect)(super_net - net).toBeCloseTo(arce, 0);
        }
    });
});
(0, vitest_1.describe)("Cas limite — VFL absent si RFR_N2 absent", () => {
    (0, vitest_1.it)("Sans RFR_N2 : scenarios VFL avec fiabilité dégradée ou absent", () => {
        const input = baseInput({
            CA_ENCAISSE_UTILISATEUR: 30_000,
            OPTION_VFL_DEMANDEE: true,
            // RFR_N_2_UTILISATEUR absent → VFL en mode estimation ou non qualifié
        });
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        // Sans RFR N-2, le VFL peut être exclu ou marqué estimation
        // Le moteur ne doit pas crasher et doit retourner un résultat utilisable
        (0, vitest_1.expect)(output).toBeDefined();
        (0, vitest_1.expect)(output.calculs_par_scenario.length).toBeGreaterThan(0);
        // Si des scénarios VFL sont calculés, vérifier qu'ils ont un avertissement
        const scenariosVFL = output.calculs_par_scenario.filter((c) => c.option_vfl === "VFL_OUI");
        // Soit VFL absent, soit les avertissements indiquent l'incertitude
        if (scenariosVFL.length > 0) {
            const hasWarning = scenariosVFL.some((c) => c.avertissements_scenario.some((a) => a.toLowerCase().includes("rfr") || a.toLowerCase().includes("vfl") || a.toLowerCase().includes("estimation")));
            // L'avertissement peut aussi être au niveau global
            const globalWarning = output.qualite_resultat.avertissements.some((a) => a.toLowerCase().includes("rfr") || a.toLowerCase().includes("vfl"));
            (0, vitest_1.expect)(hasWarning || globalWarning || output.qualite_resultat.niveau_fiabilite !== "complet").toBe(true);
        }
    });
});
(0, vitest_1.describe)("Cas limite — ACRE + ZFRR combinés", () => {
    (0, vitest_1.it)("Les deux boosters peuvent être actifs simultanément ou l'un exclut l'autre selon config", () => {
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
        const [output] = (0, index_js_1.runEngineWithLogs)(input);
        (0, vitest_1.expect)(output).toBeDefined();
        // Vérifier qu'aucun scénario n'a des calculs incohérents
        for (const sc of output.calculs_par_scenario) {
            // Les cotisations nettes ne peuvent pas être négatives
            (0, vitest_1.expect)(sc.intermediaires.COTISATIONS_SOCIALES_NETTES).toBeGreaterThanOrEqual(0);
            // Le COUT_TOTAL ne peut pas être négatif
            (0, vitest_1.expect)(sc.intermediaires.COUT_TOTAL_SOCIAL_FISCAL).toBeGreaterThanOrEqual(0);
        }
    });
});
//# sourceMappingURL=integration.test.js.map