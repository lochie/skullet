import { afterEach, describe, expect, it, vi } from "vitest";
import { bonesIn } from "@skullet/test-cases";
import { FADE_DURATION, forgetShapes } from "../../lib";
import "..";

const settle = () =>
  new Promise((resolve) => setTimeout(resolve, FADE_DURATION + 50));

const element = (markup: string, loading: boolean) => {
  const reveal = document.createElement("skullet-reveal");
  reveal.style.width = "300px";
  reveal.toggleAttribute("loading", loading);
  reveal.innerHTML = markup;
  return document.body.appendChild(reveal);
};

afterEach(() => {
  forgetShapes();
  document.body.replaceChildren();
});

describe("<skullet-reveal>", () => {
  it("starts as a skeleton of its children with loading, then reveals what it's shown", async () => {
    const reveal = element(`<p>Hello there, a line of text</p>`, true);
    const revealed = vi.fn();
    reveal.addEventListener("reveal", revealed);
    expect(bonesIn(reveal).length).toBeGreaterThan(0);
    expect(reveal.getAttribute("aria-busy")).toBe("true");

    reveal.show(`<p>General Kenobi</p>`);
    expect(reveal.hasAttribute("loading")).toBe(false);
    await settle();
    expect(revealed).toHaveBeenCalledTimes(1);
    expect(reveal.textContent).toContain("General Kenobi");
    expect(reveal.querySelectorAll("[skullet-pane]")).toHaveLength(1);
  });

  it("shows its children as content without loading", () => {
    const reveal = element(`<p>Hello there</p>`, false);
    expect(bonesIn(reveal)).toHaveLength(0);
    expect(reveal.hasAttribute("aria-busy")).toBe(false);
    expect(reveal.textContent).toContain("Hello there");
  });
});
