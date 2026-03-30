import { useState } from "react";
import "./AlertBanner.css";

export interface AlertBannerProps {
  level: "info" | "warning" | "critical";
  primaryMessage: string;
  detailMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
}

const ICONS: Record<AlertBannerProps["level"], string> = {
  info: "i",
  warning: "⚠",
  critical: "✕",
};

export function AlertBanner({
  level,
  primaryMessage,
  detailMessage,
  actionLabel,
  onAction,
  dismissible = false,
}: AlertBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className={`alert-banner alert-banner-${level}`}>
      {dismissible && (
        <button
          type="button"
          className="alert-dismiss"
          aria-label="Fermer l'alerte"
          onClick={() => setIsDismissed(true)}
        >
          ×
        </button>
      )}

      <div className="alert-primary">
        <span className="alert-icon" aria-hidden>
          {ICONS[level]}
        </span>
        <span className="alert-primary-message">{primaryMessage}</span>
        {actionLabel && onAction && (
          <button type="button" className="alert-action" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>

      {detailMessage && (
        <>
          <button
            type="button"
            className="alert-detail-toggle"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            Voir le détail {isOpen ? "▲" : "▼"}
          </button>
          {isOpen && <div className="alert-detail-body">{detailMessage}</div>}
        </>
      )}
    </div>
  );
}
