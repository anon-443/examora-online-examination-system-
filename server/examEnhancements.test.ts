import { describe, expect, it } from "vitest";
import { achievementShareCopy, achievementShareUrls, filterCategorizedExams, filterLeaderboardRows, isGenerationCountValid, isLowTime, toggleQuestionBookmark } from "../shared/examEnhancements";

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

  it("filters ranking rows by subject and rolling weekly or monthly completion periods", () => {
    const now = new Date("2026-08-23T12:00:00.000Z");
    const rows = [
      { subject: "Science", submittedAt: new Date("2026-08-21T12:00:00.000Z"), id: 1 },
      { subject: "Science", submittedAt: new Date("2026-07-10T12:00:00.000Z"), id: 2 },
      { subject: "Mathematics", submittedAt: new Date("2026-08-22T12:00:00.000Z"), id: 3 },
    ];
    expect(filterLeaderboardRows(rows, "Science", "weekly", now).map(row => row.id)).toEqual([1]);
    expect(filterLeaderboardRows(rows, "", "monthly", now).map(row => row.id)).toEqual([1, 3]);
  });

  it("toggles an individual question bookmark without mutating prior selection state", () => {
    const initial = new Set([2]);
    const bookmarked = toggleQuestionBookmark(initial, 4);
    expect(Array.from(bookmarked)).toEqual([2, 4]);
    expect(Array.from(initial)).toEqual([2]);
    expect(Array.from(toggleQuestionBookmark(bookmarked, 2))).toEqual([4]);
  });

  it("only accepts AI generation quantities from one through eight", () => {
    expect(isGenerationCountValid(1)).toBe(true);
    expect(isGenerationCountValid(8)).toBe(true);
    expect(isGenerationCountValid(0)).toBe(false);
    expect(isGenerationCountValid(9)).toBe(false);
  });
});
