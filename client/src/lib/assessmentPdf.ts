import { jsPDF } from "jspdf";

export type ReviewItem = {
  selectedOption: number | null;
  isCorrect: boolean;
  prompt: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctOption: number | null;
  explanation: string | null;
};

export type CompletedAttempt = {
  attemptId: number;
  examTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  incorrectAnswers: number;
  percentage: number;
  summary: string;
  submittedAt: Date | string | null;
  review: ReviewItem[];
};

const ink = [15, 23, 42] as const;
const mint = [16, 185, 129] as const;
const mist = [236, 253, 245] as const;

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "assessment";
}

function completionDate(value: Date | string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString();
}

function optionsOf(item: ReviewItem) { return [item.optionA, item.optionB, item.optionC, item.optionD]; }

export function downloadCertificate(studentName: string, result: CompletedAttempt) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setFillColor(...ink); doc.rect(0, 0, width, height, "F");
  doc.setFillColor(...mist); doc.roundedRect(10, 10, width - 20, height - 20, 5, 5, "F");
  doc.setDrawColor(...mint); doc.setLineWidth(0.8); doc.roundedRect(16, 16, width - 32, height - 32, 3, 3, "S");
  doc.setTextColor(...mint); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("EXAMORA", width / 2, 36, { align: "center", charSpace: 2 });
  doc.setTextColor(...ink); doc.setFont("times", "italic"); doc.setFontSize(16); doc.text("Certificate of Achievement", width / 2, 57, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(71, 85, 105); doc.text("This certificate is proudly presented to", width / 2, 76, { align: "center" });
  doc.setFont("times", "bold"); doc.setFontSize(29); doc.setTextColor(...ink); doc.text(studentName || "Examora Learner", width / 2, 95, { align: "center" });
  doc.setDrawColor(167, 243, 208); doc.setLineWidth(0.5); doc.line(width / 2 - 55, 103, width / 2 + 55, 103);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(71, 85, 105); doc.text("for successfully completing", width / 2, 117, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(...ink); doc.text(result.examTitle, width / 2, 130, { align: "center", maxWidth: 180 });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(71, 85, 105); doc.text(`${result.subject}  •  ${result.percentage}% achievement  •  ${completionDate(result.submittedAt)}`, width / 2, 144, { align: "center" });
  doc.setFillColor(...mint); doc.roundedRect(width / 2 - 19, 154, 38, 18, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(255, 255, 255); doc.text(`${result.percentage}%`, width / 2, 166, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(`Certificate ID: EXM-${result.attemptId}-${new Date(result.submittedAt || Date.now()).getFullYear()}`, 24, height - 25); doc.text("Examora · Focused assessment, meaningful progress", width - 24, height - 25, { align: "right" });
  doc.save(`examora-certificate-${safeName(result.examTitle)}.pdf`);
}

export function downloadPerformanceReport(studentName: string, result: CompletedAttempt) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 0;
  const addHeader = () => { doc.setFillColor(...ink); doc.rect(0, 0, width, 30, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("Examora performance report", margin, 17); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(167, 243, 208); doc.text("FOCUSED ASSESSMENT · MEANINGFUL PROGRESS", margin, 23); y = 43; };
  const ensureSpace = (needed: number) => { if (y + needed > 277) { doc.addPage(); addHeader(); } };
  addHeader();
  doc.setTextColor(...ink); doc.setFont("times", "bold"); doc.setFontSize(23); doc.text(result.examTitle, margin, y); y += 9;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(71, 85, 105); doc.text(`${studentName || "Examora Learner"} · ${result.subject} · Completed ${completionDate(result.submittedAt)}`, margin, y); y += 13;
  doc.setFillColor(...mist); doc.roundedRect(margin, y, width - margin * 2, 33, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(21); doc.setTextColor(...mint); doc.text(`${result.percentage}%`, margin + 12, y + 17); doc.setFontSize(9); doc.setTextColor(...ink); doc.text("Overall achievement", margin + 12, y + 24); doc.setFontSize(11); doc.text(`${result.score}/${result.totalQuestions} correct`, margin + 65, y + 15); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(71, 85, 105); doc.text(`${result.incorrectAnswers} to revisit`, margin + 65, y + 23); y += 44;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...ink); doc.text("Performance summary", margin, y); y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(71, 85, 105); const summaryLines = doc.splitTextToSize(result.summary, width - margin * 2); doc.text(summaryLines, margin, y); y += summaryLines.length * 5 + 9;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...ink); doc.text("Question-by-question review", margin, y); y += 7;
  result.review.forEach((item, index) => { const options = optionsOf(item); const promptLines = doc.splitTextToSize(`${index + 1}. ${item.prompt || "Question detail unavailable"}`, width - margin * 2 - 8); const explanationLines = doc.splitTextToSize(`Explanation: ${item.explanation || "Not available."}`, width - margin * 2 - 8); const required = 15 + promptLines.length * 4.5 + explanationLines.length * 4.3; ensureSpace(required); const cardColor = item.isCorrect ? mist : [255, 251, 235] as const; doc.setFillColor(cardColor[0], cardColor[1], cardColor[2]); doc.roundedRect(margin, y - 4, width - margin * 2, required, 2, 2, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...ink); doc.text(promptLines, margin + 4, y + 2); y += promptLines.length * 4.5 + 4; const selected = item.selectedOption === null ? "No answer" : `${String.fromCharCode(65 + item.selectedOption)}. ${options[item.selectedOption] || "—"}`; const correct = `${String.fromCharCode(65 + (item.correctOption ?? 0))}. ${options[item.correctOption ?? 0] || "—"}`; doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); const responseColor = item.isCorrect ? mint : [180, 83, 9] as const; doc.setTextColor(responseColor[0], responseColor[1], responseColor[2]); doc.text(`${item.isCorrect ? "Correct" : "Your answer"}: ${item.isCorrect ? correct : selected}`, margin + 4, y); y += 5; if (!item.isCorrect) { doc.setTextColor(...mint); doc.text(`Correct answer: ${correct}`, margin + 4, y); y += 5; } doc.setTextColor(71, 85, 105); doc.text(explanationLines, margin + 4, y); y += explanationLines.length * 4.3 + 8; });
  doc.save(`examora-performance-report-${safeName(result.examTitle)}.pdf`);
}

export type InstructorAssignmentReport = {
  id: number;
  title: string;
  cohortName: string;
  examTitle: string;
  scheduledAt: Date | string;
  dueAt: Date | string | null;
  learnerCount: number;
  attemptCount: number;
  completionCount: number;
  averagePercentage: number | null;
};

export type InstructorProgressReportRow = {
  assignmentId: number;
  learnerName: string | null;
  attemptStatus: "in_progress" | "submitted" | null;
  percentage: number | null;
  submittedAt: Date | string | null;
};

export function downloadInstructorProgressReport(instructorName: string, assignments: InstructorAssignmentReport[], progressRows: InstructorProgressReportRow[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 0;
  const addHeader = () => { doc.setFillColor(...ink); doc.rect(0, 0, width, 31, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("Examora cohort progress report", margin, 17); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(167, 243, 208); doc.text("INSTRUCTOR-READY · ASSIGNMENT COMPLETION OVERVIEW", margin, 23); y = 43; };
  const ensureSpace = (needed: number) => { if (y + needed > 278) { doc.addPage(); addHeader(); } };
  const totalSlots = assignments.reduce((total, assignment) => total + Number(assignment.learnerCount), 0);
  const completed = assignments.reduce((total, assignment) => total + Number(assignment.completionCount), 0);
  const completion = totalSlots ? Math.round((completed / totalSlots) * 100) : 0;
  addHeader();
  doc.setTextColor(...ink); doc.setFont("times", "bold"); doc.setFontSize(21); doc.text("Cohort progress overview", margin, y); y += 9;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(71, 85, 105); doc.text(`Prepared for ${instructorName || "Examora Instructor"} · ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`, margin, y); y += 12;
  doc.setFillColor(...mist); doc.roundedRect(margin, y, width - margin * 2, 30, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(...mint); doc.text(`${completion}%`, margin + 11, y + 16); doc.setFontSize(8.5); doc.setTextColor(...ink); doc.text("overall completion", margin + 11, y + 23); doc.setFontSize(10); doc.text(`${completed}/${totalSlots} submitted`, margin + 64, y + 13); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(71, 85, 105); doc.text(`${assignments.length} scheduled assignment${assignments.length === 1 ? "" : "s"} included`, margin + 64, y + 21); y += 42;
  if (!assignments.length) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(71, 85, 105); doc.text("No scheduled cohort assignments are available yet.", margin, y); doc.save("examora-cohort-progress-report.pdf"); return; }
  assignments.forEach(assignment => {
    const learners = progressRows.filter(row => row.assignmentId === assignment.id);
    const rate = assignment.learnerCount ? Math.round((assignment.completionCount / assignment.learnerCount) * 100) : 0;
    const details = learners.length ? learners.map(row => `${row.learnerName || "Learner"}: ${row.attemptStatus === "submitted" ? `${row.percentage ?? 0}% completed` : row.attemptStatus === "in_progress" ? "attempt in progress" : "not started"}`) : ["No learners have joined this cohort yet."];
    const detailLines = details.flatMap(detail => doc.splitTextToSize(detail, width - margin * 2 - 10));
    const required = 33 + detailLines.length * 4.5;
    ensureSpace(required);
    doc.setFillColor(248, 250, 252); doc.roundedRect(margin, y - 4, width - margin * 2, required, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...ink); doc.text(assignment.title, margin + 5, y + 3); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(71, 85, 105); doc.text(`${assignment.cohortName} · ${assignment.examTitle} · Opens ${completionDate(assignment.scheduledAt)}`, margin + 5, y + 9); doc.setFont("helvetica", "bold"); doc.setTextColor(...mint); doc.text(`${assignment.completionCount}/${assignment.learnerCount} complete (${rate}%)`, width - margin - 5, y + 3, { align: "right" }); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139); doc.text(`Average submitted outcome: ${assignment.averagePercentage === null ? "—" : `${assignment.averagePercentage}%`}`, width - margin - 5, y + 9, { align: "right" }); y += 17; doc.setFontSize(8.5); doc.setTextColor(71, 85, 105); doc.text(detailLines, margin + 5, y); y += detailLines.length * 4.5 + 12;
  });
  doc.save(`examora-cohort-progress-${safeName(instructorName || "instructor")}.pdf`);
}
