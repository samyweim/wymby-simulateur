"use strict";
/**
 * filters/incompatibility-matrix.ts — Matrice des incompatibilités
 *
 * Vérifie les incompatibilités entre :
 * - Régime de base et options (micro/réel, VFL/réel, LMP/LMNP, etc.)
 * - Aides et boosters (non-cumul, conditions mutuellement exclusives)
 * - Conditions temporelles (IR temporaire, ZFU fermée)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifierIncompatibilites = verifierIncompatibilites;
/** Vérifie les incompatibilités de la matrice et retourne les scénarios exclus */
function verifierIncompatibilites(scenarios, input, params, logger) {
    const possibles = [];
    const exclus = [];
    for (const sc of scenarios) {
        const motifs = _verifierScenario(sc, input, params);
        if (motifs.length > 0) {
            exclus.push({
                scenario_id: sc.scenario_id,
                base_id: sc.base_id,
                motifs_exclusion: motifs,
            });
            logger.warn(5, "Incompatibilité matrice", {
                scenario_id: sc.scenario_id,
                motif: motifs.join(" | "),
            });
        }
        else {
            possibles.push(sc);
        }
    }
    logger.info(5, "Matrice incompatibilités appliquée", {
        detail: {
            scenarios_entrants: scenarios.length,
            scenarios_exclus: exclus.length,
            scenarios_retenus: possibles.length,
        },
    });
    return { possibles, exclus };
}
function _verifierScenario(sc, input, params) {
    const motifs = [];
    // ── VFL + régime réel : structurellement incompatibles ───────────────────
    if (sc.option_vfl === "VFL_OUI" &&
        _isReelScenario(sc.base_id)) {
        motifs.push("Incompatibilité structurelle : VFL (Versement Libératoire) impossible avec un régime réel.");
    }
    // ── ZFU nouvelles entrées 2026 fermées ────────────────────────────────────
    if (sc.boosters_actifs.includes("BOOST_ZFU_STOCK") &&
        params.zones.CFG_ZFU_NOUVELLES_ENTREES_AUTORISEES === false &&
        input.EST_IMPLANTE_EN_ANCIENNE_ZFU_OUVRANT_DROITS !== true) {
        motifs.push("ZFU fermée aux nouvelles entrées depuis 01/01/2026 (LF 2026 art. 42). " +
            "Seul le stock de droits antérieurs est maintenu.");
    }
    // ── ARCE + maintien ARE : mutuellement exclusifs ──────────────────────────
    if (sc.boosters_actifs.includes("BOOST_ARCE") &&
        !params.aides.CFG_ARCE_IMPACT_COMPARAISON.inclure_dans_net_recurrent) {
        // Pas d'incompatibilité technique — ARCE est simplement modélisée
        // comme flux trésorerie. Pas de suppression du scénario.
        // L'incompatibilité ARCE/ARE maintenance est une condition d'éligibilité,
        // vérifiée dans qualifier.ts.
    }
    // ── Non-cumul zones ───────────────────────────────────────────────────────
    const zonesActives = sc.boosters_actifs.filter((b) => ["BOOST_ZFRR", "BOOST_ZFRR_PLUS", "BOOST_QPV", "BOOST_ZFU_STOCK"].includes(b));
    if (zonesActives.length > 1) {
        motifs.push(`Non-cumul exonérations de zone : ${zonesActives.join(" + ")} incompatibles simultanément. ` +
            params.zones.CFG_NON_CUMUL_EXONERATIONS_ZONE.principe);
    }
    // ── SASU/EURL IR temporaire : durée limitée ────────────────────────────────
    if ((sc.base_id === "G_EURL_IR" || sc.base_id === "G_SASU_IR") &&
        input.DATE_CREATION_ACTIVITE) {
        const dureeMax = params.temporalite.CFG_DUREE_OPTION_IR_TEMPORAIRE_SOCIETE.nb_exercices_max;
        const dateCreation = new Date(input.DATE_CREATION_ACTIVITE);
        const now = new Date();
        const anneesEcoules = (now.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (anneesEcoules > dureeMax) {
            motifs.push(`Option IR temporaire EURL/SASU expirée (durée max ${dureeMax} exercices, ` +
                `activité créée il y a ${Math.floor(anneesEcoules)} an(s)).`);
        }
    }
    // ── ZIP/ZAC réservé aux professionnels de santé ──────────────────────────
    if (sc.boosters_actifs.includes("BOOST_ZIP_ZAC") &&
        input.SEGMENT_ACTIVITE !== "sante") {
        motifs.push("ZIP/ZAC réservé aux professionnels de santé éligibles (hors champ pour ce profil).");
    }
    // ── CPAM aide réservée aux conventionnés ─────────────────────────────────
    if (sc.boosters_actifs.includes("BOOST_CPAM") &&
        input.EST_CONVENTIONNE !== true) {
        motifs.push("Aide CPAM réservée aux professionnels de santé conventionnés. Non éligible.");
    }
    // ── RAAP réduit hors artistes-auteurs ─────────────────────────────────────
    if (sc.boosters_actifs.includes("BOOST_RAAP_REDUIT") &&
        input.SEGMENT_ACTIVITE !== "artiste_auteur") {
        motifs.push("RAAP réservé aux artistes-auteurs. Non applicable pour ce segment.");
    }
    return motifs;
}
function _isReelScenario(baseId) {
    return (baseId === "G_EI_REEL_BIC_IR" ||
        baseId === "G_EI_REEL_BIC_IS" ||
        baseId === "G_EI_REEL_BNC_IR" ||
        baseId === "G_EI_REEL_BNC_IS" ||
        baseId === "G_EURL_IS" ||
        baseId === "G_EURL_IR" ||
        baseId === "G_SASU_IS" ||
        baseId === "G_SASU_IR");
}
//# sourceMappingURL=incompatibility-matrix.js.map