import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
  type Ref,
} from "vue";

/** Cache section geometry on layout changes; scrolling only searches the cached positions. */
export function useDocToc(
  article: Ref<HTMLElement | undefined>,
  toc: Ref<HTMLElement | undefined>,
  ids: () => string[],
) {
  const current = ref(ids()[0] ?? "");
  let live = false,
    frame = 0,
    dirty = true,
    offset = 104;
  let positions: { id: string; top: number }[] = [],
    observer: ResizeObserver | undefined;
  function sectionTop(element: HTMLElement) {
    let top = 0;
    for (
      let node: HTMLElement | null = element;
      node;
      node = node.offsetParent as HTMLElement | null
    )
      top += node.offsetTop;
    return top;
  }
  function keepVisible() {
    const list = toc.value;
    if (!live || !list?.clientHeight) return;
    const link = [...list.querySelectorAll<HTMLAnchorElement>("a")].find(
      (el) => el.getAttribute("href") === "#" + current.value,
    );
    if (!link) return;
    const item = link.getBoundingClientRect(),
      bounds = list.getBoundingClientRect();
    if (item.top < bounds.top + 5) list.scrollTop += item.top - bounds.top - 5;
    else if (item.bottom > bounds.bottom - 5)
      list.scrollTop += item.bottom - bounds.bottom + 5;
  }
  function update() {
    frame = 0;
    const root = article.value;
    if (!live || !root?.isConnected) return;
    if (dirty) {
      const elements = new Map(
        [...root.querySelectorAll<HTMLElement>("section[id]")].map((el) => [
          el.id,
          el,
        ]),
      );
      positions = ids()
        .flatMap((id) => {
          const el = elements.get(id);
          return el ? [{ id, top: sectionTop(el) }] : [];
        })
        .sort((a, b) => a.top - b.top);
      offset = Math.max(
        104,
        (document.querySelector(".docs-topbar")?.getBoundingClientRect()
          .height ?? 74) + 24,
      );
      dirty = false;
    }
    if (!positions.length) return;
    let left = 0,
      right = positions.length,
      point = window.scrollY + offset;
    while (left < right) {
      const middle = (left + right) >> 1;
      if (positions[middle].top <= point) left = middle + 1;
      else right = middle;
    }
    let index = Math.max(0, left - 1);
    if (
      window.scrollY > 0 &&
      window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 3
    )
      index = positions.length - 1;
    if (current.value !== positions[index].id) {
      current.value = positions[index].id;
      void nextTick(keepVisible);
    }
  }
  function schedule() {
    if (live && !frame) frame = requestAnimationFrame(update);
  }
  function refresh() {
    dirty = true;
    schedule();
  }
  function attach() {
    if (live) return;
    live = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", refresh, { passive: true });
    observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(refresh);
    if (article.value) {
      observer?.observe(article.value);
      for (const section of article.value.querySelectorAll("section[id]"))
        observer?.observe(section);
    }
    refresh();
    void nextTick(keepVisible);
  }
  function detach() {
    live = false;
    cancelAnimationFrame(frame);
    frame = 0;
    observer?.disconnect();
    observer = undefined;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", refresh);
  }
  watch(toc, () => void nextTick(keepVisible), { flush: "post" });
  onMounted(attach);
  onActivated(() => void nextTick(attach));
  onDeactivated(detach);
  onBeforeUnmount(detach);
  return {
    current,
    refresh,
    select(id: string) {
      current.value = id;
      void nextTick(keepVisible);
    },
  };
}
