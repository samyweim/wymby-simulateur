"use strict";
/**
 * packages/engine/src/index.ts — Point d'entrée du moteur fiscal WYMBY
 *
 * Pipeline d'exécution complet (ALGORITHME.md section 7) :
 *  1. Validation et normalisation des entrées
 *  2. Contrôles de cohérence préalables
 *  3. Qualification du segment et des flags
 *  4–7. Génération et filtrage des scénarios
 *  8–9. Suppression des incompatibilités
 *  10. Calcul scénario par scénario
 *  11. Comparaison et classement
 *  12. Construction de la sortie structurée
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeLogs = exports.filterLogsByScenario = exports.filterLogs = exports.formatEngineLogs = exports.FISCAL_PARAMS_2026 = void 0;
exports.runEngine = runEngine;
exports.runEngineWithLogs = runEngineWithLogs;
const config_1 = require("@wymby/config");
Object.defineProperty(exports, "FISCAL_PARAMS_2026", { enumerable: true, get: function () { return config_1.FISCAL_PARAMS_2026; } });
const logger_js_1 = require("./logger.js");
const guards_js_1 = require("./guards.js");
const normalizer_js_1 = require("./normalizer.js");
const qualifier_js_1 = require("./qualifier.js");
const exclusion_js_1 = require("./filters/exclusion.js");
const incompatibility_matrix_js_1 = require("./filters/incompatibility-matrix.js");
const generator_js_1 = require("./scenarios/generator.js");
const booster_applicator_js_1 = require("./scenarios/booster-applicator.js");
const micro_js_1 = require("./calculators/micro.js");
const ei_reel_js_1 = require("./calculators/ei-reel.js");
const societes_js_1 = require("./calculators/societes.js");
const comparator_js_1 = require("./comparator.js");
const output_builder_js_1 = require("./output-builder.js");
const log_formatter_js_1 = require("./log-formatter.js");
Object.defineProperty(exports, "formatEngineLogs", { enumerable: true, get: function () { return log_formatter_js_1.formatEngineLogs; } });
Object.defineProperty(exports, "filterLogs", { enumerable: true, get: function () { return log_formatter_js_1.filterLogs; } });
Object.defineProperty(exports, "filterLogsByScenario", { enumerable: true, get: function () { return log_formatter_js_1.filterLogsByScenario; } });
Object.defineProperty(exports, "summarizeLogs", { enumerable: true, get: function () { return log_formatter_js_1.summarizeLogs; } });
// ─────────────────────────────────────────────────────────────────────────────
// API PUBLIQUE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Exécute le moteur d'arbitrage fiscal complet.
 *
 * @param input — Données utilisateur normalisées
 * @param params — Paramètres fiscaux (défaut : FISCAL_PARAMS_2026)
 * @param debugMode — Active les logs structurés (défaut : false)
 */
function runEngine(input, params = config_1.FISCAL_PARAMS_2026, debugMode = false) {
    const [output] = _runEngineInternal(input, params, debugMode);
    return output;
}
/**
 * Exécute le moteur et retourne aussi les logs DEBUG.
 * Usage test : `const [output, logs] = runEngineWithLogs(input, params);`
 */
function runEngineWithLogs(input, params = config_1.FISCAL_PARAMS_2026) {
    return _runEngineInternal(input, params, true);
}
// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE INTERNE
// ─────────────────────────────────────────────────────────────────────────────
function _runEngineInternal(input, params, debugMode) {
    const logger = (0, logger_js_1.createLogger)(debugMode);
    const avertissements_globaux = [];
    logger.info(1, "Moteur démarré", {
        detail: { segment: input.SEGMENT_ACTIVITE, ca: input.CA_ENCAISSE_UTILISATEUR },
    });
    // ── Validation des entrées ─────────────────────────────────────────────────
    const erreurs = (0, guards_js_1.validateUserInput)(input);
    if (erreurs.length > 0) {
        avertissements_globaux.push(...erreurs.map((e) => `[ERREUR INPUT] ${e}`));
        logger.error(1, "Erreurs de validation", { detail: { erreurs } });
    }
    // ── Étape 1 : Normalisation ───────────────────────────────────────────────
    const norm = (0, normalizer_js_1.normaliserEntrees)(input, params, logger);
    avertissements_globaux.push(...norm.avertissements);
    // ── Étape 2 : Qualification du profil ─────────────────────────────────────
    const qual = (0, qualifier_js_1.qualifierProfil)(input, norm, params, logger);
    avertissements_globaux.push(...qual.avertissements);
    // ── Étape 3 : Filtres d'exclusion ─────────────────────────────────────────
    const filtres = (0, exclusion_js_1.appliquerFiltresExclusion)(input, norm, qual, params, logger);
    // ── Étapes 4–6 : Génération des scénarios ─────────────────────────────────
    const scenarios_bruts = (0, generator_js_1.genererScenarios)(input, qual, filtres, params, logger);
    logger.info(4, "Scénarios générés (brut)", {
        detail: { count: scenarios_bruts.length },
    });
    // ── Étape 7 : Application des filtres d'exclusion ─────────────────────────
    const { possibles: apres_filtres_excl, exclus: exclus_filtres } = (0, exclusion_js_1.filtrerScenariosParExclusion)(scenarios_bruts, filtres, input, logger);
    // ── Étape 8 : Vérification matrice d'incompatibilités ─────────────────────
    const { possibles: scenarios_finaux, exclus: exclus_compat } = (0, incompatibility_matrix_js_1.verifierIncompatibilites)(apres_filtres_excl, input, params, logger);
    const tous_exclus = [...exclus_filtres, ...exclus_compat];
    logger.info(5, "Scénarios après incompatibilités", {
        detail: {
            retenus: scenarios_finaux.length,
            exclus: tous_exclus.length,
        },
    });
    // ── Étape 9 : Calcul scénario par scénario ────────────────────────────────
    const calculs = [];
    for (const sc of scenarios_finaux) {
        try {
            const calcul = _calculerScenario(sc, input, norm, params, logger);
            if (calcul) {
                calculs.push(calcul);
            }
        }
        catch (err) {
            logger.error(7, "Erreur calcul scénario", {
                scenario_id: sc.scenario_id,
                motif: String(err),
            });
            avertissements_globaux.push(`Erreur de calcul pour le scénario ${sc.scenario_id} : ${String(err)}`);
        }
    }
    logger.info(7, "Calculs effectués", { detail: { nb_calcules: calculs.length } });
    // ── Étape 10 : Comparaison ────────────────────────────────────────────────
    const scenario_reference_id = (0, comparator_js_1.determinerScenarioReference)(calculs);
    if (!scenario_reference_id && calculs.length > 0) {
        avertissements_globaux.push("Impossible de déterminer un scénario de référence. Comparaison non disponible.");
    }
    const comparaison = scenario_reference_id
        ? (0, comparator_js_1.construireComparaison)(calculs, scenario_reference_id, logger)
        : {
            scenario_reference_id: "",
            classement_net_apres_ir: [],
            classement_super_net: [],
            classement_robustesse: [],
            classement_complexite: [],
            ecarts: [],
        };
    const recommandation = (0, comparator_js_1.determinerRecommandation)(calculs, comparaison, logger);
    // ── Étape 11 : Construction de la sortie ──────────────────────────────────
    const output = (0, output_builder_js_1.construireEngineOutput)(input, norm, qual, scenarios_finaux, tous_exclus, calculs, comparaison, recommandation, avertissements_globaux, logger);
    logger.info(10, "Moteur terminé", {
        detail: {
            scenarios_calcules: calculs.length,
            recommandation: recommandation?.scenario_recommande_id ?? "aucune",
        },
    });
    return [output, logger.getLogs()];
}
// ─────────────────────────────────────────────────────────────────────────────
// Dispatcher de calcul par type de scénario
// ─────────────────────────────────────────────────────────────────────────────
function _calculerScenario(sc, input, norm, params, logger) {
    const baseId = sc.base_id;
    // Appliquer les boosters pour obtenir exonération et réductions
    // Utiliser annee 1 par défaut si non connue
    const annee_dans_dispositif = _getAnneeDispositif(input);
    const boosterResult = (0, booster_applicator_js_1.appliquerBoosters)(sc.boosters_actifs, 0, // sera recalculé après cotisations
    0, // idem
    input, params, annee_dans_dispositif, sc.scenario_id);
    let rawResultat = null;
    if (_isMicroScenario(baseId)) {
        rawResultat = (0, micro_js_1.calculerMicro)({
            scenario_id: sc.scenario_id,
            CA_HT_RETENU: norm.CA_HT_RETENU,
            TVA_NETTE_DUE: norm.TVA_NETTE_DUE,
            type_micro: _getMicroType(baseId),
            option_vfl: sc.option_vfl === "VFL_OUI",
            acre_active: sc.boosters_actifs.includes("BOOST_ACRE"),
            date_creation: input.DATE_CREATION_ACTIVITE
                ? new Date(input.DATE_CREATION_ACTIVITE)
                : undefined,
            exoneration_zone: boosterResult.exoneration_fiscale,
            autres_revenus_foyer: input.AUTRES_REVENUS_FOYER_IMPOSABLES,
            autres_charges_foyer: input.AUTRES_CHARGES_DEDUCTIBLES_FOYER,
            nombre_parts_fiscales: norm.NOMBRE_PARTS_FISCALES,
            droits_are_restants: input.DROITS_ARE_RESTANTS,
        }, params, logger);
    }
    else if (_isEIReelScenario(baseId)) {
        rawResultat = (0, ei_reel_js_1.calculerEIReel)({
            scenario_id: sc.scenario_id,
            RECETTES_PRO_RETENUES: norm.RECETTES_PRO_RETENUES,
            CHARGES_DECAISSEES: norm.CHARGES_DECAISSEES_RETENUES,
            CHARGES_DEDUCTIBLES: norm.CHARGES_DEDUCTIBLES_RETENUES,
            TVA_NETTE_DUE: norm.TVA_NETTE_DUE,
            type_ei: _getEIType(baseId),
            acre_active: sc.boosters_actifs.includes("BOOST_ACRE"),
            date_creation: input.DATE_CREATION_ACTIVITE
                ? new Date(input.DATE_CREATION_ACTIVITE)
                : undefined,
            exoneration_fiscale_zone: boosterResult.exoneration_fiscale,
            autres_revenus_foyer: input.AUTRES_REVENUS_FOYER_IMPOSABLES,
            autres_charges_foyer: input.AUTRES_CHARGES_DEDUCTIBLES_FOYER,
            nombre_parts_fiscales: norm.NOMBRE_PARTS_FISCALES,
            droits_are_restants: input.DROITS_ARE_RESTANTS,
            remuneration_dirigeant: input.REMUNERATION_DIRIGEANT_ENVISAGEE,
        }, params, logger);
    }
    else if (_isSocieteScenario(baseId)) {
        rawResultat = (0, societes_js_1.calculerSociete)({
            scenario_id: sc.scenario_id,
            RECETTES_PRO_RETENUES: norm.RECETTES_PRO_RETENUES,
            CHARGES_DEDUCTIBLES: norm.CHARGES_DEDUCTIBLES_RETENUES,
            CHARGES_DECAISSEES: norm.CHARGES_DECAISSEES_RETENUES,
            TVA_NETTE_DUE: norm.TVA_NETTE_DUE,
            type_societe: _getSocieteType(baseId),
            remuneration_dirigeant: input.REMUNERATION_DIRIGEANT_ENVISAGEE ?? norm.CA_HT_RETENU * 0.5,
            dividendes_envisages: input.DIVIDENDES_ENVISAGES,
            acre_active: sc.boosters_actifs.includes("BOOST_ACRE"),
            date_creation: input.DATE_CREATION_ACTIVITE
                ? new Date(input.DATE_CREATION_ACTIVITE)
                : undefined,
            exoneration_fiscale_zone: boosterResult.exoneration_fiscale,
            autres_revenus_foyer: input.AUTRES_REVENUS_FOYER_IMPOSABLES,
            autres_charges_foyer: input.AUTRES_CHARGES_DEDUCTIBLES_FOYER,
            nombre_parts_fiscales: norm.NOMBRE_PARTS_FISCALES,
            droits_are_restants: input.DROITS_ARE_RESTANTS,
        }, params, logger);
    }
    else {
        // Segment V2 (santé, artiste, immobilier) — stub
        logger.warn(7, "Scénario V2 non calculé", { scenario_id: sc.scenario_id });
        return null;
    }
    if (!rawResultat)
        return null;
    // Ajouter l'aide ARCE trésorerie
    if (sc.boosters_actifs.includes("BOOST_ARCE") && boosterResult.aide_tresorerie > 0) {
        rawResultat.intermediaires.AIDE_ARCE_TRESORERIE = boosterResult.aide_tresorerie;
        rawResultat.intermediaires.SUPER_NET =
            (rawResultat.intermediaires.NET_APRES_IR ?? 0) + boosterResult.aide_tresorerie;
    }
    const calcul = {
        scenario_id: sc.scenario_id,
        base_id: sc.base_id,
        option_tva: sc.option_tva,
        option_vfl: sc.option_vfl,
        boosters_actifs: sc.boosters_actifs,
        intermediaires: rawResultat.intermediaires,
        scores: {
            SCORE_COMPLEXITE_ADMIN: 1,
            SCORE_ROBUSTESSE: 1,
            DEPENDANCE_AIDES_RATIO: 0,
            SCORE_GLOBAL_SCENARIO: 0,
            TAUX_PRELEVEMENTS_GLOBAL: 0,
        },
        niveau_fiabilite: rawResultat.niveau_fiabilite,
        avertissements_scenario: rawResultat.avertissements,
    };
    // Calculer les scores
    calcul.scores = (0, comparator_js_1.calculerScores)(calcul, params);
    logger.calc(7, "Scénario calculé", "NET_APRES_IR", calcul.intermediaires.NET_APRES_IR ?? 0, {
        CA: norm.CA_HT_RETENU,
        cotisations: calcul.intermediaires.COTISATIONS_SOCIALES_NETTES,
        ir: calcul.intermediaires.IR_ATTRIBUABLE_SCENARIO,
        is: calcul.intermediaires.IS_DU_SCENARIO,
    }, sc.scenario_id);
    return calcul;
}
// ─────────────────────────────────────────────────────────────────────────────
// Helpers de dispatch
// ─────────────────────────────────────────────────────────────────────────────
function _isMicroScenario(id) {
    return id === "G_MBIC_VENTE" || id === "G_MBIC_SERVICE" || id === "G_MBNC";
}
function _isEIReelScenario(id) {
    return (id === "G_EI_REEL_BIC_IR" ||
        id === "G_EI_REEL_BIC_IS" ||
        id === "G_EI_REEL_BNC_IR" ||
        id === "G_EI_REEL_BNC_IS");
}
function _isSocieteScenario(id) {
    return (id === "G_EURL_IS" ||
        id === "G_EURL_IR" ||
        id === "G_SASU_IS" ||
        id === "G_SASU_IR");
}
function _getMicroType(id) {
    if (id === "G_MBIC_VENTE")
        return "BIC_VENTE";
    if (id === "G_MBIC_SERVICE")
        return "BIC_SERVICE";
    return "BNC";
}
function _getEIType(id) {
    if (id === "G_EI_REEL_BIC_IR")
        return "BIC_IR";
    if (id === "G_EI_REEL_BIC_IS")
        return "BIC_IS";
    if (id === "G_EI_REEL_BNC_IS")
        return "BNC_IS";
    return "BNC_IR";
}
function _getSocieteType(id) {
    if (id === "G_EURL_IS")
        return "EURL_IS";
    if (id === "G_EURL_IR")
        return "EURL_IR";
    if (id === "G_SASU_IR")
        return "SASU_IR";
    return "SASU_IS";
}
function _getAnneeDispositif(input) {
    if (!input.DATE_CREATION_ACTIVITE)
        return 1;
    const dateCreation = new Date(input.DATE_CREATION_ACTIVITE);
    const now = new Date();
    const annees = Math.floor((now.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return Math.max(1, annees + 1);
}
//# sourceMappingURL=index.js.map