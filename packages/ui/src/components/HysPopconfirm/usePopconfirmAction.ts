import { onScopeDispose, ref } from "vue";
import type {
  HysPopconfirmAction,
  HysPopconfirmActionContext,
} from "./popconfirmTypes";

function waitForAction(work: () => unknown, signal: AbortSignal) {
  return new Promise<unknown>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve()
      .then(() => signal.throwIfAborted())
      .then(work)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort));
  });
}

export function usePopconfirmAction() {
  const pending = ref<HysPopconfirmAction | null>(null);
  let current: { controller: AbortController; settled: boolean } | undefined;
  function abort() {
    const previous = current;
    current = undefined;
    if (previous && !previous.settled) previous.controller.abort();
    pending.value = null;
  }
  async function run(
    action: HysPopconfirmAction,
    event: Event | undefined,
    work: (context: HysPopconfirmActionContext) => unknown,
    finish: (
      result: unknown,
      context: HysPopconfirmActionContext,
      isCurrent: () => boolean,
    ) => Promise<void>,
    fail: (error: unknown, context: HysPopconfirmActionContext) => void,
  ): Promise<boolean> {
    if (current) return false;
    const transaction = { controller: new AbortController(), settled: false };
    const context = { action, event, signal: transaction.controller.signal };
    current = transaction;
    pending.value = action;
    try {
      const result = await waitForAction(() => work(context), context.signal);
      if (current !== transaction || result === false) return false;
      transaction.settled = true;
      await finish(result, context, () => current === transaction);
      return true;
    } catch (error) {
      if (current === transaction) fail(error, context);
      return false;
    } finally {
      if (current === transaction) abort();
    }
  }
  onScopeDispose(abort);
  return { pending, run, abort };
}
