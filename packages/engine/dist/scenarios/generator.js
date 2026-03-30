"use strict";
/**
 * scenarios/generator.ts — Génération des scénarios compatibles
 *
 * Produit le produit cartésien contrôlé : BASE × TVA × OPTIONS × AIDES
 * en respectant la matrice de compatibilité.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.genererScenarios = genererScenarios;
const registry_js_1 = require("./registry.js");
/**
 * Génère tous les scénarios compatibles pour un profil donné.
 * Chaque scénario est identifié par un scenario_id unique.
 */
function genererScenarios(input, qual, filtres, params, logger) {
    const scenarios = [];
    const metasBase = (0, registry_js_1.getScenariosForSegment)(qual.segment);
    logger.info(4, "Génération scénarios", {
        detail: {
            segment: qual.segment,
            nb_bases: metasBase.length,
        },
    });
    for (const meta of metasBase) {
        // Vérifier éligibilité de la base
        if (!_isBaseEligible(meta.id, qual))
            continue;
        // Générer les combinaisons TVA
        for (const optTva of meta.options_tva) {
            // Vérifier conditions TVA
            if (optTva === "TVA_FRANCHISE" && filtres.tva_collectee_obligatoire)
                continue;
            // Générer les options VFL si disponibles
            const vflOptions = ["VFL_NON"];
            if (meta.vfl_disponible && !filtres.vfl_exclu) {
                if (qual.flags.FLAG_VFL_POSSIBLE) {
                    vflOptions.push("VFL_OUI");
                }
            }
            for (const optVfl of vflOptions) {
                // Générer les combinaisons de boosters
                const boosterCombinations = _genererCombinaisonsBoosters(meta.id, optTva, input, qual, params);
                for (const boosters of boosterCombinations) {
                    const scenario_id = _buildScenarioId(meta.id, optTva, optVfl, boosters);
                    const sc = {
                        scenario_id,
                        base_id: meta.id,
                        option_tva: optTva,
                        option_vfl: optVfl,
                        boosters_actifs: boosters,
                        options_supplementaires: [],
                        motif_admission: _buildMotifAdmission(meta, optTva, optVfl, boosters),
                    };
                    scenarios.push(sc);
                }
            }
        }
    }
    logger.info(4, "Scénarios générés (avant incompatibilités)", {
        detail: { nb_scenarios: scenarios.length },
    });
    return scenarios;
}
// ─────────────────────────────────────────────────────────────────────────────
// Helpers privés
// ─────────────────────────────────────────────────────────────────────────────
function _isBaseEligible(baseId, qual) {
    const f = qual.flags;
    switch (baseId) {
        case "G_MBIC_VENTE": return f.FLAG_MICRO_BIC_VENTE_POSSIBLE;
        case "G_MBIC_SERVICE": return f.FLAG_MICRO_BIC_SERVICE_POSSIBLE;
        case "G_MBNC": return f.FLAG_MICRO_BNC_POSSIBLE;
        case "G_EI_REEL_BIC_IR": return f.FLAG_EI_REEL_BIC_IR_POSSIBLE;
        case "G_EI_REEL_BIC_IS": return f.FLAG_EI_REEL_BIC_IS_POSSIBLE;
        case "G_EI_REEL_BNC_IR": return f.FLAG_EI_REEL_BNC_IR_POSSIBLE;
        case "G_EI_REEL_BNC_IS": return f.FLAG_EI_REEL_BNC_IS_POSSIBLE;
        case "G_EURL_IS": return f.FLAG_EURL_IS_POSSIBLE;
        case "G_EURL_IR": return f.FLAG_EURL_IR_POSSIBLE;
        case "G_SASU_IS": return f.FLAG_SASU_IS_POSSIBLE;
        case "G_SASU_IR": return f.FLAG_SASU_IR_POSSIBLE;
        case "S_RSPM": return f.FLAG_RSPM_POSSIBLE;
        case "S_MICRO_BNC_SECTEUR_1":
        case "S_MICRO_BNC_SECTEUR_2":
            return qual.segment === "sante" && f.FLAG_SANTE_MICRO_POSSIBLE;
        case "S_EI_REEL_SECTEUR_1":
        case "S_EI_REEL_SECTEUR_2_OPTAM":
        case "S_EI_REEL_SECTEUR_2_NON_OPTAM":
        case "S_EI_REEL_SECTEUR_3_HORS_CONVENTION":
        case "S_SELARL_IS":
        case "S_SELAS_IS":
            return qual.segment === "sante" && f.FLAG_SANTE_REEL_POSSIBLE;
        // Artiste-auteur (V2)
        case "A_BNC_MICRO":
            return qual.segment === "artiste_auteur" && f.FLAG_ARTISTE_AUTEUR_BNC_MICRO_POSSIBLE;
        case "A_BNC_MICRO_TVA_FRANCHISE":
        case "A_BNC_MICRO_TVA_COLLECTEE":
            return qual.segment === "artiste_auteur" && f.FLAG_ARTISTE_AUTEUR_BNC_MICRO_POSSIBLE;
        case "A_BNC_REEL":
        case "A_TS_ABATTEMENT_FORFAITAIRE":
        case "A_TS_FRAIS_REELS":
            return qual.segment === "artiste_auteur";
        // Immobilier (V2)
        case "I_LMNP_MICRO":
            return qual.segment === "immobilier" && f.FLAG_LMNP_MICRO_POSSIBLE;
        case "I_LMNP_REEL":
            return qual.segment === "immobilier";
        case "I_LMP":
            return qual.segment === "immobilier" && f.FLAG_LMP_POSSIBLE;
        default:
            return false;
    }
}
function _genererCombinaisonsBoosters(baseId, optTva, input, qual, params) {
    const boosters_disponibles = [];
    const f = qual.flags;
    const meta = registry_js_1.SCENARIO_REGISTRY[baseId];
    // ACRE
    if (f.FLAG_ACRE_POSSIBLE) {
        boosters_disponibles.push("BOOST_ACRE");
    }
    // ARCE
    if (f.FLAG_ARCE_POSSIBLE) {
        boosters_disponibles.push("BOOST_ARCE");
    }
    // ZFRR (régime réel obligatoire)
    if (f.FLAG_ZFRR_POSSIBLE && meta?.zfrr_compatible === true) {
        boosters_disponibles.push("BOOST_ZFRR");
    }
    // ZFRR+ (idem mais aussi exonération sociale)
    if (f.FLAG_ZFRR_PLUS_POSSIBLE && meta?.zfrr_compatible === true) {
        boosters_disponibles.push("BOOST_ZFRR_PLUS");
    }
    // QPV
    if (f.FLAG_QPV_POSSIBLE && meta?.zfrr_compatible === true) {
        boosters_disponibles.push("BOOST_QPV");
    }
    // ZFU stock droits antérieurs
    if (f.FLAG_ZFU_STOCK_DROITS_POSSIBLE && meta?.zfrr_compatible === true) {
        boosters_disponibles.push("BOOST_ZFU_STOCK");
    }
    // Générer combinaisons : sans booster + chaque booster unique
    // (pas de combinaisons doubles pour limiter l'explosion combinatoire
    // sauf ACRE+ZFRR qui sont compatibles et ACRE+ARCE)
    const combinaisons = [[]]; // sans booster
    // Chaque booster seul
    for (const b of boosters_disponibles) {
        combinaisons.push([b]);
    }
    // ACRE + ARCE combinés (compatibles)
    if (boosters_disponibles.includes("BOOST_ACRE") &&
        boosters_disponibles.includes("BOOST_ARCE")) {
        combinaisons.push(["BOOST_ACRE", "BOOST_ARCE"]);
    }
    // ACRE + zone (si non-cumul pas violé)
    const zonesBoosters = boosters_disponibles.filter((b) => ["BOOST_ZFRR", "BOOST_ZFRR_PLUS", "BOOST_QPV", "BOOST_ZFU_STOCK"].includes(b));
    for (const zone of zonesBoosters) {
        if (boosters_disponibles.includes("BOOST_ACRE")) {
            combinaisons.push(["BOOST_ACRE", zone]);
        }
        if (boosters_disponibles.includes("BOOST_ARCE")) {
            combinaisons.push(["BOOST_ARCE", zone]);
        }
        if (boosters_disponibles.includes("BOOST_ACRE") &&
            boosters_disponibles.includes("BOOST_ARCE")) {
            combinaisons.push(["BOOST_ACRE", "BOOST_ARCE", zone]);
        }
    }
    return combinaisons;
}
function _buildScenarioId(baseId, optTva, optVfl, boosters) {
    const parts = [baseId];
    if (optTva === "TVA_COLLECTEE")
        parts.push("TVA");
    if (optVfl === "VFL_OUI")
        parts.push("VFL");
    if (boosters.length > 0) {
        parts.push(...boosters.map((b) => b.replace("BOOST_", "")));
    }
    return parts.join("+");
}
function _buildMotifAdmission(meta, optTva, optVfl, boosters) {
    const parts = [`Régime ${meta.label}`];
    if (optTva === "TVA_COLLECTEE")
        parts.push("avec TVA collectée");
    if (optVfl === "VFL_OUI")
        parts.push("avec Versement Libératoire");
    if (boosters.length > 0) {
        parts.push(`Boosters : ${boosters.join(", ")}`);
    }
    return parts.join(" — ");
}
//# sourceMappingURL=generator.js.map