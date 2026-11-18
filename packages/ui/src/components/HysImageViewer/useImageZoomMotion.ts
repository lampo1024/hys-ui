import { nextTick, onBeforeUnmount, onDeactivated, ref, watch, type Ref } from "vue";
export function useImageZoomMotion(
  image: Readonly<Ref<HTMLImageElement | null>>,
  effectiveMotion: Readonly<Ref<string>>,
) {
  const zooming = ref(false);
  let animation: Animation | undefined;
  let revision = 0;

  function cancel() {
    revision++;
    const current = animation;
    animation = undefined;
    zooming.value = false;
    current?.cancel();
  }

  function zoom(change: () => void, align: () => void) {
    const target = image.value;
    const from = effectiveMotion.value !== "off" && target?.animate
      ? target.getBoundingClientRect()
      : undefined;
    cancel();
    const ticket = revision;
    change();
    void nextTick(() => {
      if (ticket !== revision || target !== image.value) return;
      align();
      if (!from?.width || !target?.isConnected || effectiveMotion.value === "off") return;
      const to = target.getBoundingClientRect();
      if (!to.width || !to.height) return;
      const dx = from.left + from.width / 2 - to.left - to.width / 2;
      const dy = from.top + from.height / 2 - to.top - to.height / 2;
      const scale = from.width / to.width;
      if (Math.abs(scale - 1) < .001 && Math.hypot(dx, dy) < 1) return;
      const transform = target.style.transform;
      const current = target.animate([
        { transform: `translate(${dx}px, ${dy}px) ${transform} scale(${scale})` },
        { transform },
      ], {
        duration: effectiveMotion.value === "full" ? 190 : 145,
        easing: "cubic-bezier(.2,.7,.25,1)",
      });
      animation = current;
      zooming.value = true;
      current.onfinish = current.oncancel = () => {
        if (animation !== current) return;
        animation = undefined;
        zooming.value = false;
      };
    });
  }

  watch(effectiveMotion, mode => { if (mode === "off") cancel(); });
  onDeactivated(cancel);
  onBeforeUnmount(cancel);
  return { cancel, zoom, zooming };
}
