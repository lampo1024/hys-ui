import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from "vue";
import {
  listenVisibility,
  unlistenVisibility,
} from "../../composables/animatedNumberTiming";

const units = { D: 86400000, H: 3600000, m: 60000, s: 1000, S: 1 } as const;
const timeToken = /^(DD?|HH?|mm?|ss?|SSS)$/;

export function useNumberCountdown(
  deadline: () => number | Date | undefined,
  format: () => string,
  pauseWhenHidden: () => boolean,
  onChange: (remaining: number) => void,
  onFinish: () => void,
) {
  const end = computed(() => {
    const input = deadline();
    const time = input instanceof Date ? input.getTime() : input;
    return time !== undefined && Number.isFinite(time) ? time : undefined;
  });
  const tokens = computed<readonly string[]>(
    () => format().match(/\[[^\]]*\]|SSS|DD?|HH?|mm?|ss?|[\s\S]/g) ?? [],
  );
  const milliseconds = computed(() => tokens.value.includes("SSS"));
  // Use the same initial snapshot on the server and during hydration.
  const remaining = ref(0);
  let active = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last: number | undefined, finished: number | undefined;

  function tick() {
    clearTimeout(timer);
    const time = end.value;
    if (!active || time === undefined || (pauseWhenHidden() && document.hidden))
      return;
    remaining.value = Math.max(
      0,
      Math.min(Number.MAX_SAFE_INTEGER, time - Date.now()),
    );
    if (remaining.value !== last) {
      last = remaining.value;
      onChange(last);
    }
    if (remaining.value === 0) {
      if (finished !== time) {
        finished = time;
        onFinish();
      }
      return;
    }
    timer = setTimeout(
      tick,
      milliseconds.value ? 16 : remaining.value % 1000 || 1000,
    );
  }

  function start() {
    if (active) return;
    active = true;
    listenVisibility(tick);
    tick();
  }
  function stop() {
    active = false;
    unlistenVisibility(tick);
    clearTimeout(timer);
  }
  watch(end, () => {
    last = finished = undefined;
    remaining.value = 0;
    tick();
  });
  watch(milliseconds, tick);
  watch(pauseWhenHidden, tick);
  onMounted(start);
  onActivated(start);
  onDeactivated(stop);
  onBeforeUnmount(stop);

  const parts = computed(() => {
    let rest = milliseconds.value
      ? Math.floor(remaining.value)
      : Math.ceil(remaining.value / 1000) * 1000;
    const values = new Map<string, number>();
    for (const [token, unit] of Object.entries(units)) {
      if (
        !tokens.value.some((part) => part[0] === token && timeToken.test(part))
      )
        continue;
      values.set(token, Math.floor(rest / unit));
      rest %= unit;
    }
    return tokens.value.map((token) => {
      const value = values.get(token[0]);
      if (timeToken.test(token) && value !== undefined)
        return {
          text: String(value).padStart(token.length, "0"),
          numeric: true,
        };
      return {
        text:
          token.startsWith("[") && token.endsWith("]")
            ? token.slice(1, -1)
            : token,
        numeric: false,
      };
    });
  });
  return { remaining, parts, milliseconds };
}
