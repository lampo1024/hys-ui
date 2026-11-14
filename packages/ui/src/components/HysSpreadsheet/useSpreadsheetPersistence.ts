import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { readWorkbook } from "./spreadsheetModel";
import type {
  HysSpreadsheetPersistence,
  HysSpreadsheetWorkbook,
} from "./spreadsheetTypes";

export function useSpreadsheetPersistence(
  getWorkbook: () => HysSpreadsheetWorkbook,
  options: {
    persistence?: HysSpreadsheetPersistence;
    storageKey?: string;
    autosave?: number;
  },
  opened: (workbook: HysSpreadsheetWorkbook) => void,
  saved: (workbook: HysSpreadsheetWorkbook) => void,
  failed: (operation: "open" | "save", error: unknown) => void,
) {
  const checkpoint = shallowRef(getWorkbook());
  const dirty = computed(() => getWorkbook() !== checkpoint.value);
  const busy = ref<"open" | "save" | null>(null);
  let request: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const canSave = computed(() => !!(options.persistence || options.storageKey));
  const canLoad = computed(
    () => !!(options.persistence?.load || options.storageKey),
  );

  function markSaved(workbook = getWorkbook()) {
    checkpoint.value = workbook;
  }

  async function open(
    workbook?: HysSpreadsheetWorkbook | (() => Promise<HysSpreadsheetWorkbook>),
  ) {
    if (busy.value || (workbook === undefined && !canLoad.value)) return false;
    const task = (request = new AbortController());
    busy.value = "open";
    try {
      let input = typeof workbook === "function" ? await workbook() : workbook;
      if (!input && options.persistence?.load)
        input = await options.persistence.load(task.signal);
      if (!input && options.storageKey) {
        const stored = globalThis.localStorage?.getItem(options.storageKey);
        if (!stored) throw new Error("此浏览器暂无已保存的工作簿。");
        input = JSON.parse(stored);
      }
      if (task.signal.aborted) return false;
      const loaded = readWorkbook(input);
      checkpoint.value = loaded;
      opened(loaded);
      return true;
    } catch (error) {
      if (!task.signal.aborted) failed("open", error);
      return false;
    } finally {
      if (request === task) {
        request = undefined;
        busy.value = null;
      }
    }
  }

  async function save() {
    if (!canSave.value || busy.value) return false;
    const workbook = getWorkbook();
    const task = (request = new AbortController());
    busy.value = "save";
    try {
      if (options.persistence)
        await options.persistence.save(workbook, task.signal);
      else if (options.storageKey) {
        if (!globalThis.localStorage) throw new Error("浏览器存储不可用。");
        globalThis.localStorage.setItem(
          options.storageKey,
          JSON.stringify(workbook),
        );
      }
      if (task.signal.aborted) return false;
      markSaved(workbook);
      saved(workbook);
      return true;
    } catch (error) {
      if (!task.signal.aborted) failed("save", error);
      return false;
    } finally {
      if (request === task) {
        request = undefined;
        busy.value = null;
        if (getWorkbook() !== workbook) schedule();
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    const delay = options.autosave ?? 0;
    if (
      dirty.value &&
      !busy.value &&
      canSave.value &&
      Number.isFinite(delay) &&
      delay > 0
    )
      timer = setTimeout(() => void save(), Math.min(2147483647, delay));
  }

  watch([getWorkbook, () => options.autosave, canSave], schedule);
  onBeforeUnmount(() => {
    request?.abort();
    clearTimeout(timer);
  });
  return { open, save, markSaved, dirty, busy, canLoad, canSave };
}
