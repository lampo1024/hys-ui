import { toValue, type MaybeRefOrGetter } from "vue";
import type { HysNumberControls } from "./animatedNumber";

/** 同时控制组件实例和独立动画。空实例会被跳过。 */
export function useHysNumberAnimationGroup(
  source: MaybeRefOrGetter<readonly (HysNumberControls | null | undefined)[]>,
): HysNumberControls {
  const members = () => new Set(toValue(source));
  function invoke(action: keyof Omit<HysNumberControls, "seek">) {
    for (const member of members()) member?.[action]();
  }
  return {
    play: () => invoke("play"),
    pause: () => invoke("pause"),
    resume: () => invoke("resume"),
    stop: () => invoke("stop"),
    restart: () => invoke("restart"),
    reset: () => invoke("reset"),
    reverse: () => invoke("reverse"),
    finishAnimation: () => invoke("finishAnimation"),
    seek: (progress) => {
      for (const member of members()) member?.seek(progress);
    },
  };
}
