import { computed, shallowRef, watch, type Ref } from "vue";
import {
  uploadStatus,
  uploadFailure,
  type HysUploadItem,
  type HysUploadProps,
  type HysUploadChangeType,
  type HysUploadRequestOptions,
  type HysUploadContext,
  type HysUploadRequestResult,
} from "./upload";
import { uploadRequest } from "./uploadRequest";
export function useUploadRequests<T extends HysUploadItem>(options: {
  props: HysUploadProps<T>;
  files: Readonly<Ref<readonly T[]>>;
  available: Readonly<Ref<boolean>>;
  live: () => boolean;
  emit: (name: string, ...args: any[]) => void;
  prepare: (file: T, signal: AbortSignal) => Promise<Blob | undefined>;
  forget: (uid: string) => void;
  patch: (
    changes: Map<string, Partial<T>>,
    type: HysUploadChangeType,
    guard?: (uid?: string) => boolean,
  ) => Promise<boolean>;
}) {
  const { props } = options,
    queue = shallowRef<string[]>([]);
  type Task = {
    uid: string;
    raw: File;
    controller: AbortController;
    phase: "preparing" | "running" | "finishing";
    stop?: () => void;
    percentage: number;
  };
  const tasks = shallowRef(new Map<string, Task>()),
    configured = computed(() => !!(props.action || props.customRequest));
  const limit = computed(() =>
    Number.isFinite(props.concurrency)
      ? Math.max(1, Math.min(20, Math.floor(props.concurrency!)))
      : 2,
  );
  const fileMap = computed(
    () => new Map(options.files.value.map((file) => [file.uid, file])),
  );
  let frame = 0,
    pumping = false;
  const progress = new Map<string, number>();
  function current(task: Task) {
    return (
      options.live() &&
      options.available.value &&
      !task.controller.signal.aborted &&
      tasks.value.get(task.uid) === task &&
      fileMap.value.get(task.uid)?.raw === task.raw
    );
  }
  function removeProgress(uid: string) {
    progress.delete(uid);
    if (!progress.size && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  function notifyProgress(task: Task, value: number) {
    if (!current(task) || task.phase !== "running" || !Number.isFinite(value))
      return;
    const next = Math.max(task.percentage, Math.min(100, Math.max(0, value)));
    if (next === task.percentage) return;
    task.percentage = next;
    progress.set(task.uid, Math.round(next * 10) / 10);
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const changes = new Map<string, Partial<T>>(),
        owners = new Map<string, Task>();
      for (const [uid, p] of progress) {
        const owner = tasks.value.get(uid);
        if (owner && current(owner) && owner.phase === "running") {
          changes.set(uid, { percentage: p } as Partial<T>);
          owners.set(uid, owner);
        }
      }
      progress.clear();
      if (!changes.size) return;
      void options
        .patch(changes, "progress", (uid) =>
          uid
            ? !!owners.get(uid) &&
              current(owners.get(uid)!) &&
              owners.get(uid)!.phase === "running"
            : [...owners.values()].some(
                (t) => current(t) && t.phase === "running",
              ),
        )
        .then(() => {
          for (const [uid, task] of owners) {
            if (current(task) && task.phase === "running") {
              const file = fileMap.value.get(uid);
              if (file)
                options.emit("progress", (changes.get(uid) as any).percentage, {
                  ...file,
                  ...changes.get(uid),
                });
            }
          }
        });
    });
  }
  function release(task: Task) {
    if (tasks.value.get(task.uid) !== task) return;
    const next = new Map(tasks.value);
    next.delete(task.uid);
    tasks.value = next;
    pump();
  }
  function finish(task: Task, error?: unknown, response?: unknown) {
    if (!current(task) || task.phase === "finishing") return;
    task.phase = "finishing";
    removeProgress(task.uid);
    void (async () => {
      const failure = error === undefined ? undefined : uploadFailure(error);
      const change = (
        failure
          ? { status: "error", error: failure }
          : { status: "success", percentage: 100, response, error: undefined }
      ) as Partial<T>;
      await options.patch(
        new Map([[task.uid, change]]),
        failure ? "error" : "success",
        () => current(task),
      );
      if (!current(task)) return;
      const item = { ...fileMap.value.get(task.uid)!, ...change };
      if (failure) {
        options.emit("uploadError", failure, item);
        options.emit("error", failure.message);
      } else options.emit("success", response, item);
      release(task);
    })().catch((error) => {
      if (current(task)) {
        options.emit("error", uploadFailure(error).message);
        release(task);
      }
    });
  }
  function result(task: Task, value: HysUploadRequestResult) {
    if (typeof value === "function") task.stop = value;
    else if (value && typeof (value as Promise<unknown>).then === "function")
      void Promise.resolve(value).then(
        (response) => finish(task, undefined, response),
        (error) => finish(task, error),
      );
    else if (value) {
      const handle = value as {
        abort?: () => void;
        promise?: Promise<unknown>;
      };
      task.stop = handle.abort?.bind(handle);
      if (handle.promise)
        void handle.promise.then(
          (response) => finish(task, undefined, response),
          (error) => finish(task, error),
        );
    }
    if (task.controller.signal.aborted) task.stop?.();
  }
  async function run(task: Task) {
    try {
      let file = fileMap.value.get(task.uid);
      if (!file || !current(task)) return;
      const body = await options.prepare(file, task.controller.signal);
      if (!current(task)) return;
      if (!body) {
        release(task);
        return;
      }
      const accepted = await options.patch(
        new Map([
          [
            task.uid,
            {
              status: "uploading",
              percentage: 0,
              error: undefined,
              response: undefined,
            } as Partial<T>,
          ],
        ]),
        "start",
        () => current(task),
      );
      if (!current(task)) return;
      if (!accepted) {
        cancelOne(task.uid, "rejected", false);
        return;
      }
      file = fileMap.value.get(task.uid)!;
      task.phase = "running";
      options.emit("start", file);
      if (!current(task)) return;
      const context: HysUploadContext<T> = {
        signal: task.controller.signal,
        files: options.files.value,
      };
      const [action, data, headers] = await Promise.all([
        typeof props.action === "function"
          ? props.action(file, context)
          : (props.action ?? ""),
        typeof props.data === "function"
          ? props.data(file, context)
          : (props.data ?? {}),
        typeof props.headers === "function"
          ? props.headers(file, context)
          : (props.headers ?? {}),
      ]);
      if (!current(task)) return;
      const request: HysUploadRequestOptions<T> = {
        ...context,
        file: fileMap.value.get(task.uid)!,
        body,
        action,
        method: props.method ?? "POST",
        name: props.name ?? "file",
        headers,
        data,
        withCredentials: !!props.withCredentials,
        timeout: Number.isFinite(props.timeout)
          ? Math.max(0, props.timeout!)
          : 0,
        onProgress: (value) => notifyProgress(task, value),
        onSuccess: (value) => finish(task, undefined, value),
        onError: (error) => finish(task, error),
      };
      if (!props.customRequest && !action)
        throw Object.assign(new Error("请配置有效的上传地址"), {
          kind: "configuration",
        });
      result(
        task,
        props.customRequest
          ? props.customRequest(request)
          : uploadRequest(request),
      );
    } catch (error) {
      finish(task, error);
    }
  }
  function pump() {
    if (pumping) return;
    pumping = true;
    queueMicrotask(() => {
      pumping = false;
      if (!options.live() || !options.available.value || !configured.value)
        return;
      while (tasks.value.size < limit.value && queue.value.length) {
        const uid = queue.value[0];
        queue.value = queue.value.slice(1);
        const item = fileMap.value.get(uid);
        if (!item?.raw || tasks.value.has(uid)) continue;
        const task: Task = {
          uid,
          raw: item.raw,
          controller: new AbortController(),
          phase: "preparing",
          percentage: 0,
        };
        tasks.value = new Map(tasks.value).set(uid, task);
        void run(task);
      }
    });
  }
  async function submit(uid?: string) {
    if (!options.live() || !options.available.value || !configured.value)
      return 0;
    const selected = options.files.value.filter(
      (file) =>
        (uid === undefined || file.uid === uid) &&
        file.raw &&
        ["ready", "error"].includes(uploadStatus(file)) &&
        !tasks.value.has(file.uid) &&
        !queue.value.includes(file.uid),
    );
    for (const file of selected)
      if (uploadStatus(file) === "error") options.forget(file.uid);
    queue.value = [...queue.value, ...selected.map((file) => file.uid)];
    pump();
    return selected.length;
  }
  function cancelOne(uid: string, reason: string, reset = true) {
    const task = tasks.value.get(uid),
      queued = queue.value.includes(uid);
    if (!task && !queued) return false;
    queue.value = queue.value.filter((key) => key !== uid);
    removeProgress(uid);
    if (task) {
      const next = new Map(tasks.value);
      next.delete(uid);
      tasks.value = next;
      task.controller.abort();
      try {
        task.stop?.();
      } catch {}
    }
    const file = fileMap.value.get(uid);
    if (reset && file) {
      void options.patch(
        new Map([
          [
            uid,
            { status: "ready", percentage: 0, error: undefined } as Partial<T>,
          ],
        ]),
        "abort",
        () => options.live() && fileMap.value.get(uid)?.raw === file.raw,
      );
      options.emit("abort", file, reason);
    }
    pump();
    return true;
  }
  function abort(uid?: string, reason = "user", reset = true) {
    const ids =
      uid === undefined
        ? new Set([...queue.value, ...tasks.value.keys()])
        : new Set([uid]);
    let count = 0;
    for (const key of ids) if (cancelOne(key, reason, reset)) count++;
    return count;
  }
  async function retry(uid: string) {
    const file = fileMap.value.get(uid);
    if (!file?.raw || !options.available.value || !options.live()) return false;
    abort(uid, "retry", false);
    options.forget(uid);
    const empty =
      uploadStatus(file) === "ready" &&
      !file.percentage &&
      !file.error &&
      file.response === undefined;
    const accepted =
      empty ||
      (await options.patch(
        new Map([
          [
            uid,
            {
              status: "ready",
              percentage: 0,
              error: undefined,
              response: undefined,
            } as Partial<T>,
          ],
        ]),
        "retry",
      ));
    if (!accepted) return false;
    return (await submit(uid)) > 0;
  }
  function reconcile() {
    for (const [uid, task] of tasks.value) {
      const item = fileMap.value.get(uid);
      if (
        !item ||
        item.raw !== task.raw ||
        (task.phase === "running" &&
          ["success", "error"].includes(uploadStatus(item)))
      )
        cancelOne(uid, "model", false);
    }
    queue.value = queue.value.filter((uid) => !!fileMap.value.get(uid)?.raw);
  }
  watch(
    () => options.files.value.map((file) => [file.uid, file.raw, file.status]),
    reconcile,
    { flush: "sync" },
  );
  watch([options.available, limit, configured], () => {
    if (options.available.value) pump();
  });
  function cleanup() {
    abort(undefined, "cleanup", false);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    progress.clear();
  }
  return {
    configured,
    queue,
    tasks,
    uploading: computed(() => tasks.value.size),
    queued: computed(() => queue.value.length),
    activeKeys: computed(() => new Set(tasks.value.keys())),
    queuedKeys: computed(() => new Set(queue.value)),
    submit,
    retry,
    abort,
    cleanup,
  };
}
