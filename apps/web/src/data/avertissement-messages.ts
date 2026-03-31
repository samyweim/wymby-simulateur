/**
 * avertissement-messages.ts — Traduction des codes d'avertissement moteur
 * vers des messages lisibles par l'utilisateur.
 */

import { FISCAL_PARAMS_2026 } from "@wymby/config";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);

// Codes purement techniques : jamais affichés à l'utilisateur
const CODES_TECHNIQUES = new Set([
  "SIMULATION_SANTE_PAMC_ESTIMATIVE",
  "AIDE_CPAM_MALADIE_CALCULEE_SUR_ASSIETTE_GLOBALE_FAUTE_DE_VENTILATION",
  "VENTILATION_HONORAIRES_CONVENTIONNES_ET_DEPASSEMENTS_NON_COLLECTEE",
  "SELARL_IS_MEMES_REGLES_SOCIAL_FISCAL_QUE_EURL_IS_PROFESSIONS_SANTE",
  "SELAS_IS_MEMES_REGLES_SOCIAL_FISCAL_QUE_SASU_IS_PROFESSIONS_SANTE",
  "SIMULATION_SOCIETE_SANTE_BASEE_SUR_MODELE_SOCIETE_GENERALISTE",
  "IR_CALCUL_DIFFERENTIEL_AUTRES_REVENUS_FOYER",
]);

export const AVERTISSEMENT_TRANSLATIONS: Record<string, string> = {
  // ── Seuils micro ─────────────────────────────────────────────────────────
  DEPASSEMENT_SEUIL_MICRO_BNC:
    `Votre chiffre d'affaires dépasse le seuil du régime micro-BNC (${formatCurrency(FISCAL_PARAMS_2026.micro.CFG_SEUIL_CA_MICRO_BNC)} €). ` +
    "Vérifiez si ce dépassement est récurrent.",
  DEPASSEMENT_SEUIL_MICRO_BIC_SERVICE:
    `Votre CA dépasse le seuil micro-BIC services (${formatCurrency(FISCAL_PARAMS_2026.micro.CFG_SEUIL_CA_MICRO_BIC_SERVICE)} €). ` +
    "Vérifiez si ce dépassement est récurrent.",
  DEPASSEMENT_SEUIL_MICRO_BIC_VENTE:
    `Votre CA dépasse le seuil micro-BIC achat-revente (${formatCurrency(FISCAL_PARAMS_2026.micro.CFG_SEUIL_CA_MICRO_BIC_VENTE)} €). ` +
    "Vérifiez si ce dépassement est récurrent.",
  BASCULEMENT_REEL_OBLIGE:
    "Le régime réel s'applique obligatoirement à votre situation " +
    "(historique micro incompatible, dépassement confirmé ou maintien non confirmable).",

  // ── Première année de dépassement ────────────────────────────────────────
  X01_PREMIERE_ANNEE:
    "Votre CA dépasse le seuil micro pour la première fois cette année. " +
    "Vous restez en micro jusqu'au 31 décembre — le régime réel s'appliquera à partir du 1er janvier prochain.",

  // ── TVA ──────────────────────────────────────────────────────────────────
  DEPASSEMENT_SEUIL_TVA_MAJORE_BNC:
    "Votre CA dépasse le seuil majoré de franchise TVA pour les BNC. La TVA est due immédiatement.",
  DEPASSEMENT_SEUIL_TVA_MAJORE_BIC_SERVICE:
    "Votre CA dépasse le seuil majoré de franchise TVA pour les prestations de service. La TVA est due immédiatement.",
  DEPASSEMENT_SEUIL_TVA_MAJORE_BIC_VENTE:
    "Votre CA dépasse le seuil majoré de franchise TVA pour l'achat-revente. La TVA est due immédiatement.",

  // ── VFL ───────────────────────────────────────────────────────────────────
  VFL_INTERDIT_RFR_DEPASSE:
    "L'option Versement Libératoire n'est pas disponible : votre revenu fiscal de référence N-2 " +
    "dépasse le plafond autorisé.",

  // ── PUMa ─────────────────────────────────────────────────────────────────
  TAXE_PUMA_POTENTIELLEMENT_APPLICABLE:
    "Cotisation Subsidiaire Maladie (taxe PUMa) potentiellement applicable en raison de revenus " +
    "d'activité faibles et de revenus du capital élevés. À confirmer avec un expert.",

  // ── ARCE ─────────────────────────────────────────────────────────────────
  ARCE_FLUX_NON_RECURRENT:
    "L'aide ARCE est un versement en capital unique, non récurrent. " +
    "Elle est modélisée comme flux de trésorerie distinct du revenu annuel.",

  // ── IR temporaire ────────────────────────────────────────────────────────
  OPTION_IR_TEMPORAIRE_DUREE_LIMITEE_5_ANS:
    "L'option pour l'impôt sur le revenu (transparence fiscale) est temporaire : " +
    `elle s'applique au maximum sur ${FISCAL_PARAMS_2026.temporalite.CFG_DUREE_OPTION_IR_TEMPORAIRE_SOCIETE.nb_exercices_max} exercices consécutifs. ` +
    "Passé ce délai, la société bascule automatiquement à l'IS — anticipez la transition.",

  // ── Données incomplètes ───────────────────────────────────────────────────
  DONNEES_A_COMPLETER:
    "Des informations manquantes réduisent la précision de la simulation. " +
    "Complétez votre profil pour un résultat plus fiable.",

  // ── Scénario dernier exercice micro ──────────────────────────────────────
  DERNIER_EXERCICE_MICRO_POSSIBLE:
    "Ce scénario micro est possible jusqu'au 31/12 de l'année en cours uniquement. " +
    "Votre CA dépasse le seuil pour la première fois.",

  // ── Santé — CPAM ─────────────────────────────────────────────────────────
  AIDE_CPAM_APPROCHEE_EN_MICRO_CPAM_CALCUL_PROGRESSIF_REQUIS:
    "En micro-BNC, la prise en charge CPAM sur la cotisation maladie est estimée de façon " +
    "forfaitaire. Le montant exact dépend du détail de vos honoraires conventionnés et du " +
    "barème progressif CPAM — un expert-comptable affinera ce chiffre.",

  S2_NON_OPTAM_TAUX_PLEIN_MALADIE_SANS_AIDE_CPAM:
    "Secteur 2 sans OPTAM : aucune prise en charge CPAM sur la cotisation maladie. " +
    "Le taux plein est intégralement à votre charge. L'adhésion à l'OPTAM réduit ce coût.",

  COTISATIONS_ORDINALES_CPAM_ASV_SPECIFIQUES_NON_INTEGREES_DANS_ARBITRAGE_SOCIETE_SANTE:
    "Pour les formes sociétaires (SELARL/SELAS), les cotisations ordinales spécifiques " +
    "aux professions de santé et l'ASV ne sont pas intégrées dans cette estimation. " +
    "Consultez un expert-comptable spécialisé santé pour valider le chiffre.",

  // ── Amortissements différés ───────────────────────────────────────────────
  AMORTISSEMENTS_DIFFERES_ARD:
    "Une partie de vos amortissements est reportée sur les exercices suivants. " +
    "Les amortissements ne peuvent pas créer ou aggraver un déficit BIC.",
};

export type DisplayMessageLevel = "info" | "warning";

export interface DisplayMessage {
  message: string;
  level: DisplayMessageLevel;
}

/**
 * Traduit un code d'avertissement en message lisible.
 * Si le code n'est pas dans la table, retourne le message brut.
 * Filtre les messages purement techniques non destinés à l'utilisateur.
 */
export function translateAvertissement(raw: string): string | null {
  if (raw.startsWith("[ERREUR INPUT]")) return null;
  if (raw.startsWith("TODO")) return null;

  // Codes purement techniques : jamais affichés
  if (CODES_TECHNIQUES.has(raw)) return null;

  // Correspondance exacte dans la table de traduction
  if (AVERTISSEMENT_TRANSLATIONS[raw]) {
    return AVERTISSEMENT_TRANSLATIONS[raw];
  }

  // Correspondance par préfixe (messages dynamiques avec données variables, ex. AMORTISSEMENTS_DIFFERES_ARD_12345)
  for (const key of Object.keys(AVERTISSEMENT_TRANSLATIONS)) {
    if (raw.startsWith(key)) {
      return AVERTISSEMENT_TRANSLATIONS[key] ?? null;
    }
  }

  // Si le code ressemble à un identifiant technique (tout en majuscules + tirets bas) : on le masque
  if (/^[A-Z][A-Z0-9_]+$/.test(raw)) return null;

  // Message déjà lisible (phrase humaine) : on l'affiche tel quel
  return raw;
}

export function resolveDisplayMessage(raw: string): DisplayMessage | null {
  const message = translateAvertissement(raw);

  if (message === null) return null;

  return {
    message,
    level: getDisplayMessageLevel(raw, message),
  };
}

function getDisplayMessageLevel(raw: string, message: string): DisplayMessageLevel {
  const normalized = `${raw} ${message}`.toLowerCase();

  if (
    normalized.includes("depassement_seuil") ||
    normalized.includes("dépasse le seuil") ||
    normalized.includes("passage tva au") ||
    normalized.includes("tva applicable dès") ||
    normalized.includes("référence") ||
    normalized.includes("dernière mise à jour") ||
    normalized.includes("accre appliquée") ||
    normalized.includes("arce modélisée")
  ) {
    return "info";
  }

  if (
    normalized.includes("potentiellement applicable") ||
    normalized.includes("non renseign") ||
    normalized.includes("à confirmer") ||
    normalized.includes("fiabilité") ||
    normalized.includes("interdit") ||
    normalized.includes("erreur")
  ) {
    return "warning";
  }

  return "warning";
}
