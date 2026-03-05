import { DateLike, ExperienceBullet, ProjectBullet } from "../types";

const MONTHS = [
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "May",
  "Jun.",
  "Jul.",
  "Aug.",
  "Sep.",
  "Oct.",
  "Nov.",
  "Dec.",
];

const toDate = (value: DateLike): Date | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatMonthYear = (value: DateLike): string => {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

export const formatDateRange = (start: DateLike, end: DateLike): string => {
  const startText = formatMonthYear(start);
  const endText = end ? formatMonthYear(end) : "Present";

  if (!startText) {
    return endText;
  }

  return `${startText} -- ${endText}`;
};

export const pickBulletText = (
  bullet: ExperienceBullet | ProjectBullet,
): string => {
  return (
    bullet.bullet_long ?? bullet.bullet_medium ?? bullet.bullet_short ?? ""
  );
};
