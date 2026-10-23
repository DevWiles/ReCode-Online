import { requireUser } from "@/lib/auth";

import AccountClient from "@/components/account/AccountClient";

export default async function AccountPage() {
  // The one page an account without a verified email may open
  const user = await requireUser({ allowUnverified: true });

  return (
    <AccountClient
      uiLanguage={user.uiLanguage === "zh" ? "zh" : "en"}
      username={user.username}
      email={user.email}
      emailVerified={Boolean(user.emailVerifiedAt)}
    />
  );
}
