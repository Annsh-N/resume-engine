import {
  OPTIONAL_SECTION_KEYS,
  OptionalSectionKey,
  ResumeTemplateKey,
  assembleResumeTex,
} from "../latex/assemble";
import {
  Award,
  BankExport,
  Certificate,
  Density,
  Education,
  Experience,
  ExperienceBullet,
  Leadership,
  Project,
  ProjectBullet,
  SkillGroup,
} from "../latex/types";
import { compileLatexToPdf } from "./pdf";

const TOTAL_LINE_BUDGET: Record<Density, number> = {
  normal: 90,
  tight: 96,
};

const DEFAULT_SKILL_GROUPS = 3;
const MIN_ENTRY_BULLETS = 2;
const MAX_ENTRY_BULLETS = 5;
const MAX_OPTIONAL_SECTIONS = 2;
const MAX_CERTIFICATIONS = 2;
const MAX_AWARDS = 2;
const MAX_LEADERSHIP_BULLETS = 3;
const MAX_TRIM_PASSES = 128;
const MAX_GROW_STEPS = 256;
const MIN_ADDITIONAL_CANDIDATE_SCORE = 1;
const SATURATION_MIN_CANDIDATE_SCORE = 0;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "you",
  "your",
  "will",
  "we",
  "our",
  "this",
  "their",
  "they",
  "them",
  "about",
  "using",
  "used",
  "build",
  "building",
  "engineer",
  "engineering",
  "software",
  "experience",
  "responsibilities",
  "requirements",
]);

const TOKEN_EXPANSIONS: Record<string, string[]> = {
  api: ["apis"],
  apis: ["api"],
  aws: ["amazon", "cloud"],
  ci: ["cd"],
  cd: ["ci"],
  docker: ["containers", "containerization"],
  express: ["node", "nodejs"],
  fastify: ["node", "nodejs"],
  frontend: ["react", "ui", "typescript"],
  fullstack: ["frontend", "backend"],
  gcp: ["cloud", "google"],
  github: ["git"],
  infra: ["infrastructure", "platform", "reliability"],
  kubernetes: ["k8s", "containers"],
  k8s: ["kubernetes"],
  llm: ["rag", "prompting", "ai"],
  ml: ["machinelearning", "ai", "models"],
  node: ["nodejs"],
  nodejs: ["node"],
  postgres: ["postgresql"],
  postgresql: ["postgres"],
  python: ["pandas"],
  react: ["frontend", "ui"],
  reliability: ["observability", "monitoring"],
  security: ["auth", "authentication", "authorization"],
  sql: ["postgres", "postgresql"],
  typescript: ["javascript", "ts"],
  ts: ["typescript"],
};

type BulletVariantKind = "long" | "medium" | "short";

type BulletVariant = {
  kind: BulletVariantKind;
  text: string;
  lineCost: number;
};

type ScoredBullet<TBullet extends ExperienceBullet | ProjectBullet> = TBullet & {
  score: number;
  variants: BulletVariant[];
};

type ScoredExperience = Experience & {
  score: number;
  scoredBullets: ScoredBullet<ExperienceBullet>[];
};

type ScoredProject = Project & {
  score: number;
  scoredBullets: ScoredBullet<ProjectBullet>[];
};

type ScoredSkillGroup = SkillGroup & {
  score: number;
};

type ScoredCertificate = Certificate & {
  score: number;
};

type ScoredAward = Award & {
  score: number;
};

type ScoredLeadershipBullet = {
  text: string;
  score: number;
  lineCost: number;
};

type ScoredLeadership = Leadership & {
  score: number;
  scoredBullets: ScoredLeadershipBullet[];
};

type JobDescriptionProfile = {
  tokens: Set<string>;
  phrases: string[];
};

type SelectedBullet = {
  bulletId: string;
  score: number;
  variantIndex: number;
};

type SelectedEntry<TKind extends "experience" | "project"> = {
  kind: TKind;
  entryId: string;
  score: number;
  addedOrder: number;
  mandatory: boolean;
  selectedBullets: SelectedBullet[];
};

type SelectedLeadership = {
  entryId: string;
  score: number;
  addedOrder: number;
  selectedBulletIndexes: number[];
};

type SelectedOptionalSection = {
  key: OptionalSectionKey;
  score: number;
  addedOrder: number;
};

type SelectionState = {
  selectedEducationIds: string[];
  selectedSkillGroupIds: string[];
  experiences: SelectedEntry<"experience">[];
  projects: SelectedEntry<"project">[];
  selectedCertifications: string[];
  selectedAwards: string[];
  selectedLeadership: SelectedLeadership | null;
  includeInterests: boolean;
  optionalSections: SelectedOptionalSection[];
  nextOrder: number;
};

type SelectionCandidate = {
  kind:
    | "experience_entry"
    | "project_entry"
    | "experience_bullet"
    | "project_bullet"
    | "skill_group"
    | "certifications"
    | "certification_item"
    | "awards"
    | "award_item"
    | "leadership"
    | "leadership_bullet"
    | "interests";
  score: number;
  scoreDensity: number;
  deltaLines: number;
  apply: (state: SelectionState) => SelectionState;
  isRetained: (state: SelectionState) => boolean;
};

type CandidateBuildOptions = {
  enforceEstimatedBudget: boolean;
  minScore: number;
  newEntryBulletCount: number;
  optionalSectionSeedItemCount: number;
  leadershipSeedBulletCount: number;
};

type GenerateResumeParams = {
  bank: BankExport;
  jobDescription: string;
  template: ResumeTemplateKey;
  density: Density;
  includePdf: boolean;
};

type TrimAction = {
  penalty: number;
  apply: (state: SelectionState) => SelectionState;
};

const normalizeToken = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#./-]+/g, "")
    .replace(/^[-./]+|[-./]+$/g, "");
};

const expandToken = (token: string): string[] => {
  const base = token.replace(/[./-]/g, "");
  const expanded = new Set<string>();

  if (token.length > 1) {
    expanded.add(token);
  }

  if (base.length > 1) {
    expanded.add(base);
  }

  for (const variant of TOKEN_EXPANSIONS[token] ?? []) {
    expanded.add(variant);
  }

  for (const variant of TOKEN_EXPANSIONS[base] ?? []) {
    expanded.add(variant);
  }

  return [...expanded].filter((item) => item.length > 1);
};

const tokenizeText = (value: string | null | undefined): string[] => {
  if (!value) {
    return [];
  }

  const raw = value
    .split(/[\s,;:()[\]{}]+/)
    .map(normalizeToken)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  const expanded = new Set<string>();
  for (const token of raw) {
    for (const variant of expandToken(token)) {
      if (!STOP_WORDS.has(variant)) {
        expanded.add(variant);
      }
    }
  }

  return [...expanded];
};

const collectTokens = (value: unknown): string[] => {
  if (typeof value === "string") {
    return tokenizeText(value);
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectTokens);
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(collectTokens);
  }

  return [];
};

const getOverlapScore = (
  values: Array<string | null | undefined | string[] | unknown>,
  jobTokens: Set<string>,
  weight: number,
): number => {
  const tokens = new Set<string>();
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const item of value) {
        for (const token of collectTokens(item)) {
          tokens.add(token);
        }
      }
      continue;
    }

    for (const token of collectTokens(value)) {
      tokens.add(token);
    }
  }

  let matches = 0;
  for (const token of tokens) {
    if (jobTokens.has(token)) {
      matches += 1;
    }
  }

  return matches * weight;
};

const estimateTextWidthUnits = (text: string): number => {
  let units = 0;

  for (const character of text) {
    if (character === " ") {
      units += 0.35;
      continue;
    }

    if (/[A-Z]/.test(character)) {
      units += /[MW]/.test(character) ? 1.35 : 1.05;
      continue;
    }

    if (/[a-z]/.test(character)) {
      units += /[mw]/.test(character)
        ? 1.1
        : /[iltjr]/.test(character)
          ? 0.55
          : 0.85;
      continue;
    }

    if (/[0-9]/.test(character)) {
      units += 0.9;
      continue;
    }

    if (/[-/]/.test(character)) {
      units += 0.45;
      continue;
    }

    units += 0.5;
  }

  return units;
};

const estimateBodyLines = (text: string): number => {
  const widthUnits = estimateTextWidthUnits(text);
  return Math.max(1, Math.ceil(widthUnits / 94));
};

const estimateHeaderLines = (bank: BankExport): number => {
  const profile = bank.profile;
  if (!profile) {
    return 2;
  }

  const contactText = [
    profile.location ?? "",
    profile.phone ?? "",
    profile.email,
    ...profile.links.map((link) => `${link.label} ${link.url}`),
  ].join(" | ");

  return 1 + Math.max(1, Math.ceil(estimateTextWidthUnits(contactText) / 120));
};

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getRecencyBonus = (value: string | Date | null | undefined): number => {
  const date = toDate(value);
  if (!date) {
    return 0;
  }

  const now = Date.now();
  const monthDelta = Math.max(0, (now - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
  return Math.max(0, 2.5 - monthDelta / 12);
};

const getPriorityBonus = (priority: number | null | undefined): number => {
  if (priority === null || priority === undefined) {
    return 0;
  }

  return Math.max(0, 2.2 - (priority - 1) * 0.22);
};

const buildJobDescriptionProfile = (jobDescription: string): JobDescriptionProfile => {
  const normalized = jobDescription.toLowerCase();
  const phrases = [
    "machine learning",
    "distributed systems",
    "full stack",
    "full-stack",
    "new grad",
    "software engineer",
    "backend engineer",
    "platform engineer",
  ].filter((phrase) => normalized.includes(phrase));

  return {
    tokens: new Set(tokenizeText(jobDescription)),
    phrases,
  };
};

const buildBulletVariants = (
  bullet: ExperienceBullet | ProjectBullet,
): BulletVariant[] => {
  const variants: BulletVariant[] = [];

  const pushVariant = (kind: BulletVariantKind, text: string | null | undefined) => {
    if (!text || text.trim().length === 0) {
      return;
    }

    variants.push({
      kind,
      text,
      lineCost: Math.min(3, estimateBodyLines(text)),
    });
  };

  pushVariant("long", bullet.bullet_long);
  pushVariant("medium", bullet.bullet_medium);
  pushVariant("short", bullet.bullet_short);

  variants.sort((left, right) => {
    const order = { long: 0, medium: 1, short: 2 };
    return order[left.kind] - order[right.kind];
  });

  return variants;
};

const pickInitialVariantIndex = (variants: BulletVariant[]): number => {
  const firstWithinBudget = variants.findIndex((variant) => variant.lineCost <= 2);
  if (firstWithinBudget >= 0) {
    return firstWithinBudget;
  }

  return variants.length - 1;
};

const scoreExperienceBullet = (
  bullet: ExperienceBullet,
  profile: JobDescriptionProfile,
): number => {
  return (
    getOverlapScore([bullet.skills_tags ?? []], profile.tokens, 2.5) +
    getOverlapScore(
      [bullet.bullet_long, bullet.bullet_medium, bullet.bullet_short, bullet.metrics],
      profile.tokens,
      1.2,
    ) +
    (bullet.metrics ? 0.4 : 0)
  );
};

const scoreProjectBullet = (
  bullet: ProjectBullet,
  profile: JobDescriptionProfile,
): number => {
  return (
    getOverlapScore([bullet.skills_tags ?? []], profile.tokens, 2.3) +
    getOverlapScore(
      [bullet.bullet_long, bullet.bullet_medium, bullet.bullet_short, bullet.metrics],
      profile.tokens,
      1.1,
    ) +
    (bullet.metrics ? 0.35 : 0)
  );
};

const scoreExperience = (
  experience: Experience,
  profile: JobDescriptionProfile,
): ScoredExperience => {
  const scoredBullets = [...experience.bullets]
    .map((bullet) => ({
      ...bullet,
      score: scoreExperienceBullet(bullet, profile),
      variants: buildBulletVariants(bullet),
    }))
    .filter((bullet) => bullet.variants.length > 0)
    .sort((left, right) => right.score - left.score || left.order_index - right.order_index);

  const score = [
    getOverlapScore([experience.title, experience.company, experience.location], profile.tokens, 1.2),
    getOverlapScore([experience.tags], profile.tokens, 2.8),
    getOverlapScore([experience.tech_stack], profile.tokens, 3.2),
    getOverlapScore([experience.context, experience.facts], profile.tokens, 1.3),
    scoredBullets.slice(0, 3).reduce((sum, bullet) => sum + bullet.score, 0),
    getPriorityBonus(experience.priority),
    getRecencyBonus(experience.end_date ?? experience.start_date),
  ].reduce((sum, value) => sum + value, 0);

  return { ...experience, score, scoredBullets };
};

const scoreProject = (
  project: Project,
  profile: JobDescriptionProfile,
): ScoredProject => {
  const scoredBullets = [...project.bullets]
    .map((bullet) => ({
      ...bullet,
      score: scoreProjectBullet(bullet, profile),
      variants: buildBulletVariants(bullet),
    }))
    .filter((bullet) => bullet.variants.length > 0)
    .sort((left, right) => right.score - left.score || left.order_index - right.order_index);

  const score = [
    getOverlapScore([project.name, project.description], profile.tokens, 1.4),
    getOverlapScore([project.tags], profile.tokens, 2.6),
    getOverlapScore([project.tech_stack], profile.tokens, 3),
    scoredBullets.slice(0, 3).reduce((sum, bullet) => sum + bullet.score, 0),
    getPriorityBonus(project.priority),
    getRecencyBonus(project.end_date ?? project.start_date),
  ].reduce((sum, value) => sum + value, 0);

  return { ...project, score, scoredBullets };
};

const scoreSkillGroup = (
  group: SkillGroup,
  profile: JobDescriptionProfile,
): ScoredSkillGroup => {
  return {
    ...group,
    score:
      getOverlapScore([group.group_name], profile.tokens, 1.5) +
      getOverlapScore([group.items], profile.tokens, 2.8) +
      Math.max(0, group.priority * 0.1),
  };
};

const scoreCertificate = (
  certificate: Certificate,
  profile: JobDescriptionProfile,
): ScoredCertificate => {
  return {
    ...certificate,
    score:
      getOverlapScore(
        [certificate.name, certificate.issuer, certificate.credential_url],
        profile.tokens,
        2.1,
      ) + getRecencyBonus(certificate.issued_date),
  };
};

const scoreAward = (award: Award, profile: JobDescriptionProfile): ScoredAward => {
  return {
    ...award,
    score:
      getOverlapScore([award.title, award.issuer, award.notes], profile.tokens, 1.8) +
      getRecencyBonus(award.date),
  };
};

const scoreLeadership = (
  leadership: Leadership,
  profile: JobDescriptionProfile,
): ScoredLeadership => {
  const scoredBullets = leadership.bullets
    .map((text) => ({
      text,
      score: getOverlapScore([text], profile.tokens, 1.1),
      lineCost: Math.min(3, estimateBodyLines(text)),
    }))
    .sort((left, right) => right.score - left.score || left.text.localeCompare(right.text));

  return {
    ...leadership,
    score:
      getOverlapScore([leadership.role, leadership.org, leadership.location], profile.tokens, 1.4) +
      scoredBullets.slice(0, 2).reduce((sum, bullet) => sum + bullet.score, 0) +
      getRecencyBonus(leadership.end_date ?? leadership.start_date),
    scoredBullets,
  };
};

const sortByScore = <T extends { score: number }>(items: T[]): T[] => {
  return [...items].sort((left, right) => right.score - left.score);
};

const getExperienceById = (items: ScoredExperience[], entryId: string): ScoredExperience => {
  const item = items.find((entry) => entry.id === entryId);
  if (!item) {
    throw new Error(`Unknown experience ${entryId}`);
  }

  return item;
};

const getProjectById = (items: ScoredProject[], entryId: string): ScoredProject => {
  const item = items.find((entry) => entry.id === entryId);
  if (!item) {
    throw new Error(`Unknown project ${entryId}`);
  }

  return item;
};

const getSelectedVariant = (
  bullet: ScoredBullet<ExperienceBullet> | ScoredBullet<ProjectBullet>,
  selectedBullet: SelectedBullet,
): BulletVariant => {
  return bullet.variants[selectedBullet.variantIndex] ?? bullet.variants[bullet.variants.length - 1];
};

const cloneState = (state: SelectionState): SelectionState => {
  return {
    selectedEducationIds: [...state.selectedEducationIds],
    selectedSkillGroupIds: [...state.selectedSkillGroupIds],
    experiences: state.experiences.map((entry) => ({
      ...entry,
      selectedBullets: entry.selectedBullets.map((bullet) => ({ ...bullet })),
    })),
    projects: state.projects.map((entry) => ({
      ...entry,
      selectedBullets: entry.selectedBullets.map((bullet) => ({ ...bullet })),
    })),
    selectedCertifications: [...state.selectedCertifications],
    selectedAwards: [...state.selectedAwards],
    selectedLeadership: state.selectedLeadership
      ? {
          ...state.selectedLeadership,
          selectedBulletIndexes: [...state.selectedLeadership.selectedBulletIndexes],
        }
      : null,
    includeInterests: state.includeInterests,
    optionalSections: state.optionalSections.map((section) => ({ ...section })),
    nextOrder: state.nextOrder,
  };
};

const estimateEducationCost = (education: Education[]): number => {
  if (education.length === 0) {
    return 0;
  }

  return (
    2 +
    education.reduce((sum, entry) => {
      const coursework = entry.relevant_coursework.length > 0
        ? estimateBodyLines(entry.relevant_coursework.join(", "))
        : 0;
      const gpaCost = entry.gpa !== null && entry.gpa !== undefined ? 1 : 0;
      return sum + 2 + Math.max(coursework, gpaCost);
    }, 0)
  );
};

const estimateSkillsCost = (groups: SkillGroup[]): number => {
  if (groups.length === 0) {
    return 0;
  }

  return (
    2 +
    groups.reduce((sum, group) => {
      return sum + estimateBodyLines(`${group.group_name}: ${group.items.join(", ")}`);
    }, 0)
  );
};

const estimateExperienceSectionCost = (
  entries: SelectedEntry<"experience">[],
  rankedExperiences: ScoredExperience[],
): number => {
  if (entries.length === 0) {
    return 0;
  }

  return (
    2 +
    entries.reduce((sum, entry, index) => {
      const experience = getExperienceById(rankedExperiences, entry.entryId);
      const bulletLines = entry.selectedBullets.reduce((bulletSum, selectedBullet) => {
        const bullet = experience.scoredBullets.find((item) => item.id === selectedBullet.bulletId);
        if (!bullet) {
          return bulletSum;
        }

        return bulletSum + getSelectedVariant(bullet, selectedBullet).lineCost;
      }, 0);

      return sum + 2 + bulletLines + (index > 0 ? 1 : 0);
    }, 0)
  );
};

const estimateProjectSectionCost = (
  entries: SelectedEntry<"project">[],
  rankedProjects: ScoredProject[],
): number => {
  if (entries.length === 0) {
    return 0;
  }

  return (
    2 +
    entries.reduce((sum, entry, index) => {
      const project = getProjectById(rankedProjects, entry.entryId);
      const bulletLines = entry.selectedBullets.reduce((bulletSum, selectedBullet) => {
        const bullet = project.scoredBullets.find((item) => item.id === selectedBullet.bulletId);
        if (!bullet) {
          return bulletSum;
        }

        return bulletSum + getSelectedVariant(bullet, selectedBullet).lineCost;
      }, 0);

      return sum + 1 + bulletLines + (index > 0 ? 1 : 0);
    }, 0)
  );
};

const estimateCertificationCost = (certificates: Certificate[]): number => {
  if (certificates.length === 0) {
    return 0;
  }

  return 2 + certificates.length;
};

const estimateAwardCost = (awards: Award[]): number => {
  if (awards.length === 0) {
    return 0;
  }

  return 2 + awards.length;
};

const estimateLeadershipCost = (
  leadership: SelectedLeadership | null,
  rankedLeadership: ScoredLeadership[],
): number => {
  if (!leadership) {
    return 0;
  }

  const entry = rankedLeadership.find((item) => item.id === leadership.entryId);
  if (!entry) {
    return 0;
  }

  const bulletLines = leadership.selectedBulletIndexes.reduce((sum, bulletIndex) => {
    const bullet = entry.scoredBullets[bulletIndex];
    return sum + (bullet?.lineCost ?? 0);
  }, 0);

  return 2 + 2 + bulletLines;
};

const estimateInterestsCost = (items: string[]): number => {
  return items.length > 0 ? 3 : 0;
};

const estimateSelectionCost = (
  bank: BankExport,
  state: SelectionState,
  rankedExperiences: ScoredExperience[],
  rankedProjects: ScoredProject[],
  rankedSkills: ScoredSkillGroup[],
  rankedCertificates: ScoredCertificate[],
  rankedAwards: ScoredAward[],
  rankedLeadership: ScoredLeadership[],
): number => {
  const education = bank.education.filter((entry) => state.selectedEducationIds.includes(entry.id));
  const skills = rankedSkills.filter((entry) => state.selectedSkillGroupIds.includes(entry.id));
  const certifications = rankedCertificates.filter((entry) => state.selectedCertifications.includes(entry.id));
  const awards = rankedAwards.filter((entry) => state.selectedAwards.includes(entry.id));

  return (
    estimateHeaderLines(bank) +
    estimateEducationCost(education) +
    estimateSkillsCost(skills) +
    estimateExperienceSectionCost(state.experiences, rankedExperiences) +
    estimateProjectSectionCost(state.projects, rankedProjects) +
    estimateCertificationCost(certifications) +
    estimateAwardCost(awards) +
    estimateLeadershipCost(state.selectedLeadership, rankedLeadership) +
    (state.includeInterests ? estimateInterestsCost(bank.interests.items) : 0)
  );
};

const takeTopBulletSelections = <
  TBullet extends ScoredBullet<ExperienceBullet> | ScoredBullet<ProjectBullet>,
>(
  bullets: TBullet[],
  count: number,
): SelectedBullet[] => {
  return bullets.slice(0, count).map((bullet) => ({
    bulletId: bullet.id,
    score: bullet.score,
    variantIndex: pickInitialVariantIndex(bullet.variants),
  }));
};

const getNextAvailableBullet = <
  TEntry extends ScoredExperience | ScoredProject,
>(
  entry: TEntry,
  selectedBulletIds: string[],
): ScoredBullet<ExperienceBullet> | ScoredBullet<ProjectBullet> | null => {
  return (
    entry.scoredBullets.find((bullet) => !selectedBulletIds.includes(bullet.id)) ?? null
  );
};

const buildInitialState = (
  bank: BankExport,
  rankedExperiences: ScoredExperience[],
  rankedProjects: ScoredProject[],
  rankedSkills: ScoredSkillGroup[],
): SelectionState => {
  const bestExperience = rankedExperiences[0];
  const bestProject = rankedProjects[0];

  const experiences = bestExperience
    ? [{
        kind: "experience" as const,
        entryId: bestExperience.id,
        score: bestExperience.score,
        mandatory: true,
        addedOrder: 1,
        selectedBullets: takeTopBulletSelections(
          bestExperience.scoredBullets,
          Math.min(MIN_ENTRY_BULLETS, bestExperience.scoredBullets.length),
        ),
      }]
    : [];

  const projects = bestProject
    ? [{
        kind: "project" as const,
        entryId: bestProject.id,
        score: bestProject.score,
        mandatory: true,
        addedOrder: 2,
        selectedBullets: takeTopBulletSelections(
          bestProject.scoredBullets,
          Math.min(MIN_ENTRY_BULLETS, bestProject.scoredBullets.length),
        ),
      }]
    : [];

  return {
    selectedEducationIds: bank.education.slice(0, 1).map((entry) => entry.id),
    selectedSkillGroupIds: rankedSkills.slice(0, DEFAULT_SKILL_GROUPS).map((entry) => entry.id),
    experiences,
    projects,
    selectedCertifications: [],
    selectedAwards: [],
    selectedLeadership: null,
    includeInterests: false,
    optionalSections: [],
    nextOrder: 3,
  };
};

const buildCandidates = (
  bank: BankExport,
  state: SelectionState,
  rankedExperiences: ScoredExperience[],
  rankedProjects: ScoredProject[],
  rankedSkills: ScoredSkillGroup[],
  rankedCertificates: ScoredCertificate[],
  rankedAwards: ScoredAward[],
  rankedLeadership: ScoredLeadership[],
  density: Density,
  options: CandidateBuildOptions,
): SelectionCandidate[] => {
  const currentCost = estimateSelectionCost(
    bank,
    state,
    rankedExperiences,
    rankedProjects,
    rankedSkills,
    rankedCertificates,
    rankedAwards,
    rankedLeadership,
  );
  const budget = TOTAL_LINE_BUDGET[density];
  const candidates: SelectionCandidate[] = [];

  for (const selectedEntry of state.experiences) {
    const experience = getExperienceById(rankedExperiences, selectedEntry.entryId);
    if (selectedEntry.selectedBullets.length >= Math.min(MAX_ENTRY_BULLETS, experience.scoredBullets.length)) {
      continue;
    }

    const nextBullet = getNextAvailableBullet(
      experience,
      selectedEntry.selectedBullets.map((bullet) => bullet.bulletId),
    ) as ScoredBullet<ExperienceBullet> | null;
    if (!nextBullet) {
      continue;
    }

    const nextState = cloneState(state);
    const nextEntry = nextState.experiences.find((entry) => entry.entryId === selectedEntry.entryId);
    if (!nextEntry) {
      continue;
    }

    nextEntry.selectedBullets.push({
      bulletId: nextBullet.id,
      score: nextBullet.score,
      variantIndex: pickInitialVariantIndex(nextBullet.variants),
    });

    const nextCost = estimateSelectionCost(
      bank,
      nextState,
      rankedExperiences,
      rankedProjects,
      rankedSkills,
      rankedCertificates,
      rankedAwards,
      rankedLeadership,
    );
    const deltaLines = nextCost - currentCost;

    if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
      candidates.push({
        kind: "experience_bullet",
        score: nextBullet.score,
        scoreDensity: nextBullet.score / deltaLines,
        deltaLines,
        apply: () => nextState,
        isRetained: (candidateState) =>
          candidateState.experiences.some(
            (entry) =>
              entry.entryId === selectedEntry.entryId &&
              entry.selectedBullets.some((bullet) => bullet.bulletId === nextBullet.id),
          ),
      });
    }
  }

  for (const selectedEntry of state.projects) {
    const project = getProjectById(rankedProjects, selectedEntry.entryId);
    if (selectedEntry.selectedBullets.length >= Math.min(MAX_ENTRY_BULLETS, project.scoredBullets.length)) {
      continue;
    }

    const nextBullet = getNextAvailableBullet(
      project,
      selectedEntry.selectedBullets.map((bullet) => bullet.bulletId),
    ) as ScoredBullet<ProjectBullet> | null;
    if (!nextBullet) {
      continue;
    }

    const nextState = cloneState(state);
    const nextEntry = nextState.projects.find((entry) => entry.entryId === selectedEntry.entryId);
    if (!nextEntry) {
      continue;
    }

    nextEntry.selectedBullets.push({
      bulletId: nextBullet.id,
      score: nextBullet.score,
      variantIndex: pickInitialVariantIndex(nextBullet.variants),
    });

    const nextCost = estimateSelectionCost(
      bank,
      nextState,
      rankedExperiences,
      rankedProjects,
      rankedSkills,
      rankedCertificates,
      rankedAwards,
      rankedLeadership,
    );
    const deltaLines = nextCost - currentCost;

    if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
      candidates.push({
        kind: "project_bullet",
        score: nextBullet.score,
        scoreDensity: nextBullet.score / deltaLines,
        deltaLines,
        apply: () => nextState,
        isRetained: (candidateState) =>
          candidateState.projects.some(
            (entry) =>
              entry.entryId === selectedEntry.entryId &&
              entry.selectedBullets.some((bullet) => bullet.bulletId === nextBullet.id),
          ),
      });
    }
  }

  for (const experience of rankedExperiences) {
    if (state.experiences.some((entry) => entry.entryId === experience.id)) {
      continue;
    }

    if (experience.scoredBullets.length === 0) {
      continue;
    }

    const nextState = cloneState(state);
    nextState.experiences.push({
      kind: "experience",
      entryId: experience.id,
      score: experience.score,
      mandatory: false,
      addedOrder: nextState.nextOrder,
      selectedBullets: takeTopBulletSelections(
        experience.scoredBullets,
        Math.min(options.newEntryBulletCount, experience.scoredBullets.length),
      ),
    });
    nextState.nextOrder += 1;

    const nextCost = estimateSelectionCost(
      bank,
      nextState,
      rankedExperiences,
      rankedProjects,
      rankedSkills,
      rankedCertificates,
      rankedAwards,
      rankedLeadership,
    );
    const deltaLines = nextCost - currentCost;

    if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
      candidates.push({
        kind: "experience_entry",
        score: experience.score,
        scoreDensity: experience.score / deltaLines,
        deltaLines,
        apply: () => nextState,
        isRetained: (candidateState) =>
          candidateState.experiences.some((entry) => entry.entryId === experience.id),
      });
    }
  }

  for (const project of rankedProjects) {
    if (state.projects.some((entry) => entry.entryId === project.id)) {
      continue;
    }

    if (project.scoredBullets.length === 0) {
      continue;
    }

    const nextState = cloneState(state);
    nextState.projects.push({
      kind: "project",
      entryId: project.id,
      score: project.score,
      mandatory: false,
      addedOrder: nextState.nextOrder,
      selectedBullets: takeTopBulletSelections(
        project.scoredBullets,
        Math.min(options.newEntryBulletCount, project.scoredBullets.length),
      ),
    });
    nextState.nextOrder += 1;

    const nextCost = estimateSelectionCost(
      bank,
      nextState,
      rankedExperiences,
      rankedProjects,
      rankedSkills,
      rankedCertificates,
      rankedAwards,
      rankedLeadership,
    );
    const deltaLines = nextCost - currentCost;

    if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
      candidates.push({
        kind: "project_entry",
        score: project.score,
        scoreDensity: project.score / deltaLines,
        deltaLines,
        apply: () => nextState,
        isRetained: (candidateState) =>
          candidateState.projects.some((entry) => entry.entryId === project.id),
      });
    }
  }

  for (const skillGroup of rankedSkills) {
    if (state.selectedSkillGroupIds.includes(skillGroup.id)) {
      continue;
    }

    const nextState = cloneState(state);
    nextState.selectedSkillGroupIds.push(skillGroup.id);

    const nextCost = estimateSelectionCost(
      bank,
      nextState,
      rankedExperiences,
      rankedProjects,
      rankedSkills,
      rankedCertificates,
      rankedAwards,
      rankedLeadership,
    );
    const deltaLines = nextCost - currentCost;

    if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
      candidates.push({
        kind: "skill_group",
        score: skillGroup.score,
        scoreDensity: skillGroup.score / deltaLines,
        deltaLines,
        apply: () => nextState,
        isRetained: (candidateState) => candidateState.selectedSkillGroupIds.includes(skillGroup.id),
      });
    }
  }

  if (state.optionalSections.length < MAX_OPTIONAL_SECTIONS) {
    if (
      rankedCertificates.length > 0 &&
      !state.optionalSections.some((section) => section.key === "certifications")
    ) {
      const selectedItems = rankedCertificates.slice(
        0,
        Math.min(options.optionalSectionSeedItemCount, MAX_CERTIFICATIONS),
      );
      if (selectedItems.length > 0) {
        const nextState = cloneState(state);
        nextState.selectedCertifications = selectedItems.map((item) => item.id);
        nextState.optionalSections.push({
          key: "certifications",
          score: selectedItems.reduce((sum, item) => sum + item.score, 0),
          addedOrder: nextState.nextOrder,
        });
        nextState.nextOrder += 1;

        const nextCost = estimateSelectionCost(
          bank,
          nextState,
          rankedExperiences,
          rankedProjects,
          rankedSkills,
          rankedCertificates,
          rankedAwards,
          rankedLeadership,
        );
        const deltaLines = nextCost - currentCost;
        const score = selectedItems.reduce((sum, item) => sum + item.score, 0);
        if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
          candidates.push({
            kind: "certifications",
            score,
            scoreDensity: score / deltaLines,
            deltaLines,
            apply: () => nextState,
            isRetained: (candidateState) =>
              candidateState.optionalSections.some((section) => section.key === "certifications"),
          });
        }
      }
    }

    if (
      state.optionalSections.some((section) => section.key === "certifications") &&
      state.selectedCertifications.length < Math.min(MAX_CERTIFICATIONS, rankedCertificates.length)
    ) {
      const nextCertificate = rankedCertificates.find(
        (item) => !state.selectedCertifications.includes(item.id),
      );
      if (nextCertificate) {
        const nextState = cloneState(state);
        nextState.selectedCertifications.push(nextCertificate.id);

        const nextCost = estimateSelectionCost(
          bank,
          nextState,
          rankedExperiences,
          rankedProjects,
          rankedSkills,
          rankedCertificates,
          rankedAwards,
          rankedLeadership,
        );
        const deltaLines = nextCost - currentCost;

        if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
          candidates.push({
            kind: "certification_item",
            score: nextCertificate.score,
            scoreDensity: nextCertificate.score / deltaLines,
            deltaLines,
            apply: () => nextState,
            isRetained: (candidateState) =>
              candidateState.selectedCertifications.includes(nextCertificate.id),
          });
        }
      }
    }

    if (
      rankedAwards.length > 0 &&
      !state.optionalSections.some((section) => section.key === "awards")
    ) {
      const selectedItems = rankedAwards.slice(
        0,
        Math.min(options.optionalSectionSeedItemCount, MAX_AWARDS),
      );
      if (selectedItems.length > 0) {
        const nextState = cloneState(state);
        nextState.selectedAwards = selectedItems.map((item) => item.id);
        nextState.optionalSections.push({
          key: "awards",
          score: selectedItems.reduce((sum, item) => sum + item.score, 0),
          addedOrder: nextState.nextOrder,
        });
        nextState.nextOrder += 1;

        const nextCost = estimateSelectionCost(
          bank,
          nextState,
          rankedExperiences,
          rankedProjects,
          rankedSkills,
          rankedCertificates,
          rankedAwards,
          rankedLeadership,
        );
        const deltaLines = nextCost - currentCost;
        const score = selectedItems.reduce((sum, item) => sum + item.score, 0);
        if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
          candidates.push({
            kind: "awards",
            score,
            scoreDensity: score / deltaLines,
            deltaLines,
            apply: () => nextState,
            isRetained: (candidateState) =>
              candidateState.optionalSections.some((section) => section.key === "awards"),
          });
        }
      }
    }

    if (
      state.optionalSections.some((section) => section.key === "awards") &&
      state.selectedAwards.length < Math.min(MAX_AWARDS, rankedAwards.length)
    ) {
      const nextAward = rankedAwards.find((item) => !state.selectedAwards.includes(item.id));
      if (nextAward) {
        const nextState = cloneState(state);
        nextState.selectedAwards.push(nextAward.id);

        const nextCost = estimateSelectionCost(
          bank,
          nextState,
          rankedExperiences,
          rankedProjects,
          rankedSkills,
          rankedCertificates,
          rankedAwards,
          rankedLeadership,
        );
        const deltaLines = nextCost - currentCost;

        if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
          candidates.push({
            kind: "award_item",
            score: nextAward.score,
            scoreDensity: nextAward.score / deltaLines,
            deltaLines,
            apply: () => nextState,
            isRetained: (candidateState) => candidateState.selectedAwards.includes(nextAward.id),
          });
        }
      }
    }

    if (
      rankedLeadership.length > 0 &&
      !state.optionalSections.some((section) => section.key === "leadership")
    ) {
      const topLeadership = rankedLeadership[0];
      if (topLeadership) {
        const nextState = cloneState(state);
        nextState.selectedLeadership = {
          entryId: topLeadership.id,
          score: topLeadership.score,
          addedOrder: nextState.nextOrder,
          selectedBulletIndexes: topLeadership.scoredBullets
            .slice(0, Math.min(options.leadershipSeedBulletCount, MAX_LEADERSHIP_BULLETS))
            .map((_, index) => index),
        };
        nextState.optionalSections.push({
          key: "leadership",
          score: topLeadership.score,
          addedOrder: nextState.nextOrder,
        });
        nextState.nextOrder += 1;

        const nextCost = estimateSelectionCost(
          bank,
          nextState,
          rankedExperiences,
          rankedProjects,
          rankedSkills,
          rankedCertificates,
          rankedAwards,
          rankedLeadership,
        );
        const deltaLines = nextCost - currentCost;
        if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
          candidates.push({
            kind: "leadership",
            score: topLeadership.score,
            scoreDensity: topLeadership.score / deltaLines,
            deltaLines,
            apply: () => nextState,
            isRetained: (candidateState) =>
              candidateState.optionalSections.some((section) => section.key === "leadership"),
          });
        }
      }
    }

    if (state.selectedLeadership) {
      const leadershipEntry = rankedLeadership.find(
        (entry) => entry.id === state.selectedLeadership?.entryId,
      );
      if (
        leadershipEntry &&
        state.selectedLeadership.selectedBulletIndexes.length <
          Math.min(MAX_LEADERSHIP_BULLETS, leadershipEntry.scoredBullets.length)
      ) {
        const nextBulletIndex = leadershipEntry.scoredBullets.findIndex(
          (_bullet, index) => !state.selectedLeadership?.selectedBulletIndexes.includes(index),
        );

        if (nextBulletIndex >= 0) {
          const nextBullet = leadershipEntry.scoredBullets[nextBulletIndex];
          const nextState = cloneState(state);
          nextState.selectedLeadership?.selectedBulletIndexes.push(nextBulletIndex);

          const nextCost = estimateSelectionCost(
            bank,
            nextState,
            rankedExperiences,
            rankedProjects,
            rankedSkills,
            rankedCertificates,
            rankedAwards,
            rankedLeadership,
          );
          const deltaLines = nextCost - currentCost;

          if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
            candidates.push({
              kind: "leadership_bullet",
              score: nextBullet.score,
              scoreDensity: nextBullet.score / deltaLines,
              deltaLines,
              apply: () => nextState,
              isRetained: (candidateState) =>
                candidateState.selectedLeadership?.selectedBulletIndexes.includes(nextBulletIndex) ?? false,
            });
          }
        }
      }
    }

    if (
      bank.interests.items.length > 0 &&
      !state.optionalSections.some((section) => section.key === "interests")
    ) {
      const interestsScore = 0.15;
      const nextState = cloneState(state);
      nextState.includeInterests = true;
      nextState.optionalSections.push({
        key: "interests",
        score: interestsScore,
        addedOrder: nextState.nextOrder,
      });
      nextState.nextOrder += 1;

      const nextCost = estimateSelectionCost(
        bank,
        nextState,
        rankedExperiences,
        rankedProjects,
        rankedSkills,
        rankedCertificates,
        rankedAwards,
        rankedLeadership,
      );
      const deltaLines = nextCost - currentCost;
      if (deltaLines > 0 && (!options.enforceEstimatedBudget || nextCost <= budget)) {
        candidates.push({
          kind: "interests",
          score: interestsScore,
          scoreDensity: interestsScore / deltaLines,
          deltaLines,
          apply: () => nextState,
          isRetained: (candidateState) => candidateState.includeInterests,
        });
      }
    }
  }

  return candidates
    .filter((candidate) => candidate.score >= options.minScore)
    .sort((left, right) => {
      return (
        right.scoreDensity - left.scoreDensity ||
        right.score - left.score ||
        left.deltaLines - right.deltaLines
      );
    });
};

const renderSelection = async (
  bank: BankExport,
  state: SelectionState,
  rankedExperiences: ScoredExperience[],
  rankedProjects: ScoredProject[],
  rankedSkills: ScoredSkillGroup[],
  rankedCertificates: ScoredCertificate[],
  rankedAwards: ScoredAward[],
  rankedLeadership: ScoredLeadership[],
  template: ResumeTemplateKey,
  density: Density,
) => {
  const filtered = buildSelectedBank(
    bank,
    state,
    rankedExperiences,
    rankedProjects,
    rankedSkills,
    rankedCertificates,
    rankedAwards,
    rankedLeadership,
  );
  const latex = assembleResumeTex({
    bank: filtered.bank,
    template,
    includeSections: filtered.includeSections,
    density,
  });
  const compiled = await compileLatexToPdf({ latex });

  return { filtered, latex, compiled };
};

const buildSelectedBank = (
  bank: BankExport,
  state: SelectionState,
  rankedExperiences: ScoredExperience[],
  rankedProjects: ScoredProject[],
  rankedSkills: ScoredSkillGroup[],
  rankedCertificates: ScoredCertificate[],
  rankedAwards: ScoredAward[],
  rankedLeadership: ScoredLeadership[],
): { bank: BankExport; includeSections: OptionalSectionKey[] } => {
  const experienceMap = new Map(rankedExperiences.map((entry) => [entry.id, entry]));
  const projectMap = new Map(rankedProjects.map((entry) => [entry.id, entry]));
  const leadershipMap = new Map(rankedLeadership.map((entry) => [entry.id, entry]));

  const experiences = state.experiences
    .map((selectedEntry) => {
      const experience = experienceMap.get(selectedEntry.entryId);
      if (!experience) {
        return null;
      }

      const selectedBullets = selectedEntry.selectedBullets
        .map((selectedBullet) => {
          const bullet = experience.scoredBullets.find((item) => item.id === selectedBullet.bulletId);
          if (!bullet) {
            return null;
          }

          const selectedVariant = getSelectedVariant(bullet, selectedBullet);
          const experienceBullet: ExperienceBullet = {
            id: bullet.id,
            order_index: bullet.order_index,
            bullet_long: selectedVariant.text,
            bullet_medium: null,
            bullet_short: null,
            skills_tags: bullet.skills_tags,
            metrics: bullet.metrics,
          };
          return experienceBullet;
        })
        .filter((bullet): bullet is ExperienceBullet => bullet !== null)
        .sort((left, right) => left.order_index - right.order_index);

      const { scoredBullets: _scoredBullets, score: _score, ...baseExperience } = experience;

      const filteredExperience: Experience = {
        ...baseExperience,
        bullets: selectedBullets,
      };
      return filteredExperience;
    })
    .filter((entry): entry is Experience => entry !== null);

  const projects = state.projects
    .map((selectedEntry) => {
      const project = projectMap.get(selectedEntry.entryId);
      if (!project) {
        return null;
      }

      const selectedBullets = selectedEntry.selectedBullets
        .map((selectedBullet) => {
          const bullet = project.scoredBullets.find((item) => item.id === selectedBullet.bulletId);
          if (!bullet) {
            return null;
          }

          const selectedVariant = getSelectedVariant(bullet, selectedBullet);
          const projectBullet: ProjectBullet = {
            id: bullet.id,
            order_index: bullet.order_index,
            bullet_long: selectedVariant.text,
            bullet_medium: null,
            bullet_short: null,
            skills_tags: bullet.skills_tags,
            metrics: bullet.metrics,
          };
          return projectBullet;
        })
        .filter((bullet): bullet is ProjectBullet => bullet !== null)
        .sort((left, right) => left.order_index - right.order_index);

      const { scoredBullets: _scoredBullets, score: _score, ...baseProject } = project;

      const filteredProject: Project = {
        ...baseProject,
        bullets: selectedBullets,
      };
      return filteredProject;
    })
    .filter((entry): entry is Project => entry !== null);

  const leadership = state.selectedLeadership
    ? (() => {
        const entry = leadershipMap.get(state.selectedLeadership?.entryId ?? "");
        if (!entry) {
          return [];
        }

        const { scoredBullets: _scoredBullets, score: _score, ...baseLeadership } = entry;

        return [{
          ...baseLeadership,
          bullets: state.selectedLeadership.selectedBulletIndexes
            .map((index) => entry.scoredBullets[index]?.text)
            .filter((bullet): bullet is string => typeof bullet === "string"),
        }];
      })()
    : [];

  const includeSections = state.optionalSections
    .sort((left, right) => left.addedOrder - right.addedOrder)
    .map((section) => section.key)
    .filter((section): section is OptionalSectionKey => OPTIONAL_SECTION_KEYS.includes(section));

  return {
    includeSections,
    bank: {
      ...bank,
      education: bank.education.filter((entry) => state.selectedEducationIds.includes(entry.id)),
      experiences,
      projects,
      skills: {
        groups: rankedSkills.filter((entry) => state.selectedSkillGroupIds.includes(entry.id)),
      },
      certificates: rankedCertificates.filter((entry) => state.selectedCertifications.includes(entry.id)),
      awards: rankedAwards.filter((entry) => state.selectedAwards.includes(entry.id)),
      leadership,
      interests: {
        items: state.includeInterests ? bank.interests.items : [],
      },
    },
  };
};

const buildTrimActions = (
  state: SelectionState,
  rankedExperiences: ScoredExperience[],
  rankedProjects: ScoredProject[],
  rankedSkills: ScoredSkillGroup[],
): TrimAction[] => {
  const actions: TrimAction[] = [];

  for (const entry of state.experiences) {
    const experience = rankedExperiences.find((item) => item.id === entry.entryId);
    if (!experience) {
      continue;
    }

    for (const selectedBullet of entry.selectedBullets) {
      const bullet = experience.scoredBullets.find((item) => item.id === selectedBullet.bulletId);
      if (!bullet) {
        continue;
      }

      const currentVariant = bullet.variants[selectedBullet.variantIndex];
      const nextVariant = bullet.variants[selectedBullet.variantIndex + 1];
      if (
        currentVariant &&
        nextVariant &&
        nextVariant.text.length < currentVariant.text.length
      ) {
        actions.push({
          penalty: selectedBullet.score * 0.2,
          apply: (currentState) => {
            const nextState = cloneState(currentState);
            const nextEntry = nextState.experiences.find((item) => item.entryId === entry.entryId);
            const nextSelectedBullet = nextEntry?.selectedBullets.find((item) => item.bulletId === selectedBullet.bulletId);
            if (nextSelectedBullet) {
              nextSelectedBullet.variantIndex += 1;
            }
            return nextState;
          },
        });
      }
    }

    if (entry.selectedBullets.length > MIN_ENTRY_BULLETS) {
      const weakestBullet = [...entry.selectedBullets].sort((left, right) => left.score - right.score)[0];
      if (weakestBullet) {
        actions.push({
          penalty: weakestBullet.score,
          apply: (currentState) => {
            const nextState = cloneState(currentState);
            const nextEntry = nextState.experiences.find((item) => item.entryId === entry.entryId);
            if (nextEntry) {
              nextEntry.selectedBullets = nextEntry.selectedBullets.filter(
                (item) => item.bulletId !== weakestBullet.bulletId,
              );
            }
            return nextState;
          },
        });
      }
    }
  }

  for (const entry of state.projects) {
    const project = rankedProjects.find((item) => item.id === entry.entryId);
    if (!project) {
      continue;
    }

    for (const selectedBullet of entry.selectedBullets) {
      const bullet = project.scoredBullets.find((item) => item.id === selectedBullet.bulletId);
      if (!bullet) {
        continue;
      }

      const currentVariant = bullet.variants[selectedBullet.variantIndex];
      const nextVariant = bullet.variants[selectedBullet.variantIndex + 1];
      if (
        currentVariant &&
        nextVariant &&
        nextVariant.text.length < currentVariant.text.length
      ) {
        actions.push({
          penalty: selectedBullet.score * 0.2,
          apply: (currentState) => {
            const nextState = cloneState(currentState);
            const nextEntry = nextState.projects.find((item) => item.entryId === entry.entryId);
            const nextSelectedBullet = nextEntry?.selectedBullets.find((item) => item.bulletId === selectedBullet.bulletId);
            if (nextSelectedBullet) {
              nextSelectedBullet.variantIndex += 1;
            }
            return nextState;
          },
        });
      }
    }

    if (entry.selectedBullets.length > MIN_ENTRY_BULLETS) {
      const weakestBullet = [...entry.selectedBullets].sort((left, right) => left.score - right.score)[0];
      if (weakestBullet) {
        actions.push({
          penalty: weakestBullet.score,
          apply: (currentState) => {
            const nextState = cloneState(currentState);
            const nextEntry = nextState.projects.find((item) => item.entryId === entry.entryId);
            if (nextEntry) {
              nextEntry.selectedBullets = nextEntry.selectedBullets.filter(
                (item) => item.bulletId !== weakestBullet.bulletId,
              );
            }
            return nextState;
          },
        });
      }
    }
  }

  const removableOptionalSections = [...state.optionalSections].sort((left, right) => left.score - right.score);
  for (const optionalSection of removableOptionalSections) {
    actions.push({
      penalty: optionalSection.score,
      apply: (currentState) => {
        const nextState = cloneState(currentState);
        nextState.optionalSections = nextState.optionalSections.filter(
          (section) => section.key !== optionalSection.key,
        );

        if (optionalSection.key === "certifications") {
          nextState.selectedCertifications = [];
        }

        if (optionalSection.key === "awards") {
          nextState.selectedAwards = [];
        }

        if (optionalSection.key === "leadership") {
          nextState.selectedLeadership = null;
        }

        if (optionalSection.key === "interests") {
          nextState.includeInterests = false;
        }

        return nextState;
      },
    });
  }

  const removableEntries = [
    ...state.experiences
      .filter((entry) => !entry.mandatory)
      .map<TrimAction>((entry) => ({
        penalty: entry.score,
        apply: (currentState) => {
          const nextState = cloneState(currentState);
          nextState.experiences = nextState.experiences.filter((item) => item.entryId !== entry.entryId);
          return nextState;
        },
      })),
    ...state.projects
      .filter((entry) => !entry.mandatory)
      .map<TrimAction>((entry) => ({
        penalty: entry.score,
        apply: (currentState) => {
          const nextState = cloneState(currentState);
          nextState.projects = nextState.projects.filter((item) => item.entryId !== entry.entryId);
          return nextState;
        },
      })),
  ];

  actions.push(...removableEntries);

  if (state.selectedSkillGroupIds.length > 2) {
    const weakestSkill = rankedSkills
      .filter((entry) => state.selectedSkillGroupIds.includes(entry.id))
      .sort((left, right) => left.score - right.score)[0];

    if (weakestSkill) {
      actions.push({
        penalty: weakestSkill.score,
        apply: (currentState) => {
          const nextState = cloneState(currentState);
          nextState.selectedSkillGroupIds = nextState.selectedSkillGroupIds.filter(
            (id) => id !== weakestSkill.id,
          );
          return nextState;
        },
      });
    }
  }

  return actions.sort((left, right) => left.penalty - right.penalty);
};

const growSelection = (
  bank: BankExport,
  density: Density,
  initialState: SelectionState,
  rankedExperiences: ScoredExperience[],
  rankedProjects: ScoredProject[],
  rankedSkills: ScoredSkillGroup[],
  rankedCertificates: ScoredCertificate[],
  rankedAwards: ScoredAward[],
  rankedLeadership: ScoredLeadership[],
): SelectionState => {
  let state = cloneState(initialState);

  for (let step = 0; step < MAX_GROW_STEPS; step += 1) {
    const candidates = buildCandidates(
      bank,
      state,
      rankedExperiences,
      rankedProjects,
      rankedSkills,
      rankedCertificates,
      rankedAwards,
      rankedLeadership,
      density,
      {
        enforceEstimatedBudget: false,
        minScore: SATURATION_MIN_CANDIDATE_SCORE,
        newEntryBulletCount: MIN_ENTRY_BULLETS,
        optionalSectionSeedItemCount: 1,
        leadershipSeedBulletCount: 1,
      },
    );

    if (candidates.length === 0) {
      return state;
    }

    state = candidates[0].apply(state);
  }

  return state;
};

export const generateResume = async ({
  bank,
  jobDescription,
  template,
  density,
  includePdf,
}: GenerateResumeParams) => {
  const profile = buildJobDescriptionProfile(jobDescription);
  const rankedExperiences = sortByScore(bank.experiences.map((entry) => scoreExperience(entry, profile)));
  const rankedProjects = sortByScore(bank.projects.map((entry) => scoreProject(entry, profile)));
  const rankedSkills = sortByScore(bank.skills.groups.map((entry) => scoreSkillGroup(entry, profile)));
  const rankedCertificates = sortByScore(bank.certificates.map((entry) => scoreCertificate(entry, profile)));
  const rankedAwards = sortByScore(bank.awards.map((entry) => scoreAward(entry, profile)));
  const rankedLeadership = sortByScore(bank.leadership.map((entry) => scoreLeadership(entry, profile)));

  const initialState = buildInitialState(
    bank,
    rankedExperiences,
    rankedProjects,
    rankedSkills,
  );

  let state = growSelection(
    bank,
    density,
    initialState,
    rankedExperiences,
    rankedProjects,
    rankedSkills,
    rankedCertificates,
    rankedAwards,
    rankedLeadership,
  );

  let trimPasses = 0;
  let finalPdf: Buffer | null = null;
  let pageCount = 0;
  let compiler = "";

  for (let attempt = 0; attempt <= MAX_TRIM_PASSES; attempt += 1) {
    const { filtered, latex, compiled } = await renderSelection(
      bank,
      state,
      rankedExperiences,
      rankedProjects,
      rankedSkills,
      rankedCertificates,
      rankedAwards,
      rankedLeadership,
      template,
      density,
    );
    pageCount = compiled.pageCount;
    compiler = compiled.compiler;

    if (pageCount <= 1) {
      finalPdf = includePdf ? compiled.pdfBuffer : null;
      return {
        latex,
        pdfBase64: includePdf ? compiled.pdfBuffer.toString("base64") : undefined,
        pageCount: compiled.pageCount,
        fitsOnOnePage: compiled.pageCount === 1,
        compiler: compiled.compiler,
        trimPasses,
        estimatedLineBudget: TOTAL_LINE_BUDGET[density],
        estimatedLinesUsed: estimateSelectionCost(
          bank,
          state,
          rankedExperiences,
          rankedProjects,
          rankedSkills,
          rankedCertificates,
          rankedAwards,
          rankedLeadership,
        ),
        plan: {
          template,
          includeSections: filtered.includeSections,
          selectedEducationIds: filtered.bank.education.map((entry) => entry.id),
          selectedSkillGroupIds: filtered.bank.skills.groups.map((entry) => entry.id),
          selectedExperienceIds: filtered.bank.experiences.map((entry) => entry.id),
          selectedProjectIds: filtered.bank.projects.map((entry) => entry.id),
          selectedCertificationIds: filtered.bank.certificates.map((entry) => entry.id),
          selectedAwardIds: filtered.bank.awards.map((entry) => entry.id),
          selectedLeadershipIds: filtered.bank.leadership.map((entry) => entry.id),
        },
      };
    }

    const trimAction = buildTrimActions(state, rankedExperiences, rankedProjects, rankedSkills)[0];
    if (!trimAction) {
      if (includePdf) {
        finalPdf = compiled.pdfBuffer;
      }

      return {
        latex,
        pdfBase64: includePdf ? (finalPdf ?? compiled.pdfBuffer).toString("base64") : undefined,
        pageCount,
        fitsOnOnePage: false,
        compiler,
        trimPasses,
        estimatedLineBudget: TOTAL_LINE_BUDGET[density],
        estimatedLinesUsed: estimateSelectionCost(
          bank,
          state,
          rankedExperiences,
          rankedProjects,
          rankedSkills,
          rankedCertificates,
          rankedAwards,
          rankedLeadership,
        ),
        plan: {
          template,
          includeSections: filtered.includeSections,
          selectedEducationIds: filtered.bank.education.map((entry) => entry.id),
          selectedSkillGroupIds: filtered.bank.skills.groups.map((entry) => entry.id),
          selectedExperienceIds: filtered.bank.experiences.map((entry) => entry.id),
          selectedProjectIds: filtered.bank.projects.map((entry) => entry.id),
          selectedCertificationIds: filtered.bank.certificates.map((entry) => entry.id),
          selectedAwardIds: filtered.bank.awards.map((entry) => entry.id),
          selectedLeadershipIds: filtered.bank.leadership.map((entry) => entry.id),
        },
      };
    }

    state = trimAction.apply(state);
    trimPasses += 1;
  }

  throw new Error("Unable to fit generated resume within one page after trimming.");
};
