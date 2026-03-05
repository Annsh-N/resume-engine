import { escapeLatex } from "../escape";
import { Experience } from "../types";
import { formatDateRange, pickBulletText } from "./utils";

export const renderExperienceSection = (experiences: Experience[]): string => {
  if (experiences.length === 0) {
    return "";
  }

  const entries = experiences.map((item, index) => {
    const bullets = [...item.bullets]
      .sort((a, b) => a.order_index - b.order_index)
      .map((bullet) => pickBulletText(bullet))
      .filter((bullet) => bullet.trim().length > 0)
      .map((bullet) => `\\Bitem{${escapeLatex(bullet)}}`);

    const lines = [
      `\\LeftRight{\\textbf{${escapeLatex(item.title)}}}{\\textbf{${escapeLatex(formatDateRange(item.start_date, item.end_date))}}}`,
      `\\LeftRight{${escapeLatex(item.company)}}{${escapeLatex(item.location)}} \\\\`,
      ...bullets,
    ];

    if (index < experiences.length - 1) {
      lines.push("", "\\vspace{\\SUBHEADINGVSPACE}", "");
    }

    return lines.join("\n");
  });

  return ["\\section{Experience}", "", ...entries].join("\n");
};
