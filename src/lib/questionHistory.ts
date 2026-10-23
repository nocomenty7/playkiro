/**
 * Streamer question history (shared by Room/PIN mode and Chat-linked mode).
 *
 * Stored per-browser in localStorage so that subsequent rounds (and following days)
 * do not repeat questions the host has already shown on stream.
 * The key is kept identical to the legacy key so existing history is preserved.
 */
export const STREAMER_HISTORY_KEY = 'kiro_streamer_used_questions';

type QId = string | number;

export const getStreamerHistory = (): any[] => {
  try {
    const raw = localStorage.getItem(STREAMER_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => id !== null && id !== undefined) : [];
  } catch {
    return [];
  }
};

export const addToStreamerHistory = (ids: QId[]) => {
  try {
    if (!ids || ids.length === 0) return;
    const current = getStreamerHistory();
    const known = new Set(current.map(String));
    const next = [...current];
    for (const id of ids) {
      if (id === null || id === undefined) continue;
      if (!known.has(String(id))) {
        known.add(String(id));
        next.push(id);
      }
    }
    localStorage.setItem(STREAMER_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
};

export const clearStreamerHistory = () => {
  try {
    localStorage.removeItem(STREAMER_HISTORY_KEY);
  } catch {
    // ignore storage errors
  }
};

/**
 * Picks a replacement question for "pass" while avoiding duplicates.
 * Priority:
 *  1. Selected categories, not in this room, not in history
 *  2. Any category, not in this room, not in history
 *  3. Selected categories, not in this room (history ignored)
 *  4. Any category, not in this room (history ignored)
 * Returns null when every question is already in the current room.
 */
export const pickReplacementQuestion = <T extends { id: QId }>(
  categoryPool: T[],
  fullPool: T[],
  roomQuestionIds: QId[],
  history: QId[]
): T | null => {
  const inRoom = new Set((roomQuestionIds || []).map(String));
  const seen = new Set((history || []).map(String));
  const pick = (arr: T[]) => (arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null);

  const tiers: T[][] = [
    categoryPool.filter((q) => !inRoom.has(String(q.id)) && !seen.has(String(q.id))),
    fullPool.filter((q) => !inRoom.has(String(q.id)) && !seen.has(String(q.id))),
    categoryPool.filter((q) => !inRoom.has(String(q.id))),
    fullPool.filter((q) => !inRoom.has(String(q.id))),
  ];

  for (const tier of tiers) {
    const chosen = pick(tier);
    if (chosen) return chosen;
  }
  return null;
};
