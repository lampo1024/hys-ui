import {
  createApp,
  defineComponent,
  Fragment,
  getCurrentInstance,
  h,
  nextTick,
  onActivated,
  onDeactivated,
  onScopeDispose,
  render,
  shallowReactive,
  type VNodeChild,
} from "vue";
import HysModal from "../components/HysModal/HysModal.vue";
import { provideHysConfig, type HysConfig } from "../config";
import type {
  HysModalProps,
  HysModalActionContext,
  HysModalCloseReason,
  HysModalInstance,
  HysModalSlotContext,
  HysModalType,
} from "./modal";

export interface HysModalResult {
  action: "confirm" | "cancel" | "destroy" | "owner-dispose";
  reason: HysModalCloseReason | "destroy" | "owner-dispose";
}
export interface HysModalOptions extends Omit<
  HysModalProps,
  "open" | "modelValue" | "defaultOpen" | "fullscreen" | "appendTo"
> {
  content?: VNodeChild | ((context: HysModalSlotContext) => VNodeChild);
  onOk?: (
    context: HysModalActionContext,
  ) => boolean | void | Promise<boolean | void>;
  onCancel?: (
    context: HysModalActionContext,
  ) => boolean | void | Promise<boolean | void>;
  onAfterClose?: (result: HysModalResult) => void;
}
export interface HysModalHandle {
  readonly id: string;
  readonly closed: Promise<HysModalResult>;
  update(options: Partial<HysModalOptions>): void;
  confirm(): Promise<boolean>;
  cancel(): Promise<boolean>;
  close(): Promise<boolean>;
  destroy(): void;
}
export interface HysModalConfig {
  defaults?: HysModalOptions;
  appendTo?: string | HTMLElement;
}
export interface HysModalApi {
  show(options: HysModalOptions): HysModalHandle;
  confirm(options: HysModalOptions | string): HysModalHandle;
  info(options: HysModalOptions | string): HysModalHandle;
  success(options: HysModalOptions | string): HysModalHandle;
  warning(options: HysModalOptions | string): HysModalHandle;
  error(options: HysModalOptions | string): HysModalHandle;
  destroyAll(): void;
}
export interface HysModalService extends HysModalApi {
  dispose(): void;
}
export interface HysModalServiceConfig extends HysModalConfig, HysConfig {}
let sequence = 0;
interface Entry {
  id: string;
  open: boolean;
  finished: boolean;
  options: HysModalOptions;
  result?: HysModalResult;
  resolve(result: HysModalResult): void;
  instance?: HysModalInstance;
  beforeConfirm(context: HysModalActionContext): Promise<boolean | void>;
  beforeClose(
    reason: HysModalCloseReason,
    context: HysModalActionContext,
  ): Promise<boolean | void>;
}

/** Call in setup. Dialogs inherit ancestor providers and are disposed when their owner leaves. */
export function useHysModal(config: HysModalConfig = {}): HysModalApi {
  const owner = getCurrentInstance();
  if (!owner)
    throw new Error("useHysModal must be called during component setup");
  const entries = shallowReactive<Entry[]>([]);
  let host: HTMLDivElement | undefined,
    active = true,
    disposed = false;
  function notify(callback: (() => void) | undefined) {
    try {
      callback?.();
    } catch (error) {
      try {
        if (owner!.appContext.config.errorHandler)
          owner!.appContext.config.errorHandler(
            error,
            owner!.proxy,
            "HysModal callback",
          );
        else console.error(error);
      } catch (handlerError) {
        console.error(handlerError);
      }
    }
  }
  function finish(
    entry: Entry,
    result = entry.result ??
      ({ action: "cancel", reason: "api" } as HysModalResult),
  ) {
    if (entry.finished) return;
    entry.finished = true;
    const index = entries.indexOf(entry);
    if (index >= 0) entries.splice(index, 1);
    void nextTick(async () => {
      await nextTick();
      entry.resolve(result);
      notify(() => entry.options.onAfterClose?.(result));
      if (host && !entries.length) {
        render(null, host);
        host.remove();
        host = undefined;
      }
    });
  }
  const Queue = defineComponent({
    name: "HysModalQueue",
    setup() {
      return () =>
        h(
          Fragment,
          entries.map((entry) => {
            const { content, onOk, onCancel, onAfterClose, ...props } =
              entry.options;
            return h(
              HysModal,
              {
                ...props,
                key: entry.id,
                open: entry.open,
                appendTo: config.appendTo ?? "body",
                ref: (instance: unknown) => {
                  entry.instance = instance as HysModalInstance | undefined;
                },
                beforeConfirm: entry.beforeConfirm,
                beforeClose: entry.beforeClose,
                "onUpdate:open": (open: boolean) => {
                  entry.open = open;
                },
                onOk: () => {
                  entry.result = { action: "confirm", reason: "confirm" };
                },
                onCancel: (context: HysModalActionContext) => {
                  entry.result = { action: "cancel", reason: context.reason };
                },
                onClosed: () => finish(entry),
              },
              {
                default: (context: HysModalSlotContext) =>
                  typeof content === "function" ? content(context) : content,
              },
            );
          }),
        );
    },
  });
  function mount() {
    if (host) return;
    host = document.createElement("div");
    host.className = "hys-ui-modal-service";
    document.body.append(host);
    const vnode = h(Queue);
    // Each service gets an isolated context object while retaining ancestor injections.
    vnode.appContext = {
      ...owner!.appContext,
      provides: (owner as unknown as { provides: Record<PropertyKey, unknown> })
        .provides,
    };
    render(vnode, host);
  }
  function show(options: HysModalOptions): HysModalHandle {
    if (disposed || !active) throw new Error("HysModal owner is inactive");
    if (typeof document === "undefined")
      throw new Error("HysModal requires a browser document");
    let resolve!: (result: HysModalResult) => void;
    const closed = new Promise<HysModalResult>((done) => (resolve = done));
    const entry: Entry = shallowReactive({
      id: "hys-modal-" + ++sequence,
      open: true,
      finished: false,
      options: shallowReactive({
        footer: true,
        closeOnMask: false,
        initialFocus: "confirm",
        ...config.defaults,
        ...options,
      }),
      resolve,
      async beforeConfirm(context) {
        if (
          (await entry.options.beforeConfirm?.(context)) === false ||
          context.signal.aborted
        )
          return false;
        return entry.options.onOk?.(context);
      },
      async beforeClose(reason, context) {
        if (
          (await entry.options.beforeClose?.(reason, context)) === false ||
          context.signal.aborted
        )
          return false;
        if (reason !== "confirm") return entry.options.onCancel?.(context);
      },
    });
    entries.push(entry);
    mount();
    async function invoke(action: "confirm" | "cancel" | "close") {
      await nextTick();
      return !entry.finished && entry.instance
        ? entry.instance[action]()
        : false;
    }
    return {
      id: entry.id,
      closed,
      update(patch) {
        if (!entry.finished) Object.assign(entry.options, patch);
      },
      confirm: () => invoke("confirm"),
      cancel: () => invoke("cancel"),
      close: () => invoke("close"),
      destroy: () => finish(entry, { action: "destroy", reason: "destroy" }),
    };
  }
  const typed = (type: HysModalType, options: HysModalOptions | string) =>
    show({
      title: {
        confirm: "操作确认",
        info: "提示",
        success: "操作成功",
        warning: "注意",
        error: "操作失败",
        default: "提示",
      }[type],
      showCancel: type === "confirm",
      ...(typeof options === "string" ? { content: options } : options),
      type,
    });
  const destroyAll = () => {
    for (const entry of [...entries])
      finish(entry, { action: "destroy", reason: "destroy" });
  };
  onDeactivated(() => {
    active = false;
    for (const entry of [...entries])
      finish(entry, { action: "owner-dispose", reason: "owner-dispose" });
  });
  onActivated(() => {
    active = true;
  });
  onScopeDispose(() => {
    disposed = true;
    active = false;
    for (const entry of [...entries])
      finish(entry, { action: "owner-dispose", reason: "owner-dispose" });
  });
  return {
    show,
    confirm: (value) => typed("confirm", value),
    info: (value) => typed("info", value),
    success: (value) => typed("success", value),
    warning: (value) => typed("warning", value),
    error: (value) => typed("error", value),
    destroyAll,
  };
}

/** Standalone browser service. Call dispose when its owning application is destroyed. */
export function createHysModal(
  config: HysModalServiceConfig = {},
): HysModalService {
  if (typeof document === "undefined")
    throw new Error("HysModal requires a browser document");
  let api!: HysModalApi,
    disposed = false;
  const app = createApp(
    defineComponent({
      setup() {
        provideHysConfig(config);
        api = useHysModal(config);
        return () => null;
      },
    }),
  );
  const root = document.createElement("div");
  app.mount(root);
  return {
    ...api,
    dispose() {
      if (!disposed) {
        disposed = true;
        app.unmount();
      }
    },
  };
}
