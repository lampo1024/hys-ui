import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const listeners = new Set<(paused: boolean) => void>();
let blurred = false;
export type ToastClock = { remaining: number; total: number; expired: boolean };
function publish() {
  for (const listener of listeners) listener(blurred || document.hidden);
}
function blur() {
  blurred = true;
  publish();
}
function focus() {
  blurred = false;
  publish();
}
function subscribe(listener: (paused: boolean) => void) {
  if (!listeners.size) {
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", publish);
  }
  listeners.add(listener);
  listener(blurred || document.hidden);
  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    blurred = false;
    window.removeEventListener("blur", blur);
    window.removeEventListener("focus", focus);
    document.removeEventListener("visibilitychange", publish);
  };
}

export function useToastTimer(options: {
  running: () => boolean;
  duration: () => number;
  indicators: () => boolean;
  pauseOnBlur: () => boolean;
  expire: () => void;
}) {
  const remaining = ref(0),
    total = ref(0),
    manual = ref(false),
    background = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let expires = 0,
    expired = false;
  let unsubscribe: (() => void) | undefined;
  function stop() {
    clearTimeout(timer);
    timer = undefined;
    if (expires) remaining.value = Math.max(0, expires - Date.now());
    expires = 0;
  }
  function wake() {
    const left = Math.max(0, expires - Date.now());
    remaining.value = left;
    if (left === 0) {
      expires = 0;
      timer = undefined;
      expired = true;
      options.expire();
      return;
    }
    timer = setTimeout(wake, options.indicators() ? Math.min(left, 100) : left);
  }
  function sync() {
    stop();
    if (typeof window === "undefined") return;
    if (
      !options.running() ||
      manual.value ||
      (options.pauseOnBlur() && background.value) ||
      !total.value ||
      expired
    )
      return;
    if (remaining.value <= 0) {
      expired = true;
      options.expire();
      return;
    }
    expires = Date.now() + remaining.value;
    timer = setTimeout(
      wake,
      options.indicators() ? Math.min(remaining.value, 100) : remaining.value,
    );
  }
  function restart() {
    stop();
    expired = false;
    remaining.value = total.value = options.duration();
    sync();
  }
  function extend(milliseconds: number) {
    if (!total.value || !Number.isFinite(milliseconds) || milliseconds <= 0)
      return;
    stop();
    expired = false;
    remaining.value = Math.min(2147483647, remaining.value + milliseconds);
    total.value = Math.min(2147483647, total.value + milliseconds);
    sync();
  }
  watch(
    [
      options.running,
      options.indicators,
      options.pauseOnBlur,
      manual,
      background,
    ],
    sync,
    { flush: "sync" },
  );
  onMounted(() => {
    unsubscribe = subscribe((value) => {
      background.value = value;
    });
  });
  onBeforeUnmount(() => {
    unsubscribe?.();
    stop();
  });
  return {
    remaining,
    total,
    restart,
    extend,
    stop,
    snapshot: (): ToastClock => ({
      remaining: expires ? Math.max(0, expires - Date.now()) : remaining.value,
      total: total.value,
      expired,
    }),
    restore(clock: ToastClock) {
      stop();
      remaining.value = clock.remaining;
      total.value = clock.total;
      expired = clock.expired;
      sync();
    },
    pause: () => {
      manual.value = true;
    },
    resume: () => {
      manual.value = false;
    },
  };
}
