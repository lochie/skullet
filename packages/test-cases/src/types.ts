// Injected rather than imported so one definition can run against both builds:
// vitest resolves skele from source, the playground from the bundle.
export type SkeleApi = {
  Ghost: new (
    root: HTMLElement,
    options?: { id?: string; exact?: boolean },
  ) => { destroy: () => void };
  Reveal: new (
    element: HTMLElement,
    options?: { id?: string },
  ) => {
    load: (content?: Node | string) => HTMLElement;
    show: (content: Node | string) => HTMLElement;
    destroy: () => void;
  };
  forgetShapes: (options?: { persisted?: boolean }) => void;
};

export type Result = {
  pass: boolean;
  detail: string;
};

export type GeometryCase = {
  label: string;
  description: string;
  tags: string[];
  /**
   * The content once loaded. Expectations are marked inline:
   * `data-expect="block"` must be drawn as one block at its box,
   * `data-expect="lines"` must get one bar per line its text wraps to,
   * `data-expect="clipped"` must have every bone inside its box.
   */
  html: string;
  /** The same markup rendered before its data arrives. */
  empty?: string;
  /** Stage width in px; the content wraps against it. */
  width?: number;
};
