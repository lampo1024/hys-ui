import { nextTick, onBeforeUnmount, onDeactivated, watch, type Ref } from "vue";

export function useSpreadsheetFullscreenMotion(
  element: Readonly<Ref<HTMLElement | null>>,
  fullscreen: Ref<boolean>,
  motion: Readonly<Ref<string>>,
) {
  let animation: Animation | undefined;
  let version = 0;

  function cancel() {
    version++;
    animation?.cancel();
    animation = undefined;
    element.value?.removeAttribute("data-fullscreen-motion");
  }

  async function setFullscreen(value: boolean) {
    if (fullscreen.value === value) return;
    const target = element.value;
    const mode = motion.value;
    const before =
      target?.animate && mode !== "off"
        ? target.getBoundingClientRect()
        : undefined;
    cancel();
    fullscreen.value = value;
    if (!target || !before?.width || !before.height) return;

    const ticket = version;
    await nextTick();
    if (ticket !== version || target !== element.value || !target.isConnected)
      return;
    const after = target.getBoundingClientRect();
    if (!after.width || !after.height) return;
    const limit = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));
    const x = limit(
      before.left + before.width / 2 - after.left - after.width / 2,
      -28,
      28,
    );
    const y = limit(
      before.top + before.height / 2 - after.top - after.height / 2,
      -28,
      28,
    );
    const scale = limit(
      Math.sqrt((before.width * before.height) / (after.width * after.height)),
      0.95,
      1.04,
    );
    target.dataset.fullscreenMotion = value ? "enter" : "leave";
    const current = target.animate(
      [
        {
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          opacity: 0.84,
        },
        { transform: "none", opacity: 1 },
      ],
      {
        duration: mode === "full" ? 260 : 190,
        easing: "cubic-bezier(.2,.75,.25,1)",
      },
    );
    animation = current;
    current.onfinish = () => {
      if (animation === current) cancel();
    };
    current.oncancel = current.onfinish;
  }

  watch(motion, (mode) => {
    if (mode === "off") cancel();
  });
  onDeactivated(cancel);
  onBeforeUnmount(cancel);

  return setFullscreen;
}
