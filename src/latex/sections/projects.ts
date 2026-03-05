import { escapeLatex } from "../escape";
import { Project } from "../types";
import { formatDateRange, pickBulletText } from "./utils";

export const renderProjectsSection = (projects: Project[]): string => {
  if (projects.length === 0) {
    return "";
  }

  const entries = projects.map((item, index) => {
    const techStack = item.tech_stack.length
      ? ` $|$ ${item.tech_stack.map(escapeLatex).join(", ")}`
      : "";

    const bullets = [...item.bullets]
      .sort((a, b) => a.order_index - b.order_index)
      .map((bullet) => pickBulletText(bullet))
      .filter((bullet) => bullet.trim().length > 0)
      .map((bullet) => `\\Bitem{${escapeLatex(bullet)}}`);

    const lines = [
      `\\LeftRight{\\textbf{${escapeLatex(item.name)}${techStack}}}{\\textbf{${escapeLatex(formatDateRange(item.start_date, item.end_date))}}} \\\\`,
      ...bullets,
    ];

    if (index < projects.length - 1) {
      lines.push("", "\\vspace{\\SUBHEADINGVSPACE}", "");
    }

    return lines.join("\n");
  });

  return ["\\section{Projects}", ...entries].join("\n");
};
