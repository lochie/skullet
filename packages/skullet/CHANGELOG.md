# skullet

## 0.0.2

### Patch Changes

- 7370489: The first release: skeletons measured from your own content, so nothing moves when it loads.

  #### New
  - `Skeleton` for React, Vue and Svelte, `SkeletonSuspense` for React and Vue, `Reveal` for plain JavaScript, a `<skullet-reveal>` web component, and `SkeletonBox` for a single placeholder.
  - Skeletons from `sample` data, remembered shapes or server-rendered HTML, painted before the first frame.
  - `smart`, `together`, `sequence` and `sweep` reveals, or your own with a `RevealSpec`.
  - `onReveal`, called once content is in, and in Svelte, a promise as `data`.
  - Theming: colours, radius, line heights, animation and speed.
  - A debug overlay, for the whole page or one part of it.
