import { escapeLatex } from "../escape";
import { SkillGroup } from "../types";

export const renderSkillsSection = (groups: SkillGroup[]): string => {
  if (groups.length === 0) {
    return "";
  }

  const lines = groups.map((group) => {
    const items = group.items.map(escapeLatex).join(", ");
    return `\\Bitem{\\textbf{${escapeLatex(group.group_name)}}{: ${items}}}`;
  });

  return ["\\section{Technical Skills}", ...lines].join("\n");
};
