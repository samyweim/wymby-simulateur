import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { DetailCalculScenario, EngineOutput } from "@wymby/types";
import { getScenarioLabel } from "../data/scenario-labels.js";

interface Props {
  output: EngineOutput;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#374151",
    fontSize: 10,
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
  },
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  date: { color: "#6B7280", fontSize: 10 },
  disclaimer: {
    backgroundColor: "#F9FAFB",
    borderLeftWidth: 3,
    borderLeftColor: "#E5E7EB",
    padding: 10,
    marginBottom: 14,
    lineHeight: 1.5,
  },
  section: { marginBottom: 14 },
  sectionTitle: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 8,
    gap: 4,
  },
  scenarioTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#2D6A4F",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  triptych: {
    flexDirection: "row",
    gap: 8,
  },
  triptychCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 8,
    gap: 4,
  },
  triptychLabel: {
    fontSize: 9,
    color: "#6B7280",
    textTransform: "uppercase",
  },
  label: { width: 110, color: "#6B7280" },
  value: { flex: 1 },
  list: { gap: 4 },
  bulletRow: { flexDirection: "row", gap: 6 },
  bullet: { width: 8 },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 6,
  },
  detailRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 4,
  },
  tableCellRegime: { flex: 2.2, paddingHorizontal: 8 },
  tableCell: { flex: 1, paddingHorizontal: 8 },
  detailLabel: { flex: 1.4, paddingRight: 12, color: "#6B7280" },
  detailValue: { flex: 1, textAlign: "right" },
  muted: { color: "#6B7280" },
  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 18,
    textAlign: "center",
    fontSize: 9,
    color: "#6B7280",
  },
});

function formatCurrency(value: number | undefined, suffix = "€"): string {
  if (value === undefined || value === null) return "—";
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(value))} ${suffix}`;
}

function formatAnnual(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(value))} €/an`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function CalculationDetailRows({ scenario }: { scenario: DetailCalculScenario }) {
  const inter = scenario.intermediaires;
  const rows = [
    ["CA HT retenu", inter.CA_HT_RETENU],
    ["Charges déductibles", inter.CHARGES_DEDUCTIBLES],
    ["Amortissements", inter.DOTATIONS_AMORTISSEMENTS],
    ["Base sociale", inter.ASSIETTE_SOCIALE_BRUTE],
    ["Cotisations nettes", inter.COTISATIONS_SOCIALES_NETTES],
    ["Résultat fiscal", inter.RESULTAT_FISCAL_APRES_EXONERATIONS],
    ["IR attribuable", inter.IR_ATTRIBUABLE_SCENARIO],
    ["IS dû", inter.IS_DU_SCENARIO],
    ["TVA nette due", inter.TVA_NETTE_DUE],
    ["Net après IR", inter.NET_APRES_IR],
  ].filter(([, value]) => value !== undefined && value !== null && value !== 0);

  return (
    <View style={styles.card}>
      {rows.map(([label, value], index) => (
        <View key={`${label}-${index}`} style={styles.detailRow}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{formatCurrency(value as number)}</Text>
        </View>
      ))}
    </View>
  );
}

function ScenarioDetailSection({
  title,
  scenario,
  deltaLabel,
}: {
  title: string;
  scenario: DetailCalculScenario;
  deltaLabel?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        <Text style={styles.scenarioTitle}>
          {getScenarioLabel(scenario.base_id).titre}
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Net/an</Text>
          <Text style={styles.value}>{formatAnnual(scenario.intermediaires.NET_APRES_IR)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fiabilité</Text>
          <Text style={styles.value}>{scenario.niveau_fiabilite}</Text>
        </View>
        {deltaLabel && (
          <View style={styles.row}>
            <Text style={styles.label}>Position</Text>
            <Text style={styles.value}>{deltaLabel}</Text>
          </View>
        )}
      </View>
      <CalculationDetailRows scenario={scenario} />
    </View>
  );
}

export function WymbyPdfReport({ output }: Props) {
  const referenceId = output.comparaison.scenario_reference_id;
  const recommendedId = output.recommandation?.scenario_recommande_id ?? null;
  const optimalId = output.comparaison.classement_net_apres_ir[0] ?? null;
  const referenceScenario =
    output.calculs_par_scenario.find((scenario) => scenario.scenario_id === referenceId) ?? null;
  const recommendedScenario =
    output.calculs_par_scenario.find((scenario) => scenario.scenario_id === recommendedId) ?? null;
  const optimalScenario =
    output.calculs_par_scenario.find((scenario) => scenario.scenario_id === optimalId) ?? null;
  const rankedScenarios = output.comparaison.classement_net_apres_ir
    .map((id) => output.calculs_par_scenario.find((scenario) => scenario.scenario_id === id))
    .filter(Boolean)
    .filter((scenario, index, array) => array.findIndex((s) => s!.base_id === scenario!.base_id) === index)
    .slice(0, 8) as DetailCalculScenario[];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Simulation WYMBY 2026</Text>
          <Text style={styles.date}>Édité le {formatDate(new Date())}</Text>
        </View>

        <View style={styles.disclaimer}>
          <Text>
            Ce document est une estimation à titre informatif. Il ne constitue pas un
            conseil fiscal ou juridique. Consultez un expert-comptable pour toute
            décision.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparaison clé</Text>
          <View style={styles.triptych}>
            {referenceScenario && (
              <View style={styles.triptychCard}>
                <Text style={styles.triptychLabel}>Référence</Text>
                <Text style={styles.scenarioTitle}>
                  {getScenarioLabel(referenceScenario.base_id).titre}
                </Text>
                <Text>{formatAnnual(referenceScenario.intermediaires.NET_APRES_IR)}</Text>
              </View>
            )}
            {recommendedScenario && (
              <View style={styles.triptychCard}>
                <Text style={styles.triptychLabel}>Recommandé</Text>
                <Text style={styles.scenarioTitle}>
                  {getScenarioLabel(recommendedScenario.base_id).titre}
                </Text>
                <Text>{formatAnnual(recommendedScenario.intermediaires.NET_APRES_IR)}</Text>
              </View>
            )}
            {optimalScenario && (
              <View style={styles.triptychCard}>
                <Text style={styles.triptychLabel}>Optimal</Text>
                <Text style={styles.scenarioTitle}>
                  {getScenarioLabel(optimalScenario.base_id).titre}
                </Text>
                <Text>{formatAnnual(optimalScenario.intermediaires.NET_APRES_IR)}</Text>
              </View>
            )}
          </View>
        </View>

        {referenceScenario && (
          <ScenarioDetailSection
            title="Détail du scénario de référence"
            scenario={referenceScenario}
            deltaLabel="Point de comparaison"
          />
        )}

        {recommendedScenario && (
          <ScenarioDetailSection
            title="Détail du scénario recommandé"
            scenario={recommendedScenario}
            deltaLabel="Meilleur équilibre global"
          />
        )}

        {optimalScenario && optimalScenario.scenario_id !== recommendedScenario?.scenario_id && (
          <ScenarioDetailSection
            title="Détail du scénario optimal en net"
            scenario={optimalScenario}
            deltaLabel="Net annuel le plus élevé"
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classement synthétique</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellRegime}>Régime</Text>
              <Text style={styles.tableCell}>Net/an</Text>
              <Text style={styles.tableCell}>Écart vs référence</Text>
              <Text style={styles.tableCell}>Fiabilité</Text>
            </View>
            {rankedScenarios.map((scenario) => {
              const delta = output.comparaison.ecarts.find(
                (entry) => entry.scenario_id === scenario.scenario_id
              )?.DELTA_NET_APRES_IR;
              const isReference = scenario.scenario_id === referenceId;

              return (
                <View key={scenario.scenario_id} style={styles.tableRow}>
                  <Text style={styles.tableCellRegime}>
                    {getScenarioLabel(scenario.base_id).titre}
                  </Text>
                  <Text style={styles.tableCell}>
                    {formatAnnual(scenario.intermediaires.NET_APRES_IR)}
                  </Text>
                  <Text style={styles.tableCell}>
                    {isReference ? "— référence" : formatCurrency(delta, "€/an")}
                  </Text>
                  <Text style={styles.tableCell}>{scenario.niveau_fiabilite}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {output.scenarios_exclus.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Régimes non applicables</Text>
            <View style={styles.list}>
              {output.scenarios_exclus.slice(0, 10).map((scenario, index) => (
                <View key={`${scenario.scenario_id}-${index}`} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text>
                    {getScenarioLabel(scenario.scenario_id).titre} —{" "}
                    {(scenario as { motif?: string }).motif ??
                      scenario.motifs_exclusion.join(" — ")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer} fixed>
          WYMBY — Simulateur fiscal indépendants 2026 | Estimation — non opposable à
          l'administration fiscale
        </Text>
      </Page>
    </Document>
  );
}
