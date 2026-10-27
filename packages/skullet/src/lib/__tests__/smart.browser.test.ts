import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  addStyles,
  FADE_DURATION,
  forgetShapes,
  removeStyles,
  Reveal,
  SKELETON_DELAY,
} from "..";

beforeAll(addStyles);
afterAll(removeStyles);

afterEach(() => {
  forgetShapes();
  document.body.replaceChildren();
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const html = (markup: string) => {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content;
};

// The opacity fade on an element, not the shimmer or pulse on its bones
const fade = (element: Element) =>
  element
    .getAnimations()
    .map((animation) => animation.effect as KeyframeEffect)
    .find((effect) => effect.getTiming().iterations !== Infinity);

const timing = (element: Element) => fade(element)?.getTiming();

const LIST = `<ul style="margin: 0; padding: 0; list-style: none">
  ${["Invoice paid", "New comment", "Deploy finished", "Payout sent"]
    .map(
      (title, i) =>
        `<li style="display: flex; flex-direction: column; padding: 8px 0"><strong style="font-size: 16px">${title}</strong><span style="font-size: 12px">${i + 2}m ago</span></li>`,
    )
    .join("")}
</ul>`;

function stage() {
  const element = document.body.appendChild(document.createElement("div"));
  element.style.width = "320px";
  return new Reveal(element);
}

describe("smart reveal", () => {
  it("holds a new skeleton back, and the content it replaces with it", async () => {
    const reveal = stage();
    const content = reveal.show(html(`<p>Shown</p>`));
    const skeleton = reveal.load(html(`<p>Shown</p>`));
    await wait(0);

    expect(timing(skeleton)?.delay).toBe(SKELETON_DELAY);
    expect(timing(content)?.delay).toBe(SKELETON_DELAY);
  });

  it("swaps at once when the data beats the hold-back — no skeleton ever shows", async () => {
    const reveal = stage();
    const skeleton = reveal.load(html(LIST));
    await wait(SKELETON_DELAY / 3);
    const content = reveal.show(html(LIST));
    await Promise.resolve();

    expect(fade(content)).toBeUndefined();
    expect(skeleton.style.opacity).toBe("0");
  });

  it("crossfades something small whole", async () => {
    const reveal = stage();
    reveal.load(html(`<p>Ada Lovelace</p>`));
    await wait(SKELETON_DELAY + 50);
    const content = reveal.show(html(`<p>Ada Lovelace</p>`));

    expect(timing(content)?.duration).toBe(FADE_DURATION);
    expect(fade(content.querySelector("p")!)).toBeUndefined();
  });

  it("brings a list in row by row, small text a beat behind", async () => {
    const reveal = stage();
    reveal.load(html(LIST));
    await wait(SKELETON_DELAY + 50);
    const content = reveal.show(html(LIST));

    const rows = [...content.querySelectorAll("li")];
    const titles = rows.map((row) =>
      Number(timing(row.firstElementChild!)?.delay),
    );
    const metas = rows.map((row) =>
      Number(timing(row.lastElementChild!)?.delay),
    );

    for (let i = 1; i < rows.length; i++) {
      expect(titles[i]).toBeGreaterThan(titles[i - 1]!);
    }
    metas.forEach((meta, i) => expect(meta).toBeGreaterThan(titles[i]!));
  });

  it("doesn't animate what's off screen", async () => {
    const tall = LIST.replaceAll(
      "padding: 8px 0",
      `padding: ${innerHeight / 2}px 0`,
    );
    const reveal = stage();
    reveal.load(html(tall));
    await wait(SKELETON_DELAY + 50);
    const content = reveal.show(html(tall));

    const last = content.querySelectorAll("li strong")[3]!;
    expect(last.getBoundingClientRect().top).toBeGreaterThan(innerHeight);
    expect(fade(last)).toBeUndefined();
  });

  it("gives a loading image its own moment, without holding the text", async () => {
    const markup = `<div><img src="http://10.255.255.1/photo.png" width="40" height="40" style="display: block">${LIST}</div>`;
    const reveal = stage();
    reveal.load(html(markup));
    await wait(SKELETON_DELAY + 50);
    const content = reveal.show(html(markup));

    expect(content.style.opacity).toBe("");
    expect(content.querySelector<HTMLElement>("img")!.style.opacity).toBe("0");
    expect(fade(content.querySelector("strong")!)).toBeDefined();
  });

  it("stays out of the way of the modes it isn't", async () => {
    const element = document.body.appendChild(document.createElement("div"));
    const reveal = new Reveal(element, { reveal: "together" });
    const skeleton = reveal.load(html(LIST));
    expect(timing(skeleton)).toBeUndefined(); // a first skeleton just shows
    await wait(10);
    const content = reveal.show(html(LIST));
    expect(timing(content)?.duration).toBe(FADE_DURATION);
  });

  // Last: the input it fakes would count as recent for the next test
  it("swaps at once for someone mid-gesture", async () => {
    const reveal = stage();
    reveal.load(html(LIST));
    await wait(SKELETON_DELAY + 50);
    dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    const content = reveal.show(html(LIST));

    expect(fade(content)).toBeUndefined();
    expect(fade(content.querySelector("strong")!)).toBeUndefined();
  });
});
