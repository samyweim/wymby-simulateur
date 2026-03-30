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

import type {
  UserInput,
  EngineOutput,
  DetailCalculScenario,
  ScenarioCandidat,
  BaseScenarioId,
  NiveauFiabilite,
} from "@wymby/types";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import { createLogger } from "./logger.js";
import type { EngineLog, EngineLogger } from "./logger.js";
import { validateUserInput } from "./guards.js";
import { normaliserEntrees } from "./normalizer.js";
import { qualifierProfil } from "./qualifier.js";
import { appliquerFiltresExclusion, filtrerScenariosParExclusion } from "./filters/exclusion.js";
import { verifierIncompatibilites } from "./filters/incompatibility-matrix.js";
import { genererScenarios } from "./scenarios/generator.js";
import { appliquerBoosters } from "./scenarios/booster-applicator.js";
import { calculerMicro } from "./calculators/micro.js";
import { calculerEIReel } from "./calculators/ei-reel.js";
import { calculerSociete } from "./calculators/societes.js";
import { calculerScenarioSpecialise } from "./calculators/special-segments.js";
import {
  determinerScenarioReference,
  construireComparaison,
  determinerRecommandation,
  calculerScores,
} from "./comparator.js";
import { construireEngineOutput } from "./output-builder.js";
import {
  formatEngineLogs,
  filterLogs,
  filterLogsByScenario,
  summarizeLogs,
} from "./log-formatter.js";

type FP = typeof FISCAL_PARAMS_2026;

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
export function runEngine(
  input: UserInput,
  params: FP = FISCAL_PARAMS_2026,
  debugMode: boolean = false
): EngineOutput {
  const [output] = _runEngineInternal(input, params, debugMode);
  return output;
}

/**
 * Exécute le moteur et retourne aussi les logs DEBUG.
 * Usage test : `const [output, logs] = runEngineWithLogs(input, params);`
 */
export function runEngineWithLogs(
  input: UserInput,
  params: FP = FISCAL_PARAMS_2026
): [EngineOutput, EngineLog[]] {
  return _runEngineInternal(input, params, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE INTERNE
// ─────────────────────────────────────────────────────────────────────────────

function _runEngineInternal(
  input: UserInput,
  params: FP,
  debugMode: boolean
): [EngineOutput, EngineLog[]] {
  const logger = createLogger(debugMode);
  const avertissements_globaux: string[] = [];

  logger.info(1, "Moteur démarré", {
    detail: { segment: input.SEGMENT_ACTIVITE, ca: input.CA_ENCAISSE_UTILISATEUR },
  });

  // ── Validation des entrées ─────────────────────────────────────────────────
  const erreurs = validateUserInput(input);
  if (erreurs.length > 0) {
    avertissements_globaux.push(...erreurs.map((e) => `[ERREUR INPUT] ${e}`));
    logger.error(1, "Erreurs de validation", { detail: { erreurs } });
  }

  // ── Étape 1 : Normalisation ───────────────────────────────────────────────
  const norm = normaliserEntrees(input, params, logger);
  avertissements_globaux.push(...norm.avertissements);

  // ── Étape 2 : Qualification du profil ─────────────────────────────────────
  const qual = qualifierProfil(input, norm, params, logger);
  avertissements_globaux.push(...qual.avertissements);

  // ── Étape 3 : Filtres d'exclusion ─────────────────────────────────────────
  const filtres = appliquerFiltresExclusion(input, norm, qual, params, logger);

  // ── Étapes 4–6 : Génération des scénarios ─────────────────────────────────
  const scenarios_bruts = genererScenarios(input, qual, filtres, params, logger);

  logger.info(4, "Scénarios générés (brut)", {
    detail: { count: scenarios_bruts.length },
  });

  // ── Étape 7 : Application des filtres d'exclusion ─────────────────────────
  const { possibles: apres_filtres_excl, exclus: exclus_filtres } =
    filtrerScenariosParExclusion(scenarios_bruts, filtres, input, logger);

  // ── Étape 8 : Vérification matrice d'incompatibilités ─────────────────────
  const { possibles: scenarios_finaux, exclus: exclus_compat } =
    verifierIncompatibilites(apres_filtres_excl, input, params, logger);

  const tous_exclus = [...exclus_filtres, ...exclus_compat];

  logger.info(5, "Scénarios après incompatibilités", {
    detail: {
      retenus: scenarios_finaux.length,
      exclus: tous_exclus.length,
    },
  });

  // ── Étape 9 : Calcul scénario par scénario ────────────────────────────────
  const calculs: DetailCalculScenario[] = [];

  for (const sc of scenarios_finaux) {
    try {
      const calcul = _calculerScenario(sc, input, norm, params, logger);
      if (calcul) {
        calculs.push(calcul);
      }
    } catch (err) {
      logger.error(7, "Erreur calcul scénario", {
        scenario_id: sc.scenario_id,
        motif: String(err),
      });
      avertissements_globaux.push(
        `Erreur de calcul pour le scénario ${sc.scenario_id} : ${String(err)}`
      );
    }
  }

  logger.info(7, "Calculs effectués", { detail: { nb_calcules: calculs.length } });

  // ── Étape 10 : Comparaison ────────────────────────────────────────────────
  const scenario_reference_id = determinerScenarioReference(calculs);

  if (!scenario_reference_id && calculs.length > 0) {
    avertissements_globaux.push(
      "Impossible de déterminer un scénario de référence. Comparaison non disponible."
    );
  }

  const comparaison = scenario_reference_id
    ? construireComparaison(calculs, scenario_reference_id, logger)
    : {
        scenario_reference_id: "",
        classement_net_apres_ir: [],
        classement_super_net: [],
        classement_robustesse: [],
        classement_complexite: [],
        ecarts: [],
      };

  const recommandation = determinerRecommandation(calculs, comparaison, logger);

  // ── Étape 11 : Construction de la sortie ──────────────────────────────────
  const output = construireEngineOutput(
    input,
    norm,
    qual,
    scenarios_finaux,
    tous_exclus,
    calculs,
    comparaison,
    recommandation,
    avertissements_globaux,
    logger
  );

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

function _calculerScenario(
  sc: ScenarioCandidat,
  input: UserInput,
  norm: ReturnType<typeof normaliserEntrees>,
  params: FP,
  logger: EngineLogger
): DetailCalculScenario | null {
  const baseId = sc.base_id;

  // Appliquer les boosters pour obtenir exonération et réductions
  // Utiliser annee 1 par défaut si non connue
  const annee_dans_dispositif = _getAnneeDispositif(input);
  const resultatFiscalEstime = _estimerResultatFiscalAvantBoosters(sc, input, norm, params);
  const boosterResult = appliquerBoosters(
    sc.boosters_actifs,
    0, // sera recalculé après cotisations
    resultatFiscalEstime,
    input,
    params,
    annee_dans_dispositif,
    sc.scenario_id
  );

  let rawResultat: { intermediaires: Partial<import("@wymby/types").IntermediairesCalcul>; niveau_fiabilite: NiveauFiabilite; avertissements: string[] } | null = null;

  if (_isMicroScenario(baseId)) {
    rawResultat = calculerMicro(
      {
        scenario_id: sc.scenario_id,
        CA_HT_RETENU: norm.CA_HT_RETENU,
        TVA_NETTE_DUE: norm.TVA_NETTE_DUE,
        type_micro: _getMicroType(baseId),
        option_vfl: sc.option_vfl === "VFL_OUI",
        acre_active: sc.boosters_actifs.includes("BOOST_ACRE"),
        date_creation: input.DATE_CREATION_ACTIVITE
          ? new Date(input.DATE_CREATION_ACTIVITE)
          : undefined,
        exoneration_fiscale_zone: boosterResult.exoneration_fiscale,
        exoneration_sociale_zone: sc.boosters_actifs.includes("BOOST_ZFRR_PLUS")
          ? boosterResult.exoneration_fiscale
          : 0,
        autres_revenus_foyer: input.AUTRES_REVENUS_FOYER_IMPOSABLES,
        autres_charges_foyer: input.AUTRES_CHARGES_DEDUCTIBLES_FOYER,
        nombre_parts_fiscales: norm.NOMBRE_PARTS_FISCALES,
        droits_are_restants: input.DROITS_ARE_RESTANTS,
      },
      params,
      logger
    );
  } else if (_isEIReelScenario(baseId)) {
    rawResultat = calculerEIReel(
      {
        scenario_id: sc.scenario_id,
        RECETTES_PRO_RETENUES: norm.RECETTES_PRO_RETENUES,
        CHARGES_DECAISSEES:
          input.CHARGES_DECAISSEES ?? norm.CHARGES_DEDUCTIBLES_RETENUES,
        CHARGES_DEDUCTIBLES: norm.CHARGES_DEDUCTIBLES_RETENUES,
        DOTATIONS_AMORTISSEMENTS: input.DOTATIONS_AMORTISSEMENTS,
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
      },
      params,
      logger
    );
  } else if (_isSocieteScenario(baseId)) {
    rawResultat = calculerSociete(
      {
        scenario_id: sc.scenario_id,
        RECETTES_PRO_RETENUES: norm.RECETTES_PRO_RETENUES,
        CHARGES_DEDUCTIBLES: norm.CHARGES_DEDUCTIBLES_RETENUES,
        CHARGES_DECAISSEES:
          input.CHARGES_DECAISSEES ?? norm.CHARGES_DEDUCTIBLES_RETENUES,
        DOTATIONS_AMORTISSEMENTS: input.DOTATIONS_AMORTISSEMENTS,
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
      },
      params,
      logger
    );
  } else {
    rawResultat = calculerScenarioSpecialise(
      {
        scenario_id: sc.scenario_id,
        base_id: sc.base_id,
        recettes: input.RECETTES_LOCATION_MEUBLEE ?? norm.RECETTES_PRO_RETENUES,
        charges_deductibles: norm.CHARGES_DEDUCTIBLES_RETENUES,
        charges_decaissees:
          input.CHARGES_DECAISSEES !== undefined
            ? input.CHARGES_DECAISSEES
            : norm.CHARGES_DEDUCTIBLES_RETENUES,
        amortissements: input.DOTATIONS_AMORTISSEMENTS,
        autres_revenus_foyer: input.AUTRES_REVENUS_FOYER_IMPOSABLES,
        autres_charges_foyer: input.AUTRES_CHARGES_DEDUCTIBLES_FOYER,
        nombre_parts_fiscales: norm.NOMBRE_PARTS_FISCALES,
        secteur_conventionnel: input.SECTEUR_CONVENTIONNEL,
        sous_segment_activite: input.SOUS_SEGMENT_ACTIVITE,
        option_raap_taux_reduit: input.OPTION_RAAP_TAUX_REDUIT,
        est_redevable_raap: input.EST_REDEVABLE_RAAP,
        autres_revenus_activite_foyer: input.AUTRES_REVENUS_ACTIVITE_FOYER,
      },
      params,
      logger
    );
  }

  if (!rawResultat) return null;

  if (boosterResult.avertissement) {
    rawResultat.avertissements.push(boosterResult.avertissement);
  }

  if (input.OPTION_IR_TEMPORAIRE_ACTIVE === true) {
    rawResultat.avertissements.push("OPTION_IR_TEMPORAIRE_DUREE_LIMITEE_5_ANS");
  }

  // Ajouter l'aide ARCE trésorerie
  if (sc.boosters_actifs.includes("BOOST_ARCE") && boosterResult.aide_tresorerie > 0) {
    rawResultat.intermediaires.AIDE_ARCE_TRESORERIE = boosterResult.aide_tresorerie;
    rawResultat.intermediaires.SUPER_NET =
      (rawResultat.intermediaires.NET_APRES_IR ?? 0) + boosterResult.aide_tresorerie;
    rawResultat.avertissements.push("ARCE_FLUX_NON_RECURRENT");
  }

  if (input.DATE_DEPASSEMENT_TVA_DECLARATIVE) {
    rawResultat.niveau_fiabilite = "partiel";
    rawResultat.avertissements.push(
      `DEPASSEMENT_SEUIL_TVA_MAJORE_${_getTvaWarningSuffix(input)}`,
    );
    rawResultat.avertissements.push(
      `TVA_APPLICABLE_DES_LE_${new Date(input.DATE_DEPASSEMENT_TVA_DECLARATIVE)
        .toLocaleDateString("fr-FR")
        .replace(/\//g, "_")}`
    );
  }

  const calcul: DetailCalculScenario = {
    scenario_id: sc.scenario_id,
    base_id: sc.base_id,
    option_tva: sc.option_tva,
    option_vfl: sc.option_vfl,
    boosters_actifs: sc.boosters_actifs,
    intermediaires: rawResultat.intermediaires as import("@wymby/types").IntermediairesCalcul,
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
  calcul.scores = calculerScores(calcul, params);

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

function _isMicroScenario(id: BaseScenarioId): boolean {
  return id === "G_MBIC_VENTE" || id === "G_MBIC_SERVICE" || id === "G_MBNC";
}

function _isEIReelScenario(id: BaseScenarioId): boolean {
  return (
    id === "G_EI_REEL_BIC_IR" ||
    id === "G_EI_REEL_BIC_IS" ||
    id === "G_EI_REEL_BNC_IR" ||
    id === "G_EI_REEL_BNC_IS"
  );
}

function _isSocieteScenario(id: BaseScenarioId): boolean {
  return (
    id === "G_EURL_IS" ||
    id === "G_EURL_IR" ||
    id === "G_SASU_IS" ||
    id === "G_SASU_IR"
  );
}

function _getMicroType(id: BaseScenarioId): "BIC_VENTE" | "BIC_SERVICE" | "BNC" {
  if (id === "G_MBIC_VENTE") return "BIC_VENTE";
  if (id === "G_MBIC_SERVICE") return "BIC_SERVICE";
  return "BNC";
}

function _getEIType(id: BaseScenarioId): "BIC_IR" | "BIC_IS" | "BNC_IR" | "BNC_IS" {
  if (id === "G_EI_REEL_BIC_IR") return "BIC_IR";
  if (id === "G_EI_REEL_BIC_IS") return "BIC_IS";
  if (id === "G_EI_REEL_BNC_IS") return "BNC_IS";
  return "BNC_IR";
}

function _getSocieteType(id: BaseScenarioId): "EURL_IS" | "EURL_IR" | "SASU_IS" | "SASU_IR" {
  if (id === "G_EURL_IS") return "EURL_IS";
  if (id === "G_EURL_IR") return "EURL_IR";
  if (id === "G_SASU_IR") return "SASU_IR";
  return "SASU_IS";
}

function _getAnneeDispositif(input: UserInput): number {
  if (!input.DATE_CREATION_ACTIVITE) return 1;
  const dateCreation = new Date(input.DATE_CREATION_ACTIVITE);
  const now = new Date();
  const annees = Math.floor(
    (now.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  return Math.max(1, annees + 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports utilitaires
// ─────────────────────────────────────────────────────────────────────────────

export { FISCAL_PARAMS_2026 };
export { formatEngineLogs, filterLogs, filterLogsByScenario, summarizeLogs };
export type { EngineOutput, UserInput, EngineLog };
export type { LogLevel } from "./logger.js";

function _getTvaWarningSuffix(input: UserInput): string {
  if (input.SOUS_SEGMENT_ACTIVITE === "achat_revente") return "BIC_VENTE";
  if (input.SOUS_SEGMENT_ACTIVITE === "liberal") return "BNC";
  return "BIC_SERVICE";
}

function _estimerResultatFiscalAvantBoosters(
  sc: ScenarioCandidat,
  input: UserInput,
  norm: ReturnType<typeof normaliserEntrees>,
  params: FP
): number {
  if (_isMicroScenario(sc.base_id)) {
    const tauxAbattement =
      sc.base_id === "G_MBIC_VENTE"
        ? params.abattements.CFG_ABATTEMENT_MICRO_BIC_VENTE
        : sc.base_id === "G_MBIC_SERVICE"
          ? params.abattements.CFG_ABATTEMENT_MICRO_BIC_SERVICE
          : params.abattements.CFG_ABATTEMENT_MICRO_BNC;
    return Math.max(0, norm.CA_HT_RETENU - norm.CA_HT_RETENU * tauxAbattement);
  }

  if (_isEIReelScenario(sc.base_id) || _isSocieteScenario(sc.base_id)) {
    return Math.max(
      0,
      norm.RECETTES_PRO_RETENUES -
        norm.CHARGES_DEDUCTIBLES_RETENUES -
        (input.DOTATIONS_AMORTISSEMENTS ?? 0) -
        ((_isSocieteScenario(sc.base_id) || sc.base_id === "G_EI_REEL_BIC_IS" || sc.base_id === "G_EI_REEL_BNC_IS")
          ? (input.REMUNERATION_DIRIGEANT_ENVISAGEE ?? 0)
          : 0)
    );
  }

  return 0;
}
