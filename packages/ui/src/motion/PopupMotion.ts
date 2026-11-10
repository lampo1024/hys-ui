import {
  Transition,
  computed,
  defineComponent,
  h,
  inject,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
  type PropType,
} from "vue";
import { useHysRootAttrs } from "../config";
import { overlayOwnerKey } from "../composables/overlayManager";
import type { HysPopupTransition } from "./popup";

/** Internal transparent boundary: preserves the popup DOM/ref and owns only its transition. */
export default defineComponent({
  name: "HysPopupMotion",
  props: {
    popupTransition: {
      type: String as PropType<HysPopupTransition>,
      default: undefined,
    },
    popupTransitionDuration: { type: Number, default: undefined },
    placement: { type: String, default: "bottom-start" },
    disabled: { type: Boolean, default: false },
    ignoreOwner: { type: Boolean, default: false },
  },
  emits: ["inactive", "entered", "left"],
  setup(props, { slots, emit }) {
    const skin = useHysRootAttrs(),
      active = ref(true),
      reduced = ref(
        typeof window !== "undefined" &&
          !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      ),
      owner = inject(overlayOwnerKey, undefined);
    let media: MediaQueryList | undefined,
      attached = false;
    const effect = computed(() => props.popupTransition ?? "scale"),
      duration = computed(() =>
        Number.isFinite(props.popupTransitionDuration)
          ? Math.max(0, Math.min(2000, props.popupTransitionDuration!))
          : 160,
      );
    const allowed = computed(
      () => active.value && (props.ignoreOwner || owner?.value !== false),
    );
    const css = computed(
      () =>
        !props.disabled &&
        effect.value !== "none" &&
        duration.value > 0 &&
        skin.value["data-hys-motion"] !== "off" &&
        !reduced.value,
    );
    let current: HTMLElement | undefined;
    const hidden = new WeakMap<
      Element,
      { inert: boolean; aria: string | null; pointer: string }
    >();
    function update() {
      reduced.value = !!media?.matches;
    }
    function attach() {
      if (attached) return;
      attached = true;
      media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      update();
      media?.addEventListener("change", update);
    }
    function detach() {
      attached = false;
      media?.removeEventListener("change", update);
    }
    function prepare(node: Element) {
      const element = node as HTMLElement,
        previous = hidden.get(node);
      if (previous) {
        element.inert = previous.inert;
        if (previous.aria === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", previous.aria);
        element.style.pointerEvents = previous.pointer;
        hidden.delete(node);
      }
      element.classList.add("hys-ui-popup-motion");
      element.style.setProperty(
        "--hys-ui-popup-duration",
        duration.value + "ms",
      );
      current = element;
      position(element);
    }
    function position(element: HTMLElement) {
      const place = props.placement;
      element.style.setProperty(
        "--hys-ui-popup-origin",
        place.startsWith("top")
          ? "bottom center"
          : place === "left"
            ? "right center"
            : place === "right"
              ? "left center"
              : "top center",
      );
      element.style.setProperty(
        "--hys-ui-popup-x",
        place === "left" ? "6px" : place === "right" ? "-6px" : "0px",
      );
      element.style.setProperty(
        "--hys-ui-popup-y",
        place === "left" || place === "right"
          ? "0px"
          : place.startsWith("top")
            ? "6px"
            : "-6px",
      );
    }
    function leaving(node: Element) {
      const element = node as HTMLElement;
      prepare(node);
      hidden.set(node, {
        inert: element.inert,
        aria: element.getAttribute("aria-hidden"),
        pointer: element.style.pointerEvents,
      });
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
      element.style.pointerEvents = "none";
    }
    watch(
      () => props.placement,
      () => {
        if (current?.isConnected) position(current);
      },
      { flush: "post" },
    );
    onMounted(attach);
    onActivated(() => {
      active.value = true;
      attach();
    });
    onDeactivated(() => {
      active.value = false;
      detach();
      emit("inactive");
    });
    onBeforeUnmount(detach);
    watch(
      () => owner?.value,
      (value) => {
        if (value === false && !props.ignoreOwner) emit("inactive");
      },
      { flush: "sync" },
    );
    return () =>
      allowed.value
        ? h(
            Transition,
            {
              name: "hys-ui-popup-" + effect.value,
              appear: true,
              css: css.value,
              onAfterEnter: () => emit("entered"),
              onAfterLeave: () => emit("left"),
              onBeforeEnter: prepare,
              onEnterCancelled: prepare,
              onBeforeLeave: leaving,
              onLeaveCancelled: prepare,
            },
            slots.default,
          )
        : null;
  },
});
