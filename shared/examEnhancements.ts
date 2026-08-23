export type CategorizedExam = {
  subject: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
};

export function filterCategorizedExams<T extends CategorizedExam>(
  exams: T[],
  subject: string,
  difficulty: string,
) {
  return exams.filter(exam =>
    (subject === "" || exam.subject === subject) &&
    (difficulty === "" || exam.difficulty === difficulty),
  );
}

export function isLowTime(secondsRemaining: number, durationMinutes: number) {
  const threshold = Math.min(300, Math.max(60, Math.round(durationMinutes * 60 * 0.1)));
  return secondsRemaining > 0 && secondsRemaining <= threshold;
}

export function achievementShareCopy(studentName: string, examTitle: string, percentage: number) {
  return `${studentName} has completed ${examTitle} on Examora with ${percentage}% achievement.`;
}

export function achievementShareUrls(shareUrl: string, copy: string) {
  const url = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(copy);
  return {
    linkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
  };
}

export type LeaderboardPeriod = "all" | "weekly" | "monthly";

export function leaderboardPeriodStart(period: LeaderboardPeriod, now = new Date()) {
  if (period === "all") return null;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (period === "weekly" ? 7 : 30));
  return cutoff;
}

export function filterLeaderboardRows<T extends { subject: string; submittedAt: Date | string | null }>(
  rows: T[],
  subject: string,
  period: LeaderboardPeriod,
  now = new Date(),
) {
  const cutoff = leaderboardPeriodStart(period, now);
  return rows.filter(row =>
    (subject === "" || row.subject === subject) &&
    (!cutoff || (row.submittedAt !== null && new Date(row.submittedAt) >= cutoff)),
  );
}

export function toggleQuestionBookmark(bookmarks: Set<number>, questionId: number) {
  const next = new Set(bookmarks);
  if (next.has(questionId)) next.delete(questionId); else next.add(questionId);
  return next;
}

export function isGenerationCountValid(count: number) {
  return Number.isInteger(count) && count >= 1 && count <= 8;
}

export function buildSubmissionReview(questionIds: number[], answers: Record<number, number>, bookmarks: Set<number>) {
  const unansweredQuestionIds = questionIds.filter(questionId => answers[questionId] === undefined);
  const flaggedQuestionIds = questionIds.filter(questionId => bookmarks.has(questionId));
  return {
    answeredCount: questionIds.length - unansweredQuestionIds.length,
    unansweredQuestionIds,
    flaggedQuestionIds,
  };
}

export type PerformanceHistoryRow = {
  id: number;
  examTitle: string;
  score: number;
  percentage: number;
  status: string;
  submittedAt: Date | string | null;
};

export function buildPerformanceTrend(rows: PerformanceHistoryRow[]) {
  return rows
    .filter(row => row.status === "submitted" && row.submittedAt)
    .sort((first, second) => new Date(first.submittedAt as Date | string).getTime() - new Date(second.submittedAt as Date | string).getTime())
    .map(row => ({
      id: row.id,
      assessment: row.examTitle,
      percentage: row.percentage,
      score: row.score,
      label: new Date(row.submittedAt as Date | string).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));
}

export type EditableGeneratedDraft = {
  prompt: string;
  options: readonly string[];
  correctOption: number;
  explanation: string;
};

export function updateGeneratedDraft<T extends EditableGeneratedDraft>(drafts: T[], index: number, update: Partial<Pick<EditableGeneratedDraft, "prompt" | "correctOption" | "explanation">>) {
  return drafts.map((draft, draftIndex) => draftIndex === index ? { ...draft, ...update } as T : draft);
}

export function updateGeneratedDraftOption<T extends EditableGeneratedDraft>(drafts: T[], draftIndex: number, optionIndex: number, value: string) {
  return drafts.map((draft, index) => {
    if (index !== draftIndex) return draft;
    const options = draft.options.map((option, currentIndex) => currentIndex === optionIndex ? value : option);
    return { ...draft, options } as T;
  });
}

export type ExamRecoverySnapshot = {
  answers: Record<number, number>;
  bookmarkedQuestionIds: number[];
  activeIndex: number;
  savedAt: number;
};

export function normalizeExamRecovery(snapshot: Partial<ExamRecoverySnapshot> | null | undefined, questionIds: number[]): ExamRecoverySnapshot {
  const allowed = new Set(questionIds);
  const answers = Object.fromEntries(Object.entries(snapshot?.answers ?? {}).filter(([questionId, option]) => allowed.has(Number(questionId)) && Number.isInteger(option) && option >= 0 && option <= 3).map(([questionId, option]) => [Number(questionId), option]));
  const bookmarkedQuestionIds = Array.from(new Set((snapshot?.bookmarkedQuestionIds ?? []).filter(questionId => allowed.has(questionId))));
  const requestedIndex = typeof snapshot?.activeIndex === "number" && Number.isInteger(snapshot.activeIndex) ? snapshot.activeIndex : 0;
  const activeIndex = Math.min(Math.max(0, requestedIndex), Math.max(0, questionIds.length - 1));
  return { answers, bookmarkedQuestionIds, activeIndex, savedAt: typeof snapshot?.savedAt === "number" ? snapshot.savedAt : 0 };
}

export type AnalyticsAttempt = { userId: number; percentage: number; subject: string };
export type AnalyticsAnswer = { questionId: number; prompt: string | null; subject: string; isCorrect: boolean };

export function buildAdminAnalytics(attempts: AnalyticsAttempt[], answers: AnalyticsAnswer[]) {
  const completedAttempts = attempts.length;
  const averagePercentage = completedAttempts ? Math.round(attempts.reduce((total, attempt) => total + attempt.percentage, 0) / completedAttempts) : 0;
  const passRate = completedAttempts ? Math.round((attempts.filter(attempt => attempt.percentage >= 65).length / completedAttempts) * 100) : 0;
  const subjectMap = new Map<string, { total: number; averageTotal: number }>();
  attempts.forEach(attempt => { const current = subjectMap.get(attempt.subject) ?? { total: 0, averageTotal: 0 }; current.total += 1; current.averageTotal += attempt.percentage; subjectMap.set(attempt.subject, current); });
  const questionMap = new Map<number, { questionId: number; prompt: string; subject: string; totalResponses: number; missedCount: number }>();
  answers.forEach(answer => { const current = questionMap.get(answer.questionId) ?? { questionId: answer.questionId, prompt: answer.prompt || "Question detail unavailable", subject: answer.subject, totalResponses: 0, missedCount: 0 }; current.totalResponses += 1; if (!answer.isCorrect) current.missedCount += 1; questionMap.set(answer.questionId, current); });
  return {
    summary: { completedAttempts, averagePercentage, passRate, activeStudents: new Set(attempts.map(attempt => attempt.userId)).size },
    subjectPerformance: Array.from(subjectMap.entries()).map(([subject, value]) => ({ subject, attempts: value.total, averagePercentage: Math.round(value.averageTotal / value.total) })).sort((a, b) => b.averagePercentage - a.averagePercentage),
    mostMissedQuestions: Array.from(questionMap.values()).map(question => ({ ...question, missRate: Math.round((question.missedCount / question.totalResponses) * 100) })).sort((a, b) => b.missedCount - a.missedCount || b.missRate - a.missRate).slice(0, 8),
  };
}

export function isOwnedPdfContextKey(contextKey: string, userId: number) {
  return contextKey.startsWith(`exam-context/${userId}/`);
}
