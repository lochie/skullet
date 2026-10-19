import { fill } from "./snapshot";

declare const process: { env: { NODE_ENV?: string } };

let dev = false;
try {
  // Bundlers replace the whole expression; with none, `process` doesn't exist
  dev = process.env.NODE_ENV !== "production";
} catch {
  dev = false;
}

export const isDev = dev;

const warned = new Set<string>();

export function warnOnce(id: string, message: string) {
  if (!isDev || warned.has(id)) return;
  warned.add(id);
  // eslint-disable-next-line no-console
  console.warn(`[skele] ${message}`);
}

const URL_LIKE = /^(https?:|\/|data:|blob:)/;

/** Same keys and lengths as `data`, with every string replaced by filler. */
export function sampleFrom(data: unknown): unknown {
  if (typeof data === "string") return URL_LIKE.test(data) ? "" : fill(data);
  if (Array.isArray(data)) return data.map(sampleFrom);
  if (data instanceof Date) return data;
  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, sampleFrom(value)]),
    );
  }
  return data;
}
