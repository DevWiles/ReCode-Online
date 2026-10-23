import { requireUser } from "@/lib/auth";

import AccountClient from "@/components/account/AccountClient";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <AccountClient
      uiLanguage={user.uiLanguage === "zh" ? "zh" : "en"}
      username={user.username}
      email={user.email}
      emailVerified={Boolean(user.emailVerifiedAt)}
    />
  );
}
