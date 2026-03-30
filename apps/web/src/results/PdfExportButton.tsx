import { useState } from "react";
import type { EngineOutput } from "@wymby/types";
import { pdf } from "@react-pdf/renderer";
import { WymbyPdfReport } from "./PdfReport.js";

interface Props {
  output: EngineOutput;
}

function getFileDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PdfExportButton({ output }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);

    try {
      const blob = await pdf(<WymbyPdfReport output={output} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `wymby-simulation-${getFileDate(new Date())}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-secondary pdf-export-btn"
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? "Génération du PDF…" : "Télécharger le rapport PDF"}
    </button>
  );
}
