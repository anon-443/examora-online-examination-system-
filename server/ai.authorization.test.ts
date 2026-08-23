import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function studentContext(): TrpcContext {
  return {
    user: { id: 5, openId: "student", name: "Student", email: "student@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AI question generation authorization", () => {
  it("blocks students from invoking the administrator-only generator", async () => {
    const caller = appRouter.createCaller(studentContext());
    await expect(caller.admin.generateQuestions({ topic: "Cell structure", difficulty: "Beginner", count: 2 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
