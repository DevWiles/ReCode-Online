import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

import QuestionsPageClient from "@/components/questions/QuestionsPageClient";

import { QuestionRowData } from "@/types";

export default async function QuestionsPage() {
  const user = await requireUser();

  // get all Progress of this user
  const rawProgress = await prisma.progress.findMany({
    where: {
      userId: user.id,
      status: { not: "Todo" },
    },
    include: {
      problem: true,
      submissions: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const questions: QuestionRowData[] = rawProgress.map((p) => ({
    id: p.id,
    status: p.status,
    masteryLevel: p.masteryLevel,
    updatedAt: p.updatedAt,

    problem: {
      id: p.problem.id,
      pid: p.problem.pid,
      title: p.problem.title,
      difficulty: p.problem.difficulty,
      // the data in database is "DP,Array"
      tags: p.problem.tags,
      url: p.problem.url || "",
    },

    submissions: p.submissions.map((s) => ({
      id: s.id,
      label: s.label,
      language: s.language,
      code: s.code,
    })),
  }));

  return <QuestionsPageClient initialQuestions={questions} />;
}
