import { getCurrentScope, onScopeDispose, readonly, shallowRef } from "vue";
import type {
  HysSpinRunOptions,
  HysSpinSnapshot,
  HysSpinTask,
  HysSpinUpdate,
  HysSpinWork,
} from "./spinTypes";

const initial = (): HysSpinSnapshot => ({ status: "idle", spinning: false });
export const clampSpinProgress = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : undefined;
export const spinTime = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(2147483647, Math.max(0, value))
    : 0;
function abortError() {
  return new DOMException("Loading cancelled", "AbortError");
}

export function useHysSpinTask(): HysSpinTask {
  const state = shallowRef<HysSpinSnapshot>(initial());
  let current: AbortController | undefined;
  let last: { work: HysSpinWork; options?: HysSpinRunOptions } | undefined;
  let attempt = 0;
  let disposed = false;

  function update(patch: HysSpinUpdate) {
    if (disposed) return;
    state.value = {
      ...state.value,
      ...patch,
      progress:
        "progress" in patch
          ? clampSpinProgress(patch.progress ?? undefined)
          : state.value.progress,
    };
  }
  function execute<T>(
    work: HysSpinWork<T>,
    options: HysSpinRunOptions | undefined,
    retrying: boolean,
  ): Promise<T> {
    if (disposed) {
      if (typeof work !== "function")
        void Promise.resolve(work).catch(() => {});
      return Promise.reject(abortError());
    }
    current?.abort(abortError());
    const controller = new AbortController();
    current = controller;
    attempt++;
    const attemptNumber = attempt;
    state.value = {
      ...initial(),
      status: retrying ? "retrying" : "loading",
      spinning: true,
    };
    if (options?.initial) update(options.initial);
    const { signal } = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: (error: unknown) => void = () => {};
    const aborted = new Promise<never>((_, reject) => {
      rejectAbort = reject;
    });
    const onAbort = () => rejectAbort(signal.reason ?? abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    const timeout = spinTime(options?.timeout);
    if (timeout)
      timer = setTimeout(
        () =>
          controller.abort(
            new DOMException("Loading timed out", "TimeoutError"),
          ),
        timeout,
      );
    const safeUpdate = (patch: HysSpinUpdate) => {
      if (current === controller && !signal.aborted) update(patch);
    };
    const result =
      typeof work !== "function"
        ? Promise.resolve(work)
        : Promise.resolve().then(() => {
            if (signal.aborted) throw signal.reason;
            return work({
              signal,
              attempt: attemptNumber,
              update: safeUpdate,
              progress: (value) => safeUpdate({ progress: value }),
            });
          });
    return Promise.race([result, aborted])
      .then(
        (value) => {
          if (current === controller)
            state.value = {
              ...state.value,
              spinning: false,
              status: "success",
              progress: state.value.progress === undefined ? undefined : 100,
            };
          return value;
        },
        (error) => {
          if (current === controller) {
            const status =
              error?.name === "TimeoutError"
                ? "timeout"
                : signal.aborted
                  ? "cancelled"
                  : "error";
            state.value = { ...state.value, spinning: false, status, error };
          }
          throw error;
        },
      )
      .finally(() => {
        clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
        if (current === controller) current = undefined;
      });
  }
  function run<T>(work: HysSpinWork<T>, options?: HysSpinRunOptions) {
    attempt = 0;
    last = { work, options };
    return execute(work, options, false);
  }
  function cancel() {
    current?.abort(abortError());
  }
  function reset() {
    cancel();
    current = undefined;
    last = undefined;
    state.value = initial();
  }
  function retry() {
    return last && typeof last.work === "function"
      ? execute(last.work, last.options, true)
      : undefined;
  }
  if (getCurrentScope())
    onScopeDispose(() => {
      disposed = true;
      reset();
    });
  return { state: readonly(state), run, cancel, retry, update, reset };
}
