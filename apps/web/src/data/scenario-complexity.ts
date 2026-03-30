import type { BaseScenarioId } from "@wymby/types";

export interface ComplexiteDetail {
  score: number;
  label: "Très simple" | "Simple" | "Modérée" | "Élevée" | "Très élevée";
  obligations: string[];
  cout_comptable_estime?: string;
  frequence_principale: string;
}

export const SCENARIO_COMPLEXITY: Record<BaseScenarioId, ComplexiteDetail> = {
  G_MBIC_VENTE: {
    score: 1,
    label: "Très simple",
    obligations: [
      "Déclaration de revenus annuelle (formulaire 2042-C-PRO)",
      "Déclaration URSSAF mensuelle ou trimestrielle",
      "Tenue d'un registre des achats et des ventes",
    ],
    cout_comptable_estime: "0 - 300 EUR/an",
    frequence_principale: "1 déclaration fiscale par an",
  },
  G_MBIC_SERVICE: {
    score: 1,
    label: "Très simple",
    obligations: [
      "Déclaration de revenus annuelle (formulaire 2042-C-PRO)",
      "Déclaration URSSAF mensuelle ou trimestrielle",
    ],
    cout_comptable_estime: "0 - 300 EUR/an",
    frequence_principale: "1 déclaration fiscale par an",
  },
  G_MBNC: {
    score: 1,
    label: "Très simple",
    obligations: [
      "Déclaration de revenus annuelle (formulaire 2042-C-PRO)",
      "Déclaration URSSAF mensuelle ou trimestrielle",
    ],
    cout_comptable_estime: "0 - 300 EUR/an",
    frequence_principale: "1 déclaration fiscale par an",
  },
  G_EI_REEL_BIC_IR: {
    score: 3,
    label: "Modérée",
    obligations: [
      "Comptabilité d'engagement (recettes, dépenses, stocks)",
      "Déclaration 2031 avant mai",
      "Déclaration sociale annuelle du dirigeant",
      "Tenue d'un registre des immobilisations",
    ],
    cout_comptable_estime: "800 - 2 000 EUR/an",
    frequence_principale: "1 déclaration fiscale par an + comptabilité complète",
  },
  G_EI_REEL_BIC_IS: {
    score: 4,
    label: "Élevée",
    obligations: [
      "Comptabilité d'engagement obligatoire",
      "Déclaration IS (2065) + liasse fiscale",
      "Suivi de la rémunération du dirigeant",
      "Clôture d'exercice avec bilan et compte de résultat",
    ],
    cout_comptable_estime: "1 200 - 2 800 EUR/an",
    frequence_principale: "Clôture annuelle + obligations IS",
  },
  G_EI_REEL_BNC_IR: {
    score: 3,
    label: "Modérée",
    obligations: [
      "Déclaration 2035 avant mai",
      "Tenue d'un livre-journal des recettes et dépenses",
      "Déclaration sociale annuelle du dirigeant",
      "Conservation des justificatifs 10 ans",
    ],
    cout_comptable_estime: "500 - 1 500 EUR/an",
    frequence_principale: "1 déclaration fiscale par an + comptabilité de trésorerie",
  },
  G_EI_REEL_BNC_IS: {
    score: 4,
    label: "Élevée",
    obligations: [
      "Comptabilité d'engagement obligatoire",
      "Déclaration IS (2065) + liasse fiscale",
      "Suivi des rémunérations et dividendes",
      "Clôture d'exercice avec documentation comptable complète",
    ],
    cout_comptable_estime: "1 200 - 2 800 EUR/an",
    frequence_principale: "Clôture annuelle + obligations IS",
  },
  G_EURL_IS: {
    score: 4,
    label: "Élevée",
    obligations: [
      "Comptabilité d'engagement obligatoire",
      "Dépôt des comptes annuels au greffe",
      "Assemblée annuelle de l'associé unique",
      "Déclaration IS (2065) + liasse 2050",
      "Tenue d'un registre des décisions du gérant",
    ],
    cout_comptable_estime: "1 500 - 3 500 EUR/an",
    frequence_principale: "Clôture d'exercice + dépôt au greffe",
  },
  G_EURL_IR: {
    score: 4,
    label: "Élevée",
    obligations: [
      "Comptabilité complète de société",
      "Assemblée annuelle de l'associé unique",
      "Dépôt des comptes annuels",
      "Suivi de l'option IR limitée dans le temps",
    ],
    cout_comptable_estime: "1 400 - 3 000 EUR/an",
    frequence_principale: "Clôture annuelle + formalités société",
  },
  G_SASU_IS: {
    score: 5,
    label: "Très élevée",
    obligations: [
      "Comptabilité d'engagement obligatoire",
      "Dépôt des comptes annuels au greffe",
      "Assemblée annuelle",
      "Déclaration IS (2065) + liasse complète",
      "DSN mensuelle pour le président assimilé-salarié",
      "Bulletin de paie mensuel",
    ],
    cout_comptable_estime: "2 500 - 5 000 EUR/an",
    frequence_principale: "DSN mensuelle + clôture annuelle + greffe",
  },
  G_SASU_IR: {
    score: 5,
    label: "Très élevée",
    obligations: [
      "Comptabilité complète de société",
      "Assemblée annuelle",
      "DSN mensuelle si rémunération du président",
      "Suivi de l'option IR limitée à 5 exercices",
    ],
    cout_comptable_estime: "2 300 - 4 500 EUR/an",
    frequence_principale: "Gestion sociale mensuelle + clôture annuelle",
  },
  S_RSPM: {
    score: 1,
    label: "Très simple",
    obligations: [
      "Déclaration mensuelle ou trimestrielle sur le portail dédié",
      "Déclaration des revenus en BNC sur la 2042",
    ],
    cout_comptable_estime: "0 - 200 EUR/an",
    frequence_principale: "Déclaration mensuelle ou trimestrielle",
  },
  S_MICRO_BNC_SECTEUR_1: {
    score: 2,
    label: "Simple",
    obligations: [
      "Déclaration URSSAF mensuelle ou trimestrielle",
      "Déclaration de revenus annuelle (2042-C-PRO)",
      "Attestation de conventionnement secteur 1 à jour",
    ],
    cout_comptable_estime: "0 - 400 EUR/an",
    frequence_principale: "1 déclaration fiscale par an",
  },
  S_MICRO_BNC_SECTEUR_2: {
    score: 2,
    label: "Simple",
    obligations: [
      "Déclaration URSSAF mensuelle ou trimestrielle",
      "Déclaration de revenus annuelle (2042-C-PRO)",
      "Suivi des dépassements et du conventionnement",
    ],
    cout_comptable_estime: "0 - 500 EUR/an",
    frequence_principale: "1 déclaration fiscale par an",
  },
  S_EI_REEL_SECTEUR_1: {
    score: 3,
    label: "Modérée",
    obligations: [
      "Déclaration 2035 avec suivi des déductions professionnelles",
      "Tenue d'un livre-journal des recettes et dépenses",
      "Déclaration sociale annuelle PAMC",
      "Convention CPAM à maintenir à jour",
    ],
    cout_comptable_estime: "800 - 2 000 EUR/an",
    frequence_principale: "1 déclaration 2035 par an + suivi CPAM",
  },
  S_EI_REEL_SECTEUR_2_OPTAM: {
    score: 3,
    label: "Modérée",
    obligations: [
      "Déclaration 2035 annuelle",
      "Tenue d'un livre-journal des recettes et dépenses",
      "Déclaration sociale annuelle PAMC",
      "Suivi de l'adhésion OPTAM et des honoraires",
    ],
    cout_comptable_estime: "900 - 2 100 EUR/an",
    frequence_principale: "1 déclaration 2035 par an + suivi OPTAM",
  },
  S_EI_REEL_SECTEUR_2_NON_OPTAM: {
    score: 3,
    label: "Modérée",
    obligations: [
      "Déclaration 2035 annuelle",
      "Tenue d'un livre-journal des recettes et dépenses",
      "Déclaration sociale annuelle PAMC",
      "Suivi séparé des dépassements et honoraires",
    ],
    cout_comptable_estime: "900 - 2 100 EUR/an",
    frequence_principale: "1 déclaration 2035 par an",
  },
  S_EI_REEL_SECTEUR_3_HORS_CONVENTION: {
    score: 3,
    label: "Modérée",
    obligations: [
      "Déclaration 2035 annuelle",
      "Tenue d'une comptabilité de trésorerie",
      "Déclaration sociale annuelle",
      "Suivi des recettes hors convention",
    ],
    cout_comptable_estime: "900 - 2 200 EUR/an",
    frequence_principale: "1 déclaration 2035 par an",
  },
  S_SELARL_IS: {
    score: 5,
    label: "Très élevée",
    obligations: [
      "Constitution et vie sociale d'une SELARL",
      "Comptabilité d'engagement + liasse IS",
      "Dépôt des comptes au greffe",
      "Assemblée générale annuelle",
      "Agrément et suivi ordinal",
      "Déclaration de rémunération du gérant",
    ],
    cout_comptable_estime: "2 500 - 5 000 EUR/an",
    frequence_principale: "Gestion sociale mensuelle + clôture annuelle + greffe",
  },
  S_SELAS_IS: {
    score: 5,
    label: "Très élevée",
    obligations: [
      "Constitution et vie sociale d'une SELAS",
      "Agrément de l'ordre professionnel",
      "Comptabilité d'engagement + DSN mensuelle",
      "Dépôt des comptes annuels",
      "Bulletin de paie mensuel du président",
    ],
    cout_comptable_estime: "3 000 - 6 000 EUR/an",
    frequence_principale: "DSN mensuelle + clôture annuelle + greffe",
  },
  A_BNC_MICRO: {
    score: 1,
    label: "Très simple",
    obligations: [
      "Déclaration annuelle des revenus artistiques",
      "Suivi simple des recettes encaissées",
    ],
    cout_comptable_estime: "0 - 300 EUR/an",
    frequence_principale: "1 déclaration fiscale par an",
  },
  A_BNC_MICRO_TVA_FRANCHISE: {
    score: 1,
    label: "Très simple",
    obligations: [
      "Déclaration annuelle des revenus artistiques",
      "Suivi simple des recettes encaissées",
      "Respect de la franchise en base de TVA",
    ],
    cout_comptable_estime: "0 - 300 EUR/an",
    frequence_principale: "1 déclaration fiscale par an",
  },
  A_BNC_MICRO_TVA_COLLECTEE: {
    score: 2,
    label: "Simple",
    obligations: [
      "Déclaration annuelle des revenus artistiques",
      "Déclarations de TVA",
      "Suivi des recettes et de la TVA collectée",
    ],
    cout_comptable_estime: "200 - 600 EUR/an",
    frequence_principale: "Déclarations de TVA + 1 déclaration fiscale par an",
  },
  A_BNC_REEL: {
    score: 3,
    label: "Modérée",
    obligations: [
      "Déclaration 2035 annuelle",
      "Livre-journal des recettes et dépenses",
      "Suivi de la retraite complémentaire RAAP",
      "Archivage des justificatifs",
    ],
    cout_comptable_estime: "500 - 1 500 EUR/an",
    frequence_principale: "1 déclaration 2035 par an",
  },
  A_TS_ABATTEMENT_FORFAITAIRE: {
    score: 2,
    label: "Simple",
    obligations: [
      "Déclaration annuelle des revenus",
      "Conservation des justificatifs principaux",
    ],
    cout_comptable_estime: "0 - 300 EUR/an",
    frequence_principale: "1 déclaration fiscale par an",
  },
  A_TS_FRAIS_REELS: {
    score: 3,
    label: "Modérée",
    obligations: [
      "Déclaration annuelle des revenus",
      "Justification détaillée des frais réels",
      "Archivage des pièces justificatives",
    ],
    cout_comptable_estime: "200 - 800 EUR/an",
    frequence_principale: "1 déclaration fiscale par an + justificatifs détaillés",
  },
  I_LMNP_MICRO: {
    score: 1,
    label: "Très simple",
    obligations: [
      "Déclaration annuelle des revenus locatifs",
      "Suivi des recettes encaissées",
    ],
    cout_comptable_estime: "0 - 400 EUR/an",
    frequence_principale: "1 déclaration fiscale par an",
  },
  I_LMNP_REEL: {
    score: 4,
    label: "Élevée",
    obligations: [
      "Comptabilité complète avec amortissements",
      "Déclaration 2031 et annexes",
      "Suivi des immobilisations et des composants",
      "Archivage des factures et travaux",
    ],
    cout_comptable_estime: "700 - 2 000 EUR/an",
    frequence_principale: "Clôture annuelle + comptabilité d'engagement",
  },
  I_LMP: {
    score: 4,
    label: "Élevée",
    obligations: [
      "Comptabilité complète avec amortissements",
      "Déclaration 2031 et suivi des cotisations SSI",
      "Suivi du statut professionnel et des plus-values",
      "Archivage des pièces comptables",
    ],
    cout_comptable_estime: "900 - 2 500 EUR/an",
    frequence_principale: "Clôture annuelle + obligations SSI",
  },
};

export function getComplexityTone(score: number): "positive" | "warning" | "danger" {
  if (score <= 2) return "positive";
  if (score === 3) return "warning";
  return "danger";
}
