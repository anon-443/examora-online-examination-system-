import { describe, expect, it } from "vitest";
import { achievementShareCopy, achievementShareUrls, buildAdminAnalytics, buildPerformanceTrend, buildSubmissionReview, filterCategorizedExams, filterLeaderboardRows, isGenerationCountValid, isLowTime, isOwnedPdfContextKey, normalizeExamRecovery, toggleQuestionBookmark, updateGeneratedDraft, updateGeneratedDraftOption } from "../shared/examEnhancements";

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

  it("summarizes answered, unanswered, and flagged questions before submission", () => {
    expect(buildSubmissionReview([10, 11, 12], { 10: 2, 12: 0 }, new Set([11, 12]))).toEqual({ answeredCount: 2, unansweredQuestionIds: [11], flaggedQuestionIds: [11, 12] });
  });

  it("orders completed assessment performance chronologically for profile trends", () => {
    const trend = buildPerformanceTrend([
      { id: 2, examTitle: "Later", score: 8, percentage: 80, status: "submitted", submittedAt: new Date("2026-08-20T12:00:00.000Z") },
      { id: 1, examTitle: "Earlier", score: 6, percentage: 60, status: "submitted", submittedAt: new Date("2026-08-10T12:00:00.000Z") },
      { id: 3, examTitle: "Active", score: 0, percentage: 0, status: "in_progress", submittedAt: null },
    ]);
    expect(trend.map(item => item.id)).toEqual([1, 2]);
    expect(trend.map(item => item.percentage)).toEqual([60, 80]);
  });

  it("updates every editable generated-draft field before it is moved into the question builder", () => {
    const drafts = [{ prompt: "Original prompt", options: ["A", "B", "C", "D"] as [string, string, string, string], correctOption: 0, explanation: "Original explanation" }];
    const revised = updateGeneratedDraft(drafts, 0, { prompt: "Revised prompt", correctOption: 2, explanation: "Revised explanation" });
    const revisedOptions = updateGeneratedDraftOption(revised, 0, 1, "Revised B");
    expect(revisedOptions[0]).toEqual({ prompt: "Revised prompt", options: ["A", "Revised B", "C", "D"], correctOption: 2, explanation: "Revised explanation" });
  });

  it("restores only valid saved answers, bookmarks, and navigation after a refresh", () => {
    expect(normalizeExamRecovery({ answers: { 1: 2, 9: 1, 2: 4 }, bookmarkedQuestionIds: [2, 8, 2], activeIndex: 9, savedAt: 123 }, [1, 2, 3])).toEqual({ answers: { 1: 2 }, bookmarkedQuestionIds: [2], activeIndex: 2, savedAt: 123 });
  });

  it("aggregates administrator performance and frequently missed question insights", () => {
    const analytics = buildAdminAnalytics([{ userId: 1, percentage: 80, subject: "Science" }, { userId: 2, percentage: 50, subject: "Science" }, { userId: 1, percentage: 90, subject: "Math" }], [{ questionId: 10, prompt: "Cell structure", subject: "Science", isCorrect: false }, { questionId: 10, prompt: "Cell structure", subject: "Science", isCorrect: true }, { questionId: 11, prompt: "Fractions", subject: "Math", isCorrect: false }]);
    expect(analytics.summary).toEqual({ completedAttempts: 3, averagePercentage: 73, passRate: 67, activeStudents: 2 });
    expect(analytics.mostMissedQuestions[0]).toMatchObject({ questionId: 11, missedCount: 1, missRate: 100 });
  });

  it("allows PDF context only from the administrator-scoped storage prefix", () => {
    expect(isOwnedPdfContextKey("exam-context/7/syllabus.pdf", 7)).toBe(true);
    expect(isOwnedPdfContextKey("exam-context/8/syllabus.pdf", 7)).toBe(false);
  });
});
