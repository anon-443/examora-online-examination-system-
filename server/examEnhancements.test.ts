import { describe, expect, it } from "vitest";
import { achievementShareCopy, achievementShareUrls, filterCategorizedExams, isLowTime } from "../shared/examEnhancements";

const exams = [
  { subject: "Science", difficulty: "Beginner" as const, id: 1 },
  { subject: "Science", difficulty: "Advanced" as const, id: 2 },
  { subject: "Mathematics", difficulty: "Intermediate" as const, id: 3 },
];

describe("exam enhancement helpers", () => {
  it("filters exams by subject and difficulty", () => {
    expect(filterCategorizedExams(exams, "Science", "Advanced")).toEqual([{ subject: "Science", difficulty: "Advanced", id: 2 }]);
  });

  it("flags the final assessment window without flagging earlier time", () => {
    expect(isLowTime(300, 60)).toBe(true);
    expect(isLowTime(301, 60)).toBe(false);
  });

  it("builds LinkedIn and X achievement-sharing URLs with a readable certificate message", () => {
    const copy = achievementShareCopy("Adeen", "Science foundations", 88);
    const urls = achievementShareUrls("https://examora.example", copy);
    expect(copy).toContain("88%");
    expect(urls.linkedIn).toContain("linkedin.com");
    expect(urls.x).toContain("twitter.com/intent/tweet");
  });
});
