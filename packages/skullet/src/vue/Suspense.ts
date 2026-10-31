import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  Suspense,
  type PropType,
} from "vue";
import {
  ATTR_LOADING,
  ATTR_PANE,
  ATTR_REVEAL,
  boxOf,
  fadeIn,
  fadeOut,
  Ghost,
  Memory,
} from "../lib";
import { useSkullet } from "./config";
import { Loading, useStyles } from "./Skeleton";

type State = { waited: boolean; exit: (() => void) | null };
const state = { type: Object as PropType<State>, required: true } as const;

const Fallback = defineComponent({
  name: "SkeletonFallback",
  props: { id: String, label: String, state },
  setup(props, { slots }) {
    const element = ref<HTMLElement | null>(null);
    const config = useSkullet();

    onMounted(() => {
      const pane = element.value;
      const reveal = pane?.parentElement;
      if (!pane || !reveal) return;
      props.state.waited = true;
      fadeIn(pane, config.reveal, { initial: true });
      reveal.setAttribute("aria-busy", "true");
    });

    onBeforeUnmount(() => {
      const pane = element.value;
      const reveal = pane?.parentElement;
      if (!pane || !reveal) return;
      reveal.removeAttribute("aria-busy");

      // Measured now, alone in flow; the copy fades out once the content has decided how it arrives
      const box = boxOf(pane);
      const copy = pane.cloneNode(true) as HTMLElement;
      props.state.exit = () => {
        Object.assign(copy.style, {
          position: "absolute",
          top: `${box.top}px`,
          left: `${box.left}px`,
          width: `${box.width}px`,
        });
        reveal.prepend(copy);

        // A clone leaves its skeleton's shadow root behind; draw it again
        const loading = copy.querySelector<HTMLElement>(`[${ATTR_LOADING}]`);
        if (loading)
          new Ghost(loading, { id: props.id, exact: true }).destroy();
        fadeOut(copy, box).then(() => copy.remove());
      };
    });

    // A skeleton given is what the content will be — drawn as given, not swapped for a remembered shape
    return () =>
      h("div", { ref: element, [ATTR_PANE]: "" }, [
        h(
          Loading,
          { id: props.id, exact: !!slots.default, label: props.label },
          slots.default,
        ),
      ]);
  },
});

const Content = defineComponent({
  name: "SkeletonSuspenseContent",
  props: { id: String, state },
  emits: ["reveal"],
  setup(props, { slots, emit }) {
    const element = ref<HTMLElement | null>(null);
    const config = useSkullet();
    let memory: Memory | null = null;

    onMounted(() => {
      const pane = element.value;
      if (!pane) return;
      const { waited } = props.state;
      const arrival = fadeIn(pane, config.reveal, { initial: !waited });
      if (waited) arrival.then(() => emit("reveal"));
      props.state.exit?.();
      props.state.exit = null;
      memory = new Memory(pane, { id: props.id });
    });
    onBeforeUnmount(() => memory?.destroy());

    return () => h("div", { ref: element, [ATTR_PANE]: "" }, slots.default?.());
  },
});

/** A Suspense boundary whose fallback is a measured skeleton, crossfading into the content. */
export const SkeletonSuspense = defineComponent({
  name: "SkeletonSuspense",
  props: {
    /** Remembers the shape under this key across visits. */
    id: String,
    /** Read to screen readers while suspended, in place of the skeleton. */
    label: String,
  },
  /** `reveal`: content has come in over the skeleton. */
  emits: ["reveal"],
  setup(props, { slots, emit }) {
    useStyles();
    const shared: State = { waited: false, exit: null };

    return () =>
      h("div", { [ATTR_REVEAL]: "" }, [
        h(Suspense, null, {
          default: () =>
            h(
              Content,
              { id: props.id, state: shared, onReveal: () => emit("reveal") },
              slots.default,
            ),
          fallback: () =>
            h(
              Fallback,
              { id: props.id, label: props.label, state: shared },
              slots.skeleton,
            ),
        }),
      ]);
  },
});
