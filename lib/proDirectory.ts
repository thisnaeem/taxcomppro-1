import type { Prisma } from "@prisma/client";

/** Plans that include a Find a Pro listing ($79.99/mo Marketplace and up). */
export const DIRECTORY_TIERS = ["MARKETPLACE", "MARKETPLACE_PLUS"] as const;

/** Who appears on Find a Pro: approved professionals, plus anyone on a Marketplace plan. */
export const directoryUserWhere: Prisma.UserWhereInput = {
  OR: [
    { role: "PROFESSIONAL" },
    { tier: { in: [...DIRECTORY_TIERS] } },
  ],
};
