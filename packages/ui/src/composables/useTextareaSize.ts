import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  watch,
  type Ref,
} from "vue";
import type { HysInputProps } from "./textInput";
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
  let previous: { height: string; overflowY: string } | undefined;
  const element = () =>
    input.value?.tagName === "TEXTAREA"
      ? (input.value as HTMLTextAreaElement)
      : undefined;
  function measure() {
    frame = undefined;
    const el = element();
    if (!live || !el) return;
    if (!props.autosize) {
      if (previous) {
        el.style.height = previous.height;
        el.style.overflowY = previous.overflowY;
        previous = undefined;
      }
      return;
    }
    if (!el.getBoundingClientRect().width) return;
    previous ??= { height: el.style.height, overflowY: el.style.overflowY };
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
    const minRows = Math.max(
      1,
      Math.min(10000, Math.floor(options.minRows || 1)),
    );
    const maxRows =
      options.maxRows && Number.isFinite(options.maxRows)
        ? Math.max(minRows, options.maxRows)
        : Infinity;
    el.style.height = "0px";
    const content = el.scrollHeight + border,
      height = Math.min(
        maxRows * line + padding + border,
        Math.max(minRows * line + padding + border, content),
      );
    el.style.height =
      (style.boxSizing === "border-box"
        ? height
        : Math.max(line, height - padding - border)) + "px";
    el.style.overflowY = content > height + 1 ? "auto" : "hidden";
  }
  async function resize() {
    await nextTick();
    if (!live || !element() || (!props.autosize && !previous)) return;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(measure);
  }
  function observe() {
    observer?.disconnect();
    observer = undefined;
    width = -1;
    window.removeEventListener("resize", resize);
    const el = element();
    if (!live || !el) return;
    if (!props.autosize) {
      void resize();
      return;
    }
    window.addEventListener("resize", resize);
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver((entries) => {
        const next = entries[0]?.contentRect.width;
        if (next !== undefined && Math.abs(next - width) > 0.5) {
          width = next;
          void resize();
        }
      });
      observer.observe(el);
    }
    void resize();
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
    window.removeEventListener("resize", resize);
  }
  watch([value, size, () => props.rows, () => props.autosize], resize, {
    deep: true,
  });
  watch(input, () => {
    previous = undefined;
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
      if (live) void resize();
    });
  });
  onActivated(activate);
  onDeactivated(cleanup);
  onBeforeUnmount(cleanup);
  return resize;
}
