import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  readonly,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { useMotion } from "../motion/useMotion";
import {
  listenVisibility,
  makeEasing,
  subscribe,
  unlistenVisibility,
  unsubscribe,
  type Run,
} from "./animatedNumberTiming";
import {
  bounded,
  numberDirection,
  createNumberInterpolator,
  numberValue,
} from "./animatedNumberFormat";
import type {
  HysNumberComposableOptions,
  HysNumberEvent,
  HysNumberFrame,
  HysNumberValue,
} from "./animatedNumber";

/** 在 Vue setup 中使用。与 HysAnimatedNumber 共享调度和播放控制。 */
export function useHysAnimatedNumber(
  source: MaybeRefOrGetter<HysNumberComposableOptions> = {},
  onEvent?: (event: HysNumberEvent, frame: HysNumberFrame) => void,
) {
  const options = () => toValue(source);
  const target = () => numberValue(options().value);
  const origin = () => numberValue(options().from ?? target());
  const { effectiveMotion } = useMotion();
  const instant = () =>
    options().disabled || effectiveMotion.value === "off" || !duration();
  const duration = () =>
    bounded(options().duration ?? 650, 0, 0, Number.MAX_SAFE_INTEGER);
  const initial = origin();
  const frame = shallowRef<HysNumberFrame>({
    value: initial,
    from: initial,
    to: target(),
    progress: 0,
    easedProgress: 0,
    direction: numberDirection(initial, target()),
    status: "idle",
    iteration: 1,
  });
  let run: Run | undefined;
  let bounds: [HysNumberValue, HysNumberValue] = [initial, target()];
  let endpoints = bounds;
  let queue: HysNumberValue[] = [];
  let mounted = false,
    active = false,
    held = false,
    manuallyPaused = false;
  let lastTime: number | undefined,
    lastSample = 0;
  let lastUpdate = -Infinity;
  let pending: HysNumberValue | undefined;
  let updateTimer: ReturnType<typeof setTimeout> | undefined;
  const blocked = () =>
    !active || held || (options().pauseWhenHidden !== false && document.hidden);
  const notify = (event: HysNumberEvent) =>
    onEvent?.(event, { ...frame.value });

  function unschedule() {
    unsubscribe(tick);
    lastTime = undefined;
    lastSample = 0;
  }

  function schedule() {
    if (!run || manuallyPaused || blocked()) return;
    subscribe(tick);
  }

  function progressAt(
    current: Run,
    progress: number,
    status: HysNumberFrame["status"],
  ) {
    let eased = progress;
    if (progress > 0 && progress < 1) {
      try {
        eased = bounded(current.easing(progress), progress, -4, 5);
      } catch {
        // A faulty easing falls back to linear for this run.
        current.easing = (p) => p;
      }
    }
    frame.value = {
      ...frame.value,
      status,
      progress,
      easedProgress: eased,
      value:
        progress === 0
          ? current.from
          : progress === 1
            ? current.to
            : current.interpolate(progress, eased),
    };
  }

  function clearUpdates() {
    queue = [];
    pending = undefined;
    clearTimeout(updateTimer);
    updateTimer = undefined;
  }

  function cancel() {
    const cancelled = !!run;
    run = undefined;
    manuallyPaused = false;
    unschedule();
    if (cancelled) {
      frame.value = { ...frame.value, status: "stopped" };
      notify("cancel");
    }
  }

  function makeRun(
    from: HysNumberValue,
    to: HysNumberValue,
    iteration: number,
    loops: number,
    time: number,
    delay: number,
  ): Run {
    return {
      from,
      to,
      iteration,
      loops,
      duration: time,
      elapsed: -delay,
      interpolate: createNumberInterpolator(from, to, options().interpolate),
      easing: makeEasing(options().easing),
      alternate: options().alternate ?? false,
      started: false,
    };
  }

  function install(current: Run) {
    run = current;
    frame.value = {
      from: current.from,
      to: current.to,
      value: current.from,
      progress: 0,
      easedProgress: 0,
      direction: numberDirection(current.from, current.to),
      status: current.elapsed < 0 ? "delayed" : "playing",
      iteration: current.iteration,
    };
  }

  function emitStart(current: Run) {
    if (current.started) return;
    current.started = true;
    notify("start");
  }

  function sample(
    current: Run,
    progress: number,
    status: HysNumberFrame["status"],
  ) {
    progressAt(current, progress, status);
    notify("update");
    if (run === current) notify("progress");
  }

  function complete(current: Run, skipLoops = false) {
    if (run !== current) return;
    if (!skipLoops && current.iteration < current.loops) {
      const [from, to] = current.alternate
        ? [current.to, current.from]
        : bounds;
      install(
        makeRun(
          from,
          to,
          current.iteration + 1,
          current.loops,
          current.duration,
          0,
        ),
      );
      notify("loop");
      return;
    }
    run = undefined;
    manuallyPaused = false;
    unschedule();
    frame.value = { ...frame.value, status: "finished" };
    notify("end");
    if (!run && queue.length) {
      const next = queue.shift()!;
      begin(frame.value.value, next);
    }
  }

  function finishAnimation() {
    if (!run) return;
    const current = run;
    emitStart(current);
    if (run !== current) return;
    sample(current, 1, "playing");
    complete(current, true);
  }

  function begin(
    from: HysNumberValue,
    to: HysNumberValue,
    settings: {
      immediate?: boolean;
      delay?: number;
      endpoints?: typeof bounds;
    } = {},
  ) {
    cancel();
    if (run) return;
    bounds = [from, to];
    endpoints = settings.endpoints ?? bounds;
    const loop = options().loop;
    const count =
      loop === true
        ? Infinity
        : Math.floor(
            bounded(
              typeof loop === "number" ? loop : undefined,
              1,
              1,
              Number.MAX_SAFE_INTEGER,
            ),
          );
    const current = makeRun(
      from,
      to,
      1,
      count,
      duration(),
      settings.delay ?? bounded(options().delay, 0, 0, Number.MAX_SAFE_INTEGER),
    );
    install(current);
    if (
      settings.immediate ||
      instant() ||
      !current.duration ||
      (frame.value.direction === "none" && from !== to)
    ) {
      finishAnimation();
    } else {
      schedule();
    }
  }

  function tick(now: number) {
    const current = run;
    if (!current || manuallyPaused || blocked()) {
      unschedule();
      return;
    }
    if (instant() || !current.duration) {
      finishAnimation();
      return;
    }
    const speed = bounded(options().speed, 1, 0.01, 100);
    current.elapsed += (lastTime === undefined ? 0 : now - lastTime) * speed;
    lastTime = now;
    if (current.elapsed < 0) return;
    emitStart(current);
    if (run !== current || manuallyPaused) return;
    const progress = Math.min(1, current.elapsed / current.duration);
    const fps = options().fps;
    if (
      progress < 1 &&
      lastSample &&
      fps !== undefined &&
      now - lastSample < 1000 / bounded(fps, 60, 1, 120) - 1
    )
      return;
    lastSample = now;
    sample(current, progress, "playing");
    if (progress === 1 && !manuallyPaused) complete(current);
  }

  function update(to: HysNumberValue) {
    const next = numberValue(to);
    const policy = options().interrupt ?? "retarget";
    if (policy === "queue" && run && !instant()) {
      if ((queue.at(-1) ?? run.to) !== next) queue.push(next);
      const limit = Math.floor(bounded(options().queueLimit, 32, 1, 256));
      if (queue.length > limit) queue.splice(0, queue.length - limit);
      return;
    }
    clearUpdates();
    if (next === frame.value.value && !run) return;
    lastUpdate = performance.now();
    begin(
      policy === "restart"
        ? numberValue(options().from ?? bounds[0])
        : frame.value.value,
      next,
      { immediate: policy === "snap" },
    );
  }

  function updateTarget(next: HysNumberValue) {
    if (!mounted) return;
    const policy = options().interrupt ?? "retarget";
    const interval = bounded(options().updateInterval, 0, 0, 60000);
    const wait = lastUpdate + interval - performance.now();
    if (
      (policy === "retarget" || policy === "restart") &&
      wait > 0 &&
      !instant()
    ) {
      pending = next;
      updateTimer ??= setTimeout(() => {
        const value = pending;
        if (value !== undefined) update(value);
      }, wait);
    } else {
      update(next);
    }
  }

  function restart() {
    clearUpdates();
    begin(numberValue(options().from ?? endpoints[0]), target());
  }

  function play() {
    if (run) {
      resume();
      return;
    }
    if (frame.value.to !== target() || frame.value.status === "stopped") {
      clearUpdates();
      begin(frame.value.value, target());
    } else {
      restart();
    }
  }

  function pause() {
    if (!run || manuallyPaused) return;
    manuallyPaused = true;
    unschedule();
    frame.value = { ...frame.value, status: "paused" };
    notify("pause");
  }

  function resume() {
    if (!run || !manuallyPaused) return;
    manuallyPaused = false;
    frame.value = {
      ...frame.value,
      status: run.elapsed < 0 ? "delayed" : "playing",
    };
    notify("resume");
    schedule();
  }

  function stop() {
    clearUpdates();
    cancel();
  }

  function reset() {
    stop();
    if (run) return;
    const from = numberValue(options().from ?? endpoints[0]),
      to = target();
    bounds = endpoints = [from, to];
    frame.value = {
      from,
      to,
      value: from,
      progress: 0,
      easedProgress: 0,
      status: "idle",
      direction: numberDirection(from, to),
      iteration: 1,
    };
  }

  function sync() {
    stop();
    if (run) return;
    const to = target();
    bounds = endpoints = [numberValue(options().from ?? to), to];
    frame.value = {
      from: to,
      to,
      value: to,
      direction: "none",
      progress: 1,
      easedProgress: 1,
      status: "idle",
      iteration: 1,
    };
  }

  function reverse() {
    clearUpdates();
    const destination =
      frame.value.to === endpoints[0] ? endpoints[1] : endpoints[0];
    const value = frame.value.value;
    begin(value, destination, { delay: 0, endpoints });
  }

  function seek(progress: number) {
    if (!Number.isFinite(progress)) return;
    if (!run) {
      const [from, to] = bounds;
      install(makeRun(from, to, 1, 1, duration(), 0));
      manuallyPaused = true;
    }
    const current = run!;
    const next = bounded(progress, 0, 0, 1);
    current.elapsed = next * current.duration;
    sample(current, next, manuallyPaused ? "paused" : "playing");
  }

  function refreshScheduling() {
    if (blocked()) unschedule();
    else schedule();
  }

  /** 冻结播放时钟，供视口等宿主生命周期使用。 */
  function hold(value: boolean) {
    held = value;
    refreshScheduling();
  }

  watch(target, (to) => {
    if (options().autoUpdate !== false) updateTarget(to);
  });
  watch(instant, (off) => {
    if (off) finishAnimation();
  });
  watch(() => options().pauseWhenHidden, refreshScheduling);
  onMounted(() => {
    mounted = active = true;
    listenVisibility(refreshScheduling);
    if (options().autoPlay ?? options().from !== undefined) restart();
    else refreshScheduling();
  });
  onActivated(() => {
    active = true;
    refreshScheduling();
  });
  onDeactivated(() => {
    active = false;
    unschedule();
  });
  onBeforeUnmount(() => {
    mounted = active = false;
    clearUpdates();
    unschedule();
    run = undefined;
    unlistenVisibility(refreshScheduling);
  });

  return {
    frame: readonly(frame),
    motionEnabled: computed(() => !instant()),
    play,
    pause,
    resume,
    stop,
    restart,
    reset,
    reverse,
    seek,
    finishAnimation,
    updateTarget,
    sync,
    hold,
  };
}
