/**
 * scenario-labels.ts — Table de correspondance scenario_id → libellé lisible
 *
 * Tous les base_id définis dans BaseScenarioId doivent avoir une entrée ici.
 */

export interface ScenarioLabel {
  titre: string;
  description: string;
}

export interface BoosterLabel {
  titre: string;
  description: string;
}

export const SCENARIO_LABELS: Record<string, ScenarioLabel> = {
  // ── Généralistes ──────────────────────────────────────────────────────────
  G_MBIC_VENTE: {
    titre: "Micro-BIC Vente",
    description: "Achat-revente — abattement forfaitaire 71 %",
  },
  G_MBIC_SERVICE: {
    titre: "Micro-BIC Service",
    description: "Prestation de service — abattement forfaitaire 50 %",
  },
  G_MBNC: {
    titre: "Micro-BNC",
    description: "Profession libérale — abattement forfaitaire 34 %",
  },
  G_EI_REEL_BIC_IR: {
    titre: "BIC Réel — IR",
    description: "Déclaration 2031 — charges réelles déductibles — impôt sur le revenu",
  },
  G_EI_REEL_BIC_IS: {
    titre: "BIC Réel — IS",
    description: "Option IS assimilée EURL — arbitrage rémunération / dividendes",
  },
  G_EI_REEL_BNC_IR: {
    titre: "BNC Réel — IR",
    description: "Déclaration 2035 — charges réelles déductibles — impôt sur le revenu",
  },
  G_EI_REEL_BNC_IS: {
    titre: "BNC Réel — IS",
    description: "Option IS assimilée EURL — arbitrage rémunération / dividendes",
  },
  G_EURL_IS: {
    titre: "EURL à l'IS",
    description: "Gérant majoritaire TNS — arbitrage rémunération / dividendes",
  },
  G_EURL_IR: {
    titre: "EURL à l'IR",
    description: "Transparence fiscale — limité dans le temps (5 exercices max.)",
  },
  G_SASU_IS: {
    titre: "SASU à l'IS",
    description: "Président assimilé-salarié — stratégie dividendes",
  },
  G_SASU_IR: {
    titre: "SASU à l'IR",
    description: "Transparence fiscale — limité dans le temps (5 exercices max.)",
  },

  // ── Santé ─────────────────────────────────────────────────────────────────
  S_RSPM: {
    titre: "RSPM Remplaçant",
    description: "Régime simplifié des praticiens et auxiliaires médicaux remplaçants",
  },
  S_MICRO_BNC_SECTEUR_1: {
    titre: "Micro-BNC Secteur 1",
    description: "Honoraires opposables — cotisation maladie réduite CPAM",
  },
  S_MICRO_BNC_SECTEUR_2: {
    titre: "Micro-BNC Secteur 2",
    description: "Dépassements d'honoraires — cotisations maladie taux plein",
  },
  S_EI_REEL_SECTEUR_1: {
    titre: "BNC Réel Secteur 1",
    description: "Déclaration 2035 — aide CPAM — déductions groupes I/II/III",
  },
  S_EI_REEL_SECTEUR_2_OPTAM: {
    titre: "BNC Réel Secteur 2 OPTAM",
    description: "Déclaration 2035 — aide CPAM partielle — dépassements modérés",
  },
  S_EI_REEL_SECTEUR_2_NON_OPTAM: {
    titre: "BNC Réel Secteur 2",
    description: "Déclaration 2035 — cotisations maladie taux plein — dépassements libres",
  },
  S_EI_REEL_SECTEUR_3_HORS_CONVENTION: {
    titre: "BNC Réel Hors Convention",
    description: "Déclaration 2035 — exonération ASV — tarifs libres",
  },
  S_SELARL_IS: {
    titre: "SELARL à l'IS",
    description: "Société d'exercice libéral — gérant majoritaire TNS",
  },
  S_SELAS_IS: {
    titre: "SELAS à l'IS",
    description: "Société d'exercice libéral — président assimilé-salarié",
  },

  // ── Artistes-Auteurs ──────────────────────────────────────────────────────
  A_BNC_MICRO: {
    titre: "Micro-BNC Artiste-Auteur",
    description: "Artiste-auteur — abattement forfaitaire 34 %",
  },
  A_BNC_MICRO_TVA_FRANCHISE: {
    titre: "Micro-BNC Artiste — Franchise TVA",
    description: "Artiste-auteur BNC — franchise de TVA",
  },
  A_BNC_MICRO_TVA_COLLECTEE: {
    titre: "Micro-BNC Artiste — TVA collectée",
    description: "Artiste-auteur BNC — assujetti à la TVA",
  },
  A_BNC_REEL: {
    titre: "BNC Réel Artiste-Auteur",
    description: "Déclaration 2035 — cotisations RAAP si recettes > seuil",
  },
  A_TS_ABATTEMENT_FORFAITAIRE: {
    titre: "Traitements & Salaires — Abattement 10 %",
    description: "Artiste déclaré en T&S — abattement forfaitaire frais de 10 %",
  },
  A_TS_FRAIS_REELS: {
    titre: "Traitements & Salaires — Frais réels",
    description: "Artiste déclaré en T&S — déduction des frais professionnels réels justifiés",
  },

  // ── Immobilier ────────────────────────────────────────────────────────────
  I_LMNP_MICRO: {
    titre: "LMNP Micro-BIC",
    description: "Location meublée non professionnelle — abattement forfaitaire",
  },
  I_LMNP_REEL: {
    titre: "LMNP Réel",
    description: "Location meublée non professionnelle — amortissement murs + meubles",
  },
  I_LMP: {
    titre: "LMP",
    description: "Location meublée professionnelle — cotisations SSI — régime réel obligatoire",
  },
};

export const BOOSTER_LABELS: Record<string, BoosterLabel> = {
  BOOST_ACRE: {
    titre: "ACRE",
    description: "Réduction temporaire de cotisations sociales en début d'activité, sous conditions d'éligibilité.",
  },
  BOOST_ARCE: {
    titre: "ARCE",
    description: "Versement en capital d'une partie des droits ARE restants. C'est un apport de trésorerie, pas un revenu annuel récurrent.",
  },
  BOOST_ZFRR: {
    titre: "ZFRR",
    description: "Exonération fiscale de zone sur le bénéfice, selon la phase d'application du dispositif.",
  },
  BOOST_ZFRR_PLUS: {
    titre: "ZFRR+",
    description: "Version renforcée de la ZFRR avec effet fiscal et social selon les paramètres du dispositif.",
  },
  BOOST_QPV: {
    titre: "QPV",
    description: "Exonération de zone en quartier prioritaire, avec conditions d'éligibilité et parfois proratisation.",
  },
  BOOST_ZFU_STOCK: {
    titre: "ZFU",
    description: "Maintien de droits acquis d'exonération en ancienne zone franche urbaine.",
  },
  BOOST_ZIP_ZAC: {
    titre: "ZIP / ZAC",
    description: "Aide forfaitaire d'installation en zone prioritaire de santé, si le profil y est éligible.",
  },
  BOOST_CPAM: {
    titre: "Aide CPAM",
    description: "Prise en charge partielle de certaines cotisations maladie ou retraite selon le secteur conventionnel.",
  },
  BOOST_RAAP_REDUIT: {
    titre: "RAAP réduit",
    description: "Option de taux réduit sur la retraite complémentaire RAAP pour les artistes-auteurs, sous conditions.",
  },
};

/**
 * Retourne le libellé d'un scénario à partir de son ID complet.
 * Essaie d'abord la correspondance exacte, puis le base_id extrait.
 */
export function getScenarioLabel(scenarioId: string): ScenarioLabel {
  if (SCENARIO_LABELS[scenarioId]) {
    return SCENARIO_LABELS[scenarioId];
  }
  // Extraire le base_id en supprimant les suffixes d'options et de boosters
  const baseId = (scenarioId.split("__")[0] ?? scenarioId)
    .replace(/_BOOST_[A-Z_]+$/, "")
    .replace(/_TVA_[A-Z]+$/, "")
    .replace(/_VFL_(OUI|NON)$/, "");

  return (
    SCENARIO_LABELS[baseId] ?? {
      titre: scenarioId,
      description: "",
    }
  );
}

export function getBoosterLabel(boosterId: string): BoosterLabel {
  return (
    BOOSTER_LABELS[boosterId] ?? {
      titre: boosterId.replace("BOOST_", ""),
      description: "Dispositif appliqué à ce scénario.",
    }
  );
}
