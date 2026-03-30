import { useState, useRef, useEffect } from "react";
import "./TooltipFiscal.css";

interface Props {
  term: string;
  children: React.ReactNode;
}

export function TooltipFiscal({ term, children }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <span className="tooltip-wrap" ref={ref}>
      <button
        className="tooltip-trigger"
        onClick={() => setVisible(!visible)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        type="button"
        aria-expanded={visible}
      >
        {term}
        <span className="tooltip-icon">?</span>
      </button>
      {visible && (
        <div className="tooltip-popup" role="tooltip">
          {children}
        </div>
      )}
    </span>
  );
}
