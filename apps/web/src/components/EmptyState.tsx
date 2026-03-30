import "./EmptyState.css";

interface Props {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="empty-state card">
      <div className="empty-state-icon" aria-hidden>
        ⚠️
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button type="button" className="btn btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
