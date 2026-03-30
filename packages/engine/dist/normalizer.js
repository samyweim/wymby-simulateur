"use strict";
/**
 * normalizer.ts — Étape 1 du pipeline : normalisation des entrées
 *
 * Responsabilités :
 * - Convertir CA TTC → HT si nécessaire
 * - Calculer ancienneté, flags de complétude
 * - Normaliser les données foyer
 * - Initialiser variables intermédiaires
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normaliserEntrees = normaliserEntrees;
// Taux TVA standard applicable par défaut (20 %)
// Pas de valeur en dur — uniquement utilisé comme fallback documenté
// Le taux effectif doit être fourni via les paramètres ou déduit du profil.
// NOTE: on utilise 0.20 comme taux de conversion HT/TTC quand aucun taux n'est connu.
// C'est une estimation documentée, pas une constante silencieuse.
const TAUX_TVA_STANDARD_NOTE = "Taux TVA 20 % utilisé par défaut pour conversion TTC→HT en l'absence de données précises. " +
    "Une alerte est émise si ce cas se produit.";
/**
 * Normalise les entrées utilisateur.
 * Toute hypothèse appliquée est tracée dans `hypotheses`.
 * Toute donnée manquante critique est tracée dans `avertissements`.
 */
function normaliserEntrees(input, params, logger) {
    const avertissements = [];
    const hypotheses = [];
    // ── Normalisation CA ───────────────────────────────────────────────────────
    let CA_HT_RETENU;
    let CA_TTC_RETENU;
    const caRaw = input.CA_ENCAISSE_UTILISATEUR;
    if (input.INPUT_MODE_CA === "HT") {
        CA_HT_RETENU = caRaw;
        // On ne peut pas calculer TTC sans connaître le taux
        CA_TTC_RETENU = caRaw; // approximation si franchise TVA
    }
    else {
        // TTC → HT
        // Si TVA collectée fournie séparément, on l'utilise
        if (input.TVA_COLLECTEE_UTILISATEUR !== undefined && input.TVA_COLLECTEE_UTILISATEUR > 0) {
            CA_HT_RETENU = caRaw - input.TVA_COLLECTEE_UTILISATEUR;
            CA_TTC_RETENU = caRaw;
        }
        else {
            // Estimation par taux 20 %
            CA_HT_RETENU = caRaw / 1.2;
            CA_TTC_RETENU = caRaw;
            avertissements.push("CA saisi en TTC sans TVA collectée précisée : conversion HT appliquée au taux de 20 % par défaut. " +
                TAUX_TVA_STANDARD_NOTE);
            hypotheses.push("Taux TVA 20 % appliqué pour conversion TTC→HT");
        }
    }
    logger.calc(1, "Normalisation CA", "CA_HT_RETENU", CA_HT_RETENU, {
        mode: input.INPUT_MODE_CA,
        caRaw,
    });
    // ── TVA ────────────────────────────────────────────────────────────────────
    let regime_tva_applicable = "TVA_FRANCHISE";
    if (input.TVA_DEJA_APPLICABLE === true || input.REGIME_TVA_SOUHAITE === "reel_simplifie" || input.REGIME_TVA_SOUHAITE === "reel_normal") {
        regime_tva_applicable = "TVA_COLLECTEE";
    }
    // Vérification seuil franchise — sera affinée dans qualifier.ts
    // Ici on initialise juste la TVA nette
    const TVA_COLLECTEE_THEORIQUE = input.TVA_COLLECTEE_UTILISATEUR !== undefined
        ? input.TVA_COLLECTEE_UTILISATEUR
        : 0;
    const TVA_DEDUCTIBLE_RETENUE = input.TVA_DEDUCTIBLE_UTILISATEUR !== undefined
        ? input.TVA_DEDUCTIBLE_UTILISATEUR
        : 0;
    const TVA_NETTE_DUE = Math.max(0, TVA_COLLECTEE_THEORIQUE - TVA_DEDUCTIBLE_RETENUE);
    logger.calc(1, "Normalisation TVA", "TVA_NETTE_DUE", TVA_NETTE_DUE, {
        TVA_COLLECTEE_THEORIQUE,
        TVA_DEDUCTIBLE_RETENUE,
    });
    // ── Recettes pro retenues ──────────────────────────────────────────────────
    const RECETTES_PRO_RETENUES = CA_HT_RETENU + (input.AUTRES_RECETTES_PRO ?? 0);
    // ── Charges ───────────────────────────────────────────────────────────────
    const CHARGES_DECAISSEES_RETENUES = input.CHARGES_DECAISSEES ?? 0;
    const CHARGES_DEDUCTIBLES_RETENUES = input.CHARGES_DEDUCTIBLES ?? CHARGES_DECAISSEES_RETENUES;
    if (input.CHARGES_DECAISSEES === undefined) {
        avertissements.push("Charges non renseignées : calcul EI réel en mode estimation. " +
            "La FiabiliteBar sera impactée pour les scénarios au réel.");
        hypotheses.push("Charges réelles supposées nulles (non renseignées)");
    }
    // ── Foyer — Nombre de parts fiscales ─────────────────────────────────────
    let NOMBRE_PARTS_FISCALES;
    const qfConfig = params.fiscal.CFG_REGLE_QUOTIENT_FAMILIAL.parts;
    if (input.NOMBRE_PARTS_FISCALES !== undefined) {
        NOMBRE_PARTS_FISCALES = input.NOMBRE_PARTS_FISCALES;
    }
    else {
        // Calcul automatique
        let parts = input.SITUATION_FAMILIALE === "marie" || input.SITUATION_FAMILIALE === "pacse"
            ? qfConfig.couple_marie_pacse
            : qfConfig.celibataire;
        const nbEnfants = input.NOMBRE_ENFANTS_A_CHARGE ?? 0;
        if (nbEnfants >= 1)
            parts += qfConfig.enfant_1_et_2; // +0.5 pour le 1er
        if (nbEnfants >= 2)
            parts += qfConfig.enfant_1_et_2; // +0.5 pour le 2e
        if (nbEnfants >= 3)
            parts += (nbEnfants - 2) * qfConfig.enfant_3_et_suivants;
        NOMBRE_PARTS_FISCALES = parts;
        hypotheses.push(`Nombre de parts fiscales calculé automatiquement : ${NOMBRE_PARTS_FISCALES} parts`);
    }
    logger.calc(1, "Normalisation foyer", "NOMBRE_PARTS_FISCALES", NOMBRE_PARTS_FISCALES, {
        situation: input.SITUATION_FAMILIALE,
        enfants: input.NOMBRE_ENFANTS_A_CHARGE ?? 0,
    });
    // ── Ancienneté ────────────────────────────────────────────────────────────
    let ANCIENNETE_MOIS = null;
    if (input.DATE_CREATION_ACTIVITE) {
        const dateCreation = new Date(input.DATE_CREATION_ACTIVITE);
        const today = new Date();
        ANCIENNETE_MOIS = Math.floor((today.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    }
    else {
        hypotheses.push("Date de création non renseignée : éligibilité ACRE/ARCE calculée sans ancienneté précise");
    }
    const anneeSimulation = input.ANNEE_SIMULATION ?? 2026;
    logger.info(1, "Normalisation complète", {
        detail: {
            CA_HT_RETENU,
            RECETTES_PRO_RETENUES,
            NOMBRE_PARTS_FISCALES,
            ANCIENNETE_MOIS,
            nb_avertissements: avertissements.length,
        },
    });
    return {
        CA_HT_RETENU,
        CA_TTC_RETENU,
        TVA_COLLECTEE_THEORIQUE,
        TVA_DEDUCTIBLE_RETENUE,
        TVA_NETTE_DUE,
        RECETTES_PRO_RETENUES,
        CHARGES_DECAISSEES_RETENUES,
        CHARGES_DEDUCTIBLES_RETENUES,
        NOMBRE_PARTS_FISCALES,
        ANCIENNETE_MOIS,
        ANNEE_SIMULATION: anneeSimulation,
        avertissements,
        hypotheses,
        regime_tva_applicable,
    };
}
//# sourceMappingURL=normalizer.js.map