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
  shallowReactive,
  toValue,
} from "vue";
import { provideHysConfig, useHysConfig, type HysConfig } from "../../config";
import HysSpin from "./HysSpin.vue";
import SpinPortal from "./SpinPortal/SpinPortal.vue";
import { provideHysSpin, useSpinConfig } from "./spinConfig";
import type {
  HysSpinHandle,
  HysSpinProps,
  HysSpinRunOptions,
  HysSpinService,
  HysSpinWork,
} from "./spinTypes";
import { useHysSpinTask } from "./useHysSpinTask";

type Instance = {
  run<T>(work: HysSpinWork<T>, settings?: HysSpinRunOptions): Promise<T>;
};
interface Entry {
  key: number;
  options: Partial<HysSpinProps>;
  resolveClosed(): void;
  resolveReady(instance: Instance | undefined): void;
  shown: boolean;
}
let serial = 0;

export function useHysSpin(): HysSpinService {
  const owner = getCurrentInstance();
  if (!owner) throw new Error("useHysSpin must be called during setup");
  const skin = useHysConfig(),
    configuration = useSpinConfig();
  const entries = shallowReactive(new Map<number, Entry>());
  let host: HTMLDivElement | undefined;
  let active = true;
  function detach() {
    if (!host) return;
    render(null, host);
    host.remove();
    host = undefined;
  }
  function remove(entry: Entry) {
    if (!entries.delete(entry.key)) return;
    entry.resolveReady(undefined);
    entry.resolveClosed();
    void nextTick(() => {
      if (!entries.size) detach();
    });
  }
  function hide(entry: Entry) {
    if (!entries.has(entry.key)) return;
    entry.options = { ...entry.options, spinning: false, showResult: false };
    if (!entry.shown)
      void nextTick(() => {
        if (!entry.shown && entry.options.spinning === false) remove(entry);
      });
  }
  const Host = defineComponent({
    setup() {
      provideHysConfig({
        theme: () => toValue(skin.theme) ?? "blue",
        motion: () => toValue(skin.motion) ?? "subtle",
      });
      provideHysSpin({
        defaults: () => configuration.defaults.value,
        presets: () => configuration.presets.value,
      });
      return () =>
        [...entries.values()].map((entry) => {
          const spinner = h(HysSpin, {
            ...entry.options,
            key: entry.key,
            ref: (instance: unknown) => {
              if (instance) entry.resolveReady(instance as Instance);
            },
            "onUpdate:spinning": (value: boolean) => {
              if (value) entry.options = { ...entry.options, spinning: true };
              else hide(entry);
            },
            onShow: () => {
              entry.shown = true;
            },
            onAfterHide: () => {
              if (entry.options.spinning === false) remove(entry);
            },
          });
          const mode = entry.options.mode;
          const defaults = configuration.defaults.value;
          const target =
            mode !== "fullscreen"
              ? (entry.options.appendTo ?? defaults.appendTo)
              : undefined;
          if (!target) return spinner;
          const showing = entry.shown && entry.options.spinning !== false;
          return h(
            SpinPortal,
            {
              key: entry.key,
              target,
              cover: mode === "overlay" || mode === "container",
              block:
                showing &&
                (entry.options.blockInteraction ??
                  defaults.blockInteraction) !== false,
              lock:
                showing && !!(entry.options.lockScroll ?? defaults.lockScroll),
            },
            { default: () => spinner },
          );
        });
    },
  });
  function mountHost() {
    if (host) return;
    host = document.createElement("div");
    host.dataset.hysSpinHost = "";
    document.body.append(host);
    const vnode = h(Host);
    vnode.appContext = owner!.appContext;
    render(vnode, host);
  }
  function open(options: Partial<HysSpinProps> = {}) {
    let resolveReady!: Entry["resolveReady"],
      resolveClosed!: Entry["resolveClosed"];
    const closed = new Promise<void>((resolve) => {
      resolveClosed = resolve;
    });
    const ready = new Promise<Instance | undefined>((resolve) => {
      resolveReady = resolve;
    });
    const entry = shallowReactive<Entry>({
      key: ++serial,
      options: {
        mode: configuration.defaults.value.mode ?? "fullscreen",
        ...options,
        spinning: true,
      },
      resolveReady,
      resolveClosed,
      shown: false,
    });
    const handle: HysSpinHandle = {
      closed,
      close: () => hide(entry),
      update(patch) {
        if (!entries.has(entry.key)) return;
        entry.options = { ...entry.options, ...patch };
        if (patch.spinning === false) hide(entry);
      },
    };
    if (!active || typeof document === "undefined") {
      resolveReady(undefined);
      resolveClosed();
      return { handle, ready };
    }
    mountHost();
    entries.set(entry.key, entry);
    return { handle, ready };
  }
  function dispose() {
    active = false;
    for (const entry of [...entries.values()]) remove(entry);
    detach();
  }
  onDeactivated(dispose);
  onActivated(() => {
    active = true;
  });
  onScopeDispose(dispose);
  return {
    show: (options) => open(options).handle,
    async run<T>(work: HysSpinWork<T>, options?: Partial<HysSpinProps>) {
      if (typeof work !== "function")
        void Promise.resolve(work).catch(() => {});
      const { ready, handle } = open({ ...options, task: undefined });
      const instance = await ready;
      if (!instance) throw new DOMException("Spin scope closed", "AbortError");
      try {
        return await instance.run(work);
      } finally {
        handle.close();
      }
    },
    closeAll() {
      for (const entry of [...entries.values()]) hide(entry);
    },
  };
}

export function createHysSpin(
  config: HysConfig = {},
): HysSpinService & { dispose(): void } {
  if (typeof document === "undefined")
    return {
      show: () => ({ closed: Promise.resolve(), close() {}, update() {} }),
      run: (work, options) =>
        useHysSpinTask().run(work, { timeout: options?.timeout }),
      closeAll() {},
      dispose() {},
    };
  let service!: HysSpinService;
  let disposed = false;
  const app = createApp(
    defineComponent({
      setup() {
        provideHysConfig(config);
        service = useHysSpin();
        return () => null;
      },
    }),
  );
  app.mount(document.createElement("div"));
  return {
    ...service,
    dispose() {
      if (!disposed) {
        disposed = true;
        app.unmount();
      }
    },
  };
}
let global: HysSpinService | undefined;
const service = () =>
  typeof document === "undefined"
    ? createHysSpin()
    : (global ??= createHysSpin());
export const hysSpin: HysSpinService = {
  show: (options) => service().show(options),
  run: (work, options) => service().run(work, options),
  closeAll: () => global?.closeAll(),
};
