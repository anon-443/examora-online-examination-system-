import type { Request, Response } from "express";
import * as db from "../db";
import { sdk } from "../_core/sdk";

export async function handleDeadlineAlerts(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req as unknown as Request);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const schedule = await db.getNotificationScheduleByTaskUid(user.taskUid);
    if (!schedule || schedule.scheduleKey !== "deadline-alerts") return res.json({ ok: true, skipped: "orphan" });
    const delivered = await db.dispatchUpcomingDeadlineAlerts();
    return res.json({ ok: true, delivered, taskUid: user.taskUid });
  } catch (error) {
    return res.status(500).json({ error: String(error), timestamp: new Date().toISOString() });
  }
}
