import { ATTR_REVEAL } from "./constants";
import { debugging, reportReveal } from "./debug";
import { isDev, sampleFrom, warnOnce } from "./dev";
import { takeLoadingSize } from "./ghost";
import { rememberShape, trackShape } from "./shapes";
import { autoKey } from "./snapshot";

export type MemoryOptions = {
  id?: string;
  /** What the content was rendered from, for the `sample` dev hint. */
  data?: unknown;
  /** The content is rendered from data by a function, which only `sample` or an `id` can stand in for. */
  rendered?: boolean;
  /** A `sample` was passed. */
  sample?: boolean;
};

const SAVE_DELAY = 250;

/** Remembers the shape of shown content, so its next skeleton can be drawn from it. */
export class Memory {
  private key: string | null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private mutations: MutationObserver;
  private resize: ResizeObserver;
  private untrack: () => void;

  constructor(
    private element: HTMLElement,
    private options: MemoryOptions = {},
  ) {
    this.key = options.id ?? autoKey(element);
    this.untrack = this.key
      ? trackShape(this.key, () => this.save())
      : () => {};

    if (isDev || debugging(element)) this.check();
    this.save();

    this.mutations = new MutationObserver(this.schedule);
    this.mutations.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.resize = new ResizeObserver(this.schedule);
    this.resize.observe(element);
    element.addEventListener("load", this.schedule, true);
  }

  private schedule = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.save(), SAVE_DELAY);
  };

  save() {
    clearTimeout(this.timer);
    if (this.key && this.element.isConnected && this.element.offsetHeight) {
      rememberShape(this.key, this.element);
    }
  }

  private check() {
    const { data, id, rendered, sample } = this.options;
    const name = id ? `<SkeletonReveal id="${id}">` : "<SkeletonReveal>";

    const reveal = this.element.closest(`[${ATTR_REVEAL}]`);
    const before = takeLoadingSize(reveal);
    // Shown without a skeleton first, so nothing was guessed and nothing could move
    if (!before) return;

    if (before.guessed && rendered && !sample && data != null) {
      warnOnce(
        `sample:${this.key}`,
        `${name} has no \`sample\`, so a first load guesses its shape${id ? "" : " and it can't be remembered"}. Pass this to make it exact:\n  sample={${JSON.stringify(sampleFrom(data))}}`,
      );
    }

    // Unsized images settle late; compare once they have
    const images = [...this.element.querySelectorAll("img")].filter(
      (image) => !image.complete,
    );
    Promise.all(
      images.map(
        (image) =>
          new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
      ),
    ).then(() => {
      // Gone before it settled: a detached element measures nothing
      if (!this.element.isConnected) return;
      const width = this.element.offsetWidth;
      const height = this.element.offsetHeight;
      reportReveal(reveal, {
        width: width - before.width,
        height: height - before.height,
      });
      if (
        Math.abs(width - before.width) <= 1 &&
        Math.abs(height - before.height) <= 1
      ) {
        return;
      }
      // Flat in the skeleton, tall now: nothing sized them before they loaded
      const unsized = [...this.element.querySelectorAll("img")]
        .filter(
          (image, i) =>
            (before.images[i] ?? 0) < 1 &&
            image.getBoundingClientRect().height >= 1,
        )
        .map((image) => image.currentSrc.split("/").pop() || "an image");
      if (unsized.length) {
        warnOnce(
          `unsized:${this.key}`,
          `${name}'s skeleton had no room for ${unsized.length === 1 ? "an image" : `${unsized.length} images`} (${unsized.slice(0, 3).join(", ")}${unsized.length > 3 ? ", …" : ""}), so the layout jumped when they loaded. Give each \`width\` and \`height\` attributes, or an \`aspect-ratio\`, so its space is known before it loads.`,
        );
        return;
      }
      warnOnce(
        `jump:${this.key}`,
        before.guessed
          ? `${name}'s skeleton was ${before.width}×${before.height}px but its content is ${width}×${height}px, so the layout jumped on reveal. ${rendered ? "Pass `sample` data shaped like the real thing" : "Pass an `id` so its shape is remembered"}, and give images a size.`
          : `${name}'s skeleton was drawn from the data on screen (${before.width}×${before.height}px), but the new data is ${width}×${height}px, so the layout jumped on reveal. When new data adds to what's shown — another page of a list — give the addition a reveal of its own.`,
      );
    });
  }

  destroy() {
    this.save();
    clearTimeout(this.timer);
    this.mutations.disconnect();
    this.resize.disconnect();
    this.element.removeEventListener("load", this.schedule, true);
    this.untrack();
  }
}
