export type MarkableQuestion = {
  id: number;
  correctOption: number;
};

export type ScoringResult = {
  score: number;
  incorrectAnswers: number;
  percentage: number;
  summary: string;
};

export function calculateAssessmentScore(
  questions: MarkableQuestion[],
  selectedAnswers: Map<number, number>,
): ScoringResult {
  const score = questions.reduce(
    (total, question) => total + Number(selectedAnswers.get(question.id) === question.correctOption),
    0,
  );
  const incorrectAnswers = questions.length - score;
  const percentage = questions.length === 0 ? 0 : Math.round((score / questions.length) * 100);
  const summary =
    percentage >= 85
      ? "Excellent work. You demonstrated strong mastery of this assessment."
      : percentage >= 65
        ? "Good progress. Review the missed concepts to strengthen your understanding."
        : "Keep learning. Revisit the topic and try another assessment when you are ready.";

  return { score, incorrectAnswers, percentage, summary };
}
