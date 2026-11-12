import { onBeforeUnmount, reactive } from "vue";

interface Disclosure {
  pinned: boolean;
  preview: boolean;
  focused: boolean;
  suppressHover: boolean;
}
export function useToastStackDisclosure() {
  const stacks = reactive(new Map<string, Disclosure>());
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  function cancel(key: string) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }
  function schedule(key: string, callback: () => void, delay: number) {
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        callback();
      }, delay),
    );
  }
  function state(key: string) {
    if (!stacks.has(key))
      stacks.set(key, {
        pinned: false,
        preview: false,
        focused: false,
        suppressHover: false,
      });
    return stacks.get(key)!;
  }
  function enter(key: string, event: PointerEvent) {
    if (event.pointerType === "touch") return;
    const current = state(key);
    cancel(key);
    if (!current.suppressHover)
      schedule(
        key,
        () => {
          current.preview = true;
        },
        110,
      );
  }
  function leave(key: string) {
    const current = stacks.get(key);
    if (!current) return;
    cancel(key);
    current.suppressHover = false;
    schedule(
      key,
      () => {
        current.preview = false;
      },
      140,
    );
  }
  function toggle(key: string) {
    const current = state(key);
    if (!current.pinned) {
      current.pinned = true;
      return;
    }
    cancel(key);
    current.pinned = current.preview = current.focused = false;
    current.suppressHover = true;
  }
  function focusIn(key: string) {
    const current = stacks.get(key);
    if (current && (current.pinned || current.preview)) current.focused = true;
  }
  function focusOut(key: string, event: FocusEvent) {
    const current = stacks.get(key);
    if (
      current &&
      !(event.currentTarget as HTMLElement).contains(
        event.relatedTarget as Node,
      )
    )
      current.focused = false;
  }
  function retain(keys: Iterable<string>) {
    const active = new Set(keys);
    for (const key of stacks.keys()) {
      if (active.has(key)) continue;
      cancel(key);
      stacks.delete(key);
    }
  }
  onBeforeUnmount(() => retain([]));
  return { stacks, enter, leave, toggle, focusIn, focusOut, retain };
}
