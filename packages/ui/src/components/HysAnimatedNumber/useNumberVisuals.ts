import { computed, type Ref, type StyleValue } from "vue";
import type {
  HysAnimatedNumberContext,
  HysAnimatedNumberProps,
  HysNumberEffect,
  HysNumberFrame,
} from "../../composables/animatedNumber";
import { digitEffects } from "../../composables/animatedNumberDigits";
import { numberTrend } from "../../composables/animatedNumberFormat";

const list = (
  effect: HysAnimatedNumberProps["effect"],
): readonly HysNumberEffect[] =>
  typeof effect === "string" ? [effect] : (effect ?? []);

export function useNumberVisuals(
  props: HysAnimatedNumberProps,
  frame: Readonly<Ref<HysNumberFrame>>,
  context: Readonly<Ref<HysAnimatedNumberContext>>,
  motionEnabled: Readonly<Ref<boolean>>,
  isCountdown: Readonly<Ref<boolean>>,
  selected: Readonly<Ref<readonly HysNumberEffect[]>>,
  allowEffects: Readonly<Ref<boolean>>,
) {
  const from = computed(() => frame.value.from),
    to = computed(() => frame.value.to);
  const significant = computed(
    () =>
      props.changeThreshold !== undefined &&
      numberTrend(from.value, to.value, props.changeThreshold).significant,
  );
  const effects = computed(() =>
    significant.value && allowEffects.value
      ? [...list(props.thresholdEffect ?? "highlight"), ...selected.value]
      : selected.value,
  );
  const status = computed(() => frame.value.status);
  const running = computed(
    () => status.value === "playing" || status.value === "paused",
  );
  const visual = computed(
    () =>
      motionEnabled.value &&
      allowEffects.value &&
      !isCountdown.value &&
      running.value &&
      frame.value.progress < 1,
  );
  const has = (effect: HysNumberEffect) => effects.value.includes(effect);
  const digitEffect = computed(() =>
    effects.value.find((effect) => digitEffects.includes(effect)),
  );
  const sliding = computed(() => has("slide") && visual.value);
  const translation = (amount: number) =>
    props.axis === "horizontal"
      ? `translateX(${amount}%)`
      : `translateY(${amount}%)`;
  const sign = () => (frame.value.direction === "down" ? -1 : 1);
  const outgoingStyle = computed<StyleValue>(() => {
    if (
      !visual.value ||
      (!sliding.value && !has("fade")) ||
      from.value === to.value
    )
      return;
    const progress = frame.value.progress;
    return {
      opacity: has("fade") ? 1 - progress : 1,
      transform: sliding.value
        ? translation(-sign() * progress * 100)
        : undefined,
    };
  });
  const visualStyle = computed<StyleValue>(() => {
    if (
      !visual.value ||
      (!props.animationStyle &&
        !effects.value.some(
          (effect) => effect !== "count" && !digitEffects.includes(effect),
        ))
    )
      return;
    const p = frame.value.progress,
      pulse = Math.sin(Math.PI * p);
    const scale =
      1 -
      (has("scale") ? 0.18 * (1 - p) : 0) +
      (has("spring") ? 0.24 * Math.sin(4 * Math.PI * p) * (1 - p) : 0);
    const bounce = has("bounce")
      ? -0.27 * Math.abs(Math.sin(3 * Math.PI * p)) * (1 - p)
      : 0;
    const fade = has("fade") ? (outgoingStyle.value ? p : 0.25 + 0.75 * p) : 1;
    const flash = has("flash")
      ? 1 - 0.35 * Math.abs(Math.sin(4 * Math.PI * p)) * (1 - p)
      : 1;
    let custom: StyleValue;
    try {
      custom = props.animationStyle?.(context.value);
    } catch {
      // Keep the built-in effect when a custom style fails.
    }
    const slide = sliding.value ? translation(sign() * (1 - p) * 100) : "";
    return [
      {
        transform: `${slide} translateY(${bounce}em) scale(${scale})`.trim(),
        opacity: fade * flash,
        filter: has("blur") ? `blur(${0.12 * (1 - p)}em)` : undefined,
        "--hys-number-highlight": has("highlight") ? pulse : 0,
        "--hys-number-gradient": has("gradient") ? pulse : 0,
      },
      custom,
    ];
  });
  return {
    from,
    to,
    status,
    running,
    digitEffect,
    visualStyle,
    outgoingStyle,
    sliding,
  };
}
