# AGENTS.md

skullet is a smart skeleton loading component. pnpm workspace, published from `packages/skullet`.

## Layout

| Path                                                 | What                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [packages/skullet/](packages/skullet/)               | The library. Core + React / Vue / Svelte wrappers. The only published package.              |
| [packages/test-cases/](packages/test-cases/)         | Shared geometry corpus. Consumed by vitest _and_ the site's `/lab`.                         |
| [site/](site/)                                       | Next.js docs site — skullet.lochie.me.                                                      |
| [apps/](apps/)                                       | One integration example per framework. Not published, ignored by changesets.                |
| [e2e/](e2e/)                                         | Playwright against the built site: goldens and pixel checks, three browsers plus Safari 18. |
| [scripts/bundle-sizes.mjs](scripts/bundle-sizes.mjs) | Measures dist gzip sizes into `/lab`. Runs in `site:build`.                                 |

## Commands

Run from the repo root; every script is a `--filter` into a workspace.

```
pnpm dev          # library watch build + site dev server
pnpm build        # build skullet
pnpm test         # vitest, skullet only — happy-dom and Chromium
pnpm typecheck    # tsc --noEmit, skullet only
pnpm lint         # skullet + site
pnpm site:dev
pnpm example:react   # also :vue :svelte :svelte-ssr :typescript
pnpm e2e          # the built site in Chromium, WebKit, Firefox — `pnpm site:build` first
pnpm e2e:update   # re-record golden screenshots, after a change you meant
pnpm e2e:safari18 # the built site in WebKit 18.2, served on :3123
```

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs all of it on every push and pull request: typecheck, lint, tests in three browsers, the site and example builds, e2e, and the Safari 18 check. Locally, `pnpm typecheck && pnpm test && pnpm lint` before anything lands.

## Code standards

### Comments

Comment only what is complex or out of the ordinary, in one line at most.

Assume a reader who knows the platform — never explain a standard API, a language feature, or what a well-named function does. `countText()` needs no comment; anyone reading it knows what counting is. Same for WAAPI calls, `MutationObserver`, React hooks.

If it won't fit on one line, it doesn't go in the code.

What earns a comment is the thing someone would otherwise "fix" — a constant that looks arbitrary, an order that looks incidental, a workaround that looks like a mistake:

```ts
// Detached nodes have no computed style
const attached = () => document.body.appendChild(document.createElement("div"));
```

A worked example that proves a rule belongs in [packages/test-cases/](packages/test-cases/) and not in prose — the corpus runs, a comment's copy of it rots quietly. A rule enforced in several places is stated once, as a trailing comment on the declaration they all import — not repeated at each site, and not as a list of the sites, which goes stale on the next one added.

The exception is a file-level block explaining a whole subsystem's contract, where one already exists.

### Style

Prettier + eslint flat config, both in `packages/skullet/`. Formatting is prettier's job; `eslint-config-prettier` sits last and disables anything that would fight it. Double quotes, semicolons, 2 spaces.

`no-console` is a warning — the debug path is the `debug` option, not a stray log. Unused args need a `_` prefix.

**Reach for prettier by path** — `packages/skullet/node_modules/.bin/prettier` — never `npx prettier` or `node_modules/.bin/prettier`. The root resolves 2.8.8, hoisted out of `@changesets/cli`, and its `trailingComma` default of `es5` strips a comma off every multi-line call in the repo. (`pnpm --filter=skullet exec prettier` finds the right binary but runs in `packages/skullet/`, so paths from the root miss.)

`.prettierrc.cjs` lives in `packages/skullet/`, so `packages/test-cases/` and `site/` format on prettier 3 defaults instead. The two agree on everything the repo uses.

## The library

skullet has no users yet: change an API outright rather than keeping an old name or shim beside it.

The goal: show a skeleton of exactly what will load, so nothing moves when it does. **No layout shift on reveal is a hard requirement.**

All behaviour lives in the core, [src/lib/](packages/skullet/src/lib/); the wrappers only bind it to a framework's lifecycle.

- **Ghost** ([ghost.ts](packages/skullet/src/lib/ghost.ts)) — the loading pane. The content is laid out for real but unseen (`[skullet-ghost]`: containers keep their surface, text goes transparent, media hidden), so it takes exactly the content's space. It is measured into bones drawn on an overlay (`[skullet-layer]`), and re-measured on resize, mutation, image load and font load.
- **Measuring** ([measure.ts](packages/skullet/src/lib/measure.ts)) — one bar per line of text (`Range.getClientRects`, merged across inline runs), one block per image, control or SVG, and one block per painted box around a single label (a button, a chip) — one label per piece of text however many lines it wraps to, and pieces side by side on a line joined — so one split into per-character spans by a text morph is still one. Painted means a fill, a shadow, or a border all the way round — a rule along one side is a divider, not a surface, whether it's a border or an inset hairline shadow. A card with several labels keeps its surface. Bones are clipped to any ancestor that hides overflow, and a block sitting in one of its rounded corners takes that corner.
- **Lines of text** — each line's bar runs between two of the font's lines, read from the font with canvas `measureText` (cached per font): top `ascender` | `cap-height` | `x-height`, bottom `baseline` | `descender`, default ascender to descender. The rules are the `--skullet-text-top` / `--skullet-text-bottom` custom properties, read off each text's computed style, so the inline script measuring server HTML follows them too and a section can override them. Without canvas (happy-dom), a bar is centred in its line.
- **Ghost sources, in order** — stale `data` while `loading` is forced, then the last data shown under the same `id`, then a remembered shape — unless the children carry a skeleton of their own (`[skullet-own]`), which a shape copied from shown content can't have — then `sample`, then plain children rendered without data, then three generic lines (with a dev warning). A skeleton in the document before any script ran was server-rendered and is already painted: it keeps its own ghost rather than swap to a remembered shape, which would move the page.
- **Server rendering** — a skeleton's first paint must already be its bones. Each wrapper renders an inline `<script>` after the loading root: [boot.ts](packages/skullet/src/lib/boot.ts), bundled by `scripts/build-inline.mjs` into the committed `inline.generated.ts` (a unit test fails when it's stale; run the script after touching anything boot.ts imports). It measures in its `ResizeObserver`'s first callback — after layout, before paint — never mid-parse, which forced a layout per skeleton and let the page paint in pieces. Under a provider it's sent once a page; every skeleton after it carries `INLINE_STUB`, which calls the `boot` the full script leaves on window, or queues for it when streamed segments land out of order (React renders the stub on the client, with `suppressHydrationWarning`, as it never runs it). It draws bones without touching anything a framework hydrates: bones live in the layer's shadow root, and `measureSkeleton(…, { mark: false })` sets no attributes. Leaves in a skeleton are `visibility: hidden` from the first frame, so a painted chip never shows its colour. Only under `@media (scripting: none)` does CSS draw text as struck-through bars instead. React 19 hoists the stylesheet into the page (`<style href precedence>`); elsewhere it's `skullet/styles.css`, generated from the same string at build. `addStyles` sees either by the `--skullet` marker on `:root` and injects nothing.
- **Never write a literal script tag in a `.svelte` file** — Vite's dependency scanner reads it as the component's own. Svelte renders `inlineScriptTag()` through `{@html}`.
- **Memory** ([memory.ts](packages/skullet/src/lib/memory.ts), [shapes.ts](packages/skullet/src/lib/shapes.ts), [snapshot.ts](packages/skullet/src/lib/snapshot.ts)) — shown content is serialized, sanitized (no scripts, handlers, media sources or form values), media pinned to its proportions (its width as a ceiling, so a shape restored narrower scales), and kept: real text in memory for this visit, filler text in `localStorage` across visits. Filler gets letter-spacing so it wraps where the real text did. Keyed by `id`, or by page path plus the markup's top two levels. `forgetShapes()` clears it — on sign-out.
- **Dev checks** ([dev.ts](packages/skullet/src/lib/dev.ts)) — on reveal, a size mismatch between skeleton and content warns — naming any image that was flat in the skeleton, which nothing sized before it loaded; data-driven content without `sample` logs a ready-to-paste one with the data's keys and lengths, values filled.
- **Shimmer** ([shimmer.ts](packages/skullet/src/lib/shimmer.ts)) — one highlight sweeping the page. Every bone runs on the document clock (`startTime = 0`) and offsets its gradient by its own page position, so separate skeletons, however late they mount, stay in one sweep. No `background-attachment: fixed`, which iOS ignores.
- **Theme** — [theme.ts](packages/skullet/src/lib/theme.ts): one object for colours (light, dark), `animation`, `speed` (`slow` | `fast`, mapped per animation by `DURATIONS`), `radius` and `text`. Every option is a custom property (`--skullet-base`, `--skullet-highlight`, `--skullet-radius`, `--skullet-animation`, `--skullet-speed`, `--skullet-text-*`) read off computed style where it's used — by `drawSkeleton` once per layer, by `measureSkeleton` per text — so the inline script follows a theme too, and any subtree can set its own. `skulletCSS` writes a theme as rules; `themeVariables` as a style attribute (the docs' theme creator scopes its preview that way).
- **Animations** — `shimmer` (one sweep across the page), `group-shimmer` (each bones layer sweeps its own width), `pulse` (opacity), `none`. All on the document clock (`startTime = 0`). A shimmer moves at one pace on any width — bands stream across in one `repeating-linear-gradient`, `SPACING` band-widths apart, each easing up to `PEAK` and down again, at a pace set so the band crosses 1280px in 70% of the duration; the band stops growing at 320px. Every bone draws its slice of the same stream, offset by where it sits. A bone's animation restarts only when its position, group, the page's width or the motion changes.
- **Provider** — `SkulletProvider` (React context, Vue provide/inject, Svelte context keyed `"skullet"`) carries `nonce`, `theme`/`mode`, `text`, `reveal` and `debug`. Per render, never module state: a nonce differs per request on the server. Theme is the `--skullet-base`/`--skullet-highlight` custom properties, written as a `<style>` by the provider; they reach the bones through the shadow root by inheritance.
- **Reveals** — a reveal is a `RevealSpec` (`order`, `enter`, `wipe`, `delay`, `duration`, `hold`, `choose`). Every built-in is one, written with the public API: `together`, `sequence`, `smart` and `instant` in [plan.ts](packages/skullet/src/lib/plan.ts), `sweep` in [sweep.ts](packages/skullet/src/lib/sweep.ts); [reveals.ts](packages/skullet/src/lib/reveals.ts) maps a name to its spec (`revealSpec`) and bounds a leaving pane's time (`exitDuration`); [plan.ts](packages/skullet/src/lib/plan.ts) resolves a spec to a plan, [fade.ts](packages/skullet/src/lib/fade.ts) carries it out and keeps every guarantee whatever the spec — `enter` keeps to properties that paint, delays and durations are capped at 1s, a custom wipe's outgoing pane gets its inverse by `mask-composite`. Svelte keeps a leaving pane for `exitDuration`. The incoming pane decides a plan per reveal root; the outgoing pane reads it a microtask later and matches. Smart, first match wins: reduced motion or scrolling or typing in the last 400ms → instant (not clicks: a click moves nothing being read); data within `SKELETON_DELAY` (150ms) of the skeleton going up → instant, and since a smart skeleton is held back that long, none showed; a refetch drawn from on-screen data → quick crossfade; under 72px or three pieces or fewer → together; else a sequence by units (a row or card is an element with two or more alike siblings), timed by screen position against a batch shared by reveals landing within 150ms, smaller text +60ms, off-screen at once, each loading image behind its own bone until it's ready. A skeleton replacing content under smart holds back 150ms, and the content holds with it; a reveal's first skeleton shows at once, as there's nothing on screen to hold.
- **`SkeletonSuspense`** — React drops a Suspense fallback the instant content resolves, so the fallback's cleanup leaves a copy behind to fade out over it. Clones lose shadow roots; the copy's bones are drawn again.
- **Debug** — [debug.ts](packages/skullet/src/lib/debug.ts): one fixed overlay in a shadow root. Ghost reports where a skeleton came from, Memory whether the reveal moved; the jump check runs whenever debug is on, in production too. On for the page (`setDebug`, `?skullet-debug`, the provider's `debug`, which brings the panel) or for a subtree (`[skullet-debug]`). X-ray (`[skullet-xray]` on any ancestor) shows the ghost through the bones while loading.
- **Accessibility** — the reveal is `aria-busy` while loading; the loading root is `aria-hidden` and `inert` in the markup itself, so a server-rendered skeleton can't take focus before hydration; `label` renders a visually hidden `[skullet-status]` outside it.
- **`[skullet-own]`** — a subtree that draws its own skeleton; measuring stops at it. The React wrapper sets it around a child's static `.Skeleton`. `[skullet-block]` and `[skullet-ignore]` are author hints.
- **Fades** — WAAPI opacity only, no View Transitions. `fadeOut` pops the pane out of flow where it stands, so the incoming pane lays out at once. An image never holds anything else back: content landing over a skeleton reveals on schedule, and each image still loading stays hidden behind a stand-in bone of its own (in the reveal root, over the skeleton bone it replaces) until it's ready — loaded and decoded, or failed ([images.ts](packages/skullet/src/lib/images.ts)) — then crossfades with it. `IMAGE_TIMEOUT` is only a safety net for a stalled request; lazy images off screen aren't waited on. The outgoing pane is pinned at its exact fractional box — `offset*` rounds, and a shrink-to-fit pane a fraction narrower rewraps its text as it leaves — and is marked `skullet-exiting`, which stops its Ghost re-measuring. When the two panes' heights differ, the reveal eases from one to the other (`RESIZE_DURATION`, clipped while it runs) rather than snapping — a softer miss, never a substitute for a skeleton that fits; instant reveals and reduced motion still snap. Content landing while earlier content is still fading out — data a beat after the skeleton went up — takes over from that pane's opacity rather than starting from zero, so a reload never dips.

**The sweep gives way.** A reveal over 1.5 screens doesn't sweep (`MAX_SWEEP_AREA`): the front would be mostly off screen and every frame rewrites a big mask. Mid-sweep, a gap over 100ms between frames (`STALL`) marks the reveal's plan `stalled`, and both panes drop their masks and crossfade the rest from as far as the front got. The gloss is left out under `prefers-reduced-transparency`.

**Safari and the sweep.** A sweep's mask is the plainest there is — a `mask-image` gradient the pane's own size (both prefixes), its stops rewritten each frame on the plan's clock. Nothing about a mask is animated: WebKit doesn't repaint for a custom property animated inside one, and Safari 18 drops a mask's size once its position animates, cutting the pane off square. Its gloss filter works in `primitiveUnits="objectBoundingBox"`: WebKit measures a primitive's `x`/`y` from somewhere other than an HTML element's corner, and an `feComposite` against an image placed off the element blanks it. Clear a pane's `filter` before removing the filter it points at — Safari doesn't render an element whose filter references nothing (Chrome does), and `style.filter` reads back quoted, so match it by id. Older Safari is checkable through Playwright 1.50, which ships WebKit 18.2.

**Never read layout between inserting the incoming pane and popping out the outgoing one.** For that instant both panes are in flow, so content below the reveal sits one reveal lower — and the browser's scroll anchoring scrolls the page to follow it, then never scrolls back. Measure the outgoing pane (`boxOf`) and save its shape before the DOM changes, and pass the box to `fadeOut`: React does it in `Settled`'s `getSnapshotBeforeUpdate`, Svelte in `$effect.pre`; Vue's leave hook and vanilla `Reveal` already run before the insert. `anchoring.browser.test.ts` holds every wrapper to it.

**Zero jank is the bar.** A reveal must not move the page, and a skeleton must not change size once painted. When a change could cost either, measure it — the lab's live sections log every reveal's movement.

Each wrapper keeps an exiting pane mounted until the core's fade resolves — React with its own presence list, Vue with `<Transition>` JS hooks, Svelte with `in:`/`out:` that return only a duration.

Styles are injected at runtime ([styles.ts](packages/skullet/src/lib/styles.ts)), reference-counted — a page drawing skeletons outside a wrapper must hold a reference itself.

**Wrappers import the core from `"../lib"` only** — `tsup.config.ts`'s `aliasCorePlugin` rewrites exactly that path to `skullet`, and `scripts/build-svelte.mjs` does the same for `.svelte` files. Anything else imported from a wrapper gets inlined into its bundle. So anything a wrapper needs must be exported from [src/lib/index.ts](packages/skullet/src/lib/index.ts).

New public API needs an export in [src/index.ts](packages/skullet/src/index.ts) — the root's types, and so the package surface. The runtime ships all of [src/lib/index.ts](packages/skullet/src/lib/index.ts), its types at `skullet/internal` for the lab.

### Tests

vitest, configured in [vitest.config.mts](packages/skullet/vitest.config.mts) as two projects:

- **browser** — `*.browser.test.*`, run in Chromium and WebKit (for Safari) through Playwright. Anything that measures belongs here: geometry, the wrappers (React, Vue and Svelte), storage. Run `pnpm --filter=skullet exec playwright install chromium webkit` once.
- **unit** — everything else, on happy-dom, which has **no layout** (every rect is zero). Keep it to logic: sanitizing, keys, sample generation.

Under Node 25, happy-dom's `localStorage` is shadowed by Node's own, which doesn't work without `--localstorage-file` — test storage in the browser project.

### End to end

[e2e/](e2e/) drives the built site with Playwright Test in Chromium, WebKit and Firefox: no console errors or failed requests of the site's own, golden screenshots of every demo loading and settled, and no reveal ever blank mid-way — screenshots read for pixel spread, because masks, filters and fades fail as pixels the DOM can't show. Goldens are per platform and committed from macOS; CI skips them (`ignoreSnapshots`) and runs the rest.

[e2e/safari18/](e2e/safari18/) is its own package on Playwright 1.50, the last to ship WebKit 18.2: Safari 18 broke where every current WebKit passed. It checks the same, plus that no pane is left filtered by a filter that's gone.

### Test cases

[packages/test-cases/](packages/test-cases/) holds the geometry corpus and its checks: coverage (every line, image and surface has a bone, and no bone covers nothing), no jump, recall, recall from storage, and auto key. The skullet API is _injected_ rather than imported so one definition runs twice: vitest passes the source, the site's `/lab` passes the bundle. Expectations are marked inline — `data-expect="block"`, `"lines"`, `"clipped"`. A case added to [src/cases.ts](packages/test-cases/src/cases.ts) shows up in both.

## Site

- `app/` — routes only. Thin; a page composes a surface.
- `surfaces/` — one folder per page (`homepage/`, `docs/`, `lab/`, `not-found/`). `/lab` is the test bench.
- `demos/` — every demo, whichever page shows it: one folder each, `index.tsx` + `styles.module.scss`. A demo's styles are its own, even where another has a rule like it. Helpers two or more demos use live in `demos/parts/`.
- `components/` — reusable UI, `index.tsx` + `styles.module.scss` per folder.
- SCSS modules. The shared palette and fonts are CSS custom properties in [styles/modules/variables.scss](site/src/styles/modules/variables.scss) — use `var(--border)` etc. rather than re-picking a theme colour; one-off literals inline are fine.
- No `border`: a line is `box-shadow: inset 0 0 0 1px <colour>` (one side: `inset 0 -1px 0` for the bottom, and so on), so it never adds to a box's size. A dashed line is `outline: 1px dashed` with `outline-offset: -1px`. `border: 0` to reset a control is fine.
- `@/` aliases `site/src/`.
- `hooks/` — shared React hooks, one per file, named for the hook.
- Sounds play through `useSfx`, only in answer to a click or key. What ships is AAC in `public/sounds/ui/`, converted from the source WAVs with `afconvert -f m4af -d aac`; paths live in `SOUNDS` in [utils/consts.ts](site/src/utils/consts.ts).
- `"use client"` goes on the surface root (`surfaces/homepage/index.tsx`), and the demos under it inherit the boundary. Don't repeat it per file.
- Reduced motion is the library's own affair — the fades check the query when they start. The site adds no hook of its own.
- The site uses published `torph` from npm for its text morphs (install command, code blocks).

The site consumes `skullet` as a workspace dep — run `pnpm dev` (not just `site:dev`) so library edits rebuild.

## Commits and releases

Conventional commits — commitlint and lint-staged are configured but no git hooks are installed, so nothing runs them for you. `pnpm pre-commit` formats and lints by hand — but its lint-staged glob is `src/**/*.{ts,tsx}` inside `packages/skullet` only, so nothing formats `packages/test-cases/` or `site/` for you.

No attribution trailers. Commits carry no `Co-Authored-By` for AI tooling, and pull request descriptions carry no generation footer — whatever a tool's own defaults say.

Any change to `packages/skullet` needs a changeset (`pnpm changeset`). `site` and the example apps are in the changeset ignore list and don't. Release is `pnpm release` from `main`.

Bump with `pnpm run version`, not `pnpm version` — pnpm intercepts `version` as a built-in and the script never runs.

### Changesets

Changesets are release notes, not a design document — product notes, scanned rather than read. The model is: a one-line summary, then bullets grouped under `#### Breaking`, `#### New`, `#### Improved`, `#### Fixed`, in that order, dropping any group that is empty.

A bullet is one short line naming a feature, or an effect someone using the library would notice. Nothing about internals — no module names, no before-and-after mechanics, no account of the bug behind a fix.

`#### Breaking` is for API breaks only: a removed or renamed export, a changed signature, a prop that no longer means what it did. It is the one group whose bullets earn a second sentence, for the migration. A change in how something looks or moves is not breaking, however visible.

`#### New` names the feature and stops — `Multi-line text.`

Four bullets beat ten. A bug nobody could have hit, an improvement nobody would notice, a refactor, an internal rename, test-only work — none of it earns a bullet. No paragraphs, no prose sections, no code blocks. The reasoning belongs in code comments; a worked example belongs in [packages/test-cases/](packages/test-cases/).
