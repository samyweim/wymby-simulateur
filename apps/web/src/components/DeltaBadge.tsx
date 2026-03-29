import "./DeltaBadge.css";

interface Props {
  value: number;
  label?: string;
  showZero?: boolean;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(Math.round(n));
}

export function DeltaBadge({ value, label, showZero = false }: Props) {
  if (!showZero && value === 0) return null;

  const sign = value > 0 ? "pos" : value < 0 ? "neg" : "zero";

  return (
    <span className={`delta-badge delta-${sign}`} title={label}>
      {fmt(value)} €
    </span>
  );
}
