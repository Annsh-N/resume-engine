import { escapeLatex } from "../escape";

export const renderInterestsSection = (items: string[]): string => {
  if (items.length === 0) {
    return "";
  }

  return ["\\section{Interests}", `\\Bitem{${items.map(escapeLatex).join(", ")}}`].join("\n");
};
