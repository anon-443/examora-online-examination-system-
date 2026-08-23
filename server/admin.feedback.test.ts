import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({ listAdminFeedback: vi.fn() }));
vi.mock("./db", () => db);
import { appRouter } from "./routers";

function context(role: "admin" | "user"): TrpcContext { return { user: { id: 1, openId: `${role}-1`, name: role, email: `${role}@example.com`, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("administrator learner-feedback review", () => {
  beforeEach(() => { vi.resetAllMocks(); db.listAdminFeedback.mockResolvedValue([{ id: 1, examTitle: "Science", difficultyRating: 4 }]); });
  it("returns feedback to an administrator", async () => {
    await expect(appRouter.createCaller(context("admin")).admin.feedback()).resolves.toEqual([{ id: 1, examTitle: "Science", difficultyRating: 4 }]);
    expect(db.listAdminFeedback).toHaveBeenCalledOnce();
  });
  it("keeps learner feedback records isolated from non-administrators", async () => {
    await expect(appRouter.createCaller(context("user")).admin.feedback()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
