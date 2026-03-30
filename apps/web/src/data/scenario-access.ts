import type { BaseScenarioId } from "@wymby/types";

export interface AccesRegime {
  depuis?: "micro" | "ei_reel" | "societe" | "salarie";
  etapes: string[];
  delai_effectivite: string;
  fenetre_option: string | null;
  professionnel_requis:
    | "expert_comptable"
    | "avocat"
    | "ordre_professionnel"
    | null;
  accompagnement_recommande: boolean;
  cout_demarche_estime: string;
  lien_officiel?: string;
}

export type AccesParScenario = {
  general: AccesRegime;
  depuis_micro?: AccesRegime;
  depuis_ei_reel?: AccesRegime;
  depuis_societe?: AccesRegime;
};

function withGeneral(
  general: AccesRegime,
  overrides?: Omit<AccesParScenario, "general">
): AccesParScenario {
  return {
    general,
    ...overrides,
  };
}

export function selectAccesRegime(
  access: AccesParScenario,
  referenceBaseId: string | undefined
): AccesRegime {
  if (!referenceBaseId) return access.general;

  if (
    referenceBaseId.includes("MICRO") ||
    referenceBaseId.includes("MBIC") ||
    referenceBaseId.includes("MBNC")
  ) {
    return access.depuis_micro ?? access.general;
  }

  if (referenceBaseId.includes("EI_REEL")) {
    return access.depuis_ei_reel ?? access.general;
  }

  if (
    referenceBaseId.includes("EURL") ||
    referenceBaseId.includes("SASU") ||
    referenceBaseId.includes("SELARL") ||
    referenceBaseId.includes("SELAS")
  ) {
    return access.depuis_societe ?? access.general;
  }

  return access.general;
}

const MICRO_GENERAL: AccesRegime = {
  etapes: [
    "Declarer le debut d'activite sur guichet-entreprises.fr (creation) ou modifier votre declaration si deja en activite",
    "Choisir le regime micro-entrepreneur lors de la declaration",
    "Activer votre espace URSSAF auto-entrepreneur sur autoentrepreneur.urssaf.fr",
  ],
  delai_effectivite:
    "Immediat a la declaration pour une creation. 1er janvier de l'annee suivante pour un passage depuis le reel.",
  fenetre_option: "Option a exercer avant le 31 decembre pour l'annee suivante",
  professionnel_requis: null,
  accompagnement_recommande: false,
  cout_demarche_estime: "Gratuit",
  lien_officiel: "https://www.autoentrepreneur.urssaf.fr",
};

const MICRO_FROM_EI_REEL: AccesRegime = {
  depuis: "ei_reel",
  etapes: [
    "Verifier que votre CA N-1 est sous le seuil micro applicable a votre activite",
    "Notifier l'option micro avant le 31 decembre aupres du SIE (Service des Impots des Entreprises)",
    "Informer l'URSSAF du changement de regime social",
  ],
  delai_effectivite: "1er janvier de l'annee suivante",
  fenetre_option: "Avant le 31 decembre de l'annee en cours",
  professionnel_requis: null,
  accompagnement_recommande: false,
  cout_demarche_estime: "Gratuit",
  lien_officiel: "https://www.impots.gouv.fr",
};

export const SCENARIO_ACCESS: Record<BaseScenarioId, AccesParScenario> = {
  G_MBIC_VENTE: withGeneral(MICRO_GENERAL, { depuis_ei_reel: MICRO_FROM_EI_REEL }),
  G_MBIC_SERVICE: withGeneral(MICRO_GENERAL, { depuis_ei_reel: MICRO_FROM_EI_REEL }),
  G_MBNC: withGeneral(MICRO_GENERAL, { depuis_ei_reel: MICRO_FROM_EI_REEL }),

  G_EI_REEL_BIC_IR: withGeneral(
    {
      etapes: [
        "Declarer le debut d'activite commerciale ou artisanale sur guichet-entreprises.fr",
        "Le regime reel BIC est le regime de droit commun au-dessus du seuil micro - aucune option formelle requise si vous depassez le seuil",
        "Mettre en place une comptabilite complete (recettes, depenses, stocks et immobilisations) des le 1er jour",
        "Deposer la declaration 2031 avant la date limite annuelle",
      ],
      delai_effectivite: "Immediat a la creation, ou 1er janvier si passage depuis micro",
      fenetre_option: null,
      professionnel_requis: null,
      accompagnement_recommande: true,
      cout_demarche_estime: "Gratuit (demarche) - prevoir 800 a 2 000 EUR/an pour un comptable",
      lien_officiel: "https://www.impots.gouv.fr/professionnel/les-regimes-dimposition",
    },
    {
      depuis_micro: {
        depuis: "micro",
        etapes: [
          "Verifier le depassement du seuil micro sur 2 annees consecutives (bascule automatique) ou opter volontairement",
          "Notifier le SIE de la renonciation a l'option micro avant le 31 decembre",
          "Informer l'URSSAF du passage au regime reel",
          "Mettre en place la comptabilite et le suivi des stocks des le 1er janvier",
        ],
        delai_effectivite: "1er janvier de l'annee suivante",
        fenetre_option: "Avant le 31 decembre de l'annee en cours",
        professionnel_requis: null,
        accompagnement_recommande: true,
        cout_demarche_estime: "Gratuit (demarche)",
        lien_officiel: "https://www.impots.gouv.fr",
      },
    }
  ),

  G_EI_REEL_BIC_IS: withGeneral({
    etapes: [
      "Exercer l'option IS par courrier au SIE dans les 3 mois suivant le debut d'activite, ou avant le 31 mars pour l'exercice en cours",
      "L'option est irreversible apres la premiere annee - bien analyser avant d'opter",
      "Mettre en place la comptabilite d'engagement (obligatoire en IS)",
    ],
    delai_effectivite: "Exercice en cours si option avant le 31 mars, sinon exercice suivant",
    fenetre_option: "Dans les 3 mois du debut d'activite, ou avant le 31 mars pour l'exercice en cours",
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime: "Gratuit (demarche) - comptabilite d'engagement requise ensuite",
    lien_officiel: "https://www.impots.gouv.fr",
  }),

  G_EI_REEL_BNC_IR: withGeneral(
    {
      etapes: [
        "Declarer le debut d'activite liberale sur guichet-entreprises.fr",
        "Le regime reel BNC est le regime de droit commun au-dessus du seuil micro - aucune option formelle requise si vous depassez le seuil",
        "Tenir un livre-journal des recettes et depenses des le 1er jour",
        "Deposer la declaration 2035 avant la date limite (generalement debut mai de l'annee suivante)",
      ],
      delai_effectivite: "Immediat a la creation, ou 1er janvier si passage depuis micro",
      fenetre_option: null,
      professionnel_requis: null,
      accompagnement_recommande: true,
      cout_demarche_estime: "Gratuit (demarche) - prevoir 500 a 1 500 EUR/an pour un comptable",
      lien_officiel:
        "https://www.impots.gouv.fr/professionnel/la-declaration-de-revenus-des-professionnels",
    },
    {
      depuis_micro: {
        depuis: "micro",
        etapes: [
          "Verifier le depassement du seuil micro sur 2 annees consecutives (bascule automatique) ou opter volontairement",
          "Notifier le SIE de la renonciation a l'option micro avant le 31 decembre",
          "Informer l'URSSAF du passage au regime TNS reel",
          "Mettre en place la tenue du livre-journal des le 1er janvier",
        ],
        delai_effectivite: "1er janvier de l'annee suivante",
        fenetre_option: "Avant le 31 decembre de l'annee en cours",
        professionnel_requis: null,
        accompagnement_recommande: true,
        cout_demarche_estime: "Gratuit (demarche)",
      },
    }
  ),

  G_EI_REEL_BNC_IS: withGeneral({
    etapes: [
      "Exercer l'option IS par courrier au SIE dans les 3 mois suivant le debut d'activite, ou avant le 31 mars pour l'exercice en cours",
      "L'option est irreversible apres la premiere annee - bien analyser avant d'opter",
      "Mettre en place la comptabilite d'engagement (obligatoire en IS)",
    ],
    delai_effectivite: "Exercice en cours si option avant le 31 mars, sinon exercice suivant",
    fenetre_option: "Dans les 3 mois du debut d'activite, ou avant le 31 mars pour l'exercice en cours",
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime: "Gratuit (demarche) - comptabilite d'engagement requise ensuite",
    lien_officiel: "https://www.impots.gouv.fr",
  }),

  G_EURL_IS: withGeneral(
    {
      etapes: [
        "Rediger les statuts de l'EURL (peut etre fait seul avec un modele ou avec un avocat/comptable)",
        "Deposer le capital social sur un compte bloque (montant libre, minimum 1 EUR)",
        "Publier l'annonce legale de creation dans un journal habilite (~150 EUR)",
        "Immatriculer l'EURL sur guichet-entreprises.fr (depot des statuts + pieces justificatives)",
        "Obtenir le Kbis aupres du greffe (~25 EUR)",
        "Ouvrir un compte bancaire professionnel au nom de la societe",
        "Adherer au regime TNS URSSAF pour le gerant",
      ],
      delai_effectivite: "Environ 2 a 4 semaines apres depot du dossier complet",
      fenetre_option: null,
      professionnel_requis: null,
      accompagnement_recommande: true,
      cout_demarche_estime:
        "300 - 800 EUR (annonce legale + greffe) + 0 - 2 000 EUR (redaction statuts)",
      lien_officiel: "https://www.guichet-entreprises.fr",
    },
    {
      depuis_micro: {
        depuis: "micro",
        etapes: [
          "Creer l'EURL (voir etapes generales)",
          "Apporter votre activite a la societe (apport de fonds de commerce si pertinent)",
          "Radier l'entreprise individuelle sur guichet-entreprises.fr apres transfert d'activite",
          "Verifier les implications TVA du transfert avec un comptable",
        ],
        delai_effectivite: "2 a 6 semaines selon complexite du transfert",
        fenetre_option: null,
        professionnel_requis: null,
        accompagnement_recommande: true,
        cout_demarche_estime: "500 - 2 000 EUR (demarches + accompagnement recommande)",
      },
    }
  ),

  G_EURL_IR: withGeneral({
    etapes: [
      "Rediger les statuts de l'EURL et prevoir l'option IR si vous remplissez les conditions",
      "Deposer le capital social puis publier l'annonce legale",
      "Immatriculer l'EURL sur guichet-entreprises.fr",
      "Notifier l'option IR au SIE dans les delais fiscaux applicables",
      "Ouvrir le compte bancaire professionnel et organiser la gestion sociale du gerant",
    ],
    delai_effectivite: "Environ 2 a 4 semaines a la creation, ou exercice suivant selon la date de l'option",
    fenetre_option: "Option IR reservee a une periode limitee et a exercer dans les delais fiscaux de l'exercice",
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime:
      "300 - 800 EUR (annonce legale + greffe) + 0 - 2 000 EUR (redaction statuts)",
    lien_officiel: "https://www.guichet-entreprises.fr",
  }),

  G_SASU_IS: withGeneral({
    etapes: [
      "Rediger les statuts de la SASU",
      "Deposer le capital social sur compte bloque",
      "Publier l'annonce legale (~150 EUR)",
      "Immatriculer la SASU sur guichet-entreprises.fr",
      "Obtenir le Kbis",
      "Ouvrir un compte bancaire professionnel",
      "S'inscrire au regime assimile-salarie pour le president (affiliation URSSAF salarie, DSN mensuelle)",
      "Prevoir un bulletin de paie mensuel des la premiere remuneration",
    ],
    delai_effectivite: "2 a 4 semaines",
    fenetre_option: null,
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime:
      "300 - 800 EUR (annonce legale + greffe) + 0 - 2 500 EUR (statuts + comptable)",
    lien_officiel: "https://www.guichet-entreprises.fr",
  }),

  G_SASU_IR: withGeneral({
    etapes: [
      "Constituer la SASU (statuts, depot du capital, annonce legale, immatriculation)",
      "Verifier l'eligibilite a l'option IR et la duree restante de l'option",
      "Notifier l'option IR au SIE dans les delais de l'exercice concerne",
      "Mettre en place la gestion sociale du president et la DSN si remuneration",
    ],
    delai_effectivite: "2 a 4 semaines a la creation, ou exercice suivant selon la date de l'option",
    fenetre_option: "Option IR limitee dans le temps et a exercer dans les delais fiscaux de l'exercice",
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime:
      "300 - 800 EUR (annonce legale + greffe) + 0 - 2 500 EUR (statuts + comptable)",
    lien_officiel: "https://www.guichet-entreprises.fr",
  }),

  S_RSPM: withGeneral({
    etapes: [
      "S'inscrire sur le portail dedie : medecins-remplacants.urssaf.fr",
      "Fournir votre numero RPPS et attestation d'inscription a l'Ordre",
      "Declarer vos honoraires mensuellement ou trimestriellement sur le portail",
    ],
    delai_effectivite: "Immediat apres inscription",
    fenetre_option: null,
    professionnel_requis: null,
    accompagnement_recommande: false,
    cout_demarche_estime: "Gratuit",
    lien_officiel: "https://www.medecins-remplacants.urssaf.fr",
  }),

  S_MICRO_BNC_SECTEUR_1: withGeneral({
    etapes: [
      "S'inscrire a l'Ordre professionnel competent si pas encore fait",
      "Signer la convention medicale secteur 1 avec la CPAM de rattachement",
      "Declarer l'activite liberale en micro-BNC sur guichet-entreprises.fr",
      "Ouvrir votre espace URSSAF PAMC et declarer vos honoraires",
    ],
    delai_effectivite:
      "Immediat a l'installation. Delai de conventionnement CPAM : 1 a 4 semaines.",
    fenetre_option: "Option micro a exercer avant le 31 decembre pour l'annee suivante si vous venez du reel",
    professionnel_requis: null,
    accompagnement_recommande: false,
    cout_demarche_estime: "Gratuit",
    lien_officiel:
      "https://www.ameli.fr/medecin/exercice-liberal/remuneration/convention-medicale",
  }),

  S_MICRO_BNC_SECTEUR_2: withGeneral({
    etapes: [
      "S'inscrire a l'Ordre professionnel competent si pas encore fait",
      "Exercer en secteur 2 avec votre conventionnement CPAM actif",
      "Declarer l'activite liberale en micro-BNC sur guichet-entreprises.fr",
      "Ouvrir votre espace URSSAF PAMC et declarer vos honoraires",
    ],
    delai_effectivite: "Immediat a l'installation ou 1er janvier de l'annee suivante depuis le reel",
    fenetre_option: "Option micro a exercer avant le 31 decembre pour l'annee suivante",
    professionnel_requis: null,
    accompagnement_recommande: false,
    cout_demarche_estime: "Gratuit",
    lien_officiel:
      "https://www.ameli.fr/medecin/exercice-liberal/remuneration/convention-medicale",
  }),

  S_EI_REEL_SECTEUR_1: withGeneral({
    etapes: [
      "S'inscrire a l'Ordre professionnel competent si pas encore fait",
      "Signer la convention medicale secteur 1 avec la CPAM de rattachement",
      "Declarer votre activite liberale sur guichet-entreprises.fr",
      "Ouvrir votre espace URSSAF PAMC sur urssaf.fr",
      "Tenir le livre-journal des recettes et depenses des le 1er jour",
    ],
    delai_effectivite:
      "Immediat pour une installation. Delai de conventionnement CPAM : 1 a 4 semaines.",
    fenetre_option: null,
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime: "Gratuit (demarches) - prevoir 800 a 2 000 EUR/an de comptabilite",
    lien_officiel:
      "https://www.ameli.fr/medecin/exercice-liberal/remuneration/convention-medicale",
  }),

  S_EI_REEL_SECTEUR_2_OPTAM: withGeneral({
    etapes: [
      "S'inscrire a l'Ordre professionnel competent si pas encore fait",
      "Signer ou maintenir la convention secteur 2 avec adhesion OPTAM aupres de la CPAM",
      "Declarer votre activite liberale sur guichet-entreprises.fr",
      "Ouvrir votre espace URSSAF PAMC sur urssaf.fr",
      "Mettre en place la comptabilite 2035 et le suivi des honoraires OPTAM",
    ],
    delai_effectivite: "Immediat pour l'installation. Delai CPAM / OPTAM : 1 a 6 semaines.",
    fenetre_option: null,
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime: "Gratuit (demarches) - prevoir 900 a 2 100 EUR/an de comptabilite",
    lien_officiel:
      "https://www.ameli.fr/medecin/exercice-liberal/remuneration/convention-medicale",
  }),

  S_EI_REEL_SECTEUR_2_NON_OPTAM: withGeneral({
    etapes: [
      "S'inscrire a l'Ordre professionnel competent si pas encore fait",
      "Exercer en secteur 2 sans adhesion OPTAM",
      "Declarer votre activite liberale sur guichet-entreprises.fr",
      "Ouvrir votre espace URSSAF PAMC sur urssaf.fr",
      "Mettre en place la comptabilite 2035 et le suivi separe des honoraires",
    ],
    delai_effectivite: "Immediat pour l'installation. Verification du secteur CPAM : 1 a 4 semaines.",
    fenetre_option: null,
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime: "Gratuit (demarches) - prevoir 900 a 2 100 EUR/an de comptabilite",
    lien_officiel:
      "https://www.ameli.fr/medecin/exercice-liberal/remuneration/convention-medicale",
  }),

  S_EI_REEL_SECTEUR_3_HORS_CONVENTION: withGeneral({
    etapes: [
      "S'inscrire a l'Ordre professionnel competent si pas encore fait",
      "Declarer votre activite liberale sur guichet-entreprises.fr",
      "Aucune convention a signer avec la CPAM - tarifs libres",
      "Ouvrir votre espace URSSAF PAMC sur urssaf.fr",
      "Mettre en place la comptabilite 2035 des le 1er jour",
    ],
    delai_effectivite: "Immediat a l'installation",
    fenetre_option: null,
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime: "Gratuit (demarches) - prevoir 900 a 2 200 EUR/an de comptabilite",
    lien_officiel: "https://www.urssaf.fr",
  }),

  S_SELARL_IS: withGeneral({
    etapes: [
      "Obtenir l'agrement de votre Ordre professionnel pour la forme SELARL (delai : 1 a 3 mois)",
      "Rediger les statuts de la SELARL (avocat specialise fortement recommande)",
      "Deposer le capital social",
      "Publier l'annonce legale",
      "Immatriculer la SELARL au RCS sur guichet-entreprises.fr",
      "S'inscrire a l'Ordre sous la forme societaire",
      "Adherer au regime TNS URSSAF pour le gerant majoritaire",
    ],
    delai_effectivite: "2 a 4 mois (delai agrement Ordre inclus)",
    fenetre_option: null,
    professionnel_requis: "ordre_professionnel",
    accompagnement_recommande: true,
    cout_demarche_estime: "1 500 - 4 000 EUR (statuts avocat + greffe + Ordre)",
  }),

  S_SELAS_IS: withGeneral({
    etapes: [
      "Obtenir l'agrement de votre Ordre professionnel pour la forme SELAS",
      "Rediger les statuts de la SELAS (avocat specialise recommande)",
      "Deposer le capital social",
      "Publier l'annonce legale",
      "Immatriculer la SELAS",
      "S'inscrire a l'Ordre sous la forme societaire",
      "Mettre en place la DSN mensuelle pour le president assimile-salarie",
    ],
    delai_effectivite: "2 a 4 mois",
    fenetre_option: null,
    professionnel_requis: "ordre_professionnel",
    accompagnement_recommande: true,
    cout_demarche_estime: "2 000 - 5 000 EUR (statuts + greffe + Ordre)",
  }),

  A_BNC_MICRO: withGeneral({
    etapes: [
      "Declarer votre debut d'activite d'artiste-auteur sur guichet-entreprises.fr",
      "Choisir le regime micro-BNC si vos recettes le permettent",
      "Activer votre espace sur artistes-auteurs.urssaf.fr pour declarer vos revenus",
    ],
    delai_effectivite: "Immediat a la creation, ou 1er janvier de l'annee suivante depuis le reel",
    fenetre_option: "Option a exercer avant le 31 decembre pour l'annee suivante",
    professionnel_requis: null,
    accompagnement_recommande: false,
    cout_demarche_estime: "Gratuit",
    lien_officiel: "https://www.artistes-auteurs.urssaf.fr",
  }),

  A_BNC_MICRO_TVA_FRANCHISE: withGeneral({
    etapes: [
      "Declarer votre debut d'activite d'artiste-auteur sur guichet-entreprises.fr",
      "Choisir le regime micro-BNC et verifier votre maintien en franchise de TVA",
      "Activer votre espace sur artistes-auteurs.urssaf.fr",
    ],
    delai_effectivite: "Immediat a la creation, ou 1er janvier de l'annee suivante depuis le reel",
    fenetre_option: "Option a exercer avant le 31 decembre pour l'annee suivante",
    professionnel_requis: null,
    accompagnement_recommande: false,
    cout_demarche_estime: "Gratuit",
    lien_officiel: "https://www.artistes-auteurs.urssaf.fr",
  }),

  A_BNC_MICRO_TVA_COLLECTEE: withGeneral({
    etapes: [
      "Declarer votre debut d'activite d'artiste-auteur sur guichet-entreprises.fr",
      "Choisir le regime micro-BNC et activer votre numero de TVA si necessaire",
      "Mettre en place la facturation avec TVA et les declarations de TVA",
      "Activer votre espace sur artistes-auteurs.urssaf.fr",
    ],
    delai_effectivite: "Immediat apres immatriculation et activation TVA",
    fenetre_option: "Option micro a exercer avant le 31 decembre pour l'annee suivante",
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime: "Gratuit (demarche)",
    lien_officiel: "https://www.artistes-auteurs.urssaf.fr",
  }),

  A_BNC_REEL: withGeneral(
    {
      etapes: [
        "Declarer votre activite d'artiste-auteur sur guichet-entreprises.fr",
        "Passer au regime reel BNC si vous depassez le seuil micro ou sur option",
        "Tenir un livre-journal et suivre vos frais professionnels des le 1er jour",
        "Deposer la declaration 2035 a l'echeance annuelle",
      ],
      delai_effectivite: "Immediat a la creation, ou 1er janvier si passage depuis micro",
      fenetre_option: null,
      professionnel_requis: null,
      accompagnement_recommande: true,
      cout_demarche_estime: "Gratuit (demarche) - prevoir 500 a 1 500 EUR/an de comptabilite",
      lien_officiel: "https://www.artistes-auteurs.urssaf.fr",
    },
    {
      depuis_micro: {
        depuis: "micro",
        etapes: [
          "Verifier le depassement du seuil micro ou renoncer volontairement au micro-BNC",
          "Notifier le SIE avant le 31 decembre pour une application au 1er janvier suivant",
          "Mettre en place la tenue comptable et le classement des justificatifs",
        ],
        delai_effectivite: "1er janvier de l'annee suivante",
        fenetre_option: "Avant le 31 decembre de l'annee en cours",
        professionnel_requis: null,
        accompagnement_recommande: true,
        cout_demarche_estime: "Gratuit (demarche)",
        lien_officiel: "https://www.impots.gouv.fr",
      },
    }
  ),

  A_TS_ABATTEMENT_FORFAITAIRE: withGeneral({
    etapes: [
      "Verifier que vos revenus d'artiste-auteur sont bien verses en traitements et salaires par le diffuseur ou l'employeur",
      "Recuperer vos justificatifs annuels de remuneration",
      "Declarer vos revenus dans la categorie traitements et salaires : l'abattement forfaitaire s'applique automatiquement",
    ],
    delai_effectivite: "Immediat des le premier versement en traitements et salaires",
    fenetre_option: "Choix exerce lors de la declaration annuelle de revenus",
    professionnel_requis: null,
    accompagnement_recommande: false,
    cout_demarche_estime: "Gratuit",
    lien_officiel: "https://www.impots.gouv.fr",
  }),

  A_TS_FRAIS_REELS: withGeneral({
    etapes: [
      "Verifier que vos revenus sont bien verses en traitements et salaires",
      "Conserver les justificatifs precis de vos frais professionnels",
      "Choisir l'option frais reels lors de la declaration annuelle de revenus",
    ],
    delai_effectivite: "Applicable a la declaration annuelle de revenus de l'annee concernee",
    fenetre_option: "A exercer lors de la declaration annuelle de revenus",
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime: "Gratuit",
    lien_officiel: "https://www.impots.gouv.fr",
  }),

  I_LMNP_MICRO: withGeneral({
    etapes: [
      "Declarer le debut d'activite de location meublee sur guichet-entreprises.fr",
      "Conserver le regime micro-BIC si vos recettes restent sous le seuil applicable",
      "Declarer vos recettes en location meublee dans votre declaration annuelle",
    ],
    delai_effectivite: "Immediat a la creation, ou 1er janvier de l'annee suivante depuis le reel",
    fenetre_option: "Option micro a exercer avant le 31 decembre pour l'annee suivante",
    professionnel_requis: null,
    accompagnement_recommande: false,
    cout_demarche_estime: "Gratuit",
    lien_officiel: "https://www.impots.gouv.fr",
  }),

  I_LMNP_REEL: withGeneral(
    {
      etapes: [
        "Declarer le debut d'activite de location meublee sur guichet-entreprises.fr",
        "Opter pour le regime reel si vous souhaitez deduire vos charges et amortissements",
        "Mettre en place une comptabilite complete avec suivi des immobilisations",
        "Deposer la declaration de resultat a l'echeance annuelle",
      ],
      delai_effectivite: "Immediat a la creation, ou 1er janvier de l'annee suivante selon la date de l'option",
      fenetre_option: "Option a exercer avant la date limite fiscale de l'exercice concerne",
      professionnel_requis: null,
      accompagnement_recommande: true,
      cout_demarche_estime: "Gratuit (demarche) - prevoir 700 a 2 000 EUR/an de comptabilite",
      lien_officiel: "https://www.impots.gouv.fr",
    },
    {
      depuis_micro: {
        depuis: "micro",
        etapes: [
          "Notifier l'option pour le reel LMNP dans les delais fiscaux applicables",
          "Mettre en place le suivi comptable des amortissements avant l'ouverture de l'exercice",
          "Conserver les actes d'acquisition, factures et tableaux d'amortissement",
        ],
        delai_effectivite: "1er janvier de l'annee concernee si l'option est formulee dans les delais",
        fenetre_option: "Avant la date limite fiscale de depot de la premiere declaration concernee",
        professionnel_requis: null,
        accompagnement_recommande: true,
        cout_demarche_estime: "Gratuit (demarche)",
        lien_officiel: "https://www.impots.gouv.fr",
      },
    }
  ),

  I_LMP: withGeneral({
    etapes: [
      "Declarer l'activite de location meublee sur guichet-entreprises.fr",
      "Verifier que votre situation remplit les conditions du statut LMP",
      "Mettre en place une comptabilite reel BIC avec suivi des amortissements",
      "Vous affilier a la protection sociale independante si le statut LMP s'applique",
    ],
    delai_effectivite: "Des que les conditions du statut LMP sont remplies",
    fenetre_option: null,
    professionnel_requis: null,
    accompagnement_recommande: true,
    cout_demarche_estime: "Gratuit (demarche) - prevoir 900 a 2 500 EUR/an de comptabilite",
    lien_officiel: "https://www.impots.gouv.fr",
  }),
};
