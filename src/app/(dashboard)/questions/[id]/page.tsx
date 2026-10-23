import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuestionEditor from "@/components/questions/QuestionEditor";
import { EditorFormData } from "@/types/editor";

interface QuestionEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuestionEditPage({
  params,
}: QuestionEditPageProps) {
  const user = await requireUser();

  const { id } = await params;

  // every solution, in the order they appear in the list
  const progress = await prisma.progress.findFirst({
    where: {
      id: id,
      userId: user.id,
    },
    include: {
      problem: true,
      submissions: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!progress) {
    redirect("/questions");
  }

  const initialData: EditorFormData = {
    pid: progress.problem.pid,
    title: progress.problem.title,
    difficulty: progress.problem.difficulty,
    // the data in database is "DP,Array", tansform to array
    tags: progress.problem.tags ? progress.problem.tags.split(",") : [],
    link: progress.problem.url || "",
    solutions: progress.submissions.map((submission) => ({
      id: submission.id,
      label: submission.label,
      language: submission.language || user.preferredLang,
      code: submission.code,
    })),
    masteryLevel: progress.masteryLevel,
  };

  return (
    <QuestionEditor
      mode="edit"
      initialData={initialData}
      preferredLang={user.preferredLang}
    />
  );
}
