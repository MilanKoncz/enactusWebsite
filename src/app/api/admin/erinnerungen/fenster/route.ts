import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { findRecruitingWindowById } from "@/lib/db";
import { sendReminderWindowMailsForWindow } from "@/lib/reminderWindowMail";

/**
 * The board's safety net for launch day: lets an admin fire the "window is
 * open" mail for one window on demand, without waiting on the next 03:00
 * UTC cron slot. Calls the exact same sendReminderWindowMailsForWindow the
 * cron uses, so the once-per-(signup, window) unique constraint protects
 * this path identically — pressing the button twice, or racing an actual
 * cron run, simply skips whoever was already mailed.
 */
const requestSchema = z.object({ windowId: z.guid() });

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const window = await findRecruitingWindowById(parsed.data.windowId);
  if (!window) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const result = await sendReminderWindowMailsForWindow(window);
  return NextResponse.json({ ok: true, ...result });
}
