# ALGORITHME.md — Moteur d'Arbitrage Fiscal 2026

## Préambule

Ce fichier formalise le moteur décisionnel et de calcul du simulateur fiscal WYMBY. Il constitue la spécification fonctionnelle de référence pour tout agent IA ou développeur chargé d'implémenter, auditer ou étendre le moteur.

**Contrainte absolue :** aucune valeur numérique (taux, seuil, plafond, barème, montant) ne doit figurer dans ce fichier ni dans le code métier. Toutes les constantes réglementaires sont externalisées dans `config/fiscal_params_YYYY.ts`, versionné par année fiscale.

---

## 1. Cadre et hypothèses de modélisation

### 1.1 Structure en couches logiques

Le moteur opère sur quatre couches distinctes :

**Couche A — Régime métier / segment**
- Généralistes : consultant, artisan, commerçant
- Santé : médical / paramédical conventionné ou non
- Artistes-auteurs
- Immobilier meublé : LMNP / LMP

**Couche B — Régime fiscal / juridique de base**
Micro-BIC achat/revente, Micro-BIC prestation, Micro-BNC, EI réel BIC, EI réel BNC, EURL, SASU, SELARL, SELAS, Artiste-auteur BNC, Artiste-auteur traitements et salaires, LMNP micro-BIC, LMNP réel, LMP.

**Couche C — Options internes au régime**
Franchise TVA ou TVA collectée, Versement Libératoire ou barème classique, IR ou IS selon possibilité juridique, option frais réels pour certaines branches, OPTAM / non-OPTAM pour les professions de santé, réduction / exonération sectorielle spécifique.

**Couche D — Aides / boosters / filtres**
ACRE, ARCE, ZIP/ZAC, ZFRR/ZFRR+, QPV/ZFU, alertes d'exclusion (dépassement micro, dépassement TVA, perte du VFL, taxe PUMa/rentier).

### 1.2 Ce que le moteur produit

Pour un profil donné, le moteur produit :
- la liste des scénarios juridiquement et logiquement possibles,
- le calcul symbolique complet de chaque scénario,
- le classement comparatif des scénarios,
- une sortie explicable : pourquoi tel scénario est possible, exclu ou recommandé.

### 1.3 Hypothèses structurantes

- Le moteur travaille sur une année de simulation donnée.
- Les seuils, taux, plafonds, assiettes, abattements, barèmes, temporalités et règles d'éligibilité sont externalisés dans une couche de configuration.
- Les données utilisateur peuvent être certaines, déclaratives ou estimatives.
- Le moteur distingue : résultat d'exploitation récurrent, effet social/fiscal récurrent, aide non récurrente, coût/complexité administrative.
- **ARCE** doit être modélisée comme un flux de trésorerie externe au résultat d'exploitation, pas comme un gain de rentabilité structurelle.
- Les aides de zone sont des surcouches conditionnelles, pas des régimes autonomes.
- Les activités mixtes ou multi-régimes doivent être traitées par exclusion explicite ou sous-moteur dédié.

### 1.4 Catégories de règles

| Catégorie | Exemples |
|-----------|---------|
| Règle déterministe | Compatibilité juridique, ordre de calcul, exclusions d'incompatibilité, non-cumul |
| Paramétrage | Seuils CA, seuils TVA, seuils RFR, taux sociaux, barèmes IR/IS, paramètres CPAM, RAAP, ACRE, ZFRR/QPV |
| Donnée utilisateur | Activité, profession, CA, charges, foyer fiscal, localisation, date de création, options souhaitées |
| Donnée externe / à confirmer | Zonage géographique effectif, statut conventionné exact, adhésion OPTAM, éligibilité ACRE/ARCE à date, activité mixte |

---

## 2. Dictionnaire complet des variables

### 2.1 Variables d'entrée utilisateur

#### Identifiants profil

| Variable | Type | Rôle |
|----------|------|------|
| `ANNEE_SIMULATION` | texte/date | Année de calcul |
| `SEGMENT_ACTIVITE` | texte | généraliste / santé / artiste-auteur / immobilier |
| `SOUS_SEGMENT_ACTIVITE` | texte | achat_revente / prestation / liberal / medecin / paramedical / artiste_auteur / lmnp / lmp |
| `PROFESSION_EXACTE` | texte | Profession détaillée |
| `FORME_JURIDIQUE_ENVISAGEE` | liste | EI / EURL / SASU / SELARL / SELAS / autre |
| `REGIME_FISCAL_ENVISAGE` | liste | micro / reel / IR / IS / TS / autre |

#### Chiffres d'activité

| Variable | Type | Rôle |
|----------|------|------|
| `INPUT_MODE_CA` | texte | HT / TTC |
| `CA_ENCAISSE_UTILISATEUR` | nombre | Recettes saisies |
| `TVA_COLLECTEE_UTILISATEUR` | nombre | TVA collectée déclarée si saisie séparée |
| `TVA_DEDUCTIBLE_UTILISATEUR` | nombre | TVA déductible estimée |
| `AUTRES_RECETTES_PRO` | nombre | Autres recettes liées à l'activité |
| `CHARGES_DECAISSEES` | nombre | Charges d'exploitation |
| `CHARGES_DEDUCTIBLES` | nombre | Charges fiscalement déductibles |
| `CHARGES_NON_DEDUCTIBLES` | nombre | Charges réintégrées |
| `DOTATIONS_AMORTISSEMENTS` | nombre | Amortissements |
| `REMUNERATION_DIRIGEANT_ENVISAGEE` | nombre | Rémunération brute ou nette selon convention interne |
| `DIVIDENDES_ENVISAGES` | nombre | Dividendes envisagés |
| `LOYERS_MEUBLES` | nombre | Recettes meublées |
| `FRAIS_REELS_TS` | nombre | Frais réels pour branche TS artiste-auteur |

#### Foyer fiscal

| Variable | Type | Rôle |
|----------|------|------|
| `SITUATION_FAMILIALE` | texte | célibataire / marié / pacsé / autre |
| `NOMBRE_PARTS_FISCALES` | nombre | Parts fiscales |
| `NOMBRE_ENFANTS_A_CHARGE` | nombre | Enfants retenus fiscalement |
| `AUTRES_REVENUS_FOYER_IMPOSABLES` | nombre | Hors scénario simulé |
| `AUTRES_CHARGES_DEDUCTIBLES_FOYER` | nombre | Hors activité simulée |
| `RFR_N_2_UTILISATEUR` | nombre | Revenu fiscal de référence N-2 pertinent |
| `OPTION_VFL_DEMANDEE` | booléen | Souhait d'opter au Versement Libératoire |

#### TVA

| Variable | Type | Rôle |
|----------|------|------|
| `TVA_DEJA_APPLICABLE` | booléen | TVA déjà facturée |
| `REGIME_TVA_SOUHAITE` | texte | franchise / réel TVA / simplifié TVA / inconnu |
| `DATE_DEPASSEMENT_TVA_DECLARATIVE` | date | Si l'utilisateur déclare un dépassement |

#### Temporalité

| Variable | Type | Rôle |
|----------|------|------|
| `DATE_CREATION_ACTIVITE` | date | — |
| `DATE_DEBUT_EXERCICE` | date | — |
| `DATE_FIN_EXERCICE` | date | — |
| `ANCIENNETE_ACTIVITE` | nombre/date | Ancienneté utile pour éligibilités temporelles |
| `CHANGEMENT_REGIME_EN_COURS_D_ANNEE` | booléen | — |
| `DATE_CHANGEMENT_REGIME` | date | — |

#### Santé

| Variable | Type | Rôle |
|----------|------|------|
| `EST_PROFESSION_SANTE` | booléen | — |
| `EST_CONVENTIONNE` | booléen | — |
| `SECTEUR_CONVENTIONNEL` | texte | secteur_1 / secteur_2 / secteur_2_optam / secteur_2_non_optam / secteur_3 / hors_convention |
| `EST_ELIGIBLE_AIDE_CPAM` | booléen | — |
| `EST_ELIGIBLE_ZIP_ZAC` | booléen | — |
| `AIDE_INSTALLATION_SANTE_DEMANDEE` | booléen | — |

#### Artiste-auteur

| Variable | Type | Rôle |
|----------|------|------|
| `MODE_DECLARATION_ARTISTE_AUTEUR` | texte | BNC / TS |
| `OPTION_FRAIS_REELS_TS` | booléen | — |
| `EST_REDEVABLE_RAAP` | booléen | — |
| `OPTION_RAAP_TAUX_REDUIT` | booléen | — |

#### Immobilier

| Variable | Type | Rôle |
|----------|------|------|
| `TYPE_LOCATION_MEUBLEE` | texte | longue_duree / tourisme_classe / tourisme_non_classe / chambre_hotes / autre |
| `EST_LMNP` | booléen | — |
| `EST_LMP` | booléen | — |
| `RECETTES_LOCATION_MEUBLEE` | nombre | — |
| `AUTRES_REVENUS_ACTIVITE_FOYER` | nombre | Utilisé pour qualification LMP |

#### Aides / zones / emploi

| Variable | Type | Rôle |
|----------|------|------|
| `EST_CREATEUR_REPRENEUR` | booléen | — |
| `ACRE_DEMANDEE` | booléen | — |
| `EST_ELIGIBLE_ACRE_DECLARATIF` | booléen | — |
| `ARCE_DEMANDEE` | booléen | — |
| `EST_BENEFICIAIRE_ARE` | booléen | — |
| `DROITS_ARE_RESTANTS` | nombre | — |
| `LOCALISATION_COMMUNE` | texte | — |
| `LOCALISATION_CODE_POSTAL` | texte | — |
| `EST_IMPLANTE_EN_ZFRR` | booléen | — |
| `EST_IMPLANTE_EN_ZFRR_PLUS` | booléen | — |
| `EST_IMPLANTE_EN_QPV` | booléen | — |
| `EST_IMPLANTE_EN_ANCIENNE_ZFU_OUVRANT_DROITS` | booléen | — |
| `EFFECTIF_ENTREPRISE` | nombre | Pour critères QPV/ZFU |
| `TOTAL_BILAN` | nombre | Pour critères QPV/ZFU |
| `PART_CA_REALISEE_EN_ZONE` | nombre | Pour proratisation aides de zone |
| `OPTION_EXONERATION_ZONE_CHOISIE` | texte | Arbitrage si non-cumul |

#### Qualité de donnée

| Variable | Type | Rôle |
|----------|------|------|
| `NIVEAU_CERTITUDE_CA` | texte | certain / estimé / faible |
| `NIVEAU_CERTITUDE_CHARGES` | texte | certain / estimé / faible |
| `NIVEAU_CERTITUDE_FOYER` | texte | certain / estimé / faible |
| `NIVEAU_CERTITUDE_AIDES` | texte | certain / estimé / faible |
| `DONNEES_INCOMPLETES` | booléen | — |

---

### 2.2 Variables de configuration réglementaires

Toutes stockées dans `config/fiscal_params_YYYY.ts`. Aucune valeur ne figure ici.

#### Seuils micro

`CFG_SEUIL_CA_MICRO_BIC_VENTE`, `CFG_SEUIL_CA_MICRO_BIC_SERVICE`, `CFG_SEUIL_CA_MICRO_BNC`, `CFG_SEUIL_CA_MICRO_LMNP_CLASSIQUE`, `CFG_SEUIL_CA_MICRO_MEUBLE_TOURISME_CLASSE`, `CFG_SEUIL_CA_MICRO_MEUBLE_TOURISME_NON_CLASSE`

#### Seuils TVA

`CFG_SEUIL_TVA_FRANCHISE_BIC_VENTE`, `CFG_SEUIL_TVA_FRANCHISE_BIC_SERVICE`, `CFG_SEUIL_TVA_FRANCHISE_BNC`, `CFG_SEUIL_TVA_TOLERANCE_BIC_VENTE`, `CFG_SEUIL_TVA_TOLERANCE_BIC_SERVICE`, `CFG_SEUIL_TVA_TOLERANCE_BNC`, `CFG_REGLE_SORTIE_IMMEDIATE_TVA`, `CFG_REGLE_SORTIE_TVA_ANNEE_SUIVANTE`

#### Versement Libératoire

`CFG_SEUIL_RFR_VFL_PAR_PART`, `CFG_FORMULE_SEUIL_RFR_VFL`, `CFG_TAUX_VFL_MICRO_BIC_VENTE`, `CFG_TAUX_VFL_MICRO_BIC_SERVICE`, `CFG_TAUX_VFL_MICRO_BNC`

#### Abattements micro

`CFG_ABATTEMENT_MICRO_BIC_VENTE`, `CFG_ABATTEMENT_MICRO_BIC_SERVICE`, `CFG_ABATTEMENT_MICRO_BNC`, `CFG_ABATTEMENT_MICRO_LMNP_CLASSIQUE`, `CFG_ABATTEMENT_MICRO_MEUBLE_TOURISME_CLASSE`, `CFG_ABATTEMENT_MICRO_MEUBLE_TOURISME_NON_CLASSE`, `CFG_MINIMUM_ABATTEMENT_MICRO`, `CFG_ABATTEMENT_TS_FORFAITAIRE_ARTISTE_AUTEUR`

#### Social — micro / TNS / assimilé

`CFG_TAUX_SOCIAL_MICRO_BIC_VENTE`, `CFG_TAUX_SOCIAL_MICRO_BIC_SERVICE`, `CFG_TAUX_SOCIAL_MICRO_BNC`, `CFG_TAUX_SOCIAL_RSPM`, `CFG_TAUX_SOCIAL_TNS_BIC`, `CFG_TAUX_SOCIAL_TNS_BNC`, `CFG_TAUX_SOCIAL_ASSIMILE_SALARIE`, `CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR`, `CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_TNS`, `CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_ASSIMILE`, `CFG_SEUIL_PUMA`, `CFG_FORMULE_TAXE_PUMA`

#### Santé

`CFG_TAUX_MALADIE_SECTEUR_1`, `CFG_TAUX_MALADIE_SECTEUR_2`, `CFG_TAUX_MALADIE_SECTEUR_2_OPTAM`, `CFG_TAUX_MALADIE_SECTEUR_2_NON_OPTAM`, `CFG_TAUX_MALADIE_HORS_CONVENTION`, `CFG_PARAM_AIDE_CPAM_MALADIE`, `CFG_PARAM_AIDE_CPAM_RETRAITE`, `CFG_PARAM_DEDUCTION_GROUPE_III`, `CFG_PARAM_DEDUCTION_COMPLEMENTAIRE_SANTE`, `CFG_PARAM_ZIP_ZAC_MONTANT_FORFAITAIRE`, `CFG_REGLES_ASV`, `CFG_REGLES_PAMC`

#### Artiste-auteur

`CFG_SEUIL_TVA_ARTISTE_AUTEUR`, `CFG_SEUIL_TVA_TOLERANCE_ARTISTE_AUTEUR`, `CFG_TAUX_COTISATIONS_ARTISTE_AUTEUR`, `CFG_SEUIL_RAAP`, `CFG_TAUX_RAAP_NORMAL`, `CFG_TAUX_RAAP_REDUIT`, `CFG_REGLE_AFFILIATION_RAAP`

#### Immobilier

`CFG_SEUIL_LMP_RECETTES`, `CFG_FORMULE_CRITERE_LMP_PAR_RAPPORT_AUX_AUTRES_REVENUS`, `CFG_TAUX_SOCIAL_LMP_SSI`, `CFG_REGLES_AMORTISSEMENT_LMNP_REEL`, `CFG_REGLES_DEDUCTIBILITE_CHARGES_LMNP`, `CFG_REGLES_PLUS_VALUES_LMNP`, `CFG_REGLES_PLUS_VALUES_LMP`

#### Aides

`CFG_ACRE_ACTIVE`, `CFG_TAUX_REDUCTION_ACRE_MICRO`, `CFG_TAUX_REDUCTION_ACRE_HORS_MICRO`, `CFG_DUREE_ACRE`, `CFG_ACRE_MODE_CALCUL`, `CFG_ARCE_ACTIVE`, `CFG_TAUX_ARCE`, `CFG_MODALITES_VERSEMENT_ARCE`, `CFG_ARCE_IMPACT_COMPARAISON`

#### Zones / exonérations

`CFG_ZFRR_ACTIVE`, `CFG_ZFRR_DUREE_EXONERATION_TOTALE`, `CFG_ZFRR_DUREE_EXONERATION_PARTIELLE`, `CFG_ZFRR_TAUX_PHASES`, `CFG_ZFRR_TYPES_ENTREPRISES_ELIGIBLES`, `CFG_ZFRR_IMPOTS_CIBLES`, `CFG_ZFRR_COTISATIONS_CIBLEES`, `CFG_QPV_ACTIVE`, `CFG_QPV_CONDITIONS_EFFECTIF`, `CFG_QPV_CONDITIONS_CA_BILAN`, `CFG_QPV_DUREE_ET_PHASES`, `CFG_QPV_PORTION_CA_EN_ZONE`, `CFG_ZFU_NOUVELLES_ENTREES_AUTORISEES`, `CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS`, `CFG_NON_CUMUL_EXONERATIONS_ZONE`

#### IR / IS

`CFG_BAREME_IR_TRANCHES`, `CFG_BAREME_IR_TAUX`, `CFG_REGLE_QUOTIENT_FAMILIAL`, `CFG_PLAFOND_AVANTAGE_QF`, `CFG_TAUX_IS_REDUIT`, `CFG_TAUX_IS_NORMAL`, `CFG_SEUIL_IS_REDUIT`, `CFG_REGLES_REPARTITION_IR_SCENARIO`, `CFG_REGLES_AFFECTATION_IMPOT_FOYER_AU_SCENARIO`

#### Temporalité / options

`CFG_DUREE_OPTION_IR_TEMPORAIRE_SOCIETE`, `CFG_DATE_LIMITE_OPTION_IS_EI`, `CFG_DATE_LIMITE_OPTION_VFL`, `CFG_DATE_LIMITE_OPTIONS_FISCALES`, `CFG_PRORATA_TEMPORIS`

---

### 2.3 Variables booléennes / flags logiques

```
FLAG_CA_SAISI_EN_TTC
FLAG_TVA_APPLICABLE
FLAG_DEPASSEMENT_SEUIL_MICRO
FLAG_DEPASSEMENT_SEUIL_TVA
FLAG_VFL_POSSIBLE
FLAG_VFL_INTERDIT
FLAG_MICRO_BIC_VENTE_POSSIBLE
FLAG_MICRO_BIC_SERVICE_POSSIBLE
FLAG_MICRO_BNC_POSSIBLE
FLAG_EI_REEL_BIC_IR_POSSIBLE
FLAG_EI_REEL_BIC_IS_POSSIBLE
FLAG_EI_REEL_BNC_IR_POSSIBLE
FLAG_EI_REEL_BNC_IS_POSSIBLE
FLAG_EURL_IS_POSSIBLE
FLAG_EURL_IR_POSSIBLE
FLAG_SASU_IS_POSSIBLE
FLAG_SASU_IR_POSSIBLE
FLAG_RSPM_POSSIBLE
FLAG_SANTE_MICRO_POSSIBLE
FLAG_SANTE_REEL_POSSIBLE
FLAG_SELARL_IS_POSSIBLE
FLAG_SELAS_IS_POSSIBLE
FLAG_ARTISTE_AUTEUR_BNC_MICRO_POSSIBLE
FLAG_ARTISTE_AUTEUR_BNC_REEL_POSSIBLE
FLAG_ARTISTE_AUTEUR_TS_POSSIBLE
FLAG_LMNP_MICRO_POSSIBLE
FLAG_LMNP_REEL_POSSIBLE
FLAG_LMP_POSSIBLE
FLAG_ACRE_POSSIBLE
FLAG_ARCE_POSSIBLE
FLAG_ZFRR_POSSIBLE
FLAG_ZFRR_PLUS_POSSIBLE
FLAG_QPV_POSSIBLE
FLAG_ZFU_STOCK_DROITS_POSSIBLE
FLAG_AIDE_CPAM_POSSIBLE
FLAG_ZIP_ZAC_POSSIBLE
FLAG_RAAP_APPLICABLE
FLAG_TAXE_PUMA_APPLICABLE
FLAG_SCENARIO_EXCLU
FLAG_DONNEES_A_COMPLETER
```

---

### 2.4 Variables intermédiaires de calcul

```
CA_HT_RETENU
CA_TTC_RETENU
TVA_COLLECTEE_THEORIQUE
TVA_DEDUCTIBLE_RETENUE
TVA_NETTE_DUE
RECETTES_PRO_RETENUES
ABATTEMENT_FORFAITAIRE
RESULTAT_COMPTABLE
RESULTAT_FISCAL_AVANT_EXONERATIONS
RESULTAT_FISCAL_APRES_EXONERATIONS
ASSIETTE_SOCIALE_BRUTE
ASSIETTE_SOCIALE_APRES_AIDES
COTISATIONS_SOCIALES_BRUTES
REDUCTION_ACRE
AIDE_CPAM_IMPUTEE
EXONERATION_SOCIALE_ZONE
COTISATIONS_SOCIALES_NETTES
REMUNERATION_DEDUCTIBLE
REMUNERATION_NETTE_DIRIGEANT
DIVIDENDES_DISTRIBUABLES
DIVIDENDES_NETS_PERCUS
BASE_IR_SCENARIO
BASE_IR_FOYER_TOTALE
IR_THEORIQUE_FOYER
IR_ATTRIBUABLE_SCENARIO
IS_DU_SCENARIO
NET_AVANT_IR
NET_APRES_IR
COUT_TOTAL_SOCIAL_FISCAL
SUPER_NET
AIDE_ARCE_TRESORERIE
GAIN_VS_REFERENCE
DELTA_NET_APRES_IR
DELTA_COUT_TOTAL
TAUX_PRELEVEMENTS_GLOBAL
DEPENDANCE_AIDES_RATIO
SENSIBILITE_CHARGES
SCORE_COMPLEXITE_ADMIN
SCORE_ROBUSTESSE
SCORE_GLOBAL_SCENARIO
```

---

### 2.5 Variables de sortie

```
LISTE_SCENARIOS_POSSIBLES
LISTE_SCENARIOS_EXCLUS
MOTIFS_EXCLUSION_PAR_SCENARIO
LISTE_SCENARIOS_CALCULES
DETAIL_CALCUL_PAR_SCENARIO
SCENARIO_REFERENCE
SCENARIO_OPTIMAL_NET_APRES_IR
SCENARIO_OPTIMAL_SUPER_NET
SCENARIO_OPTIMAL_ROBUSTE
CLASSEMENT_SCENARIOS
MESSAGES_EXPLICATION
AVERTISSEMENTS
ELEMENTS_A_CONFIRMER
NIVEAU_DE_FIABILITE
SCORE_FIABILITE
TRACE_DECISIONNELLE
```

---

## 3. Cartographie des scénarios

### 3.1 Structure canonique

```
SCENARIO = BASE × TVA × OPTION_FISCALE × OPTION_SOCIALE × AIDES_COMPATIBLES
```

- **BASE** = régime métier/juridique principal
- **TVA** = franchise ou TVA collectée
- **OPTION_FISCALE** = VFL / IR / IS / TS / frais réels / OPTAM selon cas
- **OPTION_SOCIALE** = aide CPAM, RAAP, SSI, assimilé salarié, etc.
- **AIDES_COMPATIBLES** = ACRE, ARCE, ZIP/ZAC, ZFRR, QPV, stock ZFU

Les boosters ne créent pas de régimes autonomes. Ils s'attachent à une base si `MATRICE_COMPATIBILITE[base, booster] = vrai`.

### 3.2 Bases scénarios par segment

**Segment 1 — Généralistes**

| ID | Description |
|----|-------------|
| `G_MBIC_VENTE` | Micro-BIC Achat/Revente |
| `G_MBIC_SERVICE` | Micro-BIC Prestation de Service |
| `G_MBNC` | Micro-BNC |
| `G_EI_REEL_BIC_IR` | EI Réel BIC + IR |
| `G_EI_REEL_BIC_IS` | EI Réel BIC + IS |
| `G_EI_REEL_BNC_IR` | EI Réel BNC + IR |
| `G_EI_REEL_BNC_IS` | EI Réel BNC + IS |
| `G_EURL_IS` | EURL à l'IS |
| `G_EURL_IR` | EURL à l'IR (temporaire) |
| `G_SASU_IS` | SASU à l'IS |
| `G_SASU_IR` | SASU à l'IR (temporaire) |

Déclinaisons natives : `TVA_FRANCHISE` / `TVA_COLLECTEE`, `VFL_NON` / `VFL_OUI` (micro éligible seulement), `AIDE_NONE` / `ACRE` / `ARCE` / `ZONE` / combinaisons compatibles.

**Segment 2 — Santé**

| ID | Description |
|----|-------------|
| `S_RSPM` | Remplaçant (CA < seuil RSPM) |
| `S_MICRO_BNC_SECTEUR_1` | Micro-BNC Secteur 1 + aide CPAM |
| `S_MICRO_BNC_SECTEUR_2` | Micro-BNC Secteur 2 |
| `S_EI_REEL_SECTEUR_1` | EI Réel Secteur 1 + 2035 + CPAM |
| `S_EI_REEL_SECTEUR_2_OPTAM` | EI Réel Secteur 2 OPTAM + CPAM partielle |
| `S_EI_REEL_SECTEUR_2_NON_OPTAM` | EI Réel Secteur 2 non-OPTAM |
| `S_EI_REEL_SECTEUR_3_HORS_CONVENTION` | EI Réel Hors convention + ASV |
| `S_SELARL_IS` | SELARL à l'IS |
| `S_SELAS_IS` | SELAS à l'IS |

Surcouches santé : `CPAM_AIDE_NONE` / `CPAM_AIDE_PARTIELLE` / `CPAM_AIDE_PLEINE`, `ZIP_ZAC_NONE` / `ZIP_ZAC_OUI`.

**Segment 3 — Artistes-auteurs**

| ID | Description |
|----|-------------|
| `A_BNC_MICRO_TVA_FRANCHISE` | Micro-BNC + franchise TVA |
| `A_BNC_MICRO_TVA_COLLECTEE` | Micro-BNC + TVA collectée |
| `A_BNC_REEL` | BNC réel (déclaration 2035) |
| `A_TS_ABATTEMENT_FORFAITAIRE` | Traitements & Salaires — abattement forfaitaire |
| `A_TS_FRAIS_REELS` | Traitements & Salaires — frais réels justifiés |

Surcouches : `RAAP_NONE` / `RAAP_NORMAL` / `RAAP_REDUIT`.

**Segment 4 — Immobilier**

| ID | Description |
|----|-------------|
| `I_LMNP_MICRO` | LMNP Micro-BIC |
| `I_LMNP_REEL` | LMNP Réel (amortissements) |
| `I_LMP` | LMP (cotisations SSI) |

Sous-cas : `TYPE_MEUBLE_LONGUE_DUREE`, `TYPE_MEUBLE_TOURISME_CLASSE`, `TYPE_MEUBLE_TOURISME_NON_CLASSE`.

### 3.3 Boosters / aides surcouches

```
BOOST_ACRE
BOOST_ARCE
BOOST_ZFRR
BOOST_ZFRR_PLUS
BOOST_QPV
BOOST_ZFU_STOCK
BOOST_ZIP_ZAC
BOOST_CPAM
BOOST_RAAP_REDUIT
```

### 3.4 Combinaisons interdites

| Combinaison | Motif |
|-------------|-------|
| VFL + régime réel | Incompatibilité structurelle |
| VFL + RFR non conforme | Condition d'éligibilité non remplie |
| Micro + dépassement durable des seuils | Bascule réel obligatoire |
| Franchise TVA + dépassement TVA | Passage TVA immédiat |
| Aides de zone non cumulables | Non-cumul légal |
| ZFU nouvelle entrée 2026 si dispositif fermé | Dispositif non ouvert |
| ZIP/ZAC hors professions santé éligibles | Hors champ |
| CPAM aide + non-conventionné | Hors champ |
| LMP + LMNP sur même périmètre | Qualifications mutuellement exclusives |
| SASU_IR / EURL_IR hors temporalité | Conditions temporelles non remplies |
| RSPM hors population cible | Hors champ |

---

## 4. Algorithme de détermination des scénarios possibles

### Étape 0 — Normalisation

```
convertir CA en HT si INPUT_MODE_CA = TTC
séparer recettes, TVA collectée, TVA déductible
calculer ancienneté, année de référence, dates utiles
qualifier le segment principal
```

### Étape 1 — Qualification du profil

```
si SEGMENT_ACTIVITE = sante         -> BRANCHE = SANTE
si SEGMENT_ACTIVITE = artiste_auteur -> BRANCHE = ARTISTE_AUTEUR
si SEGMENT_ACTIVITE = immobilier    -> BRANCHE = IMMOBILIER
sinon                               -> BRANCHE = GENERALISTE
```

### Étape 2 — Éligibilité aux grands régimes

**Branche Généraliste**
```
tester micro-BIC vente   si activité vente compatible ET seuils respectés
tester micro-BIC service si activité service compatible ET seuils respectés
tester micro-BNC         si activité libérale compatible ET seuils respectés
ouvrir EI réel BIC/BNC   si activité compatible (par défaut)
ouvrir option IS EI      si conditions d'option ET temporalité ok
ouvrir EURL/SASU         selon forme juridique envisagée ou simulation autorisée
```

**Branche Santé**
```
si remplaçant ET conditions RSPM remplies  -> ouvrir S_RSPM
si micro compatible                        -> ouvrir micro santé selon secteur
si conventionné secteur 1                  -> ouvrir branche CPAM secteur 1
si secteur 2                               -> distinguer OPTAM / non-OPTAM
si hors convention                         -> ouvrir branche hors convention
si simulation société admise               -> ouvrir SELARL/SELAS
```

**Branche Artiste-auteur**
```
si mode BNC ET seuils compatibles -> ouvrir A_BNC_MICRO
si BNC réel choisi ou imposé     -> ouvrir A_BNC_REEL
si mode TS                       -> ouvrir branche TS
déterminer RAAP applicable
```

**Branche Immobilier**
```
tester I_LMNP_MICRO
tester I_LMNP_REEL
tester I_LMP selon qualification principale ET critères LMP
```

### Étape 3 — Éligibilité TVA

```
pour chaque scénario base :
    si CA_HT_RETENU <= seuil franchise applicable  -> TVA_FRANCHISE possible
    si dépassement ou option TVA                   -> TVA_COLLECTEE possible
    si dépassement immédiat selon règle tolérance  -> exclure franchise à date pertinente
```

### Étape 4 — Éligibilité options fiscales

```
pour chaque scénario :
    si micro                  -> tester VFL (conditions RFR)
    si EI                     -> tester option IS
    si EURL/SASU à IR         -> tester conditions temporelles et juridiques
    si artiste-auteur TS      -> tester abattement forfaitaire vs frais réels
    si santé secteur 2        -> tester OPTAM si déclaré/éligible
```

### Étape 5 — Éligibilité aides

```
pour chaque scénario compatible :
    tester ACRE
    tester ARCE
    tester ZFRR / ZFRR+
    tester QPV
    tester stock ZFU
    tester ZIP/ZAC
    tester aide CPAM
    tester RAAP réduit
```

### Étape 6 — Génération des scénarios compatibles

```
produit cartésien contrôlé : BASE × TVA × OPTIONS × AIDES
ne générer que si MATRICE_COMPATIBILITE[combinaison] = vrai
```

### Étape 7 — Suppression des scénarios incompatibles

```
pour chaque scénario :
    vérifier incompatibilités juridiques
    vérifier non-cumul aides
    vérifier temporalité
    vérifier cohérence segment/régime
    si incohérence -> déplacer dans LISTE_SCENARIOS_EXCLUS avec motif
```

### Étape 8 — Validation finale

```
si LISTE_SCENARIOS_POSSIBLES = vide -> renvoyer erreur métier explicable
sinon -> figer LISTE_SCENARIOS_POSSIBLES
préparer pipeline de calcul
```

---

## 5. Formules symboliques de calcul

### 5.1 Formules transversales communes

**Normalisation TVA**
```
CA_HT_RETENU            = f_normalisation_CA(CA_ENCAISSE_UTILISATEUR, INPUT_MODE_CA,
                            TVA_COLLECTEE_UTILISATEUR, TAUX_TVA_APPLICABLE)
TVA_COLLECTEE_THEORIQUE = f_tva_collectee(CA_HT_RETENU, REGIME_TVA_APPLICABLE, TAUX_TVA_APPLICABLE)
TVA_NETTE_DUE           = TVA_COLLECTEE_THEORIQUE - TVA_DEDUCTIBLE_RETENUE
```

**IR attribuable au scénario (méthode différentielle)**
```
BASE_IR_FOYER_TOTALE    = AUTRES_REVENUS_FOYER_IMPOSABLES
                          + BASE_IR_SCENARIO
                          - AUTRES_CHARGES_DEDUCTIBLES_FOYER

IR_THEORIQUE_FOYER      = f_bareme_progressif(BASE_IR_FOYER_TOTALE,
                            NOMBRE_PARTS_FISCALES,
                            CFG_BAREME_IR_TRANCHES, CFG_BAREME_IR_TAUX,
                            CFG_REGLE_QUOTIENT_FAMILIAL, CFG_PLAFOND_AVANTAGE_QF)

IR_FOYER_SANS_SCENARIO  = f_bareme_progressif(AUTRES_REVENUS_FOYER_IMPOSABLES
                            - AUTRES_CHARGES_DEDUCTIBLES_FOYER, ...)

IR_ATTRIBUABLE_SCENARIO = IR_THEORIQUE_FOYER - IR_FOYER_SANS_SCENARIO
```

**Indicateurs finaux**
```
NET_AVANT_IR            = encaissements_personnels_nets_avant_ir
NET_APRES_IR            = NET_AVANT_IR - IR_ATTRIBUABLE_SCENARIO
COUT_TOTAL_SOCIAL_FISCAL = COTISATIONS_SOCIALES_NETTES
                           + IR_ATTRIBUABLE_SCENARIO
                           + TVA_NETTE_DUE
                           + autres_prelevements_non_recuperables
SUPER_NET               = NET_APRES_IR + aides_non_imposables_ou_tresorerie
```

---

### 5.2 Famille Micro-BIC / Micro-BNC

**Entrées nécessaires :** `CA_HT_RETENU`, `TYPE_MICRO`, `TVA_MODE`, `OPTION_VFL`, `ACRE_OU_NON`, aides de zone éventuelles.

```
ABATTEMENT_FORFAITAIRE      = max(CA_HT_RETENU × TAUX_ABATTEMENT_MICRO_APPLICABLE,
                                  MINIMUM_ABATTEMENT_MICRO_APPLICABLE)

BASE_IR_SCENARIO
    si OPTION_VFL = faux    = CA_HT_RETENU
                              - ABATTEMENT_FORFAITAIRE
                              - EXONERATION_BENEFICE_APPLICABLE
    si OPTION_VFL = vrai    = base IR foyer hors activité micro
                              (impôt traité via VFL dédié)

ASSIETTE_SOCIALE_BRUTE      = CA_HT_RETENU
COTISATIONS_SOCIALES_BRUTES = ASSIETTE_SOCIALE_BRUTE × TAUX_SOCIAL_MICRO_APPLICABLE
REDUCTION_ACRE              = f_acre_micro(COTISATIONS_SOCIALES_BRUTES,
                                CFG_ACRE_MODE_CALCUL,
                                CFG_TAUX_REDUCTION_ACRE_MICRO,
                                DUREE_RESTANTE_ACRE)
EXONERATION_SOCIALE_ZONE    = f_exoneration_micro_zone(ASSIETTE_SOCIALE_BRUTE,
                                zone_applicable, non_cumul)
COTISATIONS_SOCIALES_NETTES = max(0, COTISATIONS_SOCIALES_BRUTES
                                     - REDUCTION_ACRE
                                     - EXONERATION_SOCIALE_ZONE)

IMPOT_SCENARIO
    si OPTION_VFL = vrai    = CA_HT_RETENU × TAUX_VFL_APPLICABLE
    sinon                   = IR_ATTRIBUABLE_SCENARIO

NET_AVANT_IR
    si OPTION_VFL = vrai    = CA_HT_RETENU
                              - COTISATIONS_SOCIALES_NETTES
                              - TVA_NETTE_DUE
                              - IMPOT_SCENARIO
    sinon                   = CA_HT_RETENU
                              - COTISATIONS_SOCIALES_NETTES
                              - TVA_NETTE_DUE

NET_APRES_IR
    si OPTION_VFL = vrai    = NET_AVANT_IR
    sinon                   = NET_AVANT_IR - IR_ATTRIBUABLE_SCENARIO
```

---

### 5.3 Famille EI réel IR (BIC ou BNC)

**Entrées nécessaires :** `RECETTES_PRO_RETENUES`, `CHARGES_DEDUCTIBLES`, `DOTATIONS_AMORTISSEMENTS`, aides sociales/fiscales applicables.

```
RESULTAT_COMPTABLE              = RECETTES_PRO_RETENUES
                                  - CHARGES_DEDUCTIBLES
                                  - DOTATIONS_AMORTISSEMENTS

RESULTAT_FISCAL_AVANT_EXONERATIONS = RESULTAT_COMPTABLE
                                     + REINTEGRATIONS_FISCALES
                                     - DEDUCTIONS_FISCALES_COMPLEMENTAIRES

RESULTAT_FISCAL_APRES_EXONERATIONS = max(0,
                                       RESULTAT_FISCAL_AVANT_EXONERATIONS
                                       - EXONERATION_BENEFICE_ZONE
                                       - DEDUCTIONS_SPECIFIQUES)

ASSIETTE_SOCIALE_BRUTE          = f_assiette_sociale_ei_ir(
                                    RESULTAT_FISCAL_AVANT_EXONERATIONS,
                                    CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR)

COTISATIONS_SOCIALES_BRUTES     = f_cotisations_tns(ASSIETTE_SOCIALE_BRUTE,
                                    CFG_TAUX_SOCIAL_TNS_BIC_ou_BNC)

REDUCTION_ACRE                  = f_acre_hors_micro(COTISATIONS_SOCIALES_BRUTES,
                                    ASSIETTE_SOCIALE_BRUTE,
                                    CFG_ACRE_MODE_CALCUL,
                                    CFG_TAUX_REDUCTION_ACRE_HORS_MICRO)

AIDE_CPAM_IMPUTEE               = f_aide_cpam(ASSIETTE_SOCIALE_BRUTE,
                                    activite_conventionnee, secteur, parametres_cpam)

COTISATIONS_SOCIALES_NETTES     = max(0, COTISATIONS_SOCIALES_BRUTES
                                        - REDUCTION_ACRE
                                        - AIDE_CPAM_IMPUTEE
                                        - EXONERATION_SOCIALE_ZONE)

BASE_IR_SCENARIO                = RESULTAT_FISCAL_APRES_EXONERATIONS

NET_AVANT_IR                    = RECETTES_PRO_RETENUES
                                  - CHARGES_DECAISSEES
                                  - COTISATIONS_SOCIALES_NETTES
                                  - TVA_NETTE_DUE

NET_APRES_IR                    = NET_AVANT_IR - IR_ATTRIBUABLE_SCENARIO
```

---

### 5.4 Famille EI réel IS / EURL IS / SELARL IS

**Entrées nécessaires :** `RECETTES_PRO_RETENUES`, `CHARGES_DEDUCTIBLES`, `REMUNERATION_DIRIGEANT_ENVISAGEE`, `DIVIDENDES_ENVISAGES`.

```
RESULTAT_COMPTABLE              = RECETTES_PRO_RETENUES
                                  - CHARGES_DEDUCTIBLES
                                  - DOTATIONS_AMORTISSEMENTS
                                  - REMUNERATION_DEDUCTIBLE

RESULTAT_FISCAL_IS              = RESULTAT_COMPTABLE
                                  + REINTEGRATIONS
                                  - DEDUCTIONS
                                  - EXONERATION_BENEFICE_APPLICABLE

IS_DU_SCENARIO                  = f_is(RESULTAT_FISCAL_IS,
                                    CFG_TAUX_IS_REDUIT,
                                    CFG_TAUX_IS_NORMAL,
                                    CFG_SEUIL_IS_REDUIT)

RESULTAT_APRES_IS               = RESULTAT_FISCAL_IS - IS_DU_SCENARIO

ASSIETTE_SOCIALE_BRUTE          = f_assiette_dirigeant_tns(
                                    REMUNERATION_DIRIGEANT_ENVISAGEE,
                                    dividendes_assujettis_eventuels,
                                    CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_TNS)

COTISATIONS_SOCIALES_BRUTES     = f_cotisations_tns(ASSIETTE_SOCIALE_BRUTE,
                                    taux_tns_applicables)

COTISATIONS_SOCIALES_NETTES     = COTISATIONS_SOCIALES_BRUTES
                                  - REDUCTION_ACRE_EVENTUELLE
                                  - AIDE_CPAM_EVENTUELLE

DIVIDENDES_DISTRIBUABLES        = max(0, RESULTAT_APRES_IS
                                       - RESERVES_OBLIGATOIRES)

DIVIDENDES_NETS_PERCUS          = f_dividendes_nets(DIVIDENDES_DISTRIBUABLES,
                                    prelevements_applicables,
                                    assujettissement_social_eventuel)

BASE_IR_SCENARIO                = REMUNERATION_IMPOSABLE_DIRIGEANT
                                  + DIVIDENDES_IMPOSABLES

NET_AVANT_IR                    = REMUNERATION_NETTE_DIRIGEANT
                                  + DIVIDENDES_NETS_PERCUS

NET_APRES_IR                    = NET_AVANT_IR - IR_ATTRIBUABLE_SCENARIO
```

---

### 5.5 Famille SASU IS / SELAS IS

```
RESULTAT_COMPTABLE              = RECETTES_PRO_RETENUES
                                  - CHARGES_DEDUCTIBLES
                                  - DOTATIONS_AMORTISSEMENTS
                                  - COUT_TOTAL_REMUNERATION_PRESIDENT

RESULTAT_FISCAL_IS              = RESULTAT_COMPTABLE
                                  + REINTEGRATIONS
                                  - DEDUCTIONS
                                  - EXONERATION_BENEFICE_APPLICABLE

IS_DU_SCENARIO                  = f_is(RESULTAT_FISCAL_IS, ...)

ASSIETTE_SOCIALE_BRUTE          = REMUNERATION_BRUTE_PRESIDENT

COTISATIONS_SOCIALES_BRUTES     = f_cotisations_assimile_salarie(
                                    ASSIETTE_SOCIALE_BRUTE,
                                    CFG_TAUX_SOCIAL_ASSIMILE_SALARIE)

COTISATIONS_SOCIALES_NETTES     = COTISATIONS_SOCIALES_BRUTES
                                  - allegements_eventuels

REMUNERATION_NETTE_DIRIGEANT    = f_net_salaire_dirigeant(ASSIETTE_SOCIALE_BRUTE,
                                    COTISATIONS_SOCIALES_BRUTES)

DIVIDENDES_NETS_PERCUS          = f_dividendes_nets(...)

BASE_IR_SCENARIO                = REMUNERATION_IMPOSABLE_PRESIDENT
                                  + DIVIDENDES_IMPOSABLES

NET_AVANT_IR                    = REMUNERATION_NETTE_DIRIGEANT
                                  + DIVIDENDES_NETS_PERCUS

NET_APRES_IR                    = NET_AVANT_IR - IR_ATTRIBUABLE_SCENARIO
```

---

### 5.6 Famille Santé

**S_RSPM**
```
ASSIETTE_SOCIALE_BRUTE  = CA_HT_RETENU
COTISATIONS_SOCIALES    = ASSIETTE_SOCIALE_BRUTE × CFG_TAUX_SOCIAL_RSPM
BASE_IR_SCENARIO        = règle_fiscale_associee_au_statut_rspm
NET_APRES_IR            = CA_HT_RETENU
                          - COTISATIONS_SOCIALES_NETTES
                          - TVA_NETTE_DUE
                          - IR_ATTRIBUABLE_SCENARIO
```

**S_MICRO_BNC_SECTEUR_1 / SECTEUR_2**

Noyau identique à Micro-BNC, avec en plus :
```
AIDE_CPAM_IMPUTEE       = f_aide_cpam(assiette, secteur, CFG_PARAM_AIDE_CPAM_*)
TAUX_MALADIE_APPLICABLE = CFG_TAUX_MALADIE_SECTEUR_X selon conventionnement
```

**S_EI_REEL_SECTEUR_1 / 2 / 3**

Noyau identique à EI réel IR BNC, avec en plus :
```
AIDE_CPAM_IMPUTEE           = f_aide_cpam(...)
DEDUCTIONS_SPECIFIQUES_SANTE = f_deductions_sante(groupes I/II/III, ...)
EXONERATION_ASV             = f_asv(secteur, conditions)
```

---

### 5.7 Famille Artiste-auteur

**A_BNC_MICRO**

Noyau identique à Micro-BNC, avec :
```
RAAP = 0                si non applicable
RAAP = f_raap(BASE_RAAP, CFG_TAUX_RAAP_NORMAL)   si applicable
COTISATIONS_SOCIALES_NETTES += RAAP
```

**A_BNC_REEL**

Noyau identique à EI réel BNC IR, avec :
```
COTISATIONS_ARTISTE_AUTEUR  = f_cotisations_artiste_auteur(assiette, taux)
RAAP                        = f_raap(...) si applicable
COTISATIONS_SOCIALES_NETTES = COTISATIONS_ARTISTE_AUTEUR + RAAP - exonerations_eventuelles
```

**A_TS_ABATTEMENT_FORFAITAIRE**
```
REVENU_BRUT_TS          = RECETTES_PRO_RETENUES
ABATTEMENT_TS           = REVENU_BRUT_TS × CFG_ABATTEMENT_TS_FORFAITAIRE_ARTISTE_AUTEUR
BASE_IR_SCENARIO        = REVENU_BRUT_TS - ABATTEMENT_TS
COTISATIONS_NETTES      = f_cotisations_artiste_auteur_ts(...)
NET_APRES_IR            = REVENU_BRUT_TS - COTISATIONS_NETTES - IR_ATTRIBUABLE_SCENARIO
```

**A_TS_FRAIS_REELS**
```
BASE_IR_SCENARIO        = REVENU_BRUT_TS - FRAIS_REELS_TS
(reste identique à A_TS)
```

---

### 5.8 Famille LMNP / LMP

**I_LMNP_MICRO**
```
ABATTEMENT_FORFAITAIRE  = RECETTES_LOCATION_MEUBLEE × abattement_type_meuble_applicable
BASE_IR_SCENARIO        = RECETTES_LOCATION_MEUBLEE - ABATTEMENT_FORFAITAIRE
COTISATIONS_NETTES      = contributions_ou_cotisations_selon_statut
NET_APRES_IR            = RECETTES_LOCATION_MEUBLEE
                          - charges_decaissees_reelles
                          - COTISATIONS_NETTES
                          - IR_ATTRIBUABLE_SCENARIO
```

**I_LMNP_REEL**
```
RESULTAT_FISCAL         = RECETTES_LOCATION_MEUBLEE
                          - CHARGES_DEDUCTIBLES
                          - DOTATIONS_AMORTISSEMENTS
BASE_IR_SCENARIO        = résultat_fiscal_retenu_selon_regles_lmnp
NET_APRES_IR            = encaissement - decaissements - IR_ATTRIBUABLE_SCENARIO
                          - prelevements_sociaux_applicables
```

**I_LMP**
```
ASSIETTE_SOCIALE_BRUTE  = résultat_lmp_retenu
COTISATIONS_SSI         = f_cotisations_ssi_lmp(ASSIETTE_SOCIALE_BRUTE,
                            CFG_TAUX_SOCIAL_LMP_SSI)
BASE_IR_SCENARIO        = résultat_fiscal_lmp
NET_APRES_IR            = résultat_tresorerie - COTISATIONS_SSI - IR_ATTRIBUABLE_SCENARIO
```

---

## 6. Gestion des options et des aides

### 6.1 Ordre d'application

```
1. Qualification du régime de base
2. Qualification TVA
3. Qualification option fiscale
4. Qualification aide sociale
5. Qualification exonération fiscale
6. Calcul du scénario
7. Comparaison
```

### 6.2 Cas standards

| Combinaison | Effet |
|-------------|-------|
| Régime sans option ni aide | Calcul pur du régime de base |
| Régime + option VFL | L'option modifie le bloc impôt |
| Régime + option IS | L'option modifie la structure de résultat |
| Régime + option frais réels | L'option modifie la base IR |
| Régime + option OPTAM | L'option modifie les paramètres santé |
| Régime + aide sociale | L'aide s'impute sur le bloc cotisations |
| Régime + exonération zone | L'aide s'impute sur le bloc fiscal |
| Régime + option + aide | Appliquer l'option sur l'architecture, puis l'aide sur les blocs ciblés |

### 6.3 Typologie des aides par point d'application

| Type | Aides concernées |
|------|-----------------|
| Modifient seulement les cotisations | ACRE, certaines aides CPAM, exonérations sociales de zone |
| Modifient seulement l'impôt | Exonérations sur bénéfices de zone, régimes territoriaux |
| Modifient seulement la trésorerie | ARCE, ZIP/ZAC forfaitaire (flux externe) |
| Mixtes social + fiscal | ZFRR+ selon paramétrage retenu |

### 6.4 Règles de priorité en cas de non-cumul

Si deux aides ciblent la même assiette, appliquer une règle explicite parmi :
- `NON_CUMUL` : seule l'aide la plus favorable est retenue
- `PRIORITE_AIDE_A` : prioriser selon règle codifiée
- `CUMUL_DANS_LIMITE_PLAFOND` : cumul jusqu'à un plafond paramétré
- `APPLICATION_SEQUENTIELLE` : appliquer dans un ordre défini

En cas de conflit sur le régime optimal, le moteur doit exposer le choix à l'utilisateur avec les écarts chiffrés, sans trancher silencieusement.

### 6.5 Règles spécifiques par aide

**ACRE** — aide temporaire, proratisée si nécessaire, s'applique sur cotisations ciblées, ne doit pas artificiellement améliorer la robustesse long terme.

**ARCE** — ne doit jamais figurer dans `NET_APRES_IR_RECURRENT`. Doit apparaître dans `AIDE_ARCE_TRESORERIE` et peut alimenter un indicateur `TRESORERIE_INITIALE`.

**ZFRR / QPV / ZFU** — modéliser par tables d'éligibilité et de non-cumul. Attention : la logique ZFU a changé pour les nouvelles entrées. L'indicateur `CFG_ZFU_NOUVELLES_ENTREES_AUTORISEES` conditionne l'ouverture du scénario.

**CPAM** — aide réservée à des conventionnements spécifiques. `CFG_PARAM_AIDE_CPAM_*` conditionne le calcul par secteur.

**RAAP** — traiter comme sous-bloc autonome conditionnel. Taux réduit possible selon `CFG_TAUX_RAAP_REDUIT` et `OPTION_RAAP_TAUX_REDUIT`.

---

## 7. Pipeline d'exécution global

```
 1. Normalisation des entrées
 2. Contrôles de cohérence préalables
 3. Qualification du segment
 4. Qualification des régimes de base
 5. Qualification TVA
 6. Qualification des options fiscales
 7. Qualification des aides
 8. Génération des scénarios compatibles
 9. Suppression des scénarios incompatibles
10. Calcul scénario par scénario
11. Calcul des indicateurs comparatifs
12. Classement
13. Sélection du scénario recommandé
14. Production de la sortie structurée
15. Génération des avertissements et éléments à confirmer
```

---

## 8. Matrice de dépendances et d'incompatibilités

### 8.1 Dépendances

| Condition | Prérequis |
|-----------|-----------|
| VFL | MICRO + RFR_OK |
| TVA_FRANCHISE | SEUIL_TVA_OK |
| EI_IS | OPTION_IS_EI_OK |
| EURL_IR / SASU_IR | CONDITIONS_IR_TEMPORAIRE_OK |
| CPAM_AIDE | PROFESSION_SANTE + CONVENTIONNEMENT_COMPATIBLE |
| OPTAM | SECTEUR_2 + ADHESION_OPTAM |
| ZIP_ZAC | PROFESSION_SANTE + ZONE_OK |
| RAAP | ARTISTE_AUTEUR + ASSIETTE_OU_SEUIL_OK |
| LMP | CRITERES_LMP_OK |
| ZFRR / QPV / ZFU | ZONE_OK + DATE_OK + ENTITE_OK + OPTION_NON_CUMUL_OK |
| ARCE | ARE + ACRE + CREATION_REPRISE_OK |

### 8.2 Incompatibilités

| Combinaison | Motif |
|-------------|-------|
| VFL + REEL | Structurel |
| VFL + RFR_NON_OK | Condition éliminatoire |
| MICRO + DEPASSEMENT_DURABLE | Bascule réel obligatoire |
| TVA_FRANCHISE + DEPASSEMENT_TVA | Passage immédiat |
| CPAM_AIDE_PLEINE + HORS_CONVENTION | Hors champ |
| ZIP_ZAC + non-santé | Hors champ |
| LMNP + LMP sur même périmètre | Qualifications exclusives |
| ZFRR + autre régime de zone (si non-cumul) | Non-cumul légal |
| ZFU nouvelle entrée 2026 si fermé | Dispositif non ouvert |

### 8.3 Remplacements automatiques

| Événement | Remplacement |
|-----------|-------------|
| Dépassement TVA | TVA_FRANCHISE → TVA_COLLECTEE |
| VFL caduc (RFR) | VFL → IR_CLASSIQUE |
| Dépassement micro durable | MICRO → REEL_OBLIGATOIRE |
| Qualification LMP atteinte | LMNP → LMP |

---

## 9. Règles de comparaison entre scénarios

### 9.1 Scénario de référence

Par ordre de priorité :
```
1. Régime actuellement déclaré par l'utilisateur
2. Micro par défaut si disponible
3. Premier scénario juridiquement disponible le plus simple
```

### 9.2 Écarts à calculer

```
DELTA_NET_AVANT_IR    = NET_AVANT_IR - NET_AVANT_IR_REFERENCE
DELTA_NET_APRES_IR    = NET_APRES_IR - NET_APRES_IR_REFERENCE
DELTA_COTISATIONS     = COTISATIONS_SOCIALES_NETTES - COTISATIONS_REFERENCE
DELTA_FISCAL          = (IR_ATTRIBUABLE_SCENARIO + IS_DU_SCENARIO) - CHARGE_FISCALE_REFERENCE
DELTA_COUT_TOTAL      = COUT_TOTAL_SOCIAL_FISCAL - COUT_TOTAL_REFERENCE
DELTA_TRESORERIE      = AIDE_ARCE_TRESORERIE + autres_aides_ponctuelles - référence
```

### 9.3 Axes de classement

| Axe | Variable de classement |
|-----|----------------------|
| Revenu net | `NET_APRES_IR` (décroissant) |
| Revenu super-net | `SUPER_NET` (décroissant) |
| Revenu récurrent | `NET_RECURRENT_HORS_AIDES` (décroissant) |
| Coût total | `COUT_TOTAL_SOCIAL_FISCAL` (croissant) |
| Indépendance aides | `DEPENDANCE_AIDES_RATIO` (croissant) |
| Simplicité | `SCORE_COMPLEXITE_ADMIN` (croissant) |
| Robustesse | `SCORE_ROBUSTESSE` (décroissant) |

### 9.4 Score synthétique

```
SCORE_GLOBAL_SCENARIO = w_net         × normaliser(NET_APRES_IR)
                      - w_complexite  × normaliser(SCORE_COMPLEXITE_ADMIN)
                      - w_dependance  × normaliser(DEPENDANCE_AIDES_RATIO)
                      + w_robustesse  × normaliser(SCORE_ROBUSTESSE)
```

Les poids `w_*` sont paramétrables et doivent figurer dans la configuration.

### 9.5 Indicateurs complémentaires

```
SCORE_ROBUSTESSE        = f_robustesse(
                            resultat_hors_aides,
                            sensibilite_charges,
                            sensibilite_CA,
                            dependance_options_temporaires,
                            dependance_aides_temporaires)

DEPENDANCE_AIDES_RATIO  = (valeur_aides_recurrentes
                           + valeur_avantage_fiscal_temporaire
                           + valeur_aides_tresorerie_annualisee)
                          / avantage_total_vs_reference
```

---

## 10. Cas limites, exceptions et contrôles

### 10.1 Données incohérentes

```
CA saisi en TTC alors que le moteur attend HT
TVA déclarée alors que franchise sélectionnée
Charges négatives
Autres revenus foyer manquants pour calcul IR complet
Dividendes saisis dans une structure non concernée
Secteur conventionnel santé incohérent avec profession déclarée
```

### 10.2 Scénarios impossibles

```
Micro malgré dépassement durable des seuils
VFL sans éligibilité RFR
Aide CPAM sans conventionnement compatible
ZIP/ZAC sans profession santé éligible
ZFU pour création nouvelle si dispositif fermé
LMP alors que critères non remplis
ARCE sans ARE/ACRE valide selon règle active
```

### 10.3 Entrées ambiguës

```
Activité mixte : vente + service + libéral
Double activité : santé + formation + conseil
Artiste-auteur : recettes mixtes BNC + TS
Location meublée mixte : longue durée + tourisme
Changement de régime en cours d'année
Création en cours d'exercice avec prorata temporis
Aide de zone partiellement applicable (fraction de CA)
Structure société envisagée mais non encore créée
```

### 10.4 Avertissements obligatoires

```
Résultat basé sur données estimatives (NIVEAU_CERTITUDE < certain)
Résultat basé sur éligibilité déclarative non prouvée
Régime simulable mais nécessitant arbitrage juridique préalable
Comparaison contenant des aides temporaires (DEPENDANCE_AIDES_RATIO élevé)
IR du foyer calculé par différentiel — sensible à la qualité des données foyer
Taxe PUMa/rentier potentiellement déclenchable si structure de revenus particulière
```

### 10.5 Contrôles métiers

```
Prorata exercice incomplet appliqué
Non-cumul aides vérifié
Date d'entrée dans le dispositif vérifiée
Durée résiduelle d'un régime temporaire signalée
Stock de droits zone antérieure validé
Cohérence fiscal/social artiste-auteur vérifiée
Cohérence qualification LMNP/LMP vs autres revenus foyer vérifiée
```

---

## 11. Format de sortie SaaS

```json
{
  "inputs_normalises": {
    "profil": {},
    "activite": {},
    "foyer": {},
    "tva": {},
    "aides": {}
  },
  "qualification": {
    "segment_retenu": "",
    "flags": {},
    "elements_a_confirmer": []
  },
  "scenarios_possibles": [
    {
      "scenario_id": "",
      "base_id": "",
      "options": [],
      "aides": [],
      "motif_admission": ""
    }
  ],
  "scenarios_exclus": [
    {
      "scenario_id": "",
      "motifs_exclusion": []
    }
  ],
  "calculs_par_scenario": [
    {
      "scenario_id": "",
      "entrees_calculees": {},
      "intermediaires": {},
      "sorties": {
        "net_avant_ir": "",
        "net_apres_ir": "",
        "cout_total_social_fiscal": "",
        "super_net": "",
        "aides_tresorerie": ""
      },
      "explication": ""
    }
  ],
  "comparaison": {
    "scenario_reference": "",
    "classement_net_apres_ir": [],
    "classement_super_net": [],
    "classement_robustesse": [],
    "ecarts": []
  },
  "recommandation": {
    "scenario_recommande": "",
    "motif": "",
    "points_de_vigilance": []
  },
  "qualite_resultat": {
    "score_fiabilite": "",
    "niveau_fiabilite": "",
    "hypotheses": [],
    "avertissements": []
  }
}
```

---

## 12. Pseudocode complet du moteur

```
FONCTION MOTEUR_ARBITRAGE_FISCAL(ENTREES_UTILISATEUR, CONFIG_REGLEMENTAIRE):

    INITIALISER TRACE_DECISIONNELLE
    INITIALISER LISTE_SCENARIOS_POSSIBLES = []
    INITIALISER LISTE_SCENARIOS_EXCLUS = []
    INITIALISER DETAIL_CALCUL_PAR_SCENARIO = []

    // ─── ÉTAPE 1 : Normalisation ────────────────────────────────────────────
    NORMALISER dates, exercice, activité, profession
    NORMALISER CA en HT selon INPUT_MODE_CA
    NORMALISER TVA collectée / déductible
    NORMALISER données foyer
    NORMALISER aides demandées
    CALCULER flags de complétude
    AJOUTER à TRACE_DECISIONNELLE

    // ─── ÉTAPE 2 : Contrôles préalables ─────────────────────────────────────
    SI données critiques manquantes
        ALORS FLAG_DONNEES_A_COMPLETER = vrai
    CONTROLER cohérence activité / segment / profession
    CONTROLER cohérence TVA / franchise / dépassement
    CONTROLER cohérence aides demandées / statut déclaré
    AJOUTER avertissements si besoin

    // ─── ÉTAPE 3 : Qualification du segment ─────────────────────────────────
    SI segment = santé            ALORS BRANCHE = SANTE
    SINON SI segment = artiste    ALORS BRANCHE = ARTISTE_AUTEUR
    SINON SI segment = immobilier ALORS BRANCHE = IMMOBILIER
    SINON                              BRANCHE = GENERALISTE
    AJOUTER à TRACE_DECISIONNELLE

    // ─── ÉTAPE 4 : Qualification des régimes de base ─────────────────────────
    SELON BRANCHE :

        CAS GENERALISTE :
            TESTER micro BIC vente, micro BIC service, micro BNC
            TESTER EI réel BIC IR, EI réel BIC IS
            TESTER EI réel BNC IR, EI réel BNC IS
            TESTER EURL IS, EURL IR
            TESTER SASU IS, SASU IR

        CAS SANTE :
            TESTER RSPM si conditions remplies
            TESTER micro santé selon secteur conventionnel
            TESTER EI réel secteur 1
            TESTER EI réel secteur 2 OPTAM / non-OPTAM
            TESTER EI réel secteur 3 / hors convention
            TESTER SELARL IS, SELAS IS

        CAS ARTISTE_AUTEUR :
            TESTER BNC micro, BNC réel
            TESTER TS forfaitaire, TS frais réels
            DETERMINER RAAP applicable

        CAS IMMOBILIER :
            TESTER LMNP micro, LMNP réel, LMP

    // ─── ÉTAPE 5 : Qualification TVA ─────────────────────────────────────────
    POUR chaque base possible :
        SI CA_HT_RETENU <= seuil franchise applicable
            ALORS AJOUTER variante TVA_FRANCHISE
        SI TVA collectée requise ou choisie
            ALORS AJOUTER variante TVA_COLLECTEE

    // ─── ÉTAPE 6 : Qualification des options ─────────────────────────────────
    POUR chaque variante :
        SI micro ET VFL possible
            ALORS dupliquer en VFL_OUI et VFL_NON
        SI EI ET option IS possible
            ALORS ouvrir sous-branche IS
        SI société à IR temporaire possible
            ALORS ouvrir sous-branche IR temporaire
        SI artiste TS
            ALORS ouvrir forfaitaire ET frais réels
        SI santé secteur 2
            ALORS distinguer OPTAM / non-OPTAM

    // ─── ÉTAPE 7 : Qualification des aides ───────────────────────────────────
    POUR chaque variante :
        TESTER ACRE, ARCE
        TESTER ZFRR, ZFRR+, QPV, ZFU_stock
        TESTER ZIP_ZAC
        TESTER aide CPAM
        TESTER RAAP / RAAP_réduit
        GENERER seulement les aides compatibles avec la base

    // ─── ÉTAPE 8 : Génération des scénarios ──────────────────────────────────
    PRODUIRE produit cartésien contrôlé : BASE × TVA × OPTIONS × AIDES
    POUR chaque combinaison :
        SI MATRICE_COMPATIBILITE[combinaison] = vrai
            ALORS AJOUTER à LISTE_SCENARIOS_POSSIBLES
        SINON
            AJOUTER à LISTE_SCENARIOS_EXCLUS avec motif

    // ─── ÉTAPE 9 : Nettoyage des incompatibilités ────────────────────────────
    POUR chaque scénario de LISTE_SCENARIOS_POSSIBLES :
        SI dépassement micro ET scénario micro             -> exclure
        SI dépassement TVA ET franchise                    -> exclure
        SI VFL sans éligibilité                            -> exclure
        SI aide non cumulable déjà présente                -> exclure ou arbitrer
        SI segment / régime incohérent                     -> exclure
        SI temporalité invalide                            -> exclure

    // ─── ÉTAPE 10 : Calcul scénario par scénario ─────────────────────────────
    POUR chaque scénario restant :
        CALCULER CA_HT_RETENU, TVA, recettes retenues
        CALCULER abattements / résultat comptable / résultat fiscal selon type
        CALCULER assiette sociale
        CALCULER cotisations sociales brutes
        APPLIQUER aides sociales (ACRE, CPAM, zone)
        CALCULER cotisations sociales nettes
        APPLIQUER exonérations fiscales (zone, secteur)
        CALCULER base IR ou IS
        CALCULER impôt attribuable au scénario
        CALCULER NET_AVANT_IR, NET_APRES_IR
        CALCULER COUT_TOTAL_SOCIAL_FISCAL, SUPER_NET
        CALCULER aides trésorerie séparées (ARCE, ZIP/ZAC)
        CALCULER SCORE_ROBUSTESSE, DEPENDANCE_AIDES_RATIO, SCORE_COMPLEXITE_ADMIN
        STOCKER dans DETAIL_CALCUL_PAR_SCENARIO

    // ─── ÉTAPE 11 : Comparaison ───────────────────────────────────────────────
    DETERMINER SCENARIO_REFERENCE
    POUR chaque scénario :
        CALCULER écarts vs référence (net, coût, cotisations, fiscal, trésorerie)
    CLASSER par NET_APRES_IR
    CLASSER par SUPER_NET
    CLASSER par SCORE_ROBUSTESSE
    CLASSER par SCORE_COMPLEXITE_ADMIN
    CALCULER SCORE_GLOBAL_SCENARIO
    DETERMINER SCENARIO_RECOMMANDE selon règle de priorité

    // ─── ÉTAPE 12 : Sortie ───────────────────────────────────────────────────
    CONSTRUIRE sortie structurée :
        inputs normalisés
        flags de qualification
        scenarios possibles
        scenarios exclus + motifs
        détail de calcul par scénario
        recommandation + motif
        écarts vs référence
        hypothèses retenues
        avertissements
        éléments à confirmer
        score et niveau de fiabilité
        trace décisionnelle

    RETOURNER sortie structurée

FIN FONCTION
```

---

## 13. Angles morts éventuels

- **Activités mixtes** : le moteur ne couvre pas nativement les profils exerçant simultanément plusieurs activités relevant de segments différents. Un sous-moteur ou une logique d'agrégation doit être spécifié séparément.
- **Changement de régime en cours d'année** : le prorata temporis est prévu comme variable (`CFG_PRORATA_TEMPORIS`) mais la logique de bascule mid-year nécessite une spécification dédiée.
- **Holding et structure multi-entités** : non couvert. Les scénarios IS supposent une entité unique.
- **Impôt sur les plus-values** : non intégré dans les formules de `NET_APRES_IR`. À traiter comme sous-module séparé pour LMNP/LMP et cessions.
- **Charges sociales minimales** : le moteur calcule des cotisations proportionnelles. Les cotisations minimales forfaitaires (régime TNS réel, cas de résultat nul ou négatif) doivent être explicitement intégrées dans `f_cotisations_tns`.
- **Régimes transitoires** : certains droits antérieurs ZFU ou régimes en extinction ne sont couverts que via `CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS`. Les cas de sortie progressive doivent être documentés dans la configuration.

---

## 14. Variables à confirmer avec un expert métier ou juridique

```
CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR          — Règles 2026 EI réel IR
CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_TNS     — Part soumise aux cotisations
CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_ASSIMILE — Règles assimilé-salarié
CFG_REGLES_PAMC                                — Paramètres PAMC 2026
CFG_ZFRR_COTISATIONS_CIBLEES                   — Périmètre exact des cotisations exonérées
CFG_QPV_CONDITIONS_EFFECTIF / CA_BILAN         — Critères 2026 effectifs
CFG_ZFU_NOUVELLES_ENTREES_AUTORISEES           — Statut ouverture 2026
CFG_ZFU_REGLE_STOCK_DROITS_ANTERIEURS          — Modalités de sortie pour stock existant
CFG_ARCE_ACTIVE / CFG_TAUX_ARCE               — Modalités 2026 à confirmer
CFG_FORMULE_TAXE_PUMA                          — Assiette et calcul 2026
CFG_REGLES_AFFECTATION_IMPOT_FOYER_AU_SCENARIO — Méthode différentielle à valider
```

---

## 15. Ce qui est prêt à être codé tel quel

- Structure de données des variables d'entrée (section 2.1) → interfaces TypeScript
- Noms des variables de configuration (section 2.2) → fichier `fiscal_params_YYYY.ts` à peupler
- Flags logiques (section 2.3) → type union ou enum
- Variables intermédiaires (section 2.4) → type de résultat de calcul par scénario
- Cartographie des scénarios bases (section 3.2) → constantes ou enum de scénarios
- Pipeline d'exécution (section 7) → structure du fichier `engine/index.ts`
- Format de sortie JSON (section 11) → interface de réponse API
- Pseudocode complet (section 12) → squelette de fonctions à implémenter