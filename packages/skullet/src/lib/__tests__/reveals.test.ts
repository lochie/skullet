import { describe, expect, it, vi } from "vitest";
import { exitDuration, revealSpec } from "../reveals";
import { sequence, smart, together } from "../plan";
import { sweep } from "../sweep";

describe("revealSpec", () => {
  it("resolves each built-in name to its spec", () => {
    expect(revealSpec("together")).toBe(together);
    expect(revealSpec("sequence")).toBe(sequence);
    expect(revealSpec("smart")).toBe(smart);
    expect(revealSpec("sweep")).toBe(sweep);
  });

  it("defaults to smart with no argument", () => {
    expect(revealSpec()).toBe(smart);
    expect(revealSpec(undefined)).toBe(smart);
  });

  it("passes a custom spec object through unchanged", () => {
    const custom = { order: "together" as const, duration: 10 };
    expect(revealSpec(custom)).toBe(custom);
  });

  it("falls back to smart instead of throwing on an unknown name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // @ts-expect-error exercising what an HTML attribute (or any other untyped caller) can pass
    expect(revealSpec("fade")).toBe(smart);
    // @ts-expect-error same — "instant" is a RevealSpec export, not one of the four names
    expect(revealSpec("instant")).toBe(smart);
    warn.mockRestore();
  });
});

describe("exitDuration", () => {
  it("doesn't throw for an unknown name either", () => {
    // @ts-expect-error see revealSpec's own test above
    expect(() => exitDuration("fade")).not.toThrow();
  });
});
