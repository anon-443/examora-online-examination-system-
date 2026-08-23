import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import * as db from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const assignmentInput = z.object({
  cohortId: z.number().int().positive(),
  examId: z.number().int().positive(),
  title: z.string().trim().min(3).max(180),
  instructions: z.string().trim().max(1600).optional(),
  scheduledAt: z.coerce.date(),
  dueAt: z.coerce.date().optional(),
  status: z.enum(["scheduled", "published"]),
});

export const collaborationRouter = router({
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => db.listUserNotifications(ctx.user.id)),
    upcoming: protectedProcedure.query(({ ctx }) => db.listUpcomingDeadlines(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.markNotificationRead(input.id, ctx.user.id)),
    markAllRead: protectedProcedure.mutation(({ ctx }) => db.markAllNotificationsRead(ctx.user.id)),
  }),
  cohorts: router({
    mine: protectedProcedure.query(({ ctx }) => db.listUserCohorts(ctx.user.id)),
    join: protectedProcedure.input(z.object({ inviteCode: z.string().trim().min(5).max(32) })).mutation(async ({ ctx, input }) => {
      const cohort = await db.joinCohortByInviteCode(ctx.user.id, input.inviteCode.toUpperCase());
      if (!cohort) throw new TRPCError({ code: "NOT_FOUND", message: "That cohort code was not found." });
      return cohort;
    }),
    instructor: router({
      list: adminProcedure.query(({ ctx }) => db.listInstructorCohorts(ctx.user.id)),
      create: adminProcedure.input(z.object({ name: z.string().trim().min(3).max(140), description: z.string().trim().max(900).optional() })).mutation(async ({ ctx, input }) => {
        const inviteCode = nanoid(8).toUpperCase();
        const cohortId = await db.createCohort({ name: input.name, description: input.description || null, inviteCode, createdBy: ctx.user.id });
        return { cohortId, inviteCode };
      }),
    }),
  }),
  assignments: router({
    mine: protectedProcedure.query(({ ctx }) => db.listUserAssignments(ctx.user.id)),
    instructor: adminProcedure.query(({ ctx }) => db.listInstructorAssignments(ctx.user.id)),
    progress: adminProcedure.query(({ ctx }) => db.listInstructorAssignmentProgress(ctx.user.id)),
    create: adminProcedure.input(assignmentInput).mutation(async ({ ctx, input }) => {
      if (input.dueAt && input.dueAt < input.scheduledAt) throw new TRPCError({ code: "BAD_REQUEST", message: "A due date must occur after the release time." });
      const availableCohorts = await db.listInstructorCohorts(ctx.user.id);
      if (!availableCohorts.some(cohort => cohort.id === input.cohortId)) throw new TRPCError({ code: "FORBIDDEN", message: "You can only assign assessments to cohorts you manage." });
      const assignmentId = await db.createAssignment({ ...input, instructions: input.instructions || null, dueAt: input.dueAt || null, createdBy: ctx.user.id });
      return { assignmentId };
    }),
    start: protectedProcedure.input(z.object({ assignmentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const assignment = await db.getAssignmentForUser(input.assignmentId, ctx.user.id);
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "This assignment is not available in your cohorts." });
      if (assignment.status !== "published" || assignment.scheduledAt > new Date()) throw new TRPCError({ code: "FORBIDDEN", message: "This assignment has not opened yet." });
      if (assignment.dueAt && assignment.dueAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "The assignment deadline has passed." });
      if (assignment.existingAttemptId) return { attemptId: assignment.existingAttemptId, examId: assignment.examId, resumed: true };
      const exam = await db.getExamWithQuestions(assignment.examId);
      if (!exam || exam.exam.status !== "published" || exam.questions.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "The assigned assessment is not available." });
      const attemptId = await db.createAttempt(assignment.examId, ctx.user.id, exam.questions.length, assignment.id);
      if (!attemptId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The assessment attempt could not be created." });
      await db.createAssignmentAttempt(assignment.id, attemptId, ctx.user.id);
      return { attemptId, examId: assignment.examId, resumed: false };
    }),
  }),
});
