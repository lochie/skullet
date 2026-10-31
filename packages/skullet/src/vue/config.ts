import {
  defineComponent,
  h,
  inject,
  provide,
  watch,
  type InjectionKey,
  type PropType,
} from "vue";
import {
  setDebug,
  skulletCSS,
  type SkulletMode,
  type SkulletText,
  type SkulletTheme,
  type RevealMode,
} from "../lib";

export type SkulletConfig = {
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
};

const key: InjectionKey<SkulletConfig> = Symbol("skullet");

/** Per server render: whether the full inline script has gone out yet, so the skeletons after it send a stub. */
const bootKey: InjectionKey<{ sent: boolean }> = Symbol("skullet.boot");

export const useSkullet = () => inject(key, {});

/** Whether this skeleton should send the stub — claiming the full script if it's the first. */
export function claimStub() {
  const boot = inject(bootKey, null);
  const stub = !!boot?.sent;
  if (boot) boot.sent = true;
  return stub;
}

/** Settings for every skullet component inside — per request on the server, as a nonce must be. */
export const SkulletProvider = defineComponent({
  name: "SkulletProvider",
  props: {
    nonce: String,
    theme: Object as PropType<SkulletTheme>,
    mode: String as PropType<SkulletMode>,
    text: Object as PropType<SkulletText>,
    reveal: [String, Object] as PropType<RevealMode>,
    debug: { type: Boolean, default: undefined },
  },
  setup(props, { slots }) {
    // The props object itself, so components inside read every change
    provide(key, props);
    provide(bootKey, { sent: false });

    watch(
      () => props.debug,
      (debug) => {
        if (debug !== undefined && typeof window !== "undefined")
          setDebug(debug);
      },
      { immediate: true },
    );

    return () => {
      const css = skulletCSS(props);
      return [
        css ? h("style", { nonce: props.nonce }, css) : null,
        slots.default?.(),
      ];
    };
  },
});
