const LATEX_ESCAPE_MAP: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "$": "\\$",
  "&": "\\&",
  "#": "\\#",
  "%": "\\%",
  "_": "\\_",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

export const escapeLatex = (text: string): string => {
  return text.replace(/[\\{}$&#%_~^]/g, (char) => LATEX_ESCAPE_MAP[char]);
};
