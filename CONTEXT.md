# CONTEXT.md — Simulateur fiscal WYMBY 2026

> Référence de projet pour tout contributeur humain ou agent IA.
> Décrit l'état réel de l'implémentation, les décisions d'architecture, les ambiguïtés ouvertes et le chemin restant.

---

## 1. Qu'est-ce que WYMBY ?

WYMBY est un simulateur d'arbitrage fiscal pour indépendants français. Il compare automatiquement les régimes, options fiscales et aides disponibles pour un profil donné, calcule chaque scénario, et produit une recommandation argumentée.

**Positionnement** : outil de décision pré-expert — les résultats orientent, ne remplacent pas un expert-comptable.

---

## 2. État de l'implémentation (2026-03-29)

### Ce qui est fait

| Composant | Statut | Détail |
|-----------|--------|--------|
| `packages/types` | ✅ Complet | Toutes les interfaces TypeScript partagées |
| `packages/config` | ✅ Complet | `fiscal_params_2026.ts` — 2 119 lignes, zéro valeur en dur dans le code métier |
| `packages/engine` — pipeline | ✅ Complet | Les 10 étapes du pipeline implémentées |
| `packages/engine` — Segment 1 (C01–C20) | ✅ Complet | Micro BIC/BNC, EI réel BIC/BNC, EURL IS/IR, SASU IS/IR |
| `packages/engine` — boosters B01–B06 | ✅ Complet | ZFRR, ZFRR+, QPV/ZFU, ACRE, ARCE, ZIP/ZAC |
| `packages/engine` — filtres X01–X04 | ✅ Complet | Seuils micro, TVA, VFL, PUMa |
| `packages/engine` — tests | ✅ 57 tests | 5 fichiers Vitest, tous verts |
| `apps/web` | ❌ Non créé | Wizard React 4 étapes |
| `apps/api` | ❌ Non créé | Serveur HTTP / handler serverless |

### Segments V2 — stubs en place, calcul non implémenté

Les segments Santé (S01–S09), Artistes-Auteurs (A01–A05) et Immobilier (I01–I03) ont leurs types, leur registre de scénarios et leurs flags de qualification déclarés. Le dispatcher dans `engine/src/index.ts` retourne `null` avec un log `warn` pour ces scénarios — ils n'apparaissent donc pas dans les calculs mais n'empêchent pas le moteur de tourner.

---

## 3. Architecture

### Structure monorepo

```
wymby-simulateur/
├── packages/
│   ├── types/src/index.ts          — interfaces partagées (UserInput, EngineOutput, …)
│   ├── config/src/
│   │   ├── fiscal_params_2026.ts   — paramètres réglementaires 2026
│   │   └── index.ts                — export + resolveParams(annee)
│   └── engine/src/
│       ├── index.ts                — runEngine() / runEngineWithLogs()
│       ├── logger.ts               — EngineLogger (debug structuré)
│       ├── guards.ts               — validateUserInput()
│       ├── normalizer.ts           — normaliserEntrees()
│       ├── qualifier.ts            — qualifierProfil() + 25 QualificationFlags
│       ├── filters/
│       │   ├── exclusion.ts        — filtres X01–X04
│       │   └── incompatibility-matrix.ts
│       ├── scenarios/
│       │   ├── registry.ts         — SCENARIO_REGISTRY (28 scénarios)
│       │   ├── generator.ts        — genererScenarios()
│       │   └── booster-applicator.ts
│       ├── calculators/
│       │   ├── tva.ts
│       │   ├── ir.ts               — barème progressif + méthode différentielle
│       │   ├── is.ts
│       │   ├── cotisations-tns.ts  — ASU 2026, branches TNS, ACRE dégressif
│       │   ├── cotisations-assimile.ts
│       │   ├── micro.ts            — C01–C12
│       │   ├── ei-reel.ts          — C13–C16
│       │   └── societes.ts         — C17–C20
│       ├── comparator.ts           — scores, écarts, recommandation
│       └── output-builder.ts       — EngineOutput final
├── config/
│   └── fiscal_params_2026.ts       — copie miroir (source de vérité : packages/config)
├── ALGORITHME.md                   — spécification formelle des formules
├── CLAUDE.md                       — instructions pour agents IA
└── CONTEXT.md                      — ce fichier
```

### Pipeline d'exécution (10 étapes)

```
runEngine(UserInput) →
  1. validateUserInput()            — guards
  2. normaliserEntrees()            — CA HT/TTC, parts fiscales, TVA nette
  3. qualifierProfil()              — segment, flags booléens, régime TVA
  4. appliquerFiltresExclusion()    — X01–X04
  5. genererScenarios()             — BASE × TVA × VFL × AIDES
  6. filtrerScenariosParExclusion() — retire les scénarios hors seuils
  7. verifierIncompatibilites()     — matrice de compatibilité
  8. _calculerScenario() × N       — dispatch vers micro / ei-reel / societes
  9. construireComparaison()        — scores, écarts, classements
 10. construireEngineOutput()       — EngineOutput structuré
```

### Identifiants de scénarios

Format : `"BASE_ID+OPTION_TVA+OPTION_VFL+BOOSTER1+BOOSTER2"`

Exemples :
- `"G_MBIC_SERVICE+TVA_FRANCHISE+VFL_NON"`
- `"G_EI_REEL_BIC_IR+TVA_FRANCHISE+VFL_NON+BOOST_ACRE"`
- `"G_SASU_IS+TVA_COLLECTEE+VFL_NON+BOOST_ARCE"`

---

## 4. Contraintes non négociables

### C-01 — Zéro valeur en dur dans le code métier

Aucun taux, seuil, plafond ou montant réglementaire ne figure dans les fichiers `src/`. Tout est dans `fiscal_params_2026.ts`, structuré par section (`micro`, `tva`, `vfl`, `social`, `fiscal`, `aides`, `zones`, …).

Pour ajouter une année fiscale : créer `fiscal_params_2027.ts` et l'enregistrer dans `resolveParams()`.

### C-02 — Zéro valeur inventée

Si une donnée est manquante ou ambiguë, le moteur :
1. dégrade `niveau_fiabilite` (`complet` → `partiel` → `estimation`)
2. émet un avertissement explicite dans `avertissements`
3. n'utilise jamais de valeur par défaut silencieuse

### C-03 — Moteur isomorphe

`packages/engine` n'a aucune dépendance Node.js, DOM ou framework. Il tourne en browser, serverless et Node sans modification.

### C-04 — IR toujours différentiel

`IR_scenario = IR_foyer(avec_scénario) − IR_foyer(sans_scénario)`

Sans `AUTRES_REVENUS_FOYER_IMPOSABLES`, le calcul bascule en mode estimation et un avertissement est émis.

### C-05 — ARCE = flux trésorerie, pas revenu

`ARCE` est modélisée dans `AIDE_ARCE_TRESORERIE` uniquement. Elle contribue à `SUPER_NET` mais pas à `NET_APRES_IR`. Ne jamais les confondre dans les comparaisons.

---

## 5. Points d'attention techniques

### Assiette Sociale Unique 2026 (ASU)

Entrée en vigueur effective avril 2026 (LFSS 2024 art. 18).

```
ASU = max(plancher, min(revenu_net × 0.74, plafond))
plancher = 1,76 % du PASS ≈ 846 €
plafond  = 130 % du PASS ≈ 62 478 €
```

S'applique aux EI BIC/BNC au réel et aux EURL IR/SASU IR. Pour les EI IS : assiette = rémunération du dirigeant.

### Cotisations minimales TNS SSI

Si l'assiette est nulle ou négative, les cotisations minimales s'appliquent : **1 135 € total hors CFP** (retraite base + IJ maladie + invalidité-décès). Un avertissement est toujours émis.

### ACRE — réforme Décret 2026-69

- Avant le 01/07/2026 : taux max 50 % pour hors-micro
- Après le 01/07/2026 : taux max 25 % pour hors-micro
- Dégression entre 75 % et 100 % du PASS pour le hors-micro
- Durée : 12 mois (hors micro), 24 mois avec prolongation micro

### VFL (Versement Libératoire)

Condition : `RFR_N-2 ≤ CFG_SEUIL_RFR_VFL_PAR_PART × nb_parts` (seuil 2026 : 29 315 €/part).

Sans `RFR_N_2_UTILISATEUR`, l'éligibilité VFL est incertaine : le moteur génère les scénarios VFL mais dégrade la fiabilité.

### EURL IS — dividendes TNS

TODO [AMBIGUÏTÉ] ouvert : la franchise de 10 % du capital social sur l'assiette des cotisations TNS pour les dividendes nécessite le montant du capital. En l'absence de cette donnée, le moteur utilise le taux PS 18,6 % (pire cas) et marque la fiabilité `partiel`.

### VFL + NET_AVANT_IR

Pour les scénarios VFL, l'impôt libératoire est **déjà inclus dans `NET_AVANT_IR`** (déduit en même temps que les cotisations). `NET_APRES_IR = NET_AVANT_IR` pour ces scénarios. La relation `NET_APRES_IR = NET_AVANT_IR − IR_ATTRIBUABLE` ne s'applique qu'aux scénarios au barème progressif.

---

## 6. Ambiguïtés réglementaires ouvertes (TODO)

Ces points sont marqués `TODO [AMBIGUÏTÉ]` dans le code source avec la variable concernée, l'impact et la décision requise.

| Réf. | Variable | Description | Fichier |
|------|----------|-------------|---------|
| AMB-01 | `CFG_DATE_LIMITE_OPTION_IS_EI` | Date limite de l'option IS pour EI — confirmation administration fiscale requise | `qualifier.ts` |
| AMB-02 | `CFG_FORMULE_TAXE_PUMA` | Formule exacte de la taxe PUMa 2026 — non encore publiée | `qualifier.ts` |
| AMB-03 | `CFG_ARCE_ACTIVE` | Éligibilité ARCE post-réforme ARE 2024 — vérifier instruction Pôle Emploi | `qualifier.ts` |
| AMB-04 | `CFG_REGLES_ASSIETTE_SOCIALE_DIVIDENDES_TNS` | Franchise 10 % capital pour dividendes EURL IS — calcul approximatif sans capital social | `societes.ts` |
| AMB-05 | `CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR` | Prorata ASU si entrée en vigueur mi-année — applicable à toute l'année 2026 ou seulement à partir d'avril ? | `ei-reel.ts` |

---

## 7. Prochaines étapes

### Court terme — apps/web (wizard React)

Créer `apps/web/` avec :
- Vite + React + TypeScript
- Wizard 4 étapes (sans jargon fiscal dans les questions)
- `wizard/mapper.ts` : données utilisateur → `UserInput`
- Composants : `ScenarioCard`, `ComparaisonTable`, `FiabiliteBar`, `AvertissementBanner`
- Appel direct au moteur (import `@wymby/engine`) — pas d'API nécessaire en local

### Court terme — apps/api (optionnel)

Handler HTTP/serverless qui expose `POST /simulate` avec `UserInput` en body et retourne `EngineOutput`. Peut être Fastify, Hono ou un simple AWS Lambda handler.

### Moyen terme — Segment 2 (Santé S01–S09)

Les calculateurs spécifiques santé (cotisations CPAM, ASV, RAAP, RSPM) sont à implémenter. Les paramètres sont déjà dans `fiscal_params_2026.ts` (section `sante`). Les stubs dans le registre et le dispatcher sont en place.

### Moyen terme — Segments 3 et 4 (Artistes-Auteurs, Immobilier)

Même approche : les paramètres config et les types sont prêts, les calculateurs restent à écrire.

---

## 8. Glossaire fiscal

| Terme | Définition |
|-------|-----------|
| PASS | Plafond Annuel de la Sécurité Sociale (48 060 € en 2026) |
| PMSS | Plafond Mensuel de la Sécurité Sociale (4 005 € en 2026) |
| ASU | Assiette Sociale Unique — réforme 2026 de l'assiette des cotisations TNS |
| BIC | Bénéfices Industriels et Commerciaux |
| BNC | Bénéfices Non Commerciaux |
| VFL | Versement Forfaitaire Libératoire de l'IR (option micro) |
| ACRE | Aide à la Création ou Reprise d'Entreprise — réduction cotisations 1ère année |
| ARCE | Aide à la Reprise et à la Création d'Entreprise — versement capital ARE |
| ZFRR | Zone France Ruralités Revitalisées (ex-ZRR) |
| QPV | Quartier Prioritaire de la politique de la Ville |
| ZFU | Zone Franche Urbaine (fermée aux nouveaux entrants depuis LF 2026) |
| TNS | Travailleur Non Salarié (gérant majoritaire, EI) |
| IS | Impôt sur les Sociétés |
| IR | Impôt sur le Revenu |
| SSI | Sécurité Sociale des Indépendants (ex-RSI) |
| PUMa | Protection Universelle Maladie — cotisation subsidiaire sur revenus du capital |
| OPTAM | Option pratique Tarifaire Maîtrisée (secteur 2 santé) |
| ASV | Avantage Social Vieillesse (retraite complémentaire conventionnée médecins) |
| RAAP | Régime de retraite des Artistes-Auteurs Plasticiens |
| LMNP | Loueur en Meublé Non Professionnel |
| LMP | Loueur en Meublé Professionnel |
