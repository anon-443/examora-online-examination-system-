import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  attemptAnswers,
  assignmentAttempts,
  assignments,
  cohortMemberships,
  cohorts,
  examFeedback,
  exams,
  type InsertUser,
  examAttempts,
  notifications,
  notificationDispatches,
  notificationSchedules,
  questions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { buildAdminAnalytics } from "../shared/examEnhancements";

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

export async function seedStarterAssessments(createdBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select({ id: exams.id }).from(exams).where(eq(exams.title, "Critical Thinking Sprint")).limit(1);
  if (existing.length) return { created: false, count: 0 };
  const starterSets = [
    {
      title: "Critical Thinking Sprint",
      subject: "Critical thinking",
      description: "A concise assessment of evidence, assumptions, and sound conclusion-making.",
      durationMinutes: 15,
      difficulty: "Intermediate" as const,
      questions: [
        ["Which response best evaluates a claim?", "Accept it because it sounds confident", "Check its evidence, assumptions, and alternatives", "Repeat the claim in different words", "Choose the most technical wording", 1, "Strong evaluation tests the support, assumptions, and alternatives behind a claim."],
        ["What is an assumption in an argument?", "A conclusion proven by evidence", "An unstated idea the reasoning depends on", "A detail that is unrelated to the issue", "The author’s name", 1, "An assumption is a needed but unstated bridge between evidence and conclusion."],
        ["Which source most directly supports a factual claim?", "A relevant dataset with a clear method", "An unrelated opinion", "A slogan", "A question without evidence", 0, "A relevant dataset with a clear method offers direct, inspectable support."],
        ["A good alternative explanation should…", "Ignore the evidence", "Fit the evidence at least as well as the first explanation", "Always be longer", "Be impossible to test", 1, "A useful alternative must plausibly account for the available evidence."],
      ],
    },
    {
      title: "Quantitative Reasoning Foundations",
      subject: "Mathematics",
      description: "Practice practical proportional reasoning, estimates, and clear numerical interpretation.",
      durationMinutes: 20,
      difficulty: "Beginner" as const,
      questions: [
        ["A study group completes 18 questions in 3 sessions at an even pace. How many questions per session?", "5", "6", "9", "12", 1, "Divide 18 by 3 to find the even per-session amount: 6."],
        ["An assessment has 24 questions and a learner answers 18 correctly. What percentage is correct?", "60%", "70%", "75%", "80%", 2, "18 divided by 24 is 0.75, which equals 75%."],
        ["Which estimate is most reasonable for 49 × 2?", "About 50", "About 100", "About 200", "About 500", 1, "49 is close to 50, and 50 × 2 is 100."],
        ["A 30-minute test is split into 3 equal sections. How long is each section?", "5 minutes", "10 minutes", "15 minutes", "20 minutes", 1, "30 divided by 3 gives 10 minutes per section."],
      ],
    },
  ];
  for (const set of starterSets) {
    const created = await db.insert(exams).values({ title: set.title, subject: set.subject, description: set.description, durationMinutes: set.durationMinutes, difficulty: set.difficulty, status: "published", createdBy }).$returningId();
    const examId = created[0]?.id;
    if (!examId) throw new Error("Starter assessment could not be created");
    await db.insert(questions).values(set.questions.map(([prompt, optionA, optionB, optionC, optionD, correctOption, explanation], index) => ({ examId, prompt: String(prompt), optionA: String(optionA), optionB: String(optionB), optionC: String(optionC), optionD: String(optionD), correctOption: Number(correctOption), explanation: String(explanation), position: index + 1 })));
  }
  return { created: true, count: starterSets.length };
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

export async function createAttempt(examId: number, userId: number, totalQuestions: number, assignmentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const created = await db
    .insert(examAttempts)
    .values({ examId, userId, totalQuestions, assignmentId: assignmentId ?? null, status: "in_progress" })
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

export async function getAttemptFeedback(attemptId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(examFeedback).where(and(eq(examFeedback.attemptId, attemptId), eq(examFeedback.userId, userId))).limit(1);
  return result[0];
}

export async function upsertAttemptFeedback(input: { attemptId: number; userId: number; difficultyRating: number; comment: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(examFeedback).values(input).onDuplicateKeyUpdate({ set: { difficultyRating: input.difficultyRating, comment: input.comment } });
}

export async function listAdminFeedback() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: examFeedback.id, difficultyRating: examFeedback.difficultyRating, comment: examFeedback.comment, createdAt: examFeedback.createdAt, studentName: users.name, examTitle: exams.title, subject: exams.subject, percentage: examAttempts.percentage })
    .from(examFeedback)
    .innerJoin(examAttempts, eq(examFeedback.attemptId, examAttempts.id))
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .innerJoin(users, eq(examFeedback.userId, users.id))
    .orderBy(desc(examFeedback.createdAt))
    .limit(24);
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

export async function getAdminAnalytics() {
  const db = await getDb();
  if (!db) return buildAdminAnalytics([], []);
  const attempts = await db
    .select({ userId: examAttempts.userId, percentage: examAttempts.percentage, subject: exams.subject })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(eq(examAttempts.status, "submitted"));
  const answers = await db
    .select({ questionId: attemptAnswers.questionId, prompt: attemptAnswers.questionPromptSnapshot, subject: exams.subject, isCorrect: attemptAnswers.isCorrect })
    .from(attemptAnswers)
    .innerJoin(examAttempts, eq(attemptAnswers.attemptId, examAttempts.id))
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(eq(examAttempts.status, "submitted"));
  return buildAdminAnalytics(attempts, answers.map(answer => ({ ...answer, isCorrect: Boolean(answer.isCorrect) })));
}

export async function listUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(40);
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, userId), sql`${notifications.readAt} IS NULL`));
}

export async function listUserCohorts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: cohorts.id, name: cohorts.name, description: cohorts.description, inviteCode: cohorts.inviteCode, role: cohortMemberships.role, createdAt: cohorts.createdAt, instructorName: users.name })
    .from(cohortMemberships)
    .innerJoin(cohorts, eq(cohortMemberships.cohortId, cohorts.id))
    .innerJoin(users, eq(cohorts.createdBy, users.id))
    .where(eq(cohortMemberships.userId, userId))
    .orderBy(desc(cohorts.createdAt));
}

export async function createCohort(input: { name: string; description: string | null; inviteCode: string; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const created = await db.insert(cohorts).values(input).$returningId();
  const cohortId = created[0]?.id;
  if (!cohortId) throw new Error("Cohort could not be created");
  await db.insert(cohortMemberships).values({ cohortId, userId: input.createdBy, role: "instructor" });
  return cohortId;
}

export async function joinCohortByInviteCode(userId: number, inviteCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [cohort] = await db.select().from(cohorts).where(eq(cohorts.inviteCode, inviteCode)).limit(1);
  if (!cohort) return undefined;
  await db.insert(cohortMemberships).values({ cohortId: cohort.id, userId, role: "learner" }).onDuplicateKeyUpdate({ set: { role: "learner" } });
  await db.insert(notifications).values({ userId, type: "cohort", title: `Joined ${cohort.name}`, body: "You can now view assignments shared with this cohort.", actionHref: "/learning" });
  return cohort;
}

export async function listInstructorCohorts(instructorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: cohorts.id, name: cohorts.name, description: cohorts.description, inviteCode: cohorts.inviteCode, createdAt: cohorts.createdAt, learnerCount: sql<number>`sum(case when ${cohortMemberships.role} = 'learner' then 1 else 0 end)` })
    .from(cohorts)
    .leftJoin(cohortMemberships, eq(cohortMemberships.cohortId, cohorts.id))
    .where(eq(cohorts.createdBy, instructorId))
    .groupBy(cohorts.id)
    .orderBy(desc(cohorts.createdAt));
}

export async function createAssignment(input: { cohortId: number; examId: number; title: string; instructions: string | null; scheduledAt: Date; dueAt: Date | null; status: "scheduled" | "published"; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const created = await db.insert(assignments).values(input).$returningId();
  const assignmentId = created[0]?.id;
  if (!assignmentId) throw new Error("Assignment could not be created");
  const learners = await db.select({ userId: cohortMemberships.userId }).from(cohortMemberships).where(and(eq(cohortMemberships.cohortId, input.cohortId), eq(cohortMemberships.role, "learner")));
  if (learners.length) {
    const noticeType: "deadline" | "assignment" = input.dueAt ? "deadline" : "assignment";
    const dueCopy = input.dueAt ? ` Due ${input.dueAt.toLocaleDateString("en-CA")}.` : "";
    await db.insert(notifications).values(learners.map(learner => ({ userId: learner.userId, type: noticeType, title: `New assignment: ${input.title}`, body: `A new cohort assignment is available.${dueCopy}`, actionHref: "/learning" })));
  }
  return assignmentId;
}

export async function listUserAssignments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: assignments.id, cohortId: cohorts.id, cohortName: cohorts.name, examId: exams.id, examTitle: exams.title, subject: exams.subject, title: assignments.title, instructions: assignments.instructions, scheduledAt: assignments.scheduledAt, dueAt: assignments.dueAt, status: assignments.status, attemptId: assignmentAttempts.attemptId, attemptStatus: examAttempts.status, percentage: examAttempts.percentage })
    .from(cohortMemberships)
    .innerJoin(cohorts, eq(cohortMemberships.cohortId, cohorts.id))
    .innerJoin(assignments, eq(assignments.cohortId, cohorts.id))
    .innerJoin(exams, eq(assignments.examId, exams.id))
    .leftJoin(assignmentAttempts, and(eq(assignmentAttempts.assignmentId, assignments.id), eq(assignmentAttempts.userId, userId)))
    .leftJoin(examAttempts, eq(examAttempts.id, assignmentAttempts.attemptId))
    .where(eq(cohortMemberships.userId, userId))
    .orderBy(asc(assignments.scheduledAt));
}

export async function listInstructorAssignments(instructorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: assignments.id, cohortId: cohorts.id, cohortName: cohorts.name, examId: exams.id, examTitle: exams.title, subject: exams.subject, title: assignments.title, scheduledAt: assignments.scheduledAt, dueAt: assignments.dueAt, status: assignments.status, learnerCount: sql<number>`count(distinct ${cohortMemberships.userId})`, completionCount: sql<number>`count(distinct ${assignmentAttempts.userId})` })
    .from(assignments)
    .innerJoin(cohorts, eq(assignments.cohortId, cohorts.id))
    .innerJoin(exams, eq(assignments.examId, exams.id))
    .leftJoin(cohortMemberships, and(eq(cohortMemberships.cohortId, cohorts.id), eq(cohortMemberships.role, "learner")))
    .leftJoin(assignmentAttempts, eq(assignmentAttempts.assignmentId, assignments.id))
    .where(eq(assignments.createdBy, instructorId))
    .groupBy(assignments.id)
    .orderBy(desc(assignments.scheduledAt));
}

export async function listUpcomingDeadlines(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select({ id: assignments.id, title: assignments.title, cohortName: cohorts.name, dueAt: assignments.dueAt, actionHref: sql<string>`concat('/learning')` })
    .from(cohortMemberships)
    .innerJoin(cohorts, eq(cohortMemberships.cohortId, cohorts.id))
    .innerJoin(assignments, eq(assignments.cohortId, cohorts.id))
    .where(and(eq(cohortMemberships.userId, userId), eq(assignments.status, "published"), gte(assignments.dueAt, now)))
    .orderBy(asc(assignments.dueAt))
    .limit(5);
}

export async function getNotificationSchedule(scheduleKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notificationSchedules).where(eq(notificationSchedules.scheduleKey, scheduleKey)).limit(1);
  return result[0];
}

export async function getNotificationScheduleByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notificationSchedules).where(eq(notificationSchedules.taskUid, taskUid)).limit(1);
  return result[0];
}

export async function saveNotificationSchedule(input: { scheduleKey: string; taskUid: string; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(notificationSchedules).values(input).onDuplicateKeyUpdate({ set: { taskUid: input.taskUid, createdBy: input.createdBy, updatedAt: new Date() } });
}

export async function dispatchUpcomingDeadlineAlerts(now = new Date()) {
  const db = await getDb();
  if (!db) return 0;
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const candidates = await db.select({ assignmentId: assignments.id, assignmentTitle: assignments.title, dueAt: assignments.dueAt, cohortName: cohorts.name, userId: cohortMemberships.userId })
    .from(assignments)
    .innerJoin(cohorts, eq(assignments.cohortId, cohorts.id))
    .innerJoin(cohortMemberships, and(eq(cohortMemberships.cohortId, cohorts.id), eq(cohortMemberships.role, "learner")))
    .leftJoin(notificationDispatches, and(eq(notificationDispatches.assignmentId, assignments.id), eq(notificationDispatches.userId, cohortMemberships.userId), eq(notificationDispatches.kind, "deadline_soon")))
    .where(and(eq(assignments.status, "published"), gte(assignments.dueAt, now), lte(assignments.dueAt, windowEnd), sql`${notificationDispatches.id} IS NULL`));
  let delivered = 0;
  for (const candidate of candidates) {
    const dueAt = candidate.dueAt;
    if (!dueAt) continue;
    const created = await db.transaction(async tx => {
      const existing = await tx.select({ id: notificationDispatches.id }).from(notificationDispatches).where(and(eq(notificationDispatches.assignmentId, candidate.assignmentId), eq(notificationDispatches.userId, candidate.userId), eq(notificationDispatches.kind, "deadline_soon"))).limit(1);
      if (existing.length) return false;
      await tx.insert(notificationDispatches).values({ assignmentId: candidate.assignmentId, userId: candidate.userId, kind: "deadline_soon" });
      await tx.insert(notifications).values({ userId: candidate.userId, type: "deadline", title: `Deadline approaching: ${candidate.assignmentTitle}`, body: `${candidate.cohortName} is due on ${dueAt.toLocaleDateString("en-CA")}.`, actionHref: "/learning" });
      return true;
    });
    if (created) delivered += 1;
  }
  return delivered;
}

export async function getAssignmentForUser(assignmentId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ id: assignments.id, examId: assignments.examId, scheduledAt: assignments.scheduledAt, dueAt: assignments.dueAt, status: assignments.status, title: assignments.title, existingAttemptId: assignmentAttempts.attemptId })
    .from(cohortMemberships)
    .innerJoin(assignments, eq(assignments.cohortId, cohortMemberships.cohortId))
    .leftJoin(assignmentAttempts, and(eq(assignmentAttempts.assignmentId, assignments.id), eq(assignmentAttempts.userId, userId)))
    .where(and(eq(assignments.id, assignmentId), eq(cohortMemberships.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createAssignmentAttempt(assignmentId: number, attemptId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(assignmentAttempts).values({ assignmentId, attemptId, userId });
}
