export const REACTIONS = [
  { type: "LIKE", label: "Like", emoji: "👍" },
  { type: "LOVE", label: "Love", emoji: "❤️" },
  { type: "CARE", label: "Care", emoji: "🤗" },
  { type: "HAHA", label: "Haha", emoji: "😆" },
  { type: "WOW", label: "Wow", emoji: "😮" },
  { type: "SAD", label: "Sad", emoji: "😢" },
  { type: "ANGRY", label: "Angry", emoji: "😠" },
] as const;
export type ReactionType = (typeof REACTIONS)[number]["type"];
export type ReactionCounts = Partial<Record<ReactionType, number>>;
export function isReaction(value: unknown): value is ReactionType {
  return REACTIONS.some(reaction => reaction.type === value);
}
