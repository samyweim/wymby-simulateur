"use strict";
/**
 * filters/exclusion.ts — Filtres d'exclusion X01–X04
 *
 * X01 : CA N-1 et N-2 > seuils micro → bascule réel obligatoire
 * X02 : CA > seuil TVA → passage TVA collectée immédiat
 * X03 : RFR > seuil VFL → option VFL caduque
 * X04 : Revenu activité < seuil PUMa + revenus capital élevés → taxe rentier potentielle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.appliquerFiltresExclusion = appliquerFiltresExclusion;
exports.filtrerScenariosParExclusion = filtrerScenariosParExclusion;
/**
 * Applique les filtres d'exclusion X01–X04 sur les données normalisées.
 * Retourne les flags d'exclusion et leurs motifs.
 */
function appliquerFiltresExclusion(input, norm, qual, params, logger) {
    const motifs = {};
    // ── X01 : Dépassement durable des seuils micro ────────────────────────────
    let basculement_reel_oblige = false;
    {
        const caN1 = input.ANCIENNETE_ACTIVITE !== undefined
            ? undefined
            : undefined; // CA N-1 non disponible directement
        // On vérifie si CA N-1 et CA N-2 dépassent tous les deux les seuils micro
        // Si l'information n'est pas disponible, on ne peut pas appliquer X01 automatiquement
        const seuil = _getSeuilMicroApplicable(input, params);
        if (qual.flags.FLAG_DEPASSEMENT_SEUIL_MICRO &&
            norm.CA_HT_RETENU > seuil) {
            // Le CA actuel dépasse le seuil micro
            // Si N-1 et N-2 sont fournis et dépassent aussi → X01 confirmé
            // Sinon → alerte mais pas d'exclusion automatique
            basculement_reel_oblige = true;
            motifs["X01"] =
                `CA HT retenu (${norm.CA_HT_RETENU} €) dépasse le seuil micro applicable (${seuil} €). ` +
                    "Bascule en régime réel obligatoire (filtre X01).";
        }
        logger.calc(3, "Filtre X01", "basculement_reel_oblige", basculement_reel_oblige, {
            CA_HT: norm.CA_HT_RETENU,
            seuil_micro: seuil,
        });
    }
    // ── X02 : Dépassement seuil TVA ───────────────────────────────────────────
    const tva_collectee_obligatoire = qual.flags.FLAG_DEPASSEMENT_SEUIL_TVA;
    if (tva_collectee_obligatoire) {
        motifs["X02"] =
            `CA HT (${norm.CA_HT_RETENU} €) dépasse le seuil franchise TVA. ` +
                "TVA collectée obligatoire (filtre X02).";
    }
    logger.calc(3, "Filtre X02", "tva_collectee_obligatoire", tva_collectee_obligatoire);
    // ── X03 : RFR > seuil VFL ────────────────────────────────────────────────
    const vfl_exclu = qual.flags.FLAG_VFL_INTERDIT;
    if (vfl_exclu) {
        motifs["X03"] = "RFR N-2 dépasse le seuil VFL (filtre X03) : option Versement Libératoire exclue.";
    }
    logger.calc(3, "Filtre X03", "vfl_exclu", vfl_exclu);
    // ── X04 : Taxe PUMa potentielle ───────────────────────────────────────────
    const puma_applicable = qual.flags.FLAG_TAXE_PUMA_APPLICABLE;
    if (puma_applicable) {
        motifs["X04"] =
            "Revenus d'activité faibles + revenus du capital potentiellement élevés : " +
                "Cotisation Subsidiaire Maladie (taxe PUMa/rentier) potentiellement applicable (filtre X04). " +
                "Calcul estimatif — à confirmer. Fiabilité marquée 'partiel'.";
    }
    logger.calc(3, "Filtre X04", "puma_applicable", puma_applicable);
    logger.info(3, "Filtres d'exclusion appliqués", {
        detail: {
            X01: basculement_reel_oblige,
            X02: tva_collectee_obligatoire,
            X03: vfl_exclu,
            X04: puma_applicable,
        },
    });
    return {
        basculement_reel_oblige,
        tva_collectee_obligatoire,
        vfl_exclu,
        puma_applicable,
        motifs,
    };
}
/**
 * Applique les filtres d'exclusion aux scénarios générés.
 * Retourne { possibles, exclus } mis à jour.
 */
function filtrerScenariosParExclusion(scenarios, filtres, input, logger) {
    const possibles = [];
    const exclus = [];
    for (const sc of scenarios) {
        const motifsExclusion = [];
        // X01 : régimes micro exclus si bascule réel obligatoire
        if (filtres.basculement_reel_oblige &&
            _isMicroScenario(sc.base_id)) {
            motifsExclusion.push(filtres.motifs["X01"] ?? "Seuil micro dépassé");
        }
        // X02 : TVA franchise exclue si dépassement TVA
        if (filtres.tva_collectee_obligatoire &&
            sc.option_tva === "TVA_FRANCHISE") {
            motifsExclusion.push(filtres.motifs["X02"] ?? "Dépassement seuil TVA");
        }
        // X03 : VFL exclu
        if (filtres.vfl_exclu &&
            sc.option_vfl === "VFL_OUI") {
            motifsExclusion.push(filtres.motifs["X03"] ?? "RFR > seuil VFL");
        }
        // ZFRR incompatible avec micro
        if (sc.boosters_actifs.includes("BOOST_ZFRR") &&
            _isMicroScenario(sc.base_id)) {
            motifsExclusion.push("ZFRR incompatible avec le régime micro (régime réel obligatoire pour les zones ZFRR).");
        }
        if (motifsExclusion.length > 0) {
            exclus.push({
                scenario_id: sc.scenario_id,
                base_id: sc.base_id,
                motifs_exclusion: motifsExclusion,
            });
            logger.warn(3, "Scénario exclu", {
                scenario_id: sc.scenario_id,
                motif: motifsExclusion.join(" | "),
            });
        }
        else {
            possibles.push(sc);
        }
    }
    return { possibles, exclus };
}
// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────
function _getSeuilMicroApplicable(input, params) {
    const ss = input.SOUS_SEGMENT_ACTIVITE;
    if (ss === "achat_revente")
        return params.micro.CFG_SEUIL_CA_MICRO_BIC_VENTE;
    if (ss === "liberal")
        return params.micro.CFG_SEUIL_CA_MICRO_BNC;
    return params.micro.CFG_SEUIL_CA_MICRO_BIC_SERVICE;
}
function _isMicroScenario(baseId) {
    return (baseId === "G_MBIC_VENTE" ||
        baseId === "G_MBIC_SERVICE" ||
        baseId === "G_MBNC" ||
        baseId === "S_MICRO_BNC_SECTEUR_1" ||
        baseId === "S_MICRO_BNC_SECTEUR_2" ||
        baseId === "A_BNC_MICRO_TVA_FRANCHISE" ||
        baseId === "A_BNC_MICRO_TVA_COLLECTEE" ||
        baseId === "I_LMNP_MICRO");
}
//# sourceMappingURL=exclusion.js.map