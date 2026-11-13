import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from "vue";
import { spinTime } from "./useHysSpinTask";

export function useSpinVisibility(options: {
  requested(): boolean;
  delay(): number | undefined;
  minimum(): number | undefined;
  timeout(): number | undefined;
  autoEnd(): number | undefined;
  start(): void;
  end(): void;
  stop(reason: "timeout" | "auto"): void;
}) {
  const visible = ref(options.requested() && spinTime(options.delay()) === 0);
  let active = false;
  let started: number | undefined, shown: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined,
    expiry: ReturnType<typeof setTimeout> | undefined;
  let expired = false;
  function clear() {
    clearTimeout(timer);
    clearTimeout(expiry);
  }
  function refresh() {
    clear();
    if (!active) return;
    const now = Date.now();
    if (options.requested()) {
      if (started === undefined) {
        started = now;
        expired = false;
        options.start();
      }
      const begin = () => {
        if (!active || !options.requested()) return;
        shown = Date.now();
        visible.value = true;
      };
      if (!visible.value) {
        const wait = spinTime(options.delay()) - (now - started);
        if (wait > 0) timer = setTimeout(begin, wait);
        else begin();
      } else shown ??= now;
      const timeout = spinTime(options.timeout()),
        auto = spinTime(options.autoEnd());
      const duration =
        timeout && auto ? Math.min(timeout, auto) : timeout || auto;
      if (!expired && duration) {
        expiry = setTimeout(
          () => {
            if (!active || !options.requested()) return;
            expired = true;
            options.stop(
              timeout && timeout <= (auto || Infinity) ? "timeout" : "auto",
            );
          },
          Math.max(0, duration - (now - started)),
        );
      }
      return;
    }
    if (started !== undefined) {
      started = undefined;
      options.end();
    }
    const hide = () => {
      shown = undefined;
      visible.value = false;
    };
    const left =
      shown === undefined ? 0 : spinTime(options.minimum()) - (now - shown);
    if (visible.value && left > 0) timer = setTimeout(hide, left);
    else hide();
  }
  function activate() {
    if (!active) {
      active = true;
      refresh();
    }
  }
  function deactivate() {
    active = false;
    clear();
    started = shown = undefined;
    visible.value = false;
  }
  watch(
    [
      options.requested,
      options.delay,
      options.minimum,
      options.timeout,
      options.autoEnd,
    ],
    refresh,
  );
  onMounted(activate);
  onActivated(activate);
  onDeactivated(deactivate);
  onBeforeUnmount(deactivate);
  return visible;
}
