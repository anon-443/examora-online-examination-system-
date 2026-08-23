export type AssignmentProgressState = "completed" | "in_progress" | "due_soon" | "ready" | "scheduled" | "overdue";

export function completionRate(completed: number, learners: number) {
  if (learners <= 0) return 0;
  return Math.round((Math.max(0, completed) / learners) * 100);
}

export function getAssignmentProgressState(input: {
  scheduledAt: Date | string;
  dueAt?: Date | string | null;
  attemptStatus?: "in_progress" | "submitted" | null;
  now?: Date;
}): AssignmentProgressState {
  const now = input.now ?? new Date();
  const scheduledAt = new Date(input.scheduledAt);
  const dueAt = input.dueAt ? new Date(input.dueAt) : null;
  if (input.attemptStatus === "submitted") return "completed";
  if (dueAt && dueAt.getTime() < now.getTime()) return "overdue";
  if (input.attemptStatus === "in_progress") return "in_progress";
  if (scheduledAt.getTime() > now.getTime()) return "scheduled";
  if (dueAt && dueAt.getTime() - now.getTime() <= 48 * 60 * 60 * 1000) return "due_soon";
  return "ready";
}

export function summarizeLearnerAssignments<T extends { attemptStatus?: "in_progress" | "submitted" | null; scheduledAt: Date | string; dueAt?: Date | string | null }>(assignments: T[], now = new Date()) {
  const states = assignments.map(assignment => getAssignmentProgressState({ ...assignment, now }));
  const completed = states.filter(state => state === "completed").length;
  return {
    total: assignments.length,
    completed,
    inProgress: states.filter(state => state === "in_progress").length,
    dueSoon: states.filter(state => state === "due_soon").length,
    overdue: states.filter(state => state === "overdue").length,
    completionRate: completionRate(completed, assignments.length),
  };
}

export function buildCohortCompletionTrend<T extends { id: number; title: string; cohortName: string; scheduledAt: Date | string; completionCount: number; learnerCount: number }>(assignments: T[]) {
  return [...assignments]
    .sort((first, second) => new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime())
    .map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      cohortName: assignment.cohortName,
      label: new Date(assignment.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      completion: completionRate(Number(assignment.completionCount), Number(assignment.learnerCount)),
      completed: Number(assignment.completionCount),
      learners: Number(assignment.learnerCount),
    }));
}
