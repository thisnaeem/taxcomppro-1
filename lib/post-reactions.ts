import { prisma } from "@/lib/prisma";
import { isReaction, type ReactionCounts } from "@/lib/reactions";

export async function reactionSummaries(postIds: string[]) {
  if (!postIds.length) return {} as Record<string, ReactionCounts>;
  const rows = await prisma.postLike.groupBy({ by: ["postId", "reaction"], where: { postId: { in: postIds } }, _count: { _all: true } });
  const result: Record<string, ReactionCounts> = {};
  for (const row of rows) {
    if (!isReaction(row.reaction)) continue;
    (result[row.postId] ??= {})[row.reaction] = row._count._all;
  }
  return result;
}
