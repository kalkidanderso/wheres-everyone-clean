export const EMOJIS = ['👤', '😊', '🚀', '🌟', '🎮', '🎨', '🎵', '🏃', '🌈', '🍕'] as const;

export type EmojiType = typeof EMOJIS[number]; 