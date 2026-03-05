import { escapeLatex } from "../escape";
import { BankProfile } from "../types";

export const renderHeaderSection = (profile: BankProfile | null): string => {
  const fullName = profile?.full_name || "Your Name";
  const location = profile?.location?.trim() || "";
  const phone = profile?.phone?.trim() || "";
  const email = profile?.email?.trim() || "your.email@example.com";
  const links = [...(profile?.links ?? [])].sort(
    (a, b) => b.priority - a.priority || a.label.localeCompare(b.label),
  );

  const parts: string[] = [];
  if (location) {
    parts.push(escapeLatex(location));
  }
  if (phone) {
    parts.push(escapeLatex(phone));
  }

  parts.push(
    `\\href{mailto:${escapeLatex(email)}}{\\underline{${escapeLatex(email)}}}`,
  );

  for (const link of links) {
    parts.push(
      `\\href{${escapeLatex(link.url)}}{\\underline{${escapeLatex(link.label)}}}`,
    );
  }

  return [
    "\\begin{center}",
    `    \\textbf{\\Huge \\scshape ${escapeLatex(fullName)}} \\\\ \\vspace{1pt}`,
    `    \\small ${parts.join(" $|$ ")}`,
    "\\end{center}",
  ].join("\n");
};
