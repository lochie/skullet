import type { GeometryCase } from "./types";

const AVATAR = `<img data-expect="block" width="40" height="40" style="display: block; border-radius: 50%">`;

export const GEOMETRY_CASES: GeometryCase[] = [
  {
    label: "Profile card",
    description: "A card keeps its surface; avatar, lines and chip get bones.",
    tags: ["card", "media", "surface"],
    width: 360,
    html: `<div style="display: flex; gap: 12px; align-items: center; padding: 16px; border: 1px solid #ccc; border-radius: 16px">
  ${AVATAR}
  <div style="display: flex; flex-direction: column; gap: 2px">
    <span data-expect="lines">Lochie Axon</span>
    <span data-expect="lines" style="font-size: 13px">@lochieaxon</span>
  </div>
  <span data-expect="block" style="margin-left: auto; padding: 6px 12px; border-radius: 999px; background: #222; color: #fff">Follow</span>
</div>`,
    empty: `<div style="display: flex; gap: 12px; align-items: center; padding: 16px; border: 1px solid #ccc; border-radius: 16px">
  ${AVATAR}
  <div style="display: flex; flex-direction: column; gap: 2px">
    <span></span>
    <span style="font-size: 13px"></span>
  </div>
  <span style="margin-left: auto; padding: 6px 12px; border-radius: 999px; background: #222; color: #fff">Follow</span>
</div>`,
  },
  {
    label: "Chip split into pieces",
    description:
      "A chip whose one label is split across many elements, as a text morph renders it, is still one block.",
    tags: ["surface", "inline"],
    width: 200,
    html: `<span data-expect="block" style="display: inline-flex; padding: 2px 8px; border-radius: 999px; background: rgb(74 222 128 / 0.15); color: #16a34a">${[..."+1.64%"].map((c) => `<span style="display: inline-block">${c}</span>`).join("")}<span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)">+1.64%</span></span>`,
  },
  {
    label: "Header over a divider",
    description:
      "A rule along one side divides rather than paints: the avatar and name inside get bones of their own.",
    tags: ["media", "surface"],
    width: 300,
    html: `<div style="display: flex; gap: 10px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #ddd">
  ${AVATAR}
  <span data-expect="lines">Alex</span>
</div>`,
  },
  {
    label: "Wrapped bubble",
    description:
      "A painted bubble whose one label wraps onto two lines is still one label, so one block.",
    tags: ["surface", "wrap"],
    width: 200,
    html: `<div style="display: flex"><span data-expect="block" style="max-width: 140px; padding: 6px 12px; border-radius: 16px; background: #eee">Did the skeleton just guess my bubble widths?</span></div>`,
  },
  {
    label: "Wrapping paragraph",
    description: "One bar per line, each as wide as its line.",
    tags: ["text", "wrap"],
    width: 240,
    html: `<p data-expect="lines" style="margin: 0; line-height: 1.5">Skeletons should follow the content they stand in for, line by line, so nothing moves when it arrives.</p>`,
  },
  {
    label: "Inline runs",
    description: "Text split across inline elements on one line is one bar.",
    tags: ["text", "inline"],
    width: 400,
    html: `<div data-expect="lines">Posted by <a href="#">Jack</a> in <b>Design</b> · 3h</div>`,
  },
  {
    label: "Centered heading",
    description: "Bars follow centered text rather than the box around it.",
    tags: ["text", "align"],
    width: 360,
    html: `<h2 data-expect="lines" style="margin: 0; text-align: center; font-size: 28px">A centered title</h2>`,
  },
  {
    label: "Article",
    description: "Heading, wrapped body and a button, each at its own size.",
    tags: ["text", "wrap", "surface"],
    width: 320,
    html: `<article style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start">
  <h3 data-expect="lines" style="margin: 0; font-size: 20px">Designing for the wait</h3>
  <p data-expect="lines" style="margin: 0; line-height: 1.6">Loading states are the first thing people see, and the thing they see most often on a slow connection.</p>
  <button data-expect="block" style="padding: 8px 16px; border: 0; border-radius: 8px; background: #222; color: #fff">Read more</button>
</article>`,
  },
  {
    label: "List rows",
    description:
      "Icons are blocks; each row's title and meta get their own bars.",
    tags: ["list", "svg"],
    width: 320,
    html: `<ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px">
  ${["Invoice paid", "New comment", "Deploy finished"]
    .map(
      (title, i) => `<li style="display: flex; gap: 10px; align-items: center">
    <svg data-expect="block" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
    <span data-expect="lines" style="flex: 1">${title}</span>
    <time data-expect="lines" style="font-size: 12px">${i + 2}m ago</time>
  </li>`,
    )
    .join("")}
</ul>`,
  },
  {
    label: "Chips",
    description: "Each painted chip around a single label is one block.",
    tags: ["surface"],
    width: 360,
    html: `<div style="display: flex; gap: 8px; flex-wrap: wrap">
  ${["Design", "Engineering", "Research"]
    .map(
      (label) =>
        `<span data-expect="block" style="padding: 4px 10px; border-radius: 999px; background: #eee">${label}</span>`,
    )
    .join("")}
</div>`,
  },
  {
    label: "Stat tiles",
    description:
      "Tiles with two labels keep their surface; their text gets bars.",
    tags: ["card", "text"],
    width: 360,
    html: `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px">
  ${["Revenue|$12,480", "Users|1,204", "Churn|2.1%"]
    .map((tile) => {
      const [label, value] = tile.split("|");
      return `<div style="padding: 12px; border-radius: 12px; background: #f4f4f4">
    <div data-expect="lines" style="font-size: 12px">${label}</div>
    <div data-expect="lines" style="font-size: 24px; font-weight: 600">${value}</div>
  </div>`;
    })
    .join("")}
</div>`,
  },
  {
    label: "Form",
    description: "Controls are blocks at their own size; labels are bars.",
    tags: ["form", "media"],
    width: 320,
    html: `<form style="display: flex; flex-direction: column; gap: 6px">
  <label data-expect="lines">Email</label>
  <input data-expect="block" value="ada@example.com" style="padding: 8px">
  <label data-expect="lines">Message</label>
  <textarea data-expect="block" rows="3">Hello</textarea>
</form>`,
  },
  {
    label: "Media card",
    description:
      "An image sized by aspect ratio is one block above its caption.",
    tags: ["media", "card"],
    width: 300,
    html: `<figure style="margin: 0">
  <img data-expect="block" style="display: block; width: 100%; aspect-ratio: 16 / 9; border-radius: 12px">
  <figcaption data-expect="lines" style="margin-top: 8px">Sunrise over the harbour</figcaption>
</figure>`,
  },
  {
    label: "Table",
    description: "Every cell's text is a bar.",
    tags: ["table", "text"],
    width: 320,
    html: `<table style="border-collapse: collapse; width: 100%">
  <tr><th data-expect="lines" style="text-align: left">Name</th><th data-expect="lines" style="text-align: right">Amount</th></tr>
  <tr><td data-expect="lines">Coffee</td><td data-expect="lines" style="text-align: right">$4.50</td></tr>
  <tr><td data-expect="lines">Lunch</td><td data-expect="lines" style="text-align: right">$12.00</td></tr>
</table>`,
  },
  {
    label: "Truncated text",
    description:
      "Text cut off by an ellipsis is drawn only as far as it shows.",
    tags: ["text", "clip"],
    width: 200,
    html: `<div data-expect="clipped" style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis">A preview far too long to fit on the one line it is given</div>`,
  },
  {
    label: "Sized empty span",
    description:
      "A span sized into a dot keeps its size, though it holds no text.",
    tags: ["surface", "empty"],
    width: 240,
    html: `<div style="display: flex; gap: 8px; align-items: center">
  <span data-expect="block" style="width: 12px; height: 12px; border-radius: 50%; background: #4ade80"></span>
  <span data-expect="lines">Deploy finished</span>
</div>`,
    empty: `<div style="display: flex; gap: 8px; align-items: center">
  <span style="width: 12px; height: 12px; border-radius: 50%; background: #4ade80"></span>
  <span></span>
</div>`,
  },
  {
    label: "Hints",
    description: "`skullet-block` forces a block; `skullet-ignore` draws nothing.",
    tags: ["hints"],
    width: 320,
    html: `<div style="display: flex; flex-direction: column; gap: 8px">
  <div data-expect="block" skullet-block><span>Drawn</span> <span>as one</span></div>
  <div skullet-ignore>Not drawn at all</div>
</div>`,
  },
];

export const ALL_TAGS = [...new Set(GEOMETRY_CASES.flatMap((c) => c.tags))];
