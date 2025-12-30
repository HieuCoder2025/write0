export const STORAGE_KEYS = {
  documents: 'write0_docs',
  activeDocumentId: 'write0_active',
  settings: 'write0_settings',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

let localStorageAvailable: boolean | null = null;

function canUseLocalStorage(): boolean {
  if (localStorageAvailable != null) return localStorageAvailable;

  try {
    const testKey = '__w0_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    localStorageAvailable = true;
    return localStorageAvailable;
  } catch {
    localStorageAvailable = false;
    return localStorageAvailable;
  }
}

export function readJson<T>(key: StorageKey, fallback: T): T {
  if (!canUseLocalStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(
  key: StorageKey,
  value: unknown,
): { ok: true } | { ok: false; reason: 'unavailable' | 'quota' | 'unknown' } {
  if (!canUseLocalStorage()) return { ok: false, reason: 'unavailable' };

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    const maybeDomException = error as { name?: string };
    if (maybeDomException?.name === 'QuotaExceededError') {
      return { ok: false, reason: 'quota' };
    }
    return { ok: false, reason: 'unknown' };
  }
}
