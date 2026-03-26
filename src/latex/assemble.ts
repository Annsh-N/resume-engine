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

export const CORE_SECTION_KEYS = [
  "education",
  "experience",
  "projects",
  "skills",
 ] as const;

export type CoreSectionKey = (typeof CORE_SECTION_KEYS)[number];

export const OPTIONAL_SECTION_KEYS = [
  "certifications",
  "awards",
  "leadership",
  "interests",
] as const;

export type OptionalSectionKey = (typeof OPTIONAL_SECTION_KEYS)[number];

export const RESUME_TEMPLATE_KEYS = [
  "new_grad",
  "standard_swe",
  "experienced_swe",
  "projects_heavy",
] as const;

export type ResumeTemplateKey = (typeof RESUME_TEMPLATE_KEYS)[number];

const DEFAULT_TEMPLATE: ResumeTemplateKey = "standard_swe";

const TEMPLATE_CORE_SECTION_ORDER: Record<ResumeTemplateKey, CoreSectionKey[]> = {
  new_grad: ["education", "experience", "projects", "skills"],
  standard_swe: ["experience", "projects", "skills", "education"],
  experienced_swe: ["experience", "skills", "projects", "education"],
  projects_heavy: ["projects", "experience", "skills", "education"],
};

type AssembleResumeTexParams = {
  bank: BankExport;
  template?: ResumeTemplateKey;
  includeSections?: OptionalSectionKey[];
  density?: Density;
};

const resolveSectionOrder = (
  template: ResumeTemplateKey,
  includeSections: OptionalSectionKey[] = [],
): SectionKey[] => {
  const seen = new Set<OptionalSectionKey>();
  const orderedOptionalSections = includeSections.filter((section) => {
    if (seen.has(section)) {
      return false;
    }

    seen.add(section);
    return true;
  });

  return [...TEMPLATE_CORE_SECTION_ORDER[template], ...orderedOptionalSections];
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
  template = DEFAULT_TEMPLATE,
  includeSections = [],
  density = "normal",
}: AssembleResumeTexParams): string => {
  const sectionOrder = resolveSectionOrder(template, includeSections);

  const chunks: string[] = [
    renderPreamble(density),
    "\\begin{document}",
    renderHeaderSection(bank.profile),
  ];

  for (const section of sectionOrder) {
    const latex = renderSection(section, bank).trim();
    if (latex.length === 0) {
      continue;
    }

    chunks.push(latex);
  }

  chunks.push("\\end{document}");

  return chunks.join("\n\n");
};
