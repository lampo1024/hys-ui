import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  shallowRef,
  watch,
  type Ref,
} from "vue";
import { fieldKey, formKey, useHysControlState } from "./formContext";
import { useChoiceNativeReset } from "./choiceModel";
import { useUploadModel } from "./useUploadModel";
import { useUploadRequests } from "./useUploadRequests";
import {
  uploadLocale,
  uploadStatus,
  uploadPercent,
  uploadImage,
  uploadUrl,
  uploadFailure,
  type HysUploadProps,
  type HysUploadItem,
  type HysUploadFile,
  type HysUploadChangeType,
  type HysUploadFileContext,
  type HysUploadSlotContext,
  type HysUploadStatus,
} from "./upload";
export function useUpload<T extends HysUploadItem>(
  props: HysUploadProps<T>,
  emit: (name: string, ...args: any[]) => void,
) {
  const element = ref<HTMLElement>(),
    zone = ref<HTMLElement>(),
    input = ref<HTMLInputElement>(),
    active = ref(true),
    checking = ref(false),
    dragging = ref(false),
    lastError = ref("");
  const field = inject(fieldKey, undefined),
    form = inject(formKey, undefined),
    control = useHysControlState(props);
  const available = computed(
      () =>
        active.value &&
        !control.disabled.value &&
        !props.readonly &&
        !props.loading,
    ),
    words = computed(() => ({ ...uploadLocale, ...props.locale }));
  const model = useUploadModel(props, emit, () => active.value);
  const bodies = new Map<string, { raw: File; body: Blob }>(),
    guards = new Map<string, AbortController>(),
    guardFiles = new Map<string, File | undefined>(),
    removalCommits = new Set<string>(),
    removing = shallowRef(new Set<string>());
  let selection: AbortController | undefined,
    selectionVersion = 0,
    dragDepth = 0,
    previewController: AbortController | undefined,
    downloadController: AbortController | undefined,
    previewOwner: T | undefined,
    downloadOwner: T | undefined;
  const ownedUrls = shallowRef(new Map<string, { raw: File; url: string }>()),
    preview = shallowRef<{ file: T; url: string } | undefined>();
  const maxCount = () =>
    Number.isFinite(props.limit) && props.limit! > 0
      ? Math.floor(props.limit!)
      : Infinity;
  const alive = (signal: AbortSignal) =>
    active.value && !signal.aborted && available.value;
  function report(error: unknown) {
    const message = uploadFailure(error).message;
    lastError.value = message;
    emit("error", message);
  }
  function validateEvent() {
    if (props.validateEvent !== false && !form?.resetting.value)
      void nextTick(() => {
        if (active.value && !form?.resetting.value)
          void field?.validate?.("change");
      });
  }
  function fail(
    file: File,
    reason: "type" | "size" | "validation" | "identity",
    message: string,
  ) {
    if (!active.value) return;
    lastError.value = message;
    emit("error", message);
    emit("invalid", { file, reason, message, files: model.files.value });
  }
  function accepted(file: File) {
    return (
      !props.accept ||
      props.accept.split(",").some((value) => {
        const rule = value.trim().toLowerCase(),
          type = file.type.toLowerCase();
        return rule.startsWith(".")
          ? file.name.toLowerCase().endsWith(rule)
          : rule.endsWith("/*")
            ? type.startsWith(rule.slice(0, -1))
            : type === rule;
      })
    );
  }
  async function validate(raw: File, signal: AbortSignal) {
    if (!alive(signal)) return;
    if (!accepted(raw)) {
      fail(raw, "type", "文件类型不符合要求：" + raw.name);
      return;
    }
    if (
      Number.isFinite(props.maxSize) &&
      props.maxSize! > 0 &&
      raw.size > props.maxSize!
    ) {
      fail(raw, "size", "文件超过大小限制：" + raw.name);
      return;
    }
    try {
      const result = props.beforeUpload
        ? await props.beforeUpload(raw, { signal, files: model.files.value })
        : undefined;
      if (!alive(signal) || result === false) return;
      const body = result instanceof Blob ? result : raw;
      if (
        Number.isFinite(props.maxSize) &&
        props.maxSize! > 0 &&
        body.size > props.maxSize!
      ) {
        fail(raw, "size", "处理后的文件超过大小限制：" + raw.name);
        return;
      }
      return body;
    } catch (error) {
      if (alive(signal)) fail(raw, "validation", uploadFailure(error).message);
    }
  }
  async function patch(
    changes: Map<string, Partial<T>>,
    type: HysUploadChangeType,
    guard?: (uid?: string) => boolean,
  ) {
    const result = await model.commit(
      (files) =>
        files.map((file) =>
          changes.has(file.uid) && guard?.(file.uid) !== false
            ? { ...file, ...changes.get(file.uid) }
            : file,
        ),
      type,
      { guard: () => active.value && guard?.() !== false },
    );
    if (result && ["success", "error", "retry"].includes(type)) validateEvent();
    return result;
  }
  const requests = useUploadRequests({
    props,
    files: model.files,
    available,
    live: () => active.value,
    emit,
    patch,
    forget: (uid: string) => bodies.delete(uid),
    prepare: async (file: T, signal: AbortSignal) => {
      if (!file.raw) return;
      const known = bodies.get(file.uid);
      if (known?.raw === file.raw) return known.body;
      const body = await validate(file.raw, signal);
      if (body && alive(signal)) bodies.set(file.uid, { raw: file.raw, body });
      return body;
    },
  });
  function invalidateSelection() {
    selectionVersion++;
    selection?.abort();
    selection = undefined;
    checking.value = false;
    dragging.value = false;
    dragDepth = 0;
    if (input.value) input.value.value = "";
  }
  function key(file: T | string) {
    return typeof file === "string" ? file : file.uid;
  }
  async function addFiles(inputFiles: readonly File[]) {
    if (!available.value || checking.value) return [];
    const list =
      props.multiple === false ? [...inputFiles].slice(0, 1) : [...inputFiles];
    if (!list.length) return [];
    if (
      (props.multiple === false ? 0 : model.files.value.length) + list.length >
      maxCount()
    ) {
      emit("exceed", list);
      if (input.value) input.value.value = "";
      return [];
    }
    const token = ++selectionVersion,
      controller = new AbortController();
    selection = controller;
    checking.value = true;
    lastError.value = "";
    const result: T[] = [],
      prepared = new Map<string, { raw: File; body: Blob }>();
    try {
      for (const raw of list) {
        if (token !== selectionVersion || !alive(controller.signal)) return [];
        const body = await validate(raw, controller.signal);
        if (!body) continue;
        if (token !== selectionVersion || !alive(controller.signal)) return [];
        const uid = crypto.randomUUID();
        let file: T;
        try {
          const base = {
            uid,
            name: raw.name,
            size: raw.size,
            raw,
            status: "ready" as const,
            percentage: 0,
            type: raw.type,
            ...(raw.webkitRelativePath
              ? { relativePath: raw.webkitRelativePath }
              : {}),
          };
          file = props.createFile
            ? ({ ...base, ...props.createFile(raw, uid) } as T)
            : (base as T);
          if (
            !file.uid ||
            typeof file.uid !== "string" ||
            typeof file.name !== "string" ||
            !file.raw ||
            model.files.value.some((f) => f.uid === file.uid) ||
            prepared.has(file.uid)
          ) {
            fail(raw, "identity", "文件标识无效或重复：" + raw.name);
            continue;
          }
        } catch (error) {
          fail(raw, "identity", uploadFailure(error).message);
          continue;
        }
        result.push(file);
        prepared.set(file.uid, { raw: file.raw!, body });
      }
      if (
        !result.length ||
        token !== selectionVersion ||
        !alive(controller.signal)
      )
        return [];
      const accepted = await model.commit(
        (files) => {
          if (
            (props.multiple === false ? 0 : files.length) + result.length >
            maxCount()
          ) {
            emit("exceed", list);
            return;
          }
          return props.multiple === false ? result : [...files, ...result];
        },
        "select",
        {
          guard: () => token === selectionVersion && alive(controller.signal),
          accepted: () => {
            for (const [uid, value] of prepared) bodies.set(uid, value);
            emit(
              "select",
              result.map((file) => file.raw!),
            );
          },
        },
      );
      if (!accepted) return [];
      validateEvent();
      if (props.autoUpload !== false && requests.configured.value)
        for (const file of result) void requests.submit(file.uid);
      return result;
    } finally {
      if (token === selectionVersion) {
        checking.value = false;
        selection = undefined;
        if (input.value) input.value.value = "";
      }
    }
  }
  async function remove(file: T | string) {
    if (!available.value) return false;
    const uid = key(file),
      item = model.files.value.find((f) => f.uid === uid);
    if (!item || guards.has(uid)) return false;
    const guard = new AbortController();
    guards.set(uid, guard);
    guardFiles.set(uid, item.raw);
    removing.value = new Set(guards.keys());
    try {
      if (
        props.beforeRemove &&
        (await props.beforeRemove(item, model.files.value, {
          signal: guard.signal,
          files: model.files.value,
        })) === false
      )
        return false;
      if (
        !alive(guard.signal) ||
        !model.files.value.some(
          (file) => file.uid === uid && file.raw === item.raw,
        )
      )
        return false;
      removalCommits.add(uid);
      const result = await model.commit(
        (files) =>
          files.some((f) => f.uid === uid && f.raw === item.raw)
            ? files.filter((f) => f.uid !== uid)
            : undefined,
        "remove",
        {
          guard: () => alive(guard.signal),
          accepted: () => emit("remove", item),
        },
      );
      if (result) {
        lastError.value = "";
        validateEvent();
      }
      return result;
    } catch (error) {
      if (alive(guard.signal)) {
        report(error);
        emit("removeError", uploadFailure(error), item);
      }
      return false;
    } finally {
      removalCommits.delete(uid);
      if (guards.get(uid) === guard) {
        guards.delete(uid);
        guardFiles.delete(uid);
        removing.value = new Set(guards.keys());
      }
    }
  }
  function clearFiles(statuses?: readonly HysUploadStatus[]) {
    invalidateSelection();
    model.cancel();
    const keys = new Set(
      model.files.value
        .filter((file) => !statuses || statuses.includes(uploadStatus(file)))
        .map((file) => file.uid),
    );
    for (const uid of keys) {
      requests.abort(uid, "clear", false);
      guards.get(uid)?.abort();
      guards.delete(uid);
      guardFiles.delete(uid);
      bodies.delete(uid);
    }
    removing.value = new Set(guards.keys());
    lastError.value = "";
    const result = model.commit(
      (files) => files.filter((file) => !keys.has(file.uid)),
      "clear",
      { force: true, allowInactive: true },
    );
    void result.then((ok) => {
      if (ok) validateEvent();
    });
    return result;
  }
  function safeThumbnail(file: T) {
    return (
      uploadUrl(file.thumbUrl, true) ??
      (uploadImage(file) ? uploadUrl(file.url, true) : undefined) ??
      ownedUrls.value.get(file.uid)?.url
    );
  }
  function ensureUrl(file: T) {
    const known = ownedUrls.value.get(file.uid);
    if (known && known.raw === file.raw) return known.url;
    if (
      !file.raw ||
      !uploadImage(file) ||
      typeof URL.createObjectURL !== "function"
    )
      return;
    try {
      const url = URL.createObjectURL(file.raw);
      if (known) URL.revokeObjectURL(known.url);
      ownedUrls.value = new Map(ownedUrls.value).set(file.uid, {
        raw: file.raw,
        url,
      });
      return url;
    } catch {}
  }
  function revokeAll() {
    for (const entry of ownedUrls.value.values())
      URL.revokeObjectURL(entry.url);
    ownedUrls.value = new Map();
  }
  function syncUrls() {
    const visible =
      active.value && props.showFileList !== false && props.listType !== "text";
    const files = new Map(model.files.value.map((file) => [file.uid, file]));
    let changed = false;
    const next = new Map(ownedUrls.value);
    for (const [uid, value] of next) {
      const file = files.get(uid);
      if (
        !file ||
        file.raw !== value.raw ||
        (!visible && preview.value?.file.uid !== uid) ||
        uploadUrl(file.thumbUrl, true) ||
        (uploadImage(file) && uploadUrl(file.url, true))
      ) {
        URL.revokeObjectURL(value.url);
        next.delete(uid);
        changed = true;
      }
    }
    if (changed) ownedUrls.value = next;
    if (visible)
      for (const file of model.files.value)
        if (uploadImage(file) && !safeThumbnail(file)) ensureUrl(file);
  }
  function closePreview() {
    previewController?.abort();
    previewController = undefined;
    previewOwner = undefined;
    preview.value = undefined;
    syncUrls();
  }
  async function previewFile(file: T | string) {
    const item = model.files.value.find((f) => f.uid === key(file));
    if (!item || !active.value || control.disabled.value || props.loading)
      return false;
    previewController?.abort();
    const controller = new AbortController();
    previewController = controller;
    previewOwner = item;
    try {
      emit("preview", item);
      const custom = props.previewFile
        ? await props.previewFile(item, {
            signal: controller.signal,
            files: model.files.value,
          })
        : undefined;
      if (
        !active.value ||
        controller.signal.aborted ||
        !model.files.value.some(
          (f) => f.uid === item.uid && f.raw === item.raw,
        ) ||
        custom === false
      )
        return false;
      const url =
        typeof custom === "string"
          ? uploadUrl(custom, true)
          : (safeThumbnail(item) ?? ensureUrl(item));
      if (!url) return false;
      preview.value = { file: item, url };
      return true;
    } catch (error) {
      if (active.value && !controller.signal.aborted) report(error);
      return false;
    }
  }
  async function download(file: T | string) {
    const item = model.files.value.find((f) => f.uid === key(file));
    if (!item || !active.value || control.disabled.value || props.loading)
      return false;
    downloadController?.abort();
    const controller = new AbortController();
    downloadController = controller;
    downloadOwner = item;
    try {
      emit("download", item);
      const custom = props.downloadFile
        ? await props.downloadFile(item, {
            signal: controller.signal,
            files: model.files.value,
          })
        : undefined;
      if (
        !active.value ||
        controller.signal.aborted ||
        !model.files.value.some((f) => f.uid === item.uid && f.raw === item.raw)
      )
        return false;
      if (props.downloadFile && typeof custom !== "string")
        return custom !== false;
      let temporary: string | undefined;
      const url =
        typeof custom === "string"
          ? uploadUrl(custom)
          : (uploadUrl(item.url) ??
            (item.raw && typeof URL.createObjectURL === "function"
              ? (temporary = URL.createObjectURL(item.raw))
              : undefined));
      if (!url) return false;
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.name;
      anchor.rel = "noopener noreferrer";
      anchor.target = "_blank";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      if (temporary) setTimeout(() => URL.revokeObjectURL(temporary!), 0);
      return true;
    } catch (error) {
      if (active.value && !controller.signal.aborted) report(error);
      return false;
    }
  }
  function canPreview(file: T) {
    return (
      props.showPreview !== false &&
      (!!props.previewFile ||
        (uploadImage(file) && !!(file.raw || safeThumbnail(file))))
    );
  }
  function canDownload(file: T) {
    return (
      props.showDownload !== false &&
      !!(props.downloadFile || file.raw || uploadUrl(file.url))
    );
  }
  function context(file: T): HysUploadFileContext<T> {
    return {
      file,
      status: uploadStatus(file),
      percentage: uploadPercent(file),
      queued: requests.queuedKeys.value.has(file.uid),
      busy:
        requests.activeKeys.value.has(file.uid) || removing.value.has(file.uid),
      thumbnail: safeThumbnail(file),
      actions: {
        preview: () => previewFile(file),
        download: () => download(file),
        remove: () => remove(file),
        retry: () => requests.retry(file.uid),
        abort: () => requests.abort(file.uid),
      },
    };
  }
  function open(event?: Event) {
    if (!available.value || checking.value) return;
    event?.preventDefault();
    event?.stopPropagation();
    input.value?.click();
  }
  function click(event: MouseEvent) {
    if (
      props.openFileDialogOnClick === false ||
      event.defaultPrevented ||
      (event.target as HTMLElement).closest(
        "input,textarea,select,a[href],[data-upload-no-trigger]",
      )
    )
      return;
    open(event);
  }
  function keys(event: KeyboardEvent) {
    if (
      (event.target as HTMLElement).closest(
        'button,a[href],input,textarea,select,[contenteditable="true"]',
      )
    )
      return;
    if (
      (event.key === "Enter" || event.key === " ") &&
      props.openFileDialogOnClick !== false
    )
      open(event);
  }
  function drop(event: DragEvent) {
    dragging.value = false;
    dragDepth = 0;
    if (props.drag === false || !available.value) return;
    const list = Array.from(event.dataTransfer?.files ?? []);
    if (list.length) {
      event.preventDefault();
      emit("drop", event);
      void addFiles(list);
    }
  }
  function dragEnter(event: DragEvent) {
    if (
      props.drag === false ||
      !available.value ||
      !Array.from(event.dataTransfer?.types ?? []).includes("Files")
    )
      return;
    event.preventDefault();
    dragDepth++;
    dragging.value = true;
  }
  function dragOver(event: DragEvent) {
    if (
      props.drag === false ||
      !available.value ||
      !Array.from(event.dataTransfer?.types ?? []).includes("Files")
    )
      return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    dragging.value = true;
  }
  function dragLeave() {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) dragging.value = false;
  }
  function paste(event: ClipboardEvent) {
    if (!props.paste || !available.value) return;
    const files = Array.from(event.clipboardData?.files ?? []);
    if (files.length) {
      event.preventDefault();
      emit("paste", event);
      void addFiles(files);
    }
  }
  function cleanup(interrupt = true) {
    invalidateSelection();
    model.cancel();
    const keys = new Set(requests.tasks.value.keys());
    requests.cleanup();
    for (const guard of guards.values()) guard.abort();
    guards.clear();
    guardFiles.clear();
    removalCommits.clear();
    removing.value = new Set();
    previewController?.abort();
    downloadController?.abort();
    previewOwner = downloadOwner = undefined;
    preview.value = undefined;
    revokeAll();
    if (interrupt) model.interrupt(keys);
  }
  watch(
    available,
    (value) => {
      if (!value) cleanup();
    },
    { flush: "sync" },
  );
  watch(
    () => [
      props.accept,
      props.limit,
      props.maxSize,
      props.multiple,
      props.beforeUpload,
    ],
    () => {
      invalidateSelection();
      for (const [uid, task] of requests.tasks.value)
        if (task.phase === "preparing") requests.abort(uid, "configuration");
    },
  );
  watch(
    () =>
      model.files.value.map((file) => [
        file.uid,
        file.raw,
        file.url,
        file.thumbUrl,
        file.type,
        file.name,
      ]),
    () => {
      const files = model.files.value;
      const map = new Map(files.map((f) => [f.uid, f]));
      for (const [uid, value] of bodies)
        if (map.get(uid)?.raw !== value.raw) bodies.delete(uid);
      for (const [uid, guard] of guards)
        if (
          (!map.has(uid) && !removalCommits.has(uid)) ||
          (map.has(uid) && map.get(uid)?.raw !== guardFiles.get(uid))
        ) {
          guard.abort();
          guards.delete(uid);
          guardFiles.delete(uid);
          removing.value = new Set(guards.keys());
        }
      if (
        previewOwner &&
        (!map.has(previewOwner.uid) ||
          map.get(previewOwner.uid)?.raw !== previewOwner.raw)
      )
        closePreview();
      if (
        downloadOwner &&
        (!map.has(downloadOwner.uid) ||
          map.get(downloadOwner.uid)?.raw !== downloadOwner.raw)
      ) {
        downloadController?.abort();
        downloadController = undefined;
        downloadOwner = undefined;
      }
      syncUrls();
    },
    { flush: "post" },
  );
  watch(() => [props.listType, props.showFileList], syncUrls);
  function reset() {
    cleanup(false);
    model.resetLocal();
    lastError.value = "";
  }
  watch(
    () => form?.resetting.value,
    (value) => {
      if (value) reset();
    },
    { flush: "sync" },
  );
  useChoiceNativeReset(input, reset);
  onDeactivated(() => {
    active.value = false;
    cleanup();
  });
  onBeforeUnmount(() => {
    active.value = false;
    cleanup();
  });
  onActivated(() => {
    active.value = true;
    syncUrls();
  });
  const scope = computed<HysUploadSlotContext<T>>(() => ({
    files: model.files.value,
    busy: checking.value,
    disabled: !available.value,
    uploading: requests.uploading.value,
    queued: requests.queued.value,
    open,
    submit: () => requests.submit(),
    abort: () => requests.abort(),
    clear: () => clearFiles(),
  }));
  function blur(event: FocusEvent) {
    if (element.value?.contains(event.relatedTarget as Node)) return;
    if (props.validateEvent !== false) void field?.validate?.("blur");
  }
  return {
    element,
    zone,
    input,
    active,
    available,
    disabled: control.disabled,
    size: control.size,
    label: control.label,
    field,
    checking,
    dragging,
    lastError,
    words,
    files: model.files,
    requests,
    removing,
    preview,
    closePreview,
    context,
    scope,
    canPreview,
    canDownload,
    open,
    click,
    keys,
    drop,
    dragEnter,
    dragOver,
    dragLeave,
    paste,
    blur,
    addFiles,
    remove,
    clearFiles,
    previewFile,
    download,
    focus: () => {
      if (available.value) zone.value?.focus();
    },
  };
}
