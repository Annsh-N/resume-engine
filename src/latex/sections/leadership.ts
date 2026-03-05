import { escapeLatex } from "../escape";
import { Leadership } from "../types";
import { formatDateRange } from "./utils";

export const renderLeadershipSection = (leadership: Leadership[]): string => {
  if (leadership.length === 0) {
    return "";
  }

  const entries = leadership.map((item, index) => {
    const bullets = item.bullets
      .filter((bullet) => bullet.trim().length > 0)
      .map((bullet) => `\\Bitem{${escapeLatex(bullet)}}`);

    const lines = [
      `\\LeftRight{\\textbf{${escapeLatex(item.role)}}}{\\textbf{${escapeLatex(formatDateRange(item.start_date, item.end_date))}}}`,
      `\\LeftRight{${escapeLatex(item.org)}}{${escapeLatex(item.location)}} \\\\`,
      ...bullets,
    ];

    if (index < leadership.length - 1) {
      lines.push("", "\\vspace{\\SUBHEADINGVSPACE}", "");
    }

    return lines.join("\n");
  });

  return ["\\section{Leadership}", "", ...entries].join("\n");
};
