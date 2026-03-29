export type DateLike = Date | string | null | undefined;

export type Density = "normal" | "tight";

export type BankProfile = {
  full_name: string;
  location: string;
  phone?: string | null;
  email: string;
  headline?: string | null;
  links: Array<{
    label: string;
    url: string;
    priority: number;
  }>;
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  majors: string[];
  location: string;
  start_date: DateLike;
  end_date: DateLike;
  gpa?: number | null;
  notes?: string | null;
  relevant_coursework: string[];
  created_at: DateLike;
};

export type ExperienceBullet = {
  id: string;
  order_index: number;
  bullet_long?: string | null;
  bullet_medium?: string | null;
  bullet_short?: string | null;
  skills_tags?: string[];
  metrics?: unknown;
};

export type Experience = {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: DateLike;
  end_date: DateLike;
  employment_type?: string | null;
  tags: string[];
  tech_stack: string[];
  priority: number;
  context?: string | null;
  facts?: unknown;
  bullets: ExperienceBullet[];
  created_at: DateLike;
};

export type ProjectBullet = {
  id: string;
  order_index: number;
  bullet_long?: string | null;
  bullet_medium?: string | null;
  bullet_short?: string | null;
  skills_tags?: string[];
  metrics?: unknown;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  start_date: DateLike;
  end_date: DateLike;
  tags: string[];
  tech_stack: string[];
  priority: number;
  bullets: ProjectBullet[];
  created_at: DateLike;
};

export type Certificate = {
  id: string;
  name: string;
  issuer: string;
  issued_date: DateLike;
  expires_date?: DateLike;
  credential_url?: string | null;
  created_at: DateLike;
};

export type Award = {
  id: string;
  title: string;
  issuer: string;
  date: DateLike;
  notes?: string | null;
  created_at: DateLike;
};

export type Leadership = {
  id: string;
  role: string;
  org: string;
  location: string;
  start_date: DateLike;
  end_date: DateLike;
  bullets: string[];
  created_at: DateLike;
};

export type SkillGroup = {
  id: string;
  group_name: string;
  items: string[];
  priority: number;
  created_at: DateLike;
};

export type BankExport = {
  user: { id: number };
  profile: BankProfile | null;
  education: Education[];
  experiences: Experience[];
  projects: Project[];
  skills: { groups: SkillGroup[] };
  interests: { items: string[] };
  certificates: Certificate[];
  awards: Award[];
  leadership: Leadership[];
  meta: { schema_version: number; exported_at: string };
};
