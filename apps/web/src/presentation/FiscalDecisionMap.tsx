import { useState } from "react";
import "./FiscalDecisionMap.css";

type TreeTone = "plain" | "decision" | "regime" | "exclude" | "alert";

type TreeNode = {
  id?: string;
  label: string;
  tone?: TreeTone;
  note?: string;
  children?: TreeNode[];
};

type FocusProfile = {
  id: string;
  label: string;
  intro: string;
  path: string[];
};

const pipelineNodes: TreeNode[] = [
  {
    id: "p-entry",
    label: "Entrée utilisateur",
    tone: "plain",
    children: [
      {
        id: "p1",
        label: "Étape 1 — Normalisation",
        tone: "decision",
        children: [
          { id: "p1-tva", label: "CA saisi en TTC ? Conversion en HT", tone: "plain" },
          { id: "p1-dates", label: "Calcul ancienneté, année fiscale et dates utiles", tone: "plain" },
          { id: "p1-segment", label: "Qualification du segment principal", tone: "plain" },
        ],
      },
      {
        id: "p2",
        label: "Étape 2 — Filtres d'exclusion automatiques",
        tone: "decision",
        children: [
          {
            id: "x01",
            label: "X01 — CA N-1 et N-2 > seuils micro ?",
            tone: "decision",
            children: [
              {
                id: "x01-out",
                label: "Basculement réel obligatoire",
                tone: "exclude",
                note: "Tous les scénarios micro sont exclus.",
              },
            ],
          },
          {
            id: "x02",
            label: "X02 — CA > seuil de franchise TVA ?",
            tone: "decision",
            children: [
              {
                id: "x02-out",
                label: "TVA collectée obligatoire",
                tone: "exclude",
                note: "Les branches en franchise TVA sont retirées.",
              },
            ],
          },
          {
            id: "x03",
            label: "X03 — RFR N-2 > seuil VFL ?",
            tone: "decision",
            children: [
              {
                id: "x03-out",
                label: "Option VFL caduque",
                tone: "exclude",
                note: "Le moteur conserve les variantes micro sans versement libératoire.",
              },
            ],
          },
          {
            id: "x04",
            label: "X04 — Seuil PUMa et revenus de capital élevés ?",
            tone: "decision",
            children: [
              {
                id: "x04-out",
                label: "Avertissement taxe rentier potentielle",
                tone: "alert",
              },
            ],
          },
        ],
      },
      {
        id: "p3",
        label: "Étape 3 — Bifurcation par segment",
        tone: "decision",
        children: [
          { id: "seg-generalistes", label: "Branche A — Généralistes", tone: "plain" },
          { id: "seg-sante", label: "Branche B — Santé", tone: "plain" },
          { id: "seg-artistes", label: "Branche C — Artistes-auteurs", tone: "plain" },
          { id: "seg-immo", label: "Branche D — Immobilier", tone: "plain" },
        ],
      },
    ],
  },
];

const generalistesNodes: TreeNode[] = [
  {
    id: "ga1",
    label: "A.1 — Nature d'activité ?",
    tone: "decision",
    children: [
      {
        id: "ga1-vente",
        label: "Achat / revente",
        tone: "plain",
        children: [
          {
            id: "ga1-vente-micro",
            label: "CA <= seuil micro BIC vente ?",
            tone: "decision",
            children: [
              {
                id: "ga1-vente-franchise",
                label: "TVA franchise possible ? puis VFL éligible ?",
                tone: "decision",
                children: [
                  { label: "C01 — Micro-BIC vente — Franchise TVA — VFL oui", tone: "regime" },
                  { label: "C02 — Micro-BIC vente — Franchise TVA — VFL non", tone: "regime" },
                  { label: "C03 — Micro-BIC vente — TVA collectée — VFL oui", tone: "regime" },
                  { label: "C04 — Micro-BIC vente — TVA collectée — VFL non", tone: "regime" },
                ],
              },
              {
                label: "X01 — Basculement réel obligatoire",
                tone: "exclude",
                note: "Renvoi vers C13 ou C14.",
              },
            ],
          },
          {
            id: "ga1-vente-reel",
            label: "EI réel BIC toujours ouvert",
            tone: "decision",
            children: [
              { label: "C13 — EI Réel BIC + IR — Assiette Sociale Unique 2026", tone: "regime" },
              {
                label: "C14 — EI Réel BIC + IS — Assimilation EURL",
                tone: "regime",
                note: "Temporalité option IS encore sensible.",
              },
            ],
          },
        ],
      },
      {
        id: "ga1-service",
        label: "Prestation de service",
        tone: "plain",
        children: [
          {
            label: "CA <= seuil micro BIC service ?",
            tone: "decision",
            children: [
              { label: "C05 — Micro-BIC service — Franchise TVA — VFL oui", tone: "regime" },
              { label: "C06 — Micro-BIC service — Franchise TVA — VFL non", tone: "regime" },
              { label: "C07 — Micro-BIC service — TVA collectée — VFL oui", tone: "regime" },
              { label: "C08 — Micro-BIC service — TVA collectée — VFL non", tone: "regime" },
              { label: "X01 — Basculement réel obligatoire vers C13 ou C14", tone: "exclude" },
            ],
          },
        ],
      },
      {
        id: "ga1-bnc",
        label: "Libéral / BNC",
        tone: "plain",
        children: [
          {
            label: "CA <= seuil micro BNC ?",
            tone: "decision",
            children: [
              { label: "C09 — Micro-BNC — Franchise TVA — VFL oui", tone: "regime" },
              { label: "C10 — Micro-BNC — Franchise TVA — VFL non", tone: "regime" },
              { label: "C11 — Micro-BNC — TVA collectée — VFL oui", tone: "regime" },
              { label: "C12 — Micro-BNC — TVA collectée — VFL non", tone: "regime" },
              { label: "C15 — EI Réel BNC + IR — ASU 2026", tone: "regime" },
              { label: "C16 — EI Réel BNC + IS — Assimilation EURL", tone: "regime" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ga3",
    label: "A.3 — Forme sociétaire envisagée ?",
    tone: "decision",
    children: [
      {
        id: "ga3-eurl",
        label: "EURL",
        tone: "plain",
        children: [
          { label: "C17 — EURL à l'IS — Gérant majoritaire TNS", tone: "regime" },
          { label: "C18 — EURL à l'IR — Transparence fiscale temporaire", tone: "regime" },
        ],
      },
      {
        id: "ga3-sasu",
        label: "SASU",
        tone: "plain",
        children: [
          { label: "C19 — SASU à l'IS — Président assimilé-salarié", tone: "regime" },
          { label: "C20 — SASU à l'IR — Transparence fiscale temporaire", tone: "regime" },
        ],
      },
    ],
  },
];

const santeNodes: TreeNode[] = [
  {
    id: "sb1",
    label: "B.1 — Statut remplaçant et CA < seuil RSPM ?",
    tone: "decision",
    children: [
      {
        id: "s01",
        label: "S01 — RSPM remplaçant",
        tone: "regime",
        note: "Taux unique maladie + retraite, traitement fiscal à documenter plus finement.",
      },
    ],
  },
  {
    id: "sb2",
    label: "B.2 — Régime micro possible ?",
    tone: "decision",
    note: "CA <= seuil BNC et pas de filtre X01.",
    children: [
      {
        id: "sb2-sector",
        label: "Secteur conventionnel ?",
        tone: "decision",
        children: [
          {
            id: "s02",
            label: "S02 — Micro-BNC secteur 1 + aide CPAM",
            tone: "regime",
          },
          {
            id: "s03",
            label: "S03 — Micro-BNC secteur 2 + taux plein",
            tone: "regime",
          },
        ],
      },
    ],
  },
  {
    id: "sb3",
    label: "B.3 — EI Réel 2035 — Secteur conventionnel ?",
    tone: "decision",
    children: [
      {
        id: "s04",
        label: "S04 — EI Réel secteur 1 + aide CPAM pleine + déductions I / II / III",
        tone: "regime",
      },
      {
        id: "s05",
        label: "S05 — EI Réel secteur 2 OPTAM + aide CPAM partielle",
        tone: "regime",
      },
      {
        id: "s06",
        label: "S06 — EI Réel secteur 2 non-OPTAM + taux plein",
        tone: "regime",
      },
      {
        id: "s07",
        label: "S07 — EI Réel secteur 3 / hors convention + exonération ASV",
        tone: "regime",
      },
    ],
  },
  {
    id: "sb3b",
    label: "B.3b — Forme sociétaire admise ?",
    tone: "decision",
    children: [
      {
        id: "s08",
        label: "S08 — SELARL à l'IS — Gérant majoritaire TNS",
        tone: "regime",
      },
      {
        id: "s09",
        label: "S09 — SELAS à l'IS — Président assimilé-salarié",
        tone: "regime",
      },
    ],
  },
];

const artistesNodes: TreeNode[] = [
  {
    id: "ca1",
    label: "C.1 — Mode de déclaration des revenus ?",
    tone: "decision",
    children: [
      {
        id: "ca1-bnc",
        label: "Mode BNC",
        tone: "plain",
        children: [
          {
            label: "CA <= seuil micro BNC et non X01 ?",
            tone: "decision",
            children: [
              { label: "A01 — Micro-BNC + franchise TVA", tone: "regime" },
              { label: "A02 — Micro-BNC + TVA collectée", tone: "regime" },
              { label: "A03 — BNC Réel 2035 + RAAP si seuil dépassé", tone: "regime" },
            ],
          },
        ],
      },
      {
        id: "ca1-ts",
        label: "Mode Traitements & Salaires",
        tone: "plain",
        children: [
          {
            label: "Frais réels > abattement forfaitaire 10 % ?",
            tone: "decision",
            children: [
              { label: "A04 — T&S + abattement forfaitaire 10 %", tone: "regime" },
              {
                label: "A05 — T&S + frais réels justifiés",
                tone: "regime",
                note: "Liste précise des frais encore à sécuriser.",
              },
            ],
          },
        ],
      },
    ],
  },
];

const immobilierNodes: TreeNode[] = [
  {
    id: "id1",
    label: "D.1 — Qualification LMP ou LMNP ?",
    tone: "decision",
    children: [
      {
        id: "i03",
        label: "I03 — LMP",
        tone: "regime",
        note: "Recettes > seuil et revenus location > autres revenus professionnels du foyer.",
      },
      {
        id: "id2",
        label: "Sinon, statut LMNP",
        tone: "plain",
        children: [
          {
            label: "Régime comptable ?",
            tone: "decision",
            children: [
              {
                label: "CA <= seuil micro LMNP et non X01 ?",
                tone: "decision",
                children: [
                  { label: "I01-a — LMNP Micro-BIC longue durée", tone: "regime" },
                  { label: "I01-b — LMNP Micro-BIC meublé tourisme classé", tone: "regime" },
                  { label: "I01-c — LMNP Micro-BIC meublé tourisme non classé", tone: "regime" },
                ],
              },
              {
                id: "i02",
                label: "I02 — LMNP Réel avec amortissements",
                tone: "regime",
              },
            ],
          },
        ],
      },
    ],
  },
];

const boostersNodes: TreeNode[] = [
  {
    id: "b01",
    label: "B01 — ZFRR",
    tone: "regime",
    note: "Exonération IS / IR sur bénéfices, durée paramétrable.",
  },
  {
    id: "b02",
    label: "B02 — ZFRR+",
    tone: "regime",
    note: "Exonération bénéfice + exonération sociale micro.",
  },
  {
    id: "b03",
    label: "B03 — QPV / ZFU",
    tone: "regime",
    note: "Exonération progressive, non-cumulable avec ZFRR / ZFRR+.",
  },
  {
    id: "b04",
    label: "B04 — ACRE",
    tone: "regime",
    note: "Réduction de cotisations sur une assiette dépendante du régime.",
  },
  {
    id: "b05",
    label: "B05 — ARCE",
    tone: "regime",
    note: "Flux de trésorerie externe, non récurrent, exclusif du maintien ARE.",
  },
  {
    id: "b06",
    label: "B06 — ZIP / ZAC",
    tone: "regime",
    note: "Réservé au segment santé pour installation en zone éligible.",
  },
];

const ambiguityNodes: TreeNode[] = [
  {
    label: "Temporalité de l'option IS pour EI",
    tone: "alert",
    note: "Le point de fermeture de la branche reste sensible.",
  },
  {
    label: "Double condition LMP",
    tone: "alert",
    note: "Doctrine 2026 encore à confirmer côté second critère.",
  },
  {
    label: "Traitement fiscal du statut RSPM",
    tone: "alert",
  },
  {
    label: "Frais réels artistes-auteurs en T&S",
    tone: "alert",
  },
  {
    label: "Méthode LMNP Réel par composants",
    tone: "alert",
  },
];

const focusProfiles: FocusProfile[] = [
  {
    id: "medecin-secteur-1",
    label: "Médecin secteur 1",
    intro:
      "On le suit depuis l'entrée jusqu'au segment Santé, puis on regarde si le micro est encore ouvert ou si le réel devient la branche pertinente.",
    path: ["p-entry", "p1", "p2", "p3", "seg-sante", "sb2", "sb2-sector", "s02", "sb3", "s04", "b06"],
  },
  {
    id: "medecin-optam",
    label: "Médecin secteur 2 OPTAM",
    intro:
      "Le point clé est la distinction secteur 2 puis l'adhésion OPTAM, qui oriente vers la branche réelle S05 plutôt que S06.",
    path: ["p-entry", "p1", "p2", "p3", "seg-sante", "sb3", "s05", "sb3b", "s08", "s09", "b06"],
  },
  {
    id: "medecin-remplacant",
    label: "Médecin remplaçant",
    intro:
      "Ici la première bifurcation Santé suffit souvent à identifier le cas via le statut RSPM, avant les autres branches du segment.",
    path: ["p-entry", "p1", "p2", "p3", "seg-sante", "sb1", "s01"],
  },
];

function TreeList({
  nodes,
  highlighted,
}: {
  nodes: TreeNode[];
  highlighted: Set<string>;
}) {
  return (
    <ul className="tree-list">
      {nodes.map((node, index) => {
        const highlight = node.id ? highlighted.has(node.id) : false;
        const tone = node.tone ?? "plain";
        return (
          <li className="tree-item" key={node.id ?? `${node.label}-${index}`}>
            <div className={`tree-node tree-node--${tone} ${highlight ? "is-highlighted" : ""}`}>
              <div className="tree-node__label">{node.label}</div>
              {node.note ? <div className="tree-node__note">{node.note}</div> : null}
            </div>
            {node.children?.length ? (
              <div className="tree-children">
                <TreeList nodes={node.children} highlighted={highlighted} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function SectionTree({
  title,
  subtitle,
  badge,
  nodes,
  highlighted,
}: {
  title: string;
  subtitle: string;
  badge: string;
  nodes: TreeNode[];
  highlighted: Set<string>;
}) {
  return (
    <section className="tree-panel">
      <div className="tree-panel__header">
        <div>
          <div className="tree-panel__eyebrow">{badge}</div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <TreeList nodes={nodes} highlighted={highlighted} />
    </section>
  );
}

export function FiscalDecisionMap() {
  const [activeProfile, setActiveProfile] = useState<FocusProfile>(focusProfiles[0]!);
  const highlighted = new Set(activeProfile.path);

  return (
    <main className="decision-map">
      <section className="decision-hero">
        <div className="decision-hero__eyebrow">WYMBY • arbre décisionnel fiscal 2026</div>
        <h1>L'arbre complet, en version présentable.</h1>
        <p>
          Cette vue garde toute l'arborescence utile, mais l'organise pour une démonstration
          claire. Le mode focus te permet de montrer immédiatement à un professionnel de santé
          où il se situe dans le moteur.
        </p>
        <div className="decision-hero__actions">
          <button className="btn btn-primary" onClick={() => window.print()}>
            Exporter en PDF
          </button>
          <a className="btn btn-secondary" href="/">
            Revenir au simulateur
          </a>
        </div>
      </section>

      <section className="focus-panel">
        <div className="focus-panel__intro">
          <div className="focus-panel__eyebrow">Parcours guidé</div>
          <h2>Comment j'identifie un médecin dans l'arbre</h2>
          <p>{activeProfile.intro}</p>
        </div>
        <div className="focus-chips">
          {focusProfiles.map((profile) => (
            <button
              key={profile.id}
              className={`focus-chip ${profile.id === activeProfile.id ? "is-active" : ""}`}
              onClick={() => setActiveProfile(profile)}
              type="button"
            >
              {profile.label}
            </button>
          ))}
        </div>
        <div className="focus-legend">
          <span className="legend-dot legend-dot--highlight" />
          <span>Le chemin surligné correspond au profil sélectionné.</span>
        </div>
      </section>

      <SectionTree
        title="Pipeline commun"
        subtitle="Toutes les entrées passent d'abord par la normalisation, les filtres X01 à X04, puis la bifurcation par segment."
        badge="Étapes 1 à 3"
        nodes={pipelineNodes}
        highlighted={highlighted}
      />

      <div className="tree-grid">
        <SectionTree
          title="Branche A — Généralistes"
          subtitle="Micro, réel et formes sociétaires C01 à C20."
          badge="Segment 1"
          nodes={generalistesNodes}
          highlighted={highlighted}
        />
        <SectionTree
          title="Branche B — Santé"
          subtitle="Le segment à utiliser pour expliquer un cas médecin ou paramédical."
          badge="Segment 2"
          nodes={santeNodes}
          highlighted={highlighted}
        />
      </div>

      <div className="tree-grid">
        <SectionTree
          title="Branche C — Artistes-auteurs"
          subtitle="BNC ou Traitements & Salaires selon la nature de déclaration."
          badge="Segment 3"
          nodes={artistesNodes}
          highlighted={highlighted}
        />
        <SectionTree
          title="Branche D — Immobilier"
          subtitle="LMNP / LMP, puis micro ou réel avec amortissements."
          badge="Segment 4"
          nodes={immobilierNodes}
          highlighted={highlighted}
        />
      </div>

      <div className="tree-grid tree-grid--bottom">
        <SectionTree
          title="Boosters B01 à B06"
          subtitle="Surcouches conditionnelles appliquées après qualification du scénario de base."
          badge="Boosters"
          nodes={boostersNodes}
          highlighted={highlighted}
        />
        <SectionTree
          title="Points ambigus"
          subtitle="Sujets encore sensibles ou partiellement documentés dans la modélisation."
          badge="Vigilance"
          nodes={ambiguityNodes}
          highlighted={highlighted}
        />
      </div>
    </main>
  );
}
