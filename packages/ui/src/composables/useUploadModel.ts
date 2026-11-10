import { computed, shallowRef, toRaw, nextTick } from "vue";
import type {
  HysUploadProps,
  HysUploadItem,
  HysUploadChangeType,
} from "./upload";
const same = (a: unknown, b: unknown) => Object.is(toRaw(a), toRaw(b));
function normalized<T extends HysUploadItem>(items: readonly T[]) {
  const keys = new Set<string>();
  return items.filter(
    (item) =>
      item &&
      typeof item.uid === "string" &&
      item.uid &&
      typeof item.name === "string" &&
      !keys.has(item.uid) &&
      !!keys.add(item.uid),
  );
}
export function useUploadModel<T extends HysUploadItem>(
  props: HysUploadProps<T>,
  emit: (name: string, ...args: any[]) => void,
  live: () => boolean,
) {
  const initial = () =>
    normalized(props.defaultFileList ?? props.defaultValue ?? []).map(
      (file) => ({ ...file }),
    );
  const local = shallowRef<T[]>(initial()),
    supplied = computed(() => props.fileList ?? props.modelValue),
    controlled = computed(() => supplied.value !== undefined);
  const files = computed(() => normalized(supplied.value ?? local.value));
  let epoch = 0,
    tail: Promise<unknown> = Promise.resolve();
  type Options = {
    force?: boolean;
    allowInactive?: boolean;
    guard?: () => boolean;
    accepted?: () => void;
  };
  async function commit(
    change: (current: readonly T[]) => T[] | undefined,
    type: HysUploadChangeType,
    options: Options = {},
  ) {
    const token = epoch;
    const run = async () => {
      if (
        token !== epoch ||
        (!options.allowInactive && !live()) ||
        options.guard?.() === false
      )
        return false;
      const before = files.value,
        next = change(before);
      if (!next) return false;
      const nextList = normalized(next),
        old = new Map(before.map((f) => [f.uid, f])),
        wanted = new Map(nextList.map((f) => [f.uid, f]));
      const removed = before.filter((f) => !wanted.has(f.uid));
      const changed = nextList
        .map((file) => ({
          file,
          keys: Object.keys(file).filter(
            (key) =>
              !old.has(file.uid) ||
              !same((old.get(file.uid) as any)[key], (file as any)[key]),
          ),
        }))
        .filter((f) => f.keys.length);
      if (!options.force && !removed.length && !changed.length) return false;
      if (!controlled.value) local.value = nextList;
      emit("update:fileList", nextList);
      emit("update:modelValue", nextList);
      if (controlled.value) await nextTick();
      if (
        token !== epoch ||
        (!options.allowInactive && !live()) ||
        options.guard?.() === false
      )
        return false;
      const actual = files.value,
        map = new Map(actual.map((f) => [f.uid, f]));
      if (
        removed.some((f) => map.has(f.uid)) ||
        changed.some(
          ({ file, keys }) =>
            !map.has(file.uid) ||
            keys.some(
              (key) =>
                !same((map.get(file.uid) as any)[key], (file as any)[key]),
            ),
        )
      )
        return false;
      options.accepted?.();
      emit("change", [...actual]);
      emit("fileChange", {
        type,
        files: [...actual],
        changed: changed.map((f) => map.get(f.file.uid)!).filter(Boolean),
      });
      return true;
    };
    if (!controlled.value) return run();
    const task = tail.then(run, run);
    tail = task.catch(() => {});
    return task;
  }
  function cancel() {
    epoch++;
  }
  function resetLocal() {
    cancel();
    if (!controlled.value) local.value = initial();
  }
  function interrupt(keys: ReadonlySet<string>) {
    const next = files.value.map((file) =>
      keys.has(file.uid) && file.status === "uploading"
        ? { ...file, status: "ready" as const, percentage: 0 }
        : file,
    );
    if (next.every((file, index) => file === files.value[index])) return;
    if (!controlled.value) local.value = next;
    emit("update:fileList", next);
    emit("update:modelValue", next);
    if (!controlled.value) {
      emit("change", [...next]);
      emit("fileChange", {
        type: "abort",
        files: next,
        changed: next.filter((file) => keys.has(file.uid)),
      });
    }
  }
  return { files, controlled, commit, cancel, resetLocal, interrupt };
}
