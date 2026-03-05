import { escapeLatex } from "../escape";
import { Award } from "../types";
import { formatMonthYear } from "./utils";

export const renderAwardsSection = (awards: Award[]): string => {
  if (awards.length === 0) {
    return "";
  }

  const lines = awards.map((item) => {
    const dateText = formatMonthYear(item.date);
    return `\\LeftRight{\\BitemEd{\\textbf{${escapeLatex(item.title)}}}}{\\textbf{${escapeLatex(dateText)}}}`;
  });

  return ["\\section{Awards}", "", ...lines, "\\vspace{-12pt}"].join("\n");
};
