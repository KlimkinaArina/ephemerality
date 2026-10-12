import { z } from "zod";

export const APPLICATION_GENRES = [
  "драма",
  "документальный",
  "анимация",
  "экспериментальный",
  "комедия",
  "триллер",
] as const;

export const APPLICATION_SELECT =
  "id, title, slug, description, duration_seconds, genre, themes, moods, video_url, thumbnail_url, status, review_notes, submitted_at, release_date, director_id, user_id, author_id, created_at, visibility" as const;

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "waitlisted";

export type ApplicationRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration_seconds: number;
  genre: string[] | null;
  themes: string[] | null;
  moods: string[] | null;
  video_url: string | null;
  thumbnail_url: string | null;
  status: string;
  review_notes: string | null;
  submitted_at: string | null;
  release_date: string | null;
  director_id: string | null;
  user_id: string | null;
  author_id: string;
  created_at: string;
  visibility: string;
};

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Черновик",
  submitted: "На рассмотрении",
  under_review: "На рецензии",
  accepted: "Принята",
  rejected: "Отклонена",
  waitlisted: "Лист ожидания",
};

export const STATUS_CLASS: Record<ApplicationStatus, string> = {
  draft: "border-muted-foreground/40 bg-muted/40 text-muted-foreground",
  submitted: "border-sky-400/60 bg-sky-500/15 text-sky-200",
  under_review: "border-amber-400/60 bg-amber-400/15 text-amber-200",
  accepted: "border-emerald-400/60 bg-emerald-500/15 text-emerald-200",
  rejected: "border-red-400/60 bg-red-500/15 text-red-200",
  waitlisted: "border-orange-400/60 bg-orange-500/15 text-orange-200",
};

export function parseApplicationStatus(value: string): ApplicationStatus {
  if (
    value === "draft" ||
    value === "submitted" ||
    value === "under_review" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "waitlisted"
  ) {
    return value;
  }
  return "draft";
}

export function isEditableStatus(status: string) {
  return status === "draft" || status === "submitted";
}

function isAllowedVideoUrl(value: string) {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return (
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "m.youtube.com" ||
      host === "vimeo.com" ||
      host === "player.vimeo.com" ||
      host === "drive.google.com" ||
      host === "docs.google.com"
    );
  } catch {
    return false;
  }
}

export const applicationDraftSchema = z.object({
  title: z.string().trim().min(1, "Укажите название"),
  synopsis: z.string(),
  duration_min: z.number().int().min(1, "Минимум 1 минута").max(30, "До 30 минут"),
  genre: z.string(),
  country: z.string(),
  year: z.number().int().min(1895).max(new Date().getFullYear() + 1),
  language: z.string(),
  video_url: z.string(),
  poster_url: z.string(),
});

export const applicationSubmitSchema = applicationDraftSchema
  .extend({
    synopsis: z
      .string()
      .trim()
      .min(100, "Синопсис — минимум 100 символов"),
    genre: z.string().trim().min(1, "Выберите жанр"),
    country: z.string().trim().min(1, "Укажите страну"),
    language: z.string().trim().min(1, "Укажите язык"),
    video_url: z
      .string()
      .trim()
      .url("Нужна ссылка на видео")
      .refine(isAllowedVideoUrl, "YouTube, Vimeo или Google Drive"),
  });

export type ApplicationFormValues = z.infer<typeof applicationDraftSchema>;

export const emptyApplicationValues: ApplicationFormValues = {
  title: "",
  synopsis: "",
  duration_min: 10,
  genre: "",
  country: "",
  year: new Date().getFullYear(),
  language: "",
  video_url: "",
  poster_url: "",
};

export function rowToFormValues(row: ApplicationRow): ApplicationFormValues {
  return {
    title: row.title,
    synopsis: row.description ?? "",
    duration_min: Math.max(1, Math.round((row.duration_seconds || 60) / 60)),
    genre: row.genre?.[0] ?? "",
    country: row.themes?.[0] ?? "",
    year: row.release_date ? Number(row.release_date.slice(0, 4)) : new Date().getFullYear(),
    language: row.moods?.[0] ?? "",
    video_url: row.video_url ?? "",
    poster_url: row.thumbnail_url ?? "",
  };
}

export function formToPayload(values: ApplicationFormValues) {
  return {
    title: values.title.trim(),
    description: values.synopsis.trim() || null,
    duration_seconds: values.duration_min * 60,
    genre: values.genre.trim() ? [values.genre.trim()] : [],
    themes: values.country.trim() ? [values.country.trim()] : [],
    moods: values.language.trim() ? [values.language.trim()] : [],
    video_url: values.video_url.trim() || null,
    thumbnail_url: values.poster_url.trim() || null,
    release_date: `${values.year}-01-01`,
  };
}
