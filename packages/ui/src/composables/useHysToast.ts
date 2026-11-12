import {
  createApp,
  defineComponent,
  getCurrentInstance,
  h,
  nextTick,
  onActivated,
  onDeactivated,
  onScopeDispose,
  render,
  shallowRef,
  toValue,
} from "vue";
import { provideHysConfig, useHysRootAttrs } from "../config";
import ToastViewport from "../components/HysToast/ToastViewport/ToastViewport.vue";
import { createToastQueue } from "./toastQueue";
import type {
  HysToastApi,
  HysToastConfig,
  HysToastService,
  HysToastServiceConfig,
} from "../components/HysToast/toastTypes";

export type * from "../components/HysToast/toastTypes";

export function useHysToast(config: HysToastConfig = {}): HysToastApi {
  const owner = getCurrentInstance();
  if (!owner)
    throw new Error("useHysToast must be called during component setup");
  const skin = useHysRootAttrs();
  let host: HTMLDivElement | undefined;
  const reportError = (error: unknown) => {
    try {
      if (owner.appContext.config.errorHandler)
        owner.appContext.config.errorHandler(
          error,
          owner.proxy,
          "HysToast callback",
        );
      else console.error(error);
    } catch (handlerError) {
      console.error(handlerError);
    }
  };
  function unmountHost() {
    if (!host) return;
    render(null, host);
    host.remove();
    host = undefined;
  }
  function mountHost() {
    const target = queue.settings.value.appendTo;
    const parent =
      typeof target === "string"
        ? document.querySelector(target)
        : (target ?? document.body);
    if (!parent) throw new Error("Toast appendTo target was not found");
    if (host) {
      if (host.parentNode !== parent) parent.appendChild(host);
      return;
    }
    host = document.createElement("div");
    host.dataset.hysToastHost = "";
    parent.appendChild(host);
    const vnode = h(ToastViewport, { queue, skin: () => skin.value });
    vnode.appContext = owner!.appContext;
    render(vnode, host);
  }
  const queue = createToastQueue(
    config,
    {
      mount: mountHost,
      empty: () => {
        void nextTick(() => {
          if (!queue.records.size) unmountHost();
        });
      },
    },
    reportError,
  );
  function dispose(permanent = false) {
    queue.suspend(permanent);
    unmountHost();
  }
  onDeactivated(() => dispose());
  onActivated(queue.resume);
  onScopeDispose(() => dispose(true));
  return {
    ...queue.api,
    configure(patch) {
      queue.api.configure(patch);
      if (host && "appendTo" in patch) mountHost();
    },
  };
}

export function createHysToast(
  config: HysToastServiceConfig = {},
): HysToastService {
  const { theme, motion, buttonAutoInsertSpace, ...options } = config;
  if (typeof document === "undefined") {
    const queue = createToastQueue(
      options,
      { mount() {}, empty() {} },
      () => {},
    );
    return { ...queue.api, dispose: () => queue.suspend(true) };
  }
  let api!: HysToastApi;
  let disposed = false;
  const bridge = defineComponent({
    setup() {
      api = useHysToast(options);
      return () => null;
    },
  });
  const app = createApp(
    defineComponent({
      setup() {
        provideHysConfig({ theme, motion, buttonAutoInsertSpace });
        return () => h(bridge);
      },
    }),
  );
  app.mount(document.createElement("div"));
  return {
    ...api,
    dispose() {
      if (disposed) return;
      disposed = true;
      app.unmount();
    },
  };
}

let globalService: HysToastService | undefined;
const globalOptions = shallowRef<HysToastServiceConfig>({});
function globalToast() {
  if (typeof document === "undefined") return createHysToast();
  return (globalService ??= createHysToast({
    ...globalOptions.value,
    theme: () => toValue(globalOptions.value.theme) ?? "blue",
    motion: () => toValue(globalOptions.value.motion) ?? "subtle",
    buttonAutoInsertSpace: () =>
      toValue(globalOptions.value.buttonAutoInsertSpace) ?? true,
  }));
}
export function configureHysToast(config: HysToastServiceConfig) {
  if (typeof document === "undefined") return;
  const { theme, motion, buttonAutoInsertSpace, ...options } = config;
  globalOptions.value = { ...globalOptions.value, ...config };
  globalService?.configure(options);
}
export const hysToast: HysToastService = {
  show: (value) => globalToast().show(value),
  success: (value) => globalToast().success(value),
  info: (value) => globalToast().info(value),
  warning: (value) => globalToast().warning(value),
  error: (value) => globalToast().error(value),
  loading: (value) => globalToast().loading(value),
  promise: (task, options) => globalToast().promise(task, options),
  close: (id) => globalService?.close(id),
  update: (id, value) => globalService?.update(id, value),
  find: (id) => globalService?.find(id),
  list: (filter) => globalService?.list(filter) ?? [],
  closeAll: (filter) => globalService?.closeAll(filter),
  closeType: (type) => globalService?.closeType(type),
  clearQueue: () => globalService?.clearQueue(),
  configure: configureHysToast,
  dispose() {
    globalService?.dispose();
    globalService = undefined;
  },
};
