import "./CalculSkeleton.css";

export function CalculSkeleton() {
  return (
    <div className="calcul-skeleton" aria-hidden="true">
      <div className="calcul-skeleton-compare">
        {[0, 1].map((index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton-line skeleton-line-title" />
            <div className="skeleton-line skeleton-line-80" />
            <div className="skeleton-line skeleton-line-40" />
            <div className="skeleton-line skeleton-line-90" />
          </div>
        ))}
      </div>
      <div className="skeleton-table-head">
        <div className="skeleton-line skeleton-line-20" />
        <div className="skeleton-line skeleton-line-30" />
        <div className="skeleton-line skeleton-line-25" />
      </div>
    </div>
  );
}
