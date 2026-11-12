import { ref } from "vue";
import type {
  HysToastAction,
  HysToastActionContext,
  HysToastActionEvent,
  HysToastContext,
  HysToastFeedback,
  HysToastLocale,
  HysToastPatch,
} from "./toastTypes";

export function feedback<T>(value: HysToastFeedback<T> | undefined, result: T) {
  const patch = typeof value === "function" ? value(result) : value;
  return typeof patch === "string" ? { message: patch } : patch;
}

export function useToastActions(options: {
  available: () => boolean;
  locale: () => HysToastLocale;
  context: () => HysToastContext;
  close: () => Promise<boolean>;
  update: (patch: HysToastPatch) => void;
  copyText: () => string;
  emit: (event: HysToastActionEvent) => void;
}) {
  const busy = ref<string>(),
    copyStatus = ref("");
  let revision = 0;
  async function copy() {
    if (!options.available()) return false;
    const token = revision;
    try {
      await navigator.clipboard.writeText(options.copyText());
      if (token === revision) copyStatus.value = options.locale().copied;
      return true;
    } catch {
      if (token === revision) copyStatus.value = options.locale().copyFailed;
      return false;
    }
  }
  function context(): HysToastActionContext {
    return {
      ...options.context(),
      close: options.close,
      update: options.update,
      copy,
    };
  }
  async function run(action: HysToastAction) {
    if (!options.available() || busy.value !== undefined || action.disabled)
      return;
    const token = revision,
      state = options.context();
    busy.value = action.id;
    options.emit({ ...state, action, status: "start" });
    try {
      const result = await action.run?.(context());
      if (token !== revision || !options.available()) return;
      const patch = feedback(action.success, result);
      if (patch) options.update({ type: "success", ...patch });
      options.emit({ ...state, action, status: "success", result });
      if (action.closeOnSuccess !== false) await options.close();
    } catch (error) {
      if (token !== revision || !options.available()) return;
      let patch: ReturnType<typeof feedback>;
      try {
        patch = feedback(action.error, error);
      } catch {
        patch = undefined;
      }
      options.update({
        type: "error",
        message: options.locale().actionFailed,
        ...patch,
      });
      options.emit({ ...state, action, status: "error", result: error });
    } finally {
      if (token === revision) busy.value = undefined;
    }
  }
  function reset() {
    revision++;
    busy.value = undefined;
    copyStatus.value = "";
  }
  return { busy, copyStatus, copy, context, run, reset };
}
