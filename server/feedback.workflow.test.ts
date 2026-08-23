import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({ getAttemptResult: vi.fn(), upsertAttemptFeedback: vi.fn(), getAttemptFeedback: vi.fn() }));
vi.mock("./db", () => db);
import { appRouter } from "./routers";

function learnerContext(): TrpcContext { return { user: { id: 1, openId: "learner-1", name: "Learner", email: "learner@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("post-exam feedback workflow", () => {
  beforeEach(() => { vi.resetAllMocks(); db.getAttemptResult.mockResolvedValue({ id: 44, status: "submitted", percentage: 83 }); });
  it("allows a learner to save feedback only for their submitted attempt", async () => {
    await expect(appRouter.createCaller(learnerContext()).attempts.saveFeedback({ attemptId: 44, difficultyRating: 4, comment: "Useful review notes." })).resolves.toEqual({ success: true });
    expect(db.upsertAttemptFeedback).toHaveBeenCalledWith({ attemptId: 44, userId: 1, difficultyRating: 4, comment: "Useful review notes." });
  });
  it("rejects difficulty ratings outside the permitted one-to-five range", async () => {
    await expect(appRouter.createCaller(learnerContext()).attempts.saveFeedback({ attemptId: 44, difficultyRating: 6 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
