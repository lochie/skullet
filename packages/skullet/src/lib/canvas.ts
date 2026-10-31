let context: CanvasRenderingContext2D | null | undefined;

// jsdom has no canvas, and logs an error for every context asked of it
export const textContext = () =>
  (context ??= /jsdom/.test(navigator.userAgent)
    ? null
    : document.createElement("canvas").getContext("2d"));
