import "./ProgressBar.css";

interface Props {
  step: number;
  total: number;
  labels: string[];
}

export function ProgressBar({ step, total, labels }: Props) {
  return (
    <div className="progress-wrap" role="progressbar" aria-valuenow={step} aria-valuemax={total - 1}>
      <div className="progress-steps">
        {labels.map((label, i) => (
          <div
            key={i}
            className={`progress-step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`}
          >
            <div className="progress-dot">
              {i < step ? (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span className="progress-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${(step / (total - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
