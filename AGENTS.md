# CONTEXT.md — Moteur de Règles Fiscal 2026

## Rôle et mission

Ce fichier décrit le contexte, le périmètre et les contraintes du moteur décisionnel fiscal intégré à WYMBY. Il sert de référence pour tout agent IA (Codex ou autre) chargé d'implémenter, auditer ou étendre ce moteur.

Le moteur a pour mission de :
1. Déterminer les régimes, options et aides éligibles pour un profil utilisateur donné
2. Calculer chaque scénario éligible via des formules symboliques paramétrables
3. Comparer les scénarios entre eux sur plusieurs axes (net social, net fiscal, net final)
4. Produire une sortie structurée et explicable, sans jamais imposer d'explication non sollicitée

---

## Contrainte fondamentale : zéro chiffre codé en dur

**Aucun taux, seuil, plafond, abattement, montant ou paramètre légal ne doit apparaître en dur dans le code métier.**

Toute constante réglementaire (PASS, SMIC, plafonds RFR, taux de cotisations, seuils de CA micro, taux d'abattement, barèmes IR, montants d'aides, etc.) doit être extraite dans un fichier de configuration dédié (`config/fiscal_params_YYYY.ts` ou équivalent), versionné par année fiscale.

Cette règle est non négociable. Elle garantit la maintenabilité du moteur face aux évolutions légales annuelles.

---

## Périmètre couvert (version 2026)

### Segment 1 — Généralistes (consultants, artisans, commerçants)

| Code | Description |
|------|-------------|
| C01–C04 | Micro-BIC Achat/Revente — combinaisons TVA × Versement Libératoire |
| C05–C08 | Micro-BIC Prestation de Service — combinaisons TVA × Versement Libératoire |
| C09–C12 | Micro-BNC Libéral — combinaisons TVA × Versement Libératoire |
| C13 | EI Réel BIC + IR (Assiette Sociale Unique 2026) |
| C14 | EI Réel BIC + IS (Assimilation EURL) |
| C15 | EI Réel BNC + IR (Assiette Sociale Unique 2026) |
| C16 | EI Réel BNC + IS (Assimilation EURL) |
| C17 | EURL à l'IS (Gérant Majoritaire TNS) |
| C18 | EURL à l'IR (Transparence fiscale — limité 5 ans) |
| C19 | SASU à l'IS (Président Assimilé-Salarié — stratégie dividendes) |
| C20 | SASU à l'IR (Transparence fiscale — limité 5 ans) |

### Segment 2 — Santé (médical & paramédical)

| Code | Description |
|------|-------------|
| S01 | RSPM Remplaçant (CA < seuil RSPM) — taux unique Maladie + Retraite |
| S02 | Micro-BNC Secteur 1 + Abattement 34% + Aide CPAM (cotisation Maladie réduite) |
| S03 | Micro-BNC Secteur 2 + Abattement 34% + Cotisation Maladie Taux Plein |
| S04 | EI Réel Secteur 1 + Déclaration 2035 + Aide CPAM + Déductions groupes I/II/III |
| S05 | EI Réel Secteur 2 OPTAM + Déclaration 2035 + Aide CPAM partielle |
| S06 | EI Réel Secteur 2 NON-OPTAM + Déclaration 2035 + Cotisations Taux Plein |
| S07 | EI Réel Secteur 3 / Hors Convention + Déclaration 2035 + Exonération ASV |
| S08 | SELARL à l'IS (Gérant Majoritaire — arbitrage Rémunération/Dividendes) |
| S09 | SELAS à l'IS (Président Assimilé-Salarié — stratégie dividendes) |

### Segment 3 — Artistes-Auteurs

| Code | Description |
|------|-------------|
| A01 | Artiste-Auteur BNC + Micro-BNC + Franchise TVA |
| A02 | Artiste-Auteur BNC + Micro-BNC + TVA Collectée |
| A03 | Artiste-Auteur BNC + Réel (2035) + Retraite RAAP (si recettes > seuil RAAP) |
| A04 | Artiste-Auteur Traitements & Salaires + Frais réels forfaitaires (10%) |
| A05 | Artiste-Auteur Traitements & Salaires + Frais réels justifiés |

### Segment 4 — Immobilier (LMNP/LMP)

| Code | Description |
|------|-------------|
| I01 | LMNP Micro-BIC (abattement selon loi en vigueur) |
| I02 | LMNP Réel (amortissement murs + meubles) |
| I03 | LMP (revenus > seuil LMP + condition revenus professionnels) — cotisations SSI |

### Options Boosters (applicables par-dessus les régimes)

| Code | Description |
|------|-------------|
| B01 | ZFRR — Exonération IS/IR 100% sur bénéfices (durée paramétrable) |
| B02 | ZFRR+ — Exonération IS/IR + exonération cotisations micro |
| B03 | QPV / ZFU — Exonération progressive selon effectif |
| B04 | ACRE — Réduction de cotisations (taux et durée paramétrables) |
| B05 | ARCE — Versement capital (% des droits ARE restants, paramétrable) |
| B06 | ZIP / ZAC — Aide installation forfaitaire Santé (montant paramétrable) |

### Filtres d'exclusion automatique

| Code | Déclencheur | Conséquence |
|------|-------------|-------------|
| X01 | CA N-1 et N-2 > seuils micro | Bascule Réel obligatoire |
| X02 | CA > seuil TVA | Passage TVA collectée immédiat |
| X03 | RFR > seuil Versement Libératoire | Option VFL caduque, bascule IR classique |
| X04 | Revenu activité < seuil PUMa + revenus capital élevés | Taxe rentier potentiellement activée |

---

## Architecture du moteur (pipeline d'exécution)

```
1. Normalisation des entrées utilisateur
2. Qualification du profil (activité, structure juridique, régime TVA)
3. Application des filtres d'exclusion (X01–X04)
4. Génération de la liste des scénarios compatibles
5. Suppression des scénarios incompatibles (matrice d'incompatibilités)
6. Application des boosters éligibles (B01–B06) sur chaque scénario retenu
7. Calcul scénario par scénario (formules symboliques)
8. Comparaison multi-axes (net social, net fiscal, net final, coût total)
9. Classement et sélection du scénario optimal
10. Production de la sortie structurée
```

---

## Structure des variables (catégories)

### Variables d'entrée utilisateur
- Nature d'activité et code NAF / profession réglementée
- CA brut saisi (HT ou TTC selon profil TVA)
- Charges réelles ou forfait
- Situation familiale et nombre de parts fiscales
- Autres revenus du foyer (salaires, capitaux, foncier)
- Localisation géographique (commune, zone ZFU/QPV/ZFRR)
- Date de création ou d'immatriculation
- Éligibilité déclarée à certains dispositifs (ACRE, ARCE, ZIP)
- Régime TVA actuel (franchise, réel simplifié, réel normal)
- Secteur conventionnel pour la santé (1, 2 OPTAM, 2 non-OPTAM, 3)

### Variables de configuration réglementaires
Toutes stockées dans `config/fiscal_params_YYYY.ts` :
- Seuils de CA micro (BIC achat-revente, BIC services, BNC)
- Seuil franchise TVA et seuil de tolérance
- Seuil RFR Versement Libératoire par part
- Taux d'abattement micro par catégorie
- Taux Versement Libératoire par catégorie
- Taux de cotisations sociales par régime (micro, TNS réel, assimilé-salarié)
- PASS (Plafond Annuel de la Sécurité Sociale)
- Barème progressif IR (tranches et taux)
- Taux ACRE et durée d'application
- Pourcentage ARCE
- Montants forfaitaires ZIP/ZAC
- Seuils et taux spécifiques santé (CPAM, RSPM, RAAP)
- Paramètres LMP (seuil revenus, seuil CA)
- Durées et taux d'exonération ZFRR/QPV/ZFU

### Variables booléennes / flags logiques
Exemples (liste non exhaustive) :
- `EST_ELIGIBLE_MICRO_BIC`, `EST_ELIGIBLE_MICRO_BNC`
- `EST_ELIGIBLE_VFL` (Versement Libératoire)
- `TVA_FRANCHISE`, `TVA_COLLECTEE`
- `ACRE_ACTIF`, `ARCE_ACTIVE`
- `EST_ZONE_EXONEREE` (ZFRR, QPV, ZFU)
- `EST_PROFESSIONNEL_SANTE`, `EST_SECTEUR_1`, `EST_OPTAM`
- `EST_ARTISTE_AUTEUR`
- `EST_LMNP`, `EST_LMP`
- `BASCULEMENT_REEL_OBLIGE` (filtre X01)
- `TAXE_RENTIER_APPLICABLE` (filtre X04)

### Variables intermédiaires de calcul
- `CA_HT_RETENU` — CA après retraitement TVA éventuel
- `BASE_SOCIALE` — assiette pour calcul des cotisations
- `COTISATIONS_BRUTES`, `REDUCTION_COTISATIONS`, `COTISATIONS_NETTES`
- `CHARGES_DEDUCTIBLES` — charges réelles retenues
- `RESULTAT_FISCAL` — bénéfice imposable avant IR
- `REVENU_IMPOSABLE_FOYER` — agrégat foyer pour calcul IR
- `IMPOT_ATTRIBUABLE` — quote-part IR imputable au scénario
- `NET_AVANT_IR`, `NET_APRES_IR`
- `COUT_TOTAL` — charges + cotisations + impôt
- `GAIN_VS_REFERENCE` — écart vs scénario de référence

### Variables de sortie
- `LISTE_SCENARIOS_POSSIBLES` — scénarios passant les filtres d'éligibilité
- `LISTE_SCENARIOS_EXCLUS` — scénarios exclus + motif d'exclusion
- `DETAIL_CALCUL_PAR_SCENARIO` — formules résolues par scénario
- `SCENARIO_OPTIMAL` — scénario recommandé selon critère principal
- `ECARTS_VS_REFERENCE` — tableau comparatif
- `HYPOTHESES_RETENUES` — liste des hypothèses appliquées
- `AVERTISSEMENTS` — alertes (données manquantes, ambiguïtés, risques)
- `NIVEAU_FIABILITE` — indicateur de qualité du calcul (complet / partiel / estimation)
- `ELEMENTS_A_CONFIRMER` — données à valider par l'utilisateur ou un expert

---

## Règles de compatibilité et d'incompatibilité (résumé)

- Un même contribuable ne peut pas cumuler micro et réel pour une même activité sur la même période
- Le Versement Libératoire (VFL) est conditionné au RFR N-2 < seuil — l'option est caduque si le seuil est dépassé
- ACRE et ZFRR peuvent se cumuler sur les cotisations, selon règles de non-cumul à vérifier
- ARCE et maintien des droits ARE sont mutuellement exclusifs
- LMP et LMNP sont mutuellement exclusifs pour un même bien
- Les secteurs conventionnels santé (1, 2, 3) déterminent les aides CPAM applicables — non cumulables entre secteurs
- EI option IS (C14/C16) implique une assimilation EURL avec des règles de rémunération spécifiques
- La transparence fiscale (IR) des EURL/SASU est limitée dans le temps (durée paramétrable)

---

## Principes UX métier (non négociables)

- **Ne jamais demander ce que l'application peut déduire** : si une donnée est calculable à partir d'autres entrées, elle ne doit pas être demandée à l'utilisateur
- **Ne jamais imposer d'explication** : les explications sont disponibles à la demande, jamais affichées par défaut
- **Préserver la terminologie fiscale** : les termes techniques (BNC, VFL, ACRE, PASS, etc.) ne doivent pas être simplifiés ou remplacés par des périphrases infantilisantes
- **Toujours afficher le scénario de référence** avant le scénario optimal pour permettre une comparaison lisible

---

## Fichiers associés

| Fichier | Rôle |
|---------|------|
| `config/fiscal_params_YYYY.ts` | Toutes les constantes légales, par année fiscale |
| `engine/eligibility.ts` | Logique de détermination des scénarios éligibles |
| `engine/calculator.ts` | Formules de calcul par scénario |
| `engine/comparator.ts` | Logique de comparaison et classement |
| `engine/output.ts` | Formatage de la sortie structurée |
| `AGENTS.md` | Instructions de travail pour Codex |
| `CONTEXT.md` | Ce fichier — périmètre et contraintes du moteur |

---

## Zones d'attention pour les agents IA

- **Ne jamais inventer de valeur manquante** : si une variable de configuration est absente, lever une alerte explicite plutôt que d'utiliser une valeur par défaut silencieuse
- **Signaler toute ambiguïté réglementaire** avant de proposer une modélisation
- **Ne pas confondre dépenses et amortissements** : les charges déductibles et les amortissements sont deux mécanismes distincts avec des assiettes et des temporalités différentes
- **Les calculs IR sont toujours des estimations** sauf si les données foyer complètes sont disponibles — toujours qualifier le niveau de fiabilité en sortie
- **Les boosters (B01–B06) modifient des assiettes différentes** selon les cas : certains agissent sur les cotisations, d'autres sur l'impôt, certains sur les deux — ne jamais les appliquer globalement sans vérifier leur point d'application