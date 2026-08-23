import { describe, expect, it } from "vitest";
import { calculateAssessmentScore } from "./scoring";

describe("calculateAssessmentScore", () => {
  const questions = [
    { id: 1, correctOption: 0 },
    { id: 2, correctOption: 2 },
    { id: 3, correctOption: 1 },
  ];

  it("calculates correct, incorrect, percentage, and feedback from submitted responses", () => {
    const result = calculateAssessmentScore(questions, new Map([[1, 0], [2, 3], [3, 1]]));

    expect(result).toEqual({
      score: 2,
      incorrectAnswers: 1,
      percentage: 67,
      summary: "Good progress. Review the missed concepts to strengthen your understanding.",
    });
  });

  it("counts unanswered questions as incorrect and avoids dividing by zero", () => {
    expect(calculateAssessmentScore([], new Map())).toEqual({
      score: 0,
      incorrectAnswers: 0,
      percentage: 0,
      summary: "Keep learning. Revisit the topic and try another assessment when you are ready.",
    });
  });
});
