import {
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  Transition,
  watch,
  type PropType,
  type VNodeChild,
} from "vue";
import {
  addStyles,
  ATTR_BAR,
  ATTR_BONES,
  ATTR_GHOST,
  ATTR_LOADING,
  ATTR_OWN,
  ATTR_PANE,
  ATTR_REVEAL,
  ATTR_SNAPSHOT,
  ATTR_STATUS,
  fadeIn,
  fadeOut,
  Ghost,
  INLINE_SCRIPT,
  INLINE_STUB,
  Memory,
  removeStyles,
  shimmer,
  skeletonBoxStyle,
  type MemoryOptions,
} from "../lib";
import { claimStub, useSkullet } from "./config";

const length = [String, Number] as PropType<string | number>;

function useStyles() {
  onBeforeMount(addStyles);
  onUnmounted(removeStyles);
}

export const SkeletonBox = defineComponent({
  name: "SkeletonBox",
  props: {
    height: length,
    width: length,
    radius: length,
  },
  setup(props) {
    const element = ref<HTMLElement | null>(null);
    useStyles();
    onMounted(() => {
      if (element.value) shimmer(element.value);
    });
    return () =>
      h("span", {
        ref: element,
        [ATTR_BAR]: "",
        style: skeletonBoxStyle(props),
      });
  },
});

const Loading = defineComponent({
  name: "SkeletonLoading",
  props: {
    id: String,
    exact: Boolean,
    refetch: Boolean,
    label: String,
  },
  setup(props, { slots }) {
    const element = ref<HTMLElement | null>(null);
    const config = useSkullet();
    const script = claimStub() ? INLINE_STUB : INLINE_SCRIPT;
    let ghost: Ghost | null = null;

    const attach = () => {
      ghost?.destroy();
      if (element.value) {
        ghost = new Ghost(element.value, {
          id: props.id,
          exact: props.exact,
          refetch: props.refetch,
        });
      }
    };
    onMounted(attach);
    watch(() => [props.id, props.exact, props.refetch], attach);
    onBeforeUnmount(() => ghost?.destroy());

    // Snapshot and bones are Ghost's to fill, never Vue's
    return () => [
      props.label ? h("span", { [ATTR_STATUS]: "" }, props.label) : null,
      h(
        "div",
        {
          ref: element,
          [ATTR_LOADING]: "",
          "aria-hidden": "true",
          inert: "",
        },
        [
          h("div", { [ATTR_GHOST]: "" }, slots.default?.()),
          h("div", { [ATTR_SNAPSHOT]: "" }),
          h("div", { [ATTR_BONES]: "" }),
        ],
      ),
      h("script", { nonce: config.nonce, innerHTML: script }),
    ];
  },
});

const Content = defineComponent({
  name: "SkeletonContent",
  props: {
    memory: { type: Object as PropType<MemoryOptions>, required: true },
  },
  setup(props, { slots }) {
    const element = ref<HTMLElement | null>(null);
    let memory: Memory | null = null;

    onMounted(() => {
      if (element.value) memory = new Memory(element.value, props.memory);
    });
    onBeforeUnmount(() => memory?.destroy());

    return () => h("div", { ref: element }, slots.default?.());
  },
});

export const Skeleton = defineComponent({
  name: "Skeleton",
  props: {
    /** Shows the skeleton, even over `data`. With `data`, it also shows while there is none. */
    loading: { type: Boolean, default: undefined },
    /** Loading while `null` or `undefined`; handed to the default slot as `{ data }`. */
    data: { type: null as unknown as PropType<unknown>, required: false },
    /** Stands in for `data` to draw the skeleton before any has loaded. */
    sample: { type: null as unknown as PropType<unknown>, required: false },
    /** Remembers the shape under this key across visits. */
    id: String,
    /** Read to screen readers while loading, in place of the skeleton — "Loading profile". */
    label: String,
    empty: Boolean,
    error: { type: null as unknown as PropType<unknown>, required: false },
  },
  setup(props, { slots }) {
    const instance = getCurrentInstance();
    const config = useSkullet();
    // The last data shown, so a reload's skeleton has its exact shape — of the same `id` only
    let last: { id?: string; data: unknown } | null = null;
    useStyles();

    return () => {
      // Data-driven when `data` is bound at all, even to null
      const driven = !!instance?.vnode.props && "data" in instance.vnode.props;
      const data = props.data;
      if (data != null) last = { id: props.id, data };

      const show = (value: unknown): VNodeChild =>
        driven
          ? value != null
            ? slots.default?.({ data: value })
            : null
          : slots.default?.({ data: undefined });

      // A slot fed data has nothing to render without it, so that's a skeleton too
      const loading =
        !!props.loading ||
        (driven && data == null && !props.error && !props.empty);

      let key: string;
      let content: VNodeChild;
      if (loading) {
        const previous = last as { id?: string; data: unknown } | null;
        const real =
          data ?? (previous && previous.id === props.id ? previous.data : null);
        key = "skeleton";
        content = slots.skeleton
          ? // Marked as drawing its own skeleton, so the reveal treats it as one
            h(
              "div",
              { [ATTR_OWN]: "", "aria-hidden": "true" },
              slots.skeleton(),
            )
          : h(
              Loading,
              {
                id: props.id,
                exact: real != null,
                refetch: data != null,
                label: props.label,
              },
              () => show(real ?? props.sample),
            );
      } else if (props.error) {
        key = "error";
        content = slots.error?.({ error: props.error });
      } else if (props.empty) {
        key = "empty";
        content = slots.empty?.() ?? show(data);
      } else {
        key = "content";
        content = h(
          Content,
          {
            memory: {
              id: props.id,
              data,
              rendered: driven,
              sample: props.sample !== undefined,
            },
          },
          () => show(data),
        );
      }

      const { reveal } = config;
      return h(
        "div",
        { [ATTR_REVEAL]: "", "aria-busy": loading || undefined },
        [
          h(
            Transition,
            {
              css: false,
              appear: true,
              onAppear: (el, done) =>
                fadeIn(el as HTMLElement, reveal, { initial: true }).then(done),
              onEnter: (el, done) =>
                fadeIn(el as HTMLElement, reveal).then(done),
              onLeave: (el, done) => fadeOut(el as HTMLElement).then(done),
            },
            () => h("div", { key, [ATTR_PANE]: "" }, [content]),
          ),
        ],
      );
    };
  },
});
