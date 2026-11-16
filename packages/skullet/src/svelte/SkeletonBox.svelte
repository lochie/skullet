<script lang="ts">
  import { onMount } from 'svelte';
  import {
    addStyles,
    ATTR_BAR,
    removeStyles,
    queueShimmer,
    skeletonBoxStyle,
    type SkeletonBoxOptions,
  } from '../lib';

  type Props = SkeletonBoxOptions & {
    class?: string;
    style?: string;
  };

  let { height, width, radius, ...props }: Props = $props();

  let element: HTMLSpanElement;
  const bar = $derived(skeletonBoxStyle({ height, width, radius }));

  onMount(() => {
    addStyles();
    queueShimmer(element);
    return removeStyles;
  });
</script>

<span
  bind:this={element}
  {...{ [ATTR_BAR]: '' }}
  {...props}
  style:height={bar.height}
  style:width={bar.width}
  style:border-radius={bar.borderRadius}
></span>
