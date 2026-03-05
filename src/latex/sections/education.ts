import { escapeLatex } from "../escape";
import { Education } from "../types";
import { formatMonthYear } from "./utils";

export const renderEducationSection = (education: Education[]): string => {
  if (education.length === 0) {
    return "";
  }

  const entries = education.map((item, index) => {
    const majors = item.majors.length > 0 ? `, ${item.majors.join(", ")}` : "";
    const degreeLine = `${item.degree}${majors}`;

    const lines = [
      `\\LeftRight{\\textbf{${escapeLatex(item.school)}}}{${escapeLatex(formatMonthYear(item.end_date))}} \\\\`,
      `\\LeftRight{${escapeLatex(degreeLine)}}{${escapeLatex(item.location)}} \\\\`,
    ];

    if (item.relevant_coursework.length > 0 || item.gpa !== null && item.gpa !== undefined) {
      const coursework = item.relevant_coursework.length
        ? `\\BitemEd{\\textbf{Relevant Coursework}: ${item.relevant_coursework
            .map(escapeLatex)
            .join(", ")}}`
        : "";
      const gpa = item.gpa !== null && item.gpa !== undefined
        ? `\\textbf{GPA:} ${escapeLatex(item.gpa.toString())}`
        : "";

      lines.push(`\\LeftRight{${coursework}}{${gpa}}`);
    }

    if (index < education.length - 1) {
      lines.push("\\vspace{\\SUBHEADINGVSPACE}");
    }

    return lines.join("\n");
  });

  return ["\\section{Education}", ...entries, "\\vspace{-6pt}"].join("\n");
};
