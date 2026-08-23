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
