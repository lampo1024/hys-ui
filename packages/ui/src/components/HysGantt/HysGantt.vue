<script setup lang="ts">
import { useHysRootAttrs } from "../../config";
const hysRootAttrs = useHysRootAttrs();

import {
  computed,
  ref,
  shallowRef,
  watch,
  nextTick,
  onMounted,
  onActivated,
  onDeactivated,
  onBeforeUnmount,
} from "vue";
import HysSegmented from "../HysSegmented/HysSegmented.vue";
import HysButton from "../HysButton/HysButton.vue";
import HysInput from "../HysInput/HysInput.vue";
import type {
  HysGanttScrollOptions,
  HysGanttDependencyChange,
  HysGanttDependencyInvalid,
  HysGanttDependencyMove,
} from "../../composables/gantt";
import {
  useGanttDependencies,
  ganttDependencyPath,
  ganttDependencyPickPath,
} from "../../composables/useGanttDependencies";
import {
  Trash2,
  X,
  Check,
  GitBranch,
  LocateFixed,
  CornerDownRight,
  Search,
} from "lucide-vue-next";
import { useGanttLabelResize } from "../../composables/useGanttLabelResize";
import {
  useFloating,
  type FloatingAnchor,
} from "../../composables/useFloating";
export interface GanttItem {
  id: string | number;
  title: string;
  start: string;
  end: string;
  progress?: number;
  owner?: string;
  status?: string;
  dependencies?: Array<string | number>;
  color?: string;
  disabled?: boolean;
}
type Scale = "day" | "week" | "month";
const props = withDefaults(
  defineProps<{
    items: GanttItem[];
    modelValue?: string | number | null;
    scale?: Scale;
    editable?: boolean;
    rowHeight?: number;
    labelWidth?: number;
    labelResizable?: boolean;
    minLabelWidth?: number;
    maxLabelWidth?: number;
    fitContainer?: boolean;
    height?: number | string;
    maxHeight?: number | string | false;
    virtual?: boolean;
    overscan?: number;
    dependencyEditable?: boolean;
    showDependencies?: boolean;
  }>(),
  {
    scale: "day",
    editable: false,
    rowHeight: 46,
    labelWidth: 270,
    labelResizable: true,
    minLabelWidth: 120,
    maxLabelWidth: 600,
    fitContainer: true,
    maxHeight: undefined,
    virtual: false,
    overscan: 6,
    dependencyEditable: undefined,
    showDependencies: true,
  },
);
const emit = defineEmits<{
  "update:modelValue": [id: string | number | null];
  "update:scale": [value: Scale];
  scaleChange: [value: Scale];
  "update:items": [items: GanttItem[]];
  change: [item: GanttItem];
  open: [item: GanttItem];
  dependencyAdd: [info: HysGanttDependencyChange, item: GanttItem];
  dependencyRemove: [info: HysGanttDependencyChange, item: GanttItem];
  dependencyInvalid: [info: HysGanttDependencyInvalid];
  dependencyMove: [
    info: HysGanttDependencyMove,
    item: GanttItem,
    previousItem: GanttItem,
  ];
  "update:labelWidth": [width: number];
  labelResize: [width: number];
}>();
const currentScale = ref<Scale>(props.scale);
watch(
  () => props.scale,
  (v) => (currentScale.value = v),
);
const selected = ref<string | number | null>(props.modelValue ?? null);
watch(
  () => props.modelValue,
  (v) => (selected.value = v ?? null),
);
const root = ref<HTMLElement>(),
  scroller = ref<HTMLElement | null>(null),
  labels = ref<HTMLElement | null>(null),
  measuredLabelWidth = ref(0);
const grid = ref<HTMLElement | null>(null);
const today = new Date();
today.setHours(0, 0, 0, 0);
function cssLength(value: number | string | undefined) {
  return typeof value === "number"
    ? Number.isFinite(value) && value >= 0
      ? value + "px"
      : undefined
    : typeof value === "string" && value.trim()
      ? value
      : undefined;
}
const viewportStyle = computed(() => ({
  height: cssLength(props.height),
  maxHeight:
    props.maxHeight === false ||
    (props.height !== undefined && props.maxHeight === undefined)
      ? "none"
      : cssLength(
          props.maxHeight ?? (props.height === undefined ? 620 : undefined),
        ),
  scrollPaddingInlineStart: measuredLabelWidth.value + "px",
}));
const DAY = 86400000;
function parseDate(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
    ? date
    : null;
}
function atDay(d: Date) {
  return Math.round(
    (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) -
      Date.UTC(1970, 0, 1)) /
      DAY,
  );
}
function dateFromDay(n: number) {
  return new Date(n * DAY);
}
function formatDay(n: number) {
  return dateFromDay(n).toISOString().slice(0, 10);
}
const rowSize = computed(() =>
  Number.isFinite(props.rowHeight) && props.rowHeight > 0
    ? props.rowHeight
    : 46,
);
const normalized = computed(() => {
  const dates = new Map<string, number | null>();
  const day = (value: string) => {
    if (!dates.has(value)) {
      const date = parseDate(value);
      dates.set(value, date ? atDay(date) : null);
    }
    return dates.get(value)!;
  };
  return props.items
    .map((item) => {
      const start = day(item.start),
        end = day(item.end);
      if (start === null || end === null || end < start) return null;
      return {
        ...item,
        s: start,
        e: end,
        progress: Math.min(100, Math.max(0, item.progress ?? 0)),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
});
const completedCount = computed(
  () => normalized.value.filter((item) => item.status === "已完成").length,
);
const viewportHeight = ref(620),
  virtualTop = ref(0);
const windowRange = computed(() => {
  const length = normalized.value.length;
  if (!props.virtual) return { start: 0, end: length };
  const buffer = Number.isFinite(props.overscan)
    ? Math.max(0, Math.min(100, Math.floor(props.overscan)))
    : 6;
  const first = Math.min(
    Math.max(0, length - 1),
    Math.max(0, Math.floor(virtualTop.value / rowSize.value)),
  );
  return {
    start: Math.max(0, first - buffer),
    end: Math.min(
      length,
      first +
        Math.ceil(
          Math.max(rowSize.value, viewportHeight.value - 66) / rowSize.value,
        ) +
        buffer +
        1,
    ),
  };
});
const visibleRows = computed(() =>
  normalized.value
    .slice(windowRange.value.start, windowRange.value.end)
    .map((task, index) => ({ task, index: index + windowRange.value.start })),
);
const baseUnitWidth = computed(() =>
  currentScale.value === "day"
    ? 36
    : currentScale.value === "week"
      ? 17
      : currentScale.value === "month"
        ? 7
        : 36,
);
const bounds = computed(() => {
  const base = atDay(today);
  let start = base - 7,
    end = base + 21;
  for (const task of normalized.value) {
    start = Math.min(start, task.s);
    end = Math.max(end, task.e);
  }
  return { start: start - 7, end: end + 14 };
});
const totalDays = computed(() => bounds.value.end - bounds.value.start + 1);
const viewportWidth = ref(0);
const unitWidth = computed(() =>
  Math.max(
    baseUnitWidth.value,
    props.fitContainer ? viewportWidth.value / totalDays.value : 0,
  ),
);
const width = computed(() =>
  Math.max(
    totalDays.value * unitWidth.value,
    props.fitContainer ? viewportWidth.value : 0,
  ),
);
let resizeObserver: ResizeObserver | undefined;
let active = true;
const containerWidth = ref(0);
const labelResize = useGanttLabelResize({
  width: () => props.labelWidth,
  min: () => props.minLabelWidth,
  max: () => props.maxLabelWidth,
  enabled: () => props.labelResizable,
  available: containerWidth,
  live: () => active,
  start: () => {
    cancelDrag();
    links.cancel();
  },
  update: (width) => emit("update:labelWidth", width),
  commit: (width) => emit("labelResize", width),
});
let restoring = false,
  activation = 0,
  scrollFrame: number | undefined,
  restoreFrame: number | undefined,
  scrollPosition = { top: 0, left: 0 };
function syncVirtual() {
  scrollFrame = undefined;
  if (active && props.virtual)
    virtualTop.value =
      Math.floor(scrollPosition.top / rowSize.value) * rowSize.value;
}
watch(
  [() => props.virtual, rowSize],
  () => {
    virtualTop.value =
      Math.floor(
        (scroller.value?.scrollTop ?? scrollPosition.top) / rowSize.value,
      ) * rowSize.value;
  },
  { flush: "sync" },
);
function rememberScroll() {
  const el = scroller.value;
  if (!active || restoring || !el?.isConnected) return;
  const moved = scrollPosition.top !== el.scrollTop;
  const movedHorizontally = scrollPosition.left !== el.scrollLeft;
  scrollPosition = { top: el.scrollTop, left: el.scrollLeft };
  if (moved || movedHorizontally) picker.close();
  if (props.virtual && moved && scrollFrame === undefined)
    scrollFrame = requestAnimationFrame(syncVirtual);
}
function cancelScrollFrames() {
  if (scrollFrame !== undefined) cancelAnimationFrame(scrollFrame);
  if (restoreFrame !== undefined) cancelAnimationFrame(restoreFrame);
  scrollFrame = restoreFrame = undefined;
}
function measure() {
  if (!active) return;
  containerWidth.value = scroller.value?.clientWidth || 0;
  measuredLabelWidth.value =
    labels.value?.offsetWidth || labelResize.width.value;
  viewportHeight.value = scroller.value?.clientHeight || 620;
  viewportWidth.value = Math.max(
    0,
    (scroller.value?.clientWidth || 0) - measuredLabelWidth.value,
  );
}
function stopObserving() {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  window.removeEventListener("resize", measure);
}
function observe() {
  stopObserving();
  if (!active || !scroller.value) return;
  measure();
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(scroller.value);
    if (labels.value) resizeObserver.observe(labels.value);
  } else window.addEventListener("resize", measure);
}
onMounted(observe);
onActivated(async () => {
  const ticket = ++activation;
  active = true;
  restoring = true;
  await nextTick();
  if (!active || ticket !== activation) return;
  observe();
  await nextTick();
  if (!active || ticket !== activation || !scroller.value) return;
  scroller.value.scrollTop = scrollPosition.top;
  scroller.value.scrollLeft = scrollPosition.left;
  virtualTop.value = scroller.value.scrollTop;
  restoreFrame = requestAnimationFrame(() => {
    restoreFrame = undefined;
    if (active && ticket === activation) {
      restoring = false;
      rememberScroll();
    }
  });
});
onDeactivated(() => {
  active = false;
  restoring = true;
  activation++;
  cancelScrollFrames();
  stopObserving();
  cancelDrag();
});
onBeforeUnmount(() => {
  active = false;
  activation++;
  cancelScrollFrames();
  stopObserving();
  cancelDrag();
});
function changeScale(value: string) {
  if (!["day", "week", "month"].includes(value) || value === currentScale.value)
    return;
  links.cancel();
  cancelDrag();
  currentScale.value = value as Scale;
  emit("update:scale", value as Scale);
  emit("scaleChange", value as Scale);
}
const days = computed(() =>
  Array.from({ length: totalDays.value }, (_, i) => bounds.value.start + i),
);
const months = computed(() => {
  const arr: { key: string; label: string; left: number; width: number }[] = [];
  for (let i = 0; i < days.value.length; i++) {
    const d = dateFromDay(days.value[i]);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const last = arr[arr.length - 1];
    if (last?.key === key) last.width += unitWidth.value;
    else
      arr.push({
        key,
        label: `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月`,
        left: i * unitWidth.value,
        width: unitWidth.value,
      });
  }
  return arr;
});
const positions = computed(
  () =>
    new Map(
      normalized.value.map((t, i) => [
        t.id,
        {
          x: (t.s - bounds.value.start) * unitWidth.value,
          w: (t.e - t.s + 1) * unitWidth.value,
          y: i * rowSize.value + rowSize.value / 2,
          index: i,
        },
      ]),
    ),
);
const allEdges = computed(() =>
  normalized.value.flatMap((t) =>
    [...new Set(t.dependencies ?? [])].flatMap((id) => {
      const from = positions.value.get(id),
        to = positions.value.get(t.id);
      if (!from || !to || id === t.id) return [];
      return [
        {
          id: JSON.stringify([id, t.id]),
          sourceId: id,
          sourceTitle: normalized.value[from.index].title,
          targetId: t.id,
          targetTitle: t.title,
          first: Math.min(from.index, to.index),
          last: Math.max(from.index, to.index),
          endpoint: { x: to.x - 9, y: to.y },
          editable: !t.disabled && !normalized.value[from.index]?.disabled,
          removable: !t.disabled,
          path: ganttDependencyPath(from, to, rowSize.value),
          pickPath: ganttDependencyPickPath(from, to, rowSize.value),
        },
      ];
    }),
  ),
);
const edges = computed(() =>
  props.virtual
    ? allEdges.value.filter(
        (edge) =>
          edge.last >= windowRange.value.start &&
          edge.first < windowRange.value.end,
      )
    : allEdges.value,
);
const incomingGroups = computed(() => {
  const groups = new Map<string | number, typeof allEdges.value>();
  for (const edge of allEdges.value) {
    const group = groups.get(edge.targetId);
    if (group) group.push(edge);
    else groups.set(edge.targetId, [edge]);
  }
  return groups;
});
const incomingEndpoints = computed(() =>
  [...incomingGroups.value].flatMap(([id, group]) => {
    const position = positions.value.get(id);
    return group.length > 1 &&
      position &&
      position.index >= windowRange.value.start &&
      position.index < windowRange.value.end
      ? [
          {
            id,
            title: group[0].targetTitle,
            count: group.length,
            x: position.x - 38,
            y: position.y,
          },
        ]
      : [];
  }),
);
const dependencyEnabled = computed(
  () => props.dependencyEditable ?? props.editable,
);
const links = useGanttDependencies<GanttItem>({
  items: () => props.items,
  rows: () => normalized.value,
  enabled: dependencyEnabled,
  live: () => active,
  root,
  viewport: scroller,
  grid,
  labelWidth: () => measuredLabelWidth.value,
  rowHeight: () => rowSize.value,
  position: (id) => positions.value.get(id),
  locate: scrollToTask,
  cancelTask: cancelDrag,
  update: (items) => emit("update:items", items),
  change: (item) => emit("change", item),
  added: (info, item) => emit("dependencyAdd", info, item),
  removed: (info, item) => emit("dependencyRemove", info, item),
  moved: (info, item, previousItem) =>
    emit("dependencyMove", info, item, previousItem),
  invalid: (info) => emit("dependencyInvalid", info),
});
const activeEdge = computed(() => {
  const current = links.selected.value;
  return current
    ? incomingGroups.value
        .get(current.targetId)
        ?.find((edge) => edge.sourceId === current.sourceId)
    : undefined;
});
const pickerAnchor = shallowRef<FloatingAnchor>(),
  pickerPanel = ref<HTMLElement>(),
  pickerTarget = ref<string | number>(),
  pickerQuery = ref(""),
  pickerBusy = ref<string>(),
  pickerNotice = ref("");
const picker = useFloating(pickerAnchor, pickerPanel, {
  placement: "bottom-start",
  gap: 8,
  width: () => 380,
});
const pickerEdges = computed(() =>
  pickerTarget.value === undefined
    ? []
    : (incomingGroups.value.get(pickerTarget.value) ?? []),
);
const filteredPickerEdges = computed(() => {
  const query = pickerQuery.value.trim().toLocaleLowerCase();
  return query
    ? pickerEdges.value.filter((edge) =>
        (edge.sourceTitle + " " + edge.sourceId)
          .toLocaleLowerCase()
          .includes(query),
      )
    : pickerEdges.value;
});
async function openIncoming(event: Event, id: string | number) {
  if (!active || !dependencyEnabled.value) return;
  if (picker.open.value && pickerTarget.value === id) {
    picker.close(true);
    return;
  }
  links.cancel(!links.selected.value);
  picker.close();
  pickerTarget.value = id;
  pickerQuery.value = "";
  pickerNotice.value = "";
  pickerAnchor.value = event.currentTarget as SVGElement & FloatingAnchor;
  await picker.show();
  if (active && picker.open.value)
    (
      pickerPanel.value?.querySelector<HTMLElement>(
        '[data-pg-choice][aria-pressed="true"]',
      ) ?? pickerPanel.value?.querySelector<HTMLElement>("[data-pg-choice]")
    )?.focus();
}
async function chooseIncoming(
  event: Event,
  edge: (typeof allEdges.value)[number],
) {
  picker.close();
  links.selectEdge(event, edge.sourceId, edge.targetId);
  await nextTick();
  if (!active) return;
  const group = [
    ...(root.value?.querySelectorAll<SVGGElement>(".hys-ui-pg-edge-group") ??
      []),
  ].find((el) => el.dataset.edgeKey === edge.id);
  (
    group?.querySelector<SVGElement>(".hys-ui-pg-edge-endpoint-hit") ??
    group?.querySelector<SVGElement>(".hys-ui-pg-edge-hit")
  )?.focus({ preventScroll: true });
}
async function locatePickerTask(
  id: string | number,
  event?: Event,
  edge?: (typeof allEdges.value)[number],
) {
  picker.close();
  if (event && edge) links.selectEdge(event, edge.sourceId, edge.targetId);
  if (await scrollToTask(id)) {
    selected.value = id;
    emit("update:modelValue", id);
    scroller.value?.focus({ preventScroll: true });
  }
}
async function rewireFromPicker(edge: (typeof allEdges.value)[number]) {
  picker.close();
  await scrollToTask(edge.targetId, { block: "nearest" });
  links.beginKeyboard(edge.sourceId, edge.targetId);
}
async function removeFromPicker(edge: (typeof allEdges.value)[number]) {
  if (pickerBusy.value) return;
  pickerBusy.value = edge.id;
  pickerNotice.value = "";
  try {
    if (!(await links.remove(edge.sourceId, edge.targetId)))
      pickerNotice.value = links.message.value;
  } finally {
    pickerBusy.value = undefined;
  }
  await nextTick();
  if (active && picker.open.value)
    pickerPanel.value?.querySelector<HTMLElement>("[data-pg-choice]")?.focus();
  else if (active) scroller.value?.focus({ preventScroll: true });
}
function pickerKeys(event: KeyboardEvent) {
  if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  if (
    event.target instanceof HTMLInputElement &&
    ["Home", "End"].includes(event.key)
  )
    return;
  event.preventDefault();
  event.stopPropagation();
  const buttons = [
      ...(pickerPanel.value?.querySelectorAll<HTMLElement>(
        "[data-pg-choice]",
      ) ?? []),
    ],
    current = buttons.indexOf(document.activeElement as HTMLElement);
  const index =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? buttons.length - 1
        : current < 0
          ? event.key === "ArrowUp"
            ? buttons.length - 1
            : 0
          : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) %
            buttons.length;
  buttons[index]?.focus();
}
watch(pickerEdges, () => {
  if (picker.open.value) {
    if (pickerEdges.value.length < 2) picker.close();
    else nextTick(picker.update);
  }
});
watch(
  [dependencyEnabled, () => props.showDependencies, () => !!links.draft.value],
  () => {
    if (
      !dependencyEnabled.value ||
      !props.showDependencies ||
      links.draft.value
    )
      picker.close();
  },
);
watch(
  () => props.showDependencies,
  (value) => {
    if (!value) links.cancel();
  },
);
async function scrollToTask(
  id: string | number,
  options: HysGanttScrollOptions = {},
) {
  if (!active) return false;
  const index = normalized.value.findIndex((task) => task.id === id);
  if (index < 0) return false;
  await nextTick();
  if (!active || !scroller.value) return false;
  measure();
  const el = scroller.value,
    task = normalized.value[index];
  if (!task || task.id !== id) return false;
  const visible = Math.max(rowSize.value, el.clientHeight - 66),
    start = index * rowSize.value,
    end = start + rowSize.value;
  let top =
      options.block === "start"
        ? start
        : options.block === "end"
          ? end - visible
          : options.block === "nearest"
            ? start < el.scrollTop
              ? start
              : end > el.scrollTop + visible
                ? end - visible
                : el.scrollTop
            : start - (visible - rowSize.value) / 2,
    left = el.scrollLeft;
  if (options.horizontal !== false) {
    const x = (task.s - bounds.value.start) * unitWidth.value,
      w = (task.e - task.s + 1) * unitWidth.value;
    if (x < left || w > viewportWidth.value) left = x;
    else if (x + w > left + viewportWidth.value)
      left = x + w - viewportWidth.value;
  }
  const target = {
    top: Math.max(0, top),
    left: Math.max(0, left),
    behavior: options.behavior ?? "auto",
  };
  if (el.scrollTo) el.scrollTo(target);
  else {
    el.scrollTop = target.top;
    el.scrollLeft = target.left;
  }
  scrollPosition = { top: el.scrollTop, left: el.scrollLeft };
  virtualTop.value = el.scrollTop;
  await nextTick();
  return active;
}
function scrollToTop(options: Pick<HysGanttScrollOptions, "behavior"> = {}) {
  if (!active || !scroller.value) return;
  const el = scroller.value;
  if (el.scrollTo)
    el.scrollTo({
      top: 0,
      left: el.scrollLeft,
      behavior: options.behavior ?? "auto",
    });
  else el.scrollTop = 0;
  scrollPosition = { top: el.scrollTop, left: el.scrollLeft };
  virtualTop.value = el.scrollTop;
}
function select(t: GanttItem) {
  if (links.draft.value?.mode === "keyboard") {
    void links.submit(t.id);
    return;
  }
  if (performance.now() < suppressTaskClickBefore) return;
  links.clearSelected();
  selected.value = t.id;
  emit("update:modelValue", t.id);
  emit("open", t);
}
function clearTaskSelection() {
  if (selected.value === null) return;
  selected.value = null;
  emit("update:modelValue", null);
}
function chartKey(event: KeyboardEvent) {
  links.key(event);
  if (event.defaultPrevented || event.key !== "Escape") return;
  if (!drag.value && selected.value === null) return;
  if (drag.value) cancelDrag();
  else clearTaskSelection();
  event.preventDefault();
  event.stopPropagation();
}
function clearEdgeOnSurface(event: Event) {
  // Pointer clicks were handled on press; the release click after a drag must
  // not clear the newly accepted connection. Keep keyboard clicks supported.
  if (event.type === "click" && (event as MouseEvent).detail > 0) return;
  if (
    event.target instanceof Element &&
    event.target.closest(
      ".hys-ui-pg-edge-hit, .hys-ui-pg-edge-endpoint-hit, .hys-ui-pg-incoming-trigger, .hys-ui-pg-link-feedback button",
    )
  )
    return;
  links.clearSelected();
  picker.close();
  const target = event.target;
  if (
    !links.draft.value &&
    !drag.value &&
    target instanceof Element &&
    !target.closest(
      ".hys-ui-pg-bar, .hys-ui-pg-task-label, .hys-ui-pg-link-port",
    ) &&
    (target === scroller.value ||
      target.closest(".hys-ui-pg-grid, .hys-ui-pg-task-list"))
  )
    clearTaskSelection();
}
function moveToToday() {
  if (!active) return;
  const el = scroller.value;
  if (el)
    el.scrollLeft = Math.max(
      0,
      (atDay(today) - bounds.value.start) * unitWidth.value -
        viewportWidth.value / 3,
    );
}
watch(currentScale, () => nextTick(moveToToday));
const drag = ref<{
  id: string | number;
  type: "move" | "start" | "end";
  x: number;
  original: GanttItem;
  days: number;
  unitWidth: number;
} | null>(null);
let captured: { element: HTMLElement; id: number } | undefined;
let suppressTaskClickBefore = 0;
function releasePointer() {
  const capture = captured;
  captured = undefined;
  if (capture?.element.hasPointerCapture?.(capture.id))
    capture.element.releasePointerCapture(capture.id);
}
function cancelDrag() {
  if (drag.value) suppressTaskClickBefore = performance.now() + 350;
  drag.value = null;
  releasePointer();
}
function pointerDown(
  e: PointerEvent,
  t: GanttItem,
  type: "move" | "start" | "end",
) {
  if (!props.editable || t.disabled || e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  captured = { element: e.currentTarget as HTMLElement, id: e.pointerId };
  (e.currentTarget as HTMLElement)
    .closest<HTMLElement>(".hys-ui-pg-bar")
    ?.focus({ preventScroll: true });
  drag.value = {
    id: t.id,
    type,
    x: e.clientX,
    original: { ...t },
    days: 0,
    unitWidth: unitWidth.value,
  };
  selected.value = t.id;
  emit("update:modelValue", t.id);
}
function pointerMove(e: PointerEvent) {
  if (!drag.value) return;
  drag.value.days = Math.round(
    (e.clientX - drag.value.x) / drag.value.unitWidth,
  );
}
function pointerEnd(e: PointerEvent) {
  const state = drag.value;
  if (!state) return;
  drag.value = null;
  releasePointer();
  if (e.type === "pointercancel" || !state.days) return;
  const s = parseDate(state.original.start),
    end = parseDate(state.original.end);
  if (!s || !end) return;
  let start = atDay(s),
    finish = atDay(end);
  if (state.type === "move") {
    start += state.days;
    finish += state.days;
  } else if (state.type === "start") {
    start = Math.min(finish, start + state.days);
  } else {
    finish = Math.max(start, finish + state.days);
  }
  const next = {
    ...state.original,
    start: formatDay(start),
    end: formatDay(finish),
  };
  emit(
    "update:items",
    props.items.map((t) => (t.id === next.id ? next : t)),
  );
  emit("change", next);
}
function preview(t: (typeof normalized.value)[number]) {
  const state = drag.value;
  if (!state || state.id !== t.id) return { s: t.s, e: t.e };
  const n = state.days;
  return state.type === "move"
    ? { s: t.s + n, e: t.e + n }
    : state.type === "start"
      ? { s: Math.min(t.e, t.s + n), e: t.e }
      : { s: t.s, e: Math.max(t.s, t.e + n) };
}
function barStyle(t: (typeof normalized.value)[number]) {
  const p = preview(t);
  return {
    left: `${(p.s - bounds.value.start) * unitWidth.value}px`,
    width: `${Math.max(unitWidth.value, (p.e - p.s + 1) * unitWidth.value)}px`,
    background:
      t.color || "var(--hys-ui-primary,var(--hys-ui-theme-primary, #4776ed))",
  };
}
function portStyle(t: (typeof normalized.value)[number]) {
  return {
    left: (preview(t).e - bounds.value.start + 1) * unitWidth.value + 5 + "px",
  };
}
function nudge(t: GanttItem, offset: number) {
  if (!props.editable || t.disabled) return;
  const s = parseDate(t.start),
    e = parseDate(t.end);
  if (!s || !e) return;
  const next = {
    ...t,
    start: formatDay(atDay(s) + offset),
    end: formatDay(atDay(e) + offset),
  };
  emit(
    "update:items",
    props.items.map((x) => (x.id === t.id ? next : x)),
  );
  emit("change", next);
}
defineExpose({
  element: root,
  viewport: scroller,
  scrollToTask,
  scrollToTop,
  addDependency: links.add,
  removeDependency: links.remove,
  moveDependency: links.moveTarget,
  cancelDependency: () => links.cancel(),
});
</script>
<template>
  <section
    ref="root"
    v-bind="hysRootAttrs"
    class="hys-ui-pg-gantt"
    :class="{ 'hys-ui-pg-resizing-label': labelResize.resizing.value }"
    aria-label="项目甘特图"
    @keydown="chartKey"
    @pointerdown.capture="clearEdgeOnSurface"
    @click.capture="clearEdgeOnSurface"
  >
    <div class="hys-ui-pg-toolbar">
      <HysSegmented
        class="hys-ui-pg-scale"
        :model-value="currentScale"
        :options="[
          { label: '日', value: 'day' },
          { label: '周', value: 'week' },
          { label: '月', value: 'month' },
        ]"
        aria-label="时间刻度"
        @update:model-value="changeScale"
      /><HysButton
        variant="secondary"
        size="sm"
        class="hys-ui-pg-today"
        @click="moveToToday"
        >定位今天</HysButton
      ><span class="hys-ui-pg-hint">{{
        editable
          ? "拖动任务条调整排期 · Alt + 左/右方向键微调日期 · Esc / 点击空白取消选中"
          : "点击任务查看详情 · Esc / 点击空白取消选中"
      }}</span>
    </div>
    <div
      ref="scroller"
      class="hys-ui-pg-body hys-ui-pg-scroll"
      :style="viewportStyle"
      role="region"
      tabindex="0"
      aria-label="可滚动的甘特图任务与时间轴"
      @scroll.passive="rememberScroll"
      @pointermove="links.move"
      @pointerup="links.end"
      @pointercancel="links.lost"
      @lostpointercapture="links.lost"
    >
      <div
        ref="labels"
        class="hys-ui-pg-labels"
        :style="{
          width: labelResize.width.value + 'px',
          minWidth: labelResize.width.value + 'px',
        }"
      >
        <div class="hys-ui-pg-label-head">
          任务 / 负责人
          <div
            v-if="labelResizable"
            class="hys-ui-pg-label-resizer"
            role="separator"
            tabindex="0"
            aria-label="任务名称列宽"
            aria-orientation="vertical"
            :aria-valuenow="labelResize.width.value"
            :aria-valuemin="labelResize.minimum.value"
            :aria-valuemax="labelResize.maximum.value"
            :style="{ height: viewportHeight + 'px' }"
            title="拖动调整任务列宽；左右键微调，Shift 加速，双击还原"
            @pointerdown.stop.prevent="labelResize.down"
            @pointermove="labelResize.move"
            @pointerup="labelResize.up"
            @pointercancel="labelResize.up"
            @lostpointercapture="labelResize.cancel"
            @keydown="labelResize.key"
            @dblclick.stop="labelResize.reset"
          />
        </div>
        <div
          class="hys-ui-pg-task-list"
          :style="{ height: normalized.length * rowSize + 'px' }"
        >
          <button
            type="button"
            v-for="entry in visibleRows"
            :key="entry.task.id"
            class="hys-ui-pg-task-label"
            :aria-pressed="selected === entry.task.id"
            :data-row-index="entry.index"
            :class="{
              'hys-ui-selected': selected === entry.task.id,
              'hys-ui-pg-link-target':
                links.draft.value?.targetId === entry.task.id,
              'hys-ui-pg-link-invalid':
                links.draft.value?.targetId === entry.task.id &&
                !!links.draft.value?.reason,
            }"
            :style="{
              height: rowSize + 'px',
              top: entry.index * rowSize + 'px',
            }"
            @click="select(entry.task)"
            @keydown.alt.left.prevent="nudge(entry.task, -1)"
            @keydown.alt.right.prevent="nudge(entry.task, 1)"
          >
            <strong :title="entry.task.title">{{ entry.task.title }}</strong
            ><small
              >{{ entry.task.owner || "未分配" }} ·
              {{ entry.task.status || "待办" }}</small
            >
          </button>
        </div>
        <div v-if="!normalized.length" class="hys-ui-pg-empty">
          暂无有效排期任务
        </div>
      </div>
      <div class="hys-ui-pg-timeline" :style="{ width: width + 'px' }">
        <div class="hys-ui-pg-canvas" :style="{ width: width + 'px' }">
          <div class="hys-ui-pg-months">
            <span
              v-for="m in months"
              :key="m.key"
              :title="m.label"
              :style="{ left: m.left + 'px', width: m.width + 'px' }"
              >{{ m.label }}</span
            >
          </div>
          <div class="hys-ui-pg-days">
            <span
              v-for="day in days"
              :key="day"
              :class="{
                'hys-ui-weekend': [0, 6].includes(dateFromDay(day).getUTCDay()),
                'hys-ui-today': day === atDay(today),
              }"
              :style="{ width: unitWidth + 'px' }"
              >{{
                currentScale === "month" ? "" : dateFromDay(day).getUTCDate()
              }}</span
            >
          </div>
          <div
            ref="grid"
            class="hys-ui-pg-grid"
            :style="{ height: normalized.length * rowSize + 'px' }"
          >
            <div
              v-for="day in days"
              :key="day"
              class="hys-ui-pg-day-column"
              :class="{
                'hys-ui-weekend': [0, 6].includes(dateFromDay(day).getUTCDay()),
              }"
              :style="{
                left: (day - bounds.start) * unitWidth + 'px',
                width: unitWidth + 'px',
              }"
            />
            <div
              class="hys-ui-pg-today-line"
              :style="{
                left:
                  (atDay(today) - bounds.start) * unitWidth +
                  unitWidth / 2 +
                  'px',
              }"
            />
            <div
              v-for="entry in visibleRows"
              :key="entry.task.id"
              class="hys-ui-pg-row"
              :data-row-index="entry.index"
              :style="{
                top: entry.index * rowSize + 'px',
                height: rowSize + 'px',
              }"
            >
              <div
                class="hys-ui-pg-bar"
                :class="{
                  'hys-ui-selected': selected === entry.task.id,
                  'hys-ui-dragging': drag?.id === entry.task.id,
                  'hys-ui-disabled': entry.task.disabled,
                  'hys-ui-pg-link-source':
                    links.draft.value?.sourceId === entry.task.id,
                  'hys-ui-pg-link-target':
                    links.draft.value?.targetId === entry.task.id,
                  'hys-ui-pg-link-invalid':
                    links.draft.value?.targetId === entry.task.id &&
                    !!links.draft.value?.reason,
                }"
                :style="barStyle(entry.task)"
                role="button"
                :aria-pressed="selected === entry.task.id"
                tabindex="0"
                :aria-label="`${entry.task.title}，${entry.task.start} 至 ${entry.task.end}，完成 ${entry.task.progress}%`"
                :title="`${entry.task.title}
${entry.task.start} → ${entry.task.end}
完成 ${entry.task.progress}%`"
                @click="select(entry.task)"
                @keydown.enter="select(entry.task)"
                @keydown.space.prevent="select(entry.task)"
                @keydown.alt.left.prevent="nudge(entry.task, -1)"
                @keydown.alt.right.prevent="nudge(entry.task, 1)"
                @pointerdown="pointerDown($event, entry.task, 'move')"
                @pointermove="pointerMove"
                @pointerup="pointerEnd"
                @pointercancel="pointerEnd"
                @lostpointercapture="cancelDrag"
              >
                <div
                  class="hys-ui-pg-progress"
                  :style="{ width: entry.task.progress + '%' }"
                />
                <span class="hys-ui-pg-bar-title"
                  >{{ entry.task.progress }}%</span
                ><span
                  v-if="editable && !entry.task.disabled"
                  class="hys-ui-pg-handle hys-ui-start"
                  title="调整开始日期"
                  @pointerdown.stop="pointerDown($event, entry.task, 'start')"
                  @pointermove="pointerMove"
                  @pointerup="pointerEnd"
                  @pointercancel="pointerEnd"
                  @lostpointercapture="cancelDrag"
                /><span
                  v-if="editable && !entry.task.disabled"
                  class="hys-ui-pg-handle hys-ui-end"
                  title="调整结束日期"
                  @pointerdown.stop="pointerDown($event, entry.task, 'end')"
                  @pointermove="pointerMove"
                  @pointerup="pointerEnd"
                  @pointercancel="pointerEnd"
                  @lostpointercapture="cancelDrag"
                />
              </div>
              <button
                v-if="
                  dependencyEnabled && showDependencies && !entry.task.disabled
                "
                type="button"
                class="hys-ui-pg-link-port"
                :class="{
                  'hys-ui-pg-link-port-visible':
                    selected === entry.task.id ||
                    links.draft.value?.sourceId === entry.task.id,
                }"
                :style="portStyle(entry.task)"
                :aria-label="'连接后续任务：' + entry.task.title"
                title="拖动到后置任务，或点击后选择任务；也支持 Enter 和上下键"
                @pointerdown.stop.prevent="
                  links.beginPointer($event, entry.task.id)
                "
                @click.stop="links.clickSource($event, entry.task.id)"
                @keydown.enter.stop.prevent="links.beginKeyboard(entry.task.id)"
                @keydown.space.stop.prevent="links.beginKeyboard(entry.task.id)"
              ></button>
            </div>
            <svg
              v-if="(showDependencies && edges.length) || links.draft.value"
              class="hys-ui-pg-dependencies"
              :class="{
                'hys-ui-pg-has-edge-selection': !!links.selected.value,
              }"
              :width="width"
              :height="normalized.length * rowSize"
              :aria-hidden="!dependencyEnabled || undefined"
            >
              <template v-if="showDependencies">
                <g
                  v-for="edge in edges"
                  :key="edge.id"
                  class="hys-ui-pg-edge-group"
                  :data-edge-key="edge.id"
                  :class="{
                    'hys-ui-pg-edge-shared':
                      (incomingGroups.get(edge.targetId)?.length ?? 0) > 1,
                    'hys-ui-pg-edge-current':
                      links.selected.value?.sourceId === edge.sourceId &&
                      links.selected.value?.targetId === edge.targetId,
                    'hys-ui-pg-edge-rewiring':
                      links.draft.value?.sourceId === edge.sourceId &&
                      links.draft.value?.previousTargetId === edge.targetId,
                  }"
                >
                  <path
                    class="hys-ui-pg-edge-line"
                    :class="{
                      'hys-ui-pg-edge-selected':
                        links.selected.value?.sourceId === edge.sourceId &&
                        links.selected.value?.targetId === edge.targetId,
                      'hys-ui-pg-edge-related':
                        selected === edge.sourceId ||
                        selected === edge.targetId,
                    }"
                    :d="edge.path"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />

                  <path
                    v-if="dependencyEnabled"
                    class="hys-ui-pg-edge-hit"
                    :d="
                      (incomingGroups.get(edge.targetId)?.length ?? 0) > 1 &&
                      !(
                        links.selected.value?.sourceId === edge.sourceId &&
                        links.selected.value?.targetId === edge.targetId
                      )
                        ? edge.pickPath
                        : edge.path
                    "
                    fill="none"
                    stroke="transparent"
                    stroke-width="12"
                    role="button"
                    tabindex="0"
                    :aria-label="
                      '依赖 ' +
                      edge.sourceId +
                      ' → ' +
                      edge.targetId +
                      '，选中后按 Delete 移除'
                    "
                    @pointerdown.stop
                    @click.stop="
                      links.selectEdge($event, edge.sourceId, edge.targetId)
                    "
                    @focus="
                      links.selectEdge($event, edge.sourceId, edge.targetId)
                    "
                    @keydown.enter.prevent.stop="
                      links.selectEdge($event, edge.sourceId, edge.targetId)
                    "
                  />
                  <template v-if="dependencyEnabled && edge.editable">
                    <circle
                      class="hys-ui-pg-edge-endpoint"
                      :cx="edge.endpoint.x"
                      :cy="edge.endpoint.y"
                      r="5"
                      aria-hidden="true"
                    />
                    <circle
                      class="hys-ui-pg-edge-endpoint-hit"
                      :cx="edge.endpoint.x"
                      :cy="edge.endpoint.y"
                      r="12"
                      fill="transparent"
                      role="button"
                      tabindex="0"
                      :aria-label="
                        '改接依赖终点：' + edge.sourceId + ' → ' + edge.targetId
                      "
                      @focus="
                        links.selectEdge($event, edge.sourceId, edge.targetId)
                      "
                      @pointerdown.stop.prevent="
                        links.beginPointer($event, edge.sourceId, edge.targetId)
                      "
                      @click.stop="
                        links.clickSource($event, edge.sourceId, edge.targetId)
                      "
                      @keydown.enter.stop.prevent="
                        links.beginKeyboard(edge.sourceId, edge.targetId)
                      "
                      @keydown.space.stop.prevent="
                        links.beginKeyboard(edge.sourceId, edge.targetId)
                      "
                    >
                      <title>
                        {{ edge.sourceTitle }} →
                        {{ edge.targetTitle }}：拖动修改连接终点，或按 Enter
                        后用上下键选择新任务
                      </title>
                    </circle>
                  </template>
                </g>
                <template v-if="activeEdge">
                  <path
                    class="hys-ui-pg-active-edge-line"
                    :d="activeEdge.path"
                    fill="none"
                    stroke-width="2.5"
                  />
                  <circle
                    v-if="activeEdge.editable && dependencyEnabled"
                    class="hys-ui-pg-active-endpoint"
                    :cx="activeEdge.endpoint.x"
                    :cy="activeEdge.endpoint.y"
                    r="5"
                  />
                </template>
                <template v-if="dependencyEnabled">
                  <g
                    v-for="endpoint in incomingEndpoints"
                    :key="endpoint.id"
                    class="hys-ui-pg-incoming-trigger"
                    :transform="`translate(${endpoint.x} ${endpoint.y})`"
                    role="button"
                    tabindex="0"
                    aria-haspopup="dialog"
                    :aria-expanded="
                      picker.open.value && pickerTarget === endpoint.id
                    "
                    :aria-label="
                      '选择前置依赖：' +
                      endpoint.title +
                      '，' +
                      endpoint.count +
                      ' 条'
                    "
                    @pointerdown.stop
                    @click.stop="openIncoming($event, endpoint.id)"
                    @keydown.enter.stop.prevent="
                      openIncoming($event, endpoint.id)
                    "
                    @keydown.space.stop.prevent="
                      openIncoming($event, endpoint.id)
                    "
                  >
                    <circle
                      r="13"
                      fill="transparent"
                      class="hys-ui-pg-incoming-hit"
                    />
                    <circle
                      v-if="links.selected.value?.targetId !== endpoint.id"
                      cx="29"
                      r="13"
                      fill="transparent"
                      class="hys-ui-pg-incoming-hit"
                    />
                    <circle r="9" class="hys-ui-pg-incoming-badge" />
                    <text text-anchor="middle" dy=".35em">
                      {{ endpoint.count > 99 ? "99+" : endpoint.count }}
                    </text>
                    <title>
                      {{ endpoint.title }} 有
                      {{ endpoint.count }} 条前置关系，点击选择要编辑的连线
                    </title>
                  </g>
                </template>
              </template>
              <path
                v-if="links.draft.value"
                class="hys-ui-pg-link-preview"
                :class="{
                  'hys-ui-pg-link-preview-invalid': !!links.draft.value.reason,
                }"
                :d="links.path.value"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-dasharray="5 4"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
    <div class="hys-ui-pg-footer">
      {{ normalized.length }} 项任务 · {{ completedCount }} 项已完成
      <span v-if="normalized.length !== items.length"
        >· {{ items.length - normalized.length }} 项日期无效已隐藏</span
      >
      <div v-if="dependencyEnabled" class="hys-ui-pg-link-feedback">
        <span role="status" aria-live="polite">{{
          links.message.value ||
          "拖动圆点连接依赖；选中连线可拖动终点改接或移除。"
        }}</span
        ><HysButton
          v-if="links.draft.value"
          variant="ghost"
          size="sm"
          @click="links.cancel()"
          ><X :size="14" />取消连接</HysButton
        ><HysButton
          v-else-if="links.selected.value"
          variant="ghost"
          size="sm"
          @click="
            links.remove(
              links.selected.value!.sourceId,
              links.selected.value!.targetId,
            )
          "
          ><Trash2 :size="14" />移除依赖</HysButton
        >
      </div>
    </div>
    <Teleport to="body">
      <div
        v-if="picker.open.value"
        ref="pickerPanel"
        v-bind="hysRootAttrs"
        class="hys-ui-pg-dependency-picker hys-ui-floating-surface"
        :style="picker.style.value"
        role="dialog"
        :aria-label="'选择前置依赖：' + (pickerEdges[0]?.targetTitle ?? '')"
        @keydown="pickerKeys"
      >
        <div class="hys-ui-pg-picker-heading">
          <strong>选择前置关系</strong
          ><HysButton
            variant="ghost"
            size="sm"
            class="hys-ui-pg-picker-close"
            aria-label="关闭前置关系列表"
            @click="picker.close(true)"
            ><X :size="15"
          /></HysButton>
        </div>
        <div class="hys-ui-pg-picker-target">
          <div class="hys-ui-pg-picker-target-main">
            <span>后置</span
            ><strong :title="pickerEdges[0]?.targetTitle">{{
              pickerEdges[0]?.targetTitle
            }}</strong>
          </div>
          <HysButton
            variant="ghost"
            size="sm"
            class="hys-ui-pg-picker-action"
            aria-label="定位后置任务"
            title="定位后置任务"
            @click="
              pickerTarget !== undefined && locatePickerTask(pickerTarget)
            "
            ><LocateFixed :size="15"
          /></HysButton>
        </div>
        <HysInput
          v-model="pickerQuery"
          size="sm"
          :prefix-icon="Search"
          clearable
          placeholder="搜索前置任务或编号"
          aria-label="搜索前置关系"
          class="hys-ui-pg-picker-search"
        />
        <div class="hys-ui-pg-picker-options">
          <div
            v-for="edge in filteredPickerEdges"
            :key="edge.id"
            class="hys-ui-pg-picker-option"
            :data-current="
              links.selected.value?.sourceId === edge.sourceId &&
              links.selected.value?.targetId === edge.targetId
            "
          >
            <HysButton
              variant="ghost"
              data-pg-choice
              :aria-label="edge.sourceTitle + ' → ' + edge.targetTitle"
              :aria-pressed="
                links.selected.value?.sourceId === edge.sourceId &&
                links.selected.value?.targetId === edge.targetId
              "
              @click="chooseIncoming($event, edge)"
            >
              <GitBranch :size="15" class="hys-ui-pg-picker-icon" /><span
                class="hys-ui-pg-picker-names"
                ><span :title="edge.sourceTitle">{{
                  edge.sourceTitle
                }}</span></span
              ><span class="hys-ui-pg-picker-check"
                ><Check
                  v-if="
                    links.selected.value?.sourceId === edge.sourceId &&
                    links.selected.value?.targetId === edge.targetId
                  "
                  :size="14"
              /></span>
            </HysButton>
            <div class="hys-ui-pg-picker-actions">
              <HysButton
                variant="ghost"
                size="sm"
                class="hys-ui-pg-picker-action"
                :aria-label="'定位前置任务：' + edge.sourceTitle"
                title="定位前置任务"
                @click.stop="locatePickerTask(edge.sourceId, $event, edge)"
                ><LocateFixed :size="14"
              /></HysButton>
              <HysButton
                variant="ghost"
                size="sm"
                class="hys-ui-pg-picker-action"
                :disabled="!edge.editable || !!pickerBusy"
                :aria-label="
                  '修改终点：' + edge.sourceTitle + ' → ' + edge.targetTitle
                "
                title="修改连接终点"
                @click.stop="rewireFromPicker(edge)"
                ><CornerDownRight :size="14"
              /></HysButton>
              <HysButton
                variant="ghost"
                size="sm"
                class="hys-ui-pg-picker-action hys-ui-pg-picker-delete"
                :disabled="!edge.removable || !!pickerBusy"
                :aria-label="
                  '删除依赖：' + edge.sourceTitle + ' → ' + edge.targetTitle
                "
                title="删除这条依赖"
                @click.stop="removeFromPicker(edge)"
                ><Trash2 :size="14"
              /></HysButton>
            </div>
          </div>
          <p v-if="!filteredPickerEdges.length" class="hys-ui-pg-picker-empty">
            没有匹配的前置关系
          </p>
        </div>
        <p v-if="pickerNotice" class="hys-ui-pg-picker-notice" role="status">
          {{ pickerNotice }}
        </p>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.hys-ui-pg-label-resizer {
  position: absolute;
  top: 0;
  right: -4px;
  width: 9px;
  z-index: 8;
  cursor: col-resize;
  touch-action: none;
  user-select: none;
  outline: none;
}
.hys-ui-pg-label-resizer::after {
  content: "";
  position: absolute;
  inset: 0 3px;
  background: transparent;
}
.hys-ui-pg-label-resizer:hover::after,
.hys-ui-pg-label-resizer:focus-visible::after,
.hys-ui-pg-resizing-label .hys-ui-pg-label-resizer::after {
  background: var(--hys-ui-primary, #4776ed);
}
.hys-ui-pg-resizing-label,
.hys-ui-pg-resizing-label * {
  cursor: col-resize !important;
  user-select: none;
}
.hys-ui-pg-body {
  position: relative;
  align-items: flex-start;
}
.hys-ui-pg-scroll:focus-visible {
  outline: 2px solid var(--hys-ui-primary, #4776ed);
  outline-offset: -2px;
}
.hys-ui-pg-scroll {
  min-width: 0;
  width: 100%;
  scroll-padding-block: 66px 8px;
}
.hys-ui-pg-labels {
  position: sticky;
  left: 0;
  flex: none;
  z-index: 3;
  box-sizing: border-box;
}
.hys-ui-pg-timeline {
  flex: none;
  min-width: 0;
}
.hys-ui-pg-task-list {
  position: relative;
}
.hys-ui-pg-grid {
  isolation: isolate;
}
.hys-ui-pg-bar {
  z-index: 2;
}
.hys-ui-pg-bar.hys-ui-dragging {
  z-index: 5;
}
.hys-ui-pg-link-port {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
  display: block;
  width: 14px;
  height: 14px;
  padding: 0;
  border: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  border-radius: 50%;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  cursor: crosshair;
  opacity: 0;
  transition: opacity 0.12s;
  touch-action: none;
}
.hys-ui-pg-row:hover > .hys-ui-pg-link-port,
.hys-ui-pg-row:focus-within > .hys-ui-pg-link-port,
.hys-ui-pg-link-port-visible {
  opacity: 1;
}
.hys-ui-pg-link-port:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 3px;
}
.hys-ui-pg-task-label.hys-ui-pg-link-target {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
.hys-ui-pg-task-label.hys-ui-pg-link-invalid {
  box-shadow: inset 0 0 0 1px
    var(--hys-ui-danger, var(--hys-ui-theme-red, #ef4444));
  background: color-mix(
    in srgb,
    var(--hys-ui-danger, var(--hys-ui-theme-red, #ef4444)) 8%,
    var(--hys-ui-surface, var(--hys-ui-theme-surface))
  );
}
.hys-ui-pg-bar.hys-ui-pg-link-source {
  outline: 2px dashed var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 3px;
}
.hys-ui-pg-bar.hys-ui-pg-link-target {
  outline: 2px solid var(--hys-ui-success, var(--hys-ui-theme-green, #16a46e));
  outline-offset: 3px;
}
.hys-ui-pg-bar.hys-ui-pg-link-invalid {
  outline-color: var(--hys-ui-danger, var(--hys-ui-theme-red, #ef4444));
}
.hys-ui-pg-dependencies {
  z-index: 1;
  opacity: 1;
}
.hys-ui-pg-edge-line {
  opacity: 0.55;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.hys-ui-pg-edge-related,
.hys-ui-pg-edge-selected {
  opacity: 1;
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  stroke-width: 2;
}
.hys-ui-pg-edge-hit {
  pointer-events: stroke;
  cursor: pointer;
  outline: none;
}
.hys-ui-pg-edge-hit:focus-visible {
  stroke: color-mix(
    in srgb,
    var(--hys-ui-primary, var(--hys-ui-theme-primary)) 18%,
    transparent
  );
}
.hys-ui-pg-edge-endpoint {
  opacity: 0;
  fill: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
  stroke: var(--hys-ui-primary, var(--hys-ui-theme-primary, #4776ed));
  stroke-width: 2;
  pointer-events: none;
}
.hys-ui-pg-edge-endpoint-hit {
  cursor: crosshair;
  pointer-events: all;
  outline: none;
  touch-action: none;
}
.hys-ui-pg-edge-group:hover .hys-ui-pg-edge-endpoint,
.hys-ui-pg-edge-group:focus-within .hys-ui-pg-edge-endpoint,
.hys-ui-pg-edge-current .hys-ui-pg-edge-endpoint,
.hys-ui-pg-edge-rewiring .hys-ui-pg-edge-endpoint {
  opacity: 1;
}
.hys-ui-pg-edge-endpoint-hit:focus-visible {
  stroke: var(--hys-ui-primary, var(--hys-ui-theme-primary, #4776ed));
  stroke-width: 1.5;
}
.hys-ui-pg-edge-rewiring .hys-ui-pg-edge-line {
  opacity: 0.2;
  stroke-dasharray: 3 3;
}
.hys-ui-pg-edge-shared:not(.hys-ui-pg-edge-current) .hys-ui-pg-edge-endpoint {
  opacity: 0;
}
.hys-ui-pg-edge-shared:not(.hys-ui-pg-edge-current)
  .hys-ui-pg-edge-endpoint-hit {
  pointer-events: none;
}
.hys-ui-pg-has-edge-selection
  .hys-ui-pg-edge-group:not(.hys-ui-pg-edge-current)
  .hys-ui-pg-edge-line {
  opacity: 0.18;
  color: var(--hys-ui-text-muted, var(--hys-ui-theme-text-muted));
  stroke-width: 1.5;
}
.hys-ui-pg-edge-current .hys-ui-pg-edge-line {
  stroke-width: 2.5;
}
.hys-ui-pg-active-edge-line {
  stroke: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}
.hys-ui-pg-active-endpoint {
  fill: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
  stroke: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  stroke-width: 2;
  pointer-events: none;
}
.hys-ui-pg-incoming-trigger {
  pointer-events: all;
  cursor: pointer;
  outline: none;
}
.hys-ui-pg-incoming-badge {
  fill: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
  stroke: var(--hys-ui-border, var(--hys-ui-theme-border, #d6deed));
  stroke-width: 1.5;
  pointer-events: none;
}
.hys-ui-pg-incoming-trigger text {
  font-size: 10px;
  font-weight: 700;
  fill: var(--hys-ui-text-muted, var(--hys-ui-theme-text-muted));
  pointer-events: none;
}
.hys-ui-pg-incoming-trigger:hover .hys-ui-pg-incoming-badge,
.hys-ui-pg-incoming-trigger:focus-visible .hys-ui-pg-incoming-badge {
  stroke: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  stroke-width: 2;
}
.hys-ui-pg-dependency-picker {
  padding: 12px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border, #e4e8ef));
  border-radius: 14px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
  background: color-mix(
    in srgb,
    var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff)) 75%,
    transparent
  );
  backdrop-filter: blur(10px) saturate(110%);
  -webkit-backdrop-filter: blur(10px) saturate(110%);
  color: var(--hys-ui-text, var(--hys-ui-theme-text, #243047));
  box-shadow:
    0 12px 36px #0b1b3d26,
    0 2px 8px #0b1b3d08;
}
.hys-ui-pg-picker-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;
}
.hys-ui-pg-picker-heading strong {
  font-size: 13px;
  font-weight: 650;
}
.hys-ui-pg-picker-heading :deep(.hys-ui-pg-picker-close) {
  width: 24px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  color: var(--hys-ui-text-muted, var(--hys-ui-theme-text-muted));
  border: 0;
}
.hys-ui-pg-picker-target {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  margin-bottom: 8px;
  border-radius: 7px;
  background: color-mix(
    in srgb,
    var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt, #f7f9fc)) 60%,
    transparent
  );
}
.hys-ui-pg-picker-target-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.hys-ui-pg-picker-target-main > span {
  flex: none;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  font-size: 10px;
  line-height: 1.5;
  color: var(--hys-ui-text-muted, var(--hys-ui-theme-text-muted));
}
.hys-ui-pg-picker-target-main > strong {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-size: 12px;
  font-weight: 550;
  line-height: 1.5;
}
.hys-ui-pg-picker-search {
  margin-bottom: 8px;
}
.hys-ui-pg-picker-options {
  display: grid;
  gap: 3px;
}
.hys-ui-pg-picker-option {
  display: flex;
  align-items: center;
  min-width: 0;
  border-radius: 7px;
}
.hys-ui-pg-picker-option:hover {
  background: color-mix(
    in srgb,
    var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt, #f7f9fc)) 60%,
    transparent
  );
}
.hys-ui-pg-picker-option[data-current="true"] {
  background: color-mix(
    in srgb,
    var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft)) 65%,
    transparent
  );
}
.hys-ui-pg-picker-options :deep(.hys-ui-btn[data-pg-choice]) {
  flex: 1;
  align-self: stretch;
  justify-content: flex-start;
  text-align: left;
  margin: 0;
  min-width: 0;
  min-height: 38px;
  padding: 7px 8px;
  gap: 7px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  font-weight: 450;
  transform: none;
  box-shadow: none;
}
.hys-ui-pg-picker-options
  :deep(.hys-ui-btn[data-pg-choice]:not(.hys-ui-button-locked):hover) {
  background: transparent;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
}
.hys-ui-pg-picker-option[data-current="true"]
  :deep(.hys-ui-btn[data-pg-choice]),
.hys-ui-pg-picker-option[data-current="true"]
  :deep(.hys-ui-btn[data-pg-choice]:hover) {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-pg-picker-names {
  display: flex;
  min-width: 0;
  flex: 1;
}
.hys-ui-pg-picker-names > span {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  white-space: normal;
  line-height: 1.45;
  font-size: 12px;
}
.hys-ui-pg-picker-icon {
  flex: none;
  opacity: 0.6;
}
.hys-ui-pg-picker-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  flex: none;
}
.hys-ui-pg-picker-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  padding-right: 4px;
  flex: none;
}
.hys-ui-pg-dependency-picker :deep(.hys-ui-pg-picker-action) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  height: 24px;
  width: 24px;
  min-width: 24px;
  padding: 0;
  border: 0;
  color: var(--hys-ui-text-muted, var(--hys-ui-theme-text-muted));
  background: transparent;
  transform: none;
  box-shadow: none;
}
.hys-ui-pg-dependency-picker
  :deep(.hys-ui-pg-picker-action:not(.hys-ui-button-locked):hover) {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-ui-pg-dependency-picker
  :deep(.hys-ui-pg-picker-delete:not(.hys-ui-button-locked):hover) {
  background: color-mix(
    in srgb,
    var(--hys-ui-danger, var(--hys-ui-theme-red, #ef4444)) 10%,
    transparent
  );
  color: var(--hys-ui-danger, var(--hys-ui-theme-red, #ef4444));
}
.hys-ui-pg-picker-empty {
  margin: 0;
  padding: 16px 8px;
  text-align: center;
  font-size: 12px;
  color: var(--hys-ui-text-muted, var(--hys-ui-theme-text-muted));
}
.hys-ui-pg-picker-notice {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--hys-ui-danger, var(--hys-ui-theme-red, #ef4444));
}
.hys-ui-pg-link-preview {
  color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
  pointer-events: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.hys-ui-pg-link-preview-invalid {
  color: var(--hys-ui-danger, var(--hys-ui-theme-red, #ef4444));
}
.hys-ui-pg-link-feedback {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 30px;
  min-width: 0;
  margin-top: 6px;
  border-top: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  padding-top: 5px;
}
.hys-ui-pg-link-feedback > span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hys-ui-pg-link-feedback :deep(.hys-ui-btn) {
  flex: none;
}
.hys-ui-pg-task-label {
  position: absolute;
  left: 0;
}
.hys-ui-pg-label-head,
.hys-ui-pg-months,
.hys-ui-pg-days {
  position: sticky;
  z-index: 2;
  box-sizing: border-box;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface, #fff));
}
.hys-ui-pg-label-head {
  top: 0;
  z-index: 4;
}
.hys-ui-pg-months {
  top: 0;
}
.hys-ui-pg-days {
  top: 34px;
}
.hys-ui-pg-bar {
  top: 50%;
  transform: translateY(-50%);
  max-height: calc(100% - 8px);
}
.hys-ui-pg-task-label,
.hys-ui-pg-bar {
  scroll-margin-block: 8px;
}
.hys-ui-pg-months span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hys-ui-pg-toolbar :deep(.hys-ui-pg-today) {
  min-height: 32px;
  transform: none;
}
</style>
