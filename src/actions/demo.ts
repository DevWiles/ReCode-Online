"use server";

import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/auth";
import { signIn } from "@/lib/accounts";
import {
  SANDBOX_LIMIT_PER_HOUR,
  createSandbox,
  isDemoMode,
  recentSandboxCount,
} from "@/lib/demo";

export type StartDemoResult =
  | { ok: true; error?: never }
  | { ok?: never; error: "NOT_DEMO" | "RATE_LIMITED" | "UNKNOWN" };

/** Opens a new sandbox account for this visitor and signs them into it. */
export const startDemo = async (): Promise<StartDemoResult> => {
  if (!isDemoMode) return { error: "NOT_DEMO" };

  const context = await getRequestContext();

  if ((await recentSandboxCount(context.ip)) >= SANDBOX_LIMIT_PER_HOUR) {
    return { error: "RATE_LIMITED" };
  }

  try {
    const user = await createSandbox();

    await prisma.loginLog.create({
      data: {
        username: user.username,
        success: true,
        // Doubles as the per-IP counter for the rate limit above
        reason: "DEMO_SANDBOX",
        ip: context.ip,
        userAgent: context.userAgent,
        browser: context.browser,
        os: context.os,
        device: context.device,
      },
    });

    // Session cookie only: closing the browser ends the sandbox visit
    await signIn(user, false);

    return { ok: true };
  } catch (error) {
    console.error("Failed to open a demo sandbox:", error);
    return { error: "UNKNOWN" };
  }
};
