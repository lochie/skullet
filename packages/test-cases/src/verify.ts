import type { SkulletApi, GeometryCase, Result } from "./types";

type Box = { left: number; right: number; top: number; bottom: number };

const TOLERANCE = 1;

// Drawn as blocks by skullet, so their text (an SVG's, a textarea's) is never a line
const MEDIA =
  "audio, canvas, embed, iframe, img, input, object, picture, select, svg, textarea, video";
const SKIPPED = `[skullet-ignore], [skullet-own], [skullet-covered], [skullet-block], ${MEDIA}`;
const TEXT_LEAVES =
  "a, b, code, dd, dt, em, h1, h2, h3, h4, h5, h6, i, label, li, p, small, span, strong, td, th, time";

/** Every bone drawn under `root` — they live in each layer's shadow root. */
export const bonesIn = (root: ParentNode): Element[] =>
  [...root.querySelectorAll("[skullet-layer]")].flatMap((layer) =>
    layer.shadowRoot ? [...layer.shadowRoot.children] : [],
  );

const box = (rect: DOMRect): Box => ({
  left: rect.left,
  right: rect.right,
  top: rect.top,
  bottom: rect.bottom,
});

const fragment = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
};

const px = (value: number) => `${Math.round(value * 10) / 10}px`;

// The visible part of a rect, past every ancestor that hides overflow
function clipTo(rect: Box, from: Element, root: Element): Box | null {
  let box = rect;
  for (
    let element: Element | null = from;
    element && element !== root;
    element = element.parentElement
  ) {
    const style = getComputedStyle(element);
    if (style.overflowX === "visible" && style.overflowY === "visible")
      continue;
    const clip = element.getBoundingClientRect();
    box = {
      left: Math.max(box.left, clip.left),
      right: Math.min(box.right, clip.right),
      top: Math.max(box.top, clip.top),
      bottom: Math.min(box.bottom, clip.bottom),
    };
  }
  return box.right - box.left >= 1 && box.bottom - box.top >= 1 ? box : null;
}

function textFragments(root: Element): Box[] {
  const boxes: Box[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const start = node.data.search(/\S/);
    if (start < 0 || node.parentElement?.closest(SKIPPED)) continue;
    range.setStart(node, start);
    range.setEnd(node, node.data.trimEnd().length);
    for (const rect of range.getClientRects()) {
      const visible = clipTo(box(rect), node.parentElement!, root);
      if (visible) boxes.push(visible);
    }
  }
  return boxes;
}

const lineCount = (boxes: Box[]) => {
  const tops: number[] = [];
  for (const b of boxes) {
    if (!tops.some((top) => Math.abs(top - b.top) < 2)) tops.push(b.top);
  }
  return tops.length;
};

const intersects = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const describe = (element: Element) =>
  `<${element.localName}>${element.textContent?.trim() ? ` "${element.textContent.trim().slice(0, 24)}"` : ""}`;

function stageFor(testCase: GeometryCase, stage: HTMLElement) {
  stage.replaceChildren();
  stage.style.width = `${testCase.width ?? 360}px`;
}

const result = (failures: string[], success: string): Result =>
  failures.length
    ? { pass: false, detail: failures.join("; ") }
    : { pass: true, detail: success };

/** Every line of text, every image and every single-label surface is covered, and nothing else is. */
export function verifyCoverage(
  t: SkulletApi,
  testCase: GeometryCase,
  stage: HTMLElement,
): Result {
  stageFor(testCase, stage);
  const root = document.createElement("div");
  const ghost = document.createElement("div");
  ghost.setAttribute("skullet-ghost", "");
  ghost.innerHTML = testCase.html;
  root.append(ghost);
  stage.append(root);

  const controller = new t.Ghost(root, { exact: true });
  const bones = bonesIn(root).map((bone) => box(bone.getBoundingClientRect()));
  const failures: string[] = [];

  const lines = textFragments(ghost);
  for (const line of lines) {
    const covered = bones.some((bone) => {
      const middle = (bone.top + bone.bottom) / 2;
      return (
        bone.left <= line.left + TOLERANCE &&
        bone.right >= line.right - TOLERANCE &&
        middle >= line.top &&
        middle <= line.bottom
      );
    });
    if (!covered) {
      failures.push(`uncovered line at ${px(line.left)}, ${px(line.top)}`);
    }
  }

  for (const element of ghost.querySelectorAll('[data-expect="block"]')) {
    const target = box(element.getBoundingClientRect());
    const match = bones.some(
      (bone) =>
        Math.abs(bone.left - target.left) <= TOLERANCE &&
        Math.abs(bone.right - target.right) <= TOLERANCE &&
        Math.abs(bone.top - target.top) <= TOLERANCE &&
        Math.abs(bone.bottom - target.bottom) <= TOLERANCE,
    );
    if (!match) failures.push(`no block for ${describe(element)}`);
  }

  for (const element of ghost.querySelectorAll('[data-expect="lines"]')) {
    const area = box(element.getBoundingClientRect());
    const expected = lineCount(textFragments(element));
    const inside = bones.filter((bone) => {
      const x = (bone.left + bone.right) / 2;
      const y = (bone.top + bone.bottom) / 2;
      return (
        x >= area.left && x <= area.right && y >= area.top && y <= area.bottom
      );
    }).length;
    if (inside !== expected) {
      failures.push(
        `${describe(element)} has ${inside} bars for ${expected} lines`,
      );
    }
  }

  for (const element of ghost.querySelectorAll('[data-expect="clipped"]')) {
    const area = box(element.getBoundingClientRect());
    const inside = bones.filter((bone) => intersects(bone, area));
    const spilling = inside.filter(
      (bone) =>
        bone.left < area.left - TOLERANCE ||
        bone.right > area.right + TOLERANCE ||
        bone.top < area.top - TOLERANCE ||
        bone.bottom > area.bottom + TOLERANCE,
    );
    if (!inside.length) failures.push(`nothing drawn in ${describe(element)}`);
    if (spilling.length)
      failures.push(`bone spills out of ${describe(element)}`);
  }

  const drawable = [
    ...lines,
    ...[
      ...ghost.querySelectorAll(
        `[skullet-covered], [skullet-block], ${MEDIA}, :is(${TEXT_LEAVES}):empty`,
      ),
    ].map((element) => box(element.getBoundingClientRect())),
  ];
  const strays = bones.filter(
    (bone) => !drawable.some((target) => intersects(bone, target)),
  );
  if (strays.length) failures.push(`${strays.length} bone(s) over nothing`);

  controller.destroy();
  return result(
    failures,
    `${bones.length} bones cover ${lines.length} line fragments`,
  );
}

const sizeOf = (element: HTMLElement) => ({
  width: element.offsetWidth,
  height: element.offsetHeight,
});

const compare = (
  skeleton: { width: number; height: number },
  content: { width: number; height: number },
): string[] =>
  Math.abs(skeleton.width - content.width) <= TOLERANCE &&
  Math.abs(skeleton.height - content.height) <= TOLERANCE
    ? []
    : [
        `skeleton ${skeleton.width}×${skeleton.height}px, content ${content.width}×${content.height}px`,
      ];

/** Revealing content after a skeleton drawn from that same content moves nothing. */
export function verifyNoJump(
  t: SkulletApi,
  testCase: GeometryCase,
  stage: HTMLElement,
): Result {
  stageFor(testCase, stage);
  t.forgetShapes();
  const reveal = new t.Reveal(stage);
  const skeleton = sizeOf(reveal.load(fragment(testCase.html)));
  const content = sizeOf(reveal.show(fragment(testCase.html)));
  reveal.destroy();
  return result(compare(skeleton, content), `${content.height}px either side`);
}

/** A skeleton drawn from the shape remembered on the last reveal is the content's size. */
export function verifyRecall(
  t: SkulletApi,
  testCase: GeometryCase,
  stage: HTMLElement,
  { persisted = false } = {},
): Result {
  stageFor(testCase, stage);
  t.forgetShapes();
  const reveal = new t.Reveal(stage, { id: `case:${testCase.label}` });
  const content = sizeOf(reveal.show(fragment(testCase.html)));
  // Leaves only what was stored, with the text replaced
  if (persisted) t.forgetShapes({ persisted: false });

  const loading = reveal.load();
  const failures = compare(sizeOf(loading), content);
  if (!bonesIn(loading).length) failures.push("no bones drawn");
  reveal.destroy();
  t.forgetShapes();
  return result(failures, `${content.height}px either side`);
}

/** Markup rendered without its data still finds the shape the loaded content left, with no `id`. */
export function verifyAutoKey(
  t: SkulletApi,
  testCase: GeometryCase,
  stage: HTMLElement,
): Result {
  if (!testCase.empty) return { pass: true, detail: "no empty markup" };

  stageFor(testCase, stage);
  t.forgetShapes();
  const reveal = new t.Reveal(stage);
  const content = sizeOf(reveal.show(fragment(testCase.html)));
  const loading = sizeOf(reveal.load(fragment(testCase.empty)));
  reveal.destroy();
  t.forgetShapes();
  return result(compare(loading, content), `${content.height}px either side`);
}

export const CHECKS = {
  coverage: verifyCoverage,
  "no jump": verifyNoJump,
  recall: verifyRecall,
  "recall from storage": (t: SkulletApi, c: GeometryCase, s: HTMLElement) =>
    verifyRecall(t, c, s, { persisted: true }),
  "auto key": verifyAutoKey,
} satisfies Record<
  string,
  (t: SkulletApi, c: GeometryCase, s: HTMLElement) => Result
>;
