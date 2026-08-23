import { describe, expect, it } from "vitest";
import { remainingSeconds } from "./timer";

describe("remainingSeconds", () => {
  it("calculates the available time from an attempt start timestamp", () => {
    const start = new Date("2026-08-23T00:00:00.000Z");

    expect(remainingSeconds(start, 10, new Date("2026-08-23T00:03:15.250Z").getTime())).toBe(405);
  });

  it("returns zero rather than a negative value after the deadline", () => {
    const start = new Date("2026-08-23T00:00:00.000Z");

    expect(remainingSeconds(start, 1, new Date("2026-08-23T00:02:00.000Z").getTime())).toBe(0);
  });
});
