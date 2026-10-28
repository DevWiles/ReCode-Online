import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Bumped whenever the shape below changes, so an old backup can still be read
const EXPORT_VERSION = 1;

/**
 * Everything the signed-in user has practiced, as a JSON file they keep.
 * Only their own rows; no password hash, session data or internal ids.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const problems = await prisma.problem.findMany({
    where: { userId: user.id },
    orderBy: [{ platform: "asc" }, { pid: "asc" }],
    include: {
      progress: {
        where: { userId: user.id },
        include: { submissions: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  const data = {
    app: "ReCode",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    account: {
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      settings: {
        preferredLang: user.preferredLang,
        uiLanguage: user.uiLanguage,
        themeColor: user.themeColor,
        dailyReviewLimit: user.dailyReviewLimit,
      },
    },
    problemCount: problems.length,
    problems: problems.map((problem) => {
      const progress = problem.progress[0];
      return {
        platform: problem.platform,
        pid: problem.pid,
        title: problem.title,
        slug: problem.slug,
        url: problem.url,
        difficulty: problem.difficulty,
        difficultyLevel: problem.difficultyLevel,
        tags: problem.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        progress: progress && {
          status: progress.status,
          masteryLevel: progress.masteryLevel,
          interval: progress.interval,
          easiness: progress.easiness,
          reviewCount: progress.reviewCount,
          lastReview: progress.lastReview,
          nextReview: progress.nextReview,
          createdAt: progress.createdAt,
          updatedAt: progress.updatedAt,
        },
        solutions: (progress?.submissions ?? []).map((submission) => ({
          label: submission.label,
          language: submission.language,
          isMain: submission.isMain,
          code: submission.code,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
        })),
      };
    }),
  };

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `recode-${user.username}-${date}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
