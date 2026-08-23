export function remainingSeconds(startedAt: Date | string, durationMinutes: number, now = Date.now()) {
  const deadline = new Date(startedAt).getTime() + durationMinutes * 60_000;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
