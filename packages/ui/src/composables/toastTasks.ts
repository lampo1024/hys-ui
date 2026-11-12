import { feedback } from "../components/HysToast/useToastActions";
import type {
  HysToastApi,
  HysToastFeedback,
  HysToastHandle,
  HysToastPatch,
  HysToastPromiseOptions,
  HysToastTaskContext,
} from "../components/HysToast/toastTypes";
import { asOptions } from "./toastQueueModel";

export function createToastTaskRunner(
  show: HysToastApi["show"],
  reportError: (error: unknown) => void,
): HysToastApi["promise"] {
  const tasks = new WeakMap<HysToastHandle, symbol>();
  function runTask<T>(
    task:
      PromiseLike<T> | ((context: HysToastTaskContext) => T | PromiseLike<T>),
    config: HysToastPromiseOptions<T> = {},
  ) {
    const handle = show({
      actions: undefined,
      progress: undefined,
      ...config.options,
      id: config.id ?? config.options?.id,
      type: "loading",
      message: "正在处理…",
      duration: 0,
      ...asOptions(config.loading ?? {}),
    });
    const token = Symbol();
    tasks.set(handle, token);
    const updateTask = (value: HysToastPatch) => {
      if (tasks.get(handle) === token) handle.update(value);
    };
    function taskFeedback<V>(
      formatter: HysToastFeedback<V> | undefined,
      value: V,
    ) {
      try {
        return feedback(formatter, value);
      } catch (error) {
        reportError(error);
      }
    }
    const promise = Promise.resolve()
      .then(() =>
        typeof task === "function"
          ? task({
              handle,
              update: updateTask,
              progress: (value) => updateTask({ progress: value }),
            })
          : task,
      )
      .then(
        (result) => {
          if (tasks.get(handle) === token) {
            updateTask({
              type: "success",
              message: "操作成功",
              progress: undefined,
              persistent: false,
              ...taskFeedback(config.success, result),
            });
            tasks.delete(handle);
          }
          return result;
        },
        (error) => {
          if (tasks.get(handle) === token) {
            updateTask({
              type: "error",
              message: "操作失败",
              progress: undefined,
              persistent: false,
              ...taskFeedback(config.error, error),
            });
            tasks.delete(handle);
          }
          throw error;
        },
      );
    return { handle, promise };
  }
  return runTask;
}
