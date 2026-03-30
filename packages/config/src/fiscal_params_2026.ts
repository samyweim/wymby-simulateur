/**
 * fiscal_params_2026.ts
 * Constantes Fiscales et Sociales — Exercice 2026
 *
 * ⚠️  RÈGLE ABSOLUE : Aucune valeur numérique ne doit figurer dans le code métier.
 *     Toute constante réglementaire est définie ici et importée par les modules du moteur.
 *
 * Statut des valeurs :
 *   - Valeur numérique ou texte explicite  → confirmée, issue du PLF/LFSS 2026, Urssaf, CPAM
 *   - PENDING                              → paramètre requis par l'algorithme, valeur non
 *                                            encore publiée ou nécessitant validation expert
 *                                            avant mise en production
 *
 * Sources principales :
 *   - Loi de finances 2026 (loi n° 2026-103 du 19/02/2026)
 *   - LFSS 2026 (loi n° 2025-1403 du 30/12/2025)
 *   - Arrêté du 22/12/2025 (revalorisation PASS)
 *   - Décret n° 2026-69 du 06/02/2026 (réforme ACRE)
 *   - Décret n° 2025-943 (taux cotisations micro BNC)
 *   - Loi Le Meur n° 2024-1039 du 19/11/2024 (meublé tourisme)
 *   - LF 2025 art. 84 (réintégration amortissements LMNP)
 *   - Convention médicale 2024-2029 (aides CPAM santé)
 *   - service-public.fr, impots.gouv.fr, urssaf.fr, CARMF, IRCEC
 *
 * Versionner ce fichier par année fiscale : fiscal_params_YYYY.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES INTERNES
// ─────────────────────────────────────────────────────────────────────────────

export type TrancheIR = {
  /** Borne inférieure incluse (€) */
  de: number;
  /** Borne supérieure incluse (null = pas de plafond) */
  a: number | null;
  /** Taux marginal (ex : 0.11 pour 11 %) */
  taux: number;
};

export type TrancheCotisation = {
  /** Borne inférieure en multiple du PASS (0 = plancher absolu) */
  de_pass: number;
  /** Borne supérieure en multiple du PASS (null = sans plafond) */
  a_pass: number | null;
  /** Taux applicable sur cette tranche */
  taux: number;
};

export type PhaseExoneration = {
  /** Numéro d'année dans le dispositif (1, 2, …) */
  annee: number;
  /** Taux d'exonération applicable (1.0 = 100 %) */
  taux: number;
};

export type CotisationLigne = {
  libelle: string;
  part_employeur: number | null;
  part_salarie: number | null;
  /** Description de l'assiette */
  assiette: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTE PIVOT : PASS 2026
// Arrêté du 22 décembre 2025 — revalorisation +2 % vs 2025
// Utilisée comme référence dans l'ensemble des formules.
// ─────────────────────────────────────────────────────────────────────────────

const PASS_2026 = 48_060;

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export const FISCAL_PARAMS_2026 = {

  // ═══════════════════════════════════════════════════════════════════════════
  // 0. RÉFÉRENTIELS PIVOT 2026
  // ═══════════════════════════════════════════════════════════════════════════
  referentiels: {
    /**
     * Plafond Annuel de la Sécurité Sociale 2026 (€)
     * Arrêté du 22/12/2025 — revalorisation +2,0 % vs 2025.
     */
    CFG_PASS_2026: PASS_2026,

    /** Plafond Mensuel de la Sécurité Sociale 2026 (€) */
    CFG_PMSS_2026: 4_005,

    /** Plafond Trimestriel de la Sécurité Sociale 2026 (€) */
    CFG_PTSS_2026: 12_015,

    /** Plafond Journalier de la Sécurité Sociale 2026 (€) */
    CFG_PJSS_2026: 220,

    /** Plafond Horaire de la Sécurité Sociale 2026 (€/h) */
    CFG_PHSS_2026: 30,

    /**
     * SMIC horaire brut 2026 (€/h)
     * Source : Décret de revalorisation SMIC du 31/12/2025.
     */
    CFG_SMIC_HORAIRE_2026: 12.02,

    /** SMIC mensuel brut 2026 (€) — base 35 h/semaine, 52 semaines */
    CFG_SMIC_MENSUEL_BRUT_2026: Math.round(12.02 * 35 * 52 / 12),
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 1. MICRO-ENTREPRISE — SEUILS DE CHIFFRE D'AFFAIRES
  // Revalorisation triennale 2026-2028 — Arrêté du 27/01/2026.
  // ═══════════════════════════════════════════════════════════════════════════
  micro: {
    /**
     * Seuil CA micro-BIC achat/revente (€ HT)
     * Revalorisation triennale +7,6 % vs période 2023-2025 (188 700 €).
     */
    CFG_SEUIL_CA_MICRO_BIC_VENTE: 203_100,

    /**
     * Seuil CA micro-BIC prestation de service (€ HT)
     * Revalorisation triennale +7,6 % vs période 2023-2025 (77 700 €).
     */
    CFG_SEUIL_CA_MICRO_BIC_SERVICE: 83_600,

    /**
     * Seuil CA micro-BNC libéral (€ HT)
     * Revalorisation triennale +7,6 % vs période 2023-2025 (77 700 €).
     */
    CFG_SEUIL_CA_MICRO_BNC: 83_600,

    /**
     * Seuil CA micro-BIC LMNP location meublée classique (€ HT)
     * Aligné sur le seuil BIC services — inchangé dans ce sous-segment.
     */
    CFG_SEUIL_CA_MICRO_LMNP_CLASSIQUE: 83_600,

    /**
     * Seuil CA micro-BIC meublé tourisme classé (€ HT)
     * Loi Le Meur n° 2024-1039 du 19/11/2024 : reclassification en « BIC services ».
     * Le seuil est donc aligné sur CFG_SEUIL_CA_MICRO_BIC_SERVICE, non plus sur la vente.
     */
    CFG_SEUIL_CA_MICRO_MEUBLE_TOURISME_CLASSE: 83_600,

    /**
     * Seuil CA micro-BIC meublé tourisme non classé (€ HT)
     * Loi Le Meur n° 2024-1039 du 19/11/2024 — seuil fixé à 15 000 €, non indexé.
     * Ce seuil n'est PAS revalorisé automatiquement.
     */
    CFG_SEUIL_CA_MICRO_MEUBLE_TOURISME_NON_CLASSE: 15_000,

    /**
     * Note sur les activités mixtes :
     * Le CA global ne doit pas dépasser 203 100 €, dont au plus 83 600 €
     * pour la part services/BNC. Le dépassement d'un seul seuil suffit
     * à exclure l'activité correspondante du régime micro.
     */
    CFG_NOTE_ACTIVITES_MIXTES:
      "CA global ≤ 203 100 € HT, dont part services/BNC ≤ 83 600 € HT",
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 2. TVA — FRANCHISE EN BASE ET SEUILS DE TOLÉRANCE
  // LF 2024 art. 82 : suppression de la revalorisation automatique.
  // Seuils fixes jusqu'à modification législative.
  // ═══════════════════════════════════════════════════════════════════════════
  tva: {
    /**
     * Seuil de franchise TVA BIC achat/revente (€ HT, CA N-1)
     * Inchangé depuis 2020 — seuil gelé (suppression revalorisation triennale LF 2024).
     */
    CFG_SEUIL_TVA_FRANCHISE_BIC_VENTE: 85_000,

    /**
     * Seuil de franchise TVA BIC prestation de service (€ HT, CA N-1)
     * Inchangé depuis 2025 (réforme Midy abrogée).
     */
    CFG_SEUIL_TVA_FRANCHISE_BIC_SERVICE: 37_500,

    /**
     * Seuil de franchise TVA BNC (€ HT, CA N-1)
     * Identique au seuil BIC services.
     */
    CFG_SEUIL_TVA_FRANCHISE_BNC: 37_500,

    /**
     * Seuil majoré de tolérance TVA BIC achat/revente (€ HT, CA N en cours)
     * Dépassement immédiat dès le 1er euro dépassant ce seuil.
     */
    CFG_SEUIL_TVA_TOLERANCE_BIC_VENTE: 93_500,

    /**
     * Seuil majoré de tolérance TVA BIC service (€ HT, CA N en cours)
     */
    CFG_SEUIL_TVA_TOLERANCE_BIC_SERVICE: 41_250,

    /**
     * Seuil majoré de tolérance TVA BNC (€ HT, CA N en cours)
     */
    CFG_SEUIL_TVA_TOLERANCE_BNC: 41_250,

    /**
     * Règle de sortie immédiate de la franchise TVA.
     * Depuis 2025 (loi Midy) : dès que le CA N dépasse le seuil majoré,
     * la TVA s'applique LE JOUR MÊME du dépassement (non rétroactif sur le mois).
     */
    CFG_REGLE_SORTIE_IMMEDIATE_TVA: {
      declencheur: "Dépassement du seuil majoré en cours d'année (N)",
      effet: "Assujettissement TVA dès le jour du dépassement",
      retroactivite: false,
      note: "Changement vs ancien régime : l'assujettissement n'est plus au 1er du mois",
    },

    /**
     * Règle de sortie TVA l'année suivante.
     * Depuis 2025 : un seul dépassement du seuil de base suffit (suppression
     * de l'ancienne tolérance sur deux années consécutives).
     */
    CFG_REGLE_SORTIE_TVA_ANNEE_SUIVANTE: {
      declencheur: "CA N dépasse le seuil de base sans atteindre le seuil majoré",
      effet: "Assujettissement TVA au 1er janvier N+1",
      condition_annees: 1,
      note: "Ancienne règle (2 ans consécutifs) supprimée par loi Midy 2025",
    },

    /**
     * Seuil TVA franchise artiste-auteur (€ HT, CA N-1)
     * Régime spécifique art. 293 B-II du CGI.
     */
    CFG_SEUIL_TVA_ARTISTE_AUTEUR: 50_000,

    /**
     * Seuil majoré de tolérance TVA artiste-auteur (€ HT, CA N en cours)
     */
    CFG_SEUIL_TVA_TOLERANCE_ARTISTE_AUTEUR: 55_000,
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 3. VERSEMENT FORFAITAIRE LIBÉRATOIRE (VFL)
  // Art. 151-0 du CGI — Conditions RFR N-2 (revenus 2024, avis 2025).
  // ═══════════════════════════════════════════════════════════════════════════
  vfl: {
    /**
     * Seuil de RFR par part fiscale N-2 pour éligibilité au VFL (€)
     * Correspond exactement à la limite supérieure de la 2e tranche IR 2026.
     * RFR 2024 apprécié sur l'avis d'imposition reçu en 2025.
     */
    CFG_SEUIL_RFR_VFL_PAR_PART: 29_315,

    /**
     * Formule de calcul du seuil RFR total éligible au VFL.
     * @param nbParts - Nombre de parts fiscales du foyer (QF)
     * @returns Seuil de RFR total au-delà duquel le VFL est interdit
     * @example nbParts=2 → seuil = 58 630 €
     */
    CFG_FORMULE_SEUIL_RFR_VFL: (nbParts: number): number =>
      29_315 * nbParts,

    /** Taux VFL micro-BIC achat/revente (fraction du CA HT) */
    CFG_TAUX_VFL_MICRO_BIC_VENTE: 0.010,

    /**
     * Taux VFL micro-BIC prestation de service (fraction du CA HT)
     * Note : meublé tourisme classé passe en BIC services (loi Le Meur) → ce taux s'y applique.
     */
    CFG_TAUX_VFL_MICRO_BIC_SERVICE: 0.017,

    /** Taux VFL micro-BNC (fraction du CA HT) */
    CFG_TAUX_VFL_MICRO_BNC: 0.022,
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ABATTEMENTS FORFAITAIRES MICRO
  // ═══════════════════════════════════════════════════════════════════════════
  abattements: {
    /** Abattement forfaitaire micro-BIC achat/revente */
    CFG_ABATTEMENT_MICRO_BIC_VENTE: 0.71,

    /** Abattement forfaitaire micro-BIC prestation de service */
    CFG_ABATTEMENT_MICRO_BIC_SERVICE: 0.50,

    /** Abattement forfaitaire micro-BNC libéral */
    CFG_ABATTEMENT_MICRO_BNC: 0.34,

    /**
     * Abattement forfaitaire LMNP micro-BIC classique (location meublée longue durée)
     */
    CFG_ABATTEMENT_MICRO_LMNP_CLASSIQUE: 0.50,

    /**
     * Abattement forfaitaire meublé tourisme classé
     * Loi Le Meur : reclassé en BIC services → taux 50 % (était 71 % avant 2025).
     */
    CFG_ABATTEMENT_MICRO_MEUBLE_TOURISME_CLASSE: 0.50,

    /**
     * Abattement forfaitaire meublé tourisme non classé
     * Loi Le Meur : seuil abaissé à 15 000 €, taux d'abattement réduit à 30 %.
     * (était 50 % avant revenus 2025)
     */
    CFG_ABATTEMENT_MICRO_MEUBLE_TOURISME_NON_CLASSE: 0.30,

    /**
     * Montant minimum d'abattement micro (€)
     * Plancher absolu en cas de CA très faible — art. 50-0 du CGI.
     * 305 € pour une activité, 610 € pour une activité mixte.
     */
    CFG_MINIMUM_ABATTEMENT_MICRO: 305,
    CFG_MINIMUM_ABATTEMENT_MICRO_MIXTE: 610,

    /**
     * Abattement forfaitaire sur traitements et salaires artiste-auteur (10 %)
     * Art. 83-3° du CGI — applicable sur les droits d'auteur déclarés en T&S.
     * Le contribuable peut opter pour les frais réels si ceux-ci dépassent 10 %.
     */
    CFG_ABATTEMENT_TS_FORFAITAIRE_ARTISTE_AUTEUR: 0.10,
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SOCIAL — COTISATIONS MICRO / TNS / ASSIMILÉ SALARIÉ
  // ═══════════════════════════════════════════════════════════════════════════
  social: {

    // ── 5a. TAUX GLOBAUX MICRO-ENTREPRENEUR ─────────────────────────────────
    /**
     * Taux global de cotisations sociales micro-BIC achat/revente (sur CA HT)
     * Inclut : maladie, vieillesse de base et complémentaire, allocations familiales,
     * invalidité-décès, CSG-CRDS, CFP.
     */
    CFG_TAUX_SOCIAL_MICRO_BIC_VENTE: 0.123,

    /** Taux global de cotisations sociales micro-BIC prestation de service (sur CA HT) */
    CFG_TAUX_SOCIAL_MICRO_BIC_SERVICE: 0.212,

    /**
     * Taux global de cotisations sociales micro-BNC régime SSI (sur CA HT)
     * Décret n° 2025-943 — taux plafonné à 25,6 % (montée progressive,
     * hausse initialement prévue à 26,1 % repoussée).
     */
    CFG_TAUX_SOCIAL_MICRO_BNC_SSI: 0.256,

    /**
     * Taux global de cotisations sociales micro-BNC régime CIPAV (sur CA HT)
     * Professions libérales réglementées relevant de la CIPAV.
     */
    CFG_TAUX_SOCIAL_MICRO_BNC_CIPAV: 0.232,

    /**
     * Taux global cotisations sociales RSPM (remplaçants médecins)
     * Source : urssaf.fr — offre simplifiée RSPM, mise à jour 2026
     *
     * Trois tranches d'honoraires avec comportements différents :
     *   ≤ 19 000 €/an   → taux simplifié 13,5 %
     *   19 001–38 000 € → taux intermédiaire 21,20 % (reste en RSPM, pas de bascule immédiate)
     *   > 38 000 €      → bascule vers régime PAMC de droit commun au 1er janvier de l'année suivante
     *
     * Extension 2025 : RSPM ouvert aux médecins retraités en cumul emploi-retraite (depuis 01/07/2025).
     * Extension 2026 : RSPM ouvert aux médecins en CER sous régime classique (depuis 01/01/2026).
     * Eligible aussi : médecins participant aux campagnes de vaccination (sans autre activité libérale).
     */
    CFG_TAUX_SOCIAL_RSPM: {
      tranche_1: {
        de: 0,
        a: 19_000,
        taux: 0.135,
        note: "Taux simplifié — interlocuteur unique RSPM pour Urssaf + retraite",
      },
      tranche_2: {
        de: 19_001,
        a: 38_000,
        taux: 0.212,
        note: "Taux intermédiaire — maintien en RSPM (pas de bascule PAMC immédiate)",
      },
      tranche_3: {
        de: 38_001,
        a: null,
        bascule: "Régime PAMC droit commun au 1er janvier de l'année suivante",
      },
      cible: "Médecins remplaçants + médecins retraités en cumul emploi-retraite",
      url_inscription: "www.medecins-remplacants.urssaf.fr",
    },


    // ── 5b. COTISATIONS TNS RÉGIME RÉEL — BARÈME PAR BRANCHE ────────────────
    /**
     * Barème détaillé des cotisations TNS (artisans, commerçants, PL non réglementées SSI)
     * Valeurs 2026 post-réforme assiette sociale unique (ASU).
     * Assiette = revenu professionnel net × 0,74 (abattement forfaitaire 26 %).
     *
     * Note : le taux effectif global varie de ~43-45 % pour des revenus autour du PASS
     * à ~40-41 % au-delà, en raison de la dégressivité de la maladie et des AF.
     */
    CFG_TAUX_SOCIAL_TNS_BIC: {
      maladie_maternite: {
        libelle: "Assurance maladie-maternité",
        tranches: [
          { de_pass: 0.00, a_pass: 0.40, taux: 0.00 },
          { de_pass: 0.40, a_pass: 1.10, taux: 0.04 },
          { de_pass: 1.10, a_pass: null, taux: 0.065 },
        ] as TrancheCotisation[],
        note: "Progressivité 0 % à 6,5 % — max au-delà de 1,1 PASS",
      },
      indemnites_journalieres: {
        libelle: "Indemnités journalières",
        taux: 0.0085,
        plafond_pass: 5,
        note: "0,85 % plafonné à 5 PASS (240 300 €)",
      },
      retraite_base_plafonnee: {
        libelle: "Vieillesse de base plafonnée",
        taux: 0.1775,
        plafond_pass: 1,
        note: "17,75 % dans la limite de 1 PASS",
      },
      retraite_base_deplafonnee: {
        libelle: "Vieillesse de base déplafonnée",
        taux: 0.0072,
        plafond_pass: null,
        note: "0,72 % sur totalité du revenu",
      },
      retraite_complementaire: {
        libelle: "Retraite complémentaire SSI",
        tranches: [
          { de_pass: 0, a_pass: 1, taux: 0.081 },
          { de_pass: 1, a_pass: 4, taux: 0.091 },
        ] as TrancheCotisation[],
        note: "8,1 % ≤ 1 PASS, 9,1 % entre 1 et 4 PASS",
      },
      invalidite_deces: {
        libelle: "Invalidité-décès",
        taux: 0.013,
        plafond_pass: 1,
        note: "1,3 % plafonné à 1 PASS",
      },
      allocations_familiales: {
        libelle: "Allocations familiales",
        tranches: [
          { de_pass: 0.00, a_pass: 1.10, taux: 0.00 },
          { de_pass: 1.10, a_pass: 1.40, taux: 0.00 },
          { de_pass: 1.40, a_pass: null, taux: 0.031 },
        ] as TrancheCotisation[],
        note: "Progressif de 0 % à 3,1 %",
      },
      csg_crds: {
        libelle: "CSG-CRDS",
        taux_total: 0.097,
        taux_csg_deductible: 0.068,
        taux_csg_non_deductible: 0.024,
        taux_crds: 0.005,
        assiette_abattement: 0.26,
        note: "9,7 % sur assiette abattue de 26 % (même abattement que l'ASU)",
      },
      cfp: {
        libelle: "Contribution à la formation professionnelle",
        taux_commercant: 0.0025,
        taux_artisan: 0.0029,
        assiette: "PASS entier (48 060 €)",
      },
      note_generale:
        "Taux effectif global non fixe — varie selon le niveau de revenu et les tranches. " +
        "Cotisation minimale si résultat nul : voir CFG_COTISATIONS_MINIMALES_TNS_SSI.",
    },

    /**
     * Taux de cotisations TNS BNC professions libérales non réglementées (SSI)
     * Identique au BIC pour les PL non réglementées.
     */
    CFG_TAUX_SOCIAL_TNS_BNC_SSI: "Voir CFG_TAUX_SOCIAL_TNS_BIC — barème identique pour PL SSI",

    /**
     * Barème CIPAV — professions libérales réglementées (architectes, géomètres, experts-comptables,
     * consultants, formateurs, psychologues, ostéopathes, etc.)
     * Source : urssaf.fr mis à jour 27/02/2026 + CARPV guide 2026
     * Entrée en vigueur : avril 2026 (régularisation revenus 2025)
     */
    CFG_TAUX_SOCIAL_TNS_CIPAV: {
      maladie_maternite: {
        libelle: "Assurance maladie-maternité CIPAV",
        tranches: [
          { de_pass: 0.00, a_pass: 0.20, taux: 0.00 },
          { de_pass: 0.20, a_pass: 0.40, taux_progressif: "0 % à 1,5 %" },
          { de_pass: 0.40, a_pass: 0.60, taux_progressif: "1,5 % à 4 %" },
          { de_pass: 0.60, a_pass: 1.10, taux_progressif: "4 % à 6,5 %" },
          { de_pass: 1.10, a_pass: 2.00, taux_progressif: "6,5 % à 7,7 %" },
          { de_pass: 2.00, a_pass: 3.00, taux_progressif: "7,7 % à 8,5 %" },
          { de_pass: 3.00, a_pass: null, taux: 0.065 },
        ],
        note: "Même barème que SSI post-réforme ASU. Taux plein unifié à 8,5 % (sauf au-delà de 3 PASS : 6,5 %)",
      },
      indemnites_journalieres: {
        taux: 0.003,
        plafond_pass: 3,
        assiette_minimale_pass: 0.40,
        note: "0,30 % ≤ 3 PASS (144 180 €) — assiette minimale 40 % PASS",
      },
      retraite_base: {
        taux_t1: 0.0873,
        plafond_t1_pass: 1,
        taux_t2: 0.0187,
        plafond_t2_pass: 5,
        note: "8,73 % ≤ 1 PASS + 1,87 % ≤ 5 PASS — barème post-réforme ASU (hausse de 8,23 % à 8,73 %)",
      },
      retraite_complementaire: {
        taux_t1: 0.11,
        plafond_t1_pass: 1,
        taux_t2: 0.21,
        plafond_t2_pass: 4,
        note: "11 % ≤ 1 PASS + 21 % de 1 à 4 PASS — barème post-réforme ASU (était 9 % / 22 %)",
      },
      invalidite_deces: {
        taux: 0.005,
        plafond_pass: 1.85,
        note: "0,50 % ≤ 1,85 PASS (88 911 €)",
      },
      allocations_familiales: {
        tranches: [
          { de_pass: 0.00, a_pass: 1.10, taux: 0.00 },
          { de_pass: 1.10, a_pass: 1.40, taux_progressif: "0 % à 3,1 %" },
          { de_pass: 1.40, a_pass: null, taux: 0.031 },
        ],
        note: "Identique SSI — seuil déclenchement 110 % PASS (52 866 €)",
      },
      csg_crds: {
        taux_total: 0.097,
        note: "Identique SSI — sur assiette abattue 26 %",
      },
      cfp: {
        taux: 0.0025,
        taux_avec_conjoint_collaborateur: 0.0034,
        assiette: "PASS entier (48 060 €)",
        montant_annuel: 120,
        montant_annuel_avec_conjoint: 163,
      },
      cotisations_minimales: {
        retraite_base: {
          assiette: 5_409,
          taux: 0.0873,
          montant: 573,
          trimestres_valides: 3,
          note: "Assiette minimale = 450 × SMIC horaire (450 × 12,02 €)",
        },
        ij_maladie: {
          assiette_pass: 0.40,
          taux: 0.003,
          montant: 58,
        },
        invalidite_deces: {
          assiette_pass: 0.37,
          taux: 0.005,
          montant: 89,
        },
        cfp: { montant: 120 },
      },
      cotisation_forfaitaire_debut_activite: {
        assiette: 9_131,
        fraction_pass: 0.19,
        note: "Deux premières années : 19 % PASS. Réduction ACRE applicable sur certaines cotisations.",
      },
    },


    // ── 5c. COTISATIONS ASSIMILÉ SALARIÉ (Président SASU / gérant minoritaire) ──
    /**
     * Tableau détaillé des cotisations sociales assimilé-salarié 2026.
     * Arrêté du 22/12/2025 — taux de droit commun.
     *
     * Coût total employeur estimé : 62-80 % de la rémunération brute selon le niveau.
     * Ratio net / coût total : ~55-60 % selon tranche de salaire.
     *
     * Les présidents de SASU ne cotisent PAS à l'assurance chômage (pas de droit ARE).
     */
    CFG_TAUX_SOCIAL_ASSIMILE_SALARIE: {
      lignes: [
        {
          libelle: "Maladie-maternité",
          part_employeur: 0.130,
          part_salarie: null,
          assiette: "Total brut",
        },
        {
          libelle: "Vieillesse plafonnée",
          part_employeur: 0.0855,
          part_salarie: 0.069,
          assiette: "Tranche A (0 – 4 005 €/mois = 1 PMSS)",
        },
        {
          libelle: "Vieillesse déplafonnée",
          part_employeur: 0.0211,
          part_salarie: 0.004,
          assiette: "Total brut",
        },
        {
          libelle: "Allocations familiales",
          part_employeur: 0.0525,
          part_salarie: null,
          assiette: "Total brut",
        },
        {
          libelle: "Assurance chômage",
          part_employeur: 0.040,
          part_salarie: null,
          assiette: "Jusqu'à 4 PASS (192 240 €)",
          note: "Applicable seulement si salarié ordinaire — PAS pour président SASU",
        },
        {
          libelle: "FNAL (entreprises < 50 salariés)",
          part_employeur: 0.001,
          part_salarie: null,
          assiette: "Tranche A",
        },
        {
          libelle: "FNAL (entreprises ≥ 50 salariés)",
          part_employeur: 0.005,
          part_salarie: null,
          assiette: "Total brut",
        },
        {
          libelle: "AGS (Garantie des salaires)",
          part_employeur: 0.0025,
          part_salarie: null,
          assiette: "Jusqu'à 4 PASS",
        },
        {
          libelle: "CSA (Contribution Solidarité Autonomie)",
          part_employeur: 0.003,
          part_salarie: null,
          assiette: "Total brut",
        },
        {
          libelle: "CSG déductible",
          part_employeur: null,
          part_salarie: 0.068,
          assiette: "98,25 % du brut (si rémunération ≤ 4 PASS), 100 % au-delà",
        },
        {
          libelle: "CSG non déductible",
          part_employeur: null,
          part_salarie: 0.024,
          assiette: "98,25 % du brut",
        },
        {
          libelle: "CRDS",
          part_employeur: null,
          part_salarie: 0.005,
          assiette: "98,25 % du brut",
        },
        {
          libelle: "AGIRC-ARRCO Tranche 1",
          part_employeur: 0.0472,
          part_salarie: 0.0315,
          assiette: "Tranche A (0 – 1 PMSS)",
        },
        {
          libelle: "CEG Tranche 1",
          part_employeur: 0.0129,
          part_salarie: 0.0086,
          assiette: "Tranche A (0 – 1 PMSS)",
        },
      ] as CotisationLigne[],
      note_president_sasu:
        "Le président de SASU ne cotise pas au chômage. " +
        "Les cotisations retraite complémentaire (AGIRC-ARRCO) sont en sus (non listées ici). " +
        "Simulateur officiel : mon-entreprise.urssaf.fr/simulateurs/sasu",
    },


    // ── 5d. ASSIETTE SOCIALE UNIQUE (ASU) — EI RÉGIME RÉEL IR ───────────────
    /**
     * Cotisations minimales absolues TNS SSI par branche (résultat nul ou négatif).
     * Applicable aux artisans, commerçants et professions libérales non réglementées (SSI).
     * Hors CIPAV (dont les cotisations minimales sont documentées dans CFG_TAUX_SOCIAL_TNS_CIPAV).
     *
     * Sources : Urssaf barèmes 2026, Bpifrance Création mars 2026, arrêté 22/12/2025.
     * PASS 2026 = 48 060 €, SMIC horaire = 12,02 €.
     *
     * Total minimal absolu pour résultat nul : ~1 135 € (hors CFP).
     */
    CFG_COTISATIONS_MINIMALES_TNS_SSI: {
      maladie_maternite: {
        assiette_minimale: null,
        taux: 0.00,
        montant: 0,
        note: "Pas d'assiette minimale — taux 0 % si revenus < 20 % PASS",
      },
      indemnites_journalieres: {
        assiette_minimale: PASS_2026 * 0.40,
        taux: 0.005,
        montant: Math.round(PASS_2026 * 0.40 * 0.005),
        note: "40 % PASS × 0,50 %",
      },
      allocations_familiales: {
        assiette_minimale: null,
        taux: 0.00,
        montant: 0,
        note: "Pas de cotisation minimale — taux 0 % si revenus < 110 % PASS",
      },
      retraite_base: {
        assiette_minimale: 450 * 12.02,
        taux: 0.1787,
        montant: Math.round(450 * 12.02 * 0.1787),
        trimestres_valides: 3,
        note: "450 × SMIC horaire × 17,87 % — permet 3 trimestres de retraite",
      },
      invalidite_deces: {
        assiette_minimale: PASS_2026 * 0.115,
        taux: 0.013,
        montant: Math.round(PASS_2026 * 0.115 * 0.013),
        note: "11,5 % PASS × 1,30 %",
      },
      csg_crds: {
        assiette_minimale: null,
        taux: 0.097,
        montant: 0,
        note: "Pas d'assiette minimale — 0 € si résultat nul",
      },
      get total_minimal_hors_cfp() {
        return (
          this.indemnites_journalieres.montant +
          this.retraite_base.montant +
          this.invalidite_deces.montant
        );
      },
      note:
        "Ces assiettes minimales sont indépendantes de l'assiette ASU (abattement 26 %). " +
        "Elles garantissent des droits minimaux même en cas de résultat nul ou déficitaire.",
    },

    /**
     * Règles de l'Assiette Sociale Unique pour EI au régime réel IR.
     *
     * Formule :
     *   Assiette = [CA − Charges_professionnelles_hors_cotisations_et_CSG] × (1 − 0.26)
     *   → Abattement forfaitaire de 26 % sur le revenu professionnel net
     *
     * L'abattement représente forfaitairement le poids des charges sociales,
     * éliminant le calcul circulaire (cotisations dans la base des cotisations).
     */
    CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR: {
      abattement_forfaitaire: 0.26,
      plancher: {
        fraction_pass: 0.0176,
        valeur_2026: PASS_2026 * 0.0176,
        note: "1,76 % du PASS = 845,86 € — cotisation minimale en cas de résultat très faible",
      },
      plafond: {
        fraction_pass: 1.30,
        valeur_2026: PASS_2026 * 1.30,
        note: "130 % du PASS = 62 478 € — plafond de l'abattement",
      },
      formule: "Assiette = max(plancher, min(revenu_professionnel × 0.74, plafond))",
      assiette_unique: true,
      note:
        "L'assiette ASU est utilisée à la fois pour les cotisations contributives ET la CSG-CRDS. " +
        "Pour les EI à l'IS : assiette = (rémunération nette + cotisations + CSG déductible + " +
        "dividendes_soumis_TNS) × 0.74",
    },


    // ── 5e. DIVIDENDES ET COTISATIONS SOCIALES ──────────────────────────────
    /**
     * Règles d'assujettissement des dividendes aux cotisations sociales TNS.
     * Art. L.131-6 du CSS — applicable aux gérants majoritaires EURL/SARL/SELARL.
     *
     * Logique :
     *   dividendes_franchise ≤ 10 % × (capital_social + primes_emission + CCA_moyen)
     *   dividendes_soumis_TNS = max(0, dividendes_distribues − dividendes_franchise)
     *
     * Les dividendes dans la franchise : prélèvements sociaux uniquement (18,6 % en 2026).
     * Les dividendes hors franchise : cotisations TNS (~45 % moyen) + IR.
     */
    CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_TNS: {
      seuil_franchise: {
        fraction: 0.10,
        base: "capital_social + primes_emission + solde_moyen_annuel_CCA",
        appreciation_capital: "Dernier jour de l'exercice précédant la distribution",
        appreciation_cca: "Moyenne des 12 soldes mensuels de l'exercice",
      },
      fraction_soumise_cotisations: "max(0, dividendes_distribues − seuil_franchise)",
      fraction_hors_franchise_regime: "Cotisations TNS (même barème que rémunération)",
      prelevements_sociaux_sur_franchise: 0.186,
      note: "Art. L.131-6 CSS — applicable EURL, SARL, SELARL gérant majoritaire",
    },

    /**
     * Règles d'assujettissement des dividendes pour assimilé-salarié (SASU/SELAS).
     * LFSS 2026 : hausse CSG +1,4 pt sur revenus du capital → PS à 18,6 %.
     * Aucune réforme actée en 2026 sur le régime des dividendes assimilé-salarié.
     *
     * Les dividendes du président SASU sont soumis aux prélèvements sociaux (18,6 %),
     * mais JAMAIS aux cotisations sociales (quel que soit le montant).
     */
    CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_ASSIMILE: {
      soumis_cotisations_sociales: false,
      soumis_prelevements_sociaux: true,
      taux_prelevements_sociaux_2026: 0.186,
      pfu_total_2026: 0.314,
      detail_pfu: { ir: 0.128, ps: 0.186 },
      note:
        "Hausse CSG +1,4 pt (LFSS 2026) : PS passent de 17,2 % à 18,6 % sur dividendes SASU. " +
        "PFU total : 12,8 % IR + 18,6 % PS = 31,4 %. " +
        "Option barème IR possible : CSG déductible reste à 6,8 %.",
    },


    // ── 5f. PUMA — COTISATION SUBSIDIAIRE MALADIE ───────────────────────────
    /**
     * Seuil de revenus d'activité en dessous duquel la CSM (taxe PUMa) peut s'appliquer.
     * Condition 1 : revenus d'activité < 20 % PASS = 9 612 €
     * Condition 2 : revenus du patrimoine > 50 % PASS = 24 030 €
     * Condition 3 : absence de revenus de remplacement (retraite, ARE, etc.)
     */
    CFG_SEUIL_PUMA: {
      seuil_activite_insuffisante: PASS_2026 * 0.20,
      seuil_patrimoine_declencheur: PASS_2026 * 0.50,
      plafond_assiette: PASS_2026 * 8,
      note: "Les deux seuils sont cumulatifs. Exonération si conjoint a revenus > 20 % PASS.",
    },

    /**
     * Formule de calcul de la Cotisation Subsidiaire Maladie (CSM / taxe PUMa).
     * Art. L.380-2 du CSS.
     *
     * T = 6,5 % × (A − 0,5 × PASS) × (1 − R / (0,2 × PASS))
     *
     * Où :
     *   A = revenus du patrimoine et du capital (plafonnés à 8 PASS = 384 480 €)
     *   R = revenus d'activité professionnelle (si R ≥ 20 % PASS, T = 0)
     *
     * La CSM est déductible de l'IR (comme une cotisation sociale).
     * Elle est appelée par l'URSSAF au T4 (novembre) sur les revenus N-1.
     */
    CFG_FORMULE_TAXE_PUMA: {
      taux: 0.065,
      formule:
        "T = 0.065 × (A − 0.5 × PASS) × (1 − R / (0.2 × PASS))",
      variables: {
        A: "Revenus du patrimoine et du capital, plafonnés à 8 PASS (384 480 €)",
        R: "Revenus d'activité professionnelle — si R ≥ 9 612 €, T = 0",
      },
      deductibilite_ir: true,
      calendrier: "Appel URSSAF en novembre de l'année N sur revenus N-1",
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 6. SANTÉ — PROFESSIONS MÉDICALES ET PARAMÉDICALES (PAMC)
  // Convention médicale 2024-2029 — aides CPAM confirmées 2026.
  // ═══════════════════════════════════════════════════════════════════════════
  sante: {

    // ── 6a. TAUX COTISATION MALADIE PAR SECTEUR — BARÈME UNIFIÉ POST-RÉFORME ASU ──
    /**
     * Barème unifié cotisation maladie-maternité PAMC — post-réforme ASU (avril 2026)
     * Source : urssaf.fr mis à jour 20/03/2026
     *
     * Structure en deux assiettes distinctes :
     * (1) Assiette de participation CPAM (revenus conventionnés)
     * (2) Reste du revenu d'activité non salarié (revenus non conventionnés)
     *
     * Le barème est IDENTIQUE pour S1, S2-OPTAM, S2-non-OPTAM, chirurgien-dentiste,
     * auxiliaires médicaux et sages-femmes — la différence tient à la PRISE EN CHARGE CPAM.
     */
    CFG_BAREME_MALADIE_PAMC_UNIFIE: {
      sur_assiette_participation_cpam: {
        libelle: "Assurance maladie sur assiette de participation CPAM (revenus conventionnés)",
        tranches: [
          { de_pass: 0.00, a_pass: 0.20, taux: 0.000 },
          { de_pass: 0.20, a_pass: 3.00, taux_progressif: "0 % à 8,50 %" },
          { de_pass: 3.00, a_pass: null, taux: 0.065 },
        ],
        prise_en_charge_cpam: {
          secteur_1: "Taux progressif : entre 0 % et 8,40 %",
          secteur_2_optam: "Taux progressif : entre 0 % et 8,40 % (sur part conventionnée)",
          secteur_2_non_optam: "0 % (aucune prise en charge)",
          auxiliaires_medicaux_s1: "Taux progressif : entre 0 % et 8,40 %",
        },
        seuil_bas: PASS_2026 * 0.20,
        seuil_haut: PASS_2026 * 3.00,
        note: "Prise en charge CPAM quasi-totale pour S1 — reste net praticien ≈ 0,10 %",
      },
      sur_reste_revenu_non_salarie: {
        libelle: "Assurance maladie sur reste du revenu d'activité non salarié (non conventionné)",
        tranches: [
          { de_pass: 0.00, a_pass: 0.20, taux: 0.0325 },
          { de_pass: 0.20, a_pass: 3.00, taux_progressif: "3,25 % à 11,75 %" },
          { de_pass: 3.00, a_pass: null, taux: 0.0975 },
        ],
        prise_en_charge_cpam: "0 % — aucune prise en charge CPAM sur cette assiette",
        note: "Taux de 3,25 % plancher (contribution additionnelle sur dépassements/revenus non conventionnés)",
      },
    },

    /**
     * Taux de cotisation maladie secteur 1 (synthèse opérationnelle)
     * Pour le calcul du moteur : utiliser CFG_BAREME_MALADIE_PAMC_UNIFIE
     */
    CFG_TAUX_MALADIE_SECTEUR_1: {
      regime: "PAMC S1 — voir CFG_BAREME_MALADIE_PAMC_UNIFIE",
      taux_brut_max_assiette_cpam: 0.085,
      prise_en_charge_cpam_max: 0.084,
      taux_net_praticien_min: 0.001,
      taux_non_conventionne: 0.0325,
      note: "Prise en charge CPAM quasi-totale sur revenus conventionnés S1",
    },

    /**
     * Taux cotisation maladie secteur 2 OPTAM (synthèse)
     */
    CFG_TAUX_MALADIE_SECTEUR_2_OPTAM: {
      regime: "PAMC S2-OPTAM — voir CFG_BAREME_MALADIE_PAMC_UNIFIE",
      taux_brut_max_assiette_cpam: 0.085,
      prise_en_charge_cpam_max: 0.084,
      taux_depassements: 0.0325,
      note: "Prise en charge CPAM sur part conventionnée — même barème que S1",
    },

    /**
     * Taux cotisation maladie secteur 2 non-OPTAM (synthèse)
     */
    CFG_TAUX_MALADIE_SECTEUR_2_NON_OPTAM: {
      regime: "PAMC S2-non-OPTAM — voir CFG_BAREME_MALADIE_PAMC_UNIFIE",
      taux_brut_max: 0.085,
      prise_en_charge_cpam: 0.000,
      taux_depassements: 0.0325,
      note: "Aucune prise en charge CPAM — taux identique en brut mais entièrement à charge",
    },

    /**
     * Taux cotisation maladie hors convention / secteur 3
     */
    CFG_TAUX_MALADIE_HORS_CONVENTION: {
      taux_brut: 0.085,
      taux_supplement: 0.0325,
      taux_effectif_total: 0.1175,
      prise_en_charge_cpam: 0.000,
      note: "Taux plein sans aide — maximum 11,75 % sur revenus > 300 % PASS",
    },

    /**
     * Contributions CURPS (Unions régionales professionnels de santé) 2026
     * Source : urssaf.fr PAMC 20/03/2026
     */
    CFG_CURPS: {
      medecins: { taux: 0.005, plafond_annuel: 240 },
      chirurgiens_dentistes: { taux: 0.003, plafond_annuel: 240 },
      auxiliaires_medicaux: { taux: 0.001, plafond_annuel: 240 },
      sages_femmes: { taux: 0.001, plafond_annuel: 240 },
      note: "Contribution aux unions régionales professionnels de santé — 0,50 % médecins / 0,10 % auxiliaires",
    },


    // ── 6b. AIDE CPAM SUR COTISATION MALADIE ────────────────────────────────
    /**
     * Paramètres de l'aide CPAM sur la cotisation maladie (PAMC).
     * Secteur 1 et secteur 2 OPTAM uniquement.
     */
    CFG_PARAM_AIDE_CPAM_MALADIE: {
      beneficiaires: ["secteur_1", "secteur_2_optam"],
      taux_prise_en_charge: 0.064,
      assiette: "Honoraires conventionnés (rémunération hors dépassements)",
      note: "Prise en charge quasi-totale — reste 0,10 % à charge du praticien S1/S2-OPTAM",
    },


    // ── 6c. CARMF — COTISATIONS MÉDECINS 2026 ───────────────────────────────
    /**
     * Cotisations CARMF médecins 2026 — Source : CARMF barème 2026 officiel
     * Post-réforme ASU : assiette = revenus nets d'activité indépendante N-2
     */
    CFG_CARMF_2026: {
      retraite_base: {
        taux_t1: 0.0873,
        plafond_t1: PASS_2026,
        taux_t2: 0.0187,
        plafond_t2: PASS_2026 * 5,
        cotisation_maximale: Math.round(PASS_2026 * 0.0873 + PASS_2026 * 5 * 0.0187),
        note: "8,73 % ≤ 1 PASS + 1,87 % ≤ 5 PASS — cotisation max calculée",
      },
      retraite_complementaire: {
        taux: 0.118,
        plafond: PASS_2026 * 3.5,
        note: "11,80 % ≤ 3,5 PASS (168 210 €) — hausse de 10,20 % à 11,80 % post-réforme",
      },
      invalidite_deces: {
        montant_minimum: 626,
        montant_maximum: 1_010,
        formule_variable: "434 + (revenus × 0,32 %) + (revenus × 0,08 %)",
        tranche_minimum: PASS_2026,
        tranche_maximum: PASS_2026 * 3,
        note: "626 € si revenus < 1 PASS, variable entre 1 et 3 PASS, 1 010 € si > 3 PASS",
      },
      participation_cpam_retraite_base: {
        tranche_1: { de: 0, a: PASS_2026 * 1.4, taux_cpam: 0.0215 },
        tranche_2: { de: PASS_2026 * 1.4, a: PASS_2026 * 2.5, taux_cpam: 0.0151 },
        tranche_3: { de: PASS_2026 * 2.5, a: null, taux_cpam: 0.0112 },
        note: "Participation CPAM sur cotisation retraite base secteur 1 uniquement",
      },
      asv: {
        part_forfaitaire_secteur_1_medecin: 1_917,
        part_forfaitaire_secteur_1_cpam: 3_834,
        part_forfaitaire_secteur_1_total: 5_751,
        part_forfaitaire_secteur_2_medecin: 5_751,
        part_forfaitaire_secteur_2_cpam: 0,
        ajustement_taux_secteur_1_medecin: 0.013333,
        ajustement_taux_secteur_1_cpam: 0.025333,
        ajustement_taux_secteur_2_medecin: 0.04,
        ajustement_taux_secteur_2_cpam: 0.00,
        plafond_assiette: PASS_2026 * 5,
        seuil_proportionnalite_integrale: 63_900,
        // ⚠️ Valeur fixée par convention médicale — indépendante du PASS, à vérifier chaque année
      },
    },

    /**
     * CARPIMKO — cotisations kinésithérapeutes, infirmiers, orthophonistes, orthoptistes.
     * Source : carpimko.com — guide cotisations 2026
     * Retraite de base : identique à tous les PAMC (CARMF, CARCDSF, CARPV).
     */
    CFG_CARPIMKO_2026: {
      retraite_base: {
        taux_t1: 0.0873,
        plafond_t1: PASS_2026,
        taux_t2: 0.0187,
        plafond_t2: PASS_2026 * 5,
        note: "Identique à CARMF/CIPAV/CARCDSF — barème CNAVPL unifié",
      },
      retraite_complementaire: {
        taux: 0.087,
        assiette_min_pass: 0.5,
        assiette_max_pass: 3,
        montant_min_2026: Math.round(PASS_2026 * 0.5 * 0.087),
        montant_max_2026: Math.round(PASS_2026 * 3 * 0.087),
        note: "8,70 % sur assiette entre 0,5 et 3 PASS",
      },
      asv: {
        forfait_total: 671,
        part_adherent: 224,
        part_cpam: 447,
        taux_proportionnel: 0.004,
        assiette_proportionnel: "Assiette sociale conventionnée 2025",
        note: "2/3 financé par CPAM — identique structure à CARMF secteur 1",
      },
      invalidite_deces: {
        montant_forfaitaire: 1_022,
        note: "Forfait dû même en cas d'arrêt de travail RID depuis 01/01/2025",
      },
    },

    /**
     * CARCDSF — chirurgiens-dentistes et sages-femmes conventionnées.
     * Source : carcdsf.fr — cotisations 2026
     */
    CFG_CARCDSF_2026: {
      retraite_base: {
        taux_t1: 0.0873,
        plafond_t1: PASS_2026,
        taux_t2: 0.0187,
        plafond_t2: PASS_2026 * 5,
        note: "Identique à CARMF/CIPAV/CARPIMKO/CARPV — barème CNAVPL unifié",
        cotisation_minimale: {
          assiette: Math.round(450 * 12.02),
          taux: 0.0873,
          montant: Math.round(450 * 12.02 * 0.0873),
          trimestres_valides: 3,
        },
      },
      retraite_complementaire: {
        forfait: 3_210.60,
        taux_proportionnel: 0.1135,
        assiette_min: PASS_2026 * 0.65,
        assiette_max: PASS_2026 * 5,
        reduction_si_revenus_inferieurs_seuil: {
          seuil: PASS_2026 * 0.65,
          coefficient: "revenus / seuil",
          note: "Réduction de la cotisation forfaitaire si revenus < 65 % PASS (31 239 €)",
        },
        note: "3 210,60 € forfait + 11,35 % sur revenus entre 31 239 € et 240 300 €",
      },
      pcv_dentistes: {
        libelle: "Prestations Complémentaires de Vieillesse — dentistes conventionnés",
        financement_cpam: 2 / 3,
        financement_praticien: 1 / 3,
        note: "Régime spécifique conventionnés — paramètres détaillés sur carcdsf.fr",
      },
      pcv_sages_femmes: {
        libelle: "Prestations Complémentaires de Vieillesse — sages-femmes conventionnées",
        note: "Paramètres spécifiques sur carcdsf.fr",
      },
      invalidite_deces_sages_femmes: {
        montant_forfaitaire: 384,
        note: "Forfait 2026 — dentistes : voir carcdsf.fr pour montant spécifique",
      },
    },

    /**
     * Paramètres aide CPAM sur cotisation retraite (ASV médecins).
     * Part forfaitaire totale ASV 2026 : 5 751 €
     *   - Secteur 1 : médecin 1 917 € + CPAM 3 834 €
     *   - Secteur 2 : 5 751 € intégralement à charge du médecin
     *
     * Part proportionnelle (% sur revenus conventionnels N-2) :
     *   - Secteur 1 : médecin 1,3333 % + CPAM 2,5333 %
     *   - Secteur 2 : médecin 4,00 % (sans aide)
     *
     * Note : ces données sont également disponibles dans CFG_CARMF_2026.asv — source unique.
     * Ce paramètre est un alias de lecture pratique pour le moteur santé.
     */
    CFG_PARAM_AIDE_CPAM_RETRAITE: {
      renvoi: "CFG_CARMF_2026.asv — données complètes et non dupliquées",
      asv_seuil_proportionnalite_integrale: 63_900,
      // ⚠️ 63 900 € : valeur conventionnelle fixe (≠ multiple PASS), à vérifier chaque année
      asv_plafond_assiette: PASS_2026 * 5,
      note: "Source : CARMF barème 2026",
    },


    // ── 6d. DÉDUCTIONS FISCALES MÉDECINS SECTEUR 1 ──────────────────────────
    /**
     * Déduction Groupe III — frais de représentation médicale.
     * Applicable en régime réel BNC Secteur 1 (déclaration 2035).
     * BOFiP BOI-BNC-SECT-40 § 170.
     */
    CFG_PARAM_DEDUCTION_GROUPE_III: {
      libelle: "Abattement forfaitaire représentation médicale (Groupe III)",
      taux_sur_honoraires_conventionnels: 0.02,
      montant_maximum: 3_050,
      note:
        "Déduction de 2 % des honoraires conventionnels, plafonnée à 3 050 €. " +
        "Cumulable avec la déduction complémentaire de 3 %.",
    },

    /**
     * Déduction complémentaire santé — 3 % des honoraires conventionnels.
     * BOFiP BOI-BNC-SECT-40 — applicable secteur 1 et 2 OPTAM.
     * Attention : purement fiscale — l'URSSAF réintègre ces abattements dans l'assiette sociale.
     */
    CFG_PARAM_DEDUCTION_COMPLEMENTAIRE_SANTE: {
      libelle: "Déduction complémentaire frais spécifiques (3 %)",
      taux_sur_honoraires_conventionnels: 0.03,
      beneficiaires: ["secteur_1", "secteur_2_optam"],
      impact_assiette_sociale: "NON — réintégrée par l'URSSAF dans l'assiette TNS",
      note: "Déduction purement fiscale sur 2035. Cumulable avec Groupe I, II et III.",
    },


    // ── 6e. AIDE INSTALLATION ZIP/ZAC ───────────────────────────────────────
    /**
     * Aides à l'installation en zones sous-denses — Convention médicale 2024-2029.
     * Remplace les anciens contrats CAIM (50 000 € sur 5 ans).
     */
    CFG_PARAM_ZIP_ZAC_MONTANT_FORFAITAIRE: {
      primo_installation_zip: 10_000,
      primo_installation_zac: 5_000,
      cabinet_secondaire_zip: 3_000,
      consultations_avancees_zip_par_demi_journee: 200,
      consultations_avancees_zip_max_par_mois: 6,
      note:
        "Aides versées par la CPAM en une fois pour primo-installation. " +
        "Anciens contrats CAIM signés avant 2026 se poursuivent jusqu'à leur terme.",
    },


    // ── 6f. ASV ET PAMC ──────────────────────────────────────────────────────
    /**
     * Avantage Social Vieillesse — règles de financement CPAM/praticien.
     * Voir CFG_PARAM_AIDE_CPAM_RETRAITE pour les montants détaillés.
     */
    CFG_REGLES_ASV: {
      part_cpam_secteur_1: 2 / 3,
      part_praticien_secteur_1: 1 / 3,
      part_cpam_secteur_2: 0,
      part_praticien_secteur_2: 1,
      description: "Avantage Social Vieillesse — cotisation forfaitaire médecins CARMF",
      renvoi: "CFG_PARAM_AIDE_CPAM_RETRAITE pour les montants 2026",
    },

    /**
     * Régime PAMC — Praticiens et Auxiliaires Médicaux Conventionnés.
     * Composantes de cotisations URSSAF 2026.
     */
    CFG_REGLES_PAMC: {
      maladie_taux_brut: 0.065,
      contribution_additionnelle_depassements: 0.0325,
      allocations_familiales: {
        tranches: [
          { de_pass: 0.00, a_pass: 1.10, taux: 0.00 },
          { de_pass: 1.10, a_pass: null, taux: 0.031 },
        ] as TrancheCotisation[],
      },
      csg_taux: 0.092,
      crds_taux: 0.005,
      indemnites_journalieres_taux: 0.003,
      cfp_taux: 0.0025,
      curps_taux: 0.001,
      assiette_asu: {
        formule: "(recettes − charges_hors_cotisations) × 0.74",
        note: "Réforme ASU effective 2025 pour PAMC — même abattement 26 % que TNS",
      },
      note: "Taux auxiliaires médicaux (infirmiers, kiné, orthophonistes) — source URSSAF PAMC 2026",
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 7. ARTISTE-AUTEUR — RÉGIME SPÉCIFIQUE AGESSA/MDA
  // Sécurité Sociale des Artistes-Auteurs (SSAA).
  // ═══════════════════════════════════════════════════════════════════════════
  culture: {
    /**
     * Structure des cotisations sociales artiste-auteur 2026.
     * Assiette :
     *   - BNC micro : recettes × (1 − 0,34) × 1,15 (abattement forfaitaire + majoration 15 %)
     *   - BNC réel : bénéfice × 1,15
     *   - T&S : 98,25 % du revenu si ≤ 4 PASS (192 240 €), 100 % au-delà
     */
    CFG_TAUX_COTISATIONS_ARTISTE_AUTEUR: {
      vieillesse_deplafonnee: {
        taux_nominal: 0.004,
        part_prise_en_charge_etat: 0.004,
        taux_net_auteur: 0.000,
        note: "Totalité prise en charge par l'État",
      },
      vieillesse_plafonnee: {
        taux_nominal: 0.069,
        part_prise_en_charge_etat: 0.0075,
        taux_net_auteur: 0.0615,
        plafond: PASS_2026,
        note: "6,90 % − 0,75 pt pris en charge = net auteur 6,15 %",
      },
      csg: {
        taux: 0.092,
        assiette: "98,25 % du revenu si ≤ 4 PASS, 100 % au-delà",
      },
      crds: {
        taux: 0.005,
        assiette: "98,25 % du revenu si ≤ 4 PASS, 100 % au-delà",
      },
      cfp: {
        taux: 0.0035,
        assiette: "Totalité des revenus artistiques",
      },
      seuil_validation_trimestre_retraite: Math.round(150 * 12.02),
      seuil_validation_annee_complete_retraite: Math.round(600 * 12.02),
      // 150 heures SMIC = 1 trimestre / 600 heures SMIC = 4 trimestres
    },

    /**
     * Seuil d'affiliation obligatoire au RAAP (retraite complémentaire IRCEC)
     * Calculé sur la base du SMIC horaire : 900 heures × SMIC_horaire.
     */
    CFG_SEUIL_RAAP: Math.round(900 * 12.02),

    /** Taux RAAP normal (cotisation retraite complémentaire artiste-auteur) */
    CFG_TAUX_RAAP_NORMAL: 0.08,

    /**
     * Taux RAAP réduit (option sur demande avant le 30 novembre de l'année)
     * Condition : assiette sociale ≤ 3 × CFG_SEUIL_RAAP
     */
    CFG_TAUX_RAAP_REDUIT: 0.04,

    /**
     * Règles détaillées d'affiliation et de calcul RAAP.
     */
    CFG_REGLE_AFFILIATION_RAAP: {
      seuil_affiliation: Math.round(900 * 12.02),
      formule_seuil: "900 × SMIC_horaire",
      plafond_assiette: PASS_2026 * 3,
      cotisation_maximale_taux_normal: PASS_2026 * 3 * 0.08,
      date_option_taux_reduit: "30 novembre de l'année N pour effet N",
      condition_taux_reduit: "Assiette sociale ≤ 3 × seuil_affiliation",
      note: "Affiliation obligatoire si revenus artistiques N-1 ≥ seuil. Source : IRCEC 2026.",
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 8. IMMOBILIER MEUBLÉ — LMNP / LMP
  // LF 2025 art. 84 : réintégration amortissements LMNP dans calcul PV.
  // ═══════════════════════════════════════════════════════════════════════════
  immobilier: {
    /**
     * Seuil de recettes locatives meublées annuelles pour qualification LMP (€)
     * Condition 1 (ce seuil). Condition 2 : recettes > autres revenus d'activité du foyer.
     */
    CFG_SEUIL_LMP_RECETTES: 23_000,

    /**
     * Formule de qualification LMP — condition de prédominance des recettes.
     * Les revenus à comparer côté « autres activités » incluent : salaires nets imposables,
     * BIC, BNC, BA, pensions de retraite. Sont EXCLUS : fonciers, dividendes, RCM.
     */
    CFG_FORMULE_CRITERE_LMP_PAR_RAPPORT_AUX_AUTRES_REVENUS: {
      condition: "recettes_location_meublee > revenus_activite_professionnelle_foyer",
      revenus_inclus_comparaison: [
        "salaires_nets_imposables",
        "BIC_autres",
        "BNC_autres",
        "BA",
        "pensions_retraite",
      ],
      revenus_exclus_comparaison: ["revenus_fonciers", "dividendes", "revenus_capitaux_mobiliers"],
      proratisation_exercice_incomplet: true,
      note: "Les deux conditions (seuil 23 000 € ET prédominance) sont cumulatives",
    },

    /**
     * Taux de cotisations SSI pour loueur en meublé professionnel (LMP).
     * Le LMP relève du même barème TNS BIC que les artisans/commerçants.
     * Le moteur DOIT calculer les cotisations branche par branche via CFG_TAUX_SOCIAL_TNS_BIC —
     * il ne doit pas utiliser de taux effectif global approximatif.
     * Cotisation minimale : voir CFG_COTISATIONS_MINIMALES_TNS_SSI (même règles).
     */
    CFG_TAUX_SOCIAL_LMP_SSI: {
      regime: "TNS_SSI — barème identique artisans/commerçants",
      renvoi_bareme: "CFG_TAUX_SOCIAL_TNS_BIC",
      renvoi_minimales: "CFG_COTISATIONS_MINIMALES_TNS_SSI",
      note: "Ne pas utiliser de taux effectif global — calculer branche par branche",
    },

    /**
     * Règles d'amortissement LMNP en régime réel.
     * Méthode linéaire par composants — art. 39 CGI adapté.
     * Le TERRAIN n'est jamais amortissable.
     *
     * Note : deux sources divergent légèrement sur les durées.
     * Les durées BOFIP (BOI-BIC-AMT) sont retenues en priorité.
     * Le seuil d'immobilisation à 500 € HT est retenu (prudence vs 600 € BOFIP 2022).
     */
    CFG_REGLES_AMORTISSEMENT_LMNP_REEL: {
      terrain: {
        amortissable: false,
        note: "Le terrain est toujours exclu de l'amortissement",
      },
      composants: [
        {
          libelle: "Structure / gros œuvre",
          part_valeur_estimee: { min: 0.35, max: 0.50 },
          duree_ans: { min: 25, max: 40 },
          note: "Source BOFIP BOI-BIC-AMT — durée préférentielle 30-40 ans pour résidentiel",
        },
        {
          libelle: "Toiture",
          part_valeur_estimee: { min: 0.05, max: 0.10 },
          duree_ans: { min: 15, max: 25 },
        },
        {
          libelle: "Installations techniques (chauffage, électricité, plomberie)",
          part_valeur_estimee: { min: 0.10, max: 0.15 },
          duree_ans: { min: 10, max: 20 },
        },
        {
          libelle: "Aménagements intérieurs (cloisons, revêtements)",
          part_valeur_estimee: { min: 0.15, max: 0.30 },
          duree_ans: { min: 8, max: 12 },
        },
        {
          libelle: "Mobilier (literie, électroménager, mobilier courant)",
          part_valeur_estimee: null,
          duree_ans: { min: 5, max: 10 },
          detail: "Literie ~6 ans, électroménager ~5 ans, mobilier ~10 ans",
        },
        {
          libelle: "Travaux d'amélioration",
          part_valeur_estimee: null,
          duree_ans: { min: 10, max: 25 },
          note: "Selon nature : 10 ans si équipement, 25 ans si structure",
        },
      ],
      seuil_immobilisation: {
        valeur_ht: 500,
        note:
          "En dessous de 500 € HT : possible déduction directe en charge. " +
          "Le BOFIP mentionne 600 € dans certaines versions — seuil 500 € retenu par prudence.",
      },
      regle_art_39_c: {
        principe: "L'amortissement ne peut pas créer ni augmenter un déficit BIC non professionnel",
        formule:
          "amortissement_deductible = min(amortissement_theorique, " +
          "loyers − charges_hors_amortissement)",
        excedent: "Amortissements réputés différés (ARD) — reportables sans limite de durée",
        application: "LMNP uniquement. LMP : amortissements intégralement déductibles.",
      },
    },

    /**
     * Règles de déductibilité des charges LMNP au régime réel.
     * Art. 39 du CGI adapté.
     */
    CFG_REGLES_DEDUCTIBILITE_CHARGES_LMNP: {
      charges_deductibles: [
        "Intérêts d'emprunt (y compris assurance emprunteur et frais de dossier)",
        "Travaux d'entretien et réparation (si < 500 € HT, déductible directement)",
        "Charges de copropriété non récupérables sur le locataire (hors fonds ALUR)",
        "Taxe foncière (hors TEOM qui doit être récupérée sur le locataire)",
        "Contribution Foncière des Entreprises (CFE)",
        "Honoraires comptables et frais de gestion",
        "Frais d'agence (mise en location et gestion courante)",
        "Assurance PNO (propriétaire non occupant)",
        "Frais de procédure (contentieux locatif)",
      ],
      deficit_bic_non_professionnel: {
        imputation: "Sur BIC non professionnel uniquement (pas sur revenu global)",
        report: "10 ans — art. 156 I-1° bis du CGI",
      },
      deficit_lmp: {
        imputation: "Sur revenu global sans limitation",
        note: "Avantage majeur du statut LMP vs LMNP",
      },
    },

    /**
     * Règles de plus-values LMNP — régime des particuliers (art. 150 U CGI).
     * LF 2025 art. 84 : réintégration des amortissements dans le calcul de la PV.
     * Applicable aux cessions à compter du 15/02/2025.
     */
    CFG_REGLES_PLUS_VALUES_LMNP: {
      regime: "Particuliers — art. 150 U du CGI",
      taux_ir: 0.19,
      taux_ps: 0.172,
      taux_total_base: 0.362,
      surtaxe: {
        seuil: 50_000,
        taux_min: 0.02,
        taux_max: 0.06,
        note: "Surtaxe progressive sur PV nette > 50 000 €",
      },
      reforme_lf_2025: {
        principe:
          "Les amortissements déduits (art. 39 C) sont réintégrés dans le calcul de la PV. " +
          "Le prix d'acquisition retenu est minoré des amortissements déduits.",
        date_application: "Cessions à compter du 15/02/2025",
        retroactivite_amortissements_anterieurs: true,
        source: "LF 2025 art. 84 + réponse ministérielle Mette JOAN 24/03/2026",
        exceptions: ["Résidences étudiantes", "Résidences seniors", "EHPAD"],
      },
      abattements_ir: {
        de_1_a_5_ans: 0.00,
        de_6_a_21_ans: 0.06,
        annee_22: 0.04,
        exoneration_totale_ir_apres: 22,
      },
      abattements_ps: {
        de_1_a_5_ans: 0.00,
        de_6_a_21_ans: 0.0165,
        annee_22: 0.016,
        de_23_a_30_ans: 0.09,
        exoneration_totale_ps_apres: 30,
      },
    },

    /**
     * Règles de plus-values LMP — régime professionnel.
     * Art. 39 duodecies + art. 151 septies du CGI.
     */
    CFG_REGLES_PLUS_VALUES_LMP: {
      regime: "Professionnel — art. 39 duodecies du CGI",
      calcul_pv: "Valeur de cession − VNC (valeur nette comptable = prix − amortissements cumulés)",
      pvct: {
        libelle: "Plus-value à court terme (amortissements réintégrés)",
        regime_ir: "Barème progressif IR",
        regime_cotisations: "Soumis cotisations SSI (~35-45 %)",
        etalement: "Étalement possible sur 3 ans pour la fraction IR",
      },
      pvlt: {
        libelle: "Plus-value à long terme (valorisation économique du bien)",
        regime: "PFU 30 % = 12,8 % IR + 17,2 % PS (PV immobilières exclues de la hausse CSG 2026)",
        cotisations: "Non soumis aux cotisations SSI",
      },
      exoneration_art_151_septies: {
        condition_anciennete_ans: 5,
        seuil_exoneration_totale: 90_000,
        seuil_exoneration_partielle_max: 126_000,
        formule_partielle: "(126_000 − recettes_moyennes_2_ans) / 36_000",
        note: "Recettes = moyenne des 2 exercices précédant la cession",
      },
      abattement_art_151_septies_b: {
        libelle: "Abattement pour durée de détention sur PVLT immobilière",
        taux_annuel_a_partir_annee_6: 0.10,
        exoneration_totale_apres_ans: 15,
      },
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 9. AIDES — ACRE / ARCE
  // Décret n° 2026-69 du 06/02/2026 — réforme ACRE.
  // ═══════════════════════════════════════════════════════════════════════════
  aides: {

    // ── 9a. ACRE ─────────────────────────────────────────────────────────────
    /** ACRE active en 2026 — mais profondément réformée */
    CFG_ACRE_ACTIVE: true,

    /**
     * Taux de réduction des cotisations sociales ACRE en micro-entreprise.
     * Décret n° 2026-69 du 06/02/2026 — deux périodes distinctes.
     */
    CFG_TAUX_REDUCTION_ACRE_MICRO: {
      avant_01_07_2026: 0.50,
      apres_01_07_2026: 0.25,
      detail_taux_avec_acre: {
        avant_01_07_2026: {
          vente: 0.062,
          services_bic: 0.106,
          bnc_ssi: 0.128,
          bnc_cipav: null,
        },
        apres_01_07_2026: {
          vente: 0.093,
          services_bic: 0.159,
          bnc_ssi: 0.192,
          bnc_cipav: 0.174,
        },
      },
      note:
        "Fin de l'attribution automatique — demande obligatoire sous 60 jours de début d'activité. " +
        "Publics éligibles restreints vs régime antérieur.",
    },

    /**
     * Taux de réduction ACRE hors micro (EI réel, EURL, SASU).
     * Décret n° 2026-69 du 06/02/2026.
     *
     * Formule de dégressivité :
     *   Si revenu ≤ 75 % PASS (36 045 €) → taux_max
     *   Si revenu entre 75 % et 100 % PASS → dégressif (taux_max → 0)
     *   Si revenu > PASS → 0
     */
    CFG_TAUX_REDUCTION_ACRE_HORS_MICRO: {
      taux_max_avant_01_07_2026: 0.50,
      taux_max_apres_01_07_2026: 0.25,
      seuil_exoneration_totale: PASS_2026 * 0.75,
      seuil_sortie_exoneration: PASS_2026,
      formule_degressivite: {
        condition: "revenu entre 75 % et 100 % PASS",
        formule:
          "exoneration = taux_max × (PASS − revenu) / (PASS × 0.25)",
        note: "Décret n° 2026-69 — formule de dégressivité linéaire entre 36 045 € et 48 060 €",
      },
      cotisations_exonerees: [
        "Assurance maladie-maternité",
        "Vieillesse de base",
        "Invalidité-décès",
        "Allocations familiales",
      ],
      cotisations_non_exonerees: [
        "CSG-CRDS",
        "Retraite complémentaire",
        "Formation professionnelle (CFP)",
      ],
    },

    /**
     * Durée d'application de l'ACRE.
     */
    CFG_DUREE_ACRE: {
      hors_micro: {
        duree_mois: 12,
        reference: "12 mois consécutifs à compter de la date de début d'activité",
      },
      micro: {
        reference: "Jusqu'à la fin du 3e trimestre civil suivant le début d'activité",
        note: "Durée variable selon la date de création (min 9 mois, max 12 mois environ)",
      },
    },

    /**
     * Mode de calcul de l'ACRE — abattement sur assiette ou réduction directe.
     */
    CFG_ACRE_MODE_CALCUL: {
      independants_ei_societes: {
        mecanisme: "Abattement sur assiette ou réduction directe de cotisations",
        note: "Selon la déclaration URSSAF — l'URSSAF applique le mécanisme adapté",
      },
      micro_entrepreneurs: {
        mecanisme: "Réduction de taux : cotisations × (1 − taux_reduction_ACRE)",
        exemple:
          "BIC services : taux normal 21,2 % × (1 − 0,25) = 15,9 % après 01/07/2026",
      },
    },


    // ── 9b. ARCE ─────────────────────────────────────────────────────────────
    /** ARCE active en 2026 */
    CFG_ARCE_ACTIVE: true,

    /**
     * Taux ARCE — fraction des droits ARE restants versés en capital.
     * Inchangé en 2026.
     */
    CFG_TAUX_ARCE: 0.60,

    /**
     * Modalités de versement ARCE.
     * Pré-requis : bénéficier de l'ACRE.
     * Non cumulable avec le maintien des allocations chômage mensuelles.
     */
    CFG_MODALITES_VERSEMENT_ARCE: {
      nombre_versements: 2,
      premier_versement: {
        moment: "À la date de début d'activité",
        fraction: 0.50,
      },
      second_versement: {
      moment: "6 mois après le début d'activité",
        fraction: 0.50,
        condition: "Activité maintenue et pas de CDI temps plein",
      },
      droits_conserves_en_cas_echec: {
        fraction: 0.40,
        note: "40 % des droits initiaux conservés si réinscription après échec",
      },
    },

    /**
     * Règle d'impact de l'ARCE dans la comparaison des scénarios.
     * L'ARCE est un flux de trésorerie non récurrent — elle ne doit JAMAIS figurer
     * dans NET_APRES_IR_RECURRENT mais dans AIDE_ARCE_TRESORERIE.
     */
    CFG_ARCE_IMPACT_COMPARAISON: {
      inclure_dans_net_recurrent: false,
      variable_cible: "AIDE_ARCE_TRESORERIE",
      annualiser_pour_comparaison: true,
      note:
        "L'ARCE améliore la trésorerie initiale, pas la rentabilité structurelle. " +
        "À présenter séparément dans le tableau comparatif.",
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 10. ZONES — ZFRR / QPV / ZFU
  // LF 2026 art. 42 — suppression ZFU-TE, création régime QPV.
  // ═══════════════════════════════════════════════════════════════════════════
  zones: {

    // ── 10a. ZFRR ────────────────────────────────────────────────────────────
    /** ZFRR active — prolongée jusqu'au 31/12/2029 par LF 2026 */
    CFG_ZFRR_ACTIVE: true,

    /**
     * Durée de la phase d'exonération totale ZFRR (années 1 à 5)
     * Applicable aux créations/reprises du 01/07/2024 au 31/12/2029.
     */
    CFG_ZFRR_DUREE_EXONERATION_TOTALE: {
      debut: "Date d'implantation en zone",
      annees: 5,
      taux: 1.0,
    },

    /**
     * Durée de la phase d'exonération partielle ZFRR (années 6 à 8)
     */
    CFG_ZFRR_DUREE_EXONERATION_PARTIELLE: {
      annees: 3,
      note: "Dégressivité sur les années 6, 7 et 8",
    },

    /**
     * Taux d'exonération par phase ZFRR.
     * Source : LF 2026 art. 44 quindecies du CGI.
     */
    CFG_ZFRR_TAUX_PHASES: [
      { annee: 1, taux: 1.00 },
      { annee: 2, taux: 1.00 },
      { annee: 3, taux: 1.00 },
      { annee: 4, taux: 1.00 },
      { annee: 5, taux: 1.00 },
      { annee: 6, taux: 0.75 },
      { annee: 7, taux: 0.50 },
      { annee: 8, taux: 0.25 },
    ] as PhaseExoneration[],

    /**
     * Types d'entreprises éligibles à la ZFRR.
     */
    CFG_ZFRR_TYPES_ENTREPRISES_ELIGIBLES: {
      activites: [
        "Industrielle",
        "Commerciale",
        "Artisanale",
        "Libérale",
      ],
      condition_taille_standard: "< 11 salariés (socle ZFRR)",
      condition_taille_zfrr_plus: "PME européenne (< 250 salariés, CA < 50 M€ ou bilan < 43 M€)",
      conditions_localisation: [
        "Direction effective et activité principale en zone ZFRR",
        "CA réalisé hors zone ≤ 25 %",
      ],
      regime_micro: "EXCLU — régime réel obligatoire",
      plafond_minimis: "300 000 € sur 3 exercices glissants",
    },

    /**
     * Impôts ciblés par l'exonération ZFRR.
     * Plafond IR/IS : 50 000 € de bénéfice exonéré par an.
     */
    CFG_ZFRR_IMPOTS_CIBLES: {
      impots: [
        "Impôt sur les bénéfices (IR ou IS)",
        "Contribution Foncière des Entreprises (CFE)",
        "Taxe Foncière sur les Propriétés Bâties (TFPB — sur délibération locale)",
      ],
      plafond_benefice_exonere_par_an: 50_000,
      cvae: "Exonération CVAE supprimée (CVAE elle-même supprimée en 2024)",
    },

    /**
     * Cotisations sociales ciblées par l'exonération ZFRR / ZFRR+ (booster B02).
     * Applicable sur les embauches pour les entreprises < 11 salariés.
     */
    CFG_ZFRR_COTISATIONS_CIBLEES: {
      cotisations_exonerees: [
        "Assurance maladie-maternité-invalidité-décès (patronale)",
        "Assurance vieillesse plafonnée et déplafonnée (patronale)",
        "Allocations familiales (patronale)",
      ],
      cotisations_non_exonerees: [
        "Assurance chômage",
        "Retraite complémentaire (AGIRC-ARRCO)",
        "Accidents du travail",
        "FNAL",
        "Contribution au dialogue social",
        "Versement mobilité",
        "Cotisations salariales",
        "CSG-CRDS",
      ],
      condition_embauche: "Du 1er au 50e salarié",
      duree: "12 mois à compter de la date d'embauche",
      seuil_exoneration_totale: "Rémunération horaire ≤ 150 % SMIC",
      seuil_fin_exoneration: "Rémunération horaire = 240 % SMIC",
      formule_degressive: {
        formule: "T ÷ 0,9 × (2,4 × ((SMIC × 1,5 × nb_heures) ÷ remuneration_brute_mensuelle) - 1,5)",
        T: 0.2102,
        note: "T = 21,02 % = somme taux patronaux assurances sociales + allocations familiales",
        arrondi: "3 décimales au millième le plus proche — coefficient plafonné à T",
      },
      non_cumul: [
        "Aide de l'État à l'emploi",
        "Autre exonération totale ou partielle de cotisations patronales SS",
        "Assiette ou montant forfaitaire de cotisations",
        "Application de taux spécifiques",
      ],
      cumul_autorise: [
        "Réduction taux patronal assurance maladie",
        "Réduction taux patronal allocations familiales",
        "Déduction forfaitaire heures supplémentaires (TEPA)",
      ],
      ctp_dsn: "CTP 099 (ZFRR depuis 01/07/2024) / CTP 513 (ZRR maintenue)",
      condition_maintien_effectif: "Maintien de l'effectif pendant 12 mois après embauche",
      remboursement_si_delocalisation: "Remboursement total si délocalisation hors zone dans les 5 ans",
      source: "urssaf.fr mis à jour 11/03/2026",
    },


    // ── 10b. QPV ─────────────────────────────────────────────────────────────
    /**
     * Régime QPV — nouveau dispositif créé par LF 2026 art. 42.
     * Art. 44 octies B du CGI — remplace les ZFU-TE pour les nouvelles installations.
     */
    CFG_QPV_ACTIVE: true,

    /**
     * Conditions de taille pour l'éligibilité au régime QPV.
     */
    CFG_QPV_CONDITIONS_EFFECTIF: {
      salaries_max: 50,
      note: "Condition cumulée avec les conditions de CA/bilan",
    },

    /**
     * Conditions de CA et bilan pour l'éligibilité QPV.
     */
    CFG_QPV_CONDITIONS_CA_BILAN: {
      ca_ou_bilan_max: 10_000_000,
      note: "Condition alternative : CA < 10 M€ OU bilan < 10 M€",
    },

    /**
     * Durée et phases de l'exonération QPV.
     * Créations/reprises du 01/01/2026 au 31/12/2030.
     */
    CFG_QPV_DUREE_ET_PHASES: [
      { annee: 1, taux: 1.00 },
      { annee: 2, taux: 1.00 },
      { annee: 3, taux: 1.00 },
      { annee: 4, taux: 1.00 },
      { annee: 5, taux: 1.00 },
      { annee: 6, taux: 0.60 },
      { annee: 7, taux: 0.40 },
      { annee: 8, taux: 0.20 },
    ] as PhaseExoneration[],

    /**
     * Règle de proratisation du CA réalisé en zone QPV.
     */
    CFG_QPV_PORTION_CA_EN_ZONE: {
      activites_sedentaires: {
        proratisation: "Exonération sur la totalité si établissement en QPV",
      },
      activites_non_sedentaires: {
        seuil_eligibilite: 0.25,
        formule: "exoneration = benefice × (CA_en_zone / CA_total)",
        note: "Éligibilité seulement si ≥ 25 % du CA réalisé en zone QPV",
      },
    },


    // ── 10c. ZFU ─────────────────────────────────────────────────────────────
    /**
     * ZFU-TE — supprimées pour les nouvelles entrées par LF 2026 art. 42.
     */
    CFG_ZFU_NOUVELLES_ENTREES_AUTORISEES: false,

    /**
     * Règles pour le stock de droits ZFU antérieurs.
     * Entreprises installées avant le 31/12/2025 : maintien jusqu'au terme.
     */
    CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS: {
      maintien_droits_acquis: true,
      condition: "Entreprise installée en ZFU avant le 31/12/2025",
      duree_residuelle: "Jusqu'au terme du régime acquis (5 ans + 3 ans dégressif 60/40/20 %)",
      phases_degressivite: [
        { annee_relative: 6, taux: 0.60 },
        { annee_relative: 7, taux: 0.40 },
        { annee_relative: 8, taux: 0.20 },
      ],
      nouvelles_exonerations_au_01_01_2026: false,
    },

    /**
     * Règles de non-cumul entre exonérations de zones.
     * Un seul régime de zone peut s'appliquer simultanément.
     */
    CFG_NON_CUMUL_EXONERATIONS_ZONE: {
      principe: "Un seul régime d'exonération de zone applicable simultanément",
      regimes_incompatibles: ["ZFRR", "QPV", "ZFU_stock", "JEI", "BER", "BUD", "ZRD"],
      delai_option: "6 mois à compter du début d'activité",
      irrevocabilite: true,
      arbitrage:
        "En cas de double éligibilité ZFRR/QPV, calculer les deux et présenter l'écart à l'utilisateur",
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 11. IR / IS — BARÈMES ET RÈGLES D'IMPOSITION 2026
  // LF 2026 — revalorisation barème IR +0,9 %.
  // ═══════════════════════════════════════════════════════════════════════════
  fiscal: {

    /**
     * Barème progressif IR 2026 — revenus 2025 imposés en 2026.
     * Revalorisation +0,9 % vs barème 2025.
     * Tranches exprimées par part fiscale (quotient familial).
     */
    CFG_BAREME_IR_TRANCHES: [
      { de: 0,       a: 11_600,  taux: 0.00 },
      { de: 11_601,  a: 29_579,  taux: 0.11 },
      { de: 29_580,  a: 84_577,  taux: 0.30 },
      { de: 84_578,  a: 181_917, taux: 0.41 },
      { de: 181_918, a: null,    taux: 0.45 },
    ] as TrancheIR[],

    /** Taux marginaux correspondant aux tranches (dans le même ordre) */
    CFG_BAREME_IR_TAUX: [0.00, 0.11, 0.30, 0.41, 0.45],

    /**
     * Décote IR 2026.
     * Réduit l'impôt brut des contribuables modestes.
     *
     * Formule :
     *   Si célibataire : décote = 897 − 0.4525 × impot_brut  (si impot_brut ≤ 1 984 €)
     *   Si couple      : décote = 1 483 − 0.4525 × impot_brut (si impot_brut ≤ 3 277 €)
     */
    CFG_DECOTE_IR: {
      forfait_celibataire: 897,
      forfait_couple: 1_483,
      seuil_celibataire: 1_984,
      seuil_couple: 3_277,
      taux: 0.4525,
      formule: "décote = forfait − taux × impot_brut (si impot_brut ≤ seuil)",
    },

    /**
     * Règle du quotient familial.
     */
    CFG_REGLE_QUOTIENT_FAMILIAL: {
      methode: "Diviser le revenu net imposable par le nombre de parts, appliquer le barème, multiplier par le nombre de parts",
      parts: {
        celibataire: 1,
        couple_marie_pacse: 2,
        enfant_1_et_2: 0.5,
        enfant_3_et_suivants: 1,
        parent_isole_1er_enfant: 1,
      },
      note: "Plafonnement de l'avantage par demi-part supplémentaire = CFG_PLAFOND_AVANTAGE_QF",
    },

    /**
     * Plafond de l'avantage fiscal lié au quotient familial 2026.
     * Par demi-part supplémentaire au-delà de la situation de référence.
     */
    CFG_PLAFOND_AVANTAGE_QF: {
      par_demi_part_droit_commun: 1_807,
      par_quart_de_part: 904,
      parent_isole_1ere_part_enfant: 4_262,
      personne_seule_enfant_eleve_5_ans: 1_079,
      veuf_avec_personne_a_charge: 5_625,
    },

    /**
     * Prélèvements sociaux sur revenus du capital — régime dual 2026.
     * LFSS 2026 : hausse CSG +1,4 pt créant une « contribution financière pour l'autonomie ».
     * Deux taux distincts selon la nature du revenu.
     */
    CFG_PRELEVEMENTS_SOCIAUX_CAPITAL: {
      taux_18_6_pct: {
        taux: 0.186,
        revenus_concernes: [
          "Dividendes",
          "Intérêts",
          "Plus-values mobilières",
          "Plus-values crypto",
          "Revenus BIC/BNC/BA non professionnels (hors PV immobilières)",
          "Revenus LMNP courants",
        ],
        detail: { csg: 0.106, crds: 0.005, solidarite: 0.075 },
      },
      taux_17_2_pct: {
        taux: 0.172,
        revenus_concernes: [
          "Revenus fonciers",
          "Plus-values immobilières",
          "Assurance-vie (certains compartiments)",
          "Épargne logement",
          "Plus-values professionnelles LT",
        ],
        detail: { csg: 0.092, crds: 0.005, solidarite: 0.075 },
      },
      csg_deductible_ir: 0.068,
      note:
        "La CSG déductible reste à 6,8 % dans les deux cas (option barème IR). " +
        "PFU 2026 : 12,8 % IR + 18,6 % PS = 31,4 % (sur dividendes/intérêts).",
    },

    /**
     * Taux IS réduit — PME éligibles (art. 219 I du CGI).
     * Conditions : CA ≤ 10 M€, capital libéré, 75 %+ personnes physiques.
     */
    CFG_TAUX_IS_REDUIT: 0.15,

    /** Taux IS normal */
    CFG_TAUX_IS_NORMAL: 0.25,

    /**
     * Seuil de bénéfice fiscal pour l'application du taux IS réduit (€).
     * Proratisé si exercice ≠ 12 mois : seuil × (nb_mois / 12).
     * L'amendement relevant ce seuil à 100 000 € n'a pas été retenu en LF 2026.
     */
    CFG_SEUIL_IS_REDUIT: 42_500,

    /**
     * Méthode de répartition de l'IR entre scénarios (méthode différentielle).
     * Garantit le respect de la progressivité et du quotient familial.
     */
    CFG_REGLES_REPARTITION_IR_SCENARIO: {
      methode: "Différentielle",
      formule:
        "IR_scenario = IR_foyer(avec_revenu_scenario) − IR_foyer(sans_revenu_scenario)",
      base_sans_scenario:
        "AUTRES_REVENUS_FOYER_IMPOSABLES − AUTRES_CHARGES_DEDUCTIBLES_FOYER",
      fiabilite:
        "Estimation si données foyer incomplètes — toujours qualifier le niveau de fiabilité",
    },

    /**
     * Règles d'affectation de l'impôt foyer au scénario simulé.
     */
    CFG_REGLES_AFFECTATION_IMPOT_FOYER_AU_SCENARIO: {
      methode_retenue: "Différentielle (voir CFG_REGLES_REPARTITION_IR_SCENARIO)",
      prelevements_sociaux:
        "Calculés directement sur les revenus du scénario (pas de mutualisation foyer)",
      note:
        "La méthode différentielle est sensible à la qualité des données foyer. " +
        "Vigilance particulière pour les foyers avec revenus fonciers, capitaux ou PEA importants.",
    },

    /**
     * Contribution Différentielle Hauts Revenus (CDHR) — reconduite en 2026.
     * Taux minimum effectif d'imposition de 20 % pour les contribuables les plus aisés.
     */
    CFG_CDHR: {
      active: true,
      taux_minimum_effectif: 0.20,
      note: "CDHR reconduite par LF 2026 — s'applique si le taux effectif IR est < 20 %",
    },

    /**
     * Plafond Madelin — déduction complémentaire santé pour TNS.
     */
    CFG_PLAFOND_MADELIN_SANTE: {
      formule:
        "min(3,75 % × bénéfice_imposable + 7 % × PASS, 3 % × 8 × PASS)",
      taux_benefice: 0.0375,
      taux_pass_addition: 0.07,
      taux_pass_addition_valeur_2026: PASS_2026 * 0.07,
      plafond_absolu_taux_8pass: 0.03,
      plafond_absolu_valeur_2026: PASS_2026 * 8 * 0.03,
      note:
        "Le Groupe I (garanties de base contrat responsable) est intégralement déductible. " +
        "Les garanties surcomplémentaires facultatives (Groupe II) ne le sont généralement pas.",
    },

    /**
     * Pondérations du score global de comparaison.
     * Paramétrage non réglementaire mais centralisé ici pour éviter tout coefficient
     * métier dispersé dans le code moteur.
     */
    CFG_POIDS_SCORE_GLOBAL: {
      par_defaut: {
        w_net: 0.5,
        w_complexite: 0.2,
        w_dependance: 0.2,
        w_robustesse: 0.1,
      },
      flux_mensuel: {
        w_net: 0.3,
        w_complexite: 0.3,
        w_dependance: 0.3,
        w_robustesse: 0.1,
      },
      capitalisation: {
        w_net: 0.6,
        w_complexite: 0.1,
        w_dependance: 0.2,
        w_robustesse: 0.1,
      },
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // 12. TEMPORALITÉ ET OPTIONS FISCALES
  // ═══════════════════════════════════════════════════════════════════════════
  temporalite: {
    /**
     * Nombre maximum d'exercices pour l'option IR temporaire d'une société (EURL/SASU).
     * Art. 239 bis AB du CGI.
     * Conditions : société < 5 ans, < 50 salariés, CA ou bilan < 10 M€,
     * capital 50 %+ personnes physiques dont 34 % dirigeants.
     * Notification dans les 3 premiers mois du 1er exercice.
     */
    CFG_DUREE_OPTION_IR_TEMPORAIRE_SOCIETE: {
      nb_exercices_max: 5,
      conditions: [
        "Société < 5 ans à la date d'option",
        "< 50 salariés",
        "CA ou bilan < 10 M€",
        "Capital 50 %+ détenu par personnes physiques",
        "34 %+ par dirigeants",
      ],
      notification: "Dans les 3 premiers mois du 1er exercice d'application",
      irrevocable_apres: "5e exercice écoulé — renonciation possible avant",
    },

    /**
     * Date limite pour l'option IS d'une EI (assimilation fiscale à l'EURL).
     * Option irrévocable une fois le délai de renonciation de 5 ans écoulé.
     */
    CFG_DATE_LIMITE_OPTION_IS_EI: {
      date_limite: "Avant la fin du 3e mois de l'exercice (ex : 31 mars pour exercice calendaire)",
      revocabilite: "Renonciation possible avant la fin du 2e mois de l'exercice concerné",
      irrevocabilite: "Définitive après 5 exercices",
      note: "L'option IS pour une EI crée une assimilation fiscale à l'EURL (IS irrévocable au-delà).",
    },

    /**
     * Date limite pour opter au VFL (Versement Forfaitaire Libératoire).
     */
    CFG_DATE_LIMITE_OPTION_VFL: {
      regime_general: "30 septembre N-1 pour effet au 1er janvier N",
      regime_creation: "Dans les 3 mois suivant la date d'immatriculation",
      note: "L'option s'exerce auprès de l'URSSAF (formulaire en ligne ou courrier)",
    },

    /**
     * Dates limites générales pour les options fiscales annuelles.
     */
    CFG_DATE_LIMITE_OPTIONS_FISCALES: {
      regime_reel: {
        creation: "Lors de la création (formulaire P0 / M0)",
        exercice_en_cours: "Avant le 2e jour ouvré suivant le 1er mai (exercice calendaire)",
      },
      note: "Les options prises en cours d'exercice ne sont valables que pour l'exercice suivant en règle générale",
    },

    /**
     * Règles de prorata temporis pour les exercices incomplets.
     * Applicable en cas de création en cours d'année ou de changement de régime.
     */
    CFG_PRORATA_TEMPORIS: {
      actif: true,
      formule: "CA_annualise = CA_effectif × (12 / nb_mois_exercice)",
      methode_mois_incomplets: "Chaque mois incomplet compté en jours : jours_activite / 30",
      applications: [
        "Seuils micro (comparaison annualisée)",
        "Seuil IS réduit : 42 500 × (nb_mois / 12)",
        "Franchise TVA (comparaison annualisée pour vérifier le seuil)",
        "Plafond bénéfice exonéré ZFRR (50 000 × nb_mois / 12)",
      ],
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // COMPTABILITÉ — SEUILS DE GESTION COMPTABLE
  // ═══════════════════════════════════════════════════════════════════════════
  comptabilite: {
    /**
     * Seuil d'immobilisation du matériel de bureau (€)
     * Source : CGI art. 39-1-2° — seuil pratique d'immobilisation du petit matériel.
     * En dessous de ce seuil, le matériel peut être passé en charge immédiate.
     * Note : peut être abaissé à 0 sur option. Seuil par défaut pratique.
     */
    CFG_SEUIL_IMMOBILISATION_MATERIEL_MIN: 500,
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // PENDING — Aucun paramètre en attente.
  //
  // Tous les paramètres requis par l'algorithme ont été renseignés dans les
  // versions v1 à v3 de ce fichier. Le bloc est conservé pour compatibilité
  // structurelle et pour accueillir d'éventuelles mises à jour en cours d'année.
  //
  // Historique des sorties du PENDING :
  //   v1 → Barèmes IR, IS, seuils micro, taux VFL, abattements, ARCE, ACRE base,
  //         ZFRR/QPV structure, PUMa, dividendes TNS/assimilé, LMNP/LMP.
  //   v2 → CIPAV (11%/21%), CARMF retraite complémentaire (11,80%), AGIRC-ARRCO,
  //         seuils art. 151 septies LMP (90k/126k), ZFRR formule T=21,02%,
  //         barème maladie PAMC unifié post-réforme ASU.
  //   v3 → RSPM zone mixte (3 tranches : 13,5% / 21,2% / bascule PAMC),
  //         CARCDSF (forfait RC 3 210,60€ + 11,35%), CARPIMKO complet.
  //   v4 → Cotisations minimales TNS SSI par branche (total ~1 135 €).
  // ═══════════════════════════════════════════════════════════════════════════
  PENDING: {
    _NOTE:
      "Aucun paramètre en attente. Ce bloc doit rester vide en production. " +
      "Si un nouveau paramètre est requis par le moteur, l'ajouter ici avec le préfixe PENDING_ " +
      "avant de le renseigner et de le déplacer dans la section appropriée.",
  },

} as const;


// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export type FiscalParams2026 = typeof FISCAL_PARAMS_2026;
