import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  joinCohortByInviteCode: vi.fn(),
  listUserNotifications: vi.fn(),
  listUpcomingDeadlines: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  listUserCohorts: vi.fn(),
  listInstructorCohorts: vi.fn(),
  createCohort: vi.fn(),
  listUserAssignments: vi.fn(),
  listInstructorAssignments: vi.fn(),
  listInstructorAssignmentProgress: vi.fn(),
  createAssignment: vi.fn(),
  getAssignmentForUser: vi.fn(),
  getExamWithQuestions: vi.fn(),
  createAttempt: vi.fn(),
  createAssignmentAttempt: vi.fn(),
}));
vi.mock("./db", () => db);
import { appRouter } from "./routers";

function context(role: "admin" | "user"): TrpcContext {
  return { user: { id: 7, openId: `${role}-7`, name: role, email: `${role}@examora.test`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("collaboration workflows", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.joinCohortByInviteCode.mockResolvedValue({ id: 4, name: "Reasoning cohort" });
    db.listInstructorCohorts.mockResolvedValue([{ id: 4, name: "Reasoning cohort" }]);
    db.createAssignment.mockResolvedValue(11);
  });

  it("lets a signed-in learner join a cohort by invite code", async () => {
    await expect(appRouter.createCaller(context("user")).collaboration.cohorts.join({ inviteCode: "ab12cd34" })).resolves.toMatchObject({ id: 4 });
    expect(db.joinCohortByInviteCode).toHaveBeenCalledWith(7, "AB12CD34");
  });

  it("rejects an assignment whose deadline is before its scheduled opening", async () => {
    const opens = new Date("2030-01-10T09:00:00.000Z");
    const due = new Date("2030-01-09T09:00:00.000Z");
    await expect(appRouter.createCaller(context("admin")).collaboration.assignments.create({ cohortId: 4, examId: 3, title: "Reasoning check-in", scheduledAt: opens, dueAt: due, status: "published" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createAssignment).not.toHaveBeenCalled();
  });

  it("keeps instructor assignment creation inaccessible to learners", async () => {
    await expect(appRouter.createCaller(context("user")).collaboration.assignments.create({ cohortId: 4, examId: 3, title: "Reasoning check-in", scheduledAt: new Date("2030-01-10T09:00:00.000Z"), status: "published" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps learner-level assignment progress visible only to instructors", async () => {
    db.listInstructorAssignmentProgress.mockResolvedValue([{ assignmentId: 11, learnerName: "Learner", attemptStatus: "submitted" }]);
    await expect(appRouter.createCaller(context("admin")).collaboration.assignments.progress()).resolves.toHaveLength(1);
    await expect(appRouter.createCaller(context("user")).collaboration.assignments.progress()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.listInstructorAssignmentProgress).toHaveBeenCalledWith(7);
  });

  it("launches a persisted attempt for an available cohort assignment", async () => {
    db.getAssignmentForUser.mockResolvedValue({ id: 11, examId: 3, title: "Reasoning check-in", status: "published", scheduledAt: new Date("2020-01-01T00:00:00.000Z"), dueAt: null, existingAttemptId: null });
    db.getExamWithQuestions.mockResolvedValue({ exam: { status: "published" }, questions: [{ id: 1 }, { id: 2 }] });
    db.createAttempt.mockResolvedValue(22);
    await expect(appRouter.createCaller(context("user")).collaboration.assignments.start({ assignmentId: 11 })).resolves.toEqual({ attemptId: 22, examId: 3, resumed: false });
    expect(db.createAttempt).toHaveBeenCalledWith(3, 7, 2, 11);
    expect(db.createAssignmentAttempt).toHaveBeenCalledWith(11, 22, 7);
  });
});
