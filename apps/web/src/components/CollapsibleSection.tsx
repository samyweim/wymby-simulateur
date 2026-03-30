import { useState } from "react";
import type { ReactNode } from "react";
import "./CollapsibleSection.css";

interface Props {
  summary: string;
  badge?: number;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  summary,
  badge,
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`collapsible-section ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="collapsible-title">{summary}</span>
        <span className="collapsible-header-right">
          {typeof badge === "number" && (
            <span className="collapsible-badge">{badge}</span>
          )}
          <span className="collapsible-chevron" aria-hidden>
            ▼
          </span>
        </span>
      </button>

      {open && <div className="collapsible-content">{children}</div>}
    </section>
  );
}
