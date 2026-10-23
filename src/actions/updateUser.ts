"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { type UpdateUserProps } from "@/types";

export const updateUserPreferences = async ({
  preferredLang,
  uiLanguage,
  dailyReviewLimit,
}: UpdateUserProps) => {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferredLang,
        uiLanguage,
        dailyReviewLimit,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Update failed:", error);
    return { success: false, error: "Update failed" };
  }
};
