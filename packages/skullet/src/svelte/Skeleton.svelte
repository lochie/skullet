<script lang="ts" generics="T">
  import { getContext, onMount, untrack, type Snippet } from 'svelte';
  import {
    addStyles,
    ATTR_BONES,
    ATTR_GHOST,
    ATTR_LOADING,
    ATTR_OWN,
    ATTR_PANE,
    ATTR_REVEAL,
    ATTR_SNAPSHOT,
    ATTR_STATUS,
    boxOf,
    exitDuration,
    fadeIn,
    fadeOut,
    Ghost,
    inlineScriptTag,
    Memory,
    prefersReducedMotion,
    removeStyles,
    type GhostOptions,
    type MemoryOptions,
    type PaneBox,
    type RevealMode,
  } from '../lib';

  type Props = {
    /** Shows the skeleton, even over `data`. With `data`, it also shows while there is none. */
    loading?: boolean;
    /** Loading while `null` or `undefined`; handed to `children`. */
    data?: T | null;
    /** Stands in for `data` to draw the skeleton before any has loaded. */
    sample?: T;
    /** Remembers the shape under this key across visits. */
    id?: string;
    /** Read to screen readers while loading, in place of the skeleton — "Loading profile". */
    label?: string;
    empty?: boolean;
    error?: unknown;
    children?: Snippet<[T]>;
    skeleton?: Snippet;
    emptyMessage?: Snippet;
    errorMessage?: Snippet<[unknown]>;
    class?: string;
    style?: string;
  };

  let props: Props = $props();

  // Set by SkulletProvider, when there is one
  const config =
    getContext<
      { nonce?: string; reveal?: RevealMode; boot?: { sent: boolean } } | undefined
    >('skullet') ?? {};

  // The full script once a page where a provider keeps count — claimed when first rendered, the skeletons after it send a stub
  let tag: string | undefined;
  function scriptTag() {
    if (tag === undefined) {
      const stub = !!config.boot?.sent;
      if (config.boot) config.boot.sent = true;
      tag = inlineScriptTag(config.nonce, stub);
    }
    return tag;
  }

  // Data-driven when `data` is bound at all, even to null
  const driven = $derived('data' in props);

  // The last data shown, so a reload's skeleton has its exact shape — of the same `id` only
  let last: { id?: string; data: T } | null = null;
  $effect(() => {
    if (props.data != null) last = { id: props.id, data: props.data };
  });

  // A snippet fed data has nothing to render without it, so that's a skeleton too
  const loading = $derived(
    !!props.loading ||
      (driven && props.data == null && !props.error && !props.empty),
  );
  const real = $derived(
    props.data ?? (last && last.id === props.id ? last.data : null),
  );
  const shown = $derived(real ?? props.sample);

  const key = $derived(
    loading ? 'skeleton' : props.error ? 'error' : props.empty ? 'empty' : 'content',
  );

  // The pane on screen, and the memory of its shape when it's content
  let current: HTMLElement | null = null;
  let remembered: Memory | null = null;
  const boxes = new WeakMap<Element, PaneBox>();

  // Before Svelte swaps the branch, while measuring can't trip scroll anchoring
  $effect.pre(() => {
    key;
    untrack(() => {
      if (!current?.isConnected) return;
      remembered?.save();
      boxes.set(current, boxOf(current));
    });
  });

  // Svelte plays no intro for a reveal's first pane, so its arrival is started here
  let first = true;
  function track(node: HTMLElement) {
    current = node;
    if (first) fadeIn(node, config.reveal, { initial: true });
    first = false;
  }

  onMount(() => {
    addStyles();
    return removeStyles;
  });

  const pane = { [ATTR_PANE]: '' };

  // The fades are the core's; Svelte only needs to know how long to keep the node
  const duration = () => (prefersReducedMotion() ? 0 : exitDuration(config.reveal));

  function enter(node: HTMLElement) {
    fadeIn(node, config.reveal);
    return { duration: duration() };
  }

  function exit(node: HTMLElement) {
    fadeOut(node, boxes.get(node));
    return { duration: duration() };
  }

  function ghost(node: HTMLElement, options: GhostOptions) {
    let controller = new Ghost(node, options);
    return {
      update(next: GhostOptions) {
        controller.destroy();
        controller = new Ghost(node, next);
      },
      destroy: () => controller.destroy(),
    };
  }

  function memory(node: HTMLElement, options: MemoryOptions) {
    const controller = new Memory(node, options);
    remembered = controller;
    return {
      destroy: () => {
        controller.destroy();
        if (remembered === controller) remembered = null;
      },
    };
  }
</script>

{#snippet render(value: T | null | undefined)}
  {#if !driven}
    {@render props.children?.(value as T)}
  {:else if value != null}
    {@render props.children?.(value)}
  {/if}
{/snippet}

<div
  {...{ [ATTR_REVEAL]: '' }}
  aria-busy={loading || undefined}
  class={props.class}
  style={props.style}
>
  {#if loading}
    <div {...pane} use:track in:enter out:exit>
      {#if props.skeleton}
        <div {...{ [ATTR_OWN]: '' }} aria-hidden="true">{@render props.skeleton()}</div>
      {:else}
        {#if props.label}
          <span {...{ [ATTR_STATUS]: '' }}>{props.label}</span>
        {/if}
        <!-- Snapshot and bones are Ghost's to fill, never Svelte's -->
        <div
          {...{ [ATTR_LOADING]: '' }}
          aria-hidden="true"
          inert
          use:ghost={{ id: props.id, exact: real != null, refetch: props.data != null }}
        >
          <div {...{ [ATTR_GHOST]: '' }}>{@render render(shown)}</div>
          <div {...{ [ATTR_SNAPSHOT]: '' }}></div>
          <div {...{ [ATTR_BONES]: '' }}></div>
        </div>
        {@html scriptTag()}
      {/if}
    </div>
  {:else if props.error}
    <div {...pane} use:track in:enter out:exit>
      {@render props.errorMessage?.(props.error)}
    </div>
  {:else if props.empty}
    <div {...pane} use:track in:enter out:exit>
      {#if props.emptyMessage}
        {@render props.emptyMessage()}
      {:else}
        {@render render(props.data)}
      {/if}
    </div>
  {:else}
    <div {...pane} use:track in:enter out:exit>
      <div
        use:memory={{
          id: props.id,
          data: props.data,
          rendered: driven,
          sample: props.sample !== undefined,
        }}
      >
        {@render render(props.data)}
      </div>
    </div>
  {/if}
</div>
