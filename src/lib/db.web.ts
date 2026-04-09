/**
 * Web-only fallback for the local SQLite data layer.
 *
 * Expo web resolves `../lib/db` to this file instead of `db.ts`, which keeps
 * the browser bundle from touching `expo-sqlite` / wasm worker code.
 */

export const DATABASE_NAME = "kanji_srs_v2.db";
export const LOCAL_USER_ID = "local-user";
export const MAX_PENDING_REVIEWS = 20;
export const MAX_PENDING_LESSONS = 10;

export const SUBJECT_TYPES = ["RADICAL", "KANJI", "VOCABULARY"] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export const SRS_STAGE_NAMES = [
  "APPRENTICE_1",
  "APPRENTICE_2",
  "APPRENTICE_3",
  "APPRENTICE_4",
  "GURU_1",
  "GURU_2",
  "MASTER",
  "ENLIGHTENED",
  "BURNED",
] as const;

export type SrsStageName = (typeof SRS_STAGE_NAMES)[number];

export enum SrsStage {
  APPRENTICE_1 = 0,
  APPRENTICE_2 = 1,
  APPRENTICE_3 = 2,
  APPRENTICE_4 = 3,
  GURU_1 = 4,
  GURU_2 = 5,
  MASTER = 6,
  ENLIGHTENED = 7,
  BURNED = 8,
}

export type Subject = {
  id: string;
  type: SubjectType;
  level: number;
  slug: string;
  characters: string | null;
  meanings: string[];
  readings: string[];
  meaningMnemonic: string | null;
  readingMnemonic: string | null;
};

type SeedSubject = Subject;

export type LessonQueueItem = {
  reviewStatisticId: number;
  userId: string;
  subjectId: string;
  lessonStartedAt: number;
  subject: Subject;
};

export type ReviewQueueItem = {
  reviewStatisticId: number;
  userId: string;
  subjectId: string;
  srsStage: number;
  srsStageName: SrsStageName;
  nextReviewAt: number | null;
  lastReviewedAt: number | null;
  lessonStartedAt: number;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  subject: Subject;
};

export type SubmitReviewInput = {
  reviewStatisticId: number;
  isCorrect: boolean;
  userId?: string;
};

export type SubmitReviewResult = {
  isCorrect: boolean;
  review: ReviewQueueItem;
};

export type DashboardStats = {
  currentLevel: number;
  pendingLessons: number;
  pendingReviews: number;
  stageBreakdown: {
    apprentice: number;
    guru: number;
    master: number;
    enlightened: number;
  };
};

export type ImportSubjectsResult = {
  insertedSubjects: number;
  skippedSubjects: number;
  seededReviews: number;
  totalProcessed: number;
};

export const MOCK_LEVEL_ONE_TO_FIVE_SUBJECTS: SeedSubject[] = [];

const WEB_DASHBOARD_STATS: DashboardStats = {
  currentLevel: 1,
  pendingLessons: 0,
  pendingReviews: 0,
  stageBreakdown: {
    apprentice: 0,
    guru: 0,
    master: 0,
    enlightened: 0,
  },
};

export async function initializeDatabase(): Promise<void> {
  return;
}

export async function importSubjectsFromJson(
  subjects: unknown[]
): Promise<ImportSubjectsResult> {
  return {
    insertedSubjects: 0,
    skippedSubjects: Array.isArray(subjects) ? subjects.length : 0,
    seededReviews: 0,
    totalProcessed: Array.isArray(subjects) ? subjects.length : 0,
  };
}

export async function resetSampleProgress(): Promise<void> {
  return;
}

export async function getPendingLessons(): Promise<LessonQueueItem[]> {
  return [];
}

export async function completeLesson(_subjectId: string): Promise<void> {
  return;
}

export async function getPendingReviews(): Promise<ReviewQueueItem[]> {
  return [];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return WEB_DASHBOARD_STATS;
}

export async function submitReviewAnswer(
  _input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  throw new Error("Web build does not support local SQLite reviews.");
}
