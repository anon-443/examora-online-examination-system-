import { completionRate, getAssignmentProgressState, summarizeLearnerAssignments } from "../shared/collaborationProgress";
import { describe, expect, it } from "vitest";

describe("collaboration progress helpers", () => {
  const now = new Date("2030-02-01T12:00:00.000Z");

  it("calculates learner completion rates safely for populated and empty cohorts", () => {
    expect(completionRate(3, 8)).toBe(38);
    expect(completionRate(0, 0)).toBe(0);
  });

  it("prioritizes completed and overdue assignment states correctly", () => {
    expect(getAssignmentProgressState({ scheduledAt: "2030-01-01T00:00:00.000Z", dueAt: "2030-02-02T00:00:00.000Z", attemptStatus: "submitted", now })).toBe("completed");
    expect(getAssignmentProgressState({ scheduledAt: "2030-01-01T00:00:00.000Z", dueAt: "2030-01-31T00:00:00.000Z", now })).toBe("overdue");
  });

  it("summarizes current tasks into progress and status counts", () => {
    const summary = summarizeLearnerAssignments([
      { scheduledAt: "2030-01-20T00:00:00.000Z", dueAt: "2030-02-10T00:00:00.000Z", attemptStatus: "submitted" as const },
      { scheduledAt: "2030-01-20T00:00:00.000Z", dueAt: "2030-02-02T08:00:00.000Z", attemptStatus: null },
      { scheduledAt: "2030-01-20T00:00:00.000Z", dueAt: "2030-02-10T00:00:00.000Z", attemptStatus: "in_progress" as const },
    ], now);
    expect(summary).toEqual({ total: 3, completed: 1, inProgress: 1, dueSoon: 1, overdue: 0, completionRate: 33 });
  });
});
