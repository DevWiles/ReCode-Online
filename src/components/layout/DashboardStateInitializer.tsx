"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";

export default function DashboardStateInitializer({ user }: { user: any }) {
  const { setLanguage, setUsername, setRole, setPreferredLang } = useUserStore();

  useEffect(() => {
    if (user) {
      setLanguage(user.uiLanguage);
      setUsername(user.username);
      setRole(user.role);
      setPreferredLang(user.preferredLang);
    }
  }, [user, setLanguage, setUsername, setRole, setPreferredLang]);

  return null;
}
