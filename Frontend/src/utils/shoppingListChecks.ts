// Per-device check-off state for a generated shopping list, keyed by user +
// date range, with a self-expiring window (browser-side equivalent of a TTL).
const EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

type Stored = { checked: string[]; expiresAt: number };

function keyFor(userId: string, start: string, end: string) {
  return `shoppingList:${userId}:${start}_${end}`;
}

export function loadChecks(userId: string, start: string, end: string): string[] {
  try {
    const raw = localStorage.getItem(keyFor(userId, start, end));
    if (!raw) return [];
    const parsed: Stored = JSON.parse(raw);
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(keyFor(userId, start, end));
      return [];
    }
    return Array.isArray(parsed.checked) ? parsed.checked : [];
  } catch {
    return [];
  }
}

export function saveChecks(userId: string, start: string, end: string, checked: string[]) {
  try {
    const value: Stored = { checked, expiresAt: Date.now() + EXPIRY_MS };
    localStorage.setItem(keyFor(userId, start, end), JSON.stringify(value));
  } catch {
    // storage unavailable/full — check state is best-effort, ignore
  }
}

export function toggleCheck(current: string[], name: string): string[] {
  return current.includes(name)
    ? current.filter((n) => n !== name)
    : [...current, name];
}
