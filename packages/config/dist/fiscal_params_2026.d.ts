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
export declare const FISCAL_PARAMS_2026: {
    readonly referentiels: {
        /**
         * Plafond Annuel de la Sécurité Sociale 2026 (€)
         * Arrêté du 22/12/2025 — revalorisation +2,0 % vs 2025.
         */
        readonly CFG_PASS_2026: 48060;
        /** Plafond Mensuel de la Sécurité Sociale 2026 (€) */
        readonly CFG_PMSS_2026: 4005;
        /** Plafond Trimestriel de la Sécurité Sociale 2026 (€) */
        readonly CFG_PTSS_2026: 12015;
        /** Plafond Journalier de la Sécurité Sociale 2026 (€) */
        readonly CFG_PJSS_2026: 220;
        /** Plafond Horaire de la Sécurité Sociale 2026 (€/h) */
        readonly CFG_PHSS_2026: 30;
        /**
         * SMIC horaire brut 2026 (€/h)
         * Source : Décret de revalorisation SMIC du 31/12/2025.
         */
        readonly CFG_SMIC_HORAIRE_2026: 12.02;
        /** SMIC mensuel brut 2026 (€) — base 35 h/semaine, 52 semaines */
        readonly CFG_SMIC_MENSUEL_BRUT_2026: number;
    };
    readonly micro: {
        /**
         * Seuil CA micro-BIC achat/revente (€ HT)
         * Revalorisation triennale +7,6 % vs période 2023-2025 (188 700 €).
         */
        readonly CFG_SEUIL_CA_MICRO_BIC_VENTE: 203100;
        /**
         * Seuil CA micro-BIC prestation de service (€ HT)
         * Revalorisation triennale +7,6 % vs période 2023-2025 (77 700 €).
         */
        readonly CFG_SEUIL_CA_MICRO_BIC_SERVICE: 83600;
        /**
         * Seuil CA micro-BNC libéral (€ HT)
         * Revalorisation triennale +7,6 % vs période 2023-2025 (77 700 €).
         */
        readonly CFG_SEUIL_CA_MICRO_BNC: 83600;
        /**
         * Seuil CA micro-BIC LMNP location meublée classique (€ HT)
         * Aligné sur le seuil BIC services — inchangé dans ce sous-segment.
         */
        readonly CFG_SEUIL_CA_MICRO_LMNP_CLASSIQUE: 83600;
        /**
         * Seuil CA micro-BIC meublé tourisme classé (€ HT)
         * Loi Le Meur n° 2024-1039 du 19/11/2024 : reclassification en « BIC services ».
         * Le seuil est donc aligné sur CFG_SEUIL_CA_MICRO_BIC_SERVICE, non plus sur la vente.
         */
        readonly CFG_SEUIL_CA_MICRO_MEUBLE_TOURISME_CLASSE: 83600;
        /**
         * Seuil CA micro-BIC meublé tourisme non classé (€ HT)
         * Loi Le Meur n° 2024-1039 du 19/11/2024 — seuil fixé à 15 000 €, non indexé.
         * Ce seuil n'est PAS revalorisé automatiquement.
         */
        readonly CFG_SEUIL_CA_MICRO_MEUBLE_TOURISME_NON_CLASSE: 15000;
        /**
         * Note sur les activités mixtes :
         * Le CA global ne doit pas dépasser 203 100 €, dont au plus 83 600 €
         * pour la part services/BNC. Le dépassement d'un seul seuil suffit
         * à exclure l'activité correspondante du régime micro.
         */
        readonly CFG_NOTE_ACTIVITES_MIXTES: "CA global ≤ 203 100 € HT, dont part services/BNC ≤ 83 600 € HT";
    };
    readonly tva: {
        /**
         * Seuil de franchise TVA BIC achat/revente (€ HT, CA N-1)
         * Inchangé depuis 2020 — seuil gelé (suppression revalorisation triennale LF 2024).
         */
        readonly CFG_SEUIL_TVA_FRANCHISE_BIC_VENTE: 85000;
        /**
         * Seuil de franchise TVA BIC prestation de service (€ HT, CA N-1)
         * Inchangé depuis 2025 (réforme Midy abrogée).
         */
        readonly CFG_SEUIL_TVA_FRANCHISE_BIC_SERVICE: 37500;
        /**
         * Seuil de franchise TVA BNC (€ HT, CA N-1)
         * Identique au seuil BIC services.
         */
        readonly CFG_SEUIL_TVA_FRANCHISE_BNC: 37500;
        /**
         * Seuil majoré de tolérance TVA BIC achat/revente (€ HT, CA N en cours)
         * Dépassement immédiat dès le 1er euro dépassant ce seuil.
         */
        readonly CFG_SEUIL_TVA_TOLERANCE_BIC_VENTE: 93500;
        /**
         * Seuil majoré de tolérance TVA BIC service (€ HT, CA N en cours)
         */
        readonly CFG_SEUIL_TVA_TOLERANCE_BIC_SERVICE: 41250;
        /**
         * Seuil majoré de tolérance TVA BNC (€ HT, CA N en cours)
         */
        readonly CFG_SEUIL_TVA_TOLERANCE_BNC: 41250;
        /**
         * Règle de sortie immédiate de la franchise TVA.
         * Depuis 2025 (loi Midy) : dès que le CA N dépasse le seuil majoré,
         * la TVA s'applique LE JOUR MÊME du dépassement (non rétroactif sur le mois).
         */
        readonly CFG_REGLE_SORTIE_IMMEDIATE_TVA: {
            readonly declencheur: "Dépassement du seuil majoré en cours d'année (N)";
            readonly effet: "Assujettissement TVA dès le jour du dépassement";
            readonly retroactivite: false;
            readonly note: "Changement vs ancien régime : l'assujettissement n'est plus au 1er du mois";
        };
        /**
         * Règle de sortie TVA l'année suivante.
         * Depuis 2025 : un seul dépassement du seuil de base suffit (suppression
         * de l'ancienne tolérance sur deux années consécutives).
         */
        readonly CFG_REGLE_SORTIE_TVA_ANNEE_SUIVANTE: {
            readonly declencheur: "CA N dépasse le seuil de base sans atteindre le seuil majoré";
            readonly effet: "Assujettissement TVA au 1er janvier N+1";
            readonly condition_annees: 1;
            readonly note: "Ancienne règle (2 ans consécutifs) supprimée par loi Midy 2025";
        };
        /**
         * Seuil TVA franchise artiste-auteur (€ HT, CA N-1)
         * Régime spécifique art. 293 B-II du CGI.
         */
        readonly CFG_SEUIL_TVA_ARTISTE_AUTEUR: 50000;
        /**
         * Seuil majoré de tolérance TVA artiste-auteur (€ HT, CA N en cours)
         */
        readonly CFG_SEUIL_TVA_TOLERANCE_ARTISTE_AUTEUR: 55000;
    };
    readonly vfl: {
        /**
         * Seuil de RFR par part fiscale N-2 pour éligibilité au VFL (€)
         * Correspond exactement à la limite supérieure de la 2e tranche IR 2026.
         * RFR 2024 apprécié sur l'avis d'imposition reçu en 2025.
         */
        readonly CFG_SEUIL_RFR_VFL_PAR_PART: 29315;
        /**
         * Formule de calcul du seuil RFR total éligible au VFL.
         * @param nbParts - Nombre de parts fiscales du foyer (QF)
         * @returns Seuil de RFR total au-delà duquel le VFL est interdit
         * @example nbParts=2 → seuil = 58 630 €
         */
        readonly CFG_FORMULE_SEUIL_RFR_VFL: (nbParts: number) => number;
        /** Taux VFL micro-BIC achat/revente (fraction du CA HT) */
        readonly CFG_TAUX_VFL_MICRO_BIC_VENTE: 0.01;
        /**
         * Taux VFL micro-BIC prestation de service (fraction du CA HT)
         * Note : meublé tourisme classé passe en BIC services (loi Le Meur) → ce taux s'y applique.
         */
        readonly CFG_TAUX_VFL_MICRO_BIC_SERVICE: 0.017;
        /** Taux VFL micro-BNC (fraction du CA HT) */
        readonly CFG_TAUX_VFL_MICRO_BNC: 0.022;
    };
    readonly abattements: {
        /** Abattement forfaitaire micro-BIC achat/revente */
        readonly CFG_ABATTEMENT_MICRO_BIC_VENTE: 0.71;
        /** Abattement forfaitaire micro-BIC prestation de service */
        readonly CFG_ABATTEMENT_MICRO_BIC_SERVICE: 0.5;
        /** Abattement forfaitaire micro-BNC libéral */
        readonly CFG_ABATTEMENT_MICRO_BNC: 0.34;
        /**
         * Abattement forfaitaire LMNP micro-BIC classique (location meublée longue durée)
         */
        readonly CFG_ABATTEMENT_MICRO_LMNP_CLASSIQUE: 0.5;
        /**
         * Abattement forfaitaire meublé tourisme classé
         * Loi Le Meur : reclassé en BIC services → taux 50 % (était 71 % avant 2025).
         */
        readonly CFG_ABATTEMENT_MICRO_MEUBLE_TOURISME_CLASSE: 0.5;
        /**
         * Abattement forfaitaire meublé tourisme non classé
         * Loi Le Meur : seuil abaissé à 15 000 €, taux d'abattement réduit à 30 %.
         * (était 50 % avant revenus 2025)
         */
        readonly CFG_ABATTEMENT_MICRO_MEUBLE_TOURISME_NON_CLASSE: 0.3;
        /**
         * Montant minimum d'abattement micro (€)
         * Plancher absolu en cas de CA très faible — art. 50-0 du CGI.
         * 305 € pour une activité, 610 € pour une activité mixte.
         */
        readonly CFG_MINIMUM_ABATTEMENT_MICRO: 305;
        readonly CFG_MINIMUM_ABATTEMENT_MICRO_MIXTE: 610;
        /**
         * Abattement forfaitaire sur traitements et salaires artiste-auteur (10 %)
         * Art. 83-3° du CGI — applicable sur les droits d'auteur déclarés en T&S.
         * Le contribuable peut opter pour les frais réels si ceux-ci dépassent 10 %.
         */
        readonly CFG_ABATTEMENT_TS_FORFAITAIRE_ARTISTE_AUTEUR: 0.1;
    };
    readonly social: {
        /**
         * Taux global de cotisations sociales micro-BIC achat/revente (sur CA HT)
         * Inclut : maladie, vieillesse de base et complémentaire, allocations familiales,
         * invalidité-décès, CSG-CRDS, CFP.
         */
        readonly CFG_TAUX_SOCIAL_MICRO_BIC_VENTE: 0.123;
        /** Taux global de cotisations sociales micro-BIC prestation de service (sur CA HT) */
        readonly CFG_TAUX_SOCIAL_MICRO_BIC_SERVICE: 0.212;
        /**
         * Taux global de cotisations sociales micro-BNC régime SSI (sur CA HT)
         * Décret n° 2025-943 — taux plafonné à 25,6 % (montée progressive,
         * hausse initialement prévue à 26,1 % repoussée).
         */
        readonly CFG_TAUX_SOCIAL_MICRO_BNC_SSI: 0.256;
        /**
         * Taux global de cotisations sociales micro-BNC régime CIPAV (sur CA HT)
         * Professions libérales réglementées relevant de la CIPAV.
         */
        readonly CFG_TAUX_SOCIAL_MICRO_BNC_CIPAV: 0.232;
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
        readonly CFG_TAUX_SOCIAL_RSPM: {
            readonly tranche_1: {
                readonly de: 0;
                readonly a: 19000;
                readonly taux: 0.135;
                readonly note: "Taux simplifié — interlocuteur unique RSPM pour Urssaf + retraite";
            };
            readonly tranche_2: {
                readonly de: 19001;
                readonly a: 38000;
                readonly taux: 0.212;
                readonly note: "Taux intermédiaire — maintien en RSPM (pas de bascule PAMC immédiate)";
            };
            readonly tranche_3: {
                readonly de: 38001;
                readonly a: null;
                readonly bascule: "Régime PAMC droit commun au 1er janvier de l'année suivante";
            };
            readonly cible: "Médecins remplaçants + médecins retraités en cumul emploi-retraite";
            readonly url_inscription: "www.medecins-remplacants.urssaf.fr";
        };
        /**
         * Barème détaillé des cotisations TNS (artisans, commerçants, PL non réglementées SSI)
         * Valeurs 2026 post-réforme assiette sociale unique (ASU).
         * Assiette = revenu professionnel net × 0,74 (abattement forfaitaire 26 %).
         *
         * Note : le taux effectif global varie de ~43-45 % pour des revenus autour du PASS
         * à ~40-41 % au-delà, en raison de la dégressivité de la maladie et des AF.
         */
        readonly CFG_TAUX_SOCIAL_TNS_BIC: {
            readonly maladie_maternite: {
                readonly libelle: "Assurance maladie-maternité";
                readonly tranches: TrancheCotisation[];
                readonly note: "Progressivité 0 % à 6,5 % — max au-delà de 1,1 PASS";
            };
            readonly indemnites_journalieres: {
                readonly libelle: "Indemnités journalières";
                readonly taux: 0.0085;
                readonly plafond_pass: 5;
                readonly note: "0,85 % plafonné à 5 PASS (240 300 €)";
            };
            readonly retraite_base_plafonnee: {
                readonly libelle: "Vieillesse de base plafonnée";
                readonly taux: 0.1775;
                readonly plafond_pass: 1;
                readonly note: "17,75 % dans la limite de 1 PASS";
            };
            readonly retraite_base_deplafonnee: {
                readonly libelle: "Vieillesse de base déplafonnée";
                readonly taux: 0.0072;
                readonly plafond_pass: null;
                readonly note: "0,72 % sur totalité du revenu";
            };
            readonly retraite_complementaire: {
                readonly libelle: "Retraite complémentaire SSI";
                readonly tranches: TrancheCotisation[];
                readonly note: "8,1 % ≤ 1 PASS, 9,1 % entre 1 et 4 PASS";
            };
            readonly invalidite_deces: {
                readonly libelle: "Invalidité-décès";
                readonly taux: 0.013;
                readonly plafond_pass: 1;
                readonly note: "1,3 % plafonné à 1 PASS";
            };
            readonly allocations_familiales: {
                readonly libelle: "Allocations familiales";
                readonly tranches: TrancheCotisation[];
                readonly note: "Progressif de 0 % à 3,1 %";
            };
            readonly csg_crds: {
                readonly libelle: "CSG-CRDS";
                readonly taux_total: 0.097;
                readonly taux_csg_deductible: 0.068;
                readonly taux_csg_non_deductible: 0.024;
                readonly taux_crds: 0.005;
                readonly assiette_abattement: 0.26;
                readonly note: "9,7 % sur assiette abattue de 26 % (même abattement que l'ASU)";
            };
            readonly cfp: {
                readonly libelle: "Contribution à la formation professionnelle";
                readonly taux_commercant: 0.0025;
                readonly taux_artisan: 0.0029;
                readonly assiette: "PASS entier (48 060 €)";
            };
            readonly note_generale: string;
        };
        /**
         * Taux de cotisations TNS BNC professions libérales non réglementées (SSI)
         * Identique au BIC pour les PL non réglementées.
         */
        readonly CFG_TAUX_SOCIAL_TNS_BNC_SSI: "Voir CFG_TAUX_SOCIAL_TNS_BIC — barème identique pour PL SSI";
        /**
         * Barème CIPAV — professions libérales réglementées (architectes, géomètres, experts-comptables,
         * consultants, formateurs, psychologues, ostéopathes, etc.)
         * Source : urssaf.fr mis à jour 27/02/2026 + CARPV guide 2026
         * Entrée en vigueur : avril 2026 (régularisation revenus 2025)
         */
        readonly CFG_TAUX_SOCIAL_TNS_CIPAV: {
            readonly maladie_maternite: {
                readonly libelle: "Assurance maladie-maternité CIPAV";
                readonly tranches: readonly [{
                    readonly de_pass: 0;
                    readonly a_pass: 0.2;
                    readonly taux: 0;
                }, {
                    readonly de_pass: 0.2;
                    readonly a_pass: 0.4;
                    readonly taux_progressif: "0 % à 1,5 %";
                }, {
                    readonly de_pass: 0.4;
                    readonly a_pass: 0.6;
                    readonly taux_progressif: "1,5 % à 4 %";
                }, {
                    readonly de_pass: 0.6;
                    readonly a_pass: 1.1;
                    readonly taux_progressif: "4 % à 6,5 %";
                }, {
                    readonly de_pass: 1.1;
                    readonly a_pass: 2;
                    readonly taux_progressif: "6,5 % à 7,7 %";
                }, {
                    readonly de_pass: 2;
                    readonly a_pass: 3;
                    readonly taux_progressif: "7,7 % à 8,5 %";
                }, {
                    readonly de_pass: 3;
                    readonly a_pass: null;
                    readonly taux: 0.065;
                }];
                readonly note: "Même barème que SSI post-réforme ASU. Taux plein unifié à 8,5 % (sauf au-delà de 3 PASS : 6,5 %)";
            };
            readonly indemnites_journalieres: {
                readonly taux: 0.003;
                readonly plafond_pass: 3;
                readonly assiette_minimale_pass: 0.4;
                readonly note: "0,30 % ≤ 3 PASS (144 180 €) — assiette minimale 40 % PASS";
            };
            readonly retraite_base: {
                readonly taux_t1: 0.0873;
                readonly plafond_t1_pass: 1;
                readonly taux_t2: 0.0187;
                readonly plafond_t2_pass: 5;
                readonly note: "8,73 % ≤ 1 PASS + 1,87 % ≤ 5 PASS — barème post-réforme ASU (hausse de 8,23 % à 8,73 %)";
            };
            readonly retraite_complementaire: {
                readonly taux_t1: 0.11;
                readonly plafond_t1_pass: 1;
                readonly taux_t2: 0.21;
                readonly plafond_t2_pass: 4;
                readonly note: "11 % ≤ 1 PASS + 21 % de 1 à 4 PASS — barème post-réforme ASU (était 9 % / 22 %)";
            };
            readonly invalidite_deces: {
                readonly taux: 0.005;
                readonly plafond_pass: 1.85;
                readonly note: "0,50 % ≤ 1,85 PASS (88 911 €)";
            };
            readonly allocations_familiales: {
                readonly tranches: readonly [{
                    readonly de_pass: 0;
                    readonly a_pass: 1.1;
                    readonly taux: 0;
                }, {
                    readonly de_pass: 1.1;
                    readonly a_pass: 1.4;
                    readonly taux_progressif: "0 % à 3,1 %";
                }, {
                    readonly de_pass: 1.4;
                    readonly a_pass: null;
                    readonly taux: 0.031;
                }];
                readonly note: "Identique SSI — seuil déclenchement 110 % PASS (52 866 €)";
            };
            readonly csg_crds: {
                readonly taux_total: 0.097;
                readonly note: "Identique SSI — sur assiette abattue 26 %";
            };
            readonly cfp: {
                readonly taux: 0.0025;
                readonly taux_avec_conjoint_collaborateur: 0.0034;
                readonly assiette: "PASS entier (48 060 €)";
                readonly montant_annuel: 120;
                readonly montant_annuel_avec_conjoint: 163;
            };
            readonly cotisations_minimales: {
                readonly retraite_base: {
                    readonly assiette: 5409;
                    readonly taux: 0.0873;
                    readonly montant: 573;
                    readonly trimestres_valides: 3;
                    readonly note: "Assiette minimale = 450 × SMIC horaire (450 × 12,02 €)";
                };
                readonly ij_maladie: {
                    readonly assiette_pass: 0.4;
                    readonly taux: 0.003;
                    readonly montant: 58;
                };
                readonly invalidite_deces: {
                    readonly assiette_pass: 0.37;
                    readonly taux: 0.005;
                    readonly montant: 89;
                };
                readonly cfp: {
                    readonly montant: 120;
                };
            };
            readonly cotisation_forfaitaire_debut_activite: {
                readonly assiette: 9131;
                readonly fraction_pass: 0.19;
                readonly note: "Deux premières années : 19 % PASS. Réduction ACRE applicable sur certaines cotisations.";
            };
        };
        /**
         * Tableau détaillé des cotisations sociales assimilé-salarié 2026.
         * Arrêté du 22/12/2025 — taux de droit commun.
         *
         * Coût total employeur estimé : 62-80 % de la rémunération brute selon le niveau.
         * Ratio net / coût total : ~55-60 % selon tranche de salaire.
         *
         * Les présidents de SASU ne cotisent PAS à l'assurance chômage (pas de droit ARE).
         */
        readonly CFG_TAUX_SOCIAL_ASSIMILE_SALARIE: {
            readonly lignes: CotisationLigne[];
            readonly note_president_sasu: string;
        };
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
        readonly CFG_COTISATIONS_MINIMALES_TNS_SSI: {
            readonly maladie_maternite: {
                readonly assiette_minimale: null;
                readonly taux: 0;
                readonly montant: 0;
                readonly note: "Pas d'assiette minimale — taux 0 % si revenus < 20 % PASS";
            };
            readonly indemnites_journalieres: {
                readonly assiette_minimale: number;
                readonly taux: 0.005;
                readonly montant: number;
                readonly note: "40 % PASS × 0,50 %";
            };
            readonly allocations_familiales: {
                readonly assiette_minimale: null;
                readonly taux: 0;
                readonly montant: 0;
                readonly note: "Pas de cotisation minimale — taux 0 % si revenus < 110 % PASS";
            };
            readonly retraite_base: {
                readonly assiette_minimale: number;
                readonly taux: 0.1787;
                readonly montant: number;
                readonly trimestres_valides: 3;
                readonly note: "450 × SMIC horaire × 17,87 % — permet 3 trimestres de retraite";
            };
            readonly invalidite_deces: {
                readonly assiette_minimale: number;
                readonly taux: 0.013;
                readonly montant: number;
                readonly note: "11,5 % PASS × 1,30 %";
            };
            readonly csg_crds: {
                readonly assiette_minimale: null;
                readonly taux: 0.097;
                readonly montant: 0;
                readonly note: "Pas d'assiette minimale — 0 € si résultat nul";
            };
            readonly total_minimal_hors_cfp: number;
            readonly note: string;
        };
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
        readonly CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR: {
            readonly abattement_forfaitaire: 0.26;
            readonly plancher: {
                readonly fraction_pass: 0.0176;
                readonly valeur_2026: number;
                readonly note: "1,76 % du PASS = 845,86 € — cotisation minimale en cas de résultat très faible";
            };
            readonly plafond: {
                readonly fraction_pass: 1.3;
                readonly valeur_2026: number;
                readonly note: "130 % du PASS = 62 478 € — plafond de l'abattement";
            };
            readonly formule: "Assiette = max(plancher, min(revenu_professionnel × 0.74, plafond))";
            readonly assiette_unique: true;
            readonly note: string;
        };
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
        readonly CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_TNS: {
            readonly seuil_franchise: {
                readonly fraction: 0.1;
                readonly base: "capital_social + primes_emission + solde_moyen_annuel_CCA";
                readonly appreciation_capital: "Dernier jour de l'exercice précédant la distribution";
                readonly appreciation_cca: "Moyenne des 12 soldes mensuels de l'exercice";
            };
            readonly fraction_soumise_cotisations: "max(0, dividendes_distribues − seuil_franchise)";
            readonly fraction_hors_franchise_regime: "Cotisations TNS (même barème que rémunération)";
            readonly prelevements_sociaux_sur_franchise: 0.186;
            readonly note: "Art. L.131-6 CSS — applicable EURL, SARL, SELARL gérant majoritaire";
        };
        /**
         * Règles d'assujettissement des dividendes pour assimilé-salarié (SASU/SELAS).
         * LFSS 2026 : hausse CSG +1,4 pt sur revenus du capital → PS à 18,6 %.
         * Aucune réforme actée en 2026 sur le régime des dividendes assimilé-salarié.
         *
         * Les dividendes du président SASU sont soumis aux prélèvements sociaux (18,6 %),
         * mais JAMAIS aux cotisations sociales (quel que soit le montant).
         */
        readonly CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_ASSIMILE: {
            readonly soumis_cotisations_sociales: false;
            readonly soumis_prelevements_sociaux: true;
            readonly taux_prelevements_sociaux_2026: 0.186;
            readonly pfu_total_2026: 0.314;
            readonly detail_pfu: {
                readonly ir: 0.128;
                readonly ps: 0.186;
            };
            readonly note: string;
        };
        /**
         * Seuil de revenus d'activité en dessous duquel la CSM (taxe PUMa) peut s'appliquer.
         * Condition 1 : revenus d'activité < 20 % PASS = 9 612 €
         * Condition 2 : revenus du patrimoine > 50 % PASS = 24 030 €
         * Condition 3 : absence de revenus de remplacement (retraite, ARE, etc.)
         */
        readonly CFG_SEUIL_PUMA: {
            readonly seuil_activite_insuffisante: number;
            readonly seuil_patrimoine_declencheur: number;
            readonly plafond_assiette: number;
            readonly note: "Les deux seuils sont cumulatifs. Exonération si conjoint a revenus > 20 % PASS.";
        };
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
        readonly CFG_FORMULE_TAXE_PUMA: {
            readonly taux: 0.065;
            readonly formule: "T = 0.065 × (A − 0.5 × PASS) × (1 − R / (0.2 × PASS))";
            readonly variables: {
                readonly A: "Revenus du patrimoine et du capital, plafonnés à 8 PASS (384 480 €)";
                readonly R: "Revenus d'activité professionnelle — si R ≥ 9 612 €, T = 0";
            };
            readonly deductibilite_ir: true;
            readonly calendrier: "Appel URSSAF en novembre de l'année N sur revenus N-1";
        };
    };
    readonly sante: {
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
        readonly CFG_BAREME_MALADIE_PAMC_UNIFIE: {
            readonly sur_assiette_participation_cpam: {
                readonly libelle: "Assurance maladie sur assiette de participation CPAM (revenus conventionnés)";
                readonly tranches: readonly [{
                    readonly de_pass: 0;
                    readonly a_pass: 0.2;
                    readonly taux: 0;
                }, {
                    readonly de_pass: 0.2;
                    readonly a_pass: 3;
                    readonly taux_progressif: "0 % à 8,50 %";
                }, {
                    readonly de_pass: 3;
                    readonly a_pass: null;
                    readonly taux: 0.065;
                }];
                readonly prise_en_charge_cpam: {
                    readonly secteur_1: "Taux progressif : entre 0 % et 8,40 %";
                    readonly secteur_2_optam: "Taux progressif : entre 0 % et 8,40 % (sur part conventionnée)";
                    readonly secteur_2_non_optam: "0 % (aucune prise en charge)";
                    readonly auxiliaires_medicaux_s1: "Taux progressif : entre 0 % et 8,40 %";
                };
                readonly seuil_bas: number;
                readonly seuil_haut: number;
                readonly note: "Prise en charge CPAM quasi-totale pour S1 — reste net praticien ≈ 0,10 %";
            };
            readonly sur_reste_revenu_non_salarie: {
                readonly libelle: "Assurance maladie sur reste du revenu d'activité non salarié (non conventionné)";
                readonly tranches: readonly [{
                    readonly de_pass: 0;
                    readonly a_pass: 0.2;
                    readonly taux: 0.0325;
                }, {
                    readonly de_pass: 0.2;
                    readonly a_pass: 3;
                    readonly taux_progressif: "3,25 % à 11,75 %";
                }, {
                    readonly de_pass: 3;
                    readonly a_pass: null;
                    readonly taux: 0.0975;
                }];
                readonly prise_en_charge_cpam: "0 % — aucune prise en charge CPAM sur cette assiette";
                readonly note: "Taux de 3,25 % plancher (contribution additionnelle sur dépassements/revenus non conventionnés)";
            };
        };
        /**
         * Taux de cotisation maladie secteur 1 (synthèse opérationnelle)
         * Pour le calcul du moteur : utiliser CFG_BAREME_MALADIE_PAMC_UNIFIE
         */
        readonly CFG_TAUX_MALADIE_SECTEUR_1: {
            readonly regime: "PAMC S1 — voir CFG_BAREME_MALADIE_PAMC_UNIFIE";
            readonly taux_brut_max_assiette_cpam: 0.085;
            readonly prise_en_charge_cpam_max: 0.084;
            readonly taux_net_praticien_min: 0.001;
            readonly taux_non_conventionne: 0.0325;
            readonly note: "Prise en charge CPAM quasi-totale sur revenus conventionnés S1";
        };
        /**
         * Taux cotisation maladie secteur 2 OPTAM (synthèse)
         */
        readonly CFG_TAUX_MALADIE_SECTEUR_2_OPTAM: {
            readonly regime: "PAMC S2-OPTAM — voir CFG_BAREME_MALADIE_PAMC_UNIFIE";
            readonly taux_brut_max_assiette_cpam: 0.085;
            readonly prise_en_charge_cpam_max: 0.084;
            readonly taux_depassements: 0.0325;
            readonly note: "Prise en charge CPAM sur part conventionnée — même barème que S1";
        };
        /**
         * Taux cotisation maladie secteur 2 non-OPTAM (synthèse)
         */
        readonly CFG_TAUX_MALADIE_SECTEUR_2_NON_OPTAM: {
            readonly regime: "PAMC S2-non-OPTAM — voir CFG_BAREME_MALADIE_PAMC_UNIFIE";
            readonly taux_brut_max: 0.085;
            readonly prise_en_charge_cpam: 0;
            readonly taux_depassements: 0.0325;
            readonly note: "Aucune prise en charge CPAM — taux identique en brut mais entièrement à charge";
        };
        /**
         * Taux cotisation maladie hors convention / secteur 3
         */
        readonly CFG_TAUX_MALADIE_HORS_CONVENTION: {
            readonly taux_brut: 0.085;
            readonly taux_supplement: 0.0325;
            readonly taux_effectif_total: 0.1175;
            readonly prise_en_charge_cpam: 0;
            readonly note: "Taux plein sans aide — maximum 11,75 % sur revenus > 300 % PASS";
        };
        /**
         * Contributions CURPS (Unions régionales professionnels de santé) 2026
         * Source : urssaf.fr PAMC 20/03/2026
         */
        readonly CFG_CURPS: {
            readonly medecins: {
                readonly taux: 0.005;
                readonly plafond_annuel: 240;
            };
            readonly chirurgiens_dentistes: {
                readonly taux: 0.003;
                readonly plafond_annuel: 240;
            };
            readonly auxiliaires_medicaux: {
                readonly taux: 0.001;
                readonly plafond_annuel: 240;
            };
            readonly sages_femmes: {
                readonly taux: 0.001;
                readonly plafond_annuel: 240;
            };
            readonly note: "Contribution aux unions régionales professionnels de santé — 0,50 % médecins / 0,10 % auxiliaires";
        };
        /**
         * Paramètres de l'aide CPAM sur la cotisation maladie (PAMC).
         * Secteur 1 et secteur 2 OPTAM uniquement.
         */
        readonly CFG_PARAM_AIDE_CPAM_MALADIE: {
            readonly beneficiaires: readonly ["secteur_1", "secteur_2_optam"];
            readonly taux_prise_en_charge: 0.064;
            readonly assiette: "Honoraires conventionnés (rémunération hors dépassements)";
            readonly note: "Prise en charge quasi-totale — reste 0,10 % à charge du praticien S1/S2-OPTAM";
        };
        /**
         * Cotisations CARMF médecins 2026 — Source : CARMF barème 2026 officiel
         * Post-réforme ASU : assiette = revenus nets d'activité indépendante N-2
         */
        readonly CFG_CARMF_2026: {
            readonly retraite_base: {
                readonly taux_t1: 0.0873;
                readonly plafond_t1: 48060;
                readonly taux_t2: 0.0187;
                readonly plafond_t2: number;
                readonly cotisation_maximale: number;
                readonly note: "8,73 % ≤ 1 PASS + 1,87 % ≤ 5 PASS — cotisation max calculée";
            };
            readonly retraite_complementaire: {
                readonly taux: 0.118;
                readonly plafond: number;
                readonly note: "11,80 % ≤ 3,5 PASS (168 210 €) — hausse de 10,20 % à 11,80 % post-réforme";
            };
            readonly invalidite_deces: {
                readonly montant_minimum: 626;
                readonly montant_maximum: 1010;
                readonly formule_variable: "434 + (revenus × 0,32 %) + (revenus × 0,08 %)";
                readonly tranche_minimum: 48060;
                readonly tranche_maximum: number;
                readonly note: "626 € si revenus < 1 PASS, variable entre 1 et 3 PASS, 1 010 € si > 3 PASS";
            };
            readonly participation_cpam_retraite_base: {
                readonly tranche_1: {
                    readonly de: 0;
                    readonly a: number;
                    readonly taux_cpam: 0.0215;
                };
                readonly tranche_2: {
                    readonly de: number;
                    readonly a: number;
                    readonly taux_cpam: 0.0151;
                };
                readonly tranche_3: {
                    readonly de: number;
                    readonly a: null;
                    readonly taux_cpam: 0.0112;
                };
                readonly note: "Participation CPAM sur cotisation retraite base secteur 1 uniquement";
            };
            readonly asv: {
                readonly part_forfaitaire_secteur_1_medecin: 1917;
                readonly part_forfaitaire_secteur_1_cpam: 3834;
                readonly part_forfaitaire_secteur_1_total: 5751;
                readonly part_forfaitaire_secteur_2_medecin: 5751;
                readonly part_forfaitaire_secteur_2_cpam: 0;
                readonly ajustement_taux_secteur_1_medecin: 0.013333;
                readonly ajustement_taux_secteur_1_cpam: 0.025333;
                readonly ajustement_taux_secteur_2_medecin: 0.04;
                readonly ajustement_taux_secteur_2_cpam: 0;
                readonly plafond_assiette: number;
                readonly seuil_proportionnalite_integrale: 63900;
            };
        };
        /**
         * CARPIMKO — cotisations kinésithérapeutes, infirmiers, orthophonistes, orthoptistes.
         * Source : carpimko.com — guide cotisations 2026
         * Retraite de base : identique à tous les PAMC (CARMF, CARCDSF, CARPV).
         */
        readonly CFG_CARPIMKO_2026: {
            readonly retraite_base: {
                readonly taux_t1: 0.0873;
                readonly plafond_t1: 48060;
                readonly taux_t2: 0.0187;
                readonly plafond_t2: number;
                readonly note: "Identique à CARMF/CIPAV/CARCDSF — barème CNAVPL unifié";
            };
            readonly retraite_complementaire: {
                readonly taux: 0.087;
                readonly assiette_min_pass: 0.5;
                readonly assiette_max_pass: 3;
                readonly montant_min_2026: number;
                readonly montant_max_2026: number;
                readonly note: "8,70 % sur assiette entre 0,5 et 3 PASS";
            };
            readonly asv: {
                readonly forfait_total: 671;
                readonly part_adherent: 224;
                readonly part_cpam: 447;
                readonly taux_proportionnel: 0.004;
                readonly assiette_proportionnel: "Assiette sociale conventionnée 2025";
                readonly note: "2/3 financé par CPAM — identique structure à CARMF secteur 1";
            };
            readonly invalidite_deces: {
                readonly montant_forfaitaire: 1022;
                readonly note: "Forfait dû même en cas d'arrêt de travail RID depuis 01/01/2025";
            };
        };
        /**
         * CARCDSF — chirurgiens-dentistes et sages-femmes conventionnées.
         * Source : carcdsf.fr — cotisations 2026
         */
        readonly CFG_CARCDSF_2026: {
            readonly retraite_base: {
                readonly taux_t1: 0.0873;
                readonly plafond_t1: 48060;
                readonly taux_t2: 0.0187;
                readonly plafond_t2: number;
                readonly note: "Identique à CARMF/CIPAV/CARPIMKO/CARPV — barème CNAVPL unifié";
                readonly cotisation_minimale: {
                    readonly assiette: number;
                    readonly taux: 0.0873;
                    readonly montant: number;
                    readonly trimestres_valides: 3;
                };
            };
            readonly retraite_complementaire: {
                readonly forfait: 3210.6;
                readonly taux_proportionnel: 0.1135;
                readonly assiette_min: number;
                readonly assiette_max: number;
                readonly reduction_si_revenus_inferieurs_seuil: {
                    readonly seuil: number;
                    readonly coefficient: "revenus / seuil";
                    readonly note: "Réduction de la cotisation forfaitaire si revenus < 65 % PASS (31 239 €)";
                };
                readonly note: "3 210,60 € forfait + 11,35 % sur revenus entre 31 239 € et 240 300 €";
            };
            readonly pcv_dentistes: {
                readonly libelle: "Prestations Complémentaires de Vieillesse — dentistes conventionnés";
                readonly financement_cpam: number;
                readonly financement_praticien: number;
                readonly note: "Régime spécifique conventionnés — paramètres détaillés sur carcdsf.fr";
            };
            readonly pcv_sages_femmes: {
                readonly libelle: "Prestations Complémentaires de Vieillesse — sages-femmes conventionnées";
                readonly note: "Paramètres spécifiques sur carcdsf.fr";
            };
            readonly invalidite_deces_sages_femmes: {
                readonly montant_forfaitaire: 384;
                readonly note: "Forfait 2026 — dentistes : voir carcdsf.fr pour montant spécifique";
            };
        };
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
        readonly CFG_PARAM_AIDE_CPAM_RETRAITE: {
            readonly renvoi: "CFG_CARMF_2026.asv — données complètes et non dupliquées";
            readonly asv_seuil_proportionnalite_integrale: 63900;
            readonly asv_plafond_assiette: number;
            readonly note: "Source : CARMF barème 2026";
        };
        /**
         * Déduction Groupe III — frais de représentation médicale.
         * Applicable en régime réel BNC Secteur 1 (déclaration 2035).
         * BOFiP BOI-BNC-SECT-40 § 170.
         */
        readonly CFG_PARAM_DEDUCTION_GROUPE_III: {
            readonly libelle: "Abattement forfaitaire représentation médicale (Groupe III)";
            readonly taux_sur_honoraires_conventionnels: 0.02;
            readonly montant_maximum: 3050;
            readonly note: string;
        };
        /**
         * Déduction complémentaire santé — 3 % des honoraires conventionnels.
         * BOFiP BOI-BNC-SECT-40 — applicable secteur 1 et 2 OPTAM.
         * Attention : purement fiscale — l'URSSAF réintègre ces abattements dans l'assiette sociale.
         */
        readonly CFG_PARAM_DEDUCTION_COMPLEMENTAIRE_SANTE: {
            readonly libelle: "Déduction complémentaire frais spécifiques (3 %)";
            readonly taux_sur_honoraires_conventionnels: 0.03;
            readonly beneficiaires: readonly ["secteur_1", "secteur_2_optam"];
            readonly impact_assiette_sociale: "NON — réintégrée par l'URSSAF dans l'assiette TNS";
            readonly note: "Déduction purement fiscale sur 2035. Cumulable avec Groupe I, II et III.";
        };
        /**
         * Aides à l'installation en zones sous-denses — Convention médicale 2024-2029.
         * Remplace les anciens contrats CAIM (50 000 € sur 5 ans).
         */
        readonly CFG_PARAM_ZIP_ZAC_MONTANT_FORFAITAIRE: {
            readonly primo_installation_zip: 10000;
            readonly primo_installation_zac: 5000;
            readonly cabinet_secondaire_zip: 3000;
            readonly consultations_avancees_zip_par_demi_journee: 200;
            readonly consultations_avancees_zip_max_par_mois: 6;
            readonly note: string;
        };
        /**
         * Avantage Social Vieillesse — règles de financement CPAM/praticien.
         * Voir CFG_PARAM_AIDE_CPAM_RETRAITE pour les montants détaillés.
         */
        readonly CFG_REGLES_ASV: {
            readonly part_cpam_secteur_1: number;
            readonly part_praticien_secteur_1: number;
            readonly part_cpam_secteur_2: 0;
            readonly part_praticien_secteur_2: 1;
            readonly description: "Avantage Social Vieillesse — cotisation forfaitaire médecins CARMF";
            readonly renvoi: "CFG_PARAM_AIDE_CPAM_RETRAITE pour les montants 2026";
        };
        /**
         * Régime PAMC — Praticiens et Auxiliaires Médicaux Conventionnés.
         * Composantes de cotisations URSSAF 2026.
         */
        readonly CFG_REGLES_PAMC: {
            readonly maladie_taux_brut: 0.065;
            readonly contribution_additionnelle_depassements: 0.0325;
            readonly allocations_familiales: {
                readonly tranches: TrancheCotisation[];
            };
            readonly csg_taux: 0.092;
            readonly crds_taux: 0.005;
            readonly indemnites_journalieres_taux: 0.003;
            readonly cfp_taux: 0.0025;
            readonly curps_taux: 0.001;
            readonly assiette_asu: {
                readonly formule: "(recettes − charges_hors_cotisations) × 0.74";
                readonly note: "Réforme ASU effective 2025 pour PAMC — même abattement 26 % que TNS";
            };
            readonly note: "Taux auxiliaires médicaux (infirmiers, kiné, orthophonistes) — source URSSAF PAMC 2026";
        };
    };
    readonly culture: {
        /**
         * Structure des cotisations sociales artiste-auteur 2026.
         * Assiette :
         *   - BNC micro : recettes × (1 − 0,34) × 1,15 (abattement forfaitaire + majoration 15 %)
         *   - BNC réel : bénéfice × 1,15
         *   - T&S : 98,25 % du revenu si ≤ 4 PASS (192 240 €), 100 % au-delà
         */
        readonly CFG_TAUX_COTISATIONS_ARTISTE_AUTEUR: {
            readonly vieillesse_deplafonnee: {
                readonly taux_nominal: 0.004;
                readonly part_prise_en_charge_etat: 0.004;
                readonly taux_net_auteur: 0;
                readonly note: "Totalité prise en charge par l'État";
            };
            readonly vieillesse_plafonnee: {
                readonly taux_nominal: 0.069;
                readonly part_prise_en_charge_etat: 0.0075;
                readonly taux_net_auteur: 0.0615;
                readonly plafond: 48060;
                readonly note: "6,90 % − 0,75 pt pris en charge = net auteur 6,15 %";
            };
            readonly csg: {
                readonly taux: 0.092;
                readonly assiette: "98,25 % du revenu si ≤ 4 PASS, 100 % au-delà";
            };
            readonly crds: {
                readonly taux: 0.005;
                readonly assiette: "98,25 % du revenu si ≤ 4 PASS, 100 % au-delà";
            };
            readonly cfp: {
                readonly taux: 0.0035;
                readonly assiette: "Totalité des revenus artistiques";
            };
            readonly seuil_validation_trimestre_retraite: number;
            readonly seuil_validation_annee_complete_retraite: number;
        };
        /**
         * Seuil d'affiliation obligatoire au RAAP (retraite complémentaire IRCEC)
         * Calculé sur la base du SMIC horaire : 900 heures × SMIC_horaire.
         */
        readonly CFG_SEUIL_RAAP: number;
        /** Taux RAAP normal (cotisation retraite complémentaire artiste-auteur) */
        readonly CFG_TAUX_RAAP_NORMAL: 0.08;
        /**
         * Taux RAAP réduit (option sur demande avant le 30 novembre de l'année)
         * Condition : assiette sociale ≤ 3 × CFG_SEUIL_RAAP
         */
        readonly CFG_TAUX_RAAP_REDUIT: 0.04;
        /**
         * Règles détaillées d'affiliation et de calcul RAAP.
         */
        readonly CFG_REGLE_AFFILIATION_RAAP: {
            readonly seuil_affiliation: number;
            readonly formule_seuil: "900 × SMIC_horaire";
            readonly plafond_assiette: number;
            readonly cotisation_maximale_taux_normal: number;
            readonly date_option_taux_reduit: "30 novembre de l'année N pour effet N";
            readonly condition_taux_reduit: "Assiette sociale ≤ 3 × seuil_affiliation";
            readonly note: "Affiliation obligatoire si revenus artistiques N-1 ≥ seuil. Source : IRCEC 2026.";
        };
    };
    readonly immobilier: {
        /**
         * Seuil de recettes locatives meublées annuelles pour qualification LMP (€)
         * Condition 1 (ce seuil). Condition 2 : recettes > autres revenus d'activité du foyer.
         */
        readonly CFG_SEUIL_LMP_RECETTES: 23000;
        /**
         * Formule de qualification LMP — condition de prédominance des recettes.
         * Les revenus à comparer côté « autres activités » incluent : salaires nets imposables,
         * BIC, BNC, BA, pensions de retraite. Sont EXCLUS : fonciers, dividendes, RCM.
         */
        readonly CFG_FORMULE_CRITERE_LMP_PAR_RAPPORT_AUX_AUTRES_REVENUS: {
            readonly condition: "recettes_location_meublee > revenus_activite_professionnelle_foyer";
            readonly revenus_inclus_comparaison: readonly ["salaires_nets_imposables", "BIC_autres", "BNC_autres", "BA", "pensions_retraite"];
            readonly revenus_exclus_comparaison: readonly ["revenus_fonciers", "dividendes", "revenus_capitaux_mobiliers"];
            readonly proratisation_exercice_incomplet: true;
            readonly note: "Les deux conditions (seuil 23 000 € ET prédominance) sont cumulatives";
        };
        /**
         * Taux de cotisations SSI pour loueur en meublé professionnel (LMP).
         * Le LMP relève du même barème TNS BIC que les artisans/commerçants.
         * Le moteur DOIT calculer les cotisations branche par branche via CFG_TAUX_SOCIAL_TNS_BIC —
         * il ne doit pas utiliser de taux effectif global approximatif.
         * Cotisation minimale : voir CFG_COTISATIONS_MINIMALES_TNS_SSI (même règles).
         */
        readonly CFG_TAUX_SOCIAL_LMP_SSI: {
            readonly regime: "TNS_SSI — barème identique artisans/commerçants";
            readonly renvoi_bareme: "CFG_TAUX_SOCIAL_TNS_BIC";
            readonly renvoi_minimales: "CFG_COTISATIONS_MINIMALES_TNS_SSI";
            readonly note: "Ne pas utiliser de taux effectif global — calculer branche par branche";
        };
        /**
         * Règles d'amortissement LMNP en régime réel.
         * Méthode linéaire par composants — art. 39 CGI adapté.
         * Le TERRAIN n'est jamais amortissable.
         *
         * Note : deux sources divergent légèrement sur les durées.
         * Les durées BOFIP (BOI-BIC-AMT) sont retenues en priorité.
         * Le seuil d'immobilisation à 500 € HT est retenu (prudence vs 600 € BOFIP 2022).
         */
        readonly CFG_REGLES_AMORTISSEMENT_LMNP_REEL: {
            readonly terrain: {
                readonly amortissable: false;
                readonly note: "Le terrain est toujours exclu de l'amortissement";
            };
            readonly composants: readonly [{
                readonly libelle: "Structure / gros œuvre";
                readonly part_valeur_estimee: {
                    readonly min: 0.35;
                    readonly max: 0.5;
                };
                readonly duree_ans: {
                    readonly min: 25;
                    readonly max: 40;
                };
                readonly note: "Source BOFIP BOI-BIC-AMT — durée préférentielle 30-40 ans pour résidentiel";
            }, {
                readonly libelle: "Toiture";
                readonly part_valeur_estimee: {
                    readonly min: 0.05;
                    readonly max: 0.1;
                };
                readonly duree_ans: {
                    readonly min: 15;
                    readonly max: 25;
                };
            }, {
                readonly libelle: "Installations techniques (chauffage, électricité, plomberie)";
                readonly part_valeur_estimee: {
                    readonly min: 0.1;
                    readonly max: 0.15;
                };
                readonly duree_ans: {
                    readonly min: 10;
                    readonly max: 20;
                };
            }, {
                readonly libelle: "Aménagements intérieurs (cloisons, revêtements)";
                readonly part_valeur_estimee: {
                    readonly min: 0.15;
                    readonly max: 0.3;
                };
                readonly duree_ans: {
                    readonly min: 8;
                    readonly max: 12;
                };
            }, {
                readonly libelle: "Mobilier (literie, électroménager, mobilier courant)";
                readonly part_valeur_estimee: null;
                readonly duree_ans: {
                    readonly min: 5;
                    readonly max: 10;
                };
                readonly detail: "Literie ~6 ans, électroménager ~5 ans, mobilier ~10 ans";
            }, {
                readonly libelle: "Travaux d'amélioration";
                readonly part_valeur_estimee: null;
                readonly duree_ans: {
                    readonly min: 10;
                    readonly max: 25;
                };
                readonly note: "Selon nature : 10 ans si équipement, 25 ans si structure";
            }];
            readonly seuil_immobilisation: {
                readonly valeur_ht: 500;
                readonly note: string;
            };
            readonly regle_art_39_c: {
                readonly principe: "L'amortissement ne peut pas créer ni augmenter un déficit BIC non professionnel";
                readonly formule: string;
                readonly excedent: "Amortissements réputés différés (ARD) — reportables sans limite de durée";
                readonly application: "LMNP uniquement. LMP : amortissements intégralement déductibles.";
            };
        };
        /**
         * Règles de déductibilité des charges LMNP au régime réel.
         * Art. 39 du CGI adapté.
         */
        readonly CFG_REGLES_DEDUCTIBILITE_CHARGES_LMNP: {
            readonly charges_deductibles: readonly ["Intérêts d'emprunt (y compris assurance emprunteur et frais de dossier)", "Travaux d'entretien et réparation (si < 500 € HT, déductible directement)", "Charges de copropriété non récupérables sur le locataire (hors fonds ALUR)", "Taxe foncière (hors TEOM qui doit être récupérée sur le locataire)", "Contribution Foncière des Entreprises (CFE)", "Honoraires comptables et frais de gestion", "Frais d'agence (mise en location et gestion courante)", "Assurance PNO (propriétaire non occupant)", "Frais de procédure (contentieux locatif)"];
            readonly deficit_bic_non_professionnel: {
                readonly imputation: "Sur BIC non professionnel uniquement (pas sur revenu global)";
                readonly report: "10 ans — art. 156 I-1° bis du CGI";
            };
            readonly deficit_lmp: {
                readonly imputation: "Sur revenu global sans limitation";
                readonly note: "Avantage majeur du statut LMP vs LMNP";
            };
        };
        /**
         * Règles de plus-values LMNP — régime des particuliers (art. 150 U CGI).
         * LF 2025 art. 84 : réintégration des amortissements dans le calcul de la PV.
         * Applicable aux cessions à compter du 15/02/2025.
         */
        readonly CFG_REGLES_PLUS_VALUES_LMNP: {
            readonly regime: "Particuliers — art. 150 U du CGI";
            readonly taux_ir: 0.19;
            readonly taux_ps: 0.172;
            readonly taux_total_base: 0.362;
            readonly surtaxe: {
                readonly seuil: 50000;
                readonly taux_min: 0.02;
                readonly taux_max: 0.06;
                readonly note: "Surtaxe progressive sur PV nette > 50 000 €";
            };
            readonly reforme_lf_2025: {
                readonly principe: string;
                readonly date_application: "Cessions à compter du 15/02/2025";
                readonly retroactivite_amortissements_anterieurs: true;
                readonly source: "LF 2025 art. 84 + réponse ministérielle Mette JOAN 24/03/2026";
                readonly exceptions: readonly ["Résidences étudiantes", "Résidences seniors", "EHPAD"];
            };
            readonly abattements_ir: {
                readonly de_1_a_5_ans: 0;
                readonly de_6_a_21_ans: 0.06;
                readonly annee_22: 0.04;
                readonly exoneration_totale_ir_apres: 22;
            };
            readonly abattements_ps: {
                readonly de_1_a_5_ans: 0;
                readonly de_6_a_21_ans: 0.0165;
                readonly annee_22: 0.016;
                readonly de_23_a_30_ans: 0.09;
                readonly exoneration_totale_ps_apres: 30;
            };
        };
        /**
         * Règles de plus-values LMP — régime professionnel.
         * Art. 39 duodecies + art. 151 septies du CGI.
         */
        readonly CFG_REGLES_PLUS_VALUES_LMP: {
            readonly regime: "Professionnel — art. 39 duodecies du CGI";
            readonly calcul_pv: "Valeur de cession − VNC (valeur nette comptable = prix − amortissements cumulés)";
            readonly pvct: {
                readonly libelle: "Plus-value à court terme (amortissements réintégrés)";
                readonly regime_ir: "Barème progressif IR";
                readonly regime_cotisations: "Soumis cotisations SSI (~35-45 %)";
                readonly etalement: "Étalement possible sur 3 ans pour la fraction IR";
            };
            readonly pvlt: {
                readonly libelle: "Plus-value à long terme (valorisation économique du bien)";
                readonly regime: "PFU 30 % = 12,8 % IR + 17,2 % PS (PV immobilières exclues de la hausse CSG 2026)";
                readonly cotisations: "Non soumis aux cotisations SSI";
            };
            readonly exoneration_art_151_septies: {
                readonly condition_anciennete_ans: 5;
                readonly seuil_exoneration_totale: 90000;
                readonly seuil_exoneration_partielle_max: 126000;
                readonly formule_partielle: "(126_000 − recettes_moyennes_2_ans) / 36_000";
                readonly note: "Recettes = moyenne des 2 exercices précédant la cession";
            };
            readonly abattement_art_151_septies_b: {
                readonly libelle: "Abattement pour durée de détention sur PVLT immobilière";
                readonly taux_annuel_a_partir_annee_6: 0.1;
                readonly exoneration_totale_apres_ans: 15;
            };
        };
    };
    readonly aides: {
        /** ACRE active en 2026 — mais profondément réformée */
        readonly CFG_ACRE_ACTIVE: true;
        /**
         * Taux de réduction des cotisations sociales ACRE en micro-entreprise.
         * Décret n° 2026-69 du 06/02/2026 — deux périodes distinctes.
         */
        readonly CFG_TAUX_REDUCTION_ACRE_MICRO: {
            readonly avant_01_07_2026: 0.5;
            readonly apres_01_07_2026: 0.25;
            readonly detail_taux_avec_acre: {
                readonly avant_01_07_2026: {
                    readonly vente: 0.062;
                    readonly services_bic: 0.106;
                    readonly bnc_ssi: 0.128;
                    readonly bnc_cipav: null;
                };
                readonly apres_01_07_2026: {
                    readonly vente: 0.093;
                    readonly services_bic: 0.159;
                    readonly bnc_ssi: 0.192;
                    readonly bnc_cipav: 0.174;
                };
            };
            readonly note: string;
        };
        /**
         * Taux de réduction ACRE hors micro (EI réel, EURL, SASU).
         * Décret n° 2026-69 du 06/02/2026.
         *
         * Formule de dégressivité :
         *   Si revenu ≤ 75 % PASS (36 045 €) → taux_max
         *   Si revenu entre 75 % et 100 % PASS → dégressif (taux_max → 0)
         *   Si revenu > PASS → 0
         */
        readonly CFG_TAUX_REDUCTION_ACRE_HORS_MICRO: {
            readonly taux_max_avant_01_07_2026: 0.5;
            readonly taux_max_apres_01_07_2026: 0.25;
            readonly seuil_exoneration_totale: number;
            readonly seuil_sortie_exoneration: 48060;
            readonly formule_degressivite: {
                readonly condition: "revenu entre 75 % et 100 % PASS";
                readonly formule: "exoneration = taux_max × (PASS − revenu) / (PASS × 0.25)";
                readonly note: "Décret n° 2026-69 — formule de dégressivité linéaire entre 36 045 € et 48 060 €";
            };
            readonly cotisations_exonerees: readonly ["Assurance maladie-maternité", "Vieillesse de base", "Invalidité-décès", "Allocations familiales"];
            readonly cotisations_non_exonerees: readonly ["CSG-CRDS", "Retraite complémentaire", "Formation professionnelle (CFP)"];
        };
        /**
         * Durée d'application de l'ACRE.
         */
        readonly CFG_DUREE_ACRE: {
            readonly hors_micro: {
                readonly duree_mois: 12;
                readonly reference: "12 mois consécutifs à compter de la date de début d'activité";
            };
            readonly micro: {
                readonly reference: "Jusqu'à la fin du 3e trimestre civil suivant le début d'activité";
                readonly note: "Durée variable selon la date de création (min 9 mois, max 12 mois environ)";
            };
        };
        /**
         * Mode de calcul de l'ACRE — abattement sur assiette ou réduction directe.
         */
        readonly CFG_ACRE_MODE_CALCUL: {
            readonly independants_ei_societes: {
                readonly mecanisme: "Abattement sur assiette ou réduction directe de cotisations";
                readonly note: "Selon la déclaration URSSAF — l'URSSAF applique le mécanisme adapté";
            };
            readonly micro_entrepreneurs: {
                readonly mecanisme: "Réduction de taux : cotisations × (1 − taux_reduction_ACRE)";
                readonly exemple: "BIC services : taux normal 21,2 % × (1 − 0,25) = 15,9 % après 01/07/2026";
            };
        };
        /** ARCE active en 2026 */
        readonly CFG_ARCE_ACTIVE: true;
        /**
         * Taux ARCE — fraction des droits ARE restants versés en capital.
         * Inchangé en 2026.
         */
        readonly CFG_TAUX_ARCE: 0.6;
        /**
         * Modalités de versement ARCE.
         * Pré-requis : bénéficier de l'ACRE.
         * Non cumulable avec le maintien des allocations chômage mensuelles.
         */
        readonly CFG_MODALITES_VERSEMENT_ARCE: {
            readonly nombre_versements: 2;
            readonly premier_versement: {
                readonly moment: "À la date de début d'activité";
                readonly fraction: 0.5;
            };
            readonly second_versement: {
                readonly moment: "6 mois après le début d'activité";
                readonly fraction: 0.5;
                readonly condition: "Activité maintenue et pas de CDI temps plein";
            };
            readonly droits_conserves_en_cas_echec: {
                readonly fraction: 0.4;
                readonly note: "40 % des droits initiaux conservés si réinscription après échec";
            };
        };
        /**
         * Règle d'impact de l'ARCE dans la comparaison des scénarios.
         * L'ARCE est un flux de trésorerie non récurrent — elle ne doit JAMAIS figurer
         * dans NET_APRES_IR_RECURRENT mais dans AIDE_ARCE_TRESORERIE.
         */
        readonly CFG_ARCE_IMPACT_COMPARAISON: {
            readonly inclure_dans_net_recurrent: false;
            readonly variable_cible: "AIDE_ARCE_TRESORERIE";
            readonly annualiser_pour_comparaison: true;
            readonly note: string;
        };
    };
    readonly zones: {
        /** ZFRR active — prolongée jusqu'au 31/12/2029 par LF 2026 */
        readonly CFG_ZFRR_ACTIVE: true;
        /**
         * Durée de la phase d'exonération totale ZFRR (années 1 à 5)
         * Applicable aux créations/reprises du 01/07/2024 au 31/12/2029.
         */
        readonly CFG_ZFRR_DUREE_EXONERATION_TOTALE: {
            readonly debut: "Date d'implantation en zone";
            readonly annees: 5;
            readonly taux: 1;
        };
        /**
         * Durée de la phase d'exonération partielle ZFRR (années 6 à 8)
         */
        readonly CFG_ZFRR_DUREE_EXONERATION_PARTIELLE: {
            readonly annees: 3;
            readonly note: "Dégressivité sur les années 6, 7 et 8";
        };
        /**
         * Taux d'exonération par phase ZFRR.
         * Source : LF 2026 art. 44 quindecies du CGI.
         */
        readonly CFG_ZFRR_TAUX_PHASES: PhaseExoneration[];
        /**
         * Types d'entreprises éligibles à la ZFRR.
         */
        readonly CFG_ZFRR_TYPES_ENTREPRISES_ELIGIBLES: {
            readonly activites: readonly ["Industrielle", "Commerciale", "Artisanale", "Libérale"];
            readonly condition_taille_standard: "< 11 salariés (socle ZFRR)";
            readonly condition_taille_zfrr_plus: "PME européenne (< 250 salariés, CA < 50 M€ ou bilan < 43 M€)";
            readonly conditions_localisation: readonly ["Direction effective et activité principale en zone ZFRR", "CA réalisé hors zone ≤ 25 %"];
            readonly regime_micro: "EXCLU — régime réel obligatoire";
            readonly plafond_minimis: "300 000 € sur 3 exercices glissants";
        };
        /**
         * Impôts ciblés par l'exonération ZFRR.
         * Plafond IR/IS : 50 000 € de bénéfice exonéré par an.
         */
        readonly CFG_ZFRR_IMPOTS_CIBLES: {
            readonly impots: readonly ["Impôt sur les bénéfices (IR ou IS)", "Contribution Foncière des Entreprises (CFE)", "Taxe Foncière sur les Propriétés Bâties (TFPB — sur délibération locale)"];
            readonly plafond_benefice_exonere_par_an: 50000;
            readonly cvae: "Exonération CVAE supprimée (CVAE elle-même supprimée en 2024)";
        };
        /**
         * Cotisations sociales ciblées par l'exonération ZFRR / ZFRR+ (booster B02).
         * Applicable sur les embauches pour les entreprises < 11 salariés.
         */
        readonly CFG_ZFRR_COTISATIONS_CIBLEES: {
            readonly cotisations_exonerees: readonly ["Assurance maladie-maternité-invalidité-décès (patronale)", "Assurance vieillesse plafonnée et déplafonnée (patronale)", "Allocations familiales (patronale)"];
            readonly cotisations_non_exonerees: readonly ["Assurance chômage", "Retraite complémentaire (AGIRC-ARRCO)", "Accidents du travail", "FNAL", "Contribution au dialogue social", "Versement mobilité", "Cotisations salariales", "CSG-CRDS"];
            readonly condition_embauche: "Du 1er au 50e salarié";
            readonly duree: "12 mois à compter de la date d'embauche";
            readonly seuil_exoneration_totale: "Rémunération horaire ≤ 150 % SMIC";
            readonly seuil_fin_exoneration: "Rémunération horaire = 240 % SMIC";
            readonly formule_degressive: {
                readonly formule: "T ÷ 0,9 × (2,4 × ((SMIC × 1,5 × nb_heures) ÷ remuneration_brute_mensuelle) - 1,5)";
                readonly T: 0.2102;
                readonly note: "T = 21,02 % = somme taux patronaux assurances sociales + allocations familiales";
                readonly arrondi: "3 décimales au millième le plus proche — coefficient plafonné à T";
            };
            readonly non_cumul: readonly ["Aide de l'État à l'emploi", "Autre exonération totale ou partielle de cotisations patronales SS", "Assiette ou montant forfaitaire de cotisations", "Application de taux spécifiques"];
            readonly cumul_autorise: readonly ["Réduction taux patronal assurance maladie", "Réduction taux patronal allocations familiales", "Déduction forfaitaire heures supplémentaires (TEPA)"];
            readonly ctp_dsn: "CTP 099 (ZFRR depuis 01/07/2024) / CTP 513 (ZRR maintenue)";
            readonly condition_maintien_effectif: "Maintien de l'effectif pendant 12 mois après embauche";
            readonly remboursement_si_delocalisation: "Remboursement total si délocalisation hors zone dans les 5 ans";
            readonly source: "urssaf.fr mis à jour 11/03/2026";
        };
        /**
         * Régime QPV — nouveau dispositif créé par LF 2026 art. 42.
         * Art. 44 octies B du CGI — remplace les ZFU-TE pour les nouvelles installations.
         */
        readonly CFG_QPV_ACTIVE: true;
        /**
         * Conditions de taille pour l'éligibilité au régime QPV.
         */
        readonly CFG_QPV_CONDITIONS_EFFECTIF: {
            readonly salaries_max: 50;
            readonly note: "Condition cumulée avec les conditions de CA/bilan";
        };
        /**
         * Conditions de CA et bilan pour l'éligibilité QPV.
         */
        readonly CFG_QPV_CONDITIONS_CA_BILAN: {
            readonly ca_ou_bilan_max: 10000000;
            readonly note: "Condition alternative : CA < 10 M€ OU bilan < 10 M€";
        };
        /**
         * Durée et phases de l'exonération QPV.
         * Créations/reprises du 01/01/2026 au 31/12/2030.
         */
        readonly CFG_QPV_DUREE_ET_PHASES: PhaseExoneration[];
        /**
         * Règle de proratisation du CA réalisé en zone QPV.
         */
        readonly CFG_QPV_PORTION_CA_EN_ZONE: {
            readonly activites_sedentaires: {
                readonly proratisation: "Exonération sur la totalité si établissement en QPV";
            };
            readonly activites_non_sedentaires: {
                readonly seuil_eligibilite: 0.25;
                readonly formule: "exoneration = benefice × (CA_en_zone / CA_total)";
                readonly note: "Éligibilité seulement si ≥ 25 % du CA réalisé en zone QPV";
            };
        };
        /**
         * ZFU-TE — supprimées pour les nouvelles entrées par LF 2026 art. 42.
         */
        readonly CFG_ZFU_NOUVELLES_ENTREES_AUTORISEES: false;
        /**
         * Règles pour le stock de droits ZFU antérieurs.
         * Entreprises installées avant le 31/12/2025 : maintien jusqu'au terme.
         */
        readonly CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS: {
            readonly maintien_droits_acquis: true;
            readonly condition: "Entreprise installée en ZFU avant le 31/12/2025";
            readonly duree_residuelle: "Jusqu'au terme du régime acquis (5 ans + 3 ans dégressif 60/40/20 %)";
            readonly phases_degressivite: readonly [{
                readonly annee_relative: 6;
                readonly taux: 0.6;
            }, {
                readonly annee_relative: 7;
                readonly taux: 0.4;
            }, {
                readonly annee_relative: 8;
                readonly taux: 0.2;
            }];
            readonly nouvelles_exonerations_au_01_01_2026: false;
        };
        /**
         * Règles de non-cumul entre exonérations de zones.
         * Un seul régime de zone peut s'appliquer simultanément.
         */
        readonly CFG_NON_CUMUL_EXONERATIONS_ZONE: {
            readonly principe: "Un seul régime d'exonération de zone applicable simultanément";
            readonly regimes_incompatibles: readonly ["ZFRR", "QPV", "ZFU_stock", "JEI", "BER", "BUD", "ZRD"];
            readonly delai_option: "6 mois à compter du début d'activité";
            readonly irrevocabilite: true;
            readonly arbitrage: "En cas de double éligibilité ZFRR/QPV, calculer les deux et présenter l'écart à l'utilisateur";
        };
    };
    readonly fiscal: {
        /**
         * Barème progressif IR 2026 — revenus 2025 imposés en 2026.
         * Revalorisation +0,9 % vs barème 2025.
         * Tranches exprimées par part fiscale (quotient familial).
         */
        readonly CFG_BAREME_IR_TRANCHES: TrancheIR[];
        /** Taux marginaux correspondant aux tranches (dans le même ordre) */
        readonly CFG_BAREME_IR_TAUX: readonly [0, 0.11, 0.3, 0.41, 0.45];
        /**
         * Décote IR 2026.
         * Réduit l'impôt brut des contribuables modestes.
         *
         * Formule :
         *   Si célibataire : décote = 897 − 0.4525 × impot_brut  (si impot_brut ≤ 1 984 €)
         *   Si couple      : décote = 1 483 − 0.4525 × impot_brut (si impot_brut ≤ 3 277 €)
         */
        readonly CFG_DECOTE_IR: {
            readonly forfait_celibataire: 897;
            readonly forfait_couple: 1483;
            readonly seuil_celibataire: 1984;
            readonly seuil_couple: 3277;
            readonly taux: 0.4525;
            readonly formule: "décote = forfait − taux × impot_brut (si impot_brut ≤ seuil)";
        };
        /**
         * Règle du quotient familial.
         */
        readonly CFG_REGLE_QUOTIENT_FAMILIAL: {
            readonly methode: "Diviser le revenu net imposable par le nombre de parts, appliquer le barème, multiplier par le nombre de parts";
            readonly parts: {
                readonly celibataire: 1;
                readonly couple_marie_pacse: 2;
                readonly enfant_1_et_2: 0.5;
                readonly enfant_3_et_suivants: 1;
                readonly parent_isole_1er_enfant: 1;
            };
            readonly note: "Plafonnement de l'avantage par demi-part supplémentaire = CFG_PLAFOND_AVANTAGE_QF";
        };
        /**
         * Plafond de l'avantage fiscal lié au quotient familial 2026.
         * Par demi-part supplémentaire au-delà de la situation de référence.
         */
        readonly CFG_PLAFOND_AVANTAGE_QF: {
            readonly par_demi_part_droit_commun: 1807;
            readonly par_quart_de_part: 904;
            readonly parent_isole_1ere_part_enfant: 4262;
            readonly personne_seule_enfant_eleve_5_ans: 1079;
            readonly veuf_avec_personne_a_charge: 5625;
        };
        /**
         * Prélèvements sociaux sur revenus du capital — régime dual 2026.
         * LFSS 2026 : hausse CSG +1,4 pt créant une « contribution financière pour l'autonomie ».
         * Deux taux distincts selon la nature du revenu.
         */
        readonly CFG_PRELEVEMENTS_SOCIAUX_CAPITAL: {
            readonly taux_18_6_pct: {
                readonly taux: 0.186;
                readonly revenus_concernes: readonly ["Dividendes", "Intérêts", "Plus-values mobilières", "Plus-values crypto", "Revenus BIC/BNC/BA non professionnels (hors PV immobilières)", "Revenus LMNP courants"];
                readonly detail: {
                    readonly csg: 0.106;
                    readonly crds: 0.005;
                    readonly solidarite: 0.075;
                };
            };
            readonly taux_17_2_pct: {
                readonly taux: 0.172;
                readonly revenus_concernes: readonly ["Revenus fonciers", "Plus-values immobilières", "Assurance-vie (certains compartiments)", "Épargne logement", "Plus-values professionnelles LT"];
                readonly detail: {
                    readonly csg: 0.092;
                    readonly crds: 0.005;
                    readonly solidarite: 0.075;
                };
            };
            readonly csg_deductible_ir: 0.068;
            readonly note: string;
        };
        /**
         * Taux IS réduit — PME éligibles (art. 219 I du CGI).
         * Conditions : CA ≤ 10 M€, capital libéré, 75 %+ personnes physiques.
         */
        readonly CFG_TAUX_IS_REDUIT: 0.15;
        /** Taux IS normal */
        readonly CFG_TAUX_IS_NORMAL: 0.25;
        /**
         * Seuil de bénéfice fiscal pour l'application du taux IS réduit (€).
         * Proratisé si exercice ≠ 12 mois : seuil × (nb_mois / 12).
         * L'amendement relevant ce seuil à 100 000 € n'a pas été retenu en LF 2026.
         */
        readonly CFG_SEUIL_IS_REDUIT: 42500;
        /**
         * Méthode de répartition de l'IR entre scénarios (méthode différentielle).
         * Garantit le respect de la progressivité et du quotient familial.
         */
        readonly CFG_REGLES_REPARTITION_IR_SCENARIO: {
            readonly methode: "Différentielle";
            readonly formule: "IR_scenario = IR_foyer(avec_revenu_scenario) − IR_foyer(sans_revenu_scenario)";
            readonly base_sans_scenario: "AUTRES_REVENUS_FOYER_IMPOSABLES − AUTRES_CHARGES_DEDUCTIBLES_FOYER";
            readonly fiabilite: "Estimation si données foyer incomplètes — toujours qualifier le niveau de fiabilité";
        };
        /**
         * Règles d'affectation de l'impôt foyer au scénario simulé.
         */
        readonly CFG_REGLES_AFFECTATION_IMPOT_FOYER_AU_SCENARIO: {
            readonly methode_retenue: "Différentielle (voir CFG_REGLES_REPARTITION_IR_SCENARIO)";
            readonly prelevements_sociaux: "Calculés directement sur les revenus du scénario (pas de mutualisation foyer)";
            readonly note: string;
        };
        /**
         * Contribution Différentielle Hauts Revenus (CDHR) — reconduite en 2026.
         * Taux minimum effectif d'imposition de 20 % pour les contribuables les plus aisés.
         */
        readonly CFG_CDHR: {
            readonly active: true;
            readonly taux_minimum_effectif: 0.2;
            readonly note: "CDHR reconduite par LF 2026 — s'applique si le taux effectif IR est < 20 %";
        };
        /**
         * Plafond Madelin — déduction complémentaire santé pour TNS.
         */
        readonly CFG_PLAFOND_MADELIN_SANTE: {
            readonly formule: "min(3,75 % × bénéfice_imposable + 7 % × PASS, 3 % × 8 × PASS)";
            readonly taux_benefice: 0.0375;
            readonly taux_pass_addition: 0.07;
            readonly taux_pass_addition_valeur_2026: number;
            readonly plafond_absolu_taux_8pass: 0.03;
            readonly plafond_absolu_valeur_2026: number;
            readonly note: string;
        };
    };
    readonly temporalite: {
        /**
         * Nombre maximum d'exercices pour l'option IR temporaire d'une société (EURL/SASU).
         * Art. 239 bis AB du CGI.
         * Conditions : société < 5 ans, < 50 salariés, CA ou bilan < 10 M€,
         * capital 50 %+ personnes physiques dont 34 % dirigeants.
         * Notification dans les 3 premiers mois du 1er exercice.
         */
        readonly CFG_DUREE_OPTION_IR_TEMPORAIRE_SOCIETE: {
            readonly nb_exercices_max: 5;
            readonly conditions: readonly ["Société < 5 ans à la date d'option", "< 50 salariés", "CA ou bilan < 10 M€", "Capital 50 %+ détenu par personnes physiques", "34 %+ par dirigeants"];
            readonly notification: "Dans les 3 premiers mois du 1er exercice d'application";
            readonly irrevocable_apres: "5e exercice écoulé — renonciation possible avant";
        };
        /**
         * Date limite pour l'option IS d'une EI (assimilation fiscale à l'EURL).
         * Option irrévocable une fois le délai de renonciation de 5 ans écoulé.
         */
        readonly CFG_DATE_LIMITE_OPTION_IS_EI: {
            readonly date_limite: "Avant la fin du 3e mois de l'exercice (ex : 31 mars pour exercice calendaire)";
            readonly revocabilite: "Renonciation possible avant la fin du 2e mois de l'exercice concerné";
            readonly irrevocabilite: "Définitive après 5 exercices";
            readonly note: "L'option IS pour une EI crée une assimilation fiscale à l'EURL (IS irrévocable au-delà).";
        };
        /**
         * Date limite pour opter au VFL (Versement Forfaitaire Libératoire).
         */
        readonly CFG_DATE_LIMITE_OPTION_VFL: {
            readonly regime_general: "30 septembre N-1 pour effet au 1er janvier N";
            readonly regime_creation: "Dans les 3 mois suivant la date d'immatriculation";
            readonly note: "L'option s'exerce auprès de l'URSSAF (formulaire en ligne ou courrier)";
        };
        /**
         * Dates limites générales pour les options fiscales annuelles.
         */
        readonly CFG_DATE_LIMITE_OPTIONS_FISCALES: {
            readonly regime_reel: {
                readonly creation: "Lors de la création (formulaire P0 / M0)";
                readonly exercice_en_cours: "Avant le 2e jour ouvré suivant le 1er mai (exercice calendaire)";
            };
            readonly note: "Les options prises en cours d'exercice ne sont valables que pour l'exercice suivant en règle générale";
        };
        /**
         * Règles de prorata temporis pour les exercices incomplets.
         * Applicable en cas de création en cours d'année ou de changement de régime.
         */
        readonly CFG_PRORATA_TEMPORIS: {
            readonly actif: true;
            readonly formule: "CA_annualise = CA_effectif × (12 / nb_mois_exercice)";
            readonly methode_mois_incomplets: "Chaque mois incomplet compté en jours : jours_activite / 30";
            readonly applications: readonly ["Seuils micro (comparaison annualisée)", "Seuil IS réduit : 42 500 × (nb_mois / 12)", "Franchise TVA (comparaison annualisée pour vérifier le seuil)", "Plafond bénéfice exonéré ZFRR (50 000 × nb_mois / 12)"];
        };
    };
    readonly PENDING: {
        readonly _NOTE: string;
    };
};
export type FiscalParams2026 = typeof FISCAL_PARAMS_2026;
//# sourceMappingURL=fiscal_params_2026.d.ts.map