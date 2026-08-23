import { buildAnalyticsCsv } from "@shared/examEnhancements";

export function downloadAnalyticsCsv(analytics: Parameters<typeof buildAnalyticsCsv>[0]) {
  const blob = new Blob([buildAnalyticsCsv(analytics)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `examora-performance-statistics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
