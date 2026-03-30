import { useState } from "react";
import { translateAvertissement } from "../data/avertissement-messages.js";
import "./AvertissementBanner.css";

interface Props {
  avertissements: string[];
}

export function AvertissementBanner({ avertissements }: Props) {
  const [open, setOpen] = useState(false);

  const translated = avertissements
    .map(translateAvertissement)
    .filter((a): a is string => a !== null);

  if (translated.length === 0) return null;

  return (
    <div className="avert-banner">
      <button className="avert-toggle" onClick={() => setOpen(!open)}>
        <span className="avert-icon">⚠</span>
        <span>{translated.length} point{translated.length > 1 ? "s" : ""} à noter</span>
        <span className={`avert-chevron ${open ? "open" : ""}`}>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <ul className="avert-list">
          {translated.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
