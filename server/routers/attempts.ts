import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { calculateAssessmentScore } from "../scoring";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const attemptInput = z.object({ attemptId: z.number().int().positive() });

export const attemptRouter = router({
  session: protectedProcedure.input(attemptInput).query(async ({ input, ctx }) => {
    const attempt = await db.getOwnedAttempt(input.attemptId, ctx.user.id);
    if (!attempt || attempt.status !== "in_progress") return null;
    const source = await db.getExamWithQuestions(attempt.examId);
    if (!source) return null;
    const answers = await db.getAttemptAnswers(attempt.id);
    return {
      attempt: { id: attempt.id, startedAt: attempt.startedAt },
      exam: {
        id: source.exam.id,
        title: source.exam.title,
        subject: source.exam.subject,
        durationMinutes: source.exam.durationMinutes,
      },
      answers: answers.map(answer => ({ questionId: answer.questionId, selectedOption: answer.selectedOption })),
      questions: source.questions.map(question => ({
        id: question.id,
        prompt: question.prompt,
        position: question.position,
        options: [question.optionA, question.optionB, question.optionC, question.optionD],
      })),
    };
  }),
  start: protectedProcedure
    .input(z.object({ examId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const source = await db.getExamWithQuestions(input.examId);
      if (!source || source.exam.status !== "published" || source.questions.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This assessment is not available." });
      }
      const id = await db.createAttempt(source.exam.id, ctx.user.id, source.questions.length);
      return { attemptId: id, startedAt: new Date(), durationMinutes: source.exam.durationMinutes };
    }),
  saveAnswer: protectedProcedure
    .input(attemptInput.extend({ questionId: z.number().int().positive(), selectedOption: z.number().int().min(0).max(3) }))
    .mutation(async ({ input, ctx }) => {
      const attempt = await db.getOwnedAttempt(input.attemptId, ctx.user.id);
      if (!attempt || attempt.status !== "in_progress") {
        throw new TRPCError({ code: "FORBIDDEN", message: "This attempt cannot be updated." });
      }
      const source = await db.getExamWithQuestions(attempt.examId);
      if (!source?.questions.some(question => question.id === input.questionId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The question does not belong to this attempt." });
      }
      await db.upsertAttemptAnswer(input);
      return { success: true };
    }),
  submit: protectedProcedure.input(attemptInput).mutation(async ({ input, ctx }) => {
    const attempt = await db.getOwnedAttempt(input.attemptId, ctx.user.id);
    if (!attempt || attempt.status !== "in_progress") {
      throw new TRPCError({ code: "FORBIDDEN", message: "This attempt cannot be submitted." });
    }
    const source = await db.getExamWithQuestions(attempt.examId);
    if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found." });
    const answers = await db.getAttemptAnswers(attempt.id);
    const selectedAnswers = new Map(
      answers
        .filter((answer): answer is typeof answer & { selectedOption: number } => answer.selectedOption !== null)
        .map(answer => [answer.questionId, answer.selectedOption] as const),
    );
    const result = calculateAssessmentScore(source.questions, selectedAnswers);
    await db.finalizeAttemptAnswers(attempt.id, source.questions, selectedAnswers);
    await db.submitAttempt({
      attemptId: attempt.id,
      score: result.score,
      incorrectAnswers: result.incorrectAnswers,
      percentage: result.percentage,
    });
    return { ...result, totalQuestions: source.questions.length, attemptId: attempt.id };
  }),
  result: protectedProcedure.input(attemptInput).query(async ({ input, ctx }) => {
    const result = await db.getAttemptResult(input.attemptId, ctx.user.id);
    if (!result || result.status !== "submitted") return null;
    const review = await db.getAttemptReview(input.attemptId);
    const summary =
      result.percentage >= 85
        ? "Excellent work. You demonstrated strong mastery of this assessment."
        : result.percentage >= 65
          ? "Good progress. Review the missed concepts to strengthen your understanding."
          : "Keep learning. Revisit the topic and try another assessment when you are ready.";
    return { ...result, summary, review };
  }),
  history: protectedProcedure.query(({ ctx }) => db.listAttemptHistory(ctx.user.id)),
  leaderboard: publicProcedure.query(async () => {
    const rows = await db.getLeaderboardRows();
    const bestByStudent = new Map<number, (typeof rows)[number]>();
    rows.forEach(row => {
      if (!bestByStudent.has(row.userId)) bestByStudent.set(row.userId, row);
    });
    return Array.from(bestByStudent.values()).slice(0, 20).map((row, index) => ({
      rank: index + 1,
      name: row.name || "Learner",
      score: row.score,
      percentage: row.percentage,
    }));
  }),
});
