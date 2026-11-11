import { computed, ref, watch, type Ref } from "vue";
import type { HysMentionProps } from "./mention";
import type { MentionEntry } from "./useMentionOptions";

type ListRow =
  | { key: string; group: string }
  | { key: string; entry: MentionEntry; index: number };

export function useMentionList(
  props: HysMentionProps,
  choices: Readonly<Ref<readonly MentionEntry[]>>,
  element: Readonly<Ref<HTMLElement | undefined>>,
  loadMore: () => Promise<boolean>,
) {
  const rows = computed<ListRow[]>(() => {
    const groups = new Map<string, MentionEntry[]>();
    for (const entry of choices.value) {
      const group = entry.option.group ?? "";
      const items = groups.get(group);
      if (items) items.push(entry);
      else groups.set(group, [entry]);
    }
    let index = 0;
    return [...groups].flatMap(([group, entries]) => [
      ...(group ? [{ key: "group:" + group, group }] : []),
      ...entries.map((entry) => ({ key: entry.key, entry, index: index++ })),
    ]);
  });
  const enabled = computed(() =>
    rows.value.flatMap((row) =>
      "entry" in row && !row.entry.user.disabled ? [row.entry] : [],
    ),
  );
  const scrollTop = ref(0);
  const viewportHeight = ref(240);
  const rowHeight = computed(() =>
    props.itemHeight && Number.isFinite(props.itemHeight)
      ? Math.max(20, props.itemHeight)
      : 44,
  );
  const overscan = computed(() =>
    props.overscan !== undefined && Number.isFinite(props.overscan)
      ? Math.max(0, Math.floor(props.overscan))
      : 4,
  );
  const start = computed(() =>
    props.virtual
      ? Math.max(
          0,
          Math.floor(scrollTop.value / rowHeight.value) - overscan.value,
        )
      : 0,
  );
  const end = computed(() =>
    props.virtual
      ? Math.ceil((scrollTop.value + viewportHeight.value) / rowHeight.value) +
        overscan.value
      : rows.value.length,
  );
  const visibleRows = computed(() => rows.value.slice(start.value, end.value));
  const topSpacer = computed(() =>
    props.virtual ? start.value * rowHeight.value : 0,
  );
  const bottomSpacer = computed(() =>
    props.virtual
      ? Math.max(0, rows.value.length - end.value) * rowHeight.value
      : 0,
  );
  function onScroll() {
    const list = element.value;
    if (!list) return;
    scrollTop.value = list.scrollTop;
    if (
      list.scrollHeight > list.clientHeight &&
      list.scrollHeight - list.scrollTop - list.clientHeight <= rowHeight.value
    )
      void loadMore();
  }
  function reset() {
    scrollTop.value = 0;
    if (element.value) element.value.scrollTop = 0;
  }
  watch(
    element,
    (list, _previous, cleanup) => {
      if (!list) return;
      const measure = () => {
        viewportHeight.value = list.clientHeight || 240;
      };
      measure();
      const observer =
        typeof ResizeObserver === "undefined"
          ? undefined
          : new ResizeObserver(measure);
      observer?.observe(list);
      cleanup(() => observer?.disconnect());
    },
    { flush: "post" },
  );
  function ensureVisible(key: string) {
    const list = element.value;
    if (!list) return;
    if (!props.virtual) {
      list
        .querySelector<HTMLElement>('[data-active="true"]')
        ?.scrollIntoView({ block: "nearest" });
      return;
    }
    const index = rows.value.findIndex((row) => row.key === key);
    if (index < 0) return;
    const top = index * rowHeight.value;
    const height = list.clientHeight || viewportHeight.value;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + rowHeight.value > list.scrollTop + height)
      list.scrollTop = top + rowHeight.value - height;
    scrollTop.value = list.scrollTop;
  }
  return {
    rows,
    enabled,
    visibleRows,
    topSpacer,
    bottomSpacer,
    rowHeight,
    onScroll,
    reset,
    ensureVisible,
  };
}
