import * as SQLite from "expo-sqlite";

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

type Queryable = Pick<
  SQLite.SQLiteDatabase,
  "getAllAsync" | "getFirstAsync" | "runAsync"
>;

type SubjectDetailsRow = {
  subject_id: string;
  subject_type: SubjectType;
  subject_level: number;
  subject_slug: string;
  subject_characters: string | null;
  subject_meanings_json: string;
  subject_readings_json: string;
  subject_meaning_mnemonic: string | null;
  subject_reading_mnemonic: string | null;
};

type LessonRow = SubjectDetailsRow & {
  review_statistic_id: number;
  user_id: string;
  lesson_started_at: number;
};

type ReviewRow = SubjectDetailsRow & {
  review_statistic_id: number;
  user_id: string;
  subject_id: string;
  srs_stage: number;
  next_review_at: number | null;
  last_reviewed_at: number | null;
  lesson_started_at: number;
  review_count: number;
  correct_count: number;
  wrong_count: number;
};

type SubjectIdRow = {
  id: string;
};

type UserLevelRow = {
  current_level: number;
};

type PendingCountRow = {
  count: number;
};

type StageBreakdownRow = {
  apprentice: number;
  guru: number;
  master: number;
  enlightened: number;
};

type TableInfoRow = {
  name: string;
};

const SAMPLE_LEVEL_ONE_SUBJECTS: SeedSubject[] = [
  {
    id: "l1-radical-ground",
    type: "RADICAL",
    level: 1,
    slug: "ground",
    characters: "?",
    meanings: ["ground"],
    readings: [],
    meaningMnemonic: "Imagine the horizon as a flat line across the ground.",
    readingMnemonic: null,
  },
  {
    id: "l1-kanji-one",
    type: "KANJI",
    level: 1,
    slug: "one",
    characters: "?",
    meanings: ["one"],
    readings: ["??"],
    meaningMnemonic:
      "A single horizontal stroke is the simplest way to picture one thing.",
    readingMnemonic: "This kanji often uses the onyomi reading ??.",
  },
  {
    id: "l1-vocab-hitotsu",
    type: "VOCABULARY",
    level: 1,
    slug: "hitotsu",
    characters: "??",
    meanings: ["one thing", "one"],
    readings: ["???"],
    meaningMnemonic: "When counting one general thing, ?? means one thing.",
    readingMnemonic: "This vocabulary uses the native Japanese reading ???.",
  },
];

export const MOCK_LEVEL_ONE_TO_FIVE_SUBJECTS: SeedSubject[] = [
  {
    id: "l1-radical-stick",
    type: "RADICAL",
    level: 1,
    slug: "stick",
    characters: "?",
    meanings: ["stick"],
    readings: [],
    meaningMnemonic: "A single vertical stroke looks just like a stick.",
    readingMnemonic: null,
  },
  {
    id: "l1-kanji-two",
    type: "KANJI",
    level: 1,
    slug: "two",
    characters: "?",
    meanings: ["two"],
    readings: ["?"],
    meaningMnemonic: "Two horizontal lines make it easy to picture two things.",
    readingMnemonic: "The onyomi reading is ?.",
  },
  {
    id: "l2-radical-mouth",
    type: "RADICAL",
    level: 2,
    slug: "mouth-radical",
    characters: "?",
    meanings: ["mouth"],
    readings: [],
    meaningMnemonic: "This square radical is the shape of an open mouth.",
    readingMnemonic: null,
  },
  {
    id: "l2-kanji-mouth",
    type: "KANJI",
    level: 2,
    slug: "mouth",
    characters: "?",
    meanings: ["mouth"],
    readings: ["??"],
    meaningMnemonic: "A mouth is drawn like a box opening on your face.",
    readingMnemonic: "The onyomi reading for this kanji is ??.",
  },
  {
    id: "l3-kanji-tree",
    type: "KANJI",
    level: 3,
    slug: "tree",
    characters: "?",
    meanings: ["tree"],
    readings: ["?", "??"],
    meaningMnemonic:
      "Branches spread from a trunk, giving this kanji a tree shape.",
    readingMnemonic: "Common readings are ? and the onyomi ??.",
  },
  {
    id: "l3-vocab-yama",
    type: "VOCABULARY",
    level: 3,
    slug: "yama",
    characters: "?",
    meanings: ["mountain"],
    readings: ["??"],
    meaningMnemonic: "This vocabulary word names a mountain.",
    readingMnemonic: "Use the native reading ??.",
  },
  {
    id: "l4-kanji-fire",
    type: "KANJI",
    level: 4,
    slug: "fire",
    characters: "?",
    meanings: ["fire"],
    readings: ["?"],
    meaningMnemonic: "Flames spread outward from the center in this fiery shape.",
    readingMnemonic: "The onyomi reading is ?.",
  },
  {
    id: "l4-vocab-water",
    type: "VOCABULARY",
    level: 4,
    slug: "mizu",
    characters: "?",
    meanings: ["water"],
    readings: ["??"],
    meaningMnemonic: "This vocabulary word means water.",
    readingMnemonic: "Use the reading ??.",
  },
  {
    id: "l5-kanji-gold",
    type: "KANJI",
    level: 5,
    slug: "gold",
    characters: "?",
    meanings: ["gold", "money"],
    readings: ["??"],
    meaningMnemonic: "This kanji represents shiny metal or gold.",
    readingMnemonic: "The common onyomi reading is ??.",
  },
  {
    id: "l5-vocab-nihon",
    type: "VOCABULARY",
    level: 5,
    slug: "nihon",
    characters: "??",
    meanings: ["japan"],
    readings: ["???"],
    meaningMnemonic: "This vocabulary word names Japan.",
    readingMnemonic: "This vocabulary is commonly read ???.",
  },
];

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

export const CREATE_USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    current_level INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (CAST(unixepoch('now') * 1000 AS INTEGER)),
    updated_at INTEGER NOT NULL DEFAULT (CAST(unixepoch('now') * 1000 AS INTEGER))
  );
`;

export const CREATE_SUBJECTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('RADICAL', 'KANJI', 'VOCABULARY')),
    level INTEGER NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    characters TEXT,
    meanings_json TEXT NOT NULL,
    readings_json TEXT NOT NULL DEFAULT '[]',
    meaning_mnemonic TEXT,
    reading_mnemonic TEXT,
    created_at INTEGER NOT NULL DEFAULT (CAST(unixepoch('now') * 1000 AS INTEGER)),
    updated_at INTEGER NOT NULL DEFAULT (CAST(unixepoch('now') * 1000 AS INTEGER))
  );
`;

export const CREATE_REVIEW_STATISTICS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS review_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    lesson_completed INTEGER NOT NULL DEFAULT 0 CHECK (lesson_completed IN (0, 1)),
    srs_stage INTEGER NOT NULL DEFAULT 0 CHECK (srs_stage BETWEEN 0 AND 8),
    next_review_at INTEGER,
    last_reviewed_at INTEGER,
    lesson_started_at INTEGER NOT NULL,
    review_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (CAST(unixepoch('now') * 1000 AS INTEGER)),
    updated_at INTEGER NOT NULL DEFAULT (CAST(unixepoch('now') * 1000 AS INTEGER)),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE (user_id, subject_id)
  );
`;

export const CREATE_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_subjects_type_level
    ON subjects(type, level);

  CREATE INDEX IF NOT EXISTS idx_review_statistics_user_next_review
    ON review_statistics(user_id, next_review_at);

  CREATE INDEX IF NOT EXISTS idx_review_statistics_user_srs_stage
    ON review_statistics(user_id, srs_stage);

  CREATE INDEX IF NOT EXISTS idx_review_statistics_user_lesson_completed
    ON review_statistics(user_id, lesson_completed);
`;

const SUBJECT_SELECT_COLUMNS = `
  s.id AS subject_id,
  s.type AS subject_type,
  s.level AS subject_level,
  s.slug AS subject_slug,
  s.characters AS subject_characters,
  s.meanings_json AS subject_meanings_json,
  s.readings_json AS subject_readings_json,
  s.meaning_mnemonic AS subject_meaning_mnemonic,
  s.reading_mnemonic AS subject_reading_mnemonic
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await initializeDatabase(db);
      return db;
    })();
  }

  return dbPromise;
}

export async function initializeDatabase(db?: SQLite.SQLiteDatabase) {
  const database = db ?? (await SQLite.openDatabaseAsync(DATABASE_NAME));

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    ${CREATE_USERS_TABLE_SQL}
    ${CREATE_SUBJECTS_TABLE_SQL}
    ${CREATE_REVIEW_STATISTICS_TABLE_SQL}
  `);

  await ensureReviewStatisticsLessonCompletedColumn(database);
  await database.execAsync(CREATE_INDEXES_SQL);

  const now = Date.now();

  await database.runAsync(
    `
      INSERT OR IGNORE INTO users (
        id, email, username, current_level, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    LOCAL_USER_ID,
    "local@device",
    "local",
    1,
    now,
    now
  );

  await seedSubjects(database);
  await seedInitialReviewStats(database);

  return database;
}

async function ensureReviewStatisticsLessonCompletedColumn(
  db: SQLite.SQLiteDatabase
) {
  const columns = await db.getAllAsync<TableInfoRow>(
    "PRAGMA table_info(review_statistics)"
  );

  const hasLessonCompletedColumn = columns.some(
    (column) => column.name === "lesson_completed"
  );

  if (!hasLessonCompletedColumn) {
    await db.execAsync(`
      ALTER TABLE review_statistics
      ADD COLUMN lesson_completed INTEGER NOT NULL DEFAULT 1
      CHECK (lesson_completed IN (0, 1));
    `);
  }
}

export async function seedSubjects(db?: SQLite.SQLiteDatabase) {
  const database = db ?? (await getDb());
  const now = Date.now();

  for (const subject of SAMPLE_LEVEL_ONE_SUBJECTS) {
    await database.runAsync(
      `
        INSERT OR IGNORE INTO subjects (
          id,
          type,
          level,
          slug,
          characters,
          meanings_json,
          readings_json,
          meaning_mnemonic,
          reading_mnemonic,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        subject.id,
        subject.type,
        subject.level,
        subject.slug,
        subject.characters,
        JSON.stringify(subject.meanings),
        JSON.stringify(subject.readings),
        subject.meaningMnemonic,
        subject.readingMnemonic,
        now,
        now,
      ]
    );
  }
}

export async function seedInitialReviewStats(db?: SQLite.SQLiteDatabase) {
  const database = db ?? (await getDb());
  const now = Date.now();

  const subjects = await database.getAllAsync<SubjectIdRow>(
    `SELECT id FROM subjects ORDER BY level ASC, id ASC`
  );

  for (const subject of subjects) {
    await database.runAsync(
      `
        INSERT OR IGNORE INTO review_statistics (
          user_id,
          subject_id,
          lesson_completed,
          srs_stage,
          next_review_at,
          last_reviewed_at,
          lesson_started_at,
          review_count,
          correct_count,
          wrong_count,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        LOCAL_USER_ID,
        subject.id,
        0,
        SrsStage.APPRENTICE_1,
        null,
        null,
        now,
        0,
        0,
        0,
        now,
        now,
      ]
    );
  }
}

export async function importSubjectsFromJson(
  jsonData: unknown,
  userId = LOCAL_USER_ID
): Promise<ImportSubjectsResult> {
  const db = await getDb();
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

  const now = Date.now();
  let insertedSubjects = 0;
  let seededReviews = 0;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `
        INSERT OR IGNORE INTO users (
          id,
          email,
          username,
          current_level,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [userId, `${userId}@device`, userId, 1, now, now]
    );

    for (const subject of normalizedSubjects) {
      const subjectResult = await db.runAsync(
        `
          INSERT OR IGNORE INTO subjects (
            id,
            type,
            level,
            slug,
            characters,
            meanings_json,
            readings_json,
            meaning_mnemonic,
            reading_mnemonic,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          subject.id,
          subject.type,
          subject.level,
          subject.slug,
          subject.characters,
          JSON.stringify(subject.meanings),
          JSON.stringify(subject.readings),
          subject.meaningMnemonic,
          subject.readingMnemonic,
          now,
          now,
        ]
      );
      insertedSubjects += subjectResult.changes;

      const subjectExists = await db.getFirstAsync<SubjectIdRow>(
        `SELECT id FROM subjects WHERE id = ? LIMIT 1`,
        [subject.id]
      );

      if (!subjectExists) {
        continue;
      }

      const reviewResult = await db.runAsync(
        `
          INSERT OR IGNORE INTO review_statistics (
            user_id,
            subject_id,
            lesson_completed,
            srs_stage,
            next_review_at,
            last_reviewed_at,
            lesson_started_at,
            review_count,
            correct_count,
            wrong_count,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          subject.id,
          0,
          SrsStage.APPRENTICE_1,
          null,
          null,
          now,
          0,
          0,
          0,
          now,
          now,
        ]
      );
      seededReviews += reviewResult.changes;
    }
  });

  return {
    insertedSubjects,
    skippedSubjects: importItems.length - insertedSubjects,
    seededReviews,
    totalProcessed: importItems.length,
  };
}

export async function resetSampleProgress(userId = LOCAL_USER_ID) {
  const db = await getDb();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `
        UPDATE review_statistics
        SET lesson_completed = 0,
            srs_stage = ?,
            next_review_at = NULL,
            last_reviewed_at = NULL,
            review_count = 0,
            correct_count = 0,
            wrong_count = 0,
            lesson_started_at = ?,
            updated_at = ?
        WHERE user_id = ?
      `,
      [SrsStage.APPRENTICE_1, now, now, userId]
    );
  });
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

export async function getPendingLessons(
  limit = MAX_PENDING_LESSONS,
  userId = LOCAL_USER_ID
): Promise<LessonQueueItem[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<LessonRow>(
    `
      SELECT
        rs.id AS review_statistic_id,
        rs.user_id,
        rs.lesson_started_at,
        ${SUBJECT_SELECT_COLUMNS}
      FROM review_statistics rs
      INNER JOIN subjects s ON s.id = rs.subject_id
      INNER JOIN users u ON u.id = rs.user_id
      WHERE rs.user_id = ?
        AND rs.lesson_completed = 0
        AND s.level = u.current_level
      ORDER BY s.level ASC, rs.id ASC
      LIMIT ?
    `,
    [userId, limit]
  );

  return rows.map(hydrateLessonRow);
}

export async function completeLesson(
  subjectId: string,
  userId = LOCAL_USER_ID
): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  const lessonRow = await db.getFirstAsync<{ id: number; lesson_completed: number }>(
    `
      SELECT id, lesson_completed
      FROM review_statistics
      WHERE user_id = ? AND subject_id = ?
      LIMIT 1
    `,
    [userId, subjectId]
  );

  if (!lessonRow) {
    throw new Error("Lesson not found.");
  }

  if (lessonRow.lesson_completed === 1) {
    return;
  }

  await db.runAsync(
    `
      UPDATE review_statistics
      SET lesson_completed = 1,
          srs_stage = ?,
          next_review_at = ?,
          last_reviewed_at = NULL,
          updated_at = ?
      WHERE user_id = ? AND subject_id = ?
    `,
    [SrsStage.APPRENTICE_1, now, now, userId, subjectId]
  );
}

export async function getPendingReviews(
  limit = MAX_PENDING_REVIEWS,
  userId = LOCAL_USER_ID
): Promise<ReviewQueueItem[]> {
  const db = await getDb();
  const now = Date.now();

  const rows = await db.getAllAsync<ReviewRow>(
    `
      SELECT
        rs.id AS review_statistic_id,
        rs.user_id,
        rs.subject_id,
        rs.srs_stage,
        rs.next_review_at,
        rs.last_reviewed_at,
        rs.lesson_started_at,
        rs.review_count,
        rs.correct_count,
        rs.wrong_count,
        ${SUBJECT_SELECT_COLUMNS}
      FROM review_statistics rs
      INNER JOIN subjects s ON s.id = rs.subject_id
      WHERE rs.user_id = ?
        AND rs.lesson_completed = 1
        AND rs.next_review_at IS NOT NULL
        AND rs.next_review_at <= ?
      ORDER BY rs.next_review_at ASC, rs.id ASC
      LIMIT ?
    `,
    [userId, now, limit]
  );

  return rows.map(hydrateReviewRow);
}

export async function getDashboardStats(
  userId = LOCAL_USER_ID
): Promise<DashboardStats> {
  const db = await getDb();
  const now = Date.now();

  const userRow = await db.getFirstAsync<UserLevelRow>(
    `SELECT current_level FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  const currentLevel = userRow?.current_level ?? 1;

  const lessonRow = await db.getFirstAsync<PendingCountRow>(
    `
      SELECT COUNT(*) AS count
      FROM review_statistics rs
      INNER JOIN subjects s ON s.id = rs.subject_id
      WHERE rs.user_id = ?
        AND rs.lesson_completed = 0
        AND s.level = ?
    `,
    [userId, currentLevel]
  );

  const pendingRow = await db.getFirstAsync<PendingCountRow>(
    `
      SELECT COUNT(*) AS count
      FROM review_statistics
      WHERE user_id = ?
        AND lesson_completed = 1
        AND next_review_at IS NOT NULL
        AND next_review_at <= ?
    `,
    [userId, now]
  );

  const stageRow = await db.getFirstAsync<StageBreakdownRow>(
    `
      SELECT
        SUM(CASE WHEN srs_stage BETWEEN 0 AND 3 THEN 1 ELSE 0 END) AS apprentice,
        SUM(CASE WHEN srs_stage BETWEEN 4 AND 5 THEN 1 ELSE 0 END) AS guru,
        SUM(CASE WHEN srs_stage = 6 THEN 1 ELSE 0 END) AS master,
        SUM(CASE WHEN srs_stage = 7 THEN 1 ELSE 0 END) AS enlightened
      FROM review_statistics
      WHERE user_id = ?
        AND lesson_completed = 1
    `,
    [userId]
  );

  return {
    currentLevel,
    pendingLessons: lessonRow?.count ?? 0,
    pendingReviews: pendingRow?.count ?? 0,
    stageBreakdown: {
      apprentice: stageRow?.apprentice ?? 0,
      guru: stageRow?.guru ?? 0,
      master: stageRow?.master ?? 0,
      enlightened: stageRow?.enlightened ?? 0,
    },
  };
}

export async function submitReviewAnswer(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const db = await getDb();
  const userId = input.userId ?? LOCAL_USER_ID;
  const now = Date.now();

  let result: SubmitReviewResult | null = null;

  await db.withTransactionAsync(async () => {
    const review = await getReviewById(db, input.reviewStatisticId, userId);

    if (!review) {
      throw new Error("Review not found.");
    }

    const isDue = review.nextReviewAt !== null && review.nextReviewAt <= now;

    if (!isDue) {
      throw new Error("This review is not due yet.");
    }

    const nextState = calculateNextSrsState(
      review.srsStage,
      input.isCorrect,
      new Date(now)
    );

    await db.runAsync(
      `
        UPDATE review_statistics
        SET srs_stage = ?,
            next_review_at = ?,
            last_reviewed_at = ?,
            review_count = review_count + 1,
            correct_count = correct_count + ?,
            wrong_count = wrong_count + ?,
            updated_at = ?
        WHERE id = ?
          AND user_id = ?
          AND lesson_completed = 1
      `,
      [
        nextState.newStage,
        nextState.nextReviewAt,
        now,
        input.isCorrect ? 1 : 0,
        input.isCorrect ? 0 : 1,
        now,
        input.reviewStatisticId,
        userId,
      ]
    );

    const updatedReview = await getReviewById(db, input.reviewStatisticId, userId);

    if (!updatedReview) {
      throw new Error("Failed to reload updated review.");
    }

    result = {
      isCorrect: input.isCorrect,
      review: updatedReview,
    };
  });

  if (!result) {
    throw new Error("Review submission failed.");
  }

  return result;
}

async function getReviewById(
  db: Queryable,
  reviewStatisticId: number,
  userId: string
): Promise<ReviewQueueItem | null> {
  const row = await db.getFirstAsync<ReviewRow>(
    `
      SELECT
        rs.id AS review_statistic_id,
        rs.user_id,
        rs.subject_id,
        rs.srs_stage,
        rs.next_review_at,
        rs.last_reviewed_at,
        rs.lesson_started_at,
        rs.review_count,
        rs.correct_count,
        rs.wrong_count,
        ${SUBJECT_SELECT_COLUMNS}
      FROM review_statistics rs
      INNER JOIN subjects s ON s.id = rs.subject_id
      WHERE rs.id = ?
        AND rs.user_id = ?
        AND rs.lesson_completed = 1
      LIMIT 1
    `,
    [reviewStatisticId, userId]
  );

  return row ? hydrateReviewRow(row) : null;
}

function hydrateLessonRow(row: LessonRow): LessonQueueItem {
  return {
    reviewStatisticId: row.review_statistic_id,
    userId: row.user_id,
    subjectId: row.subject_id,
    lessonStartedAt: row.lesson_started_at,
    subject: hydrateSubject(row),
  };
}

function hydrateReviewRow(row: ReviewRow): ReviewQueueItem {
  return {
    reviewStatisticId: row.review_statistic_id,
    userId: row.user_id,
    subjectId: row.subject_id,
    srsStage: row.srs_stage,
    srsStageName: SRS_STAGE_NAMES[row.srs_stage],
    nextReviewAt: row.next_review_at,
    lastReviewedAt: row.last_reviewed_at,
    lessonStartedAt: row.lesson_started_at,
    reviewCount: row.review_count,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    subject: hydrateSubject(row),
  };
}

function hydrateSubject(row: SubjectDetailsRow): Subject {
  return {
    id: row.subject_id,
    type: row.subject_type,
    level: row.subject_level,
    slug: row.subject_slug,
    characters: row.subject_characters,
    meanings: parseJsonArray(row.subject_meanings_json),
    readings: parseJsonArray(row.subject_readings_json),
    meaningMnemonic: row.subject_meaning_mnemonic,
    readingMnemonic: row.subject_reading_mnemonic,
  };
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function normalizeImportedSubject(
  subject: any,
  index: number
): SeedSubject | null {
  if (!isRecord(subject)) {
    return null;
  }

  const source = isRecord(subject.data) ? subject.data : subject;
  const type = normalizeImportedSubjectType(subject.object ?? source.type);
  const level =
    typeof source.level === "number" && Number.isFinite(source.level)
      ? Math.trunc(source.level)
      : null;
  const meanings = normalizeMeaningArray(
    source.meanings,
    source.auxiliary_meanings
  );
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

function extractImportSubjects(jsonData: unknown): any[] {
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
      return SUBJECT_TYPES.includes(value as SubjectType)
        ? (value as SubjectType)
        : null;
  }
}

function normalizeMeaningArray(
  meanings: unknown,
  auxiliaryMeanings?: unknown
): string[] {
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
