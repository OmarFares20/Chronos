// Global in-memory store for typing indicators
// Key: `${senderId}:${receiverId}` -> Value: timestamp of last keystroke
const globalTypingStore = new Map<string, number>();

export function setTyping(senderId: string, receiverId: string) {
  globalTypingStore.set(`${senderId}:${receiverId}`, Date.now());
}

export function isTyping(senderId: string, receiverId: string): boolean {
  const lastTyped = globalTypingStore.get(`${senderId}:${receiverId}`);
  if (!lastTyped) return false;
  // Consider typing active if the last keystroke was within 3 seconds
  return Date.now() - lastTyped < 3000;
}
