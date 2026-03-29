/**
 * fiscal_params_2026.ts
 * Constantes Fiscales et Sociales — Exercice 2026
 *
 * ⚠️  RÈGLE ABSOLUE : Aucune valeur numérique ne doit figurer dans le code métier.
 *     Toute constante réglementaire est définie ici et importée par les modules du moteur.
 *
 * Statut des valeurs :
 *   - Valeur numérique ou texte   → chiffre connu, issu du PLF/LFSS 2026
 *   - TODO_A_CONFIRMER            → variable requise par l'algorithme, valeur à valider
 *                                   avec un expert métier ou juridique avant mise en prod
 *
 * Sources : PLF 2026, LFSS 2026, Urssaf, CPAM, BOFiP.
 * Versionner ce fichier par année fiscale : fiscal_params_YYYY.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES INTERNES
// ─────────────────────────────────────────────────────────────────────────────

export type TrancheIR = {
  de: number;       // borne inférieure incluse (en €)
  a: number | null; // borne supérieure incluse (null = pas de plafond)
  taux: number;     // taux marginal (ex : 0.11 pour 11 %)
};

export type PhaseExoneration = {
  annee: number;   // numéro d'année d'exonération (1, 2, 3…)
  taux: number;    // taux d'exonération applicable (ex : 1.0 pour 100 %)
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTE PIVOT : PASS 2026
// Utilisée comme référence dans plusieurs formules — centralisée ici.
// ─────────────────────────────────────────────────────────────────────────────

const PASS_2026 = 48_060;

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export const FISCAL_PARAMS_2026 = {

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. MICRO-ENTREPRISE — SEUILS DE CHIFFRE D'AFFAIRES
  // ═══════════════════════════════════════════════════════════════════════════
  micro: {
    /** Seuil CA micro-BIC achat/revente (€) */
    CFG_SEUIL_CA_MICRO_BIC_VENTE: 203_100,

    /** Seuil CA micro-BIC prestation de service (€) */
    CFG_SEUIL_CA_MICRO_BIC_SERVICE: 83_600,

    /** Seuil CA micro-BNC libéral (€) */
    CFG_SEUIL_CA_MICRO_BNC: 83_600,

    /** Seuil CA micro-BIC LMNP location meublée classique (€) */
    CFG_SEUIL_CA_MICRO_LMNP_CLASSIQUE: 83_600,

    /** Seuil CA micro-BIC meublé tourisme classé (€) */
    CFG_SEUIL_CA_MICRO_MEUBLE_TOURISME_CLASSE: 83_600,

    /** Seuil CA micro-BIC meublé tourisme non classé (€) — loi de finances 2024 */
    CFG_SEUIL_CA_MICRO_MEUBLE_TOURISME_NON_CLASSE: 15_000,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. TVA — FRANCHISE ET SEUILS DE TOLÉRANCE
  // ═══════════════════════════════════════════════════════════════════════════
  tva: {
    /** Seuil de franchise TVA BIC achat/revente (€) */
    CFG_SEUIL_TVA_FRANCHISE_BIC_VENTE: 85_000,

    /** Seuil de franchise TVA BIC service (€) */
    CFG_SEUIL_TVA_FRANCHISE_BIC_SERVICE: 37_500,

    /** Seuil de franchise TVA BNC (€) */
    CFG_SEUIL_TVA_FRANCHISE_BNC: 37_500,

    /** Seuil majoré (tolérance) BIC achat/revente (€) */
    CFG_SEUIL_TVA_TOLERANCE_BIC_VENTE: 93_500,

    /** Seuil majoré (tolérance) BIC service (€) */
    CFG_SEUIL_TVA_TOLERANCE_BIC_SERVICE: 41_250,

    /** Seuil majoré (tolérance) BNC (€) */
    CFG_SEUIL_TVA_TOLERANCE_BNC: 41_250,

    /**
     * Règle de sortie immédiate de la franchise TVA.
     * Applicable dès le 1er jour du mois de dépassement du seuil majoré.
     */
    CFG_REGLE_SORTIE_IMMEDIATE_TVA:
      "Assujettissement au 1er jour du mois civil de dépassement du seuil majoré",

    /**
     * Règle de sortie de la franchise TVA l'année suivante.
     * Si le CA dépasse le seuil de base mais reste sous le seuil majoré deux années
     * consécutives, assujettissement au 1er janvier de l'année suivante.
     */
    CFG_REGLE_SORTIE_TVA_ANNEE_SUIVANTE:
      "Assujettissement au 1er janvier N+1 si CA entre seuil de base et seuil majoré pendant 2 années consécutives",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. VERSEMENT FISCAL LIBÉRATOIRE (VFL)
  // ═══════════════════════════════════════════════════════════════════════════
  vfl: {
    /** Seuil de RFR par part fiscale N-2 pour éligibilité au VFL (€) */
    CFG_SEUIL_RFR_VFL_PAR_PART: 27_478,

    /**
     * Formule de calcul du seuil RFR total éligible au VFL.
     * @param nbParts - Nombre de parts fiscales du foyer
     * @returns Seuil de RFR total au-delà duquel le VFL est interdit
     */
    CFG_FORMULE_SEUIL_RFR_VFL: (nbParts: number): number => 27_478 * nbParts,

    /** Taux VFL micro-BIC achat/revente (fraction du CA HT) */
    CFG_TAUX_VFL_MICRO_BIC_VENTE: 0.01,

    /** Taux VFL micro-BIC prestation de service (fraction du CA HT) */
    CFG_TAUX_VFL_MICRO_BIC_SERVICE: 0.017,

    /** Taux VFL micro-BNC (fraction du CA HT) */
    CFG_TAUX_VFL_MICRO_BNC: 0.022,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ABATTEMENTS FORFAITAIRES MICRO
  // ═══════════════════════════════════════════════════════════════════════════
  abattements: {
    /** Abattement forfaitaire micro-BIC achat/revente (71 %) */
    CFG_ABATTEMENT_MICRO_BIC_VENTE: 0.71,

    /** Abattement forfaitaire micro-BIC prestation de service (50 %) */
    CFG_ABATTEMENT_MICRO_BIC_SERVICE: 0.50,

    /** Abattement forfaitaire micro-BNC (34 %) */
    CFG_ABATTEMENT_MICRO_BNC: 0.34,

    /** Abattement forfaitaire LMNP micro-BIC classique (50 %) */
    CFG_ABATTEMENT_MICRO_LMNP_CLASSIQUE: 0.50,

    /** Abattement forfaitaire meublé tourisme classé (50 %) */
    CFG_ABATTEMENT_MICRO_MEUBLE_TOURISME_CLASSE: 0.50,

    /** Abattement forfaitaire meublé tourisme non classé (30 %) — loi de finances 2024 */
    CFG_ABATTEMENT_MICRO_MEUBLE_TOURISME_NON_CLASSE: 0.30,

    /** Montant minimum d'abattement micro (€) — plancher absolu */
    CFG_MINIMUM_ABATTEMENT_MICRO: 305,

    /** Abattement forfaitaire pour frais TS artiste-auteur (10 %) */
    CFG_ABATTEMENT_TS_FORFAITAIRE_ARTISTE_AUTEUR: 0.10,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SOCIAL — TAUX DE COTISATIONS MICRO / TNS / ASSIMILÉ-SALARIÉ
  // ═══════════════════════════════════════════════════════════════════════════
  social: {
    /** Taux global de cotisations sociales micro-BIC achat/revente */
    CFG_TAUX_SOCIAL_MICRO_BIC_VENTE: 0.123,

    /** Taux global de cotisations sociales micro-BIC prestation de service */
    CFG_TAUX_SOCIAL_MICRO_BIC_SERVICE: 0.212,

    /** Taux global de cotisations sociales micro-BNC (post juillet 2026) */
    CFG_TAUX_SOCIAL_MICRO_BNC: 0.261,

    /** Taux global cotisations sociales RSPM (remplaçants médicaux) — estimation PAMC */
    CFG_TAUX_SOCIAL_RSPM: 0.133,

    /**
     * Taux et règles de cotisations TNS en régime réel BIC (EI/EURL).
     * Le taux n'est pas unique : il dépend de l'assiette par planche PASS.
     * Se référer à CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR et aux barèmes Urssaf.
     * TODO_A_CONFIRMER : structurer par tranche PASS dès que les barèmes 2026 sont publiés.
     */
    CFG_TAUX_SOCIAL_TNS_BIC: "TODO_A_CONFIRMER — voir barèmes Urssaf TNS BIC 2026 par tranche PASS",

    /**
     * Taux et règles de cotisations TNS en régime réel BNC (EI/EURL).
     * TODO_A_CONFIRMER : structurer par tranche PASS dès que les barèmes 2026 sont publiés.
     */
    CFG_TAUX_SOCIAL_TNS_BNC: "TODO_A_CONFIRMER — voir barèmes Urssaf TNS BNC 2026 par tranche PASS",

    /**
     * Taux de cotisations assimilé-salarié (président SASU/SELAS).
     * TODO_A_CONFIRMER : taux patronal + salarial 2026 (environ 75–82 % du brut selon structure).
     */
    CFG_TAUX_SOCIAL_ASSIMILE_SALARIE: "TODO_A_CONFIRMER — taux assimilé-salarié 2026 (patronal + salarial)",

    /**
     * Règles de calcul de l'Assiette Sociale Unique pour EI en régime réel IR (2026).
     * Dispositif issu de la loi PLFSS 2023, pleinement en vigueur.
     */
    CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR: {
      /** Abattement sur le bénéfice fiscal pour obtenir l'assiette sociale */
      abattement: 0.26,
      /** Plancher de cotisation exprimé en fraction du PASS */
      plancher_pass: 0.0176,
      /** Plafond de l'assiette exprimé en fraction du PASS */
      plafond_pass: 1.30,
    },

    /**
     * Règles d'assujettissement des dividendes aux cotisations sociales TNS.
     * La fraction des dividendes dépassant 10 % du capital social (+ comptes courants)
     * est réintégrée dans l'assiette des cotisations TNS.
     */
    CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_TNS: {
      seuil_franchise: "10 % du capital social + primes d'émission + comptes courants d'associés",
      fraction_soumise: "Dividendes - seuil_franchise si positif",
      note: "Applicable gérants majoritaires EURL/SARL/SELARL — Art. L. 131-6 CSS",
    },

    /**
     * Règles d'assujettissement des dividendes aux cotisations sociales assimilé-salarié.
     * Pour les présidents de SASU/SELAS, les dividendes ne sont pas soumis aux cotisations
     * sociales (assujettis uniquement aux prélèvements sociaux 17,2 %).
     * TODO_A_CONFIRMER : vérifier l'absence d'évolution législative 2026.
     */
    CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_ASSIMILE: {
      soumis_cotisations: false,
      soumis_prelevements_sociaux: true,
      taux_prelevements_sociaux: 0.172,
      note: "TODO_A_CONFIRMER — confirmer absence de réforme 2026 sur dividendes assimilé-salarié",
    },

    /**
     * Seuil de revenus d'activité en dessous duquel la cotisation PUMa peut s'appliquer.
     * Exprimé en fraction du PASS.
     */
    CFG_SEUIL_PUMA: PASS_2026 * 0.20,

    /**
     * Formule de calcul de la cotisation subsidiaire maladie (taxe PUMa / taxe rentier).
     * Taux appliqué sur la fraction des revenus du capital dépassant le seuil.
     * TODO_A_CONFIRMER : assiette exacte et taux 2026 (Art. L. 380-2 CSS).
     */
    CFG_FORMULE_TAXE_PUMA: {
      taux: 0.065,
      assiette: "Revenus du capital et de placement > CFG_SEUIL_PUMA",
      note: "TODO_A_CONFIRMER — assiette et conditions d'exonération 2026 à valider",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. SANTÉ — PROFESSIONS MÉDICALES ET PARAMÉDICALES
  // ═══════════════════════════════════════════════════════════════════════════
  sante: {
    /**
     * Taux maladie-maternité Secteur 1 (conventionné).
     * Quasi-nul grâce à la prise en charge CPAM (0,1 % résiduel indicatif).
     */
    CFG_TAUX_MALADIE_SECTEUR_1: 0.001,

    /**
     * Taux maladie Secteur 2 générique (avant distinction OPTAM/non-OPTAM).
     * TODO_A_CONFIRMER : confirmer s'il existe un taux commun ou si la distinction
     * OPTAM/non-OPTAM est systématique dès le premier euro.
     */
    CFG_TAUX_MALADIE_SECTEUR_2: "TODO_A_CONFIRMER — taux maladie secteur 2 générique 2026",

    /**
     * Taux maladie Secteur 2 adhérent OPTAM.
     * Bénéficie d'une aide CPAM partielle similaire au secteur 1.
     */
    CFG_TAUX_MALADIE_SECTEUR_2_OPTAM: 0.001,

    /** Taux maladie Secteur 2 non-OPTAM (taux plein) */
    CFG_TAUX_MALADIE_SECTEUR_2_NON_OPTAM: 0.065,

    /** Taux maladie Secteur 3 / hors convention (taux plein majoré) */
    CFG_TAUX_MALADIE_HORS_CONVENTION: 0.098,

    /**
     * Paramètres de l'aide CPAM sur la cotisation maladie (Secteur 1 et OPTAM).
     * La CPAM prend en charge une fraction de la cotisation d'assurance maladie.
     * TODO_A_CONFIRMER : montant exact de la prise en charge 2026 (% ou forfait).
     */
    CFG_PARAM_AIDE_CPAM_MALADIE: {
      description: "Prise en charge partielle cotisation maladie par la CPAM",
      taux_prise_en_charge_indicatif: 0.064,
      note: "TODO_A_CONFIRMER — valider le taux et l'assiette de prise en charge CPAM 2026",
    },

    /**
     * Paramètres de l'aide CPAM sur la cotisation retraite (Secteur 1 et OPTAM).
     * TODO_A_CONFIRMER : montant de la participation CPAM retraite 2026.
     */
    CFG_PARAM_AIDE_CPAM_RETRAITE: {
      description: "Participation CPAM sur cotisation retraite complémentaire ASV",
      note: "TODO_A_CONFIRMER — montant et conditions de la prise en charge retraite CPAM 2026",
    },

    /**
     * Déduction spécifique Groupe III (frais de représentation médicale).
     * Applicable en régime réel BNC Secteur 1.
     */
    CFG_PARAM_DEDUCTION_GROUPE_III: {
      taux_deduction_sur_benefice: 0.03,
      description: "3 % du bénéfice pour frais de représentation — Groupe III déclaration 2035",
    },

    /**
     * Déduction complémentaire santé (frais spécifiques professions médicales).
     * TODO_A_CONFIRMER : identifier les postes déductibles Groupes I/II non couverts
     * par le Groupe III et les paramétrer séparément.
     */
    CFG_PARAM_DEDUCTION_COMPLEMENTAIRE_SANTE: {
      description: "Déductions spécifiques Groupes I et II — déclaration 2035",
      note: "TODO_A_CONFIRMER — lister et paramétrer les déductions complémentaires 2026",
    },

    /**
     * Aide à l'installation en zone ZIP/ZAC (zone insuffisamment dotée en médecins).
     * Montant forfaitaire annuel versé par la CPAM.
     */
    CFG_PARAM_ZIP_ZAC_MONTANT_FORFAITAIRE: 5_000,

    /**
     * Règles relatives à l'Avantage Social Vieillesse (ASV) des médecins conventionnés.
     * La CPAM prend en charge les 2/3 de la cotisation forfaitaire ASV.
     */
    CFG_REGLES_ASV: {
      part_cpam: 2 / 3,
      part_praticien: 1 / 3,
      description: "Avantage Social Vieillesse — cotisation forfaitaire avec prise en charge CPAM 2/3",
    },

    /**
     * Régime PAMC — Praticiens et Auxiliaires Médicaux Conventionnés.
     * Régime spécifique de protection sociale distinct du régime général TNS.
     * TODO_A_CONFIRMER : paramètres PAMC 2026 (taux, assiettes, spécificités).
     */
    CFG_REGLES_PAMC: {
      description: "Régime Praticiens et Auxiliaires Médicaux Conventionnés",
      note: "TODO_A_CONFIRMER — paramètres PAMC 2026 à valider avec expert CPAM/Urssaf",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. ARTISTE-AUTEUR
  // ═══════════════════════════════════════════════════════════════════════════
  culture: {
    /** Seuil de franchise TVA artiste-auteur (€) */
    CFG_SEUIL_TVA_ARTISTE_AUTEUR: 48_000,

    /** Seuil majoré de tolérance TVA artiste-auteur (€) */
    CFG_SEUIL_TVA_TOLERANCE_ARTISTE_AUTEUR: 58_000,

    /**
     * Taux de cotisations sociales artiste-auteur (régime AGESSA / MDA).
     * TODO_A_CONFIRMER : taux 2026 maladie + vieillesse + CSG/CRDS artiste-auteur.
     */
    CFG_TAUX_COTISATIONS_ARTISTE_AUTEUR: {
      note: "TODO_A_CONFIRMER — taux de cotisations sociales artiste-auteur 2026 (AGESSA/MDA)",
    },

    /** Seuil de recettes à partir duquel l'affiliation RAAP est déclenchée (€) */
    CFG_SEUIL_RAAP: 10_692,

    /** Taux RAAP normal (cotisation retraite complémentaire artiste-auteur) */
    CFG_TAUX_RAAP_NORMAL: 0.08,

    /** Taux RAAP réduit (option sur demande sous conditions) */
    CFG_TAUX_RAAP_REDUIT: 0.04,

    /** Règle d'affiliation RAAP — seuil en heures SMIC */
    CFG_REGLE_AFFILIATION_RAAP: "Affiliation obligatoire dès 900 heures de SMIC horaire de recettes",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. IMMOBILIER — LMNP / LMP
  // ═══════════════════════════════════════════════════════════════════════════
  immobilier: {
    /** Seuil de recettes locatives meublées pour qualification LMP (€) */
    CFG_SEUIL_LMP_RECETTES: 23_000,

    /**
     * Condition de qualification LMP relative aux autres revenus d'activité.
     * Les recettes locatives meublées doivent dépasser les autres revenus d'activité du foyer.
     */
    CFG_FORMULE_CRITERE_LMP_PAR_RAPPORT_AUX_AUTRES_REVENUS:
      "Recettes locatives meublées > Autres revenus d'activité professionnelle du foyer fiscal",

    /** Taux moyen de cotisations sociales SSI pour LMP (estimation) */
    CFG_TAUX_SOCIAL_LMP_SSI: 0.35,

    /** Règles d'amortissement LMNP en régime réel */
    CFG_REGLES_AMORTISSEMENT_LMNP_REEL: {
      murs: "Amortissement linéaire sur 25 à 40 ans selon nature du bien",
      meubles: "Amortissement linéaire sur 5 à 10 ans",
      note: "L'amortissement ne peut pas créer ou aggraver un déficit imputable sur le revenu global",
    },

    /**
     * Règles de déductibilité des charges en LMNP réel.
     * TODO_A_CONFIRMER : liste exhaustive des charges déductibles 2026 (intérêts d'emprunt,
     * charges de copropriété, taxe foncière, frais de gestion, assurances…).
     */
    CFG_REGLES_DEDUCTIBILITE_CHARGES_LMNP: {
      note: "TODO_A_CONFIRMER — lister les charges déductibles LMNP réel 2026 (Art. 39 CGI adapté)",
    },

    /** Règles de plus-values pour LMNP — régime des particuliers */
    CFG_REGLES_PLUS_VALUES_LMNP: {
      ir: "Exonération totale après 22 ans de détention",
      prelevements_sociaux: "Exonération totale après 30 ans de détention",
      abattement_annuel_ir: "6 % / an de 5 à 21 ans, puis 4 % la 22e année",
      abattement_annuel_ps: "1.65 % / an de 5 à 21 ans, 1.60 % la 22e année, 9 % de 23 à 30 ans",
    },

    /** Règles de plus-values pour LMP — régime des professionnels */
    CFG_REGLES_PLUS_VALUES_LMP: {
      regime: "Art. 151 septies CGI — exonération sous conditions d'ancienneté et de recettes",
      exoneration_totale: "Recettes < seuil et activité exercée depuis plus de 5 ans",
      note: "TODO_A_CONFIRMER — seuils de recettes applicables 2026 Art. 151 septies",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. AIDES — ACRE / ARCE
  // ═══════════════════════════════════════════════════════════════════════════
  aides: {
    /** ACRE activée pour 2026 */
    CFG_ACRE_ACTIVE: true,

    /** Taux de réduction des cotisations sociales ACRE en micro-entreprise */
    CFG_TAUX_REDUCTION_ACRE_MICRO: 0.50,

    /**
     * Taux de réduction des cotisations sociales ACRE hors micro (TNS réel, EURL, SASU).
     * TODO_A_CONFIRMER : taux ACRE hors micro 2026 (variable selon tranche PASS).
     */
    CFG_TAUX_REDUCTION_ACRE_HORS_MICRO: {
      note: "TODO_A_CONFIRMER — taux ACRE hors micro par tranche PASS 2026",
    },

    /** Durée d'application de l'ACRE */
    CFG_DUREE_ACRE: "12 mois à compter de la date d'effet de l'aide",

    /**
     * Mode de calcul de l'ACRE — abattement ou exonération directe.
     * TODO_A_CONFIRMER : confirmer si l'ACRE 2026 s'applique en abattement sur l'assiette
     * ou en réduction directe sur le montant de cotisations.
     */
    CFG_ACRE_MODE_CALCUL: {
      note: "TODO_A_CONFIRMER — mécanisme exact d'application ACRE 2026 (abattement assiette vs réduction cotisations)",
    },

    /** ARCE activée pour 2026 */
    CFG_ARCE_ACTIVE: true,

    /** Taux ARCE — fraction des droits ARE restants versés en capital */
    CFG_TAUX_ARCE: 0.60,

    /** Modalités de versement ARCE */
    CFG_MODALITES_VERSEMENT_ARCE: "50 % à la date de création, 50 % après 6 mois d'activité",

    /**
     * Règle d'impact de l'ARCE dans la comparaison des scénarios.
     * L'ARCE est un flux de trésorerie non récurrent — elle ne doit jamais figurer
     * dans NET_APRES_IR_RECURRENT mais dans AIDE_ARCE_TRESORERIE.
     */
    CFG_ARCE_IMPACT_COMPARAISON: {
      inclure_dans_net_recurrent: false,
      variable_cible: "AIDE_ARCE_TRESORERIE",
      annualiser_pour_comparaison: true,
      note: "L'ARCE améliore la trésorerie initiale, pas la rentabilité structurelle",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. ZONES — ZFRR / QPV / ZFU
  // ═══════════════════════════════════════════════════════════════════════════
  zones: {
    /** ZFRR (Zones France Ruralité Revitalisation) activée pour 2026 */
    CFG_ZFRR_ACTIVE: true,

    /** Durée de la phase d'exonération totale ZFRR */
    CFG_ZFRR_DUREE_EXONERATION_TOTALE: "5 ans à compter de la date d'implantation",

    /** Durée de la phase d'exonération partielle ZFRR (dégressive) */
    CFG_ZFRR_DUREE_EXONERATION_PARTIELLE: "3 ans après la phase totale",

    /**
     * Taux d'exonération par phase ZFRR.
     * TODO_A_CONFIRMER : taux exacts de la dégressivité 2026 (décret d'application).
     */
    CFG_ZFRR_TAUX_PHASES: {
      phases: [
        { annee: 1, taux: 1.0 },
        { annee: 2, taux: 1.0 },
        { annee: 3, taux: 1.0 },
        { annee: 4, taux: 1.0 },
        { annee: 5, taux: 1.0 },
        { annee: 6, taux: "TODO_A_CONFIRMER" },
        { annee: 7, taux: "TODO_A_CONFIRMER" },
        { annee: 8, taux: "TODO_A_CONFIRMER" },
      ] as Array<{ annee: number; taux: number | string }>,
      note: "TODO_A_CONFIRMER — taux dégression années 6, 7, 8 ZFRR 2026",
    },

    /**
     * Types d'entreprises éligibles à la ZFRR.
     * TODO_A_CONFIRMER : critères exacts 2026 (effectif, CA, forme juridique).
     */
    CFG_ZFRR_TYPES_ENTREPRISES_ELIGIBLES: {
      note: "TODO_A_CONFIRMER — conditions d'éligibilité entreprises ZFRR 2026 (effectif, CA, forme)",
    },

    /**
     * Impôts ciblés par l'exonération ZFRR.
     * TODO_A_CONFIRMER : périmètre exact (IR sur bénéfices, IS, CFE, CVAE…).
     */
    CFG_ZFRR_IMPOTS_CIBLES: {
      note: "TODO_A_CONFIRMER — liste des impôts exonérés en ZFRR 2026 (IR/IS sur bénéfices, CFE…)",
    },

    /**
     * Cotisations sociales ciblées par l'exonération ZFRR+ (booster B02).
     * TODO_A_CONFIRMER : périmètre exact des cotisations exonérées en ZFRR+.
     */
    CFG_ZFRR_COTISATIONS_CIBLEES: {
      note: "TODO_A_CONFIRMER — cotisations exonérées en ZFRR+ 2026 (maladie, retraite, famille…)",
    },

    /** QPV (Quartiers Prioritaires de la Ville) activé pour 2026 */
    CFG_QPV_ACTIVE: true,

    /**
     * Conditions d'effectif pour éligibilité QPV.
     * TODO_A_CONFIRMER : seuil d'effectif 2026 (moins de 11 salariés ?).
     */
    CFG_QPV_CONDITIONS_EFFECTIF: {
      note: "TODO_A_CONFIRMER — seuil effectif éligibilité QPV 2026",
    },

    /**
     * Conditions de CA et de total bilan pour éligibilité QPV.
     * TODO_A_CONFIRMER : seuils CA et bilan 2026.
     */
    CFG_QPV_CONDITIONS_CA_BILAN: {
      note: "TODO_A_CONFIRMER — seuils CA et bilan éligibilité QPV 2026",
    },

    /**
     * Durée et phases de l'exonération QPV.
     * TODO_A_CONFIRMER : durée totale et dégressivité 2026.
     */
    CFG_QPV_DUREE_ET_PHASES: {
      note: "TODO_A_CONFIRMER — durée et taux de dégressivité QPV 2026",
    },

    /**
     * Règle de proratisation de l'aide QPV selon la fraction du CA réalisée en zone.
     * TODO_A_CONFIRMER : méthode de calcul de la fraction CA en zone QPV.
     */
    CFG_QPV_PORTION_CA_EN_ZONE: {
      note: "TODO_A_CONFIRMER — méthode de proratisation du CA réalisé en zone QPV 2026",
    },

    /**
     * ZFU — nouvelles entrées pour 2026.
     * Le dispositif ZFU est fermé aux nouvelles entrées depuis 2014.
     */
    CFG_ZFU_NOUVELLES_ENTREES_AUTORISEES: false,

    /**
     * Règles pour le stock de droits ZFU antérieurs (entreprises entrées avant la fermeture).
     * TODO_A_CONFIRMER : conditions de maintien et de sortie progressive des droits acquis.
     */
    CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS: {
      note: "TODO_A_CONFIRMER — conditions de maintien des droits ZFU acquis avant fermeture du dispositif",
    },

    /**
     * Règle de non-cumul entre exonérations de zones différentes.
     * Un contribuable implanté dans plusieurs zones doit opter pour une seule exonération.
     */
    CFG_NON_CUMUL_EXONERATIONS_ZONE: {
      principe: "Un seul régime d'exonération de zone peut s'appliquer simultanément",
      arbitrage: "L'option la plus favorable est retenue après calcul comparatif explicite",
      note: "TODO_A_CONFIRMER — vérifier règles de non-cumul ZFRR / QPV / ZFU 2026",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. IR / IS — BARÈMES ET RÈGLES D'IMPOSITION
  // ═══════════════════════════════════════════════════════════════════════════
  fiscal: {
    /**
     * Barème progressif IR 2026 — tranches et taux.
     * Exprimé par demi-part fiscale (quotient familial).
     */
    CFG_BAREME_IR_TRANCHES: [
      { de: 0,      a: 11_497, taux: 0.00 },
      { de: 11_497, a: 29_315, taux: 0.11 },
      { de: 29_315, a: 83_823, taux: 0.30 },
      { de: 83_823, a: 180_294, taux: 0.41 },
      { de: 180_294, a: null,  taux: 0.45 },
    ] as TrancheIR[],

    /** Taux marginaux correspondant aux tranches (dans le même ordre) */
    CFG_BAREME_IR_TAUX: [0.00, 0.11, 0.30, 0.41, 0.45],

    /**
     * Règle du quotient familial.
     * L'IR est calculé sur le revenu divisé par le nombre de parts, puis multiplié.
     */
    CFG_REGLE_QUOTIENT_FAMILIAL: {
      methode: "Diviser le revenu imposable par le nombre de parts, appliquer le barème, multiplier par le nombre de parts",
      note: "Plafond de l'avantage par demi-part supplémentaire = CFG_PLAFOND_AVANTAGE_QF",
    },

    /** Plafond de l'avantage fiscal lié au quotient familial par demi-part supplémentaire (€) */
    CFG_PLAFOND_AVANTAGE_QF: 1_807,

    /** Taux IS réduit (PME éligibles) */
    CFG_TAUX_IS_REDUIT: 0.15,

    /** Taux IS normal */
    CFG_TAUX_IS_NORMAL: 0.25,

    /** Seuil de bénéfice fiscal jusqu'auquel le taux IS réduit s'applique (€) */
    CFG_SEUIL_IS_REDUIT: 42_500,

    /**
     * Règles de répartition de l'IR entre scénarios (méthode différentielle).
     * L'IR attribuable au scénario est calculé par différence entre l'IR du foyer
     * avec et sans les revenus du scénario.
     */
    CFG_REGLES_REPARTITION_IR_SCENARIO: {
      methode: "Différentielle : IR_FOYER_AVEC_SCENARIO - IR_FOYER_SANS_SCENARIO",
      base_sans_scenario: "AUTRES_REVENUS_FOYER_IMPOSABLES - AUTRES_CHARGES_DEDUCTIBLES_FOYER",
      note: "Résultat toujours une estimation si les données foyer sont incomplètes",
    },

    /**
     * Règles d'affectation de l'impôt foyer au scénario simulé.
     * TODO_A_CONFIRMER : valider la méthode différentielle avec un expert fiscal
     * pour les cas de foyers avec revenus complexes (capitaux, foncier, PEA…).
     */
    CFG_REGLES_AFFECTATION_IMPOT_FOYER_AU_SCENARIO: {
      methode_retenue: "Différentielle (voir CFG_REGLES_REPARTITION_IR_SCENARIO)",
      note: "TODO_A_CONFIRMER — valider la méthode pour les foyers avec revenus de capitaux importants",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. TEMPORALITÉ ET OPTIONS FISCALES
  // ═══════════════════════════════════════════════════════════════════════════
  temporalite: {
    /** Nombre d'exercices maximum pour l'option IR temporaire d'une société (EURL/SASU) */
    CFG_DUREE_OPTION_IR_TEMPORAIRE_SOCIETE: 5,

    /**
     * Date limite pour opter à l'IS pour une EI (option irrévocable).
     * TODO_A_CONFIRMER : date limite 2026 pour l'option IS EI (généralement 3 mois
     * après ouverture de l'exercice ou à la création).
     */
    CFG_DATE_LIMITE_OPTION_IS_EI: {
      note: "TODO_A_CONFIRMER — date limite option IS EI 2026 (création ou 3 mois après début exercice)",
    },

    /** Date limite pour opter au VFL (Versement Fiscal Libératoire) pour l'année N */
    CFG_DATE_LIMITE_OPTION_VFL: "30 septembre N-1 (ou 3 mois après création si création en N)",

    /**
     * Date limite générale pour les options fiscales annuelles.
     * Règle générale : avant le 30 septembre de l'année précédente
     * ou dans les 3 mois suivant la création de l'activité.
     */
    CFG_DATE_LIMITE_OPTIONS_FISCALES:
      "En général avant le 30 septembre N-1 ou dans les 3 mois suivant la date de création",

    /**
     * Activation du prorata temporis pour les exercices incomplets.
     * Applicable en cas de création ou de bascule de régime en cours d'année.
     */
    CFG_PRORATA_TEMPORIS: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. CONSTANTES PIVOT — RÉFÉRENTIELS NATIONAUX 2026
  // ═══════════════════════════════════════════════════════════════════════════
  referentiels: {
    /** Plafond Annuel de la Sécurité Sociale 2026 (€) */
    CFG_PASS_2026: PASS_2026,

    /** SMIC horaire brut 2026 (€) */
    CFG_SMIC_HORAIRE_2026: 12.02,

    /** SMIC mensuel brut 2026 (€) — base 35h */
    CFG_SMIC_MENSUEL_BRUT_2026: 12.02 * 35 * 52 / 12,
  },

} as const;

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT DU TYPE (pour usage strict dans le moteur)
// ─────────────────────────────────────────────────────────────────────────────

export type FiscalParams = typeof FISCAL_PARAMS_2026;

// ─────────────────────────────────────────────────────────────────────────────
// RÉCAPITULATIF DES TODO_A_CONFIRMER
// Variables dont la valeur doit être validée avant mise en production.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @TODO_LIST_AVANT_MISE_EN_PROD
 *
 * Social :
 *   - CFG_TAUX_SOCIAL_TNS_BIC / CFG_TAUX_SOCIAL_TNS_BNC : barèmes par tranche PASS 2026
 *   - CFG_TAUX_SOCIAL_ASSIMILE_SALARIE : taux patronal + salarial 2026
 *   - CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_ASSIMILE : confirmer absence de réforme
 *   - CFG_SEUIL_PUMA / CFG_FORMULE_TAXE_PUMA : assiette et conditions 2026 (Art. L. 380-2)
 *
 * Santé :
 *   - CFG_TAUX_MALADIE_SECTEUR_2 : taux générique ou distinction OPTAM systématique
 *   - CFG_PARAM_AIDE_CPAM_MALADIE : taux exact de prise en charge CPAM 2026
 *   - CFG_PARAM_AIDE_CPAM_RETRAITE : montant participation CPAM retraite 2026
 *   - CFG_PARAM_DEDUCTION_COMPLEMENTAIRE_SANTE : postes déductibles Groupes I/II
 *   - CFG_REGLES_PAMC : paramètres PAMC 2026
 *
 * Artiste-auteur :
 *   - CFG_TAUX_COTISATIONS_ARTISTE_AUTEUR : taux AGESSA/MDA 2026
 *
 * Immobilier :
 *   - CFG_REGLES_DEDUCTIBILITE_CHARGES_LMNP : liste des charges déductibles 2026
 *   - CFG_REGLES_PLUS_VALUES_LMP : seuils Art. 151 septies 2026
 *
 * Aides :
 *   - CFG_TAUX_REDUCTION_ACRE_HORS_MICRO : taux par tranche PASS 2026
 *   - CFG_ACRE_MODE_CALCUL : abattement assiette ou réduction cotisations
 *
 * Zones :
 *   - CFG_ZFRR_TAUX_PHASES : taux de dégressivité années 6, 7, 8
 *   - CFG_ZFRR_TYPES_ENTREPRISES_ELIGIBLES : critères d'éligibilité 2026
 *   - CFG_ZFRR_IMPOTS_CIBLES : périmètre des impôts exonérés
 *   - CFG_ZFRR_COTISATIONS_CIBLEES : périmètre des cotisations exonérées (ZFRR+)
 *   - CFG_QPV_CONDITIONS_EFFECTIF / CFG_QPV_CONDITIONS_CA_BILAN : seuils 2026
 *   - CFG_QPV_DUREE_ET_PHASES : durée et dégressivité 2026
 *   - CFG_QPV_PORTION_CA_EN_ZONE : méthode de proratisation
 *   - CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS : conditions de maintien des droits acquis
 *   - CFG_NON_CUMUL_EXONERATIONS_ZONE : règles de non-cumul ZFRR / QPV / ZFU
 *
 * IR / IS :
 *   - CFG_BAREME_IR_TRANCHES : confirmer les bornes exactes 2026 (après revalorisation)
 *   - CFG_REGLES_AFFECTATION_IMPOT_FOYER_AU_SCENARIO : valider méthode différentielle
 *
 * Temporalité :
 *   - CFG_DATE_LIMITE_OPTION_IS_EI : confirmer la date limite exacte 2026
 */