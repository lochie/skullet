// Injected, not imported: vitest runs it against the source, the site's /lab against the bundle
export type SkulletApi = {
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
  /** The content once loaded, expectations marked inline: `data-expect="block"`, `"lines"` or `"clipped"`. */
  html: string;
  /** The same markup rendered before its data arrives. */
  empty?: string;
  /** Stage width in px; the content wraps against it. */
  width?: number;
};
