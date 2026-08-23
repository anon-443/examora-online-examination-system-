import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  attemptAnswers,
  exams,
  type InsertUser,
  examAttempts,
  questions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listPublishedExams() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: exams.id,
      title: exams.title,
      subject: exams.subject,
      description: exams.description,
      durationMinutes: exams.durationMinutes,
      difficulty: exams.difficulty,
      questionCount: sql<number>`count(${questions.id})`,
    })
    .from(exams)
    .leftJoin(questions, eq(questions.examId, exams.id))
    .where(eq(exams.status, "published"))
    .groupBy(exams.id)
    .orderBy(desc(exams.createdAt));
}

export async function listAdminExams() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: exams.id,
      title: exams.title,
      subject: exams.subject,
      durationMinutes: exams.durationMinutes,
      difficulty: exams.difficulty,
      status: exams.status,
      questionCount: sql<number>`count(${questions.id})`,
      attemptCount: sql<number>`count(distinct ${examAttempts.id})`,
      updatedAt: exams.updatedAt,
    })
    .from(exams)
    .leftJoin(questions, eq(questions.examId, exams.id))
    .leftJoin(examAttempts, eq(examAttempts.examId, exams.id))
    .groupBy(exams.id)
    .orderBy(desc(exams.updatedAt));
}

export async function getExamWithQuestions(examId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
  if (!exam) return undefined;
  const examQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, examId))
    .orderBy(asc(questions.position));
  return { exam, questions: examQuestions };
}

export async function createExam(input: {
  title: string;
  subject: string;
  description: string;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  status: "draft" | "published";
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const created = await db.insert(exams).values(input).$returningId();
  return created[0]?.id;
}

export async function updateExam(
  examId: number,
  input: Partial<{
    title: string;
    subject: string;
    description: string;
    durationMinutes: number;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    status: "draft" | "published";
  }>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(exams).set(input).where(eq(exams.id, examId));
}

export async function deleteExam(examId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [attemptTotal] = await db.select({ value: count() }).from(examAttempts).where(eq(examAttempts.examId, examId));
  if ((attemptTotal?.value ?? 0) > 0) {
    throw new Error("Assessments with learner attempts are retained to protect result history.");
  }
  await db.delete(exams).where(eq(exams.id, examId));
}

export async function createQuestion(input: {
  examId: number;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: number;
  explanation: string;
  position: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(questions).values(input);
}

export async function deleteQuestion(questionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [answerTotal] = await db.select({ value: count() }).from(attemptAnswers).where(eq(attemptAnswers.questionId, questionId));
  if ((answerTotal?.value ?? 0) > 0) {
    throw new Error("Questions with recorded learner answers are retained to protect assessment history.");
  }
  await db.delete(questions).where(eq(questions.id, questionId));
}

export async function updateQuestion(
  questionId: number,
  input: Partial<{
    prompt: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: number;
    explanation: string;
    position: number;
  }>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(questions).set(input).where(eq(questions.id, questionId));
}

export async function createAttempt(examId: number, userId: number, totalQuestions: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const created = await db
    .insert(examAttempts)
    .values({ examId, userId, totalQuestions, status: "in_progress" })
    .$returningId();
  return created[0]?.id;
}

export async function getOwnedAttempt(attemptId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.userId, userId)))
    .limit(1);
  return result[0];
}

export async function upsertAttemptAnswer(input: {
  attemptId: number;
  questionId: number;
  selectedOption: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .insert(attemptAnswers)
    .values({ ...input, isCorrect: false })
    .onDuplicateKeyUpdate({ set: { selectedOption: input.selectedOption, updatedAt: new Date() } });
}

export async function getAttemptAnswers(attemptId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId));
}

export async function finalizeAttemptAnswers(
  attemptId: number,
  sourceQuestions: Array<{
    id: number;
    prompt: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: number;
    explanation: string;
  }>,
  selectedAnswers: Map<number, number>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  for (const question of sourceQuestions) {
    const selectedOption = selectedAnswers.get(question.id) ?? null;
    const isCorrect = selectedOption === question.correctOption;
    const snapshot = {
      selectedOption,
      isCorrect,
      questionPromptSnapshot: question.prompt,
      optionASnapshot: question.optionA,
      optionBSnapshot: question.optionB,
      optionCSnapshot: question.optionC,
      optionDSnapshot: question.optionD,
      correctOptionSnapshot: question.correctOption,
      explanationSnapshot: question.explanation,
    };
    await db
      .insert(attemptAnswers)
      .values({ attemptId, questionId: question.id, ...snapshot })
      .onDuplicateKeyUpdate({ set: { ...snapshot, updatedAt: new Date() } });
  }
}

export async function submitAttempt(input: {
  attemptId: number;
  score: number;
  incorrectAnswers: number;
  percentage: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(examAttempts)
    .set({
      score: input.score,
      incorrectAnswers: input.incorrectAnswers,
      percentage: input.percentage,
      status: "submitted",
      submittedAt: new Date(),
    })
    .where(eq(examAttempts.id, input.attemptId));
}

export async function getAttemptResult(attemptId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [attempt] = await db
    .select({
      id: examAttempts.id,
      status: examAttempts.status,
      totalQuestions: examAttempts.totalQuestions,
      score: examAttempts.score,
      incorrectAnswers: examAttempts.incorrectAnswers,
      percentage: examAttempts.percentage,
      submittedAt: examAttempts.submittedAt,
      examTitle: exams.title,
      subject: exams.subject,
    })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.userId, userId)))
    .limit(1);
  return attempt;
}

export async function getAttemptReview(attemptId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      questionId: attemptAnswers.questionId,
      selectedOption: attemptAnswers.selectedOption,
      isCorrect: attemptAnswers.isCorrect,
      prompt: attemptAnswers.questionPromptSnapshot,
      optionA: attemptAnswers.optionASnapshot,
      optionB: attemptAnswers.optionBSnapshot,
      optionC: attemptAnswers.optionCSnapshot,
      optionD: attemptAnswers.optionDSnapshot,
      correctOption: attemptAnswers.correctOptionSnapshot,
      explanation: attemptAnswers.explanationSnapshot,
    })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attemptId))
    .orderBy(asc(attemptAnswers.questionId));
}

export async function listAttemptHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: examAttempts.id,
      examTitle: exams.title,
      subject: exams.subject,
      status: examAttempts.status,
      score: examAttempts.score,
      totalQuestions: examAttempts.totalQuestions,
      percentage: examAttempts.percentage,
      submittedAt: examAttempts.submittedAt,
    })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(eq(examAttempts.userId, userId))
    .orderBy(desc(examAttempts.startedAt));
}

export async function getLeaderboardRows() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      userId: users.id,
      name: users.name,
      score: examAttempts.score,
      percentage: examAttempts.percentage,
      submittedAt: examAttempts.submittedAt,
      subject: exams.subject,
    })
    .from(examAttempts)
    .innerJoin(users, eq(examAttempts.userId, users.id))
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(eq(examAttempts.status, "submitted"))
    .orderBy(desc(examAttempts.percentage), desc(examAttempts.score), asc(examAttempts.submittedAt));
}

export async function listParticipation() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: examAttempts.id,
      studentName: users.name,
      examTitle: exams.title,
      status: examAttempts.status,
      percentage: examAttempts.percentage,
      startedAt: examAttempts.startedAt,
      submittedAt: examAttempts.submittedAt,
    })
    .from(examAttempts)
    .innerJoin(users, eq(examAttempts.userId, users.id))
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .orderBy(desc(examAttempts.startedAt));
}
