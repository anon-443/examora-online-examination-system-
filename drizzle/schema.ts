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

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", ["assignment", "deadline", "cohort", "system"]).notNull().default("system"),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    actionHref: varchar("actionHref", { length: 255 }),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    index("notifications_user_read_idx").on(table.userId, table.readAt),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "notifications_user_fk" }).onDelete("cascade"),
  ],
);

export const notificationSchedules = mysqlTable(
  "notificationSchedules",
  {
    id: int("id").autoincrement().primaryKey(),
    scheduleKey: varchar("scheduleKey", { length: 64 }).notNull().unique(),
    taskUid: varchar("taskUid", { length: 65 }).notNull().unique(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    foreignKey({ columns: [table.createdBy], foreignColumns: [users.id], name: "notification_schedules_creator_fk" }).onDelete("restrict"),
  ],
);

export const cohorts = mysqlTable(
  "cohorts",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 140 }).notNull(),
    description: text("description"),
    inviteCode: varchar("inviteCode", { length: 32 }).notNull().unique(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("cohorts_creator_idx").on(table.createdBy),
    foreignKey({ columns: [table.createdBy], foreignColumns: [users.id], name: "cohorts_creator_fk" }).onDelete("restrict"),
  ],
);

export const cohortMemberships = mysqlTable(
  "cohortMemberships",
  {
    id: int("id").autoincrement().primaryKey(),
    cohortId: int("cohortId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["instructor", "learner"]).notNull().default("learner"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("cohort_membership_uq").on(table.cohortId, table.userId),
    index("cohort_memberships_user_idx").on(table.userId),
    foreignKey({ columns: [table.cohortId], foreignColumns: [cohorts.id], name: "cohort_memberships_cohort_fk" }).onDelete("cascade"),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "cohort_memberships_user_fk" }).onDelete("cascade"),
  ],
);

export const assignments = mysqlTable(
  "assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    cohortId: int("cohortId").notNull(),
    examId: int("examId").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    instructions: text("instructions"),
    scheduledAt: timestamp("scheduledAt").notNull(),
    dueAt: timestamp("dueAt"),
    status: mysqlEnum("status", ["scheduled", "published", "archived"]).notNull().default("scheduled"),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("assignments_cohort_schedule_idx").on(table.cohortId, table.scheduledAt),
    index("assignments_exam_idx").on(table.examId),
    foreignKey({ columns: [table.cohortId], foreignColumns: [cohorts.id], name: "assignments_cohort_fk" }).onDelete("cascade"),
    foreignKey({ columns: [table.examId], foreignColumns: [exams.id], name: "assignments_exam_fk" }).onDelete("restrict"),
    foreignKey({ columns: [table.createdBy], foreignColumns: [users.id], name: "assignments_creator_fk" }).onDelete("restrict"),
  ],
);

export const notificationDispatches = mysqlTable(
  "notificationDispatches",
  {
    id: int("id").autoincrement().primaryKey(),
    assignmentId: int("assignmentId").notNull(),
    userId: int("userId").notNull(),
    kind: mysqlEnum("kind", ["deadline_soon"]).notNull().default("deadline_soon"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("notification_dispatch_uq").on(table.assignmentId, table.userId, table.kind),
    foreignKey({ columns: [table.assignmentId], foreignColumns: [assignments.id], name: "notification_dispatches_assignment_fk" }).onDelete("cascade"),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "notification_dispatches_user_fk" }).onDelete("cascade"),
  ],
);

export const examAttempts = mysqlTable(
  "examAttempts",
  {
    id: int("id").autoincrement().primaryKey(),
    examId: int("examId").notNull(),
    userId: int("userId").notNull(),
    assignmentId: int("assignmentId"),
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
    foreignKey({ columns: [table.assignmentId], foreignColumns: [assignments.id], name: "attempts_assignment_fk" }).onDelete("set null"),
  ],
);

export const assignmentAttempts = mysqlTable(
  "assignmentAttempts",
  {
    id: int("id").autoincrement().primaryKey(),
    assignmentId: int("assignmentId").notNull(),
    attemptId: int("attemptId").notNull(),
    userId: int("userId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("assignment_attempt_uq").on(table.assignmentId, table.userId),
    uniqueIndex("assignment_attempt_attempt_uq").on(table.attemptId),
    index("assignment_attempts_user_idx").on(table.userId),
    foreignKey({ columns: [table.assignmentId], foreignColumns: [assignments.id], name: "assignment_attempts_assignment_fk" }).onDelete("cascade"),
    foreignKey({ columns: [table.attemptId], foreignColumns: [examAttempts.id], name: "assignment_attempts_attempt_fk" }).onDelete("cascade"),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "assignment_attempts_user_fk" }).onDelete("cascade"),
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
export type Cohort = typeof cohorts.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
