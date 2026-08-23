import { Button } from "@/components/ui/button";
import { downloadCertificate, downloadPerformanceReport, type CompletedAttempt } from "@/lib/assessmentPdf";
import { hasPassedAssessment } from "@shared/assessmentEligibility";
import { Award, Download } from "lucide-react";

export function StudentDocumentActions({ result, studentName, compact = false }: { result: CompletedAttempt; studentName: string; compact?: boolean }) {
  if (!hasPassedAssessment(result.percentage)) return null;
  return <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-3"}`}>
    <Button size="sm" onClick={() => downloadCertificate(studentName, result)} className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"><Award className="mr-1 size-3.5" />Certificate</Button>
    <Button size="sm" variant="outline" onClick={() => downloadPerformanceReport(studentName, result)} className="rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/30 dark:text-emerald-300 dark:hover:bg-emerald-400/10"><Download className="mr-1 size-3.5" />Performance report</Button>
  </div>;
}
