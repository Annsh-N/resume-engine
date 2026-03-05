import { renderPreamble } from "./preamble";
import { Density, BankExport } from "./types";
import { renderAwardsSection } from "./sections/awards";
import { renderCertificationsSection } from "./sections/certifications";
import { renderEducationSection } from "./sections/education";
import { renderExperienceSection } from "./sections/experience";
import { renderHeaderSection } from "./sections/header";
import { renderInterestsSection } from "./sections/interests";
import { renderLeadershipSection } from "./sections/leadership";
import { renderProjectsSection } from "./sections/projects";
import { renderSkillsSection } from "./sections/skills";

export const SECTION_KEYS = [
  "education",
  "experience",
  "projects",
  "certifications",
  "awards",
  "leadership",
  "skills",
  "interests",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "education",
  "experience",
  "projects",
  "certifications",
  "skills",
  "interests",
  "awards",
  "leadership",
];

const DEFAULT_ENABLED: Record<SectionKey, boolean> = {
  education: true,
  experience: true,
  projects: true,
  certifications: true,
  awards: true,
  leadership: true,
  skills: true,
  interests: true,
};

type AssembleResumeTexParams = {
  bank: BankExport;
  sectionOrder?: SectionKey[];
  enabled?: Partial<Record<SectionKey, boolean>>;
  density?: Density;
};

const renderSection = (section: SectionKey, bank: BankExport): string => {
  switch (section) {
    case "education":
      return renderEducationSection(bank.education);
    case "experience":
      return renderExperienceSection(bank.experiences);
    case "projects":
      return renderProjectsSection(bank.projects);
    case "certifications":
      return renderCertificationsSection(bank.certificates);
    case "awards":
      return renderAwardsSection(bank.awards);
    case "leadership":
      return renderLeadershipSection(bank.leadership);
    case "skills":
      return renderSkillsSection(bank.skills.groups);
    case "interests":
      return renderInterestsSection(bank.interests.items);
    default:
      return "";
  }
};

export const assembleResumeTex = ({
  bank,
  sectionOrder = DEFAULT_SECTION_ORDER,
  enabled = DEFAULT_ENABLED,
  density = "normal",
}: AssembleResumeTexParams): string => {
  const mergedEnabled: Record<SectionKey, boolean> = {
    ...DEFAULT_ENABLED,
    ...enabled,
  };

  const chunks: string[] = [
    renderPreamble(density),
    "\\begin{document}",
    renderHeaderSection(bank.profile),
  ];

  for (const section of sectionOrder) {
    if (!mergedEnabled[section]) {
      continue;
    }

    const latex = renderSection(section, bank).trim();
    if (latex.length === 0) {
      continue;
    }

    chunks.push(latex);
  }

  chunks.push("\\end{document}");

  return chunks.join("\n\n");
};
