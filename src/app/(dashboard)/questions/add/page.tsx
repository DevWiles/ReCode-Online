import { requireUser } from "@/lib/auth";

import AddQuestionContainer from "@/components/questions/AddQuestionContainer";

export default async function QuestionAddPage() {
  const user = await requireUser();

  return <AddQuestionContainer preferredLang={user.preferredLang} />;
}
