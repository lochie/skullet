<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  import {
    setDebug,
    themeStyleTag,
    type SkulletMode,
    type SkulletText,
    type SkulletTheme,
    type RevealMode,
  } from '../lib';

  type Props = {
    /** Set on the inline script and stylesheets skullet renders, for a Content Security Policy. */
    nonce?: string;
    theme?: SkulletTheme;
    mode?: SkulletMode;
    /** Where text bars run: from `top` (ascender, cap-height, x-height) down to `bottom` (baseline, descender). */
    text?: SkulletText;
    /** How content replaces its skeleton: `smart` (the default), `together`, `sequence`, `sweep`, or a `RevealSpec` of your own. */
    reveal?: RevealMode;
    /** Outlines every reveal with where its skeleton came from and whether anything moved. */
    debug?: boolean;
    children?: Snippet;
  };

  let props: Props = $props();

  // Getters, so components inside read every change; `boot` counts, per server render, whether the full inline script has gone out
  const boot = { sent: false };
  setContext('skullet', {
    boot,
    get nonce() {
      return props.nonce;
    },
    get reveal() {
      return props.reveal;
    },
  });

  $effect(() => {
    if (props.debug !== undefined) setDebug(props.debug);
  });
</script>

{@html themeStyleTag(props, props.nonce)}
{@render props.children?.()}
