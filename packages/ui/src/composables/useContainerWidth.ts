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

export function useContainerWidth(element: Ref<HTMLElement | undefined>) {
  const width = ref(0);
  let observer: ResizeObserver | undefined;
  let active = true;
  const measure = () => {
    if (element.value)
      width.value =
        element.value.clientWidth ||
        element.value.getBoundingClientRect().width;
  };
  function stop() {
    observer?.disconnect();
    observer = undefined;
    if (typeof window !== "undefined")
      window.removeEventListener("resize", measure);
  }
  function start() {
    stop();
    if (!active || !element.value) return;
    measure();
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(element.value);
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", measure);
    }
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
