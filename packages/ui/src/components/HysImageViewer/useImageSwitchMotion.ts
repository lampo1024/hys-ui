import { nextTick, onBeforeUnmount, onDeactivated, shallowRef, useTemplateRef, watch, type Ref } from "vue";

export type HysImageViewerTransition = "none" | "fade" | "slide" | "zoom";
export type ImageDirection = 1 | -1;

type Snapshot = {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  transform: string;
};

export function useImageSwitchMotion(
  image: Readonly<Ref<HTMLImageElement | null>>,
  stage: Readonly<Ref<HTMLElement | null>>,
  mode: () => HysImageViewerTransition,
  motion: Readonly<Ref<string>>,
) {
  const outgoing = shallowRef<Snapshot>();
  const outgoingImage = useTemplateRef<HTMLImageElement>("outgoingImage");
  let animations: Animation[] = [];
  let direction: ImageDirection = 1;
  let revision = 0;

  function cancelAnimations() {
    revision++;
    for (const animation of animations) {
      animation.onfinish = null;
      animation.cancel();
    }
    animations = [];
  }
  function finish() {
    cancelAnimations();
    outgoing.value = undefined;
  }

  function snapshot(turns: number): Snapshot | undefined {
    const photo = image.value;
    const container = stage.value;
    if (!photo || !container) return;
    const imageRect = photo.getBoundingClientRect();
    const stageRect = container.getBoundingClientRect();
    if (!imageRect.width || !imageRect.height || !stageRect.width || !stageRect.height) return;
    const scaleX = container.clientWidth / stageRect.width;
    const scaleY = container.clientHeight / stageRect.height;
    const width = imageRect.width * scaleX;
    const height = imageRect.height * scaleY;
    const sideways = turns % 2 !== 0;
    return {
      src: photo.currentSrc || photo.src,
      left: (imageRect.left + imageRect.width / 2 - stageRect.left) * scaleX,
      top: (imageRect.top + imageRect.height / 2 - stageRect.top) * scaleY,
      width: sideways ? height : width,
      height: sideways ? width : height,
      transform: "translate(-50%, -50%) rotate(" + turns * 90 + "deg)",
    };
  }
  function prepare(next: ImageDirection, ready: boolean, turns: number) {
    if (mode() === "none" || motion.value === "off" || !image.value?.animate) {
      finish();
      return;
    }
    const previous = ready ? snapshot(turns) : outgoing.value;
    cancelAnimations();
    direction = next;
    outgoing.value = previous;
  }

  function transition() {
    if (!outgoing.value) return;
    const ticket = revision;
    void nextTick(() => {
      if (ticket !== revision) return;
      const current = image.value;
      const previous = outgoingImage.value;
      if (!current?.animate || !previous?.animate || motion.value === "off") {
        finish();
        return;
      }
      const preset = mode();
      const from: Keyframe = { opacity: preset === "fade" ? 0 : .35 };
      const to: Keyframe = { opacity: 0 };
      if (preset === "slide") {
        const distance = Math.min(80, (stage.value?.clientWidth ?? 0) * .12) * direction;
        from.transform = "translateX(" + distance + "px) " + current.style.transform;
        to.transform = "translateX(" + -distance + "px) " + previous.style.transform;
      } else if (preset === "zoom") {
        from.transform = current.style.transform + " scale(.94)";
        to.transform = previous.style.transform + " scale(1.04)";
      }
      const options: KeyframeAnimationOptions = {
        duration: motion.value === "full" ? 250 : 175,
        easing: "cubic-bezier(.2,.7,.25,1)",
        fill: "both",
      };
      const enter = current.animate([from, { opacity: 1, transform: current.style.transform }], options);
      const leave = previous.animate([{ opacity: 1, transform: previous.style.transform }, to], options);
      animations = [enter, leave];
      enter.onfinish = finish;
    });
  }

  watch([mode, motion], finish);
  onDeactivated(finish);
  onBeforeUnmount(finish);
  return { outgoing, prepare, transition, finish };
}
