import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from "vue";
import {
  virtualAligned,
  virtualFinite,
  type HysVirtualTableAlign,
  type HysVirtualTableColumn,
  type HysVirtualTableProps,
  type HysVirtualTableRange,
  type HysVirtualTableScroll,
} from "./virtualTable";
export interface VirtualColumn<T extends object> {
  token: string;
  column?: HysVirtualTableColumn<T>;
  index: number;
  width: number;
  offset: number;
  left?: number;
  right?: number;
  selection?: boolean;
  gap?: boolean;
}
const gap = <T extends object>(
  token: string,
  width: number,
): VirtualColumn<T> => ({ token, width, index: -1, offset: 0, gap: true });
export function useVirtualTableLayout<T extends object>(
  props: HysVirtualTableProps<T>,
  count: () => number,
  lastKey: () => string | undefined,
  report: {
    scroll: (state: HysVirtualTableScroll) => void;
    range: (state: HysVirtualTableRange) => void;
    end: (state: { distance: number; total: number }) => void;
  },
) {
  const viewport = ref<HTMLElement>(),
    live = ref(true);
  const rowHeight = computed(() =>
    virtualFinite(props.rowHeight, 42, 1, 10000),
  );
  const headerHeight = computed(() =>
    props.showHeader ? virtualFinite(props.headerHeight, 42, 24, 200) : 0,
  );
  const topHeight = computed(
    () => headerHeight.value + (props.fixedRows?.length ?? 0) * rowHeight.value,
  );
  const measuredWidth = ref(0),
    measuredHeight = ref(0),
    scrollTop = ref(0),
    scrollLeft = ref(0);
  const bodyHeight = computed(() =>
    Math.max(
      1,
      measuredHeight.value
        ? measuredHeight.value - topHeight.value
        : virtualFinite(props.height, 280, 1),
    ),
  );
  const width = computed(
    () => measuredWidth.value || virtualFinite(props.width, 600, 1),
  );
  const viewportStyle = computed(() => ({
    height:
      typeof props.height === "string"
        ? "calc(" + props.height + " + " + topHeight.value + "px)"
        : virtualFinite(props.height, 280, 1) + topHeight.value + "px",
  }));
  const rootStyle = computed(() => ({
    width:
      typeof props.width === "number"
        ? virtualFinite(props.width, 600, 1) + "px"
        : props.width,
  }));
  const layout = computed(() => {
    const seen = new Set<string>(),
      left: VirtualColumn<T>[] = [],
      center: VirtualColumn<T>[] = [],
      right: VirtualColumn<T>[] = [];
    const visible = props.columns.filter(
      (c) =>
        !c.hidden &&
        typeof c.key === "string" &&
        !seen.has(c.key) &&
        !!seen.add(c.key),
    );
    const ordered = [
      ...visible.filter((c) => c.fixed === true || c.fixed === "left"),
      ...visible.filter((c) => !c.fixed),
      ...visible.filter((c) => c.fixed === "right"),
    ];
    const limits = ordered.map((c) => {
      const min = virtualFinite(c.minWidth, 1, 1, 10000);
      return { min, max: virtualFinite(c.maxWidth, 10000, min, 10000) };
    });
    const widths = ordered.map((c, index) =>
      virtualFinite(c.width, 160, limits[index].min, limits[index].max),
    );
    const selectWidth = props.selectable
      ? virtualFinite(props.selectionWidth, 44, 32, 150)
      : 0;
    let remaining = props.fit
      ? width.value - widths.reduce((a, b) => a + b, selectWidth)
      : 0;
    if (remaining > 0) {
      const flexible = ordered
        .flatMap((c, index) =>
          c.fixed
            ? []
            : [{ index, capacity: limits[index].max - widths[index] }],
        )
        .sort((a, b) => a.capacity - b.capacity);
      flexible.forEach(({ index, capacity }, position) => {
        const extra = Math.min(
          capacity,
          remaining / (flexible.length - position),
        );
        widths[index] += extra;
        remaining -= extra;
      });
    }
    let offset = selectWidth;
    if (selectWidth)
      left.push({
        token: "selection",
        index: -1,
        width: selectWidth,
        offset: 0,
        left: 0,
        selection: true,
      });
    ordered.forEach((column, index) => {
      const size = widths[index];
      const cell: VirtualColumn<T> = {
        token: "column:" + column.key,
        column,
        index,
        width: size,
        offset,
      };
      if (column.fixed === "right") right.push(cell);
      else if (column.fixed) {
        cell.left = offset;
        left.push(cell);
      } else center.push(cell);
      offset += size;
    });
    let rightWidth = 0;
    for (let i = right.length - 1; i >= 0; i--) {
      right[i].right = rightWidth;
      rightWidth += right[i].width;
    }
    return {
      left,
      center,
      right,
      total: offset,
      leftWidth: left.reduce((sum, c) => sum + c.width, 0),
      rightWidth,
    };
  });
  const columns = computed(() => [
    ...layout.value.left,
    ...layout.value.center,
    ...layout.value.right,
  ]);
  const columnMap = computed(
    () =>
      new Map(
        columns.value.flatMap((c) =>
          c.column ? [[c.column.key, c] as const] : [],
        ),
      ),
  );
  const contentWidth = computed(() =>
    Math.max(layout.value.total, width.value),
  );
  const renderColumns = computed<VirtualColumn<T>[]>((previous) => {
    const { left, center, right, total, leftWidth, rightWidth } = layout.value;
    let start = 0,
      end = center.length;
    if (props.virtualColumns) {
      const from = scrollLeft.value + leftWidth,
        to = scrollLeft.value + width.value - rightWidth,
        overscan = Math.floor(virtualFinite(props.columnOverscan, 1, 0, 20));
      // Locate the visible center window without scanning every column on scroll.
      let low = 0,
        high = center.length;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (center[mid].offset + center[mid].width <= from) low = mid + 1;
        else high = mid;
      }
      start = Math.max(0, low - overscan);
      end = low;
      while (end < center.length && center[end].offset < to) end++;
      end = Math.min(center.length, end + overscan);
    }
    const before = start
      ? (center[start]?.offset ?? total - rightWidth) - leftWidth
      : 0;
    const after =
      end < center.length ? total - rightWidth - center[end].offset : 0;
    const fill = contentWidth.value - total;
    const result = [
      ...left,
      ...(before > 0 ? [gap<T>("gap:before", before)] : []),
      ...center.slice(start, end),
      ...(after + fill > 0 ? [gap<T>("gap:after", after + fill)] : []),
      ...right,
    ];
    return previous?.length === result.length &&
      result.every(
        (cell, i) =>
          cell === previous[i] ||
          (cell.gap &&
            previous[i].token === cell.token &&
            previous[i].width === cell.width),
      )
      ? previous
      : result;
  });
  const range = computed<HysVirtualTableRange>((previous) => {
    const total = count(),
      over = Math.floor(virtualFinite(props.overscan, 5, 0, 100));
    const visibleStart = Math.min(
      Math.max(0, total - 1),
      Math.floor(scrollTop.value / rowHeight.value),
    );
    const visibleEnd = Math.min(
      total - 1,
      Math.ceil((scrollTop.value + bodyHeight.value) / rowHeight.value) - 1,
    );
    const start = Math.max(0, visibleStart - over),
      end = Math.min(total - 1, visibleEnd + over);
    const columnKeys = renderColumns.value.flatMap((c) =>
      c.column ? [c.column.key] : [],
    );
    if (
      previous &&
      start === previous.start &&
      end === previous.end &&
      visibleStart === previous.visibleStart &&
      visibleEnd === previous.visibleEnd &&
      columnKeys.length === previous.columnKeys.length &&
      columnKeys.every((key, i) => key === previous.columnKeys[i])
    )
      return previous;
    return { start, end, visibleStart, visibleEnd, columnKeys };
  });
  const maxTop = computed(() =>
    Math.max(0, count() * rowHeight.value - bodyHeight.value),
  );
  const maxLeft = computed(() => Math.max(0, layout.value.total - width.value));
  let scrollFrame = 0,
    measureFrame = 0,
    observer: ResizeObserver | undefined,
    connected = false,
    pendingTop = 0,
    pendingLeft = 0,
    savedTop = 0,
    savedLeft = 0,
    lastEnd = "";
  function refreshScroll() {
    if (!live.value) return;
    const oldTop = scrollTop.value,
      oldLeft = scrollLeft.value;
    scrollTop.value = virtualFinite(pendingTop, 0, 0, maxTop.value);
    scrollLeft.value = virtualFinite(pendingLeft, 0, 0, maxLeft.value);
    if (oldTop !== scrollTop.value || oldLeft !== scrollLeft.value)
      report.scroll({
        scrollTop: scrollTop.value,
        scrollLeft: scrollLeft.value,
        direction:
          oldTop !== scrollTop.value
            ? scrollTop.value > oldTop
              ? "down"
              : "up"
            : scrollLeft.value > oldLeft
              ? "right"
              : "left",
      });
  }
  function onScroll() {
    const port = viewport.value;
    if (!live.value || !port) return;
    pendingTop = port.scrollTop;
    pendingLeft = port.scrollLeft;
    if (!scrollFrame)
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        refreshScroll();
      });
  }
  function scrollTo(options: {
    top?: number;
    left?: number;
    behavior?: ScrollBehavior;
  }) {
    const port = viewport.value;
    if (!live.value || !port) return;
    const top = virtualFinite(options.top, port.scrollTop, 0, maxTop.value),
      left = virtualFinite(options.left, port.scrollLeft, 0, maxLeft.value);
    if (options.behavior === "smooth" && port.scrollTo) {
      port.scrollTo({ top, left, behavior: "smooth" });
      return;
    }
    if (port.scrollTop !== top) port.scrollTop = top;
    if (port.scrollLeft !== left) port.scrollLeft = left;
    pendingTop = top;
    pendingLeft = left;
    refreshScroll();
  }
  function scrollToRow(index: number, align: HysVirtualTableAlign = "nearest") {
    if (!count() || !Number.isFinite(index)) return;
    const start =
      Math.min(count() - 1, Math.max(0, Math.floor(index))) * rowHeight.value;
    scrollTo({
      top: virtualAligned(
        start,
        rowHeight.value,
        viewport.value?.scrollTop ?? scrollTop.value,
        bodyHeight.value,
        align,
      ),
    });
  }
  function scrollToColumn(
    key: string,
    align: HysVirtualTableAlign = "nearest",
  ) {
    if (!live.value) return false;
    const cell = columnMap.value.get(key);
    if (!cell) return false;
    if (cell.left === undefined && cell.right === undefined) {
      const { leftWidth, rightWidth } = layout.value;
      scrollTo({
        left: virtualAligned(
          cell.offset - leftWidth,
          cell.width,
          viewport.value?.scrollLeft ?? scrollLeft.value,
          Math.max(1, width.value - leftWidth - rightWidth),
          align,
        ),
      });
    }
    return true;
  }
  function remeasure() {
    const port = viewport.value;
    if (!live.value || !port) return;
    if (port.clientWidth) measuredWidth.value = port.clientWidth;
    if (port.clientHeight) measuredHeight.value = port.clientHeight;
    scrollTo({ top: port.scrollTop, left: port.scrollLeft });
  }
  function scheduleMeasure() {
    if (live.value && !measureFrame)
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0;
        remeasure();
      });
  }
  function connect() {
    if (connected || !live.value || !viewport.value) return;
    connected = true;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleMeasure);
      observer.observe(viewport.value);
    } else window.addEventListener("resize", scheduleMeasure);
    remeasure();
  }
  function disconnect() {
    observer?.disconnect();
    observer = undefined;
    connected = false;
    window.removeEventListener("resize", scheduleMeasure);
    cancelAnimationFrame(scrollFrame);
    cancelAnimationFrame(measureFrame);
    scrollFrame = measureFrame = 0;
  }
  function checkEnd() {
    const total = count();
    if (!live.value || !total || props.loading) return;
    const distance = Math.max(0, maxTop.value - scrollTop.value);
    if (distance > virtualFinite(props.endReachedThreshold, 42, 0, 10000)) {
      lastEnd = "";
      return;
    }
    const stamp = total + ":" + lastKey();
    if (stamp !== lastEnd) {
      lastEnd = stamp;
      report.end({ distance, total });
    }
  }
  onMounted(() => {
    connect();
    checkEnd();
  });
  onActivated(() => {
    const restore = !live.value;
    live.value = true;
    connect();
    if (restore)
      void nextTick(() => {
        scrollTo({ top: savedTop, left: savedLeft });
        checkEnd();
      });
  });
  onDeactivated(() => {
    savedTop = pendingTop;
    savedLeft = pendingLeft;
    live.value = false;
    disconnect();
  });
  onBeforeUnmount(() => {
    live.value = false;
    disconnect();
  });
  watch([maxTop, maxLeft, topHeight, () => props.height], scheduleMeasure, {
    flush: "post",
  });
  watch(
    range,
    (value) => {
      if (live.value)
        report.range({ ...value, columnKeys: [...value.columnKeys] });
    },
    { flush: "post", immediate: true },
  );
  watch(
    [
      scrollTop,
      maxTop,
      count,
      () => props.loading,
      () => props.endReachedThreshold,
    ],
    checkEnd,
    { flush: "post" },
  );
  return {
    viewport,
    live,
    rowHeight,
    headerHeight,
    topHeight,
    bodyHeight,
    rootStyle,
    viewportStyle,
    columns,
    columnMap,
    renderColumns,
    contentWidth,
    scrollTop,
    scrollLeft,
    range,
    scrollTo,
    scrollToRow,
    scrollToColumn,
    onScroll,
    remeasure,
  };
}
export function virtualColumnStyle<T extends object>(
  cell: VirtualColumn<T>,
): CSSProperties {
  return {
    width: cell.width + "px",
    flex: "0 0 " + cell.width + "px",
    ...(cell.left !== undefined
      ? { position: "sticky", left: cell.left + "px" }
      : cell.right !== undefined
        ? { position: "sticky", right: cell.right + "px" }
        : {}),
  };
}
