import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  createAttempt: vi.fn(),
  getAttemptAnswers: vi.fn(),
  getAttemptResult: vi.fn(),
  getExamWithQuestions: vi.fn(),
  getLeaderboardRows: vi.fn(),
  getOwnedAttempt: vi.fn(),
  listAttemptHistory: vi.fn(),
  submitAttempt: vi.fn(),
  upsertAttemptAnswer: vi.fn(),
}));

vi.mock("./db", () => db);

import { appRouter } from "./routers";

function context(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "learner-1",
      name: "Learner One",
      email: "learner@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const source = {
  exam: { id: 7, status: "published", title: "Foundations", subject: "Science", durationMinutes: 20 },
  questions: [
    { id: 101, correctOption: 1, prompt: "Question one", optionA: "A", optionB: "B", optionC: "C", optionD: "D", position: 1 },
    { id: 102, correctOption: 2, prompt: "Question two", optionA: "A", optionB: "B", optionC: "C", optionD: "D", position: 2 },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  db.getExamWithQuestions.mockResolvedValue(source);
  db.createAttempt.mockResolvedValue(44);
  db.getOwnedAttempt.mockResolvedValue({ id: 44, examId: 7, userId: 1, status: "in_progress", startedAt: new Date() });
  db.getAttemptAnswers.mockResolvedValue([{ questionId: 101, selectedOption: 1 }, { questionId: 102, selectedOption: 0 }]);
  db.getAttemptResult.mockResolvedValue({ id: 44, status: "submitted", score: 1, incorrectAnswers: 1, percentage: 50, totalQuestions: 2, examTitle: "Foundations", subject: "Science" });
  db.listAttemptHistory.mockResolvedValue([{ id: 44, examTitle: "Foundations" }]);
  db.getLeaderboardRows.mockResolvedValue([
    { userId: 1, name: "Learner One", score: 2, percentage: 100, submittedAt: new Date() },
    { userId: 1, name: "Learner One", score: 1, percentage: 50, submittedAt: new Date() },
  ]);
});

describe("attempt workflow", () => {
  it("starts a published assessment and returns its timed session metadata", async () => {
    const result = await appRouter.createCaller(context()).attempts.start({ examId: 7 });

    expect(db.createAttempt).toHaveBeenCalledWith(7, 1, 2);
    expect(result).toMatchObject({ attemptId: 44, durationMinutes: 20 });
  });

  it("saves an owned in-progress answer", async () => {
    await appRouter.createCaller(context()).attempts.saveAnswer({ attemptId: 44, questionId: 101, selectedOption: 1 });

    expect(db.upsertAttemptAnswer).toHaveBeenCalledWith({ attemptId: 44, questionId: 101, selectedOption: 1 });
  });

  it("scores submitted answers and persists a valid result record", async () => {
    const result = await appRouter.createCaller(context()).attempts.submit({ attemptId: 44 });

    expect(db.submitAttempt).toHaveBeenCalledWith({ attemptId: 44, score: 1, incorrectAnswers: 1, percentage: 50 });
    expect(result).toMatchObject({ attemptId: 44, totalQuestions: 2, score: 1, percentage: 50 });
  });

  it("returns a result, history record, and one best leaderboard entry per learner", async () => {
    const caller = appRouter.createCaller(context());

    await expect(caller.attempts.result({ attemptId: 44 })).resolves.toMatchObject({ score: 1, percentage: 50 });
    await expect(caller.attempts.history()).resolves.toEqual([{ id: 44, examTitle: "Foundations" }]);
    await expect(caller.attempts.leaderboard()).resolves.toEqual([{ rank: 1, name: "Learner One", score: 2, percentage: 100 }]);
  });
});
