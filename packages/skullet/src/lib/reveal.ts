import { ATTR_GHOST, ATTR_PANE, ATTR_REVEAL, ATTR_STATUS } from "./constants";
import { fadeIn, fadeOut } from "./fade";
import type { RevealMode } from "./plan";
import { Ghost } from "./ghost";
import { Memory } from "./memory";
import { addStyles, removeStyles } from "./styles";

export type RevealOptions = {
  /** Remembers the shape under this key; without it, one is derived from the markup. */
  id?: string;
  /** How content replaces its skeleton: `smart` (the default), `together`, `sequence`, `sweep`, or a `RevealSpec` of your own. */
  reveal?: RevealMode;
  /** Read to screen readers while loading, in place of the skeleton — "Loading profile". */
  label?: string;
};

/** Shows a skeleton of content while it loads, then crossfades to the content itself. */
export class Reveal {
  private current: HTMLElement | null = null;
  private ghost: Ghost | null = null;
  private memory: Memory | null = null;

  constructor(
    private element: HTMLElement,
    private options: RevealOptions = {},
  ) {
    addStyles();
    element.setAttribute(ATTR_REVEAL, "");
  }

  /** Shows a skeleton measured from `content`, rendered from sample data, or else the shape last shown. */
  load(content?: Node | string): HTMLElement {
    const loading = document.createElement("div");
    const ghost = document.createElement("div");
    ghost.setAttribute(ATTR_GHOST, "");
    if (content) ghost.append(content);
    loading.append(ghost);

    const pane = this.swap(loading);
    // Outside the skeleton, which is hidden from screen readers
    if (this.options.label) {
      const status = document.createElement("span");
      status.setAttribute(ATTR_STATUS, "");
      status.textContent = this.options.label;
      pane.prepend(status);
    }
    this.element.setAttribute("aria-busy", "true");
    this.ghost = new Ghost(loading, { id: this.options.id });
    return pane;
  }

  show(content: Node | string): HTMLElement {
    const pane = this.swap(content);
    this.element.removeAttribute("aria-busy");
    this.memory = new Memory(pane, { id: this.options.id });
    return pane;
  }

  private swap(content: Node | string) {
    this.memory?.destroy();
    this.ghost?.destroy();
    this.memory = this.ghost = null;

    const pane = document.createElement("div");
    pane.setAttribute(ATTR_PANE, "");
    pane.append(content);

    const previous = this.current;
    this.current = pane;

    // Popped out before the new pane lands, while it still measures where it stood
    if (previous) fadeOut(previous).then(() => previous.remove());
    this.element.append(pane);
    fadeIn(pane, this.options.reveal, { initial: !previous });

    return pane;
  }

  destroy() {
    this.memory?.destroy();
    this.ghost?.destroy();
    removeStyles();
  }
}
