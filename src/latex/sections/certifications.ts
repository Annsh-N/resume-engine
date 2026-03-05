import { escapeLatex } from "../escape";
import { Certificate } from "../types";
import { formatMonthYear } from "./utils";

export const renderCertificationsSection = (
  certificates: Certificate[],
): string => {
  if (certificates.length === 0) {
    return "";
  }

  const lines = certificates.map((item) => {
    const dateText = formatMonthYear(item.issued_date);
    return `\\LeftRight{\\BitemEd{\\textbf{${escapeLatex(item.name)}}}}{\\textbf{${escapeLatex(dateText)}}}`;
  });

  return ["\\section{Certifications}", "", ...lines, "\\vspace{-12pt}"].join("\n");
};
