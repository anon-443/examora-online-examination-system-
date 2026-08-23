import {
  boolean,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const exams = mysqlTable(
  "exams",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 180 }).notNull(),
    subject: varchar("subject", { length: 96 }).notNull(),
    description: text("description").notNull(),
    durationMinutes: int("durationMinutes").notNull(),
    difficulty: mysqlEnum("difficulty", ["Beginner", "Intermediate", "Advanced"])
      .notNull()
      .default("Intermediate"),
    status: mysqlEnum("status", ["draft", "published"]).notNull().default("draft"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("exams_status_idx").on(table.status),
    index("exams_subject_idx").on(table.subject),
    foreignKey({ columns: [table.createdBy], foreignColumns: [users.id], name: "exams_created_by_users_fk" }).onDelete("restrict"),
  ],
);

export const questions = mysqlTable(
  "questions",
  {
    id: int("id").autoincrement().primaryKey(),
    examId: int("examId").notNull(),
    prompt: text("prompt").notNull(),
    optionA: text("optionA").notNull(),
    optionB: text("optionB").notNull(),
    optionC: text("optionC").notNull(),
    optionD: text("optionD").notNull(),
    correctOption: int("correctOption").notNull(),
    explanation: text("explanation").notNull(),
    position: int("position").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("questions_exam_idx").on(table.examId),
    uniqueIndex("questions_exam_position_uq").on(table.examId, table.position),
    foreignKey({ columns: [table.examId], foreignColumns: [exams.id], name: "questions_exam_fk" }).onDelete("cascade"),
  ],
);

export const examAttempts = mysqlTable(
  "examAttempts",
  {
    id: int("id").autoincrement().primaryKey(),
    examId: int("examId").notNull(),
    userId: int("userId").notNull(),
    status: mysqlEnum("status", ["in_progress", "submitted"]).notNull().default("in_progress"),
    totalQuestions: int("totalQuestions").notNull(),
    score: int("score").notNull().default(0),
    incorrectAnswers: int("incorrectAnswers").notNull().default(0),
    percentage: int("percentage").notNull().default(0),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    submittedAt: timestamp("submittedAt"),
  },
  table => [
    index("attempts_user_idx").on(table.userId),
    index("attempts_exam_idx").on(table.examId),
    index("attempts_status_idx").on(table.status),
    foreignKey({ columns: [table.examId], foreignColumns: [exams.id], name: "attempts_exam_fk" }).onDelete("restrict"),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "attempts_user_fk" }).onDelete("restrict"),
  ],
);

export const attemptAnswers = mysqlTable(
  "attemptAnswers",
  {
    id: int("id").autoincrement().primaryKey(),
    attemptId: int("attemptId").notNull(),
    questionId: int("questionId").notNull(),
    selectedOption: int("selectedOption"),
    isCorrect: boolean("isCorrect").notNull().default(false),
    questionPromptSnapshot: text("questionPromptSnapshot"),
    optionASnapshot: text("optionASnapshot"),
    optionBSnapshot: text("optionBSnapshot"),
    optionCSnapshot: text("optionCSnapshot"),
    optionDSnapshot: text("optionDSnapshot"),
    correctOptionSnapshot: int("correctOptionSnapshot"),
    explanationSnapshot: text("explanationSnapshot"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("attempt_answers_attempt_idx").on(table.attemptId),
    uniqueIndex("attempt_answers_attempt_question_uq").on(table.attemptId, table.questionId),
    foreignKey({ columns: [table.attemptId], foreignColumns: [examAttempts.id], name: "attempt_answers_attempt_fk" }).onDelete("cascade"),
    foreignKey({ columns: [table.questionId], foreignColumns: [questions.id], name: "attempt_answers_question_fk" }).onDelete("restrict"),
  ],
);

export const examFeedback = mysqlTable(
  "examFeedback",
  {
    id: int("id").autoincrement().primaryKey(),
    attemptId: int("attemptId").notNull(),
    userId: int("userId").notNull(),
    difficultyRating: int("difficultyRating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("exam_feedback_attempt_uq").on(table.attemptId),
    index("exam_feedback_user_idx").on(table.userId),
    foreignKey({ columns: [table.attemptId], foreignColumns: [examAttempts.id], name: "exam_feedback_attempt_fk" }).onDelete("cascade"),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "exam_feedback_user_fk" }).onDelete("restrict"),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Exam = typeof exams.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type ExamAttempt = typeof examAttempts.$inferSelect;
