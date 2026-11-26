import { CASCADE_SPREAD, FADE_DURATION } from "./constants";
import { warnOnce } from "./dev";
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

export const revealSpec = (mode: RevealMode = "smart"): RevealSpec => {
  if (typeof mode !== "string") return mode;
  const spec = NAMED[mode as keyof typeof NAMED];
  if (spec) return spec;
  // An HTML attribute (or any other untyped caller) has nothing checking it ahead of time, the
  // way TypeScript does for the wrappers — fall back the way an enumerated HTML attribute's own
  // invalid value does, rather than throw mid-reveal with the sample still on the page.
  warnOnce(
    `reveal:${mode}`,
    `unknown reveal "${mode}" ("together", "sequence", "smart" or "sweep"), falling back to "smart".`,
  );
  return smart;
};

/** Longest a pane can take to leave under `mode`, for a framework that has to know up front. */
export function exitDuration(mode?: RevealMode) {
  const spec = revealSpec(mode);
  const hold = spec.hold ?? 0;
  if (spec === together) return FADE_DURATION;
  if (spec === sequence) return CASCADE_SPREAD + FADE_DURATION;
  if (spec === smart) return hold + CASCADE_SPREAD + FADE_DURATION;
  if (spec === sweep) return hold + SWEEP_SPREAD + FADE_DURATION;
  if (spec.duration === 0) return 0;
  // A choice can bring its own delay, as long as the cap allows
  const delay = spec.choose
    ? MAX_DELAY
    : Math.min(Math.max(spec.delay ?? 0, 0), MAX_DELAY);
  return hold + delay + MAX_DELAY + MAX_DURATION;
}
