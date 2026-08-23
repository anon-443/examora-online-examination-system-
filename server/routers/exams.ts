import { z } from "zod";
import * as db from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const examRouter = router({
  list: publicProcedure.query(() => db.listPublishedExams()),
  get: publicProcedure.input(z.object({ examId: z.number().int().positive() })).query(async ({ input }) => {
    const result = await db.getExamWithQuestions(input.examId);
    if (!result || result.exam.status !== "published") return null;
    return {
      exam: {
        id: result.exam.id,
        title: result.exam.title,
        subject: result.exam.subject,
        description: result.exam.description,
        durationMinutes: result.exam.durationMinutes,
        difficulty: result.exam.difficulty,
      },
      questions: result.questions.map(question => ({
        id: question.id,
        prompt: question.prompt,
        position: question.position,
        options: [question.optionA, question.optionB, question.optionC, question.optionD],
      })),
    };
  }),
});
