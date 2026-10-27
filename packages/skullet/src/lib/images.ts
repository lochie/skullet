import { IMAGE_TIMEOUT } from "./constants";

const noop = () => {};

// Lazy and well off screen, it won't load until scrolled to — nothing to wait for
const deferred = (image: HTMLImageElement) => {
  if (image.loading !== "lazy") return false;
  const rect = image.getBoundingClientRect();
  return rect.bottom < -innerHeight || rect.top > innerHeight * 2;
};

/** Images inside still on their way. */
export const pendingImages = (element: Element) =>
  [...element.querySelectorAll("img")].filter(
    (image) => !image.complete && !deferred(image),
  );

/** Loaded and decoded, so its first frame on screen is the picture; failing counts, as nothing more is coming. */
export function imageReady(image: HTMLImageElement): Promise<void> {
  const loaded = image.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
  return Promise.race([
    loaded.then(() => image.decode?.()).then(noop, noop),
    new Promise<void>((resolve) => setTimeout(resolve, IMAGE_TIMEOUT)),
  ]);
}
