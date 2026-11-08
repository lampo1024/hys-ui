import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
  type Ref,
} from "vue";

export type HysFormBreakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type HysFormGridValue =
  number | Partial<Record<HysFormBreakpoint, number>>;
export interface HysFormColSize {
  span?: number;
  offset?: number;
}
export type HysFormCol = HysFormColSize &
  Partial<Record<HysFormBreakpoint, number | HysFormColSize>>;
const breakpoints: readonly [HysFormBreakpoint, number][] = [
  ["xs", 0],
  ["sm", 576],
  ["md", 768],
  ["lg", 992],
  ["xl", 1200],
  ["xxl", 1600],
];
export function resolveFormGrid(
  value: HysFormGridValue | undefined,
  width: number,
  fallback = 1,
) {
  let result = typeof value === "number" ? value : fallback;
  if (value && typeof value === "object")
    for (const [name, min] of breakpoints)
      if (width >= min && value[name] !== undefined) result = value[name]!;
  return Math.max(1, Math.min(24, Math.floor(Number(result) || fallback)));
}
export function resolveFormCol(
  value: HysFormCol | undefined,
  width: number,
): HysFormColSize | undefined {
  if (!value) return;
  let result: HysFormColSize = { span: value.span, offset: value.offset };
  for (const [name, min] of breakpoints)
    if (width >= min && value[name] !== undefined) {
      const next = value[name]!;
      result = {
        ...result,
        ...(typeof next === "number" ? { span: next } : next),
      };
    }
  return {
    span: Math.max(0, Math.min(24, Math.floor(result.span ?? 24))),
    offset: Math.max(0, Math.min(23, Math.floor(result.offset ?? 0))),
  };
}
// Container width, rather than the viewport, also works in dialogs and sidebars.
export function useFormWidth(element: Ref<HTMLElement | undefined>) {
  const width = ref(0);
  let observer: ResizeObserver | undefined,
    active = true;
  const measure = () => {
    if (element.value)
      width.value =
        element.value.clientWidth ||
        element.value.getBoundingClientRect().width;
  };
  function start() {
    stop();
    if (!active || !element.value) return;
    measure();
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(element.value);
    } else if (typeof window !== "undefined")
      window.addEventListener("resize", measure);
  }
  function stop() {
    observer?.disconnect();
    observer = undefined;
    if (typeof window !== "undefined")
      window.removeEventListener("resize", measure);
  }
  watch(element, start);
  onMounted(start);
  onActivated(() => {
    active = true;
    start();
  });
  onDeactivated(() => {
    active = false;
    stop();
  });
  onBeforeUnmount(() => {
    active = false;
    stop();
  });
  return computed(() => width.value);
}
