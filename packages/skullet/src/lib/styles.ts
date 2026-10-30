import {
  ATTR_BAR,
  ATTR_BLOCK,
  ATTR_BONES,
  ATTR_COVERED,
  ATTR_GHOST,
  ATTR_INACTIVE,
  ATTR_LOADING,
  ATTR_OWN,
  ATTR_PANE,
  ATTR_REVEAL,
  ATTR_STATUS,
  ATTR_XRAY,
  BASE,
  MEDIA_TAGS,
  TEXT_TAGS,
} from "./constants";

const media = MEDIA_TAGS.join(", ");
const text = TEXT_TAGS.join(", ");

/** The whole stylesheet, for rendering into a page yourself. */
export const SKULLET_CSS = `
[${ATTR_REVEAL}] {
  position: relative;
}

[${ATTR_PANE}] {
  display: block;
}

[${ATTR_LOADING}] {
  position: relative;
  -webkit-user-select: none;
  user-select: none;
  pointer-events: none;
}

[${ATTR_INACTIVE}] {
  display: none !important;
}

[${ATTR_BONES}] {
  position: absolute;
  inset: 0;
  overflow: visible;
}

[${ATTR_BAR}] {
  display: block;
  background-color: ${BASE};
  background-repeat: no-repeat;
}

/* Containers keep their surface; what they hold is drawn by bones, measured before the first paint */
@scope ([${ATTR_LOADING}]) to ([${ATTR_OWN}], [${ATTR_BONES}]) {
  :scope,
  :scope * {
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    text-shadow: none !important;
    text-decoration-color: transparent !important;
  }

  :scope ::placeholder {
    color: transparent !important;
  }

  /* A line to measure in empty text; content only, never a size, or a dot-sized span would grow round it */
  :scope :is(${text}):empty:not(svg *)::before {
    content: "000000";
  }

  /* Leaves are drawn by bones, so their own paint never shows; visibility, as measuring reads it */
  :scope :is(:not(:has(*)), ${media}, [${ATTR_COVERED}], [${ATTR_BLOCK}]):not(svg *) {
    visibility: hidden !important;
  }

  /* No script to measure: a bar struck through each line of text instead */
  @media (scripting: none) {
    :scope :not(:has(*)):not(svg *) {
      visibility: visible !important;
    }

    :scope,
    :scope * {
      text-decoration: line-through ${BASE} !important;
      text-decoration-thickness: 0.72em !important;
      text-decoration-skip-ink: none !important;
    }

    :scope :is(${media}, [${ATTR_BLOCK}]):not(svg *) {
      visibility: visible !important;
      background: ${BASE} !important;
    }

    :scope svg * {
      fill: transparent !important;
      stroke: transparent !important;
    }

    :scope :is(img, video) {
      object-position: -100vw 0;
    }
  }
}

/* Read by screen readers in the skeleton's place, never seen */
[${ATTR_STATUS}] {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* Debug x-ray: the ghost shown through its bones, to see what was measured */
[${ATTR_XRAY}] [${ATTR_LOADING}] [${ATTR_GHOST}],
[${ATTR_XRAY}] [${ATTR_LOADING}] [${ATTR_GHOST}] *:not(svg *) {
  visibility: visible !important;
  color: rgb(255 0 80 / 0.7) !important;
  -webkit-text-fill-color: rgb(255 0 80 / 0.7) !important;
}

/* Lets addStyles see a stylesheet already on the page, from styles.css or a server render */
:root {
  --skullet: 1;
}`;

let styleEl: HTMLStyleElement | null = null;
let refCount = 0;

let present: boolean | undefined;

export function addStyles() {
  refCount++;
  if (styleEl) return;

  // Already on the page — server-rendered, hoisted by React, or imported as styles.css
  present ??= !!getComputedStyle(document.documentElement).getPropertyValue(
    "--skullet",
  );
  if (present) return;

  styleEl = document.createElement("style");
  styleEl.dataset.skullet = "true";
  styleEl.textContent = SKULLET_CSS;
  document.head.appendChild(styleEl);
}

export function removeStyles() {
  refCount--;
  if (refCount > 0 || !styleEl) return;

  styleEl.remove();
  styleEl = null;
}
