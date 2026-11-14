import {
  computed, inject, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted,
  ref, watch, type CSSProperties, type Ref,
} from "vue";
import { useChoiceModel } from "../../composables/choiceModel";
import { overlayOwnerKey } from "../../composables/overlayManager";
import type { HysTooltipInstance } from "../../composables/popupSurface";
import { useDialog } from "../../composables/useDialog";

interface FullscreenOptions {
  fullscreen?: boolean;
  defaultFullscreen: boolean;
  fullscreenTransition: boolean;
}

export function useCardFullscreen(
  element: Ref<HTMLElement | undefined>,
  props: FullscreenOptions,
  fullscreenHint: Readonly<Ref<HysTooltipInstance | undefined>>,
  motionEnabled: () => boolean,
  request: (value: boolean) => void,
  change: (value: boolean) => void,
) {
  const model = useChoiceModel({ get modelValue() { return props.fullscreen; } }, () => props.defaultFullscreen);
  const mounted = ref(false);
  const owner = inject(overlayOwnerKey, undefined);
  const fullscreen = computed(() => mounted.value && owner?.value !== false && model.current.value);
  const placeholder = ref<CSSProperties>();
  let focusOrigin: HTMLElement | null = null;
  let animation: Animation | undefined;
  let version = 0;
  let reducedMotion: MediaQueryList | undefined;

  async function setFullscreen(value: boolean) {
    const hint = fullscreenHint.value;
    if (hint?.open) await hint.hide();
    return model.commit(value, request, change);
  }

  const dialog = useDialog(fullscreen, element, () => { void setFullscreen(false); }, {
    provideOwner: false,
    initialFocus: () => element.value,
    restoreFocusTo: () => focusOrigin,
    onOpenAutoFocus(event) {
      const hint = fullscreenHint.value;
      if (!hint?.referenceElement?.isConnected) return;
      event.preventDefault();
      hint.focus({ suppressTooltip: true });
    },
    onCloseAutoFocus(event) {
      const hint = fullscreenHint.value;
      if (!hint?.referenceElement?.isConnected || hint.referenceElement !== focusOrigin) return;
      event.preventDefault();
      hint.focus({ suppressTooltip: true });
    },
  });

  function cancelMotion() {
    version++;
    animation?.cancel();
    animation = undefined;
    element.value?.removeAttribute("data-card-fullscreen-motion");
  }

  function canAnimate() {
    return props.fullscreenTransition && motionEnabled() && !reducedMotion?.matches;
  }

  watch(fullscreen, async (value) => {
    void fullscreenHint.value?.hide();
    const target = element.value;
    const animate = !!target?.animate && canAnimate() && target.isConnected;
    const from = animate ? target.getBoundingClientRect() : undefined;
    const fromRadius = animate ? getComputedStyle(target).borderRadius : undefined;
    cancelMotion();
    if (value && target) {
      const style = getComputedStyle(target);
      const focused = target.ownerDocument.activeElement;
      focusOrigin = focused instanceof HTMLElement ? focused : null;
      placeholder.value = {
        blockSize: `${target.offsetHeight}px`,
        inlineSize: `${target.offsetWidth}px`,
        margin: style.margin,
        gridArea: style.gridArea,
        alignSelf: style.alignSelf,
        flex: style.flex,
      };
    } else placeholder.value = undefined;

    if (!target || !from?.width || !from.height) return;
    const ticket = version;
    await nextTick();
    if (ticket !== version || !target.isConnected) return;
    const to = target.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const style = getComputedStyle(target);
    const base = style.transform === "none" ? "" : style.transform;
    target.dataset.cardFullscreenMotion = value ? "enter" : "leave";
    const current = target.animate([
      {
        transformOrigin: "0 0",
        transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) ${base} scale(${from.width / to.width}, ${from.height / to.height})`,
        borderRadius: fromRadius,
      },
      { transformOrigin: "0 0", transform: base || "none", borderRadius: style.borderRadius },
    ], { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" });
    animation = current;
    current.onfinish = current.oncancel = () => {
      if (animation !== current) return;
      animation = undefined;
      target.removeAttribute("data-card-fullscreen-motion");
    };
  });

  function motionPreferenceChanged() {
    if (!canAnimate()) cancelMotion();
  }

  function deactivate() {
    mounted.value = false;
    cancelMotion();
  }

  watch([() => props.fullscreenTransition, motionEnabled], motionPreferenceChanged, { flush: "sync" });
  onMounted(() => {
    reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    reducedMotion?.addEventListener?.("change", motionPreferenceChanged);
    mounted.value = true;
  });
  onActivated(() => { mounted.value = true; });
  onDeactivated(deactivate);
  onBeforeUnmount(() => {
    cancelMotion();
    reducedMotion?.removeEventListener?.("change", motionPreferenceChanged);
  });

  return { fullscreen, placeholder, zIndex: dialog.zIndex, setFullscreen };
}
