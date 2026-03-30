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
export type TestCase = {
    id: string;
    description: string;
    /** Groupe fonctionnel */
    segment: "generaliste" | "sante" | "artiste_auteur" | "immobilier";
    /** ID de scénario base selon ALGORITHME.md section 3.2 */
    scenario_base: string;
    inputs: Record<string, unknown>;
    expected: {
        /** Cotisations sociales nettes */
        COTISATIONS_SOCIALES_NETTES: number;
        /** Base imposable à l'IR (ou à l'IS selon le scénario) */
        BASE_IR_SCENARIO?: number;
        /** IS dû par la société */
        IS_DU_SCENARIO?: number;
        /** IR attribuable au scénario (méthode différentielle) */
        IR_ATTRIBUABLE_SCENARIO?: number;
        /** Net disponible avant IR */
        NET_AVANT_IR: number;
        /** Net disponible après IR */
        NET_APRES_IR: number;
        /** Flags d'éligibilité attendus */
        flags?: Record<string, boolean>;
        /** Scénarios qui doivent être exclus */
        scenarios_exclus?: string[];
        /** Avertissements attendus */
        avertissements?: string[];
        /** Niveau de fiabilité attendu */
        niveau_fiabilite?: "complet" | "partiel" | "estimation";
    };
    /** Notes de calcul pour reproductibilité */
    calcul_notes: string;
};
export declare const TEST_CASES: TestCase[];
export declare const TEST_CASES_BY_SCENARIO: Record<string, TestCase[]>;
export declare const TEST_CASES_BY_SEGMENT: Record<string, TestCase[]>;
export declare const SUMMARY: {
    readonly total: number;
    readonly par_segment: {
        readonly generaliste: number;
        readonly sante: number;
        readonly artiste_auteur: number;
        readonly immobilier: number;
    };
    readonly fiabilite: {
        readonly complet: number;
        readonly estimation: number;
        readonly partiel: number;
    };
    readonly note: string;
};
//# sourceMappingURL=test_cases_2026.d.ts.map