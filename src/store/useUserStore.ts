import { create } from "zustand";
import { type UserState } from "@/types";

export const useUserStore = create<UserState>((set) => ({
  uiLanguage: "zh",
  themeColor: "emerald",
  username: "No username",
  role: "USER",
  preferredLang: "typescript",
  dailyReviewLimit: 50,
  isSettingModalOpen: false,

  setLanguage: (lang) => set({ uiLanguage: lang }),
  setTheme: (color) => set({ themeColor: color }),
  setUsername: (name) => set({ username: name }),
  setRole: (role) => set({ role }),
  setPreferredLang: (preLang) => set({ preferredLang: preLang }),
  setDailyReviewLimit: (limit: number) => set({ dailyReviewLimit: limit }),
  setIsSettingModalOpen: (status: boolean) => set({ isSettingModalOpen: status }),
}));
