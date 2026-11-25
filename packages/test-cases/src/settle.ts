const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve)),
  );

// Fades and resizes end; a shimmer never does, and a paused animation won't until played
const ending = (animation: Animation) =>
  animation.playState === "running" &&
  Number.isFinite(animation.effect?.getComputedTiming().endTime ?? Infinity);

/**
 * Waits `minimum` ms — some fades only start after a delay — then until every animation that ends has,
 * and a frame for what runs when they do. A slow runner takes longer, never fails for it.
 */
export async function settle(minimum = 0) {
  await new Promise((resolve) => setTimeout(resolve, minimum));
  // A fade ending can start another, so look again until none are left
  for (let round = 0; round < 10; round++) {
    const running = document.getAnimations().filter(ending);
    if (!running.length) break;
    await Promise.all(
      running.map((animation) => animation.finished.catch(() => {})),
    );
    await frame();
  }
  await frame();
}
