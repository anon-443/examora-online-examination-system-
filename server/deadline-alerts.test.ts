import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ getNotificationScheduleByTaskUid: vi.fn(), dispatchUpcomingDeadlineAlerts: vi.fn() }));
const sdk = vi.hoisted(() => ({ authenticateRequest: vi.fn() }));
vi.mock("./db", () => db);
vi.mock("./_core/sdk", () => ({ sdk }));
import { handleDeadlineAlerts } from "./scheduled/deadlineAlerts";

function response() {
  const value: { statusCode?: number; body?: unknown; status: (code: number) => typeof value; json: (body: unknown) => typeof value } = {
    status: code => { value.statusCode = code; return value; },
    json: body => { value.body = body; return value; },
  };
  return value;
}

describe("deadline alert callback", () => {
  beforeEach(() => vi.resetAllMocks());

  it("dispatches reminders only for a recognized cron schedule", async () => {
    sdk.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-1" });
    db.getNotificationScheduleByTaskUid.mockResolvedValue({ scheduleKey: "deadline-alerts" });
    db.dispatchUpcomingDeadlineAlerts.mockResolvedValue(3);
    const res = response();
    await handleDeadlineAlerts({} as never, res as never);
    expect(res.body).toMatchObject({ ok: true, delivered: 3, taskUid: "task-1" });
    expect(db.dispatchUpcomingDeadlineAlerts).toHaveBeenCalledOnce();
  });

  it("rejects non-cron requests", async () => {
    sdk.authenticateRequest.mockResolvedValue({ isCron: false });
    const res = response();
    await handleDeadlineAlerts({} as never, res as never);
    expect(res.statusCode).toBe(403);
    expect(db.dispatchUpcomingDeadlineAlerts).not.toHaveBeenCalled();
  });
});
