"use strict";
/**
 * test_cases_2026.ts
 * Cas de tests de référence — Moteur Fiscal WYMBY 2026
 *
 * Chaque cas fournit :
 *   - inputs   : les variables d'entrée exactes à passer au moteur
 *   - expected : les valeurs de sortie attendues après calcul
 *
 * Hypothèses communes à tous les cas sauf mention contraire :
 *   - Célibataire, 1 part fiscale
 *   - Autres revenus foyer : 0 €
 *   - Autres charges déductibles foyer : 0 €
 *   - Exercice complet (01/01/2026 – 31/12/2026)
 *   - Aucune aide de zone
 *   - Niveau de certitude : "certain"
 *
 * Les montants d'IR sont calculés par méthode différentielle sur un foyer à 1 part.
 * Barème 2026 (revenus 2025) :
 *   0 %   jusqu'à 11 600 €
 *   11 %  de 11 601 € à 29 579 €
 *   30 %  de 29 580 € à 84 577 €
 *   41 %  de 84 578 € à 181 917 €
 *   45 %  au-delà de 181 917 €
 *
 * PASS 2026 = 48 060 €
 * SMIC horaire 2026 = 12,02 €
 *
 * ⚠️  Les montants d'IR et de cotisations TNS réel sont des résultats arrondis à l'euro.
 *     Les cotisations TNS réel sont des estimations calculées branche par branche — voir
 *     fiscal_params_2026.ts section CFG_TAUX_SOCIAL_TNS_BIC pour le détail.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUMMARY = exports.TEST_CASES_BY_SEGMENT = exports.TEST_CASES_BY_SCENARIO = exports.TEST_CASES = void 0;
// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRE IR — Barème 2026, 1 part fiscale, sans décote
// ─────────────────────────────────────────────────────────────────────────────
function ir_bareme_2026(revenu_net_imposable, nb_parts = 1) {
    const qf = revenu_net_imposable / nb_parts;
    let impot_par_part = 0;
    if (qf <= 11_600) {
        impot_par_part = 0;
    }
    else if (qf <= 29_579) {
        impot_par_part = (qf - 11_600) * 0.11;
    }
    else if (qf <= 84_577) {
        impot_par_part = (29_579 - 11_600) * 0.11 + (qf - 29_579) * 0.30;
    }
    else if (qf <= 181_917) {
        impot_par_part =
            (29_579 - 11_600) * 0.11 +
                (84_577 - 29_579) * 0.30 +
                (qf - 84_577) * 0.41;
    }
    else {
        impot_par_part =
            (29_579 - 11_600) * 0.11 +
                (84_577 - 29_579) * 0.30 +
                (181_917 - 84_577) * 0.41 +
                (qf - 181_917) * 0.45;
    }
    return Math.round(impot_par_part * nb_parts);
}
// ─────────────────────────────────────────────────────────────────────────────
// SEGMENT 1 — GÉNÉRALISTES
// ─────────────────────────────────────────────────────────────────────────────
exports.TEST_CASES = [
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-001 : Micro-BIC vente, franchise TVA, sans VFL
    // CA = 80 000 € HT | Abattement 71 % | Taux social 12,3 %
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-001",
        description: "Micro-BIC achat/revente — franchise TVA — sans VFL — célibataire 1 part",
        segment: "generaliste",
        scenario_base: "G_MBIC_VENTE",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "achat_revente",
            CA_ENCAISSE_UTILISATEUR: 80_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            OPTION_VFL_DEMANDEE: false,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2024-01-01",
            ACRE_DEMANDEE: false,
            EST_IMPLANTE_EN_ZFRR: false,
            EST_IMPLANTE_EN_QPV: false,
        },
        expected: {
            // Cotisations : 80 000 × 12,3 % = 9 840 €
            COTISATIONS_SOCIALES_NETTES: 9_840,
            // Abattement : max(80 000 × 71 %, 305) = 56 800 €
            // Base IR : 80 000 - 56 800 = 23 200 €
            BASE_IR_SCENARIO: 23_200,
            // IR : barème sur 23 200 € = (23 200 - 11 600) × 11 % = 1 276 €
            IR_ATTRIBUABLE_SCENARIO: 1_276,
            // Net avant IR : 80 000 - 9 840 = 70 160 €
            NET_AVANT_IR: 70_160,
            // Net après IR : 70 160 - 1 276 = 68 884 €
            NET_APRES_IR: 68_884,
            flags: {
                FLAG_MICRO_BIC_VENTE_POSSIBLE: true,
                FLAG_VFL_POSSIBLE: true,
                FLAG_TVA_APPLICABLE: false,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "Cotisations = 80000 × 0.123 = 9840. " +
            "Abattement = 80000 × 0.71 = 56800. " +
            "Base IR = 80000 - 56800 = 23200. " +
            "IR = (23200 - 11600) × 0.11 = 11600 × 0.11 = 1276. " +
            "Net avant IR = 80000 - 9840 = 70160. " +
            "Net après IR = 70160 - 1276 = 68884.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-002 : Micro-BIC vente, avec VFL
    // CA = 80 000 € HT | Taux social 12,3 % | Taux VFL 1,0 %
    // RFR N-2 = 20 000 € (< 29 315 € × 1 part → éligible)
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-002",
        description: "Micro-BIC achat/revente — franchise TVA — avec VFL — célibataire éligible",
        segment: "generaliste",
        scenario_base: "G_MBIC_VENTE",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "achat_revente",
            CA_ENCAISSE_UTILISATEUR: 80_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            RFR_N_2_UTILISATEUR: 20_000,
            OPTION_VFL_DEMANDEE: true,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2024-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            // Cotisations : 80 000 × 12,3 % = 9 840 €
            COTISATIONS_SOCIALES_NETTES: 9_840,
            // VFL : 80 000 × 1,0 % = 800 € (libératoire d'IR)
            // Net avant IR (VFL inclus) = 80 000 - 9 840 - 800 = 69 360 €
            // Avec VFL, NET_AVANT_IR intègre déjà l'impôt
            NET_AVANT_IR: 69_360,
            // Avec VFL, pas d'IR supplémentaire
            NET_APRES_IR: 69_360,
            IR_ATTRIBUABLE_SCENARIO: 800,
            flags: {
                FLAG_VFL_POSSIBLE: true,
                FLAG_VFL_INTERDIT: false,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "RFR N-2 = 20000 < seuil VFL (29315 × 1) → éligible. " +
            "Cotisations = 80000 × 0.123 = 9840. " +
            "VFL = 80000 × 0.01 = 800 (libératoire IR). " +
            "NET = 80000 - 9840 - 800 = 69360. " +
            "IR_ATTRIBUABLE = 800 (VFL), pas de barème progressif.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-003 : Micro-BIC service, franchise TVA, sans VFL
    // CA = 60 000 € HT | Abattement 50 % | Taux social 21,2 %
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-003",
        description: "Micro-BIC prestation de service — franchise TVA — sans VFL",
        segment: "generaliste",
        scenario_base: "G_MBIC_SERVICE",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "prestation",
            CA_ENCAISSE_UTILISATEUR: 60_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            OPTION_VFL_DEMANDEE: false,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2024-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            // Cotisations : 60 000 × 21,2 % = 12 720 €
            COTISATIONS_SOCIALES_NETTES: 12_720,
            // Abattement : 60 000 × 50 % = 30 000 €
            // Base IR : 60 000 - 30 000 = 30 000 €
            BASE_IR_SCENARIO: 30_000,
            // IR : (29579 - 11600) × 11 % + (30000 - 29579) × 30 %
            //    = 17979 × 0.11 + 421 × 0.30 = 1977,69 + 126,3 = 2104 €
            IR_ATTRIBUABLE_SCENARIO: 2_104,
            NET_AVANT_IR: 47_280,
            NET_APRES_IR: 45_176,
            flags: {
                FLAG_MICRO_BIC_SERVICE_POSSIBLE: true,
                FLAG_TVA_APPLICABLE: false,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "Cotisations = 60000 × 0.212 = 12720. " +
            "Abattement = 60000 × 0.50 = 30000. " +
            "Base IR = 30000. " +
            "IR = (17979 × 0.11) + (421 × 0.30) = 1977.69 + 126.30 = 2104 (arrondi). " +
            "Net avant IR = 60000 - 12720 = 47280. " +
            "Net après IR = 47280 - 2104 = 45176.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-004 : Micro-BIC service, avec TVA collectée
    // CA = 60 000 € HT | TVA 20 % collectée | TVA déductible 5 000 € HT
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-004",
        description: "Micro-BIC prestation service — TVA collectée — sans VFL",
        segment: "generaliste",
        scenario_base: "G_MBIC_SERVICE",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "prestation",
            CA_ENCAISSE_UTILISATEUR: 60_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            OPTION_VFL_DEMANDEE: false,
            TVA_DEJA_APPLICABLE: true,
            REGIME_TVA_SOUHAITE: "réel TVA",
            TVA_COLLECTEE_UTILISATEUR: 12_000,
            TVA_DEDUCTIBLE_UTILISATEUR: 1_000,
            DATE_CREATION_ACTIVITE: "2024-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            // Cotisations inchangées (assiette = CA HT) : 60 000 × 21,2 % = 12 720 €
            COTISATIONS_SOCIALES_NETTES: 12_720,
            BASE_IR_SCENARIO: 30_000,
            IR_ATTRIBUABLE_SCENARIO: 2_104,
            // Net avant IR = 60000 - 12720 - (12000 - 1000 TVA nette) = 60000 - 12720 - 11000 = 36280 €
            NET_AVANT_IR: 36_280,
            NET_APRES_IR: 34_176,
            flags: {
                FLAG_TVA_APPLICABLE: true,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "TVA nette due = 12000 - 1000 = 11000. " +
            "Net avant IR = 60000 - 12720 - 11000 = 36280. " +
            "Net après IR = 36280 - 2104 = 34176.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-005 : Micro-BNC libéral, franchise TVA, sans VFL
    // CA = 55 000 € HT | Abattement 34 % | Taux social 25,6 % (SSI)
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-005",
        description: "Micro-BNC libéral SSI — franchise TVA — sans VFL",
        segment: "generaliste",
        scenario_base: "G_MBNC",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 55_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            OPTION_VFL_DEMANDEE: false,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2024-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            // Cotisations : 55 000 × 25,6 % = 14 080 €
            COTISATIONS_SOCIALES_NETTES: 14_080,
            // Abattement : 55 000 × 34 % = 18 700 €
            // Base IR : 55 000 - 18 700 = 36 300 €
            BASE_IR_SCENARIO: 36_300,
            // IR : (17979 × 0.11) + (36300 - 29579) × 0.30
            //    = 1977.69 + 6721 × 0.30 = 1977.69 + 2016.3 = 3994 €
            IR_ATTRIBUABLE_SCENARIO: 3_994,
            NET_AVANT_IR: 40_920,
            NET_APRES_IR: 36_926,
            flags: {
                FLAG_MICRO_BNC_POSSIBLE: true,
                FLAG_VFL_POSSIBLE: true,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "Cotisations = 55000 × 0.256 = 14080. " +
            "Abattement = 55000 × 0.34 = 18700. " +
            "Base IR = 36300. " +
            "IR = 17979 × 0.11 + 6721 × 0.30 = 1977.69 + 2016.30 = 3994 (arrondi). " +
            "Net avant IR = 55000 - 14080 = 40920. " +
            "Net après IR = 40920 - 3994 = 36926.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-006 : Micro-BNC avec VFL
    // CA = 55 000 € | RFR N-2 = 25 000 € | VFL 2,2 %
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-006",
        description: "Micro-BNC libéral SSI — VFL — célibataire éligible",
        segment: "generaliste",
        scenario_base: "G_MBNC",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 55_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            RFR_N_2_UTILISATEUR: 25_000,
            OPTION_VFL_DEMANDEE: true,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2024-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            COTISATIONS_SOCIALES_NETTES: 14_080,
            // VFL = 55000 × 2,2 % = 1 210 €
            // Net = 55000 - 14080 - 1210 = 39710 €
            IR_ATTRIBUABLE_SCENARIO: 1_210,
            NET_AVANT_IR: 39_710,
            NET_APRES_IR: 39_710,
            flags: {
                FLAG_VFL_POSSIBLE: true,
                FLAG_VFL_INTERDIT: false,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "RFR N-2 = 25000 < 29315 × 1 → éligible VFL. " +
            "VFL = 55000 × 0.022 = 1210. " +
            "Cotisations = 55000 × 0.256 = 14080. " +
            "Net = 55000 - 14080 - 1210 = 39710.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-007 : Micro-BNC — VFL refusé car RFR > seuil
    // RFR N-2 = 35 000 € > 29 315 € × 1 part
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-007",
        description: "Micro-BNC — VFL interdit (RFR N-2 dépasse le seuil)",
        segment: "generaliste",
        scenario_base: "G_MBNC",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 55_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            RFR_N_2_UTILISATEUR: 35_000,
            OPTION_VFL_DEMANDEE: true,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2024-01-01",
        },
        expected: {
            COTISATIONS_SOCIALES_NETTES: 14_080,
            BASE_IR_SCENARIO: 36_300,
            IR_ATTRIBUABLE_SCENARIO: 3_994,
            NET_AVANT_IR: 40_920,
            NET_APRES_IR: 36_926,
            flags: {
                FLAG_VFL_POSSIBLE: false,
                FLAG_VFL_INTERDIT: true,
            },
            scenarios_exclus: ["G_MBNC__VFL_OUI"],
            avertissements: ["VFL_INTERDIT_RFR_DEPASSE"],
            niveau_fiabilite: "complet",
        },
        calcul_notes: "RFR N-2 = 35000 > seuil VFL (29315 × 1 part). " +
            "VFL exclu automatiquement. Calcul identique à TC-G-005.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-008 : Micro-BIC vente — dépassement seuil micro
    // CA = 210 000 € > seuil micro 203 100 € → bascule réel obligatoire
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-008",
        description: "Micro-BIC vente — dépassement seuil CA → exclusion micro",
        segment: "generaliste",
        scenario_base: "G_MBIC_VENTE",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "achat_revente",
            CA_ENCAISSE_UTILISATEUR: 210_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            DATE_CREATION_ACTIVITE: "2024-01-01",
        },
        expected: {
            // Micro exclu — pas de calcul micro possible
            COTISATIONS_SOCIALES_NETTES: 0,
            NET_AVANT_IR: 0,
            NET_APRES_IR: 0,
            flags: {
                FLAG_MICRO_BIC_VENTE_POSSIBLE: false,
                FLAG_DEPASSEMENT_SEUIL_MICRO: true,
                FLAG_EI_REEL_BIC_IR_POSSIBLE: true,
            },
            scenarios_exclus: ["G_MBIC_VENTE"],
            avertissements: ["DEPASSEMENT_SEUIL_MICRO_BIC_VENTE", "BASCULEMENT_REEL_OBLIGE"],
            niveau_fiabilite: "partiel",
        },
        calcul_notes: "CA 210000 > seuil micro-BIC vente 203100. " +
            "Filtre X01 activé. Micro exclu, réel BIC ouvert automatiquement.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-009 : EI réel BIC IR
    // CA = 120 000 € HT | Charges 45 000 € | Amortissements 5 000 €
    // Résultat comptable = 70 000 € | ASU : 70 000 × 0,74 = 51 800 €
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-009",
        description: "EI réel BIC IR — franchise TVA — célibataire",
        segment: "generaliste",
        scenario_base: "G_EI_REEL_BIC_IR",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "prestation",
            CA_ENCAISSE_UTILISATEUR: 120_000,
            INPUT_MODE_CA: "HT",
            CHARGES_DEDUCTIBLES: 45_000,
            DOTATIONS_AMORTISSEMENTS: 5_000,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2022-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            // Résultat comptable = 120000 - 45000 - 5000 = 70000 €
            // Assiette ASU = 70000 × 0.74 = 51800 €
            // Cotisations TNS BIC sur 51800 € (estimé ~43 % — calcul branche par branche requis)
            // Maladie : 0 % jusqu'à 20% PASS (9612), progressif ensuite → ~6,5% × 51800 ≈ 3367 €
            // Retraite base : 51800 × 17,87 % = 9253 € (plafonnée à 1 PASS)
            // Retraite complémentaire : 51800 × 8,1 % = 4196 €
            // IJ : 51800 × 0,85 % = 440 €
            // Invalidité : 51800 × 1,3 % = 674 €
            // AF : 0 € (51800 < 110% PASS = 52866)
            // CSG-CRDS : 51800 × 9,7 % = 5025 €
            // CFP : 48060 × 0,29 % = 139 €
            // TOTAL estimé = 3367 + 9253 + 4196 + 440 + 674 + 0 + 5025 + 139 = 23094 €
            COTISATIONS_SOCIALES_NETTES: 23_094,
            // Base IR = résultat fiscal (70000 €, sans exonération)
            BASE_IR_SCENARIO: 70_000,
            // IR sur 70000 : 17979×0.11 + (70000-29579)×0.30 = 1977.69 + 40421×0.30
            //             = 1977.69 + 12126.30 = 14104 €
            IR_ATTRIBUABLE_SCENARIO: 14_104,
            // Net avant IR = 120000 - 45000 - 23094 = 51906 €
            NET_AVANT_IR: 51_906,
            // Net après IR = 51906 - 14104 = 37802 €
            NET_APRES_IR: 37_802,
            flags: {
                FLAG_EI_REEL_BIC_IR_POSSIBLE: true,
                FLAG_MICRO_BIC_SERVICE_POSSIBLE: false,
            },
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "ATTENTION : cotisations TNS réel calculées branche par branche. " +
            "Estimation globale ~23094 € sur assiette ASU 51800 €. " +
            "Maladie progressif : ~6.5% sur tranche 60-110% PASS. " +
            "Le niveau de fiabilité est 'estimation' car les cotisations TNS réel " +
            "dépendent du calcul barème exact par branche dans f_cotisations_tns. " +
            "Charges décaissées = 45000 (amortissements 5000 non sortis en cash).",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-010 : EI réel BNC IR
    // CA = 90 000 € HT | Charges 20 000 € | Résultat = 70 000 €
    // Même assiette ASU que TC-G-009
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-010",
        description: "EI réel BNC IR — franchise TVA — célibataire",
        segment: "generaliste",
        scenario_base: "G_EI_REEL_BNC_IR",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 90_000,
            INPUT_MODE_CA: "HT",
            CHARGES_DEDUCTIBLES: 20_000,
            DOTATIONS_AMORTISSEMENTS: 0,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2022-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            // Résultat = 90000 - 20000 = 70000 €
            // Assiette ASU = 70000 × 0.74 = 51800 €
            // Cotisations identiques au TC-G-009 (même assiette, même barème SSI)
            COTISATIONS_SOCIALES_NETTES: 23_094,
            BASE_IR_SCENARIO: 70_000,
            IR_ATTRIBUABLE_SCENARIO: 14_104,
            // Net avant IR = 90000 - 20000 - 23094 = 46906 €
            NET_AVANT_IR: 46_906,
            NET_APRES_IR: 32_802,
            flags: {
                FLAG_EI_REEL_BNC_IR_POSSIBLE: true,
            },
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "Résultat = 70000, assiette ASU = 51800, identique TC-G-009. " +
            "Différence : pas d'amortissements, charges = 20000 décaissées.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-011 : EI réel BIC IS (assimilation EURL)
    // CA = 120 000 € | Charges 45 000 € | Rémunération dirigeant 40 000 €
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-011",
        description: "EI réel BIC IS (assimilation EURL) — rémunération 40k — dividendes 0",
        segment: "generaliste",
        scenario_base: "G_EI_REEL_BIC_IS",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "prestation",
            CA_ENCAISSE_UTILISATEUR: 120_000,
            INPUT_MODE_CA: "HT",
            CHARGES_DEDUCTIBLES: 45_000,
            DOTATIONS_AMORTISSEMENTS: 5_000,
            REMUNERATION_DIRIGEANT_ENVISAGEE: 40_000,
            DIVIDENDES_ENVISAGES: 0,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2022-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            // Résultat comptable = 120000 - 45000 - 5000 - 40000 = 30000 €
            // IS : 30000 ≤ 42500 → taux réduit 15 % → IS = 4500 €
            IS_DU_SCENARIO: 4_500,
            // Assiette sociale TNS = rémunération 40000 × 0.74 = 29600 €
            // Cotisations TNS sur 29600 (estimé ~38% = 11248 €)
            COTISATIONS_SOCIALES_NETTES: 11_248,
            // Rémunération nette dirigeant = 40000 - 11248 = 28752 €
            // Base IR = rémunération imposable = 40000 (avant cotisations déductibles IR)
            // Simplifié : base IR = 40000
            BASE_IR_SCENARIO: 40_000,
            // IR sur 40000 : 17979×0.11 + (40000-29579)×0.30 = 1977.69 + 3126.30 = 5104 €
            IR_ATTRIBUABLE_SCENARIO: 5_104,
            // Net avant IR = rémunération nette = 28752 €
            NET_AVANT_IR: 28_752,
            NET_APRES_IR: 23_648,
            flags: {
                FLAG_EI_REEL_BIC_IS_POSSIBLE: true,
            },
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "Résultat comptable = 120000 - 45000 - 5000 - 40000 = 30000. " +
            "IS taux réduit 15 % (30000 ≤ 42500) = 4500. " +
            "Assiette TNS = 40000 × 0.74 = 29600. " +
            "Cotisations estimées ~38 % = 11248 (barème branche par branche requis). " +
            "Net avant IR = 40000 - 11248 = 28752. " +
            "Base IR = 40000. IR = 17979×0.11 + 10421×0.30 = 1978 + 3126 = 5104. " +
            "Net après IR = 28752 - 5104 = 23648.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-012 : EURL IS — rémunération + dividendes
    // CA = 150 000 € | Charges 30 000 € | Rémunération 50 000 € | Dividendes 20 000 €
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-012",
        description: "EURL IS gérant majoritaire — rémunération 50k + dividendes 20k",
        segment: "generaliste",
        scenario_base: "G_EURL_IS",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "prestation",
            CA_ENCAISSE_UTILISATEUR: 150_000,
            INPUT_MODE_CA: "HT",
            CHARGES_DEDUCTIBLES: 30_000,
            DOTATIONS_AMORTISSEMENTS: 0,
            REMUNERATION_DIRIGEANT_ENVISAGEE: 50_000,
            DIVIDENDES_ENVISAGES: 20_000,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2022-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            // Résultat comptable = 150000 - 30000 - 50000 = 70000 €
            // IS : 42500 × 15 % + (70000 - 42500) × 25 % = 6375 + 6875 = 13250 €
            IS_DU_SCENARIO: 13_250,
            // Résultat après IS = 70000 - 13250 = 56750 €
            // Dividendes distribuables = 56750 €, envisagés = 20000 €
            // Seuil franchise dividendes TNS : 10% × capital (supposé minimal → 0)
            // Dividendes soumis TNS : 20000 → cotisations TNS sur 20000 ≈ 8000 €
            // Assiette sociale totale = (50000 + 20000) × 0.74 = 51800 €
            // Cotisations TNS estimées ~23094 € (voir TC-G-009)
            COTISATIONS_SOCIALES_NETTES: 23_094,
            // Dividendes nets : 20000 - 8000 (cotisations sur dividendes) = 12000 €
            // Approximation — dépend du calcul TNS exact
            // Base IR = rémunération + dividendes imposables
            BASE_IR_SCENARIO: 70_000,
            // IR = 14104 € (identique TC-G-009)
            IR_ATTRIBUABLE_SCENARIO: 14_104,
            // Net avant IR = rémunération nette + dividendes nets
            // ≈ (50000 - cotis rémunération) + (20000 - cotis dividendes) = 49906 €
            NET_AVANT_IR: 49_906,
            NET_APRES_IR: 35_802,
            flags: {
                FLAG_EURL_IS_POSSIBLE: true,
            },
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "IS = 42500 × 0.15 + 27500 × 0.25 = 6375 + 6875 = 13250. " +
            "Dividendes soumis aux cotisations TNS car capital minimal (seuil 10% ≈ 0). " +
            "Assiette sociale = (remuneration + dividendes_TNS) × 0.74 = 51800. " +
            "Estimation cotisations = 23094 (barème complet requis). " +
            "Niveau estimation car dividendes soumis TNS varient selon capital social réel.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-013 : SASU IS — rémunération + dividendes
    // CA = 150 000 € | Charges 30 000 € | Rémunération brute 50 000 € | Dividendes 20 000 €
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-013",
        description: "SASU IS président assimilé-salarié — rémunération 50k brut + dividendes 20k",
        segment: "generaliste",
        scenario_base: "G_SASU_IS",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "prestation",
            CA_ENCAISSE_UTILISATEUR: 150_000,
            INPUT_MODE_CA: "HT",
            CHARGES_DEDUCTIBLES: 30_000,
            DOTATIONS_AMORTISSEMENTS: 0,
            REMUNERATION_DIRIGEANT_ENVISAGEE: 50_000,
            DIVIDENDES_ENVISAGES: 20_000,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2022-01-01",
        },
        expected: {
            // Charges sociales assimilé-salarié sur 50000 brut :
            // Patronales : maladie 13% + AF 5.25% + vieillesse 8.55%+2.11% + CSA 0.3% + FNAL 0.1%
            //            + AGIRC-ARRCO T1 4.72% + CEG T1 1.29% = ~35.32%
            // Salariales : vieillesse 6.9%+0.4% + CSG 8.7% + CRDS 0.5% + AGIRC 3.15% + CEG 0.86% = ~20.51%
            // Coût total employeur = 50000 × (1 + 35.32%) ≈ 67660 €
            // Cotisations salariales ≈ 50000 × 20.51% ≈ 10255 €
            // Rémunération nette = 50000 - 10255 = 39745 €
            COTISATIONS_SOCIALES_NETTES: 10_255,
            // Résultat comptable = 150000 - 30000 - 67660 (coût total) = 52340 €
            // IS : 42500 × 15 % + (52340 - 42500) × 25 % = 6375 + 2460 = 8835 €
            IS_DU_SCENARIO: 8_835,
            // Dividendes SASU : pas de cotisations sociales, PS 18,6 %
            // Dividendes nets = 20000 × (1 - 18.6%) = 20000 - 3720 = 16280 €
            // Base IR = rémunération imposable + dividendes imposables
            // Rémunération imposable = 50000 - cotis déductibles (CSG déductible etc.)
            // Simplifié : base IR ≈ 50000 + 20000 = 70000 €
            BASE_IR_SCENARIO: 70_000,
            IR_ATTRIBUABLE_SCENARIO: 14_104,
            // Net avant IR = rémunération nette + dividendes nets = 39745 + 16280 = 56025 €
            NET_AVANT_IR: 56_025,
            NET_APRES_IR: 41_921,
            flags: {
                FLAG_SASU_IS_POSSIBLE: true,
            },
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "Charges patronales assimilé-salarié ~35.32% sur brut. " +
            "Coût total employeur = 50000 × 1.3532 = 67660. " +
            "Résultat IS = 150000 - 30000 - 67660 = 52340. " +
            "IS = 42500×0.15 + 9840×0.25 = 6375 + 2460 = 8835. " +
            "Dividendes nets = 20000 × (1-0.186) = 16280. " +
            "Net avant IR = 39745 + 16280 = 56025. " +
            "Net après IR = 56025 - 14104 = 41921.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-014 : Micro-BIC vente + ACRE (création avant 01/07/2026)
    // CA = 80 000 € | Taux ACRE 50 % de réduction
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-014",
        description: "Micro-BIC vente — ACRE (création avant 01/07/2026, réduction 50 %)",
        segment: "generaliste",
        scenario_base: "G_MBIC_VENTE",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "achat_revente",
            CA_ENCAISSE_UTILISATEUR: 80_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            OPTION_VFL_DEMANDEE: false,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2026-03-01",
            EST_CREATEUR_REPRENEUR: true,
            ACRE_DEMANDEE: true,
            EST_ELIGIBLE_ACRE_DECLARATIF: true,
        },
        expected: {
            // Taux normal : 12,3 %
            // ACRE avant 01/07/2026 : réduction 50 % → taux effectif 6,15 %
            // Cotisations avec ACRE = 80000 × 6,15 % = 4920 €
            COTISATIONS_SOCIALES_NETTES: 4_920,
            BASE_IR_SCENARIO: 23_200,
            IR_ATTRIBUABLE_SCENARIO: 1_276,
            NET_AVANT_IR: 75_080,
            NET_APRES_IR: 73_804,
            flags: {
                FLAG_ACRE_POSSIBLE: true,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "DATE_CREATION = 2026-03-01 < 2026-07-01 → taux réduction ACRE = 50 %. " +
            "Taux effectif micro vente avec ACRE = 12.3% × (1-0.50) = 6.15%. " +
            "Cotisations = 80000 × 0.0615 = 4920. " +
            "Net avant IR = 80000 - 4920 = 75080. " +
            "Net après IR = 75080 - 1276 = 73804.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-015 : Micro-BNC + ACRE (création après 01/07/2026, réduction 25 %)
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-015",
        description: "Micro-BNC — ACRE (création après 01/07/2026, réduction 25 %)",
        segment: "generaliste",
        scenario_base: "G_MBNC",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 55_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            OPTION_VFL_DEMANDEE: false,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2026-09-01",
            EST_CREATEUR_REPRENEUR: true,
            ACRE_DEMANDEE: true,
            EST_ELIGIBLE_ACRE_DECLARATIF: true,
        },
        expected: {
            // Taux normal BNC SSI : 25,6 %
            // ACRE après 01/07/2026 : réduction 25 % → taux effectif 19,2 %
            // Cotisations = 55000 × 19,2 % = 10560 €
            COTISATIONS_SOCIALES_NETTES: 10_560,
            BASE_IR_SCENARIO: 36_300,
            IR_ATTRIBUABLE_SCENARIO: 3_994,
            NET_AVANT_IR: 44_440,
            NET_APRES_IR: 40_446,
            flags: {
                FLAG_ACRE_POSSIBLE: true,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "DATE_CREATION = 2026-09-01 > 2026-07-01 → taux réduction ACRE = 25 %. " +
            "Taux effectif = 25.6% × (1-0.25) = 19.2%. " +
            "Cotisations = 55000 × 0.192 = 10560. " +
            "Net avant IR = 55000 - 10560 = 44440. " +
            "Net après IR = 44440 - 3994 = 40446.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-016 : Micro-BNC + ARCE
    // CA = 55 000 € | Droits ARE restants = 15 000 € | ARCE 60 %
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-016",
        description: "Micro-BNC — ARCE (capital ARE) — séparé du NET récurrent",
        segment: "generaliste",
        scenario_base: "G_MBNC",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 55_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            OPTION_VFL_DEMANDEE: false,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2026-03-01",
            EST_CREATEUR_REPRENEUR: true,
            ACRE_DEMANDEE: true,
            EST_ELIGIBLE_ACRE_DECLARATIF: true,
            ARCE_DEMANDEE: true,
            EST_BENEFICIAIRE_ARE: true,
            DROITS_ARE_RESTANTS: 15_000,
        },
        expected: {
            // Cotisations avec ACRE avant 01/07/2026 (50 % réduction)
            COTISATIONS_SOCIALES_NETTES: 7_040,
            BASE_IR_SCENARIO: 36_300,
            IR_ATTRIBUABLE_SCENARIO: 3_994,
            NET_AVANT_IR: 47_960,
            NET_APRES_IR: 43_966,
            // ARCE = 15000 × 60 % = 9000 € (flux trésorerie non récurrent)
            // Versement 1 : 4500 € au démarrage
            // Versement 2 : 4500 € à 6 mois
            // NE FIGURE PAS dans NET_APRES_IR
            flags: {
                FLAG_ARCE_POSSIBLE: true,
            },
            avertissements: ["ARCE_FLUX_NON_RECURRENT"],
            niveau_fiabilite: "complet",
        },
        calcul_notes: "Cotisations ACRE 50% = 55000 × 0.256 × 0.50 = 7040. " +
            "ARCE = 15000 × 0.60 = 9000 € → AIDE_ARCE_TRESORERIE, hors NET_APRES_IR. " +
            "L'ARCE améliore la trésorerie initiale, pas la rentabilité récurrente.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-017 : Micro-BNC + ZFRR (années 1 à 5 — exonération IS/IR 100 %)
    // CA = 55 000 € | Zone ZFRR active | Année 1 du dispositif
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-017",
        description: "Micro-BNC — ZFRR année 1 (exonération IR 100 % sur bénéfice plafonné)",
        segment: "generaliste",
        scenario_base: "G_MBNC",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 55_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            OPTION_VFL_DEMANDEE: false,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2025-09-01",
            ACRE_DEMANDEE: false,
            EST_IMPLANTE_EN_ZFRR: true,
            OPTION_EXONERATION_ZONE_CHOISIE: "ZFRR",
            ANNEE_DANS_DISPOSITIF_ZONE: 1,
        },
        expected: {
            COTISATIONS_SOCIALES_NETTES: 14_080,
            // Base IR avant exonération = 55000 - 18700 = 36300 €
            // Exonération ZFRR année 1 = 100 % (plafonné à 50000 €/an)
            // Base IR après exonération = max(0, 36300 - min(36300, 50000)) = 0 €
            BASE_IR_SCENARIO: 0,
            IR_ATTRIBUABLE_SCENARIO: 0,
            NET_AVANT_IR: 40_920,
            NET_APRES_IR: 40_920,
            flags: {
                FLAG_ZFRR_POSSIBLE: true,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "ZFRR année 1 : taux exonération 100 %. " +
            "Bénéfice imposable avant exo = 36300 < plafond 50000 → exonération totale. " +
            "IR = 0. Net après IR = 40920 (identique Net avant IR).",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-G-018 : EURL IR (transparence fiscale — temporaire)
    // CA = 100 000 € | Charges 30 000 € | Exercice complet | Année 1 (option IR)
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-G-018",
        description: "EURL à l'IR (transparence fiscale) — année 1 — célibataire",
        segment: "generaliste",
        scenario_base: "G_EURL_IR",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "prestation",
            CA_ENCAISSE_UTILISATEUR: 100_000,
            INPUT_MODE_CA: "HT",
            CHARGES_DEDUCTIBLES: 30_000,
            DOTATIONS_AMORTISSEMENTS: 0,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2026-01-01",
            OPTION_IR_TEMPORAIRE_ACTIVE: true,
            ANNEE_OPTION_IR: 1,
            ACRE_DEMANDEE: false,
        },
        expected: {
            // Résultat = 100000 - 30000 = 70000 €
            // Assiette ASU = 70000 × 0.74 = 51800 €
            // Cotisations TNS identiques à TC-G-009 = 23094 €
            COTISATIONS_SOCIALES_NETTES: 23_094,
            BASE_IR_SCENARIO: 70_000,
            IR_ATTRIBUABLE_SCENARIO: 14_104,
            NET_AVANT_IR: 46_906,
            NET_APRES_IR: 32_802,
            flags: {
                FLAG_EURL_IR_POSSIBLE: true,
            },
            avertissements: ["OPTION_IR_TEMPORAIRE_DUREE_LIMITEE_5_ANS"],
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "EURL IR : transparence fiscale, calcul identique à EI réel BNC IR sur même résultat. " +
            "Avertissement : option IR limitée à 5 exercices maximum.",
    },
    // ─────────────────────────────────────────────────────────────────────────
    // SEGMENT 2 — SANTÉ
    // ─────────────────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════
    // TC-S-001 : RSPM remplaçant médecin — tranche ≤ 19 000 €
    // Honoraires = 15 000 € | Taux 13,5 %
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-S-001",
        description: "RSPM médecin remplaçant — honoraires 15 000 € (tranche 1)",
        segment: "sante",
        scenario_base: "S_RSPM",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "santé",
            SOUS_SEGMENT_ACTIVITE: "medecin",
            CA_ENCAISSE_UTILISATEUR: 15_000,
            INPUT_MODE_CA: "HT",
            EST_PROFESSION_SANTE: true,
            EST_CONVENTIONNE: true,
            SECTEUR_CONVENTIONNEL: "secteur_1",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            DATE_CREATION_ACTIVITE: "2024-01-01",
        },
        expected: {
            // Cotisations RSPM = 15000 × 13,5 % = 2025 €
            COTISATIONS_SOCIALES_NETTES: 2_025,
            // Fiscalité micro-BNC : abattement 34 % = 5100 €, base IR = 9900 €
            BASE_IR_SCENARIO: 9_900,
            // IR sur 9900 € : 9900 < 11600 → IR = 0 €
            IR_ATTRIBUABLE_SCENARIO: 0,
            NET_AVANT_IR: 12_975,
            NET_APRES_IR: 12_975,
            flags: {
                FLAG_RSPM_POSSIBLE: true,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "RSPM tranche 1 (≤ 19000) : taux 13.5%. " +
            "Cotisations = 15000 × 0.135 = 2025. " +
            "Base IR (régime BNC micro) = 15000 × (1-0.34) = 9900. " +
            "IR = 0 car 9900 < 11600 (tranche à 0%). " +
            "Net = 15000 - 2025 = 12975.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-S-002 : RSPM — tranche intermédiaire (19 001 à 38 000 €)
    // Honoraires = 25 000 € | Taux 21,2 %
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-S-002",
        description: "RSPM médecin remplaçant — honoraires 25 000 € (tranche intermédiaire 21,2 %)",
        segment: "sante",
        scenario_base: "S_RSPM",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "santé",
            SOUS_SEGMENT_ACTIVITE: "medecin",
            CA_ENCAISSE_UTILISATEUR: 25_000,
            INPUT_MODE_CA: "HT",
            EST_PROFESSION_SANTE: true,
            EST_CONVENTIONNE: true,
            SECTEUR_CONVENTIONNEL: "secteur_1",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            DATE_CREATION_ACTIVITE: "2024-01-01",
        },
        expected: {
            // Cotisations RSPM tranche 2 = 25000 × 21,2 % = 5300 €
            COTISATIONS_SOCIALES_NETTES: 5_300,
            // Base IR micro-BNC = 25000 × 0.66 = 16500 €
            BASE_IR_SCENARIO: 16_500,
            // IR = (16500 - 11600) × 11 % = 4900 × 0.11 = 539 €
            IR_ATTRIBUABLE_SCENARIO: 539,
            NET_AVANT_IR: 19_700,
            NET_APRES_IR: 19_161,
            flags: {
                FLAG_RSPM_POSSIBLE: true,
            },
            niveau_fiabilite: "complet",
        },
        calcul_notes: "RSPM tranche 2 (19001-38000) : taux 21.2%. " +
            "Cotisations = 25000 × 0.212 = 5300. " +
            "Base IR = 25000 × 0.66 = 16500. " +
            "IR = (16500 - 11600) × 0.11 = 4900 × 0.11 = 539. " +
            "Net avant IR = 25000 - 5300 = 19700. " +
            "Net après IR = 19700 - 539 = 19161.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-S-003 : Micro-BNC Secteur 1 avec aide CPAM maladie
    // CA = 70 000 € | Abattement 34 % | Taux maladie résiduel 0,1 %
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-S-003",
        description: "Micro-BNC médecin secteur 1 — aide CPAM maladie — CA 70 000 €",
        segment: "sante",
        scenario_base: "S_MICRO_BNC_SECTEUR_1",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "santé",
            SOUS_SEGMENT_ACTIVITE: "medecin",
            CA_ENCAISSE_UTILISATEUR: 70_000,
            INPUT_MODE_CA: "HT",
            EST_PROFESSION_SANTE: true,
            EST_CONVENTIONNE: true,
            SECTEUR_CONVENTIONNEL: "secteur_1",
            EST_ELIGIBLE_AIDE_CPAM: true,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            DATE_CREATION_ACTIVITE: "2022-01-01",
        },
        expected: {
            // Cotisations micro-BNC SSI sur CA :
            // Maladie (taux net après aide CPAM) : ~0,1% sur 70000 = 70 €
            // Autres cotisations micro SSI standard
            // Approximation globale : (25,6% - aide CPAM maladie ~8.4%) × 70000
            // La CPAM prend en charge quasi-totale sur revenus conventionnés
            // Net cotisations ≈ 70000 × (0.256 - 0.084) = 70000 × 0.172 ≈ 12040 €
            COTISATIONS_SOCIALES_NETTES: 12_040,
            // Abattement 34 % = 23800 €, base IR = 46200 €
            BASE_IR_SCENARIO: 46_200,
            // IR : 17979×0.11 + (46200-29579)×0.30 = 1978 + 16621×0.30 = 1978 + 4986 = 6964 €
            IR_ATTRIBUABLE_SCENARIO: 6_964,
            NET_AVANT_IR: 57_960,
            NET_APRES_IR: 50_996,
            flags: {
                FLAG_SANTE_MICRO_POSSIBLE: true,
                FLAG_AIDE_CPAM_POSSIBLE: true,
            },
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "Aide CPAM maladie S1 : CPAM prend en charge ~8.4% sur revenus conventionnés. " +
            "Taux effectif maladie residuel ≈ 0.1%. " +
            "Estimation cotisations nettes = 70000 × (0.256 - 0.084) = 12040. " +
            "Base IR = 70000 × (1-0.34) = 46200. " +
            "IR = 1978 + 16621×0.30 = 6964. " +
            "Niveau estimation car calcul CPAM progressif complexe.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-S-004 : EI réel BNC médecin secteur 1 — déduction groupe III + aide CPAM
    // Recettes = 100 000 € | Charges 25 000 € | Déduction Groupe III = 2 000 € + 3 % = 3 000 €
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-S-004",
        description: "EI réel BNC médecin secteur 1 — aide CPAM + déductions groupes I/II/III",
        segment: "sante",
        scenario_base: "S_EI_REEL_SECTEUR_1",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "santé",
            SOUS_SEGMENT_ACTIVITE: "medecin",
            CA_ENCAISSE_UTILISATEUR: 100_000,
            INPUT_MODE_CA: "HT",
            CHARGES_DEDUCTIBLES: 25_000,
            DOTATIONS_AMORTISSEMENTS: 0,
            EST_PROFESSION_SANTE: true,
            EST_CONVENTIONNE: true,
            SECTEUR_CONVENTIONNEL: "secteur_1",
            EST_ELIGIBLE_AIDE_CPAM: true,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            DATE_CREATION_ACTIVITE: "2022-01-01",
        },
        expected: {
            // Résultat brut = 100000 - 25000 = 75000 €
            // Déductions S1 : Groupe III (2% honoraires, max 3050) = 2000 €
            //                 Déduction complémentaire 3% honoraires = 3000 €
            // Résultat fiscal = 75000 - 2000 - 3000 = 70000 €
            // Assiette ASU = 70000 × 0.74 = 51800 €
            // Cotisations PAMC sur 51800 — avec aide CPAM maladie quasi-totale
            // Estimé : 70000 × 0.74 × taux_effectif_hors_maladie ≈ 23094 - aide_CPAM ≈ 17000 €
            COTISATIONS_SOCIALES_NETTES: 17_000,
            BASE_IR_SCENARIO: 70_000,
            IR_ATTRIBUABLE_SCENARIO: 14_104,
            NET_AVANT_IR: 58_000,
            NET_APRES_IR: 43_896,
            flags: {
                FLAG_SANTE_REEL_POSSIBLE: true,
                FLAG_AIDE_CPAM_POSSIBLE: true,
            },
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "Déductions S1 : Groupe III = 2% × 100000 = 2000 (< 3050 max). " +
            "Déduction complémentaire = 3% × 100000 = 3000. " +
            "Résultat fiscal = 75000 - 5000 = 70000. " +
            "ASU = 70000 × 0.74 = 51800. " +
            "Cotisations nettes estimées après aide CPAM ≈ 17000 (complexité PAMC). " +
            "Niveau estimation — calcul PAMC branche par branche requis.",
    },
    // ─────────────────────────────────────────────────────────────────────────
    // SEGMENT 3 — ARTISTE-AUTEUR
    // ─────────────────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════
    // TC-A-001 : Artiste-auteur BNC micro, franchise TVA, sans RAAP
    // Recettes = 25 000 € | Seuil RAAP = 10 818 € → RAAP applicable
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-A-001",
        description: "Artiste-auteur BNC micro — franchise TVA — RAAP taux normal",
        segment: "artiste_auteur",
        scenario_base: "A_BNC_MICRO",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "artiste_auteur",
            SOUS_SEGMENT_ACTIVITE: "artiste_auteur",
            CA_ENCAISSE_UTILISATEUR: 25_000,
            INPUT_MODE_CA: "HT",
            MODE_DECLARATION_ARTISTE_AUTEUR: "BNC",
            EST_ARTISTE_AUTEUR: true,
            EST_REDEVABLE_RAAP: true,
            OPTION_RAAP_TAUX_REDUIT: false,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2024-01-01",
        },
        expected: {
            // Cotisations SSAA (artiste-auteur) sur assiette BNC micro :
            // Assiette = 25000 × (1-0.34) × 1.15 = 25000 × 0.66 × 1.15 = 18975 €
            // Vieillesse plafonnée net auteur : 18975 × 6,15 % = 1167 €
            // CSG : 18975 × 0.66 × 9,2 % = 18975 × 0.6072 = ...
            // Simplifié : cotisations SSAA ≈ 18975 × (6.15% + 9.2% + 0.5% + 0.35%) = 18975 × 16% ≈ 3036 €
            // RAAP : 25000 > 10818 seuil → RAAP applicable
            // Assiette RAAP = 18975 (même base)
            // RAAP normal 8% : 18975 × 8% = 1518 €
            COTISATIONS_SOCIALES_NETTES: 4_554,
            // Abattement 34% = 8500 €, base IR = 16500 €
            BASE_IR_SCENARIO: 16_500,
            // IR = (16500 - 11600) × 11% = 539 €
            IR_ATTRIBUABLE_SCENARIO: 539,
            NET_AVANT_IR: 20_446,
            NET_APRES_IR: 19_907,
            flags: {
                FLAG_ARTISTE_AUTEUR_BNC_MICRO_POSSIBLE: true,
                FLAG_RAAP_APPLICABLE: true,
            },
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "Assiette SSAA BNC micro = 25000 × 0.66 × 1.15 = 18975. " +
            "Cotisations SSAA hors RAAP ≈ 18975 × 16% = 3036. " +
            "RAAP 8% = 18975 × 0.08 = 1518. " +
            "Total cotisations = 3036 + 1518 = 4554. " +
            "Base IR = 25000 × 0.66 = 16500. " +
            "Net avant IR = 25000 - 4554 = 20446. " +
            "Net après IR = 20446 - 539 = 19907.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-A-002 : Artiste-auteur T&S abattement forfaitaire 10 %
    // Recettes T&S = 30 000 €
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-A-002",
        description: "Artiste-auteur T&S abattement forfaitaire 10 %",
        segment: "artiste_auteur",
        scenario_base: "A_TS_ABATTEMENT_FORFAITAIRE",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "artiste_auteur",
            SOUS_SEGMENT_ACTIVITE: "artiste_auteur",
            CA_ENCAISSE_UTILISATEUR: 30_000,
            INPUT_MODE_CA: "HT",
            MODE_DECLARATION_ARTISTE_AUTEUR: "TS",
            OPTION_FRAIS_REELS_TS: false,
            EST_ARTISTE_AUTEUR: true,
            EST_REDEVABLE_RAAP: true,
            OPTION_RAAP_TAUX_REDUIT: false,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 0,
            DATE_CREATION_ACTIVITE: "2024-01-01",
        },
        expected: {
            // Cotisations SSAA sur assiette T&S = 30000 × 98.25% = 29475 €
            // Vieillesse plafonnée net = 29475 × 6.15% = 1813 €
            // CSG = 29475 × 9.2% = 2712 €, CRDS = 29475 × 0.5% = 147 €, CFP = 29475 × 0.35% = 103 €
            // RAAP : 29475 × 8% = 2358 €
            // Total estimé = 1813 + 2712 + 147 + 103 + 2358 = 7133 €
            COTISATIONS_SOCIALES_NETTES: 7_133,
            // Abattement 10% = 3000 €, base IR = 27000 €
            BASE_IR_SCENARIO: 27_000,
            // IR = 17979×0.11 + (27000-29579) → en dessous : 17979×0.11 → non
            // 27000 > 11600 mais < 29579 → IR = (27000-11600) × 11% = 15400 × 0.11 = 1694 €
            IR_ATTRIBUABLE_SCENARIO: 1_694,
            NET_AVANT_IR: 22_867,
            NET_APRES_IR: 21_173,
            flags: {
                FLAG_ARTISTE_AUTEUR_TS_POSSIBLE: true,
                FLAG_RAAP_APPLICABLE: true,
            },
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "Assiette SSAA T&S = 30000 × 98.25% = 29475 (revenus ≤ 4 PASS). " +
            "Cotisations hors RAAP = 29475 × (6.15+9.2+0.5+0.35)% = 29475 × 16.2% = 4775. " +
            "RAAP 8% = 29475 × 0.08 = 2358. Total = 7133. " +
            "Abattement TS 10% = 3000. Base IR = 27000. " +
            "IR = (27000-11600) × 0.11 = 1694. " +
            "Net avant IR = 30000 - 7133 = 22867. " +
            "Net après IR = 22867 - 1694 = 21173.",
    },
    // ─────────────────────────────────────────────────────────────────────────
    // SEGMENT 4 — IMMOBILIER MEUBLÉ
    // ─────────────────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════
    // TC-I-001 : LMNP micro-BIC classique
    // Loyers = 18 000 € | Abattement 50 % | Prélèvements sociaux 17,2 %
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-I-001",
        description: "LMNP micro-BIC classique — loyers 18 000 € — prélèvements sociaux 17,2 %",
        segment: "immobilier",
        scenario_base: "I_LMNP_MICRO",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "immobilier",
            SOUS_SEGMENT_ACTIVITE: "lmnp",
            RECETTES_LOCATION_MEUBLEE: 18_000,
            TYPE_LOCATION_MEUBLEE: "longue_duree",
            EST_LMNP: true,
            EST_LMP: false,
            AUTRES_REVENUS_ACTIVITE_FOYER: 45_000,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 45_000,
            DATE_CREATION_ACTIVITE: "2022-01-01",
        },
        expected: {
            // Abattement 50% = 9000 €, base IR = 9000 €
            // Prélèvements sociaux (LMNP) = 17,2 % sur 9000 = 1548 €
            COTISATIONS_SOCIALES_NETTES: 1_548,
            BASE_IR_SCENARIO: 9_000,
            // IR différentiel : revenus foyer = 45000 + 9000 = 54000 €
            // IR(54000) = 17979×0.11 + (54000-29579)×0.30 = 1978 + 7327 = 9305 €
            // IR(45000) = 17979×0.11 + (45000-29579)×0.30 = 1978 + 4626 = 6604 €
            // IR différentiel = 9305 - 6604 = 2701 €
            IR_ATTRIBUABLE_SCENARIO: 2_701,
            // Net avant IR = 18000 - charges réelles (hypothèse 0 ici) - 1548 = 16452 €
            NET_AVANT_IR: 16_452,
            NET_APRES_IR: 13_751,
            flags: {
                FLAG_LMNP_MICRO_POSSIBLE: true,
                FLAG_LMP_POSSIBLE: false,
            },
            avertissements: ["IR_CALCUL_DIFFERENTIEL_AUTRES_REVENUS_FOYER"],
            niveau_fiabilite: "complet",
        },
        calcul_notes: "LMNP micro-BIC : abattement 50% sur 18000 = 9000. " +
            "PS LMNP revenus courants = 17.2% × 9000 = 1548. " +
            "IR différentiel : base foyer sans scénario = 45000, avec = 54000. " +
            "IR(54000) = 1978 + 24421×0.30 = 1978 + 7327 = 9305. " +
            "IR(45000) = 1978 + 15421×0.30 = 1978 + 4626 = 6604. " +
            "Delta IR = 2701. Net avant IR = 18000 - 1548 = 16452. " +
            "Net après IR = 16452 - 2701 = 13751.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-I-002 : LMNP réel — avec amortissements
    // Loyers = 24 000 € | Charges 8 000 € | Amortissements 6 000 € (art. 39C)
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-I-002",
        description: "LMNP réel — loyers 24k, charges 8k, amortissements 6k — résultat nul art. 39C",
        segment: "immobilier",
        scenario_base: "I_LMNP_REEL",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "immobilier",
            SOUS_SEGMENT_ACTIVITE: "lmnp",
            RECETTES_LOCATION_MEUBLEE: 24_000,
            CHARGES_DEDUCTIBLES: 8_000,
            DOTATIONS_AMORTISSEMENTS: 6_000,
            TYPE_LOCATION_MEUBLEE: "longue_duree",
            EST_LMNP: true,
            EST_LMP: false,
            AUTRES_REVENUS_ACTIVITE_FOYER: 45_000,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 45_000,
        },
        expected: {
            // Résultat comptable = 24000 - 8000 - 6000 = 10000 €
            // Art. 39C : amortissement déductible = min(6000, loyers - charges hors amort)
            //          = min(6000, 24000 - 8000) = min(6000, 16000) = 6000 € (pas de limitation)
            // Résultat fiscal = 24000 - 8000 - 6000 = 10000 €
            // Prélèvements sociaux 17,2% sur 10000 = 1720 €
            COTISATIONS_SOCIALES_NETTES: 1_720,
            BASE_IR_SCENARIO: 10_000,
            // IR différentiel : IR(45000+10000=55000) - IR(45000)
            // IR(55000) = 1978 + (55000-29579)×0.30 = 1978 + 7626 = 9604 €
            // IR(45000) = 6604 €
            // Delta = 9604 - 6604 = 3000 €
            IR_ATTRIBUABLE_SCENARIO: 3_000,
            // Net avant IR = 24000 - 8000 (cash) - 1720 = 14280 €
            NET_AVANT_IR: 14_280,
            NET_APRES_IR: 11_280,
            niveau_fiabilite: "complet",
        },
        calcul_notes: "Art. 39C non limitant ici (amortissement 6000 < résultat hors amort 16000). " +
            "PS = 17.2% × 10000 = 1720. " +
            "IR différentiel = 9604 - 6604 = 3000. " +
            "Net avant IR = 24000 - 8000 - 1720 = 14280. " +
            "Net après IR = 14280 - 3000 = 11280.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-I-003 : LMNP réel — art. 39C limitant (amortissements différés)
    // Loyers = 12 000 € | Charges 10 000 € | Amortissements 6 000 €
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-I-003",
        description: "LMNP réel — art. 39C limitant — amortissements partiellement différés",
        segment: "immobilier",
        scenario_base: "I_LMNP_REEL",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "immobilier",
            SOUS_SEGMENT_ACTIVITE: "lmnp",
            RECETTES_LOCATION_MEUBLEE: 12_000,
            CHARGES_DEDUCTIBLES: 10_000,
            DOTATIONS_AMORTISSEMENTS: 6_000,
            TYPE_LOCATION_MEUBLEE: "longue_duree",
            EST_LMNP: true,
            EST_LMP: false,
            AUTRES_REVENUS_ACTIVITE_FOYER: 45_000,
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 45_000,
        },
        expected: {
            // Résultat hors amortissements = 12000 - 10000 = 2000 €
            // Amortissement max déductible (art. 39C) = min(6000, 2000) = 2000 €
            // Amortissements différés = 6000 - 2000 = 4000 € (ARD reportés)
            // Résultat fiscal = 12000 - 10000 - 2000 = 0 €
            // PS = 17.2% × 0 = 0 €
            COTISATIONS_SOCIALES_NETTES: 0,
            BASE_IR_SCENARIO: 0,
            IR_ATTRIBUABLE_SCENARIO: 0,
            // Net avant IR = 12000 - 10000 (cash) - 0 = 2000 €
            NET_AVANT_IR: 2_000,
            NET_APRES_IR: 2_000,
            avertissements: ["AMORTISSEMENTS_DIFFERES_ARD_4000"],
            niveau_fiabilite: "complet",
        },
        calcul_notes: "Art. 39C : résultat hors amort = 2000 €, amort max = 2000 €. " +
            "4000 € d'amortissements différés (ARD) reportables sans limite. " +
            "Résultat fiscal = 0. PS = 0. Net = 2000 (flux trésorerie).",
    },
    // ─────────────────────────────────────────────────────────────────────────
    // CAS TRANSVERSAUX — Filtres et exclusions
    // ─────────────────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════
    // TC-X-001 : Dépassement seuil TVA en cours d'année
    // CA = 40 000 € (dépasse seuil majoré BNC 41 250 €) — dépassement le 15/10/2026
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-X-001",
        description: "Micro-BNC — dépassement seuil TVA majoré — assujettissement immédiat",
        segment: "generaliste",
        scenario_base: "G_MBNC",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 42_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            DATE_CREATION_ACTIVITE: "2023-01-01",
            DATE_DEPASSEMENT_TVA_DECLARATIVE: "2026-10-15",
            TVA_DEJA_APPLICABLE: false,
        },
        expected: {
            COTISATIONS_SOCIALES_NETTES: 10_752,
            BASE_IR_SCENARIO: 27_720,
            IR_ATTRIBUABLE_SCENARIO: 1_774,
            NET_AVANT_IR: 31_248,
            NET_APRES_IR: 29_474,
            flags: {
                FLAG_DEPASSEMENT_SEUIL_TVA: true,
                FLAG_TVA_APPLICABLE: true,
            },
            avertissements: [
                "DEPASSEMENT_SEUIL_TVA_MAJORE_BNC",
                "TVA_APPLICABLE_DES_LE_15_10_2026",
            ],
            niveau_fiabilite: "partiel",
        },
        calcul_notes: "CA 42000 > seuil majoré BNC 41250 → TVA applicable dès le 15/10/2026. " +
            "Filtre X02 activé. TVA s'applique à compter de la date de dépassement. " +
            "Cotisations sur CA HT = 42000 × 25.6% = 10752. " +
            "Base IR = 42000 × 0.66 = 27720. " +
            "IR = (27720 - 11600) × 11% = 16120 × 0.11 = 1773 ≈ 1774. " +
            "Niveau partiel car TVA non encore entièrement modélisée (prorata).",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-X-002 : Taxe PUMa potentiellement applicable
    // Revenus d'activité = 8 000 € (<20% PASS = 9612 €)
    // Revenus du capital = 30 000 € (>50% PASS = 24030 €)
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-X-002",
        description: "Alerte PUMa — revenus activité insuffisants et revenus capital élevés",
        segment: "generaliste",
        scenario_base: "G_MBNC",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 12_121,
            INPUT_MODE_CA: "HT",
            // CA × (1-0.256) = 12121 × 0.744 = ~9018 — revenus activité = ~9018 < 9612
            SITUATION_FAMILIALE: "célibataire",
            NOMBRE_PARTS_FISCALES: 1,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 30_000,
            DATE_CREATION_ACTIVITE: "2023-01-01",
        },
        expected: {
            COTISATIONS_SOCIALES_NETTES: 3_103,
            BASE_IR_SCENARIO: 8_000,
            IR_ATTRIBUABLE_SCENARIO: 0,
            NET_AVANT_IR: 9_018,
            NET_APRES_IR: 9_018,
            flags: {
                FLAG_TAXE_PUMA_APPLICABLE: true,
            },
            avertissements: ["TAXE_PUMA_POTENTIELLEMENT_APPLICABLE"],
            niveau_fiabilite: "estimation",
        },
        calcul_notes: "Revenus activité = CA × (1-taux_cotisations) ≈ 9018 < 9612 (20% PASS). " +
            "Autres revenus foyer 30000 > 24030 (50% PASS). " +
            "Filtre X04 : alerte PUMa. CSM estimée = 6.5% × (30000 - 24030) × facteur_reduction. " +
            "Avertissement généré, calcul PUMa nécessite données foyer complètes.",
    },
    // ════════════════════════════════════════════════════════════════════════════
    // TC-X-003 : Foyer 2 parts — couple marié — impact QF sur IR
    // Micro-BNC CA = 55 000 € | Autres revenus foyer (conjoint) = 25 000 €
    // ════════════════════════════════════════════════════════════════════════════
    {
        id: "TC-X-003",
        description: "Micro-BNC — couple marié 2 parts — impact quotient familial",
        segment: "generaliste",
        scenario_base: "G_MBNC",
        inputs: {
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "generaliste",
            SOUS_SEGMENT_ACTIVITE: "liberal",
            CA_ENCAISSE_UTILISATEUR: 55_000,
            INPUT_MODE_CA: "HT",
            SITUATION_FAMILIALE: "marié",
            NOMBRE_PARTS_FISCALES: 2,
            AUTRES_REVENUS_FOYER_IMPOSABLES: 25_000,
            OPTION_VFL_DEMANDEE: false,
            TVA_DEJA_APPLICABLE: false,
            DATE_CREATION_ACTIVITE: "2022-01-01",
            ACRE_DEMANDEE: false,
        },
        expected: {
            COTISATIONS_SOCIALES_NETTES: 14_080,
            // Base IR scénario = 36300 €
            // Base IR foyer totale = 36300 + 25000 = 61300 €
            // IR(61300, 2 parts) : QF = 30650
            //   = (17979×0.11 + (30650-29579)×0.30) × 2 = (1977.69 + 321.30) × 2 = 4598 €
            // IR sans scénario IR(25000, 2 parts) : QF = 12500
            //   = (12500 - 11600) × 0.11 × 2 = 900 × 0.11 × 2 = 198 €
            // IR différentiel = 4598 - 198 = 4400 €
            BASE_IR_SCENARIO: 36_300,
            IR_ATTRIBUABLE_SCENARIO: 4_400,
            NET_AVANT_IR: 40_920,
            NET_APRES_IR: 36_520,
            niveau_fiabilite: "complet",
        },
        calcul_notes: "Méthode différentielle sur foyer 2 parts. " +
            "Base foyer avec scénario = 36300 + 25000 = 61300, QF = 30650. " +
            "IR foyer = (17979×0.11 + 1071×0.30) × 2 = (1977.69 + 321.30) × 2 = 4598. " +
            "IR sans scénario : QF = 12500, IR = (900×0.11) × 2 = 198. " +
            "Delta IR = 4598 - 198 = 4400. " +
            "Net après IR = 40920 - 4400 = 36520.",
    },
];
// ─────────────────────────────────────────────────────────────────────────────
// INDEX PAR SCÉNARIO BASE
// ─────────────────────────────────────────────────────────────────────────────
exports.TEST_CASES_BY_SCENARIO = exports.TEST_CASES.reduce((acc, tc) => {
    if (!acc[tc.scenario_base])
        acc[tc.scenario_base] = [];
    acc[tc.scenario_base].push(tc);
    return acc;
}, {});
// ─────────────────────────────────────────────────────────────────────────────
// INDEX PAR SEGMENT
// ─────────────────────────────────────────────────────────────────────────────
exports.TEST_CASES_BY_SEGMENT = exports.TEST_CASES.reduce((acc, tc) => {
    if (!acc[tc.segment])
        acc[tc.segment] = [];
    acc[tc.segment].push(tc);
    return acc;
}, {});
// ─────────────────────────────────────────────────────────────────────────────
// RÉSUMÉ
// ─────────────────────────────────────────────────────────────────────────────
exports.SUMMARY = {
    total: exports.TEST_CASES.length,
    par_segment: {
        generaliste: exports.TEST_CASES.filter((t) => t.segment === "generaliste").length,
        sante: exports.TEST_CASES.filter((t) => t.segment === "sante").length,
        artiste_auteur: exports.TEST_CASES.filter((t) => t.segment === "artiste_auteur").length,
        immobilier: exports.TEST_CASES.filter((t) => t.segment === "immobilier").length,
    },
    fiabilite: {
        complet: exports.TEST_CASES.filter((t) => t.expected.niveau_fiabilite === "complet").length,
        estimation: exports.TEST_CASES.filter((t) => t.expected.niveau_fiabilite === "estimation").length,
        partiel: exports.TEST_CASES.filter((t) => t.expected.niveau_fiabilite === "partiel").length,
    },
    note: "Les cas 'estimation' ont des cotisations TNS réel calculées branche par branche. " +
        "Le moteur doit les recalculer via f_cotisations_tns et CFG_TAUX_SOCIAL_TNS_BIC. " +
        "Les valeurs expected sont des points de référence à ±50 € près pour ces cas.",
};
//# sourceMappingURL=test_cases_2026.js.map