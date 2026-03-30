/**
 * avertissement-messages.ts — Traduction des codes d'avertissement moteur
 * vers des messages lisibles par l'utilisateur.
 */

export const AVERTISSEMENT_TRANSLATIONS: Record<string, string> = {
  // ── Seuils micro ─────────────────────────────────────────────────────────
  DEPASSEMENT_SEUIL_MICRO_BNC:
    "Votre chiffre d'affaires dépasse le seuil du régime micro-BNC (83 600 €). " +
    "Vérifiez si ce dépassement est récurrent.",
  DEPASSEMENT_SEUIL_MICRO_BIC_SERVICE:
    "Votre CA dépasse le seuil micro-BIC services (83 600 €). " +
    "Vérifiez si ce dépassement est récurrent.",
  DEPASSEMENT_SEUIL_MICRO_BIC_VENTE:
    "Votre CA dépasse le seuil micro-BIC achat-revente (203 100 €). " +
    "Vérifiez si ce dépassement est récurrent.",
  BASCULEMENT_REEL_OBLIGE:
    "Le régime réel s'applique obligatoirement à votre situation " +
    "(deux années consécutives de dépassement du seuil micro).",

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
    "L'option Versement Libératoire n'est pas disponible : votre revenu fiscal de référence 2023 " +
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
    "elle s'applique au maximum sur 5 exercices consécutifs. " +
    "Passé ce délai, la société bascule automatiquement à l'IS — anticipez la transition.",

  // ── Données incomplètes ───────────────────────────────────────────────────
  DONNEES_A_COMPLETER:
    "Des informations manquantes réduisent la précision de la simulation. " +
    "Complétez votre profil pour un résultat plus fiable.",

  // ── Scénario dernier exercice micro ──────────────────────────────────────
  DERNIER_EXERCICE_MICRO_POSSIBLE:
    "Ce scénario micro est possible jusqu'au 31/12 de l'année en cours uniquement. " +
    "Votre CA dépasse le seuil pour la première fois.",
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
  // Supprimer les messages internes non destinés à l'utilisateur
  if (raw.startsWith("[ERREUR INPUT]")) return null;
  if (raw.startsWith("TODO")) return null;
  // Code informatif interne : IR différentiel calculé avec données foyer complètes.
  // Ne pas afficher à l'utilisateur — ce n'est pas une action requise.
  if (raw === "IR_CALCUL_DIFFERENTIEL_AUTRES_REVENUS_FOYER") return null;

  // Correspondance exacte
  if (AVERTISSEMENT_TRANSLATIONS[raw]) {
    return AVERTISSEMENT_TRANSLATIONS[raw];
  }

  // Correspondance par préfixe (pour les messages dynamiques générés avec des données variables)
  for (const key of Object.keys(AVERTISSEMENT_TRANSLATIONS)) {
    if (raw.startsWith(key)) {
      return AVERTISSEMENT_TRANSLATIONS[key] ?? null;
    }
  }

  // Retourner le message brut si pas de traduction (peut déjà être lisible)
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
