import { CASCADE_SPREAD, FADE_DURATION } from "./constants";
import {
  MAX_DELAY,
  MAX_DURATION,
  sequence,
  smart,
  together,
  type RevealMode,
  type RevealSpec,
} from "./plan";
import { sweep, SWEEP_SPREAD } from "./sweep";

const NAMED = { together, sequence, smart, sweep };

export const revealSpec = (mode: RevealMode = "smart"): RevealSpec =>
  typeof mode === "string" ? NAMED[mode] : mode;

/** Longest a pane can take to leave under `mode`, for a framework that has to know up front. */
export function exitDuration(mode?: RevealMode) {
  const spec = revealSpec(mode);
  const hold = spec.hold ?? 0;
  if (spec === together) return FADE_DURATION;
  if (spec === sequence) return CASCADE_SPREAD + FADE_DURATION;
  if (spec === smart) return hold + CASCADE_SPREAD + FADE_DURATION;
  if (spec === sweep) return hold + SWEEP_SPREAD + FADE_DURATION;
  return hold + Math.max(spec.delay ?? 0, 0) + MAX_DELAY + MAX_DURATION;
}
