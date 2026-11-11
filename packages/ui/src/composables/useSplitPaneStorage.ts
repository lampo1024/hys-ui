import { onMounted, watch, type Ref } from "vue";
import type { HysSplitPaneLength, HysSplitPaneSizes } from "../components/HysSplitPane/HysSplitPane.vue";

export function readStoredPaneSizes(value: unknown): HysSplitPaneSizes | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const entries = Object.entries(value).filter((entry): entry is [string, HysSplitPaneLength] => {
    const size = entry[1];
    return typeof size === "number" ? Number.isFinite(size) && size >= 0 :
      typeof size === "string" && /^(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?(?:px|%)$/i.test(size);
  });
  if (entries.length) return Object.fromEntries(entries);
}

export function useSplitPaneStorage<T>(
  key: () => string | undefined,
  state: Ref<T | undefined>,
  decode: (value: unknown) => T | undefined,
) {
  let mounted = false;
  const storageKey = (name: string) => "hys-ui:split-pane:" + name;
  function read(name: string) {
    try {
      state.value = decode(JSON.parse(window.localStorage.getItem(storageKey(name)) ?? "null"));
    } catch {
      state.value = undefined;
    }
  }
  onMounted(() => {
    mounted = true;
    const name = key();
    if (name) read(name);
  });
  watch(key, (name) => {
    if (mounted && name) read(name);
  }, { flush: "sync" });
  watch(state, (value) => {
    const name = key();
    if (!mounted || !name) return;
    try {
      if (value === undefined) window.localStorage.removeItem(storageKey(name));
      else window.localStorage.setItem(storageKey(name), JSON.stringify(value));
    } catch {
      // Resizing remains available when browser storage is unavailable.
    }
  });
}
