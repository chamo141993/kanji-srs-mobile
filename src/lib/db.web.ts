/**
 * Web-only data layer backed by browser localStorage.
 *
 * Expo web resolves `../lib/db` to this file instead of `db.ts`, which keeps
 * the browser bundle from touching `expo-sqlite` while still supporting local
 * import/reset/lesson/review flows in the browser.
 */

export const DATABASE_NAME = "kanji_srs_v2.db";
export const LOCAL_USER_ID = "local-user";
export const MAX_PENDING_REVIEWS = 20;
export const MAX_PENDING_LESSONS = 10;
const WEB_STORAGE_KEY = "kanji-srs-web-db-v1";

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

type WebUser = {
  id: string;
  currentLevel: number;
};

type WebReviewStatistic = {
  id: number;
  userId: string;
  subjectId: string;
  lessonCompleted: boolean;
  srsStage: number;
  nextReviewAt: number | null;
  lastReviewedAt: number | null;
  lessonStartedAt: number;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
};

type WebDatabaseState = {
  users: WebUser[];
  subjects: SeedSubject[];
  reviewStatistics: WebReviewStatistic[];
  nextReviewStatisticId: number;
};

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

const STAGE_INTERVAL_MS: Record<number, number | null> = {
  [SrsStage.APPRENTICE_1]: 4 * 60 * 60 * 1000,
  [SrsStage.APPRENTICE_2]: 8 * 60 * 60 * 1000,
  [SrsStage.APPRENTICE_3]: 24 * 60 * 60 * 1000,
  [SrsStage.APPRENTICE_4]: 2 * 24 * 60 * 60 * 1000,
  [SrsStage.GURU_1]: 7 * 24 * 60 * 60 * 1000,
  [SrsStage.GURU_2]: 14 * 24 * 60 * 60 * 1000,
  [SrsStage.MASTER]: 30 * 24 * 60 * 60 * 1000,
  [SrsStage.ENLIGHTENED]: 120 * 24 * 60 * 60 * 1000,
  [SrsStage.BURNED]: null,
};

let memoryState: WebDatabaseState | null = null;

function createInitialState(): WebDatabaseState {
  return {
    users: [{ id: LOCAL_USER_ID, currentLevel: 1 }],
    subjects: [],
    reviewStatistics: [],
    nextReviewStatisticId: 1,
  };
}

function getStorage(): Storage | null {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage access failures and fall back to in-memory state.
  }

  return null;
}

function loadState(): WebDatabaseState {
  if (memoryState) {
    return memoryState;
  }

  const storage = getStorage();
  if (!storage) {
    memoryState = createInitialState();
    return memoryState;
  }

  try {
    const raw = storage.getItem(WEB_STORAGE_KEY);
    if (!raw) {
      memoryState = createInitialState();
      storage.setItem(WEB_STORAGE_KEY, JSON.stringify(memoryState));
      return memoryState;
    }

    const parsed = JSON.parse(raw);
    memoryState = normalizeLoadedState(parsed);
    return memoryState;
  } catch {
    memoryState = createInitialState();
    persistState(memoryState);
    return memoryState;
  }
}

function normalizeLoadedState(value: unknown): WebDatabaseState {
  if (!isRecord(value)) {
    return createInitialState();
  }

  const users = Array.isArray(value.users)
    ? value.users
        .filter(isRecord)
        .map((user) => ({
          id: normalizeString(user.id) ?? LOCAL_USER_ID,
          currentLevel:
            typeof user.currentLevel === "number" && Number.isFinite(user.currentLevel)
              ? Math.max(1, Math.trunc(user.currentLevel))
              : 1,
        }))
    : [];

  const subjects = Array.isArray(value.subjects)
    ? value.subjects
        .map((subject, index) => normalizeImportedSubject(subject, index))
        .filter((subject): subject is SeedSubject => subject !== null)
    : [];

  const reviewStatistics = Array.isArray(value.reviewStatistics)
    ? value.reviewStatistics
        .filter(isRecord)
        .map((row, index) => ({
          id:
            typeof row.id === "number" && Number.isFinite(row.id)
              ? Math.trunc(row.id)
              : index + 1,
          userId: normalizeString(row.userId) ?? LOCAL_USER_ID,
          subjectId: normalizeString(row.subjectId) ?? "",
          lessonCompleted: Boolean(row.lessonCompleted),
          srsStage:
            typeof row.srsStage === "number" && Number.isFinite(row.srsStage)
              ? Math.max(0, Math.min(SrsStage.BURNED, Math.trunc(row.srsStage)))
              : SrsStage.APPRENTICE_1,
          nextReviewAt:
            typeof row.nextReviewAt === "number" && Number.isFinite(row.nextReviewAt)
              ? row.nextReviewAt
              : null,
          lastReviewedAt:
            typeof row.lastReviewedAt === "number" && Number.isFinite(row.lastReviewedAt)
              ? row.lastReviewedAt
              : null,
          lessonStartedAt:
            typeof row.lessonStartedAt === "number" && Number.isFinite(row.lessonStartedAt)
              ? row.lessonStartedAt
              : Date.now(),
          reviewCount:
            typeof row.reviewCount === "number" && Number.isFinite(row.reviewCount)
              ? Math.max(0, Math.trunc(row.reviewCount))
              : 0,
          correctCount:
            typeof row.correctCount === "number" && Number.isFinite(row.correctCount)
              ? Math.max(0, Math.trunc(row.correctCount))
              : 0,
          wrongCount:
            typeof row.wrongCount === "number" && Number.isFinite(row.wrongCount)
              ? Math.max(0, Math.trunc(row.wrongCount))
              : 0,
        }))
        .filter((row) => row.subjectId.length > 0)
    : [];

  const nextReviewStatisticId =
    typeof value.nextReviewStatisticId === "number" && Number.isFinite(value.nextReviewStatisticId)
      ? Math.max(1, Math.trunc(value.nextReviewStatisticId))
      : reviewStatistics.reduce((maxId, row) => Math.max(maxId, row.id), 0) + 1;

  const state: WebDatabaseState = {
    users,
    subjects,
    reviewStatistics,
    nextReviewStatisticId,
  };

  ensureUser(state, LOCAL_USER_ID);
  return state;
}

function persistState(state: WebDatabaseState) {
  memoryState = state;
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(WEB_STORAGE_KEY, JSON.stringify(state));
}

function ensureUser(state: WebDatabaseState, userId: string): WebUser {
  let user = state.users.find((entry) => entry.id === userId);
  if (!user) {
    user = { id: userId, currentLevel: 1 };
    state.users.push(user);
  }

  return user;
}

function getSubjectById(state: WebDatabaseState, subjectId: string): SeedSubject | null {
  return state.subjects.find((subject) => subject.id === subjectId) ?? null;
}

function buildLessonQueueItem(
  row: WebReviewStatistic,
  subject: SeedSubject
): LessonQueueItem {
  return {
    reviewStatisticId: row.id,
    userId: row.userId,
    subjectId: row.subjectId,
    lessonStartedAt: row.lessonStartedAt,
    subject,
  };
}

function buildReviewQueueItem(
  row: WebReviewStatistic,
  subject: SeedSubject
): ReviewQueueItem {
  return {
    reviewStatisticId: row.id,
    userId: row.userId,
    subjectId: row.subjectId,
    srsStage: row.srsStage,
    srsStageName: SRS_STAGE_NAMES[row.srsStage],
    nextReviewAt: row.nextReviewAt,
    lastReviewedAt: row.lastReviewedAt,
    lessonStartedAt: row.lessonStartedAt,
    reviewCount: row.reviewCount,
    correctCount: row.correctCount,
    wrongCount: row.wrongCount,
    subject,
  };
}

export async function initializeDatabase(): Promise<void> {
  const state = loadState();
  ensureUser(state, LOCAL_USER_ID);
  persistState(state);
}

export async function importSubjectsFromJson(
  jsonData: unknown,
  userId = LOCAL_USER_ID
): Promise<ImportSubjectsResult> {
  const state = loadState();
  ensureUser(state, userId);

  const importItems = extractImportSubjects(jsonData);
  const normalizedSubjects = importItems
    .map((subject, index) => normalizeImportedSubject(subject, index))
    .filter((subject): subject is SeedSubject => subject !== null);

  if (normalizedSubjects.length === 0) {
    return {
      insertedSubjects: 0,
      skippedSubjects: importItems.length,
      seededReviews: 0,
      totalProcessed: importItems.length,
    };
  }

  const existingSubjectIds = new Set(state.subjects.map((subject) => subject.id));
  const existingSlugs = new Set(state.subjects.map((subject) => subject.slug));
  const existingReviewKeys = new Set(
    state.reviewStatistics.map((row) => `${row.userId}:${row.subjectId}`)
  );

  const now = Date.now();
  let insertedSubjects = 0;
  let seededReviews = 0;

  for (const subject of normalizedSubjects) {
    const isExistingSubject =
      existingSubjectIds.has(subject.id) || existingSlugs.has(subject.slug);

    if (!isExistingSubject) {
      state.subjects.push(subject);
      existingSubjectIds.add(subject.id);
      existingSlugs.add(subject.slug);
      insertedSubjects += 1;
    }

    const reviewKey = `${userId}:${subject.id}`;
    if (!existingReviewKeys.has(reviewKey)) {
      state.reviewStatistics.push({
        id: state.nextReviewStatisticId++,
        userId,
        subjectId: subject.id,
        lessonCompleted: false,
        srsStage: SrsStage.APPRENTICE_1,
        nextReviewAt: null,
        lastReviewedAt: null,
        lessonStartedAt: now,
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
      });
      existingReviewKeys.add(reviewKey);
      seededReviews += 1;
    }
  }

  persistState(state);

  return {
    insertedSubjects,
    skippedSubjects: importItems.length - insertedSubjects,
    seededReviews,
    totalProcessed: importItems.length,
  };
}

export async function resetSampleProgress(userId = LOCAL_USER_ID): Promise<void> {
  const state = loadState();
  const now = Date.now();

  for (const review of state.reviewStatistics) {
    if (review.userId !== userId) continue;

    review.lessonCompleted = false;
    review.srsStage = SrsStage.APPRENTICE_1;
    review.nextReviewAt = null;
    review.lastReviewedAt = null;
    review.lessonStartedAt = now;
    review.reviewCount = 0;
    review.correctCount = 0;
    review.wrongCount = 0;
  }

  persistState(state);
}

export async function getPendingLessons(
  limit = MAX_PENDING_LESSONS,
  userId = LOCAL_USER_ID
): Promise<LessonQueueItem[]> {
  const state = loadState();
  const user = ensureUser(state, userId);

  return state.reviewStatistics
    .filter((row) => row.userId === userId && !row.lessonCompleted)
    .map((row) => ({ row, subject: getSubjectById(state, row.subjectId) }))
    .filter(
      (entry): entry is { row: WebReviewStatistic; subject: SeedSubject } =>
        entry.subject !== null && entry.subject.level === user.currentLevel
    )
    .sort((a, b) => a.subject.level - b.subject.level || a.row.id - b.row.id)
    .slice(0, limit)
    .map(({ row, subject }) => buildLessonQueueItem(row, subject));
}

export async function completeLesson(
  subjectId: string,
  userId = LOCAL_USER_ID
): Promise<void> {
  const state = loadState();
  const now = Date.now();
  const review = state.reviewStatistics.find(
    (row) => row.userId === userId && row.subjectId === subjectId
  );

  if (!review) {
    throw new Error("Lesson not found.");
  }

  if (review.lessonCompleted) {
    return;
  }

  review.lessonCompleted = true;
  review.srsStage = SrsStage.APPRENTICE_1;
  review.nextReviewAt = now;
  review.lastReviewedAt = null;
  persistState(state);
}

export async function getPendingReviews(
  limit = MAX_PENDING_REVIEWS,
  userId = LOCAL_USER_ID
): Promise<ReviewQueueItem[]> {
  const state = loadState();
  const now = Date.now();

  return state.reviewStatistics
    .filter(
      (row) =>
        row.userId === userId &&
        row.lessonCompleted &&
        row.nextReviewAt !== null &&
        row.nextReviewAt <= now
    )
    .map((row) => ({ row, subject: getSubjectById(state, row.subjectId) }))
    .filter(
      (entry): entry is { row: WebReviewStatistic; subject: SeedSubject } =>
        entry.subject !== null
    )
    .sort((a, b) => (a.row.nextReviewAt ?? 0) - (b.row.nextReviewAt ?? 0) || a.row.id - b.row.id)
    .slice(0, limit)
    .map(({ row, subject }) => buildReviewQueueItem(row, subject));
}

export async function getDashboardStats(
  userId = LOCAL_USER_ID
): Promise<DashboardStats> {
  const state = loadState();
  const user = ensureUser(state, userId);
  const now = Date.now();

  const currentLevel = user.currentLevel;
  const userReviews = state.reviewStatistics.filter((row) => row.userId === userId);
  const lessonsForCurrentLevel = userReviews.filter((row) => {
    if (row.lessonCompleted) return false;
    const subject = getSubjectById(state, row.subjectId);
    return subject?.level === currentLevel;
  }).length;

  const pendingReviews = userReviews.filter(
    (row) => row.lessonCompleted && row.nextReviewAt !== null && row.nextReviewAt <= now
  ).length;

  const completedReviews = userReviews.filter((row) => row.lessonCompleted);

  return {
    currentLevel,
    pendingLessons: lessonsForCurrentLevel,
    pendingReviews,
    stageBreakdown: {
      apprentice: completedReviews.filter((row) => row.srsStage >= 0 && row.srsStage <= 3).length,
      guru: completedReviews.filter((row) => row.srsStage >= 4 && row.srsStage <= 5).length,
      master: completedReviews.filter((row) => row.srsStage === 6).length,
      enlightened: completedReviews.filter((row) => row.srsStage === 7).length,
    },
  };
}

export async function submitReviewAnswer(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const state = loadState();
  const userId = input.userId ?? LOCAL_USER_ID;
  const now = Date.now();

  const review = state.reviewStatistics.find(
    (row) =>
      row.id === input.reviewStatisticId &&
      row.userId === userId &&
      row.lessonCompleted
  );

  if (!review) {
    throw new Error("Review not found.");
  }

  const isDue = review.nextReviewAt !== null && review.nextReviewAt <= now;
  if (!isDue) {
    throw new Error("This review is not due yet.");
  }

  const subject = getSubjectById(state, review.subjectId);
  if (!subject) {
    throw new Error("Review subject not found.");
  }

  const nextState = calculateNextSrsState(review.srsStage, input.isCorrect, new Date(now));

  review.srsStage = nextState.newStage;
  review.nextReviewAt = nextState.nextReviewAt;
  review.lastReviewedAt = now;
  review.reviewCount += 1;
  review.correctCount += input.isCorrect ? 1 : 0;
  review.wrongCount += input.isCorrect ? 0 : 1;

  persistState(state);

  return {
    isCorrect: input.isCorrect,
    review: buildReviewQueueItem(review, subject),
  };
}

export function calculateNextSrsState(
  currentStage: number,
  isCorrect: boolean,
  now: Date = new Date()
): {
  newStage: number;
  newStageName: SrsStageName;
  nextReviewAt: number | null;
  nextReviewDate: Date | null;
} {
  if (currentStage < 0 || currentStage > SrsStage.BURNED) {
    throw new Error(`Invalid SRS stage: ${currentStage}`);
  }

  if (currentStage === SrsStage.BURNED) {
    return {
      newStage: SrsStage.BURNED,
      newStageName: SRS_STAGE_NAMES[SrsStage.BURNED],
      nextReviewAt: null,
      nextReviewDate: null,
    };
  }

  const newStage = isCorrect
    ? Math.min(currentStage + 1, SrsStage.BURNED)
    : Math.max(currentStage - 1, SrsStage.APPRENTICE_1);

  const intervalMs = STAGE_INTERVAL_MS[newStage];
  const nextReviewAt = intervalMs === null ? null : now.getTime() + intervalMs;

  return {
    newStage,
    newStageName: SRS_STAGE_NAMES[newStage],
    nextReviewAt,
    nextReviewDate: nextReviewAt === null ? null : new Date(nextReviewAt),
  };
}

function normalizeImportedSubject(subject: unknown, index: number): SeedSubject | null {
  if (!isRecord(subject)) {
    return null;
  }

  const source = isRecord(subject.data) ? subject.data : subject;
  const type = normalizeImportedSubjectType(subject.object ?? source.type);
  const level =
    typeof source.level === "number" && Number.isFinite(source.level)
      ? Math.trunc(source.level)
      : null;
  const meanings = normalizeMeaningArray(source.meanings, source.auxiliary_meanings);
  const readings = normalizeReadingArray(source.readings);
  const slug =
    normalizeString(source.slug) ??
    normalizeString(source.characters) ??
    meanings[0] ??
    `imported-subject-${index + 1}`;
  const id =
    normalizeIdentifier(subject.id ?? source.id) ??
    `imported-subject-${index + 1}`;

  if (!type || !level || level < 1 || !slug || meanings.length === 0) {
    return null;
  }

  return {
    id,
    type,
    level,
    slug,
    characters: normalizeNullableString(source.characters),
    meanings,
    readings,
    meaningMnemonic:
      normalizeNullableString(source.meaningMnemonic) ??
      normalizeNullableString(source.meaning_mnemonic),
    readingMnemonic:
      normalizeNullableString(source.readingMnemonic) ??
      normalizeNullableString(source.reading_mnemonic),
  };
}

function extractImportSubjects(jsonData: unknown): unknown[] {
  if (Array.isArray(jsonData)) {
    return jsonData;
  }

  if (isRecord(jsonData) && Array.isArray(jsonData.data)) {
    return jsonData.data;
  }

  return [];
}

function normalizeImportedSubjectType(value: unknown): SubjectType | null {
  if (typeof value !== "string") {
    return null;
  }

  switch (value.trim().toLowerCase()) {
    case "radical":
      return "RADICAL";
    case "kanji":
      return "KANJI";
    case "vocabulary":
    case "kana_vocabulary":
      return "VOCABULARY";
    default:
      return SUBJECT_TYPES.includes(value as SubjectType) ? (value as SubjectType) : null;
  }
}

function normalizeMeaningArray(meanings: unknown, auxiliaryMeanings?: unknown): string[] {
  const primaryMeanings = normalizeStructuredStringArray(
    meanings,
    "meaning",
    (item) => item.accepted_answer !== false
  );

  if (primaryMeanings.length > 0) {
    return dedupeStrings([
      ...primaryMeanings,
      ...normalizeStructuredStringArray(
        auxiliaryMeanings,
        "meaning",
        (item) => item.type === "whitelist"
      ),
    ]);
  }

  return dedupeStrings([
    ...normalizeStringArray(meanings),
    ...normalizeStructuredStringArray(meanings, "meaning"),
    ...normalizeStructuredStringArray(
      auxiliaryMeanings,
      "meaning",
      (item) => item.type === "whitelist"
    ),
  ]);
}

function normalizeReadingArray(readings: unknown): string[] {
  const acceptedReadings = normalizeStructuredStringArray(
    readings,
    "reading",
    (item) => item.accepted_answer !== false
  );

  if (acceptedReadings.length > 0) {
    return acceptedReadings;
  }

  return dedupeStrings([
    ...normalizeStringArray(readings),
    ...normalizeStructuredStringArray(readings, "reading"),
  ]);
}

function normalizeStructuredStringArray(
  value: unknown,
  key: "meaning" | "reading",
  predicate?: (item: Record<string, unknown>) => boolean
): string[] {
  if (!Array.isArray(value)) return [];

  return dedupeStrings(
    value
      .filter(isRecord)
      .filter((item) => (predicate ? predicate(item) : true))
      .map((item) => normalizeString(item[key]))
      .filter((item): item is string => item !== null)
  );
}

function normalizeIdentifier(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  return normalizeString(value);
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNullableString(value: unknown): string | null {
  return normalizeString(value);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
