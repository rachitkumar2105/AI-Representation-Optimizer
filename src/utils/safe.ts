/**
 * Production-Grade Safety Utilities
 * Prevents NaN, undefined propagation, and runtime crashes.
 */

export function safeNumber(val: any, fallback = 0): number {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : fallback;
}

export function safeString(val: any, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  return String(val).trim();
}

export function safeArray<T>(val: any): T[] {
  return Array.isArray(val) ? val : [];
}

export function safeAccess<T>(obj: any, path: string, fallback: T): T {
  try {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) return fallback;
      current = current[key];
    }
    return current !== undefined ? current : fallback;
  } catch {
    return fallback;
  }
}
