<script setup lang="ts">
import { computed } from "vue";
import type {
  HysAnimatedNumberContext,
  HysNumberDigitContext,
  HysNumberEffect,
} from "../../../composables/animatedNumber";
import {
  createDigitTracks,
  digitMotion,
  numberTokens,
} from "../../../composables/animatedNumberDigits";
import {
  bounded,
  type NumberPresentation,
} from "../../../composables/animatedNumberFormat";

const props = defineProps<{
  current: NumberPresentation;
  start: NumberPresentation;
  end: NumberPresentation;
  glyphs: string[];
  context: HysAnimatedNumberContext;
  effect?: HysNumberEffect;
  axis?: "vertical" | "horizontal";
  order?: "high-to-low" | "low-to-high";
  stagger?: number;
  duration?: number;
  digitDuration?: number;
  motion: boolean;
  timer?: boolean;
  accessible?: boolean;
}>();
const slots = defineSlots<{
  digit?: (scope: HysNumberDigitContext) => unknown;
}>();
const tokens = computed(() => {
  const count = props.current.parts.reduce(
    (total, { type, value }) =>
      total +
      (type === "integer" || type === "fraction" ? [...value].length : 0),
    0,
  );
  return numberTokens(
    props.current.parts,
    count <= 48 && (!!props.effect || !!slots.digit),
  );
});
const tracks = computed(
  () =>
    props.effect &&
    !props.timer &&
    createDigitTracks(props.start, props.end, props.glyphs),
);
const cells = computed(() => {
  const count = tokens.value.filter((token) => token.section).length;
  let index = 0;
  return tokens.value.map((token) => {
    if (!token.section) return { token };
    const digitIndex = index++;
    const ordinal =
      props.order === "low-to-high" ? count - 1 - digitIndex : digitIndex;
    const total = bounded(props.duration, 650, 1, Number.MAX_SAFE_INTEGER);
    const stagger = bounded(props.stagger, 0, 0, total / Math.max(1, count));
    const delay = ordinal * stagger;
    const timing = bounded(
      props.digitDuration,
      total - delay,
      1,
      total - delay,
    );
    const p = props.context.progress;
    const phase =
      stagger || props.digitDuration !== undefined
        ? bounded((p * total - delay) / timing, 0, 0, 1)
        : bounded(props.context.easedProgress, p, 0, 1);
    const stopped = ["idle", "stopped", "finished"].includes(
      props.context.status,
    );
    const track =
      props.motion && !stopped && phase < 1 && props.effect && tracks.value
        ? digitMotion(
            props.effect,
            tracks.value(token),
            phase,
            digitIndex,
            props.glyphs,
          )
        : undefined;
    const context: HysNumberDigitContext = {
      ...props.context,
      digit: token.text,
      index: digitIndex,
      position: token.position,
      section: token.section,
      digitProgress: phase,
    };
    return {
      token,
      context,
      track: track?.changed ? track : undefined,
      style: track
        ? {
            "--number-phase": track.phase,
            "--number-direction": track.direction,
          }
        : undefined,
    };
  });
});
</script>

<template>
  <span
    class="hys-number-digits"
    :role="accessible ? 'img' : undefined"
    :aria-label="
      accessible ? current.parts.map(({ value }) => value).join('') : undefined
    "
    :data-effect="effect"
    :data-axis="axis"
    :data-timer-motion="timer && motion && effect ? '' : undefined"
  >
    <template
      v-for="{ token, context: digit, track, style } in cells"
      :key="token.key"
    >
      <span v-if="digit" class="hys-ui-motion-number-digit" :style="style">
        <slot v-if="slots.digit" name="digit" v-bind="digit" />
        <template v-else-if="track">
          <span class="hys-number-face hys-number-face-first">{{
            track.first
          }}</span>
          <span class="hys-number-face hys-number-face-second">{{
            track.second
          }}</span>
        </template>
        <span
          v-else
          :key="timer ? token.text : undefined"
          class="hys-number-face hys-number-timer-face"
          >{{ token.text }}</span
        >
      </span>
      <span
        v-else
        :class="{
          'hys-ui-motion-number-separator':
            token.type === 'group' || token.type === 'decimal',
          'hys-ui-motion-number-currency': token.type === 'currency',
          'hys-ui-motion-number-sign':
            token.type === 'plusSign' || token.type === 'minusSign',
        }"
        >{{ token.text }}</span
      >
    </template>
  </span>
</template>

<style scoped>
.hys-number-digits {
  display: inline;
  unicode-bidi: isolate;
}
.hys-ui-motion-number-digit {
  display: inline-grid;
  vertical-align: baseline;
  overflow: hidden;
  border-radius: var(--hys-number-digit-radius, 0);
  border: var(--hys-number-digit-border, none);
  background: var(--hys-number-digit-bg, transparent);
  min-inline-size: var(--hys-number-digit-width, 0);
  text-align: center;
  perspective: 2em;
}
.hys-number-face {
  grid-area: 1 / 1;
  backface-visibility: hidden;
}
:is([data-effect="odometer"], [data-effect="wheel"], [data-effect="slot"])
  .hys-number-face-first {
  transform: translateY(
    calc(-100% * var(--number-phase) * var(--number-direction))
  );
}
:is([data-effect="odometer"], [data-effect="wheel"], [data-effect="slot"])
  .hys-number-face-second {
  transform: translateY(
    calc(100% * (1 - var(--number-phase)) * var(--number-direction))
  );
}
[data-axis="horizontal"] .hys-number-face-first {
  transform: translateX(
    calc(-100% * var(--number-phase) * var(--number-direction))
  );
}
[data-axis="horizontal"] .hys-number-face-second {
  transform: translateX(
    calc(100% * (1 - var(--number-phase)) * var(--number-direction))
  );
}
[data-effect="flip"] .hys-ui-motion-number-digit {
  background: var(--hys-number-digit-bg, var(--hys-ui-theme-primary-soft));
  border-radius: var(--hys-number-digit-radius, 0.15em);
}
[data-effect="flip"] .hys-number-face-first {
  transform: rotateX(
    calc(-180deg * var(--number-phase) * var(--number-direction))
  );
}
[data-effect="flip"] .hys-number-face-second {
  transform: rotateX(
    calc(180deg * (1 - var(--number-phase)) * var(--number-direction))
  );
}
[data-effect="appear"] .hys-number-face-first,
[data-effect="disappear"] .hys-number-face-first,
[data-effect="random"] .hys-number-face-first {
  opacity: calc(1 - var(--number-phase));
}
[data-effect="appear"] .hys-number-face-second,
[data-effect="disappear"] .hys-number-face-second,
[data-effect="random"] .hys-number-face-second {
  opacity: var(--number-phase);
}
[data-effect="appear"] .hys-number-face-second {
  transform: translateY(calc(0.5em * (1 - var(--number-phase))));
}
[data-effect="disappear"] .hys-number-face-first {
  transform: translateY(calc(-0.5em * var(--number-phase)));
}
[data-timer-motion] .hys-number-timer-face {
  animation: hys-number-tick 180ms ease-out both;
}
[data-timer-motion][data-axis="horizontal"] .hys-number-timer-face {
  animation-name: hys-number-tick-x;
}
[data-timer-motion][data-effect="flip"] .hys-number-timer-face {
  animation-name: hys-number-tick-flip;
}
@keyframes hys-number-tick {
  from {
    transform: translateY(-85%);
  }
}
@keyframes hys-number-tick-x {
  from {
    transform: translateX(-85%);
  }
}
@keyframes hys-number-tick-flip {
  from {
    transform: rotateX(-90deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  [data-timer-motion] .hys-number-timer-face {
    animation: none;
  }
}
</style>
