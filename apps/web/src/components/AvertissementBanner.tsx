import { translateAvertissement } from "../data/avertissement-messages.js";
import { AlertBanner } from "./AlertBanner.js";
import "./AvertissementBanner.css";

interface Props {
  avertissements: string[];
}

export function AvertissementBanner({ avertissements }: Props) {
  const translated = avertissements
    .map(translateAvertissement)
    .filter((warning): warning is string => warning !== null);

  if (translated.length === 0) return null;

  return (
    <div className="avert-banner">
      {translated.map((warning, index) => (
        <AlertBanner
          key={`${warning}-${index}`}
          level="warning"
          primaryMessage={warning}
        />
      ))}
    </div>
  );
}
