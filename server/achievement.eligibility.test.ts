import { describe, expect, it } from "vitest";
import { hasPassedAssessment } from "../shared/assessmentEligibility";

describe("achievement document eligibility", () => {
  it("allows a passing assessment result to receive a certificate and report", () => {
    expect(hasPassedAssessment(65)).toBe(true);
  });

  it("does not allow a non-passing result to receive a certificate or report", () => {
    expect(hasPassedAssessment(64)).toBe(false);
  });
});
