import { requireUser } from "@/lib/auth";

import AccountClient from "@/components/account/AccountClient";
import { DEMO_TTL_HOURS, isDemoMode } from "@/lib/demo";

export default async function AccountPage() {
  // The one page an account without a verified email may open
  const user = await requireUser({ allowUnverified: true });

  // A sandbox has no email or password to manage
  if (isDemoMode) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-white/60 bg-white/70 p-8 text-gray-600 shadow-sm">
        <h1 className="text-2xl font-extrabold text-gray-900">演示账号</h1>
        <p className="mt-3 leading-relaxed">
          你正在使用临时沙盒账号 <span className="font-mono font-semibold text-gray-900">{user.username}</span>
          ，不需要绑定邮箱或设置密码。沙盒里的数据只有你能看到，{DEMO_TTL_HOURS} 小时后自动清除。
        </p>
      </div>
    );
  }

  return (
    <AccountClient
      uiLanguage={user.uiLanguage === "zh" ? "zh" : "en"}
      username={user.username}
      email={user.email}
      emailVerified={Boolean(user.emailVerifiedAt)}
    />
  );
}
