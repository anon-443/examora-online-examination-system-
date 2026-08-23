import { describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({
  storageGetSignedUrl: vi.fn().mockResolvedValue("https://example.test/signed.pdf"),
  storagePut: vi.fn(),
}));
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ questions: [{ prompt: "Which cell structure controls activity?", options: ["Nucleus", "Cell wall", "Vacuole", "Membrane"], correctOption: 0, explanation: "The nucleus contains genetic material and controls cell activity." }] }) } }] }),
}));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function adminContext(userId = 1): TrpcContext {
  return {
    user: { id: userId, openId: `admin-${userId}`, name: "Administrator", email: "admin@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("administrator PDF question context", () => {
  it("rejects non-PDF MIME types before storage is accessed", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.admin.uploadQuestionContext({ fileName: "source.txt", mimeType: "text/plain" as "application/pdf", base64: "data:text/plain;base64,dGVzdA==" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a payload that decodes above the PDF size limit", async () => {
    const caller = appRouter.createCaller(adminContext());
    const bytes = Buffer.concat([Buffer.from("%PDF"), Buffer.alloc(5 * 1024 * 1024)]);
    await expect(caller.admin.uploadQuestionContext({ fileName: "large.pdf", mimeType: "application/pdf", base64: bytes.toString("base64") })).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });

  it("rejects an invalid PDF signature before storage is accessed", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.admin.uploadQuestionContext({ fileName: "invalid.pdf", mimeType: "application/pdf", base64: Buffer.from("plain text").toString("base64") })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects another administrator's PDF key before invoking question generation", async () => {
    const caller = appRouter.createCaller(adminContext(7));
    await expect(caller.admin.generateQuestions({ topic: "Cell biology", difficulty: "Intermediate", count: 2, contextKey: "exam-context/8/handout.pdf" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("accepts an owned PDF context and proceeds into structured question generation", async () => {
    const caller = appRouter.createCaller(adminContext(7));
    const result = await caller.admin.generateQuestions({ topic: "Cell biology", difficulty: "Intermediate", count: 1, contextKey: "exam-context/7/handout.pdf" });
    expect(result.questions[0]?.prompt).toContain("cell structure");
  });
});
