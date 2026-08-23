import { z } from "zod";
import * as db from "../db";
import { adminProcedure, router } from "../_core/trpc";

const examInput = z.object({
  title: z.string().trim().min(3).max(180),
  subject: z.string().trim().min(2).max(96),
  description: z.string().trim().min(10).max(2000),
  durationMinutes: z.number().int().min(1).max(360),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  status: z.enum(["draft", "published"]),
});

const questionInput = z.object({
  examId: z.number().int().positive(),
  prompt: z.string().trim().min(4).max(2000),
  optionA: z.string().trim().min(1).max(500),
  optionB: z.string().trim().min(1).max(500),
  optionC: z.string().trim().min(1).max(500),
  optionD: z.string().trim().min(1).max(500),
  correctOption: z.number().int().min(0).max(3),
  position: z.number().int().min(1).max(500),
});

export const adminRouter = router({
  exams: adminProcedure.query(() => db.listAdminExams()),
  participation: adminProcedure.query(() => db.listParticipation()),
  examDetails: adminProcedure
    .input(z.object({ examId: z.number().int().positive() }))
    .query(({ input }) => db.getExamWithQuestions(input.examId)),
  createExam: adminProcedure.input(examInput).mutation(({ input, ctx }) => db.createExam({ ...input, createdBy: ctx.user.id })),
  updateExam: adminProcedure
    .input(z.object({ examId: z.number().int().positive(), values: examInput.partial() }))
    .mutation(({ input }) => db.updateExam(input.examId, input.values)),
  deleteExam: adminProcedure
    .input(z.object({ examId: z.number().int().positive() }))
    .mutation(({ input }) => db.deleteExam(input.examId)),
  createQuestion: adminProcedure.input(questionInput).mutation(({ input }) => db.createQuestion(input)),
  updateQuestion: adminProcedure
    .input(z.object({ questionId: z.number().int().positive(), values: questionInput.omit({ examId: true }).partial() }))
    .mutation(({ input }) => db.updateQuestion(input.questionId, input.values)),
  deleteQuestion: adminProcedure
    .input(z.object({ questionId: z.number().int().positive() }))
    .mutation(({ input }) => db.deleteQuestion(input.questionId)),
});
