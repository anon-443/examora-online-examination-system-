import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("repository documentation and automation", () => {
  it("ships comprehensive setup guidance and a CI quality gate", async () => {
    const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
    const workflow = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
    expect(readme).toContain("# Examora — Online Examination System");
    expect(readme).toContain("## Testing and CI");
    expect(workflow).toContain("pnpm check");
    expect(workflow).toContain("pnpm test");
    expect(workflow).toContain("pnpm build");
  });

  it("registers advanced study, practice, and exam-readiness destinations", async () => {
    const app = await readFile(new URL("../client/src/App.tsx", import.meta.url), "utf8");
    const spaces = await readFile(new URL("../client/src/pages/StudySpaces.tsx", import.meta.url), "utf8");
    expect(app).toContain('path="/study-hub"');
    expect(app).toContain('path="/practice"');
    expect(app).toContain('path="/exam-guide"');
    expect(spaces).toContain("PracticeLab");
    expect(spaces).toContain("ExamGuide");
  });
});
