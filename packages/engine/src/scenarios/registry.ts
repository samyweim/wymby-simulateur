/**
 * scenarios/registry.ts — Registre des scénarios de base
 *
 * Définit les métadonnées de chaque scénario (segment, type fiscal/social,
 * options disponibles, complexité administrative).
 */

import type { BaseScenarioId, SegmentActivite } from "@wymby/types";

export type RegimeFiscalType = "micro" | "reel_ir" | "reel_is" | "is_societe";
export type RegimeSocialType = "micro_me" | "tns_reel" | "assimile_salarie";

export interface ScenarioMeta {
  id: BaseScenarioId;
  label: string;
  code_wyum: string;
  segment: SegmentActivite;
  regime_fiscal: RegimeFiscalType;
  regime_social: RegimeSocialType;
  /** Options TVA disponibles pour ce scénario */
  options_tva: Array<"TVA_FRANCHISE" | "TVA_COLLECTEE">;
  /** VFL disponible pour ce scénario */
  vfl_disponible: boolean;
  /** Score de complexité administrative (1–5, croissant) */
  score_complexite: number;
  /** ZFRR compatible (régime réel obligatoire pour ZFRR) */
  zfrr_compatible: boolean;
  description: string;
}

/** Registre complet des scénarios Segment 1 — Généralistes (C01–C20) */
export const SCENARIO_REGISTRY: Record<BaseScenarioId, ScenarioMeta> = {
  // ── Micro-BIC Achat/Revente (C01–C04) ────────────────────────────────────
  G_MBIC_VENTE: {
    id: "G_MBIC_VENTE",
    label: "Micro-BIC Achat/Revente",
    code_wyum: "C01",
    segment: "generaliste",
    regime_fiscal: "micro",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: true,
    score_complexite: 1,
    zfrr_compatible: false,
    description: "Micro-entreprise activité achat/revente — abattement 71 % sur CA",
  },

  // ── Micro-BIC Prestation de Service (C05–C08) ─────────────────────────────
  G_MBIC_SERVICE: {
    id: "G_MBIC_SERVICE",
    label: "Micro-BIC Prestation de Service",
    code_wyum: "C05",
    segment: "generaliste",
    regime_fiscal: "micro",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: true,
    score_complexite: 1,
    zfrr_compatible: false,
    description: "Micro-entreprise prestation de service — abattement 50 % sur CA",
  },

  // ── Micro-BNC Libéral (C09–C12) ───────────────────────────────────────────
  G_MBNC: {
    id: "G_MBNC",
    label: "Micro-BNC Libéral",
    code_wyum: "C09",
    segment: "generaliste",
    regime_fiscal: "micro",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: true,
    score_complexite: 1,
    zfrr_compatible: false,
    description: "Micro-entreprise BNC — abattement 34 % sur CA",
  },

  // ── EI Réel BIC + IR (C13) ────────────────────────────────────────────────
  G_EI_REEL_BIC_IR: {
    id: "G_EI_REEL_BIC_IR",
    label: "EI Réel BIC + IR",
    code_wyum: "C13",
    segment: "generaliste",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 3,
    zfrr_compatible: true,
    description: "EI au régime réel BIC — Assiette Sociale Unique 2026, IR barème progressif",
  },

  // ── EI Réel BIC + IS (C14) ────────────────────────────────────────────────
  G_EI_REEL_BIC_IS: {
    id: "G_EI_REEL_BIC_IS",
    label: "EI Réel BIC + IS (assimilation EURL)",
    code_wyum: "C14",
    segment: "generaliste",
    regime_fiscal: "reel_is",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 4,
    zfrr_compatible: true,
    description: "EI option IS — assimilation fiscale EURL, cotisations TNS sur rémunération",
  },

  // ── EI Réel BNC + IR (C15) ────────────────────────────────────────────────
  G_EI_REEL_BNC_IR: {
    id: "G_EI_REEL_BNC_IR",
    label: "EI Réel BNC + IR",
    code_wyum: "C15",
    segment: "generaliste",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 3,
    zfrr_compatible: true,
    description: "EI au régime réel BNC — déclaration 2035, IR barème progressif",
  },

  // ── EI Réel BNC + IS (C16) ────────────────────────────────────────────────
  G_EI_REEL_BNC_IS: {
    id: "G_EI_REEL_BNC_IS",
    label: "EI Réel BNC + IS (assimilation EURL)",
    code_wyum: "C16",
    segment: "generaliste",
    regime_fiscal: "reel_is",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 4,
    zfrr_compatible: true,
    description: "EI BNC option IS — assimilation fiscale EURL",
  },

  // ── EURL à l'IS (C17) ────────────────────────────────────────────────────
  G_EURL_IS: {
    id: "G_EURL_IS",
    label: "EURL à l'IS (Gérant Majoritaire TNS)",
    code_wyum: "C17",
    segment: "generaliste",
    regime_fiscal: "is_societe",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 4,
    zfrr_compatible: true,
    description: "EURL à l'IS — gérant majoritaire TNS, arbitrage rémunération/dividendes",
  },

  // ── EURL à l'IR (C18) ────────────────────────────────────────────────────
  G_EURL_IR: {
    id: "G_EURL_IR",
    label: "EURL à l'IR (transparence fiscale, limité 5 ans)",
    code_wyum: "C18",
    segment: "generaliste",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 4,
    zfrr_compatible: true,
    description: "EURL option IR — transparence fiscale limitée à 5 exercices",
  },

  // ── SASU à l'IS (C19) ────────────────────────────────────────────────────
  G_SASU_IS: {
    id: "G_SASU_IS",
    label: "SASU à l'IS (Président Assimilé-Salarié)",
    code_wyum: "C19",
    segment: "generaliste",
    regime_fiscal: "is_societe",
    regime_social: "assimile_salarie",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 5,
    zfrr_compatible: true,
    description: "SASU à l'IS — président assimilé-salarié, dividendes sans cotisations sociales",
  },

  // ── SASU à l'IR (C20) ────────────────────────────────────────────────────
  G_SASU_IR: {
    id: "G_SASU_IR",
    label: "SASU à l'IR (transparence fiscale, limité 5 ans)",
    code_wyum: "C20",
    segment: "generaliste",
    regime_fiscal: "reel_ir",
    regime_social: "assimile_salarie",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 5,
    zfrr_compatible: true,
    description: "SASU option IR — transparence fiscale limitée à 5 exercices",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Segment 2 — Santé (V2 — stubs structurels)
  // ─────────────────────────────────────────────────────────────────────────
  S_RSPM: {
    id: "S_RSPM",
    label: "RSPM Remplaçant",
    code_wyum: "S01",
    segment: "sante",
    regime_fiscal: "micro",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE"],
    vfl_disponible: false,
    score_complexite: 1,
    zfrr_compatible: false,
    description: "Régime simplifié médecins remplaçants (CA < seuil RSPM)",
  },
  S_MICRO_BNC_SECTEUR_1: {
    id: "S_MICRO_BNC_SECTEUR_1",
    label: "Micro-BNC Secteur 1 + Aide CPAM",
    code_wyum: "S02",
    segment: "sante",
    regime_fiscal: "micro",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE"],
    vfl_disponible: false,
    score_complexite: 2,
    zfrr_compatible: false,
    description: "Micro-BNC professionnel de santé secteur 1 — aide CPAM maladie réduite",
  },
  S_MICRO_BNC_SECTEUR_2: {
    id: "S_MICRO_BNC_SECTEUR_2",
    label: "Micro-BNC Secteur 2",
    code_wyum: "S03",
    segment: "sante",
    regime_fiscal: "micro",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE"],
    vfl_disponible: false,
    score_complexite: 2,
    zfrr_compatible: false,
    description: "Micro-BNC professionnel de santé secteur 2 — cotisation maladie taux plein",
  },
  S_EI_REEL_SECTEUR_1: {
    id: "S_EI_REEL_SECTEUR_1",
    label: "EI Réel Secteur 1 + Déclaration 2035 + Aide CPAM",
    code_wyum: "S04",
    segment: "sante",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 3,
    zfrr_compatible: true,
    description: "EI réel BNC secteur 1 — déclaration 2035, aide CPAM, déductions groupes I/II/III",
  },
  S_EI_REEL_SECTEUR_2_OPTAM: {
    id: "S_EI_REEL_SECTEUR_2_OPTAM",
    label: "EI Réel Secteur 2 OPTAM + Aide CPAM partielle",
    code_wyum: "S05",
    segment: "sante",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 3,
    zfrr_compatible: true,
    description: "EI réel BNC secteur 2 OPTAM — aide CPAM partielle",
  },
  S_EI_REEL_SECTEUR_2_NON_OPTAM: {
    id: "S_EI_REEL_SECTEUR_2_NON_OPTAM",
    label: "EI Réel Secteur 2 NON-OPTAM + Cotisations Taux Plein",
    code_wyum: "S06",
    segment: "sante",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 3,
    zfrr_compatible: true,
    description: "EI réel BNC secteur 2 non-OPTAM — cotisations maladie taux plein",
  },
  S_EI_REEL_SECTEUR_3_HORS_CONVENTION: {
    id: "S_EI_REEL_SECTEUR_3_HORS_CONVENTION",
    label: "EI Réel Secteur 3 / Hors Convention + Exonération ASV",
    code_wyum: "S07",
    segment: "sante",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 3,
    zfrr_compatible: true,
    description: "EI réel BNC hors convention — cotisations libres, exonération ASV",
  },
  S_SELARL_IS: {
    id: "S_SELARL_IS",
    label: "SELARL à l'IS (Gérant Majoritaire TNS)",
    code_wyum: "S08",
    segment: "sante",
    regime_fiscal: "is_societe",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 5,
    zfrr_compatible: true,
    description: "SELARL IS — arbitrage rémunération/dividendes pour professionnels de santé",
  },
  S_SELAS_IS: {
    id: "S_SELAS_IS",
    label: "SELAS à l'IS (Président Assimilé-Salarié)",
    code_wyum: "S09",
    segment: "sante",
    regime_fiscal: "is_societe",
    regime_social: "assimile_salarie",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 5,
    zfrr_compatible: true,
    description: "SELAS IS — président assimilé-salarié, stratégie dividendes",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Segment 3 — Artistes-Auteurs (V2 — stubs)
  // ─────────────────────────────────────────────────────────────────────────
  A_BNC_MICRO_TVA_FRANCHISE: {
    id: "A_BNC_MICRO_TVA_FRANCHISE",
    label: "Artiste-Auteur BNC + Micro-BNC + Franchise TVA",
    code_wyum: "A01",
    segment: "artiste_auteur",
    regime_fiscal: "micro",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE"],
    vfl_disponible: false,
    score_complexite: 1,
    zfrr_compatible: false,
    description: "Artiste-auteur micro-BNC — franchise TVA",
  },
  A_BNC_MICRO_TVA_COLLECTEE: {
    id: "A_BNC_MICRO_TVA_COLLECTEE",
    label: "Artiste-Auteur BNC + Micro-BNC + TVA Collectée",
    code_wyum: "A02",
    segment: "artiste_auteur",
    regime_fiscal: "micro",
    regime_social: "micro_me",
    options_tva: ["TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 2,
    zfrr_compatible: false,
    description: "Artiste-auteur micro-BNC — TVA collectée",
  },
  A_BNC_REEL: {
    id: "A_BNC_REEL",
    label: "Artiste-Auteur BNC + Réel (2035) + Retraite RAAP",
    code_wyum: "A03",
    segment: "artiste_auteur",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE", "TVA_COLLECTEE"],
    vfl_disponible: false,
    score_complexite: 3,
    zfrr_compatible: true,
    description: "Artiste-auteur BNC réel — déclaration 2035, retraite RAAP si recettes > seuil",
  },
  A_TS_ABATTEMENT_FORFAITAIRE: {
    id: "A_TS_ABATTEMENT_FORFAITAIRE",
    label: "Artiste-Auteur T&S + Abattement Forfaitaire 10 %",
    code_wyum: "A04",
    segment: "artiste_auteur",
    regime_fiscal: "reel_ir",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE"],
    vfl_disponible: false,
    score_complexite: 2,
    zfrr_compatible: false,
    description: "Artiste-auteur traitements & salaires — abattement forfaitaire 10 %",
  },
  A_TS_FRAIS_REELS: {
    id: "A_TS_FRAIS_REELS",
    label: "Artiste-Auteur T&S + Frais Réels Justifiés",
    code_wyum: "A05",
    segment: "artiste_auteur",
    regime_fiscal: "reel_ir",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE"],
    vfl_disponible: false,
    score_complexite: 3,
    zfrr_compatible: false,
    description: "Artiste-auteur traitements & salaires — frais réels justifiés",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Segment 4 — Immobilier LMNP/LMP (V2 — stubs)
  // ─────────────────────────────────────────────────────────────────────────
  I_LMNP_MICRO: {
    id: "I_LMNP_MICRO",
    label: "LMNP Micro-BIC",
    code_wyum: "I01",
    segment: "immobilier",
    regime_fiscal: "micro",
    regime_social: "micro_me",
    options_tva: ["TVA_FRANCHISE"],
    vfl_disponible: false,
    score_complexite: 1,
    zfrr_compatible: false,
    description: "LMNP micro-BIC — abattement forfaitaire selon type de location",
  },
  I_LMNP_REEL: {
    id: "I_LMNP_REEL",
    label: "LMNP Réel (amortissement murs + meubles)",
    code_wyum: "I02",
    segment: "immobilier",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE"],
    vfl_disponible: false,
    score_complexite: 4,
    zfrr_compatible: false,
    description: "LMNP réel — amortissements composants, règle art. 39C",
  },
  I_LMP: {
    id: "I_LMP",
    label: "LMP (revenus > seuil LMP) — Cotisations SSI",
    code_wyum: "I03",
    segment: "immobilier",
    regime_fiscal: "reel_ir",
    regime_social: "tns_reel",
    options_tva: ["TVA_FRANCHISE"],
    vfl_disponible: false,
    score_complexite: 4,
    zfrr_compatible: false,
    description: "LMP — cotisations SSI sur résultat, régime plus-values professionnel",
  },
};

/** Retourne les scénarios disponibles pour un segment donné */
export function getScenariosForSegment(
  segment: SegmentActivite
): ScenarioMeta[] {
  return Object.values(SCENARIO_REGISTRY).filter((s) => s.segment === segment);
}
