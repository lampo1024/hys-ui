import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  shallowRef,
  watch,
  type Ref,
} from "vue";
import type { HysInputProps, HysTextareaStyle } from "./textInput";
export function useTextareaSize(
  input: Ref<HTMLInputElement | HTMLTextAreaElement | undefined>,
  props: HysInputProps,
  size: Ref<string>,
  value: Ref<string>,
) {
  let live = true,
    frame: number | undefined,
    observer: ResizeObserver | undefined,
    width = -1;
  const textareaStyle = shallowRef<HysTextareaStyle>({});
  const element = () =>
    input.value?.tagName === "TEXTAREA"
      ? (input.value as HTMLTextAreaElement)
      : undefined;
  function measure() {
    const el = element();
    if (!live || !el) return;
    if (!props.autosize) {
      if (textareaStyle.value.height) textareaStyle.value = {};
      return;
    }
    if (!el.getBoundingClientRect().width) return;
    const originalHeight = el.style.height;
    const originalOverflow = el.style.overflowY;
    const options = typeof props.autosize === "object" ? props.autosize : {};
    const style = getComputedStyle(el),
      line =
        parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5 || 21;
    const padding =
      (parseFloat(style.paddingTop) || 0) +
      (parseFloat(style.paddingBottom) || 0);
    const border =
      (parseFloat(style.borderTopWidth) || 0) +
      (parseFloat(style.borderBottomWidth) || 0);
    const minRows = Number.isFinite(options.minRows)
      ? Math.max(1, Math.min(10000, Math.floor(options.minRows!)))
      : 1;
    const maxRows = Number.isFinite(options.maxRows)
      ? Math.max(minRows, Math.min(10000, Math.floor(options.maxRows!)))
      : Infinity;
    el.style.height = "0px";
    el.style.overflowY = "hidden";
    const content = el.scrollHeight + border,
      height = Math.min(
        maxRows * line + padding + border,
        Math.max(minRows * line + padding + border, content),
      );
    el.style.height = originalHeight;
    el.style.overflowY = originalOverflow;
    const nextHeight =
      (style.boxSizing === "border-box"
        ? height
        : Math.max(line, height - padding - border)) + "px";
    const overflowY = content > height + 1 ? "auto" : "hidden";
    if (
      textareaStyle.value.height !== nextHeight ||
      textareaStyle.value.overflowY !== overflowY
    )
      textareaStyle.value = { height: nextHeight, overflowY };
  }
  async function resize() {
    await nextTick();
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    measure();
    await nextTick();
  }
  async function scheduleResize() {
    await nextTick();
    if (!live || !element() || frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      measure();
    });
  }
  function observe() {
    observer?.disconnect();
    observer = undefined;
    width = -1;
    window.removeEventListener("resize", scheduleResize);
    const el = element();
    if (!live || !el) return;
    if (!props.autosize) {
      textareaStyle.value = {};
      return;
    }
    window.addEventListener("resize", scheduleResize);
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver((entries) => {
        const next = entries[0]?.contentRect.width;
        if (next !== undefined && Math.abs(next - width) > 0.5) {
          width = next;
          void scheduleResize();
        }
      });
      observer.observe(el);
    }
    void scheduleResize();
  }
  function activate() {
    live = true;
    void nextTick(observe);
  }
  function cleanup() {
    live = false;
    observer?.disconnect();
    observer = undefined;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    window.removeEventListener("resize", scheduleResize);
  }
  watch(
    [
      value,
      size,
      () => props.rows,
      () => props.autosize,
      () => props.inputStyle,
      () => props.inputProps?.style,
    ],
    scheduleResize,
    {
      deep: true,
    },
  );
  watch(input, () => {
    textareaStyle.value = {};
    void nextTick(observe);
  });
  watch(
    () => props.autosize,
    () => {
      void nextTick(observe);
    },
    { deep: true },
  );
  onMounted(() => {
    activate();
    void document.fonts?.ready.then(() => {
      if (live) void scheduleResize();
    });
  });
  onActivated(activate);
  onDeactivated(cleanup);
  onBeforeUnmount(cleanup);
  return { resize, textareaStyle };
}
