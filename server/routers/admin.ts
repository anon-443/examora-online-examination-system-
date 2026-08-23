import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";
import { adminProcedure, router } from "../_core/trpc";
import { storageGetSignedUrl, storagePut } from "../storage";
import { isOwnedPdfContextKey } from "../../shared/examEnhancements";

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
  explanation: z.string().trim().min(8).max(1500),
  position: z.number().int().min(1).max(500),
});

const aiQuestionInput = z.object({
  topic: z.string().trim().min(3).max(180),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  count: z.number().int().min(1).max(8),
  contextKey: z.string().trim().min(1).max(320).optional(),
});

export const adminRouter = router({
  exams: adminProcedure.query(() => db.listAdminExams()),
  participation: adminProcedure.query(() => db.listParticipation()),
  analytics: adminProcedure.query(() => db.getAdminAnalytics()),
  feedback: adminProcedure.query(() => db.listAdminFeedback()),
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
  uploadQuestionContext: adminProcedure.input(z.object({ fileName: z.string().trim().min(1).max(180), mimeType: z.literal("application/pdf"), base64: z.string().min(20).max(7_000_000) })).mutation(async ({ input, ctx }) => {
    const buffer = Buffer.from(input.base64.replace(/^data:application\/pdf;base64,/, ""), "base64");
    if (!buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a valid PDF document." });
    if (buffer.byteLength > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "The PDF must be 5 MB or smaller." });
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "source.pdf";
    const stored = await storagePut(`exam-context/${ctx.user.id}/${safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`}`, buffer, "application/pdf");
    return { ...stored, fileName: safeName, bytes: buffer.byteLength };
  }),
  generateQuestions: adminProcedure.input(aiQuestionInput).mutation(async ({ input, ctx }) => {
    let documentContext: { type: "file_url"; file_url: { url: string; mime_type: "application/pdf" } } | null = null;
    if (input.contextKey) {
      if (!isOwnedPdfContextKey(input.contextKey, ctx.user.id)) throw new TRPCError({ code: "FORBIDDEN", message: "This PDF context is not available to your account." });
      documentContext = { type: "file_url", file_url: { url: await storageGetSignedUrl(input.contextKey), mime_type: "application/pdf" } };
    }
    const response = await invokeLLM({
      model: documentContext ? "gemini-3-flash-preview" : "gpt-5-mini",
      maxTokens: documentContext ? 5000 : 3800,
      messages: [
        {
          role: "system",
          content: "You generate accurate, original multiple-choice assessment questions. Return only the requested JSON. Each question must have exactly four distinct, plausible options, one unambiguous correct answer, and a concise teaching explanation. Do not include copyrighted passages, answer keys outside the schema, or unsafe content.",
        },
        {
          role: "user",
          content: documentContext ? [{ type: "text", text: `Create ${input.count} ${input.difficulty.toLowerCase()} multiple-choice questions about: ${input.topic}. Use the attached PDF only as learning context. Do not reproduce long passages or mention the source document. Questions must be appropriate for a general educational assessment.` }, documentContext] : `Create ${input.count} ${input.difficulty.toLowerCase()} multiple-choice questions about: ${input.topic}. Questions must be appropriate for a general educational assessment.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "generated_mcq_questions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                minItems: input.count,
                maxItems: input.count,
                items: {
                  type: "object",
                  properties: {
                    prompt: { type: "string" },
                    options: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                    correctOption: { type: "integer", minimum: 0, maximum: 3 },
                    explanation: { type: "string" },
                  },
                  required: ["prompt", "options", "correctOption", "explanation"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = response.choices[0]?.message.content;
    if (typeof raw !== "string") throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI generator returned an invalid response." });
    try {
      const parsed = z.object({
        questions: z.array(z.object({
          prompt: z.string().trim().min(4).max(2000),
          options: z.tuple([z.string().trim().min(1).max(500), z.string().trim().min(1).max(500), z.string().trim().min(1).max(500), z.string().trim().min(1).max(500)]),
          correctOption: z.number().int().min(0).max(3),
          explanation: z.string().trim().min(8).max(1500),
        })).length(input.count),
      }).parse(JSON.parse(raw));
      return parsed;
    } catch {
      throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI generator produced an unusable question set. Please try again." });
    }
  }),
});
