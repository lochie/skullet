import { serialize } from "./snapshot";

const STORAGE_KEY = "skele:shapes";
const VERSION = 2; // Bumped whenever the stored markup changes meaning
const MAX_SHAPES = 50;
const MAX_LENGTH = 20_000;

type Stored = Record<string, string>; // Oldest first

// Real text, kept in memory only — exact for a reload within the same visit
const session = new Map<string, string>();
const shown = new Map<string, Set<() => void>>();

/** Registers a save for content on screen under `key`; returns its unregister. */
export function trackShape(key: string, save: () => void) {
  if (!shown.has(key)) shown.set(key, new Set());
  shown.get(key)!.add(save);
  return () => shown.get(key)?.delete(save);
}

/** Saves every shown copy of `key` now, so a skeleton about to recall it gets the latest. */
export function flushShapes(key: string) {
  for (const save of shown.get(key) ?? []) save();
}

function read(): Stored {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return parsed?.v === VERSION ? parsed.shapes : {};
  } catch {
    return {};
  }
}

function write(shapes: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, shapes }));
  } catch {
    // Storage full or blocked; the session copy still covers this visit
  }
}

export function rememberShape(key: string, element: HTMLElement) {
  session.set(key, serialize(element, false));

  const html = serialize(element, true);
  if (html.length > MAX_LENGTH) return;

  const shapes = read();
  // Re-inserted so it moves to the end: key order is recency
  delete shapes[key];
  shapes[key] = html;
  const keys = Object.keys(shapes);
  for (const stale of keys.slice(0, keys.length - MAX_SHAPES)) {
    delete shapes[stale];
  }
  write(shapes);
}

export function recallShape(key: string): string | null {
  return session.get(key) ?? read()[key] ?? null;
}

/** Forgets remembered shapes — call it on sign-out. */
export function forgetShapes({ persisted = true } = {}) {
  session.clear();
  if (!persisted) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored to forget
  }
}
