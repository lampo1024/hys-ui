<script setup lang="ts">
import {
  computed,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  toRaw,
  toValue,
  useTemplateRef,
  watch,
  type FunctionalComponent,
  type VNodeChild,
} from "vue";
import { readTsv } from "../HysProGrid/clipboard/tsv";
import { axisHidden, updateAxis } from "./spreadsheetAxis";
import {
  affectedCells,
  areaFromAddresses,
  canEdit,
  displayValue,
  fillValues,
  formatStyle,
  isCellValue,
  parseTyped,
  points,
  safeLink,
  validPoint,
  validateCell,
  withValues,
} from "./spreadsheetCells";
import {
  conditionalCells,
  filtered,
  groupedRows,
  updateData,
} from "./spreadsheetData";
import { offsetFormula } from "./spreadsheetReferences";
import {
  spreadsheetFindMatches,
  spreadsheetSearchPattern,
} from "./spreadsheetSearch";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Columns3,
  Filter,
  GripVertical,
  ListMinus,
  ListPlus,
  ListFilter,
  LockKeyhole,
  Plus,
} from "lucide-vue-next";
import HysButton from "../HysButton/HysButton.vue";
import HysAccordion from "../HysAccordion/HysAccordion.vue";
import HysInput from "../HysInput/HysInput.vue";
import HysNumberInput from "../HysNumberInput/HysNumberInput.vue";
import HysRadioGroup from "../HysRadioGroup/HysRadioGroup.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysSlider from "../HysSlider/HysSlider.vue";
import HysTabs from "../HysTabs/HysTabs.vue";
import type { HysTabOrderContext } from "../HysTabs/tabsTypes";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import HysProGrid from "../HysProGrid/HysProGrid.vue";
import {
  createProGridClipboard,
  type HysProGridRange,
} from "../HysProGrid/clipboard/clipboard";
import type {
  HysProGridChange,
  HysProGridCell,
  HysProGridColumn,
  HysProGridFailure,
  HysProGridInstance,
} from "../HysProGrid/proGridTypes";
import type { HysDataGridContext } from "../HysDataGrid/gridPresentation";
import { useGridColumnMotion } from "../HysDataGrid/useGridColumnMotion";
import type { HysContextMenuItem, HysMenuKey } from "../../composables/menu";
import { provideHysConfig, useHysConfig, useHysRootAttrs } from "../../config";
import { useMotion } from "../../motion/useMotion";
import {
  builtinFormulaNames,
  callFormula,
  compileFormula,
  evaluateWorkbook,
} from "./spreadsheetFormulas";
import SpreadsheetSheetPanel from "./SpreadsheetSheetPanel/SpreadsheetSheetPanel.vue";
import SpreadsheetTabMenu from "./SpreadsheetTabMenu/SpreadsheetTabMenu.vue";
import SpreadsheetWorkbookMenu from "./SpreadsheetWorkbookMenu/SpreadsheetWorkbookMenu.vue";
import SpreadsheetToolbar from "./SpreadsheetToolbar/SpreadsheetToolbar.vue";
import SpreadsheetToolbarButton from "./SpreadsheetToolbarButton/SpreadsheetToolbarButton.vue";
import SpreadsheetFormatPopover from "./SpreadsheetFormatPopover/SpreadsheetFormatPopover.vue";
import { isFormatPanel } from "./SpreadsheetToolbar/formatTools";
import { isInlineCommand, type ToolbarAction } from "./SpreadsheetToolbar/toolbarTools";
import SpreadsheetMoreMenu from "./SpreadsheetMoreMenu/SpreadsheetMoreMenu.vue";
import SpreadsheetCellSettings from "./SpreadsheetCellSettings/SpreadsheetCellSettings.vue";
import { fileExtension, saveFile, spreadsheetFiles } from "./spreadsheetFiles";
import SpreadsheetCellEditor from "./SpreadsheetCellEditor/SpreadsheetCellEditor.vue";
import SpreadsheetCellMedia from "./SpreadsheetCellMedia/SpreadsheetCellMedia.vue";
import SpreadsheetCommands from "./SpreadsheetCommands/SpreadsheetCommands.vue";
import SpreadsheetColumnDataMenu from "./SpreadsheetColumnDataMenu/SpreadsheetColumnDataMenu.vue";
import SpreadsheetSearchForm from "./SpreadsheetSearchForm/SpreadsheetSearchForm.vue";
import SpreadsheetHistory from "./SpreadsheetHistory/SpreadsheetHistory.vue";
import { useSpreadsheetVersions } from "./useSpreadsheetVersions";
import { provideSpreadsheetMessages } from "./spreadsheetMessages";
import { useSpreadsheetPersistence } from "./useSpreadsheetPersistence";
import { useSpreadsheetColumnDrag } from "./useSpreadsheetColumnDrag";
import { useSpreadsheetRowPointer } from "./useSpreadsheetRowPointer";
import { useSpreadsheetRowMotion } from "./useSpreadsheetRowMotion";
import { maxRowHeight, minRowHeight, useSpreadsheetRowResize } from "./useSpreadsheetRowResize";
import { hiddenAxisMarkers, type HiddenAxisRange } from "./spreadsheetHiddenAxes";
import SpreadsheetHiddenMarker from "./SpreadsheetHiddenMarker/SpreadsheetHiddenMarker.vue";
import { useSpreadsheetSelectionMotion } from "./useSpreadsheetSelectionMotion";
import { useSpreadsheetFullscreenMotion } from "./useSpreadsheetFullscreenMotion";
import { sheetTransitionOptions, useSpreadsheetSheetTransition } from "./useSpreadsheetSheetTransition";
import { spreadsheetAxisAction, spreadsheetAxisMenu } from "./spreadsheetAxisMenu";
import { spreadsheetDetailRows } from "./spreadsheetSortReferences";
import {
  blankSheet,
  cellAddress,
  columnLabel,
  normalizeWorkbook,
  parseAddress,
  parseCellInput,
  sheetLimits,
  sheetWidth,
  updateSheet,
} from "./spreadsheetModel";
import type {
  HysSpreadsheetAction,
  HysSpreadsheetAxis,
  HysSpreadsheetAxisCommand,
  HysSpreadsheetCellChange,
  HysSpreadsheetCellOptions,
  HysSpreadsheetCellContext,
  HysSpreadsheetCollaboration,
  HysSpreadsheetComment,
  HysSpreadsheetCompare,
  HysSpreadsheetContextMenu,
  HysSpreadsheetCustomType,
  HysSpreadsheetConditionalFormat,
  HysSpreadsheetDataCommand,
  HysSpreadsheetDataSource,
  HysSpreadsheetFileFormat,
  HysSpreadsheetFilterFunction,
  HysSpreadsheetFindOptions,
  HysSpreadsheetInstance,
  HysSpreadsheetFillMode,
  HysSpreadsheetPasteMode,
  HysSpreadsheetPresence,
  HysSpreadsheetPlugin,
  HysSpreadsheetValidator,
  HysSpreadsheetCellFormat,
  HysSpreadsheetFormulaFunction,
  HysSpreadsheetPersistence,
  HysSpreadsheetSelection,
  HysSpreadsheetSelectionSummary,
  HysSpreadsheetSheet,
  HysSpreadsheetSheetCommand,
  HysSpreadsheetValue,
  HysSpreadsheetWorkbook,
  HysSpreadsheetVersion,
} from "./spreadsheetTypes";

const CellContent: FunctionalComponent<{
  context: HysProGridCell<GridRow>;
}> = ({ context }): VNodeChild => context.column.render?.(context);

const props = withDefaults(
  defineProps<{
    modelValue?: HysSpreadsheetWorkbook;
    defaultWorkbook?: HysSpreadsheetWorkbook;
    activeSheet?: string;
    readonly?: boolean;
    showEditActions?: boolean;
    locale?: string;
    currency?: string;
    maxHeight?: string | number;
    historyLimit?: number;
    persistence?: HysSpreadsheetPersistence;
    storageKey?: string;
    autosave?: number;
    formulaFunctions?: Readonly<Record<string, HysSpreadsheetFormulaFunction>>;
    sheetTemplates?: Readonly<
      Record<string, Omit<HysSpreadsheetSheet, "id" | "name">>
    >;
    styleTemplates?: Readonly<Record<string, HysSpreadsheetCellFormat>>;
    validators?: Readonly<Record<string, HysSpreadsheetValidator>>;
    cellTypes?: Readonly<Record<string, HysSpreadsheetCustomType>>;
    filters?: Readonly<Record<string, HysSpreadsheetFilterFunction>>;
    compare?: HysSpreadsheetCompare;
    formatValue?: (
      context: HysSpreadsheetCellContext & { text: string },
    ) => string;
    author?: string;
    collaboration?: HysSpreadsheetCollaboration;
    shortcuts?: Readonly<
      Record<string, (spreadsheet: HysSpreadsheetInstance) => void>
    >;
    contextMenu?: HysSpreadsheetContextMenu | false;
    dataSource?: HysSpreadsheetDataSource;
    fileFormats?: readonly HysSpreadsheetFileFormat[];
    plugins?: readonly HysSpreadsheetPlugin[];
    theme?: "light" | "dark";
    messages?: Readonly<Record<string, string>>;
  }>(),
  {
    locale: "zh-CN",
    currency: "CNY",
    maxHeight: 360,
    historyLimit: 50,
    contextMenu: undefined,
  },
);
const emit = defineEmits<{
  "update:modelValue": [workbook: HysSpreadsheetWorkbook];
  "update:activeSheet": [sheetId: string];
  change: [workbook: HysSpreadsheetWorkbook, action: HysSpreadsheetAction];
  selectionChange: [selection: HysSpreadsheetSelection | null];
  save: [workbook: HysSpreadsheetWorkbook];
  open: [workbook: HysSpreadsheetWorkbook];
  persistenceError: [operation: "open" | "save", error: unknown];
  validationError: [errors: Record<string, string>];
  audit: [version: HysSpreadsheetVersion];
  conflict: [message: string];
}>();
const slots = defineSlots<{
  toolbar?: (context: {
    workbook: HysSpreadsheetWorkbook;
    selection: HysSpreadsheetSelection | null;
    spreadsheet: HysSpreadsheetInstance;
  }) => unknown;
  "toolbar-actions"?: (context: {
    workbook: HysSpreadsheetWorkbook;
    selection: HysSpreadsheetSelection | null;
  }) => unknown;
  status?: (context: {
    selection: HysSpreadsheetSelection | null;
    summary: HysSpreadsheetSelectionSummary | null;
    dirty: boolean;
  }) => unknown;
  "status-bar"?: (context: {
    selection: HysSpreadsheetSelection | null;
    summary: HysSpreadsheetSelectionSummary | null;
    dirty: boolean;
  }) => unknown;
  cell?: (
    context: HysSpreadsheetCellContext & { text: string; error?: string },
  ) => unknown;
  editor?: (
    context: HysSpreadsheetCellContext & {
      draft: unknown;
      setDraft(value: unknown): void;
      commit(): Promise<boolean>;
      cancel(): void;
      inputId: string;
    },
  ) => unknown;
}>();

interface GridRow {
  index: number;
  cells: readonly HysSpreadsheetValue[];
}
const inheritedTheme = useHysConfig().theme;
provideHysConfig({
  theme: () =>
    props.theme === "light"
      ? "blue"
      : (props.theme ?? toValue(inheritedTheme) ?? "blue"),
});
const attrs = useHysRootAttrs();
const message = provideSpreadsheetMessages(() => props.messages);
const grid = useTemplateRef<HysProGridInstance>("grid");
const toolbar =
  useTemplateRef<InstanceType<typeof SpreadsheetToolbar>>("toolbar");
const moreMenu =
  useTemplateRef<InstanceType<typeof SpreadsheetMoreMenu>>("moreMenu");
const rowKey = (row: GridRow) => row.index;
const local = shallowRef(normalizeWorkbook(props.defaultWorkbook));
const previous = shallowRef<HysSpreadsheetWorkbook[]>([]);
const next = shallowRef<HysSpreadsheetWorkbook[]>([]);
const localSheet = ref("");
const sheetOrderAnchor = shallowRef<{
  requested: string;
  visible: string;
}>();
let published: HysSpreadsheetWorkbook | undefined;
const book = computed(() => {
  if (!props.modelValue) return local.value;
  return toRaw(props.modelValue) === published
    ? published!
    : normalizeWorkbook(props.modelValue);
});
const history = useSpreadsheetVersions(
  () => book.value,
  () => (Number.isFinite(props.historyLimit) ? props.historyLimit : 50),
);
const versions = history.versions;
history.record(book.value, "open", props.author);
function recordVersion(
  workbook: HysSpreadsheetWorkbook,
  action: HysSpreadsheetVersion["action"],
  author = props.author,
) {
  emit("audit", history.record(workbook, action, author));
}
function syncPresence(value: HysSpreadsheetSelection | null, editing?: string) {
  try {
    props.collaboration?.presence(value, editing);
  } catch {
    conflict(message("无法同步协作选区。"));
  }
}
const collaborators = shallowRef<readonly HysSpreadsheetPresence[]>([]);
const editingAddress = ref<string>();
let revision: string | undefined;
let disconnect: (() => void) | undefined;
function conflict(message: string) {
  feedback.value = message;
  emit("conflict", message);
}
function connect() {
  disconnect?.();
  revision = undefined;
  collaborators.value = [];
  disconnect = props.collaboration?.connect({
    update(workbook, incomingRevision, author) {
      revision = incomingRevision;
      const incoming = normalizeWorkbook(workbook);
      if (JSON.stringify(incoming) === JSON.stringify(book.value)) return;
      if (grid.value?.editing) {
        grid.value.cancelEdit();
        conflict("协作更新已到达，当前单元格的编辑已取消。");
      }
      previous.value = [];
      next.value = [];
      evaluationBook.value = incoming;
      publish(incoming, "open", { action: "remote", author });
      storage.markSaved(incoming);
    },
    presence(users) {
      collaborators.value = [...users];
    },
    conflict,
  });
}
onMounted(connect);
onBeforeUnmount(() => disconnect?.());
watch(() => props.collaboration, connect);
const sheet = computed(() => {
  const requested = props.activeSheet ?? localSheet.value;
  const anchor = sheetOrderAnchor.value;
  const visible = book.value.sheets.filter(({ hidden }) => !hidden);
  return (
    visible.find(({ id }) => id === requested) ??
    (anchor?.requested === requested
      ? visible.find(({ id }) => id === anchor.visible)
      : undefined) ??
    visible[0]!
  );
});
watch(
  () => props.activeSheet,
  () => {
    sheetOrderAnchor.value = undefined;
  },
);
const editingDisabled = computed(
  () =>
    !!(
      props.readonly ||
      (sheet.value.protected && sheet.value.protectionMode !== "excel") ||
      sheet.value.unloaded ||
      busy.value === "open"
    ),
);
const rowCount = computed(() => sheet.value.rows.length);
const width = computed(() => sheetWidth(sheet.value));
let cachedSheetRows = new WeakMap<
  readonly HysSpreadsheetValue[],
  Map<number, GridRow>
>();
watch(
  () => sheet.value.id,
  () => {
    cachedSheetRows = new WeakMap();
  },
);
function gridRow(cells: readonly HysSpreadsheetValue[], index: number) {
  let cached = cachedSheetRows.get(cells);
  if (!cached) cachedSheetRows.set(cells, (cached = new Map()));
  let row = cached.get(index);
  if (!row) cached.set(index, (row = { cells, index }));
  return row;
}
const rowData = computed(() => {
  const current = sheet.value;
  const details = current.filters?.length
    ? spreadsheetDetailRows(current, !!current.filterHeader)
    : undefined;
  return current.rows.flatMap((cells, index) =>
    axisHidden(current, "row", index) ||
    (details && index >= details.top && index <= details.bottom &&
      filtered(current, index, calculate.value, props.filters))
      ? []
      : [gridRow(cells, index)],
  );
});
const hiddenRowMarkers = computed(() =>
  sheet.value.rowOptions
    ? hiddenAxisMarkers(sheet.value, "row", rowData.value.map(({ index }) => index))
    : undefined,
);
const hiddenColumnMarkers = computed(() =>
  sheet.value.columnOptions
    ? hiddenAxisMarkers(sheet.value, "column", columns.value.map(({ key }) => Number(key)))
    : undefined,
);

function revealHiddenAxis(axis: HysSpreadsheetAxis, range: HiddenAxisRange, anchor: number) {
  const active = sheet.value;
  if (editingDisabled.value || active.protected) return;
  const key = axis === "row" ? "rowOptions" : "columnOptions";
  const options = { ...active[key] };
  for (const index of range.indices)
    options[index] = { ...options[index], hidden: false };
  const animate = captureAxisVisibility(axis);
  replaceSheet({ ...active, [key]: options }, "structure", { preserveSelection: true });
  animate(published);
  void nextTick(() => {
    if (sheet.value.id !== active.id) return;
    const selector = axis === "row"
      ? `[data-sheet-row="${anchor}"] .hys-ui-spreadsheet-row-select`
      : `thead th[data-column-key="${anchor}"] .hys-ui-spreadsheet-header-button`;
    gridSurface.value?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  });
}
const dataGroups = computed(() =>
  groupedRows(
    sheet.value,
    sheet.value.groupColumn,
    rowData.value.map(({ index }) => index),
    calculate.value,
  ),
);
const compiled = new Map<string, ReturnType<typeof compileFormula>>();
const evaluationBook = shallowRef(book.value);
let calculationChange:
  | {
      workbook: HysSpreadsheetWorkbook;
      previous: HysSpreadsheetWorkbook;
      sheetId: string;
      positions: number[];
    }
  | undefined;
let lastEvaluator: ReturnType<typeof evaluateWorkbook> | undefined;
let lastFormulaFunctions = props.formulaFunctions;
const calculationRevision = ref(0);
function recalculate() {
  evaluationBook.value = book.value;
  calculationChange = undefined;
  calculationRevision.value++;
}
watch(
  book,
  (value) => {
    if (value.calculationMode !== "manual") evaluationBook.value = value;
  },
  { flush: "sync" },
);
const evaluator = computed(() => {
  void calculationRevision.value;
  const workbook = evaluationBook.value;
  const functions = props.formulaFunctions;
  const previous = lastEvaluator?.snapshot;
  const change = calculationChange;
  const incremental =
    change &&
    previous &&
    change.workbook === workbook &&
    change.previous === previous.workbook &&
    lastFormulaFunctions === functions;
  lastEvaluator = evaluateWorkbook(
    workbook,
    functions,
    compiled,
    incremental ? previous : undefined,
    incremental ? change : undefined,
  );
  lastFormulaFunctions = functions;
  return lastEvaluator;
});
const calculate = computed(() => {
  const evaluate = evaluator.value;
  const active = sheet.value;
  return (row: number, column: number) => {
    const raw = active.rows[row]?.[column] ?? null;
    if (typeof raw !== "string" || !raw.startsWith("=")) {
      const previous = evaluate(active, row, column);
      if (
        raw === null &&
        !previous.error &&
        evaluationBook.value === book.value
      )
        return previous;
      return {
        value:
          typeof raw === "string" && raw.startsWith("'") ? raw.slice(1) : raw,
      };
    }
    const result = evaluate(active, row, column);
    return evaluationBook.value === book.value || result.error !== "#REF!"
      ? result
      : { value: null };
  };
});
const conditional = computed(() =>
  conditionalCells(sheet.value, calculate.value, (formula, row, column) => {
    const source = offsetFormula(formula, row, column).replace(/^=/, "");
    try {
      const expression = compileFormula(source.trim());
      const context: Parameters<typeof expression>[0] = {
        read(qualifier, first, last) {
          const target = qualifier
            ? book.value.sheets.find(
                ({ name }) => name.toLowerCase() === qualifier.toLowerCase(),
              )
            : sheet.value;
          if (!target) throw new Error("#REF!");
          const evaluate = (row: number, column: number) => {
            const result = evaluator.value(target, row, column);
            if (result.error) throw new Error(result.error);
            return result.value;
          };
          if (!last) return evaluate(first.row, first.column);
          return points({
            top: Math.min(first.row, last.row),
            bottom: Math.max(first.row, last.row),
            left: Math.min(first.column, last.column),
            right: Math.max(first.column, last.column),
          }).map(({ row, column }) => evaluate(row, column));
        },
        named(name) {
          const range = book.value.names?.[name];
          const target =
            range && book.value.sheets.find(({ id }) => id === range.sheetId);
          if (!target || !range) throw new Error("#NAME?");
          const [start, end] = range.range.split(":");
          const first = parseAddress(start);
          const last = end ? parseAddress(end) : undefined;
          if (!first) throw new Error("#REF!");
          return context.read(target.name, first, last);
        },
        call: (name, args) =>
          callFormula(name, args, context, props.formulaFunctions?.[name]),
      };
      const output = expression(context);
      return Array.isArray(output) ? !!output[0] : !!output;
    } catch {
      return false;
    }
  }),
);
const spans = computed(() => {
  const result = new Map<string, { rows: number; columns: number }>();
  if (!sheet.value.merges?.length) return result;
  const rows = rowData.value.map(({ index }) => index);
  const cols = columns.value.map(({ key }) => Number(key));
  for (const range of sheet.value.merges) {
    const [first, last] = range.split(":");
    const area = areaFromAddresses(first, last);
    if (!area) continue;
    const visibleRows = rows.filter(
      (row) => row >= area.top && row <= area.bottom,
    );
    const visibleColumns = cols.filter(
      (column) => column >= area.left && column <= area.right,
    );
    if (!visibleRows.includes(area.top) || !visibleColumns.includes(area.left))
      continue;
    for (const row of visibleRows)
      for (const column of visibleColumns)
        result.set(
          cellAddress(row, column),
          row === area.top && column === area.left
            ? { rows: visibleRows.length, columns: visibleColumns.length }
            : { rows: 0, columns: 0 },
        );
  }
  return result;
});
const remoteSelections = computed(() =>
  collaborators.value.flatMap((person) => {
    const selection = person.selection;
    if (!selection || selection.sheetId !== sheet.value.id) return [];
    const area = areaFromAddresses(selection.anchor, selection.focus);
    return area ? [{ area, person, anchor: selection.anchor }] : [];
  }),
);
const range = shallowRef<HysProGridRange | null>(null);
const additionalRanges = shallowRef<{ anchor: string; focus: string }[]>([]);
const selectionAxis = ref<HysSpreadsheetAxis | "all" | null>(null);
const sheetViews = new Map<
  string,
  {
    top: number;
    left: number;
    range: HysProGridRange | null;
    additional: { anchor: string; focus: string }[];
    axis: typeof selectionAxis.value;
  }
>();
watch(
  () => sheet.value.id,
  (id, previous) => {
    const current = root.value?.querySelector<HTMLElement>(
      ".hys-ui-pf-grid-scroll",
    );
    if (current)
      sheetViews.set(previous, {
        top: current.scrollTop,
        left: current.scrollLeft,
        range: range.value,
        additional: additionalRanges.value,
        axis: selectionAxis.value,
      });
    searchResults.value = [];
    const saved = sheetViews.get(id);
    if (!saved) return;
    void nextTick(() => {
      if (sheet.value.id !== id) return;
      const scroller = root.value?.querySelector<HTMLElement>(
        ".hys-ui-pf-grid-scroll",
      );
      if (scroller) {
        scroller.scrollTop = saved.top;
        scroller.scrollLeft = saved.left;
        scroller.dispatchEvent(new Event("scroll"));
      }
      if (
        saved.range &&
        clipboard.selectRange(saved.range.anchor, saved.range.focus)
      ) {
        additionalRanges.value = saved.additional;
        selectionAxis.value = saved.axis;
      }
    });
  },
);
const feedback = ref("");
const loadingSheet = ref(false);
let loading: AbortController | undefined;
let mounted = false;
async function loadActiveSheet() {
  loading?.abort();
  loadingSheet.value = false;
  if (!mounted || !props.dataSource || !sheet.value.unloaded) return;
  const original = sheet.value;
  const task = (loading = new AbortController());
  loadingSheet.value = true;
  try {
    const loaded = await props.dataSource.loadSheet(original, task.signal);
    if (
      task.signal.aborted ||
      sheet.value.id !== original.id ||
      !sheet.value.unloaded
    )
      return;
    const workbook = normalizeWorkbook({
      ...book.value,
      sheets: book.value.sheets.map((item) =>
        item.id === original.id
          ? { ...item, ...loaded, id: item.id, unloaded: false }
          : item,
      ),
    });
    publish(workbook, "open", { action: "remote" });
  } catch {
    if (!task.signal.aborted) feedback.value = "无法加载工作表。";
  } finally {
    if (loading === task) {
      loading = undefined;
      loadingSheet.value = false;
    }
  }
}
onMounted(() => {
  mounted = true;
  void loadActiveSheet();
});
onBeforeUnmount(() => {
  mounted = false;
  loading?.abort();
});
watch(
  [() => sheet.value.id, () => sheet.value.unloaded, () => props.dataSource],
  loadActiveSheet,
);
const invalid = shallowRef<Record<string, string>>({});
watch(
  () => sheet.value.id,
  () => (invalid.value = {}),
);
const lastCopy = shallowRef<{
  text: string;
  rows: HysSpreadsheetValue[][];
  formats: (HysSpreadsheetCellFormat | undefined)[][];
  values: HysSpreadsheetValue[][];
  top: number;
  left: number;
}>();
const formatBrush = shallowRef<HysSpreadsheetCellFormat>();
const searchResults = shallowRef<string[]>([]);
const searchResultOptions = computed(() =>
  searchResults.value.map((address) => ({ value: address, label: address })),
);
const findResults = shallowRef<string[]>([]);
const findFeedback = ref("");
watch(
  () => sheet.value.id,
  () => {
    findResults.value = [];
    findFeedback.value = "";
  },
);
const findRanges = computed(() => {
  const current = selection.value;
  if (!current) return [];
  return [current, ...(current.additional ?? [])].map(({ anchor, focus }) =>
    anchor === focus ? anchor : `${anchor}:${focus}`,
  );
});
const zoom = ref(100);
const appliedZoom = ref(100);
const fullscreen = ref(false);
const root = useTemplateRef<HTMLElement>("spreadsheetRoot");
const gridSurface = useTemplateRef<HTMLElement>("gridSurface");
const { effectiveMotion } = useMotion();
const setFullscreen = useSpreadsheetFullscreenMotion(root, fullscreen, effectiveMotion);
const sheetTransition = ref<(typeof sheetTransitionOptions)[number][0]>("slide");
const sheetTransitionChoices = computed(() =>
  sheetTransitionOptions.map(([value, label]) => ({ value, label: message(label) })),
);
const cancelSheetTransition = useSpreadsheetSheetTransition(
  gridSurface,
  sheetTransition,
  effectiveMotion,
  () => sheet.value.id,
  () => book.value.sheets.filter(({ hidden }) => !hidden).map(({ id }) => id),
);
watch([appliedZoom, fullscreen], cancelSheetTransition);

const selectionMotion = useSpreadsheetSelectionMotion();
watch(appliedZoom, selectionMotion.cancel);
const gridScroller = () => gridSurface.value?.querySelector<HTMLElement>(".hys-ui-pf-grid-scroll");
const columnMotion = useGridColumnMotion(gridScroller);
const rowMotion = useSpreadsheetRowMotion(gridScroller);
watch([appliedZoom, () => sheet.value.id], () => {
  columnMotion.cancel();
  rowMotion.cancel();
});
const dragPoint = shallowRef<{
  type: "fill" | "move";
  row: number;
  column: number;
  sheetId: string;
}>();
const formulaText = ref("");
const addressText = ref("");
const storage = useSpreadsheetPersistence(
  () => book.value,
  props,
  (workbook) => {
    replaceWorkbook(workbook);
    emit("open", workbook);
    feedback.value = message("已打开工作簿");
  },
  (workbook) => {
    recordVersion(workbook, "save");
    emit("save", workbook);
    feedback.value = message("已保存工作簿");
  },
  (operation, error) => {
    emit("persistenceError", operation, error);
    feedback.value =
      error instanceof Error
        ? message(error.message)
        : message("工作簿操作失败。");
  },
);
const { busy, dirty, canSave, canLoad } = storage;
const canReorderColumns = computed(
  () => !editingDisabled.value && !sheet.value.protected,
);
const columnDataMenu = shallowRef<{
  mode: "sort" | "filter";
  column: number;
  label: string;
  anchor: HTMLElement;
}>();
function closeColumnDataMenu() {
  columnDataMenu.value = undefined;
}
function openColumnDataMenu(
  mode: "sort" | "filter",
  key: string,
  label: string,
  event: MouseEvent,
) {
  if (!canReorderColumns.value) return;
  const anchor = event.currentTarget as HTMLElement;
  columnDataMenu.value = columnDataMenu.value?.anchor === anchor
    ? undefined
    : { mode, column: Number(key), label, anchor };
}
function columnDataLabel(mode: "sort" | "filter", label: string) {
  return message(mode === "sort" ? "排序 {column} 列" : "筛选 {column} 列")
    .replace("{column}", label);
}
watch([sheet, canReorderColumns], closeColumnDataMenu);
const columnDrag = useSpreadsheetColumnDrag(
  () => sheet.value,
  () => canReorderColumns.value,
  moveSheetColumn,
  columnMotion.cancel,
);
const rowPointer = useSpreadsheetRowPointer(
  () => sheet.value,
  canMoveSelectedRow,
  (index, extend, focus) => selectHeader("row", index, extend, focus),
  (index, event) => activateHeader("row", index, event),
  moveSelectedRow,
);
const rowResize = useSpreadsheetRowResize(
  () => canReorderColumns.value,
  () => sheet.value,
  (index, height) => setAxisSizes("row", index, height),
);
watch(appliedZoom, rowResize.cancel);
const formats = computed(() =>
  spreadsheetFiles(props.fileFormats, {
    currency: props.currency,
    formulaFunctions: props.formulaFunctions,
  }),
);
const suggestions = computed(() => {
  const token =
    /^=.*?(?:[^\p{L}\p{N}_]|^)([a-z_][a-z\d_]*)$/iu.exec(
      formulaText.value,
    )?.[1] ?? /^=([a-z_][a-z\d_]*)$/i.exec(formulaText.value)?.[1];
  if (!token) return [];
  const name = token.toUpperCase();
  return [
    ...new Set([
      ...builtinFormulaNames,
      ...Object.keys(props.formulaFunctions ?? {}).map((key) =>
        key.toUpperCase(),
      ),
    ]),
  ]
    .filter((key) => key.startsWith(name))
    .slice(0, 6);
});
const formulaSyntax = computed(() => {
  if (!formulaText.value.startsWith("=")) return "";
  const formula = formulaText.value.slice(1).trim();
  try {
    compileFormula(formula);
    return "";
  } catch {
    return message(
      "公式语法不完整或无效。函数参数用逗号分隔，例如 =SUM(A1:A3)。",
    );
  }
});
function completeFormula(name: string) {
  formulaText.value = formulaText.value.replace(
    /[a-z_][a-z\d_]*$/i,
    name + "(",
  );
}
const gridOptions = computed(() => ({
  selectable: false,
  pagination: false,
  rowNumbers: true,
  showToolbar: false,
  stickyHeader: true,
  fillRemainingWidth: true,
  cellTooltip: false,
  maxHeight: fullscreen.value ? undefined : props.maxHeight,
  loading: loadingSheet.value,
  virtualRows:
    rowData.value.length > 100 &&
    !sheet.value.merges?.length &&
    !sheet.value.frozenRows
      ? {
          height: (row: GridRow) =>
            sheet.value.rowOptions?.[row.index]?.size ?? 35,
        }
      : undefined,
  virtualColumns: width.value > 25 && !sheet.value.merges?.length,
  columnOrder: columns.value.map(({ key }) => key),
  contextMenu: props.contextMenu !== false ? contextItems : (false as const),
  headerMenuButton: false,
  cellSpan: ({ row, column }: { row: GridRow; column: { key: string } }) =>
    spans.value.get(cellAddress(row.index, Number(column.key))),
  rowStyle: spreadsheetRowStyle,
  rowClassName: ({ row }: { row: GridRow }) =>
    sheet.value.rowOptions?.[row.index]?.size !== undefined ? "hys-ui-spreadsheet-row-sized" : undefined,
  cellStyle: spreadsheetCellStyle,
  headerClassName: ({ column }: { column: { key: string } }) =>
    columnDrag.headerClass(Number(column.key)),
  commitColumnWidth: resizeSheetColumn,
}));
function spreadsheetRowStyle({ row }: { row: GridRow }) {
  const height = sheet.value.rowOptions?.[row.index]?.size;
  if (height === undefined) return;
  return { height: `${height}px`, "--hys-sheet-row-height": `${height}px` };
}
function spreadsheetCellStyle({
  row,
  column,
}: {
  row: GridRow;
  column: { key: string };
}) {
  const index = Number(column.key);
  const active = sheet.value;
  const address = cellAddress(row.index, index);
  const appearance = conditional.value(row.index, index);
  const remote = remoteSelections.value.find(
    ({ area }) =>
      row.index >= area.top &&
      row.index <= area.bottom &&
      index >= area.left &&
      index <= area.right,
  );
  let top = 33;
  for (
    let line = 0;
    line < row.index && line < (active.frozenRows ?? 0);
    line++
  )
    if (!axisHidden(active, "row", line))
      top += active.rowOptions?.[line]?.size ?? 35;
  return {
    ...formatStyle(
      appearance
        ? { ...active.formats?.[address], ...appearance.format }
        : active.formats?.[address],
    ),
    backgroundImage: appearance?.backgroundImage,
    "--hys-ui-spreadsheet-cell-image": appearance?.backgroundImage,
    boxShadow: remote
      ? `inset 0 0 0 ${remote.anchor === address ? 2 : 1}px ${remote.person.color || "var(--hys-ui-theme-primary)"}`
      : undefined,
    ...(row.index < (active.frozenRows ?? 0)
      ? {
          position: "sticky" as const,
          top: `${top}px`,
          zIndex: 2,
          backgroundColor:
            appearance?.format?.backgroundColor ??
            active.formats?.[address]?.backgroundColor ??
            "var(--hys-ui-theme-surface)",
        }
      : {}),
    ...(index < (active.frozenColumns ?? 0)
      ? {
          backgroundColor:
            appearance?.format?.backgroundColor ??
            active.formats?.[address]?.backgroundColor ??
            "var(--hys-ui-theme-surface)",
        }
      : {}),
  };
}
const tabs = computed(() =>
  book.value.sheets.map(({ id, name, hidden, protected: locked }) => ({
    value: id,
    label: name,
    hidden,
    icon: locked ? LockKeyhole : undefined,
  })),
);
const canReorderSheetTabs = computed(
  () =>
    !props.readonly &&
    busy.value !== "open" &&
    tabs.value.filter(({ hidden }) => !hidden).length > 1,
);
const sheetTabs = useTemplateRef<InstanceType<typeof HysTabs>>("sheetTabs");
const sheetTabMenu =
  useTemplateRef<InstanceType<typeof SpreadsheetTabMenu>>("sheetTabMenu");

function openSheetTabMenu(
  id: string | number,
  event: MouseEvent | KeyboardEvent | PointerEvent,
) {
  void sheetTabMenu.value?.show(String(id), event);
}

function requestSheetDelete(id: string, event: MouseEvent) {
  const trigger = event.currentTarget;
  sheetTabMenu.value?.requestDelete(id, () => {
    if (
      trigger instanceof HTMLButtonElement &&
      !trigger.disabled &&
      trigger.getClientRects().length
    )
      trigger.focus({ preventScroll: true });
    else toolbar.value?.focusCommand("sheets");
  });
}

function focusSheetTab(id?: string) {
  const visible = book.value.sheets.some(
    (item) => !item.hidden && item.id === id,
  );
  sheetTabs.value?.focus(visible ? id : sheet.value.id);
}

function reorderSheetTab({ value, to }: HysTabOrderContext) {
  manageSheet({ type: "move", id: String(value), index: to });
}
const selection = computed<HysSpreadsheetSelection | null>(
  () =>
    range.value && {
      sheetId: sheet.value.id,
      anchor: cellAddress(
        Number(range.value.anchor.rowKey),
        Number(range.value.anchor.columnKey),
      ),
      focus: cellAddress(
        Number(range.value.focus.rowKey),
        Number(range.value.focus.columnKey),
      ),
      ...(additionalRanges.value.length
        ? { additional: additionalRanges.value }
        : {}),
    },
);
const selectedFormat = computed(
  () => selection.value && sheet.value.formats?.[selection.value.anchor],
);
const selectedEditable = computed(
  () =>
    !editingDisabled.value &&
    !!selectedPoint.value &&
    editableCell(selectedPoint.value.row, selectedPoint.value.column),
);
const comments = computed(() =>
  selection.value
    ? (sheet.value.cells?.[selection.value.anchor]?.comments ?? [])
    : [],
);
function addComment(text: string, parentId?: string) {
  const point = selectedPoint.value;
  if (
    !point ||
    editingDisabled.value ||
    !canEdit(sheet.value, point.row, point.column) ||
    !text.trim() ||
    (parentId && !comments.value.some(({ id }) => id === parentId))
  )
    return false;
  const comment: HysSpreadsheetComment = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    author: props.author || "当前用户",
    text: text.trim(),
    createdAt: Date.now(),
    parentId,
    mentions: [
      ...new Set(
        [...text.matchAll(/@([\p{L}\p{N}_.-]+)/gu)].map((match) => match[1]),
      ),
    ],
  };
  return updateComments([...comments.value, comment]);
}
function resolveComment(id: string, resolved = true) {
  const point = selectedPoint.value;
  if (
    !point ||
    !canEdit(sheet.value, point.row, point.column) ||
    !comments.value.some((item) => item.id === id)
  )
    return false;
  return updateComments(
    comments.value.map((comment) =>
      comment.id === id ? { ...comment, resolved } : comment,
    ),
  );
}
function updateComments(comments: readonly HysSpreadsheetComment[]) {
  const address = selection.value?.anchor;
  if (!address || editingDisabled.value) return false;
  replaceSheet(
    {
      ...sheet.value,
      cells: {
        ...sheet.value.cells,
        [address]: { ...sheet.value.cells?.[address], comments },
      },
    },
    "structure",
    { preserveSelection: true },
  );
  return true;
}
function restoreVersion(id: string) {
  const target = versions.value.find((version) => version.id === id);
  if (!target || props.readonly) return false;
  update(target.workbook, "structure", "restore");
  return true;
}
const selectionAddress = computed(() => {
  const value = selection.value;
  return !value
    ? ""
    : value.anchor === value.focus
      ? value.anchor
      : `${value.anchor}:${value.focus}`;
});
const selectedPoint = computed(() =>
  selection.value ? parseAddress(selection.value.anchor) : undefined,
);
watch(selectionAddress, (value) => (addressText.value = value), {
  immediate: true,
});
const rectangle = computed(() => {
  const selected = range.value;
  if (!selected) return;
  const rows = [Number(selected.anchor.rowKey), Number(selected.focus.rowKey)];
  const columns = [
    Number(selected.anchor.columnKey),
    Number(selected.focus.columnKey),
  ];
  return {
    top: Math.min(...rows),
    bottom: Math.max(...rows),
    left: Math.min(...columns),
    right: Math.max(...columns),
  };
});
const selectionAreas = computed(() => {
  if (!rectangle.value) return [];
  return [
    rectangle.value,
    ...additionalRanges.value.flatMap(({ anchor, focus }) => {
      const area = areaFromAddresses(anchor, focus);
      return area ? [area] : [];
    }),
  ];
});
const selectedCells = computed(() => {
  if (!selectionAreas.value.length) return [];
  const cells = new Map<number, { row: number; column: number }>();
  const rowKeys = new Set(rowData.value.map(({ index }) => index));
  const columnKeys = new Set(columns.value.map(({ key }) => Number(key)));
  for (const area of selectionAreas.value)
    for (const point of points(area)) {
      if (rowKeys.has(point.row) && columnKeys.has(point.column))
        cells.set(point.row * width.value + point.column, point);
    }
  return [...cells.values()];
});
const summary = computed<HysSpreadsheetSelectionSummary | null>(() => {
  const area = rectangle.value;
  if (!area) return null;
  let nonEmpty = 0,
    numeric = 0,
    sum = 0,
    min = Infinity,
    max = -Infinity;
  for (const { row, column } of selectedCells.value) {
    const result = calculate.value(row, column);
    if (result.error || (result.value !== null && result.value !== ""))
      nonEmpty++;
    if (typeof result.value === "number" && Number.isFinite(result.value)) {
      numeric++;
      sum += result.value;
      min = Math.min(min, result.value);
      max = Math.max(max, result.value);
    }
  }
  return {
    cells: selectedCells.value.length,
    nonEmpty,
    numeric,
    sum,
    average: numeric ? sum / numeric : null,
    min: numeric ? min : null,
    max: numeric ? max : null,
  };
});
const summaryNumber = computed(() => {
  const options = { maximumFractionDigits: 4 };
  try {
    return new Intl.NumberFormat(props.locale, options);
  } catch {
    return new Intl.NumberFormat("zh-CN", options);
  }
});
const clipboard = createProGridClipboard<GridRow>({
  maxSelectionCells: sheetLimits.rows * sheetLimits.columns,
  additionalRanges: () =>
    additionalRanges.value.flatMap(({ anchor, focus }) => {
      const first = parseAddress(anchor),
        last = parseAddress(focus);
      return first && last
        ? [
            {
              anchor: { rowKey: first.row, columnKey: String(first.column) },
              focus: { rowKey: last.row, columnKey: String(last.column) },
            },
          ]
        : [];
    }),
  onSelectionChange(value) {
    selectionMotion.syncSelection();
    range.value = value;
    if (!value || selectionAxis.value) additionalRanges.value = [];
    selectionAxis.value = null;
  },
  saveBatch(changes) {
    return checkValues(gridChanges(changes));
  },
  onPaste(result) {
    feedback.value = result.ok ? `已粘贴 ${result.count} 格` : result.message;
  },
  formatCopy: ({ value }) => String(value ?? ""),
});

const columnStates = computed(() => {
  const sorts = new Map<number, { direction: "asc" | "desc"; rank: number }>();
  for (const key of sheet.value.sortKeys ?? []) {
    if (key.column >= 0 && key.column < width.value && !sorts.has(key.column))
      sorts.set(key.column, {
        direction: key.direction ?? "asc",
        rank: sorts.size + 1,
      });
  }
  const filters = new Set(sheet.value.filters?.map(({ column }) => column));
  return new Map(Array.from({ length: width.value }, (_, column) => {
    const sort = sorts.get(column);
    const filtered = filters.has(column);
    const details: string[] = [];
    if (sheet.value.columnOptions?.[column]?.locked)
      details.push(message("此列已锁定"));
    if (sort) {
      details.push(message(sort.direction === "asc" ? "已按升序排序" : "已按降序排序"));
      if (sorts.size > 1)
        details.push(message("排序优先级 {rank}").replace("{rank}", String(sort.rank)));
    }
    if (filtered) details.push(message("已应用筛选"));
    return [String(column), {
      direction: sort?.direction,
      filtered,
      rank: sorts.size > 1 ? sort?.rank : undefined,
      description: details.join("，") || undefined,
    }] as const;
  }));
});

const columns = computed<HysProGridColumn<GridRow>[]>(() => [
  ...Array.from(
    { length: width.value },
    (_, index): HysProGridColumn<GridRow> => ({
      key: String(index),
      label: sheet.value.columnOptions?.[index]?.label ?? columnLabel(index),
      width: sheet.value.columnOptions?.[index]?.size ?? 124,
      minWidth: 16,
      maxWidth: 1000,
      pinned: index < (sheet.value.frozenColumns ?? 0) ? "left" : undefined,
      sortable: false,
      filterable: false,
      resizable: canReorderColumns.value,
      reorderable: false,
      field: (row) => row.cells[index] ?? null,
      editor: Object.keys(sheet.value.cells ?? {}).some((address) => {
        const type = sheet.value.cells?.[address]?.type;
        return (
          !!type && type !== "auto" && parseAddress(address)?.column === index
        );
      })
        ? {
            type: "custom",
            parse(draft, { row }) {
              return parseDraft(draft, row.index, index);
            },
            toDraft({ row, value }) {
              const address = cellAddress(row.index, index);
              const type = cellType(address);
              if (type?.toDraft)
                return type.toDraft({
                  sheet: sheet.value,
                  address,
                  row: row.index,
                  column: index,
                  value: value as HysSpreadsheetValue,
                });
              return typeof value === "string" && value.startsWith("'")
                ? value.slice(1)
                : String(value ?? "");
            },
          }
        : { type: "text" },
      canEdit: ({ row }) => editableCell(row.index, index),
      validate: (change) => {
        const row = change.row.index;
        const value =
          change.editor === "text"
            ? parseCellInput(change.value)
            : (change.value as HysSpreadsheetValue);
        const changes = [{ row, column: index, value }];
        const candidate = withValues(sheet.value, changes);
        for (const point of affectedCells(candidate, changes)) {
          const error = validateCell(
            candidate,
            point.row,
            point.column,
            props.validators,
          );
          if (error) return error;
        }
      },
      render: ({ row }) => {
        const address = cellAddress(row.index, index);
        const result = calculate.value(row.index, index);
        const appearance = conditional.value(row.index, index);
        const format = {
          ...sheet.value.formats?.[address],
          ...appearance?.format,
        };
        const options = sheet.value.cells?.[address];
        const original =
          result.error ??
          displayValue(result.value, format, props.locale, props.currency);
        const context = {
          sheet: sheet.value,
          row: row.index,
          column: index,
          address,
          value: result.value,
          text: original,
        };
        const text =
          (appearance?.icon ? appearance.icon + " " : "") +
          (props.formatValue?.(context) ?? original);
        const error = result.error || invalid.value[address];
        const tooltip = [
          error,
          options?.tooltip,
          options?.note,
          options?.validation?.prompt,
          ...(options?.comments
            ?.filter(({ resolved }) => !resolved)
            .map(({ author, text }) => `${author} · ${text}`) ?? []),
        ]
          .filter(Boolean)
          .join("\n");
        const link = safeLink(options?.link);
        const content = h(
          link ? "a" : "span",
          {
            href: link,
            "aria-invalid": error ? "true" : undefined,
            style: {
              ...formatStyle(format),
              display: format.rotation ? "inline-block" : undefined,
              transform: format.rotation
                ? `rotate(${format.rotation}deg)`
                : undefined,
            },
            class: {
              "hys-ui-spreadsheet-number": typeof result.value === "number",
              "hys-ui-spreadsheet-error": !!error,
              "hys-ui-spreadsheet-bold": format?.bold,
            },
          },
          (slots.cell?.({ ...context, text, error }) as ReturnType<typeof h>) ??
            (options?.media
              ? h(SpreadsheetCellMedia, { media: options.media })
              : text),
        );
        return tooltip
          ? h(
              HysTooltip,
              {
                text: tooltip,
                showDelay: 280,
                triggerKeys: [],
                class: "hys-ui-spreadsheet-cell-tooltip",
                contentStyle: { whiteSpace: "pre-line" },
              },
              { default: () => content },
            )
          : content;
      },
    }),
  ).filter(({ key }) => !axisHidden(sheet.value, "column", Number(key))),
]);

function cellType(address: string) {
  const options = sheet.value.cells?.[address];
  const name = options?.type === "custom" ? options.typeName : undefined;
  return props.cellTypes && name && Object.hasOwn(props.cellTypes, name)
    ? props.cellTypes[name]
    : undefined;
}

function editableCell(row: number, column: number) {
  const active = sheet.value;
  const address = cellAddress(row, column);
  return (
    canEdit(active, row, column) &&
    !collaborators.value.some(
      (user) =>
        user.selection?.sheetId === active.id && user.editing === address,
    )
  );
}

function parseDraft(draft: unknown, row: number, column: number) {
  const address = cellAddress(row, column);
  const type = cellType(address);
  if (type)
    return type.parse(draft, {
      sheet: sheet.value,
      address,
      row,
      column,
      value: sheet.value.rows[row]?.[column] ?? null,
    });
  return {
    ok: true as const,
    value: parseTyped(String(draft ?? ""), sheet.value.cells?.[address]),
  };
}

watch(selection, (value) => {
  emit("selectionChange", value);
  syncPresence(value, editingAddress.value);
});
function editingStarted(cell: HysProGridCell<GridRow>) {
  selectionMotion.cancel();
  editingAddress.value = cellAddress(cell.row.index, Number(cell.column.key));
  syncPresence(selection.value, editingAddress.value);
}
function editingEnded() {
  if (!editingAddress.value) return;
  editingAddress.value = undefined;
  syncPresence(selection.value);
}
watch([range, sheet], () => {
  const anchor = range.value?.anchor;
  formulaText.value = anchor
    ? String(
        sheet.value.rows[Number(anchor.rowKey)]?.[Number(anchor.columnKey)] ??
          "",
      )
    : "";
});

watch(
  () => props.modelValue,
  (value) => {
    if (value && toRaw(value) === published) return;
    previous.value = [];
    next.value = [];
    recalculate();
    storage.markSaved();
  },
);

function publish(
  value: HysSpreadsheetWorkbook,
  action: HysSpreadsheetAction,
  audit?: { action: HysSpreadsheetVersion["action"]; author?: string },
  preserveSelection = action !== "structure" && action !== "open",
) {
  published = value;
  const selected = range.value;
  const selectedAxis = selectionAxis.value;
  const extra = additionalRanges.value;
  const sheetId = sheet.value.id;
  if (!props.modelValue) local.value = value;
  emit("update:modelValue", value);
  emit("change", value, action);
  recordVersion(value, audit?.action ?? action, audit?.author);
  if (audit?.action !== "remote") {
    try {
      props.collaboration?.update(value, revision);
    } catch {
      conflict(message("无法同步工作簿修改。"));
    }
  }
  if (selected && preserveSelection)
    void nextTick(() => {
      if (
        sheet.value.id === sheetId &&
        !range.value &&
        clipboard.selectRange(selected.anchor, selected.focus)
      ) {
        additionalRanges.value = extra;
        selectionAxis.value = selectedAxis;
      }
    });
}

function update(
  value: HysSpreadsheetWorkbook,
  action: "edit" | "paste" | "format" | "structure",
  audit?: "restore",
  preserveSelection?: boolean,
) {
  const limit = Number.isFinite(props.historyLimit)
    ? Math.max(0, Math.min(100, Math.floor(props.historyLimit)))
    : 50;
  previous.value = limit ? [...previous.value, book.value].slice(-limit) : [];
  next.value = [];
  publish(
    value,
    action,
    audit ? { action: audit } : undefined,
    preserveSelection,
  );
}

function replaceSheet(
  value: HysSpreadsheetSheet,
  action: "edit" | "paste" | "format" | "structure",
  options?: {
    changed?: readonly HysSpreadsheetCellChange[];
    preserveSelection?: boolean;
  },
) {
  const previous = book.value;
  const workbook = {
    ...previous,
    sheets: previous.sheets.map((item) =>
      item.id === value.id ? value : item,
    ),
  };
  if (options?.changed)
    calculationChange = {
      workbook,
      previous,
      sheetId: value.id,
      positions: options.changed.map(
        ({ row, column }) => row * width.value + column,
      ),
    };
  update(workbook, action, undefined, options?.preserveSelection);
}

function undo() {
  const target = previous.value.at(-1);
  if (!target || props.readonly) return false;
  previous.value = previous.value.slice(0, -1);
  next.value = [book.value, ...next.value];
  publish(target, "undo");
  return true;
}

function redo() {
  const target = next.value[0];
  if (!target || props.readonly) return false;
  next.value = next.value.slice(1);
  previous.value = [...previous.value, book.value];
  publish(target, "redo");
  return true;
}

function setSheet(id: string) {
  if (!book.value.sheets.some((item) => item.id === id && !item.hidden))
    return false;
  setActiveSheet(id);
  return true;
}

function setActiveSheet(id: string) {
  sheetOrderAnchor.value = undefined;
  if (props.activeSheet === undefined) localSheet.value = id;
  emit("update:activeSheet", id);
}

function applyValues(
  changes: readonly HysSpreadsheetCellChange[],
  action: "edit" | "paste",
  transform?: (sheet: HysSpreadsheetSheet) => HysSpreadsheetSheet,
): boolean {
  if (
    editingDisabled.value ||
    busy.value === "open" ||
    (!changes.length && !transform)
  )
    return false;
  if (
    changes.some(
      ({ row, column, value }) =>
        !isCellValue(value) ||
        !validPoint(sheet.value, row, column) ||
        !editableCell(row, column),
    )
  ) {
    feedback.value = "选区包含已锁定、只读或超出范围的单元格。";
    return false;
  }
  if (checkValues(changes)) return false;
  const updated = withValues(sheet.value, changes);
  replaceSheet(transform ? transform(updated) : updated, action, {
    changed: changes,
  });
  if (action === "edit") feedback.value = "";
  return true;
}

function checkValues(changes: readonly HysSpreadsheetCellChange[]) {
  const updated = withValues(sheet.value, changes);
  const errors: Record<string, string> = {};
  const current = { ...invalid.value };
  for (const { row, column } of affectedCells(updated, changes)) {
    const key = cellAddress(row, column);
    const error = validateCell(updated, row, column, props.validators);
    if (error) errors[key] = error;
    else delete current[key];
  }
  invalid.value = { ...current, ...errors };
  if (Object.keys(errors).length) {
    feedback.value = Object.entries(errors).map(
      ([key, error]) => `${key} ${error}`,
    )[0];
    emit("validationError", errors);
    return feedback.value;
  }
}

function gridChanges(changes: readonly HysProGridChange<GridRow>[]) {
  return changes.map((change) => ({
    row: change.row.index,
    column: Number(change.columnKey),
    value:
      change.editor === "text"
        ? parseCellInput(change.value)
        : (change.value as HysSpreadsheetValue),
  }));
}

function accept(
  changes: readonly HysProGridChange<GridRow>[],
  action: "edit" | "paste",
) {
  if (action === "edit") editingEnded();
  applyValues(gridChanges(changes), action);
}

function editFailure(failure: HysProGridFailure) {
  if (failure.stage !== "validate") return;
  const address = cellAddress(
    Number(failure.rowKey),
    Number(failure.columnKey),
  );
  invalid.value = { ...invalid.value, [address]: failure.message };
  feedback.value = `${address} ${failure.message}`;
  emit("validationError", { [address]: failure.message });
}

function applyFormula() {
  const anchor = range.value?.anchor;
  if (!anchor || !Number.isFinite(Number(anchor.columnKey))) return;
  const row = Number(anchor.rowKey),
    column = Number(anchor.columnKey);
  const parsed = parseDraft(formulaText.value, row, column);
  if (!parsed.ok) {
    editFailure({
      stage: "validate",
      rowKey: row,
      columnKey: String(column),
      message: parsed.message,
    });
    return;
  }
  if (
    applyValues(
      [
        {
          row,
          column,
          value: parsed.value,
        },
      ],
      "edit",
    )
  )
    feedback.value = "";
}

function clearCells() {
  if (!rectangle.value || editingDisabled.value) return;
  applyValues(
    selectedCells.value.map((point) => ({ ...point, value: null })),
    "edit",
  );
}

function formatCells(format: HysSpreadsheetCellFormat | null) {
  if (!rectangle.value || editingDisabled.value) return false;
  const targets = selectedCells.value;
  if (targets.some(({ row, column }) => !editableCell(row, column)))
    return false;
  const formats = { ...sheet.value.formats };
  for (const { row, column } of targets) {
    const key = cellAddress(row, column);
    if (format) {
      const next = { ...formats[key], ...format };
      if (
        format.excelFormat === undefined &&
        ["number", "precision", "thousands", "pattern", "currency"].some(
          (key) => Object.hasOwn(format, key),
        )
      )
        delete next.excelFormat;
      formats[key] = next;
    } else delete formats[key];
  }
  replaceSheet({ ...sheet.value, formats }, "format");
  return true;
}

function configureCells(options: HysSpreadsheetCellOptions) {
  if (!rectangle.value || editingDisabled.value) return false;
  const cells = { ...sheet.value.cells };
  for (const { row, column } of selectedCells.value) {
    const key = cellAddress(row, column);
    cells[key] = {
      ...cells[key],
      ...options,
      ...(options.validation
        ? { validation: { ...cells[key]?.validation, ...options.validation } }
        : {}),
    };
  }
  replaceSheet({ ...sheet.value, cells }, "structure", {
    preserveSelection: true,
  });
  return true;
}

function validateCells() {
  const errors: Record<string, string> = {};
  for (const address of Object.keys(sheet.value.cells ?? {})) {
    const point = parseAddress(address);
    if (!point || !validPoint(sheet.value, point.row, point.column)) continue;
    const error = validateCell(
      sheet.value,
      point.row,
      point.column,
      props.validators,
    );
    if (error) errors[address] = error;
  }
  invalid.value = errors;
  if (Object.keys(errors).length) emit("validationError", errors);
  return errors;
}

function fill(
  direction: "down" | "right",
  mode: HysSpreadsheetFillMode = "copy",
  sequence?: readonly HysSpreadsheetValue[],
) {
  return (
    !!rectangle.value &&
    applyValues(
      fillValues(sheet.value, rectangle.value, direction, mode, sequence),
      "edit",
    )
  );
}

function manageAxis(
  command: HysSpreadsheetAxisCommand,
  preserveSelection?: boolean,
) {
  if (editingDisabled.value || sheet.value.protected) return false;
  const workbook = updateAxis(book.value, sheet.value, command);
  if (!workbook) return false;
  const animate =
    command.type === "toggleGroup" ||
    (command.type === "configure" && command.options.hidden !== undefined)
      ? captureAxisVisibility(command.axis)
      : undefined;
  update(workbook, "structure", undefined, preserveSelection);
  animate?.(workbook);
  return true;
}

function captureAxisVisibility(axis: HysSpreadsheetAxis) {
  const active = sheet.value;
  const before = axis === "row" ? rowMotion.capture(0, active.rows.length - 1) : undefined;
  const columnsBefore = axis === "column" ? columnMotion.capture() : undefined;
  return (expected: HysSpreadsheetWorkbook | undefined) => {
    if (!expected || (!before && !columnsBefore)) return;
    const next = expected.sheets.find(({ id }) => id === active.id);
    if (!next) return;
    const accepted = () => book.value === expected && sheet.value.id === active.id;
    const revealed = (index: number) =>
      axisHidden(active, axis, index) && !axisHidden(next, axis, index);
    if (axis === "row") {
      void rowMotion.playVisibility(before, revealed, accepted);
    } else {
      void columnMotion.play(columnsBefore, (key) => key, accepted, (key) => revealed(Number(key)));
    }
  };
}

function moveSheetColumn(from: number, to: number) {
  const before = columnMotion.capture();
  if (!manageAxis({ type: "move", axis: "column", index: from, to })) return;
  const expected = published;
  void columnMotion.play(
    before,
    (key) => {
      const index = Number(key);
      if (index === to) return String(from);
      if (from < to && index >= from && index < to) return String(index + 1);
      if (from > to && index > to && index <= from) return String(index - 1);
      return key;
    },
    () => book.value === expected,
  );
}

function cancelGridMotion(event: Event) {
  if ((event.target as Element | null)?.closest?.(".hys-ui-spreadsheet-outgoing-sheet")) return;
  selectionMotion.cancel();
  columnMotion.cancel();
  rowMotion.cancel();
  rowResize.cancel();
  rowPointer.refresh();
  closeColumnDataMenu();
}

function onGridPointerDown() {
  rowMotion.cancel();
  cancelSheetTransition();
}

function fitColumnDivider(event: MouseEvent) {
  const handle = (event.target as Element)?.closest(".hys-ui-pf-grid-resize");
  const header = handle?.closest<HTMLTableCellElement>("thead th[data-column-key]");
  if (!header || !canReorderColumns.value) return;
  const index = Number(header.dataset.columnKey);
  if (!Number.isInteger(index)) return;
  event.preventDefault();
  event.stopPropagation();
  setAxisSizes("column", index, undefined, false);
}

function resizeSheetColumn(key: string, size: number) {
  if (!canReorderColumns.value) return false;
  const index = Number(key);
  const width = Math.round(size);
  if (width === (sheet.value.columnOptions?.[index]?.size ?? 124)) return false;
  return manageAxis(
    { type: "configure", axis: "column", index, options: { size: width } },
    true,
  );
}

function fittingSize(axis: "row" | "column", index: number) {
  let size = axis === "row" ? 35 : 48;
  for (
    let other = 0;
    other < (axis === "row" ? width.value : rowCount.value);
    other++
  ) {
    const row = axis === "row" ? index : other;
    const column = axis === "column" ? index : other;
    const result = calculate.value(row, column);
    const text = displayValue(
      result.value,
      sheet.value.formats?.[cellAddress(row, column)],
      props.locale,
      props.currency,
    );
    for (const line of text.split("\n"))
      if (axis === "column")
        size = Math.max(
          size,
          24 +
            Array.from(line).reduce(
              (width, character) =>
                width + (character.charCodeAt(0) > 255 ? 14 : 8),
              0,
            ),
        );
    if (axis === "row") {
      const available = sheet.value.columnOptions?.[column]?.size ?? 124;
      const lines = text
        .split("\n")
        .reduce(
          (count, line) =>
            count +
            Math.max(
              1,
              Math.ceil((line.length * 8) / Math.max(16, available - 24)),
            ),
          0,
        );
      size = Math.max(size, lines * 20 + 12);
    }
  }
  return Math.min(size, 1000);
}

function fitAxis(axis: "row" | "column", index = selectedPoint.value?.[axis]) {
  return index !== undefined && setAxisSizes(axis, index);
}

function setAxisSizes(
  axis: HysSpreadsheetAxis,
  index: number,
  size?: number,
  includeSelection = true,
) {
  if (editingDisabled.value || sheet.value.protected) return false;
  const ranges = includeSelection && headerSelected(axis, index)
    ? headerRanges.value[axis]
    : [{ start: index, end: index }];
  const active = sheet.value;
  const key = axis === "row" ? "rowOptions" : "columnOptions";
  const options = { ...active[key] };
  let changed = false;
  for (const { start, end } of ranges)
    for (let position = start; position <= end; position++) {
      if (axisHidden(active, axis, position)) continue;
      const extent = size ?? fittingSize(axis, position);
      if (options[position]?.size === extent) continue;
      options[position] = { ...options[position], size: extent };
      changed = true;
    }
  if (changed) replaceSheet({ ...active, [key]: options }, "structure", { preserveSelection: true });
  return changed;
}

function applyBrush(apply: boolean) {
  if (apply) {
    if (formatBrush.value) formatCells(formatBrush.value);
  } else if (selectedFormat.value) {
    formatBrush.value = { ...selectedFormat.value };
    feedback.value = "已复制单元格格式";
  }
}

function resetFind() {
  findResults.value = [];
  findFeedback.value = "";
}

function showMatches(query: string, options: HysSpreadsheetFindOptions) {
  const matches = find(query, options);
  findResults.value = matches;
  findFeedback.value = matches.length
    ? message("找到 {count} 格").replace("{count}", String(matches.length))
    : message("没有找到匹配的单元格");
  if (matches.length) locateMatch(matches[0]);
}

function locateMatch(address: string) {
  if (!setRange(address, address, false, false)) return;
  const point = parseAddress(address)!;
  grid.value?.focusCell(point.row, String(point.column), false);
}

function replaceMatches(
  query: string,
  replacement: string,
  options: HysSpreadsheetFindOptions,
) {
  const pattern = spreadsheetSearchPattern(query, options);
  if (!pattern) return;
  const matches = matchingCells(pattern, options);
  findResults.value = [];
  if (!matches.length) {
    findFeedback.value = message("没有找到匹配的单元格");
    return;
  }
  feedback.value = "";
  findFeedback.value = replaceMatchesInSheet(matches, pattern, replacement)
    ? message("已替换 {count} 格").replace("{count}", String(matches.length))
    : feedback.value || message("无法替换匹配的单元格。");
}

function locateInvalid() {
  const errors = validateCells();
  const addresses = Object.keys(errors);
  searchResults.value = addresses;
  feedback.value = addresses.length
    ? `发现 ${addresses.length} 格未通过校验`
    : "工作表校验通过";
  if (addresses.length) setRange(addresses[0], addresses[0], false, false);
}

function addConditionalRule(rule?: HysSpreadsheetConditionalFormat) {
  setConditionalFormats(
    rule ? [...(sheet.value.conditionalFormats ?? []), rule] : [],
  );
}

function copyConditionalFormats(source: string, destination: string) {
  const [first, last] = source.split(":");
  const area = areaFromAddresses(first, last);
  const target = parseAddress(destination);
  if (!area || !target) return false;
  const rowOffset = target.row - area.top,
    columnOffset = target.column - area.left;
  const rules = sheet.value.conditionalFormats ?? [];
  const copies = rules.flatMap((rule) => {
    const [start, end] = rule.range.split(":");
    const original = areaFromAddresses(start, end);
    if (
      !original ||
      original.top < area.top ||
      original.left < area.left ||
      original.bottom > area.bottom ||
      original.right > area.right
    )
      return [];
    const top = original.top + rowOffset,
      left = original.left + columnOffset;
    const bottom = original.bottom + rowOffset,
      right = original.right + columnOffset;
    if (
      !validPoint(sheet.value, top, left) ||
      !validPoint(sheet.value, bottom, right)
    )
      return [];
    const range = `${cellAddress(top, left)}:${cellAddress(bottom, right)}`;
    const value =
      rule.type === "formula" && typeof rule.value === "string"
        ? offsetFormula(rule.value, rowOffset, columnOffset)
        : rule.value;
    return [{ ...rule, range, value }];
  });
  return !!copies.length && setConditionalFormats([...rules, ...copies]);
}

function applyStyle(name: string) {
  const templates: Readonly<Record<string, HysSpreadsheetCellFormat>> = {
    title: {
      bold: true,
      backgroundColor: "var(--hys-ui-theme-primary-soft)",
      color: "var(--hys-ui-theme-text)",
    },
    amount: { number: "currency", precision: 2, align: "right" },
    ...props.styleTemplates,
  };
  return Object.hasOwn(templates, name) && formatCells(templates[name]);
}

const toolbarActions: Record<ToolbarAction, () => unknown> = {
  undo,
  redo,
  copy: () => useClipboard("copy"),
  paste: () => useClipboard("paste"),
  clear: clearCells,
  fullscreen: toggleFullscreen,
};

function toolbarActionDisabled(action: ToolbarAction) {
  switch (action) {
    case "undo":
      return !!props.readonly || !previous.value.length;
    case "redo":
      return !!props.readonly || !next.value.length;
    case "copy":
      return !selection.value;
    case "paste":
    case "clear":
      return editingDisabled.value || !selection.value;
    case "fullscreen":
      return false;
  }
}

function toggleFullscreen() {
  void setFullscreen(!fullscreen.value);
}

const structureActions = [
  { axis: "row", add: false, label: "删除行", icon: ListMinus },
  { axis: "column", add: true, label: "插入列", icon: Columns3 },
  { axis: "column", add: false, label: "删除列", icon: ListMinus },
] as const;
const rowInsertLimit = computed(() => sheetLimits.rows - rowCount.value);
const columnInsertLimit = computed(() => sheetLimits.columns - width.value);
const axisInsertLabels = {
  "row-insert-before": "上方插入行数",
  "row-insert-after": "下方插入行数",
  "column-insert-before": "左侧插入列数",
  "column-insert-after": "右侧插入列数",
} as const;
type AxisInsertKey = keyof typeof axisInsertLabels;
const defaultAxisInsertCounts = {
  "row-insert-before": 1,
  "row-insert-after": 1,
  "column-insert-before": 1,
  "column-insert-after": 1,
};
const axisInsertCounts = ref<Record<AxisInsertKey, number | null>>({ ...defaultAxisInsertCounts });
function isAxisInsertKey(value: HysMenuKey | undefined): value is AxisInsertKey {
  return typeof value === "string" && Object.hasOwn(axisInsertLabels, value);
}
function axisInsertLimit(key: AxisInsertKey) {
  return key.startsWith("row-") ? rowInsertLimit.value : columnInsertLimit.value;
}
const toolbarRowInsertCount = ref<number | null>();
const toolbarRowInsertTarget = computed(() => structureTarget("row", true));
const toolbarRowInsertDraft = computed(() =>
  toolbarRowInsertCount.value === undefined
    ? Math.min(toolbarRowInsertTarget.value.size, rowInsertLimit.value)
    : toolbarRowInsertCount.value,
);

function structureTarget(axis: "row" | "column", add: boolean) {
  const area = rectangle.value;
  const count = axis === "row" ? rowCount.value : width.value;
  const index = area
    ? axis === "row"
      ? area.top
      : area.left
    : add
      ? count
      : count - 1;
  const size = area
    ? axis === "row"
      ? area.bottom - area.top + 1
      : area.right - area.left + 1
    : 1;
  return {
    index,
    size,
    allowed:
      !editingDisabled.value &&
      (add
        ? axis === "row"
          ? count < sheetLimits.rows && !sheet.value.protected
          : count + size <= sheetLimits.columns
        : count > size),
  };
}

function validInsertCount(count: number | null, limit = rowInsertLimit.value): count is number {
  return count !== null && Number.isInteger(count) && count >= 1 && count <= limit;
}

function insertRows(index: number, count: number | null) {
  return validInsertCount(count) && manageAxis({ type: "insert", axis: "row", index, count });
}

function changeStructure(axis: "row" | "column", add: boolean) {
  const { index, size, allowed } = structureTarget(axis, add);
  if (!allowed) return;
  manageAxis({ type: add ? "insert" : "delete", axis, index, count: size });
}

function selectRange(anchor: string, focus = anchor, append = false) {
  return setRange(anchor, focus, append, true);
}

function setRange(
  anchor: string,
  focus: string,
  append: boolean,
  focusCell: boolean,
) {
  const first = parseAddress(anchor);
  const last = parseAddress(focus);
  if (!first || !last) return false;
  const start = { rowKey: first.row, columnKey: String(first.column) };
  const end = { rowKey: last.row, columnKey: String(last.column) };
  const previous = selection.value;
  if (!clipboard.selectRange(start, end)) return false;
  additionalRanges.value =
    append &&
    previous &&
    (previous.anchor !== anchor || previous.focus !== focus)
      ? [
          ...(previous.additional ?? []),
          { anchor: previous.anchor, focus: previous.focus },
        ]
      : [];
  if (focusCell) grid.value?.focusCell(start.rowKey, start.columnKey);
  return true;
}

function targetPoint(target: EventTarget | null) {
  const td = (target as Element | null)?.closest?.<HTMLTableCellElement>(
    "td[data-hys-cell-index]",
  );
  const row = td?.parentElement?.dataset.gridRow;
  const col = td?.dataset.columnKey;
  if (row?.startsWith("number:") && col !== undefined)
    return { row: Number(row.slice(7)), column: Number(col) };
}

function onPointer(event: PointerEvent) {
  const point = targetPoint(event.target);
  selectionMotion.capture(
    event,
    !!point &&
      event.button === 0 &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !editingAddress.value &&
      !additionalRanges.value.length,
  );
  if (event.button !== 0 || !(event.ctrlKey || event.metaKey)) {
    if (event.button === 0 && !event.shiftKey && point)
      additionalRanges.value = [];
    return;
  }
  if ((event.target as Element)?.closest("input,textarea,select,a,button"))
    return;
  if (!point) return;
  event.stopPropagation();
  event.preventDefault();
  const address = cellAddress(point.row, point.column);
  selectRange(address, address, true);
}

function dropCells(event: DragEvent) {
  const drag = dragPoint.value;
  const target = targetPoint(event.target);
  const area = rectangle.value;
  dragPoint.value = undefined;
  if (
    !drag ||
    !target ||
    !area ||
    sheet.value.id !== drag.sheetId ||
    editingDisabled.value
  )
    return;
  event.preventDefault();
  if (drag.type === "fill") {
    const down = Math.max(0, target.row - area.bottom);
    const right = Math.max(0, target.column - area.right);
    if (!down && !right) return;
    const direction = down >= right ? "down" : "right";
    const destination = {
      ...area,
      bottom: direction === "down" ? target.row : area.bottom,
      right: direction === "right" ? target.column : area.right,
    };
    const changes = fillValues(
      sheet.value,
      destination,
      direction,
      "smart",
    ).filter(({ row, column }) => row > area.bottom || column > area.right);
    if (applyValues(changes, "edit"))
      void nextTick(() =>
        selectRange(
          cellAddress(area.top, area.left),
          cellAddress(destination.bottom, destination.right),
        ),
      );
    return;
  }
  const rowOffset = target.row - drag.row;
  const columnOffset = target.column - drag.column;
  if (!rowOffset && !columnOffset) return;
  const originals = points(area);
  const formats = { ...sheet.value.formats };
  const originalFormats = sheet.value.formats;
  const changes: HysSpreadsheetCellChange[] = originals.map((point) => ({
    ...point,
    value: null,
  }));
  for (const { row, column } of originals)
    delete formats[cellAddress(row, column)];
  for (const { row, column } of originals) {
    const address = cellAddress(row, column);
    const destination = cellAddress(row + rowOffset, column + columnOffset);
    const value = sheet.value.rows[row]?.[column] ?? null;
    changes.push({
      row: row + rowOffset,
      column: column + columnOffset,
      value,
    });
    if (originalFormats?.[address])
      formats[destination] = originalFormats[address];
    else delete formats[destination];
  }
  if (applyValues(changes, "edit", (sheet) => ({ ...sheet, formats })))
    void nextTick(() =>
      selectRange(
        cellAddress(area.top + rowOffset, area.left + columnOffset),
        cellAddress(area.bottom + rowOffset, area.right + columnOffset),
      ),
    );
}

function beginCellDrag(
  event: DragEvent,
  type: "fill" | "move",
  row: number,
  column: number,
) {
  dragPoint.value = { type, row, column, sheetId: sheet.value.id };
  event.dataTransfer?.setData("application/x-hys-cell", type);
}

function scrollMap(event: MouseEvent) {
  const grid = root.value?.querySelector<HTMLElement>(".hys-ui-pf-grid-scroll");
  const element = event.currentTarget as HTMLElement;
  if (!grid) return;
  const bounds = element.getBoundingClientRect();
  const row = Math.min(
    rowData.value.length - 1,
    Math.max(
      0,
      Math.floor(
        (event.detail ? (event.clientY - bounds.top) / bounds.height : 0.5) *
          rowData.value.length,
      ),
    ),
  );
  const column = Math.min(
    columns.value.length - 1,
    Math.max(
      0,
      Math.floor(
        (event.detail ? (event.clientX - bounds.left) / bounds.width : 0.5) *
          columns.value.length,
      ),
    ),
  );
  if (row >= 0 && column >= 0)
    selectRange(
      cellAddress(rowData.value[row].index, Number(columns.value[column].key)),
    );
}

function contextCell(
  context: Extract<HysDataGridContext<GridRow>, { type: "cell" }>,
): HysSpreadsheetCellContext {
  const row = context.row.index;
  const column = Number(context.column.key);
  return {
    sheet: sheet.value,
    row,
    column,
    address: cellAddress(row, column),
    value: calculate.value(row, column).value,
  };
}

function contextItems(
  context: HysDataGridContext<GridRow>,
): readonly HysContextMenuItem[] | false {
  if (context.type !== "cell") {
    const row = context.type === "row";
    const index = row ? context.row.index : Number(context.column.key);
    axisInsertCounts.value = { ...defaultAxisInsertCounts };
    axisSizeDraft.value = row
      ? sheet.value.rowOptions?.[index]?.size ?? 35
      : sheet.value.columnOptions?.[index]?.size ?? 124;
    return spreadsheetAxisMenu(
      sheet.value,
      row ? "row" : "column",
      index,
      editingDisabled.value,
      message,
    );
  }
  const cell = contextCell(context);
  const disabled =
    editingDisabled.value || !canEdit(cell.sheet, cell.row, cell.column);
  const items = [
    { label: "复制", value: "copy" },
    { label: "剪切", value: "cut", disabled },
    { label: "粘贴", value: "paste", disabled },
    { label: "清空内容", value: "clear", disabled },
    { label: "清除格式", value: "clearFormat", disabled },
  ];
  const translated = items.map((item) => ({
    ...item,
    label: message(item.label),
  }));
  return props.contextMenu
    ? props.contextMenu.items(cell, translated)
    : translated;
}

const axisSizeDraft = ref<number | null>(null);

watch([sheet, editingDisabled], () => {
  toolbarRowInsertCount.value = undefined;
});

function chooseContextItem(
  key: HysMenuKey,
  context: HysDataGridContext<GridRow>,
) {
  if (context.type !== "cell") {
    const row = context.type === "row";
    const axis = row ? "row" : "column";
    const index = row ? context.row.index : Number(context.column.key);
    const action = spreadsheetAxisAction(
      spreadsheetAxisMenu(sheet.value, axis, index, editingDisabled.value, message),
      key,
    );
    if (action === "fit") fitAxis(axis, index);
    else if (action === "size") {
      const value = axisSizeDraft.value;
      if (value !== null && Number.isInteger(value) && value >= 16 && value <= 1000)
        setAxisSizes(axis, index, value);
    } else if (action?.type === "insert" && isAxisInsertKey(key)) {
      const count = axisInsertCounts.value[key];
      if (validInsertCount(count, axisInsertLimit(key)))
        manageAxis({ ...action, count });
    } else if (action?.type === "move" && axis === "column") {
      moveSheetColumn(index, action.to);
    } else if (action) {
      manageAxis(action, action.type === "configure" && action.options.hidden === undefined);
    }
    return;
  }
  const cell = contextCell(context);
  if (!selectionAreas.value.some(({ top, bottom, left, right }) =>
    cell.row >= top && cell.row <= bottom &&
    cell.column >= left && cell.column <= right,
  ))
    selectRange(cell.address);
  if (key === "copy" || key === "cut" || key === "paste")
    void useClipboard(key);
  if (key === "clear") clearCells();
  if (key === "clearFormat") formatCells(null);
  if (props.contextMenu) props.contextMenu.select?.(key, cell, instance);
}

function selectAll() {
  const rows = rowData.value;
  if (!rows.length || !columns.value.length) return false;
  const changed = selectRange(
    cellAddress(rows[0].index, Number(columns.value[0].key)),
    cellAddress(rows.at(-1)!.index, Number(columns.value.at(-1)!.key)),
  );
  if (changed) selectionAxis.value = "all";
  return changed;
}

function locateSelection() {
  const name = Object.entries(book.value.names ?? {}).find(
    ([key]) => key.toLowerCase() === addressText.value.trim().toLowerCase(),
  )?.[1];
  if (name && name.sheetId !== sheet.value.id) {
    if (setSheet(name.sheetId))
      void nextTick(() => {
        const [first, last] = name.range.split(":");
        selectRange(first, last);
      });
    return;
  }
  const parts = (name?.range ?? addressText.value)
    .split(":")
    .map((part) => part.trim());
  if (parts.length <= 2 && selectRange(parts[0], parts[1])) {
    feedback.value = "";
    addressText.value = selectionAddress.value;
  } else feedback.value = "请输入工作表范围内的坐标，例如 B2 或 B2:D5。";
}

function defineName(
  name: string,
  range = selectionAddress.value,
  sheetId = sheet.value.id,
) {
  const key = name.trim().toUpperCase();
  if (
    props.readonly ||
    !/^[\p{L}_][\p{L}\p{N}_.]*$/u.test(key) ||
    /^(TRUE|FALSE)$/.test(key) ||
    parseAddress(key)
  )
    return false;
  const names = { ...book.value.names };
  if (!range) {
    if (!Object.hasOwn(names, key)) return false;
    delete names[key];
  } else {
    const target = book.value.sheets.find(({ id }) => id === sheetId);
    const [first, last, extra] = range.split(":");
    const area = areaFromAddresses(first, last);
    if (
      extra ||
      !target ||
      !area ||
      !validPoint(target, area.bottom, area.right)
    )
      return false;
    names[key] = { sheetId, range: range.toUpperCase() };
  }
  update({ ...book.value, names }, "structure");
  return true;
}

function headerRange(axis: HysSpreadsheetAxis, start: number, end: number) {
  return axis === "row"
    ? {
        anchor: cellAddress(start, Number(columns.value[0].key)),
        focus: cellAddress(end, Number(columns.value.at(-1)!.key)),
      }
    : {
        anchor: cellAddress(rowData.value[0].index, start),
        focus: cellAddress(rowData.value.at(-1)!.index, end),
      };
}

const headerRanges = computed(() => ({
  row: selectionAreas.value.map(({ top, bottom }) => ({ start: top, end: bottom })),
  column: selectionAreas.value.map(({ left, right }) => ({ start: left, end: right })),
}));

function headerSelected(axis: HysSpreadsheetAxis, index: number) {
  return (selectionAxis.value === axis || selectionAxis.value === "all") &&
    headerRanges.value[axis].some(({ start, end }) => index >= start && index <= end);
}

function selectHeader(axis: HysSpreadsheetAxis, index: number, extend: boolean, focus = true) {
  if (!rowData.value.length || !columns.value.length) return;
  const previous = range.value?.anchor;
  const anchor =
    extend && selectionAxis.value === axis && previous
      ? Number(axis === "row" ? previous.rowKey : previous.columnKey)
      : index;
  const addresses = headerRange(axis, anchor, index);
  if (setRange(addresses.anchor, addresses.focus, false, focus))
    selectionAxis.value = axis;
}

function deselectHeader(axis: HysSpreadsheetAxis, index: number) {
  if (!headerSelected(axis, index)) return;
  const visible = axis === "row"
    ? rowData.value.map(({ index }) => index)
    : columns.value.map(({ key }) => Number(key));
  const position = visible.indexOf(index);
  const before = visible[position - 1];
  const after = visible[position + 1];
  const [primary, ...additional] = headerRanges.value[axis].flatMap(({ start, end }) => {
    if (index < start || index > end) return [headerRange(axis, start, end)];
    const ranges = [];
    if (before !== undefined && before >= start)
      ranges.push(headerRange(axis, start, before));
    if (after !== undefined && after <= end)
      ranges.push(headerRange(axis, after, end));
    return ranges;
  });
  if (!primary) clipboard.clearSelection();
  else if (setRange(primary.anchor, primary.focus, false, false)) {
    additionalRanges.value = additional;
    selectionAxis.value = axis;
  }
}

function activateHeader(axis: HysSpreadsheetAxis, index: number, event: MouseEvent) {
  if (!event.shiftKey && (event.ctrlKey || event.metaKey) && selectionAxis.value) {
    deselectHeader(axis, index);
    return;
  }
  if (!event.shiftKey && selectionAxis.value === axis && !additionalRanges.value.length) {
    const primary = headerRanges.value[axis][0];
    if (primary?.start === index && primary.end === index) {
      clipboard.clearSelection();
      return;
    }
  }
  selectHeader(axis, index, event.shiftKey);
}

function canMoveSelectedRow(index: number) {
  return canReorderColumns.value && selectionAxis.value === "row" &&
    headerSelected("row", index);
}

function moveSelectedRow(index: number, to: number) {
  const id = sheet.value.id;
  const before = rowMotion.capture(index, to);
  if (!manageAxis({ type: "move", axis: "row", index, to })) return;
  const expected = published;
  void nextTick(() => {
    if (sheet.value.id === id && book.value === expected)
      selectHeader("row", to, false, false);
  });
  void rowMotion.play(before, () => sheet.value.id === id && book.value === expected);
}

function manageSheet(command: HysSpreadsheetSheetCommand) {
  if (props.readonly || busy.value === "open") return false;
  const result = updateSheet(book.value, command);
  if (!result) {
    if (command.type === "rename")
      feedback.value = message("请输入唯一的工作表名称。");
    return false;
  }
  const current = sheet.value.id;
  if (command.type === "move") {
    const requested = props.activeSheet ?? localSheet.value;
    if (requested !== current)
      sheetOrderAnchor.value = { requested, visible: current };
  }
  update(
    result.workbook,
    "structure",
    undefined,
    command.type === "move" ? true : undefined,
  );
  if (result.active) setActiveSheet(result.active);
  else if (
    !result.workbook.sheets.some(({ id, hidden }) => id === current && !hidden)
  )
    setActiveSheet(result.workbook.sheets.find(({ hidden }) => !hidden)!.id);
  return true;
}

function replaceWorkbook(workbook: HysSpreadsheetWorkbook) {
  previous.value = [];
  next.value = [];
  sheetViews.clear();
  clipboard.clearSelection();
  evaluationBook.value = workbook;
  publish(workbook, "open");
  setActiveSheet(workbook.sheets.find(({ hidden }) => !hidden)!.id);
}

function newWorkbook(name?: string) {
  if (props.readonly || busy.value) return false;
  replaceWorkbook({ name: name?.trim() || undefined, sheets: [blankSheet()] });
  return true;
}

async function openWorkbook(workbook?: HysSpreadsheetWorkbook) {
  return !props.readonly && storage.open(workbook);
}

async function importWorkbook(file: File) {
  if (props.readonly) return false;
  return storage.open(async () => {
    const extension = fileExtension(file.name.split(".").at(-1) ?? "");
    const format = formats.value.get(extension);
    if (!format?.decode) throw new Error(message("不支持此工作簿文件类型。"));
    return format.decode(file);
  });
}

async function exportWorkbook(extension = "xlsx") {
  const format = formats.value.get(fileExtension(extension));
  if (!format?.encode) throw new Error(message("不支持此工作簿导出格式。"));
  return format.encode(book.value);
}

async function saveWorkbookFile(extension = "xlsx", name?: string) {
  const snapshot = book.value;
  const key = fileExtension(extension);
  try {
    saveFile(
      await exportWorkbook(key),
      name?.trim() ? { ...snapshot, name: name.trim() } : snapshot,
      key,
    );
    if (!canSave.value) storage.markSaved(snapshot);
    emit("save", snapshot);
    recordVersion(snapshot, "save");
    feedback.value = message("已保存工作簿文件");
    return true;
  } catch (error) {
    emit("persistenceError", "save", error);
    feedback.value =
      error instanceof Error
        ? message(error.message)
        : message("无法导出工作簿。");
    return false;
  }
}

function saveWorkbookAs(name?: string) {
  const workbook = book.value;
  return { ...workbook, name: name?.trim() || workbook.name };
}

function changeCalculationMode() {
  const calculationMode =
    book.value.calculationMode === "manual" ? "automatic" : "manual";
  update({ ...book.value, calculationMode }, "structure");
}

function manageData(command: HysSpreadsheetDataCommand, scope: "selection" | "sheet" = "selection") {
  if (editingDisabled.value) return false;
  if (command.type === "clearSort" && sheet.value.protected) return false;
  try {
    const selected = scope === "sheet" ? undefined : rectangle.value;
    const area =
      selected &&
      selected.top === selected.bottom &&
      (command.type === "sort" || command.type === "deduplicate")
        ? undefined
        : selected;
    const next = updateData(
      sheet.value,
      area,
      command,
      calculate.value,
      (row, column) => conditional.value(row, column)?.icon ?? "",
      props.compare,
    );
    if (!next) return false;
    if (command.type !== "filter" && command.type !== "group" && command.type !== "clearSort") {
      for (const address of Object.keys(next.cells ?? {})) {
        const point = parseAddress(address);
        if (!point || !validPoint(next, point.row, point.column)) continue;
        const error = validateCell(
          next,
          point.row,
          point.column,
          props.validators,
        );
        if (error) {
          feedback.value = `${address} ${error}`;
          emit("validationError", { [address]: error });
          return false;
        }
      }
    }
    replaceSheet(next, "structure");
    return true;
  } catch {
    feedback.value = "数据处理失败，请检查排序和筛选规则。";
    return false;
  }
}

function setConditionalFormats(
  rules: readonly HysSpreadsheetConditionalFormat[],
) {
  if (
    editingDisabled.value ||
    rules.some(({ range }) => {
      const [first, last] = range.split(":");
      const area = areaFromAddresses(first, last);
      return !area || !validPoint(sheet.value, area.bottom, area.right);
    })
  )
    return false;
  replaceSheet({ ...sheet.value, conditionalFormats: [...rules] }, "format");
  return true;
}

function find(query: string, options: HysSpreadsheetFindOptions = {}) {
  const pattern = spreadsheetSearchPattern(query, options);
  return pattern
    ? matchingCells(pattern, options).map(({ address }) => address)
    : [];
}

function matchingCells(pattern: RegExp, options: HysSpreadsheetFindOptions) {
  const active = sheet.value;
  const evaluate = calculate.value;
  return spreadsheetFindMatches(
    pattern,
    rowData.value,
    columns.value,
    (row, column) =>
      String(
        (options.formulas
          ? active.rows[row]?.[column]
          : evaluate(row, column).value) ?? "",
      ),
    options,
  );
}

function replace(
  query: string,
  replacement: string,
  options: HysSpreadsheetFindOptions = {},
) {
  const pattern = spreadsheetSearchPattern(query, options);
  return (
    !!pattern &&
    replaceMatchesInSheet(matchingCells(pattern, options), pattern, replacement)
  );
}

function replaceMatchesInSheet(
  matches: ReturnType<typeof matchingCells>,
  pattern: RegExp,
  replacement: string,
) {
  const { cells, rows } = sheet.value;
  return applyValues(
    matches.map(({ row, column, address, value }) => {
      const changed = value.replace(pattern, () => replacement);
      return {
        row,
        column,
        value:
          changed === value
            ? (rows[row]?.[column] ?? null)
            : parseTyped(changed, cells?.[address]),
      };
    }),
    "edit",
  );
}

function merge(selected: boolean) {
  const area = rectangle.value;
  if (!area || editingDisabled.value) return false;
  const { top, bottom, left, right } = area;
  const original = sheet.value.merges ?? [];
  const unaffected = original.filter((range) => {
    const [start, end] = range.split(":");
    const target = areaFromAddresses(start, end);
    return (
      !target ||
      target.bottom < top ||
      target.top > bottom ||
      target.right < left ||
      target.left > right
    );
  });
  if (
    selected &&
    ((top === bottom && left === right) ||
      unaffected.length !== original.length)
  )
    return false;
  if (!selected && unaffected.length === original.length) return false;
  if (
    points(area).some(({ row, column }) => !canEdit(sheet.value, row, column))
  )
    return false;
  const merges = selected
    ? [...original, `${cellAddress(top, left)}:${cellAddress(bottom, right)}`]
    : unaffected;
  replaceSheet({ ...sheet.value, merges }, "structure");
  return true;
}

function rememberCopy(text: string) {
  const area = rectangle.value;
  if (!area) return;
  const rows: HysSpreadsheetValue[][] = [];
  const values: HysSpreadsheetValue[][] = [];
  const formats: (HysSpreadsheetCellFormat | undefined)[][] = [];
  for (const { index: row } of rowData.value) {
    if (row < area.top || row > area.bottom) continue;
    const selected = columns.value
      .map(({ key }) => Number(key))
      .filter((column) => column >= area.left && column <= area.right);
    rows.push(
      selected.map((column) => sheet.value.rows[row]?.[column] ?? null),
    );
    values.push(selected.map((column) => calculate.value(row, column).value));
    formats.push(
      selected.map((column) => sheet.value.formats?.[cellAddress(row, column)]),
    );
  }
  lastCopy.value = {
    text,
    rows,
    formats,
    values,
    top: area.top,
    left: area.left,
  };
}

function paste(text: string, mode: HysSpreadsheetPasteMode = "all") {
  const area = rectangle.value;
  if (!area || editingDisabled.value) return false;
  const copied = lastCopy.value?.text === text ? lastCopy.value : undefined;
  if (mode === "formats" && !copied) return false;
  let source: readonly (readonly HysSpreadsheetValue[])[];
  try {
    source = copied
      ? mode === "values"
        ? copied.values
        : copied.rows
      : readTsv(text, 10000);
  } catch {
    feedback.value = "剪贴板内容须为规则的制表符表格。";
    return false;
  }
  if (mode === "transpose")
    source = source[0].map((_, index) => source.map((row) => row[index]));
  const rows = rowData.value
    .map(({ index }) => index)
    .filter((row) => row >= area.top);
  const cols = columns.value
    .map(({ key }) => Number(key))
    .filter((column) => column >= area.left);
  const single = area.top === area.bottom && area.left === area.right;
  const height = single
    ? source.length
    : rows.filter((row) => row <= area.bottom).length;
  const size = single
    ? source[0].length
    : cols.filter((column) => column <= area.right).length;
  if (
    height > rows.length ||
    size > cols.length ||
    height * size > 10000 ||
    height % source.length ||
    size % source[0].length
  ) {
    feedback.value = "粘贴内容与目标选区的尺寸不匹配。";
    return false;
  }
  const changes: HysSpreadsheetCellChange[] = [];
  const formats = { ...sheet.value.formats };
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < size; j++) {
      const row = rows[i],
        column = cols[j],
        address = cellAddress(row, column);
      if (!editableCell(row, column)) {
        feedback.value = `${address} 无法编辑。`;
        return false;
      }
      const y = i % source.length,
        x = j % source[0].length;
      let value = source[y][x];
      if (!copied && typeof value === "string") {
        const parsed = parseDraft(value, row, column);
        if (!parsed.ok) {
          editFailure({
            stage: "validate",
            rowKey: row,
            columnKey: String(column),
            message: parsed.message,
          });
          return false;
        }
        value = parsed.value;
      }
      const formula = typeof value === "string" && value.startsWith("=");
      if (mode === "formulas" && !formula) continue;
      if (mode === "values" && !copied && formula) continue;
      if (formula && copied && mode !== "values")
        value = offsetFormula(
          value as string,
          row - copied.top - (mode === "transpose" ? x : y),
          column - copied.left - (mode === "transpose" ? y : x),
        );
      if (mode !== "formats") changes.push({ row, column, value });
      if (
        copied &&
        (mode === "all" || mode === "formats" || mode === "transpose")
      ) {
        const format =
          mode === "transpose" ? copied.formats[x][y] : copied.formats[y][x];
        if (format) formats[address] = format;
        else delete formats[address];
      }
    }
  }
  const success = applyValues(
    changes,
    "paste",
    copied && ["all", "formats", "transpose"].includes(mode)
      ? (sheet) => ({ ...sheet, formats })
      : undefined,
  );
  if (success)
    feedback.value = message("已粘贴 {count} 格").replace(
      "{count}",
      String(height * size),
    );
  return success;
}

function onClipboard(event: ClipboardEvent) {
  if (
    !event.clipboardData ||
    !(event.target as Element)?.closest("td[data-hys-cell-index]") ||
    (event.target as Element).closest("input,textarea,select,[contenteditable]")
  )
    return;
  if (event.type === "cut" && !canCutSelection()) {
    event.preventDefault();
    return;
  }
  if (event.type === "paste") {
    if (!event.clipboardData.types.includes("text/plain") || !selection.value)
      return;
    event.preventDefault();
    event.stopPropagation();
    paste(event.clipboardData.getData("text/plain"));
    return;
  }
  const text = clipboard.copyText();
  if (text === undefined) return;
  event.clipboardData.setData("text/plain", text);
  rememberCopy(text);
  event.preventDefault();
  if (event.type === "cut") clearCells();
}

async function useClipboard(
  action: "copy" | "cut" | "paste",
  mode: HysSpreadsheetPasteMode = "all",
) {
  if (action === "cut" && !canCutSelection()) return;
  const original = selection.value;
  const originalWorkbook = book.value;
  try {
    if (action !== "paste") {
      const text = clipboard.copyText();
      if (text === undefined) return;
      await navigator.clipboard.writeText(text);
      if (selection.value !== original || book.value !== originalWorkbook)
        return;
      rememberCopy(text);
      if (action === "cut") clearCells();
      else feedback.value = "已复制选区";
    } else {
      const text = await navigator.clipboard.readText();
      if (selection.value === original && book.value === originalWorkbook)
        paste(text, mode);
    }
  } catch {
    feedback.value = "无法访问系统剪贴板，请使用复制或粘贴快捷键。";
  }
}

function canCutSelection() {
  if (!selectionAxis.value || !additionalRanges.value.length) return true;
  feedback.value = message("请逐段剪切不连续的行列选区。");
  return false;
}

function keyboard(event: KeyboardEvent) {
  if (
    event.key === "Escape" &&
    !event.defaultPrevented &&
    !event.isComposing &&
    (selectionAxis.value === "row" || selectionAxis.value === "column") &&
    (event.target as Element)?.closest(".hys-ui-spreadsheet-header-button")
  ) {
    event.preventDefault();
    clipboard.clearSelection();
    return;
  }
  if (
    event.key === "Escape" &&
    fullscreen.value &&
    !event.defaultPrevented &&
    !(event.target as Element)?.closest("input,textarea,select")
  ) {
    void setFullscreen(false);
    return;
  }
  if (
    event.altKey ||
    event.defaultPrevented ||
    event.isComposing ||
    !(event.target as Element)?.matches("td[data-hys-cell-index]")
  )
    return;
  const cell = event.target as HTMLTableCellElement;
  const shortcut = [
    event.ctrlKey || event.metaKey ? "Mod" : "",
    event.shiftKey ? "Shift" : "",
    event.key.toLowerCase(),
  ]
    .filter(Boolean)
    .join("+");
  if (props.shortcuts && Object.hasOwn(props.shortcuts, shortcut)) {
    event.preventDefault();
    props.shortcuts[shortcut](instance);
    return;
  }
  if (
    !event.ctrlKey &&
    !event.metaKey &&
    ["Enter", "Tab"].includes(event.key)
  ) {
    const point = targetPoint(cell);
    if (!point) return;
    const rows = rowData.value.map(({ index }) => index);
    const cols = columns.value.map(({ key }) => Number(key));
    const y = rows.indexOf(point.row);
    const x = cols.indexOf(point.column);
    const step = event.shiftKey ? -1 : 1;
    const position = y * cols.length + x + step;
    const row =
      event.key === "Enter"
        ? rows[y + step]
        : rows[Math.floor(position / cols.length)];
    const column =
      event.key === "Enter" ? point.column : cols[position % cols.length];
    if (row !== undefined && column !== undefined) {
      event.preventDefault();
      selectRange(cellAddress(row, column));
    }
    return;
  }
  if (
    !event.altKey &&
    !event.metaKey &&
    !event.isComposing &&
    event.code === "Space" &&
    (event.ctrlKey || event.shiftKey)
  ) {
    const rowToken = cell.parentElement?.dataset.gridRow;
    const index = event.ctrlKey
      ? Number(cell.dataset.columnKey)
      : Number(rowToken?.slice(7));
    if (Number.isInteger(index)) {
      event.preventDefault();
      if (event.ctrlKey && event.shiftKey) selectAll();
      else selectHeader(event.ctrlKey ? "column" : "row", index, false);
    }
    return;
  }
  if (
    event.key === "Delete" &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    range.value &&
    !editingDisabled.value
  ) {
    event.preventDefault();
    clearCells();
    return;
  }
  if (!(event.ctrlKey || event.metaKey)) return;
  const key = event.key.toLowerCase();
  if (key === "a") {
    event.preventDefault();
    selectAll();
    return;
  }
  if (key === "s" && canSave.value) {
    event.preventDefault();
    void storage.save();
  }
  if (key === "d" || key === "r") {
    event.preventDefault();
    fill(key === "d" ? "down" : "right");
  }
  if ((key === "f" || key === "h") && moreMenu.value) {
    event.preventDefault();
    void moreMenu.value.show(key === "f" ? "find" : "replace", cell);
  }
  if (key === "z" || key === "y") {
    event.preventDefault();
    if (key === "y" || event.shiftKey) redo();
    else undo();
  }
}

function virtualNavigation(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.altKey ||
    event.shiftKey ||
    ![
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ].includes(event.key) ||
    !(event.target as Element)?.matches("td[data-hys-cell-index]") ||
    !(gridOptions.value.virtualRows || gridOptions.value.virtualColumns)
  )
    return;
  const point = targetPoint(event.target);
  if (!point) return;
  const rows = rowData.value;
  const cols = columns.value;
  let row = rows.findIndex(({ index }) => index === point.row);
  let column = cols.findIndex(({ key }) => Number(key) === point.column);
  const rtl =
    getComputedStyle(event.target as Element).direction === "rtl" ? -1 : 1;
  const whole = event.ctrlKey || event.metaKey;
  if (event.key === "Home" || event.key === "End") {
    column = event.key === "Home" ? 0 : cols.length - 1;
    if (whole) row = event.key === "Home" ? 0 : rows.length - 1;
  } else {
    row += Number(event.key === "ArrowDown") - Number(event.key === "ArrowUp");
    column +=
      rtl *
      (Number(event.key === "ArrowRight") - Number(event.key === "ArrowLeft"));
  }
  event.preventDefault();
  if (rows[row] && cols[column])
    selectRange(cellAddress(rows[row].index, Number(cols[column].key)));
}

const instance: HysSpreadsheetInstance = {
  getWorkbook: () => book.value,
  getSelection: () => selection.value,
  undo,
  redo,
  setSheet,
  selectRange,
  selectAll,
  getSelectionSummary: () => summary.value,
  manageSheet,
  newWorkbook,
  openWorkbook,
  importWorkbook,
  exportWorkbook,
  saveWorkbookFile,
  saveWorkbook: storage.save,
  saveWorkbookAs,
  recalculate,
  manageAxis,
  setCells: (changes: readonly HysSpreadsheetCellChange[]) =>
    applyValues(changes, "edit"),
  configureCells,
  formatCells,
  validateCells,
  fill,
  paste,
  manageData,
  setConditionalFormats,
  copyConditionalFormats,
  applyStyle,
  find,
  replace,
  mergeCells: () => merge(true),
  unmergeCells: () => merge(false),
  getVersions: () => versions.value,
  compareVersions: history.compareVersions,
  restoreVersion,
  addComment,
  resolveComment,
  defineName,
};
let disposePlugins: (() => void)[] = [];
function applyPlugins() {
  disposePlugins.forEach((dispose) => dispose());
  disposePlugins = (props.plugins ?? []).flatMap((plugin) => {
    const dispose = plugin.install(instance);
    return dispose ? [dispose] : [];
  });
}
onMounted(applyPlugins);
watch(
  () => props.plugins,
  () => {
    if (mounted) applyPlugins();
  },
);
onBeforeUnmount(() => disposePlugins.forEach((dispose) => dispose()));
defineExpose(instance);
</script>

<template>
  <div
    ref="spreadsheetRoot"
    v-bind="attrs"
    class="hys-ui-spreadsheet"
    :class="{ 'hys-ui-spreadsheet-fullscreen': fullscreen }"
    @keydown.capture="virtualNavigation"
    @keydown="keyboard"
    @pointerdown.capture="onPointer"
    @pointerdown="selectionMotion.play"
    @copy.capture="onClipboard"
    @cut.capture="onClipboard"
    @paste.capture="onClipboard"
  >
    <SpreadsheetToolbar
      ref="toolbar"
      :custom="!!slots.toolbar"
      :settings-address="selectionAddress"
    >
      <template v-if="slots.toolbar || slots['toolbar-actions']" #extra>
        <slot
          v-if="slots.toolbar"
          name="toolbar"
          :workbook="book"
          :selection="selection"
          :spreadsheet="instance"
        />
        <slot v-else name="toolbar-actions" :workbook="book" :selection="selection" />
      </template>
      <template v-if="!slots.toolbar" #workbook>
        <SpreadsheetWorkbookMenu
          :readonly="readonly"
          :busy="!!busy"
          :can-save="canSave"
          :can-load="canLoad"
          :workbook="book"
          :formats="[...formats.values()]"
          :save-workbook-file="saveWorkbookFile"
          @import="importWorkbook"
          @create="newWorkbook()"
          @open="openWorkbook"
          @save="storage.save"
        />
      </template>
      <template #sheets>
        <SpreadsheetSheetPanel
          :sheets="book.sheets"
          :active="sheet.id"
          :readonly="readonly || busy === 'open'"
          :templates="sheetTemplates"
          @select="setSheet"
          @command="manageSheet"
          @delete="requestSheetDelete"
        />
      </template>
      <template #settings>
        <SpreadsheetCellSettings
          :disabled="!selectedEditable"
          @format="formatCells"
          @configure="configureCells"
          @name="defineName"
        />
      </template>
      <template #comments>
        <SpreadsheetHistory
          panel="comments"
          :address="selection?.anchor"
          :comments="comments"
          :comments-disabled="
            editingDisabled ||
            (!!selectedPoint &&
              !canEdit(sheet, selectedPoint.row, selectedPoint.column))
          "
          @comment="addComment"
          @resolve="resolveComment"
        />
      </template>
      <template #history>
        <SpreadsheetHistory
          panel="history"
          :versions="versions"
          :compare="history.compareVersions"
          :readonly="readonly"
          :locale="locale"
          @restore="restoreVersion"
        />
      </template>
      <template #sheet-transition>
        <HysRadioGroup
          v-model="sheetTransition"
          :options="sheetTransitionChoices"
          :aria-label="message('工作表切换动效')"
          vertical
          size="sm"
          class="hys-ui-spreadsheet-transition-options"
        />
      </template>
      <template #commands="{ triggerId, idPrefix, direct, overflow, active, inlineWidth, extraInMenu, measure }">
        <SpreadsheetMoreMenu
          ref="moreMenu"
          :trigger-id="triggerId"
          :id-prefix="idPrefix"
          :direct="direct"
          :overflow="overflow"
          :extra-in-menu="extraInMenu"
          :inline-width="inlineWidth"
          :action-disabled="toolbarActionDisabled"
          :measure="measure"
          :fullscreen="fullscreen"
          :active="active"
          :format="selectedFormat"
          :can-format="selectedEditable"
          @select="(group, focus) => toolbar?.showCommand(group, focus)"
          @action="toolbarActions[$event]()"
          @format="formatCells"
          @search="toolbar?.close(false)"
        >
          <template #inline="{ item }">
            <SpreadsheetFormatPopover
              v-if="isFormatPanel(item.id)"
              :panel="item.id"
              :format="selectedFormat"
              :disabled="!selectedEditable"
              @format="formatCells"
            />
          </template>
          <SpreadsheetSearchForm
            :sheet-id="sheet.id"
            :feedback="findFeedback"
            :results="findResults"
            :selection="findRanges"
            :disabled="editingDisabled"
            @find="showMatches"
            @replace="replaceMatches"
            @locate="locateMatch"
            @reset="resetFind"
          />
        </SpreadsheetMoreMenu>
      </template>
      <template #command-panel="{ group }">
        <SpreadsheetFormatPopover v-if="isFormatPanel(group)" :panel="group" :format="selectedFormat" :disabled="!selectedEditable" @format="formatCells" />
        <SpreadsheetCommands
          v-else-if="isInlineCommand(group)"
          :group="group"
          :feedback="feedback"
          :sheet="sheet"
          :selection="selection"
          :disabled="editingDisabled"
          :index="selectedPoint"
          :format="selectedFormat"
          @axis="manageAxis"
          @data="manageData"
          @format="formatCells"
          @configure="configureCells"
          @cut="useClipboard('cut')"
          @paste="useClipboard('paste', $event)"
          @fill="fill"
          @merge="merge"
          @fit="fitAxis"
          @brush="applyBrush"
          @style="applyStyle"
          @conditional="addConditionalRule"
          @validate="locateInvalid"
        >
          <template #view>
            <div class="hys-ui-spreadsheet-tools hys-ui-spreadsheet-view-tools">
              <HysButton
                v-if="!readonly"
                size="sm"
                variant="ghost"
                @click="changeCalculationMode"
              >
                {{
                  message(
                    book.calculationMode === "manual" ? "手动计算" : "自动计算",
                  )
                }}
              </HysButton>
              <HysButton
                v-if="book.calculationMode === 'manual'"
                size="sm"
                variant="ghost"
                @click="recalculate"
                >{{ message("重新计算") }}</HysButton
              >
              <HysAccordion
                v-if="rowCount > 20 || width > 12"
                class="hys-ui-spreadsheet-map"
                size="sm"
                ghost
                :items="[{ title: message('工作表地图') }]"
              >
                <template #content>
                  <HysButton
                    size="sm"
                    variant="ghost"
                    :aria-label="message('按位置定位工作表')"
                    class="hys-ui-spreadsheet-map-grid"
                    @click="scrollMap"
                  >
                    <i
                      v-if="selectedPoint"
                      :style="{
                        insetBlockStart:
                          (selectedPoint.row / rowCount) * 96 + '%',
                        insetInlineStart:
                          (selectedPoint.column / width) * 96 + '%',
                      }"
                    />
                  </HysButton>
                </template>
              </HysAccordion>
            </div>
          </template>
          <template #structure>
            <div class="hys-ui-spreadsheet-row-insert">
              <HysNumberInput
                size="sm"
                :model-value="toolbarRowInsertDraft"
                :aria-label="message('插入行数')"
                :min="1"
                :max="Math.max(1, rowInsertLimit)"
                :precision="0"
                :disabled="!toolbarRowInsertTarget.allowed"
                :show-controls="false"
                :value-on-clear="null"
                select-on-focus
                update-on-input
                @update:model-value="toolbarRowInsertCount = typeof $event === 'number' ? $event : null"
                @press-enter="nextTick(() => insertRows(toolbarRowInsertTarget.index, toolbarRowInsertDraft))"
              />
              <HysButton
                size="sm"
                variant="ghost"
                :icon="ListPlus"
                :disabled="!toolbarRowInsertTarget.allowed || !validInsertCount(toolbarRowInsertDraft)"
                @click="insertRows(toolbarRowInsertTarget.index, toolbarRowInsertDraft)"
              >{{ message('插入行') }}</HysButton>
            </div>
            <HysButton
              v-for="{ axis, add, label, icon } in structureActions"
              :key="label"
              size="sm"
              variant="ghost"
              :icon="icon"
              :disabled="!structureTarget(axis, add).allowed"
              @click="changeStructure(axis, add)"
              >{{ message(label) }}</HysButton
            >
          </template>
        </SpreadsheetCommands>
      </template>
    </SpreadsheetToolbar>
    <div class="hys-ui-spreadsheet-formula">
      <HysInput
        v-model="addressText"
        class="hys-ui-spreadsheet-address"
        size="sm"
        :aria-label="message('名称框')"
        placeholder="A1"
        @press-enter="locateSelection"
        @keydown.esc="addressText = selectionAddress"
      />
      <span aria-hidden="true">ƒx</span>
      <HysInput
        v-model="formulaText"
        size="sm"
        :aria-label="message('单元格内容与公式')"
        :disabled="!selection"
        :readonly="!selectedEditable"
        @press-enter="applyFormula"
      />
      <div
        v-if="!editingDisabled && suggestions.length"
        class="hys-ui-spreadsheet-suggestions"
        role="group"
        :aria-label="message('公式建议')"
      >
        <HysButton
          v-for="name in suggestions"
          :key="name"
          size="sm"
          variant="ghost"
          @click="completeFormula(name)"
          >{{ name }}</HysButton
        >
      </div>
      <small
        v-else-if="formulaSyntax"
        class="hys-ui-spreadsheet-suggestions"
        role="status"
        >{{ formulaSyntax }}</small
      >
    </div>
    <div
      ref="gridSurface"
      class="hys-ui-spreadsheet-grid"
      :data-row-reordering="rowPointer.source.value !== undefined || undefined"
      :style="{ zoom: appliedZoom / 100 }"
      @scroll.capture="cancelGridMotion"
      @wheel.passive="cancelSheetTransition"
      @pointerdown.capture="onGridPointerDown"
      @dblclick.capture="fitColumnDivider"
      @pointermove="rowPointer.motion"
      @pointerup="rowPointer.finish"
      @pointercancel="rowPointer.finish"
      @lostpointercapture="rowPointer.finish"
      @pointerover="columnDrag.hover"
      @pointerleave="columnDrag.clearHover"
      @dragstart.capture="columnDrag.start"
      @dragover.capture="columnDrag.over"
      @dragleave.capture="columnDrag.leave"
      @drop.capture="columnDrag.drop"
      @dragend.capture="columnDrag.end"
      @dragover="dragPoint && $event.preventDefault()"
      @drop="dropCells"
    >
      <HysProGrid
        ref="grid"
        :key="sheet.id"
        :rows="rowData"
        :columns="columns"
        :row-key="rowKey"
        :clipboard="clipboard"
        :show-edit-button="false"
        :show-edit-actions="showEditActions"
        :commit-on-blur="!showEditActions"
        type-to-edit
        :enter-to-edit="false"
        :grid-options="gridOptions"
        :readonly="editingDisabled"
        @cell-commit="accept([$event], 'edit')"
        @cells-commit="accept($event, 'paste')"
        @edit-error="editFailure"
        @edit-start="editingStarted"
        @edit-cancel="editingEnded"
        @context-menu-select="chooseContextItem"
      >
        <template #context-menu-item-control="{ value, disabled, select }">
          <HysNumberInput
            v-if="isAxisInsertKey(value)"
            v-model="axisInsertCounts[value]"
            class="hys-ui-spreadsheet-menu-quantity"
            size="sm"
            :aria-label="message(axisInsertLabels[value])"
            :min="1"
            :max="Math.max(1, axisInsertLimit(value))"
            :precision="0"
            :disabled="disabled"
            :show-controls="false"
            :value-on-clear="1"
            select-on-focus
            update-on-input
            @press-enter="(event) => { event.preventDefault(); nextTick(() => validInsertCount(axisInsertCounts[value], axisInsertLimit(value)) && select(event)); }"
          />
          <HysNumberInput
            v-else-if="value === 'row-set-height' || value === 'column-set-width'"
            v-model="axisSizeDraft"
            class="hys-ui-spreadsheet-menu-quantity"
            size="sm"
            :aria-label="message(value === 'row-set-height' ? '行高（像素）' : '列宽（像素）')"
            :min="16"
            :max="1000"
            :precision="0"
            :disabled="disabled"
            :show-controls="false"
            select-on-focus
            update-on-input
            @press-enter="(event) => { event.preventDefault(); nextTick(() => select(event)); }"
          />
        </template>
        <template #cell="context">
          <CellContent :context="context" />
          <span
            v-if="
              !editingDisabled &&
              rectangle &&
              context.row.index === rectangle.bottom &&
              Number(context.column.key) === rectangle.right
            "
            class="hys-ui-spreadsheet-handles"
          >
            <HysButton
              size="sm"
              variant="ghost"
              :aria-label="message('拖动移动选区')"
              draggable="true"
              @pointerdown.stop
              @dragstart.stop="
                beginCellDrag(
                  $event,
                  'move',
                  context.row.index,
                  Number(context.column.key),
                )
              "
              @dragend="dragPoint = undefined"
            />
            <HysButton
              size="sm"
              variant="ghost"
              :aria-label="message('拖动填充选区')"
              draggable="true"
              @pointerdown.stop
              @dragstart.stop="
                beginCellDrag(
                  $event,
                  'fill',
                  context.row.index,
                  Number(context.column.key),
                )
              "
              @dragend="dragPoint = undefined"
            />
          </span>
        </template>
        <template #editor="context">
          <slot
            v-if="
              slots.editor &&
              sheet.cells?.[
                cellAddress(
                  context.cell.row.index,
                  Number(context.cell.column.key),
                )
              ]?.type === 'custom'
            "
            name="editor"
            :sheet="sheet"
            :row="context.cell.row.index"
            :column="Number(context.cell.column.key)"
            :address="
              cellAddress(
                context.cell.row.index,
                Number(context.cell.column.key),
              )
            "
            :value="context.cell.value as HysSpreadsheetValue"
            :draft="context.draft"
            :set-draft="context.setDraft"
            :commit="context.commit"
            :cancel="context.cancel"
            :input-id="context.inputId"
          />
          <SpreadsheetCellEditor
            v-else
            :id="context.inputId"
            :draft="context.draft"
            :options="
              sheet.cells?.[
                cellAddress(
                  context.cell.row.index,
                  Number(context.cell.column.key),
                )
              ]
            "
            :disabled="context.phase !== 'editing'"
            :error-id="context.errorId"
            @change="context.setDraft"
            @commit="context.commit"
          />
        </template>
        <template #row-number-header>
          <HysButton
            class="hys-ui-spreadsheet-header-button"
            size="sm"
            variant="ghost"
            :aria-label="message('选择整张工作表')"
            :pressed="selectionAxis === 'all'"
            @click="selectAll"
            >◩</HysButton
          >
        </template>
        <template #row-number="{ row }">
          <div
            class="hys-ui-spreadsheet-row-header"
            :data-sheet-row="row.index"
            :data-row-dragging="rowPointer.source.value === row.index || undefined"
          >
            <HysButton
              class="hys-ui-spreadsheet-header-button hys-ui-spreadsheet-row-select"
              size="sm"
              variant="ghost"
              :aria-label="`选择第 ${row.index + 1} 行`"
              :aria-description="sheet.rowOptions?.[row.index]?.locked ? message('此行已锁定') : undefined"
              :data-row-movable="canMoveSelectedRow(row.index) || undefined"
              :aria-haspopup="props.contextMenu !== false && !editingDisabled && !sheet.protected ? 'menu' : undefined"
              :pressed="headerSelected('row', row.index)"
              draggable="false"
              @pointerdown="rowPointer.down($event, row.index)"
              @click="rowPointer.click($event, row.index)"
            >
              <span class="hys-ui-spreadsheet-axis-label">{{
                sheet.rowOptions?.[row.index]?.label ?? row.index + 1
              }}</span>
              <LockKeyhole
                v-if="sheet.rowOptions?.[row.index]?.locked"
                class="hys-ui-spreadsheet-axis-lock"
                :size="12"
                aria-hidden="true"
              />
            </HysButton>
            <SpreadsheetHiddenMarker
              v-for="marker in hiddenRowMarkers?.get(row.index)"
              :key="marker.side"
              axis="row"
              :range="marker"
              :readonly="!canReorderColumns"
              @reveal="revealHiddenAxis('row', marker, row.index)"
            />
          </div>
          <span
            v-if="canReorderColumns"
            class="hys-ui-spreadsheet-row-resize"
            role="separator"
            tabindex="0"
            aria-orientation="horizontal"
            :aria-label="message('调整第 {row} 行行高').replace('{row}', String(row.index + 1))"
            :aria-description="message('双击自动适应行高')"
            :aria-valuemin="minRowHeight"
            :aria-valuemax="maxRowHeight"
            :aria-valuenow="sheet.rowOptions?.[row.index]?.size ?? 35"
            @pointerdown="rowResize.start($event, row.index)"
            @pointermove="rowResize.move"
            @pointerup="rowResize.finish"
            @pointercancel="rowResize.finish"
            @lostpointercapture="rowResize.finish"
            @dblclick.stop.prevent="setAxisSizes('row', row.index, undefined, false)"
            @keydown="rowResize.key($event, row.index, sheet.rowOptions?.[row.index]?.size ?? 35)"
          />
        </template>
        <template #header-cell="{ column }">
          <div class="hys-ui-spreadsheet-column-header">
            <HysButton
              class="hys-ui-spreadsheet-header-button"
              size="sm"
              variant="ghost"
              :aria-label="`选择 ${column.label} 列`"
              :aria-description="columnStates.get(column.key)?.description"
              :aria-haspopup="props.contextMenu !== false && !editingDisabled && !sheet.protected ? 'menu' : undefined"
              :pressed="headerSelected('column', Number(column.key))"
              @click="activateHeader('column', Number(column.key), $event)"
            >
              <span class="hys-ui-spreadsheet-axis-label">{{ column.label }}</span>
              <LockKeyhole
                v-if="sheet.columnOptions?.[Number(column.key)]?.locked"
                class="hys-ui-spreadsheet-axis-lock"
                :size="12"
                aria-hidden="true"
              />
              <span
                v-if="!canReorderColumns && columnStates.get(column.key)?.direction"
                class="hys-ui-spreadsheet-column-state"
                :data-sort-direction="columnStates.get(column.key)?.direction"
                aria-hidden="true"
              >
                <component
                  :is="columnStates.get(column.key)?.direction === 'desc' ? ArrowDown : ArrowUp"
                  :size="13"
                />
                <small v-if="columnStates.get(column.key)?.rank">{{ columnStates.get(column.key)?.rank }}</small>
              </span>
              <Filter
                v-if="!canReorderColumns && columnStates.get(column.key)?.filtered"
                class="hys-ui-spreadsheet-column-state"
                data-column-filtered
                :size="13"
                aria-hidden="true"
              />
            </HysButton>
            <template v-if="canReorderColumns">
              <SpreadsheetToolbarButton
                class="hys-ui-spreadsheet-column-data"
                :icon="columnStates.get(column.key)?.direction === 'asc' ? ArrowUp : columnStates.get(column.key)?.direction === 'desc' ? ArrowDown : ChevronsUpDown"
                :label="columnDataLabel('sort', column.label)"
                :data-sort-direction="columnStates.get(column.key)?.direction"
                :aria-expanded="columnDataMenu?.column === Number(column.key) && columnDataMenu.mode === 'sort'"
                :tooltip="columnDataMenu?.column !== Number(column.key)"
                aria-haspopup="dialog"
                @click="openColumnDataMenu('sort', column.key, column.label, $event)"
              >
                <template v-if="columnStates.get(column.key)?.rank" #suffix>
                  <small aria-hidden="true">{{ columnStates.get(column.key)?.rank }}</small>
                </template>
              </SpreadsheetToolbarButton>
              <SpreadsheetToolbarButton
                class="hys-ui-spreadsheet-column-data"
                :icon="columnStates.get(column.key)?.filtered ? Filter : ListFilter"
                :label="columnDataLabel('filter', column.label)"
                :data-column-filtered="columnStates.get(column.key)?.filtered || undefined"
                :aria-expanded="columnDataMenu?.column === Number(column.key) && columnDataMenu.mode === 'filter'"
                :tooltip="columnDataMenu?.column !== Number(column.key)"
                aria-haspopup="dialog"
                @click="openColumnDataMenu('filter', column.key, column.label, $event)"
              />
            </template>
            <SpreadsheetToolbarButton
              v-if="canReorderColumns"
              class="hys-ui-spreadsheet-column-grip"
              :icon="GripVertical"
              :label="message('拖动调整列顺序')"
              draggable="true"
              @click="selectHeader('column', Number(column.key), $event.shiftKey)"
            />
            <SpreadsheetHiddenMarker
              v-for="marker in hiddenColumnMarkers?.get(Number(column.key))"
              :key="marker.side"
              axis="column"
              :range="marker"
              :readonly="!canReorderColumns"
              @reveal="revealHiddenAxis('column', marker, Number(column.key))"
            />
          </div>
        </template>
      </HysProGrid>
    </div>
    <SpreadsheetColumnDataMenu
      :menu="columnDataMenu"
      :sheet="sheet"
      :command="(command) => manageData(command, 'sheet')"
      @close="closeColumnDataMenu"
    />
    <div class="hys-ui-spreadsheet-sheets">
      <HysTabs
        ref="sheetTabs"
        :model-value="sheet.id"
        :items="tabs"
        size="sm"
        type="line"
        overflow="scroll"
        :draggable="canReorderSheetTabs"
        :readonly="readonly || busy === 'open'"
        :title-tooltip="false"
        :aria-label="message('工作表')"
        @update:model-value="setSheet(String($event))"
        @tab-contextmenu="openSheetTabMenu"
        @reorder="reorderSheetTab"
      >
        <template #icon="{ item }">
          <component
            v-if="item.icon"
            :is="item.icon"
            class="hys-ui-spreadsheet-tab-lock"
            :size="13"
            role="img"
            :aria-label="message('工作表受保护')"
          />
        </template>
        <template #label="{ item }">
          <span class="hys-ui-spreadsheet-tab-label">
            <i
              v-if="book.sheets.find(({ id }) => id === item.value)?.tabColor"
              :style="{
                backgroundColor: book.sheets.find(({ id }) => id === item.value)
                  ?.tabColor,
              }"
              aria-hidden="true"
            />
            {{ item.label }}
          </span>
        </template>
        <template v-if="!readonly" #suffix>
          <SpreadsheetToolbarButton
            :icon="Plus"
            :label="message('新建工作表')"
            :disabled="busy === 'open' || book.sheets.length >= sheetLimits.sheets"
            @click="manageSheet({ type: 'add' })"
          />
        </template>
      </HysTabs>
    </div>
    <SpreadsheetTabMenu
      v-if="!readonly"
      ref="sheetTabMenu"
      :sheets="book.sheets"
      :disabled="busy === 'open'"
      :command="manageSheet"
      @focus-tab="focusSheetTab"
    />
    <HysAccordion
      v-if="dataGroups.length"
      class="hys-ui-spreadsheet-data-groups"
      size="sm"
      ghost
      :items="[{ title: message('数据分组') }]"
    >
      <template #content>
        <HysAccordion
          multiple
          size="sm"
          :items="
            dataGroups.map((group) => ({
              id: group.rows[0],
              title: group.label + ' · ' + group.rows.length,
            }))
          "
        >
          <template #content="{ index }">
            <div class="hys-ui-spreadsheet-group-rows">
              <HysButton
                v-for="row in dataGroups[index].rows"
                :key="row"
                size="sm"
                variant="ghost"
                @click="selectHeader('row', row, false)"
                >{{ row + 1 }}</HysButton
              >
            </div>
            <span v-for="[column, sum] in dataGroups[index].sums" :key="column"
              >{{ columnLabel(column) }} {{ message("求和") }}
              {{ summaryNumber.format(sum) }}
            </span>
          </template>
        </HysAccordion>
      </template>
    </HysAccordion>
    <div class="hys-ui-spreadsheet-footer">
      <slot
        v-if="slots['status-bar']"
        name="status-bar"
        :selection="selection"
        :summary="summary"
        :dirty="dirty"
      />
      <div v-else class="hys-ui-spreadsheet-status">
        <span
          >{{ rowCount }} {{ message("行 ·") }} {{ width }}
          {{ message("列") }}</span
        >
        <span v-if="sheet.protected">{{ message("工作表受保护") }}</span>
        <span v-else-if="selectedPoint && !selectedEditable && !readonly">{{
          message("单元格已锁定或只读")
        }}</span>
        <HysButton
          v-if="sheet.unloaded && !loadingSheet && dataSource"
          size="sm"
          variant="ghost"
          @click="loadActiveSheet"
          >{{ message("重试加载") }}</HysButton
        >
        <span
          v-for="user in collaborators"
          :key="user.id"
          :style="{ color: user.color }"
        >
          {{ user.name
          }}{{
            user.selection?.sheetId === sheet.id
              ? ` · ${user.selection.anchor}`
              : ""
          }}
        </span>
        <span v-if="dirty">{{ message("有未保存的修改") }}</span>
        <span
          v-if="summary && summary.cells > 1"
          class="hys-ui-spreadsheet-summary"
        >
          <span
            >{{ message("已选") }} {{ summary.cells }} {{ message("格") }}</span
          >
          <span>{{ message("非空") }} {{ summary.nonEmpty }}</span>
          <template v-if="summary.average !== null">
            <span
              >{{ message("求和") }}
              {{ summaryNumber.format(summary.sum) }}</span
            >
            <span
              >{{ message("平均") }}
              {{ summaryNumber.format(summary.average) }}</span
            >
            <span v-if="summary.min !== null && summary.max !== null"
              >{{ message("最小") }} {{ summaryNumber.format(summary.min) }}
              {{ message("· 最大") }}
              {{ summaryNumber.format(summary.max) }}</span
            >
          </template>
        </span>
        <span v-if="feedback" role="status">{{ feedback }}</span>
        <div v-if="searchResults.length" class="hys-ui-spreadsheet-locate">
          {{ message("定位") }}
          <HysSelect
            size="sm"
            :model-value="selection?.anchor ?? ''"
            :options="searchResultOptions"
            :native-label-tooltip="false"
            :aria-label="message('定位')"
            @update:model-value="selectRange($event)"
          />
        </div>
        <slot
          name="status"
          :selection="selection"
          :summary="summary"
          :dirty="dirty"
        />
      </div>
      <div class="hys-ui-spreadsheet-zoom">
        <HysSlider
          v-model="zoom"
          size="sm"
          :min="60"
          :max="300"
          :step="10"
          show-stops
          :show-value="false"
          :show-tooltip="false"
          :format-value-text="(value) => `${value}%`"
          :aria-label="message('缩放')"
          @change="appliedZoom = $event"
        />
        <HysTooltip :text="message('重置缩放至 100%')" :trigger-keys="[]">
          <HysButton
            class="hys-ui-spreadsheet-zoom-reset"
            size="sm"
            variant="ghost"
            :aria-label="message('重置缩放至 100%')"
            @click="zoom = appliedZoom = 100"
            >{{ zoom }}%</HysButton
          >
        </HysTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hys-ui-spreadsheet {
  min-width: 0;
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 10px;
  background: var(--hys-ui-spreadsheet-background, var(--hys-ui-theme-surface));
}
.hys-ui-spreadsheet-fullscreen {
  position: fixed;
  inset: 0;
  inline-size: auto !important;
  block-size: auto !important;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  overflow: hidden;
  overscroll-behavior: contain;
}
.hys-ui-spreadsheet[data-fullscreen-motion="leave"] {
  position: relative;
  z-index: 2;
}
.hys-ui-spreadsheet-fullscreen > :not(.hys-ui-spreadsheet-grid) {
  flex: 0 0 auto;
}
.hys-ui-spreadsheet-fullscreen > .hys-ui-spreadsheet-grid,
.hys-ui-spreadsheet-fullscreen :deep(.hys-ui-pro-grid),
.hys-ui-spreadsheet-fullscreen :deep(.hys-ui-pf-grid) {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-block-size: 0;
}
.hys-ui-spreadsheet-fullscreen :deep(.hys-ui-pf-grid-scroll) {
  flex: 1 1 0;
  min-block-size: 0;
  overscroll-behavior: contain;
}
.hys-ui-spreadsheet-fullscreen > .hys-ui-spreadsheet-data-groups {
  max-block-size: min(30dvh, 240px);
  overflow: auto;
}
.hys-ui-spreadsheet-grid {
  position: relative;
  min-width: 0;
}
.hys-ui-spreadsheet-grid[data-sheet-transition] {
  isolation: isolate;
  overflow: clip;
}
.hys-ui-spreadsheet-grid :deep(.hys-ui-spreadsheet-outgoing-sheet) {
  position: absolute;
  inset: 0 0 auto;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  pointer-events: none;
}
.hys-ui-spreadsheet-grid :deep(.hys-ui-spreadsheet-outgoing-sheet *) {
  pointer-events: none;
}
.hys-ui-spreadsheet-grid[data-sheet-transition="wipe"] > :deep(.hys-ui-pro-grid),
.hys-ui-spreadsheet-grid[data-sheet-transition="scale"] > :deep(.hys-ui-pro-grid) {
  position: relative;
  z-index: 2;
}
.hys-ui-spreadsheet-transition-options {
  padding-inline: 4px;
}
.hys-ui-spreadsheet-data-groups {
  padding: 4px 8px;
  font-size: 13px;
}
.hys-ui-spreadsheet-group-rows {
  display: flex;
  flex-wrap: wrap;
  max-height: 100px;
  overflow: auto;
}
.hys-ui-spreadsheet-zoom,
.hys-ui-spreadsheet-locate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.hys-ui-spreadsheet-zoom {
  margin-inline-start: auto;
  align-self: flex-end;
  min-inline-size: 0;
  flex: 0 0 auto;
  gap: 5px;
  font-variant-numeric: tabular-nums;
}
.hys-ui-spreadsheet-zoom :deep(.hys-ui-slider-wrap) {
  --hys-ui-slider-rail-size: 6px;
  --hys-ui-slider-handle-size: 15px;
  --hys-ui-slider-hit-size: 32px;
  inline-size: clamp(130px, 30vw, 190px);
}
.hys-ui-spreadsheet-zoom :deep(.hys-ui-slider-axis) {
  min-block-size: 28px;
}
.hys-ui-spreadsheet-zoom :deep(.hys-ui-slider-background) {
  background: color-mix(
    in srgb,
    var(--hys-ui-theme-primary) 16%,
    var(--hys-ui-theme-surface-alt)
  );
}
.hys-ui-spreadsheet-zoom-reset {
  min-inline-size: 48px;
  padding-inline: 4px;
  color: var(--hys-ui-theme-text);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.hys-ui-spreadsheet-zoom
  .hys-ui-spreadsheet-zoom-reset:not(:disabled):is(:hover, :active) {
  color: var(--hys-ui-theme-text);
  border-color: transparent;
  background: transparent;
}
.hys-ui-spreadsheet-zoom :deep(.hys-ui-slider-stop) {
  width: 1px;
  height: 2px;
  border: 0;
  border-radius: 1px;
  background: color-mix(in srgb, var(--hys-ui-theme-primary) 42%, transparent);
}
.hys-ui-spreadsheet-zoom :deep(.hys-ui-slider-stop-active) {
  background: color-mix(in srgb, var(--hys-ui-theme-surface) 66%, transparent);
}
.hys-ui-spreadsheet-map {
  inline-size: min(155px, 100%);
}
.hys-ui-spreadsheet-map-grid {
  position: relative;
  display: block;
  width: 110px;
  height: 62px;
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0 10px,
      var(--hys-ui-theme-border) 10px 11px
    ),
    repeating-linear-gradient(
      0deg,
      var(--hys-ui-theme-surface-alt) 0 7px,
      var(--hys-ui-theme-border) 7px 8px
    );
  border: 1px solid var(--hys-ui-theme-border);
  cursor: crosshair;
}
.hys-ui-spreadsheet-map-grid i {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--hys-ui-theme-primary);
}
.hys-ui-spreadsheet-handles {
  position: absolute;
  inset-inline-end: 2px;
  inset-block-end: 2px;
  display: inline-flex;
  align-items: end;
  gap: 4px;
  z-index: 2;
}
.hys-ui-spreadsheet .hys-ui-spreadsheet-handles button {
  min-height: 0;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--hys-ui-spreadsheet-selection, var(--hys-ui-theme-primary));
  cursor: move;
}
.hys-ui-spreadsheet .hys-ui-spreadsheet-handles button:not(:disabled):hover {
  background: transparent;
  border-color: transparent;
}
.hys-ui-spreadsheet-handles button::after {
  content: "";
  display: block;
  width: 6px;
  height: 6px;
  margin: 3px;
  border: 1px solid currentColor;
  background: var(--hys-ui-theme-surface);
}
.hys-ui-spreadsheet-handles button:first-child:not(:hover, :focus-visible) {
  opacity: 0;
}
.hys-ui-spreadsheet-handles:hover button:first-child {
  opacity: 1;
}
.hys-ui-spreadsheet-handles button + button {
  cursor: crosshair;
}
.hys-ui-spreadsheet-handles button + button::after {
  background: currentColor;
}
.hys-ui-spreadsheet-tools,
.hys-ui-spreadsheet-sheets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.hys-ui-spreadsheet-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.hys-ui-spreadsheet-tab-lock {
  color: var(--hys-ui-theme-muted);
}
.hys-ui-spreadsheet-tab-label i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.hys-ui-spreadsheet-tools {
  border-inline-start: 1px solid var(--hys-ui-theme-border);
  padding-inline-start: 8px;
}
.hys-ui-spreadsheet-view-tools {
  align-items: flex-start;
  border: 0;
  padding: 3px 0 6px;
  gap: 6px 12px;
}
.hys-ui-spreadsheet-formula {
  display: grid;
  grid-template-columns: 88px 20px minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
}
.hys-ui-spreadsheet-address {
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.hys-ui-spreadsheet-formula > span {
  font-family: Georgia, serif;
  font-style: italic;
  color: var(--hys-ui-theme-muted);
}
.hys-ui-spreadsheet-suggestions {
  display: flex;
  flex-wrap: wrap;
  grid-column: 3;
  gap: 4px;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid) {
  border-inline: 0;
  border-radius: 0;
  background: var(--hys-ui-spreadsheet-background, var(--hys-ui-theme-surface));
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid-scroll) {
  position: relative;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-selection-frame) {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid
    var(--hys-ui-spreadsheet-selection, var(--hys-ui-theme-primary));
  pointer-events: none;
  z-index: 3;
}
.hys-ui-spreadsheet
  :deep(.hys-ui-spreadsheet-selection-frame[data-focus-visible]) {
  border-color: var(
    --hys-ui-spreadsheet-active,
    var(--hys-ui-spreadsheet-selection, var(--hys-ui-theme-primary))
  );
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid td[data-column-key]) {
  border-inline-end: 1px solid
    var(--hys-ui-spreadsheet-gridline, var(--hys-ui-theme-border));
  border-block-end-color: var(
    --hys-ui-spreadsheet-gridline,
    var(--hys-ui-theme-border)
  );
  padding-block: 6px;
  user-select: none;
  -webkit-user-select: none;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid .hys-ui-spreadsheet-row-sized > td) {
  padding-block: 0;
}
/* Constrain the contents so the table treats a configured row height as exact. */
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-row-sized .hys-ui-pf-grid-cell-display) {
  display: block;
  overflow: clip;
  line-height: min(1.55em, calc(var(--hys-sheet-row-height) - 1px));
  max-block-size: calc(var(--hys-sheet-row-height) - 1px);
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-row-sized .hys-ui-pf-grid-row-number .hys-ui-spreadsheet-header-button) {
  display: flex;
  min-block-size: 0;
  block-size: calc(var(--hys-sheet-row-height) - 1px);
  line-height: 1;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid th) {
  user-select: none;
  -webkit-user-select: none;
}
.hys-ui-spreadsheet
  :deep(.hys-ui-pro-grid-editor :is(input, textarea, [contenteditable])) {
  user-select: text;
  -webkit-user-select: text;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid th[data-column-key]) {
  border-inline-end: 1px solid
    var(--hys-ui-spreadsheet-gridline, var(--hys-ui-theme-border));
}
.hys-ui-spreadsheet :deep(td[data-hys-pro-grid-range]) {
  --hys-sheet-selection-ink: var(
    --hys-ui-spreadsheet-selection,
    var(--hys-ui-theme-primary)
  );
}
.hys-ui-spreadsheet
  :deep(.hys-ui-pro-grid .hys-ui-pf-grid tbody td[data-hys-pro-grid-range]) {
  box-shadow: none;
  position: relative;
  background-image: var(--hys-ui-spreadsheet-cell-image, none);
}
.hys-ui-spreadsheet
  :deep(
    .hys-ui-pf-grid
      td[data-hys-pro-grid-range="multiple"][data-hys-pro-grid-range-edges]
  ) {
  overflow: visible;
}
.hys-ui-spreadsheet
  :deep(
    td[data-hys-pro-grid-range="multiple"][data-hys-pro-grid-range-edges]
      .hys-ui-pro-grid-cell
      > :first-child
  ) {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hys-ui-spreadsheet :deep(td[data-hys-pro-grid-range]::after) {
  content: "";
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border-style: solid;
  border-color: var(--hys-sheet-selection-ink);
  border-block-start-width: var(--hys-sheet-edge-top, 0px);
  border-block-end-width: var(--hys-sheet-edge-bottom, 0px);
  border-inline-start-width: var(--hys-sheet-edge-start, 0px);
  border-inline-end-width: var(--hys-sheet-edge-end, 0px);
  background: color-mix(
    in srgb,
    var(--hys-sheet-selection-ink) 9%,
    transparent
  );
  pointer-events: none;
  z-index: 1;
}
.hys-ui-spreadsheet
  :deep(
    td[data-hys-pro-grid-range="multiple"]:is(
        [data-hys-pro-grid-range-edges~="top"],
        [data-hys-pro-grid-range-edges~="bottom"]
      ):not([data-hys-pro-grid-range-edges~="end"])::after
  ) {
  inset-inline-end: -1px;
}
.hys-ui-spreadsheet
  :deep(
    td[data-hys-pro-grid-range="multiple"]:is(
        [data-hys-pro-grid-range-edges~="start"],
        [data-hys-pro-grid-range-edges~="end"]
      ):not([data-hys-pro-grid-range-edges~="bottom"])::after
  ) {
  inset-block-end: -1px;
}
.hys-ui-spreadsheet :deep(td[data-hys-pro-grid-range-edges~="top"]) {
  --hys-sheet-edge-top: 2px;
}
.hys-ui-spreadsheet :deep(td[data-hys-pro-grid-range-edges~="bottom"]) {
  --hys-sheet-edge-bottom: 2px;
}
.hys-ui-spreadsheet :deep(td[data-hys-pro-grid-range-edges~="start"]) {
  --hys-sheet-edge-start: 2px;
}
.hys-ui-spreadsheet :deep(td[data-hys-pro-grid-range-edges~="end"]) {
  --hys-sheet-edge-end: 2px;
}
.hys-ui-spreadsheet
  :deep(
    .hys-ui-pro-grid .hys-ui-pf-grid td.hys-ui-pro-grid-cell-active::after
  ) {
  content: "";
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border: 2px solid
    var(
      --hys-ui-spreadsheet-active,
      var(--hys-ui-spreadsheet-selection, var(--hys-ui-theme-primary))
    );
  pointer-events: none;
  background: transparent;
  z-index: 2;
}
.hys-ui-spreadsheet
  :deep(td.hys-ui-pro-grid-cell-active:has([data-invalid])::after) {
  border-color: var(--hys-ui-theme-red);
}
.hys-ui-spreadsheet
  :deep(td.hys-ui-pro-grid-cell-active .hys-ui-pro-grid-editor) {
  inset: 0;
  padding-inline: 8px 4px;
  border-radius: 0;
  outline: none;
}
.hys-ui-spreadsheet
  :deep(.hys-ui-pro-grid-editor :is(input, select, textarea):focus) {
  outline: none;
  box-shadow: none;
  border-color: transparent;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid td:focus-visible) {
  outline-color: var(--hys-ui-spreadsheet-active, var(--hys-ui-theme-primary));
}
.hys-ui-spreadsheet
  :deep(.hys-ui-pf-grid td[data-hys-pro-grid-range]:focus-visible) {
  outline: none;
}
.hys-ui-spreadsheet
  :deep(
    .hys-ui-pf-grid td[data-hys-pro-grid-range="single"]:focus-visible::after
  ) {
  border-width: 2px;
  border-color: var(
    --hys-ui-spreadsheet-active,
    var(--hys-sheet-selection-ink)
  );
}
.hys-ui-spreadsheet
  :deep(
    .hys-ui-pf-grid
      td[data-hys-pro-grid-range="single"][data-hys-spreadsheet-selection-moving]::after
  ) {
  border-width: 0;
}
@media (forced-colors: active) {
  .hys-ui-spreadsheet :deep(.hys-ui-pf-grid td[data-hys-pro-grid-range]) {
    outline: none;
  }
  .hys-ui-spreadsheet :deep(.hys-ui-pf-grid td[data-hys-pro-grid-range]::after),
  .hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-selection-frame) {
    border-color: Highlight;
  }
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid-head) {
  justify-content: center;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid-head:has(.hys-ui-pf-grid-resize)) {
  padding-inline-end: 10px;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid-resize) {
  inset: 0 0 0 auto;
  width: 10px;
  border-color: transparent;
  z-index: 1;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid-resize::before) {
  content: "";
  position: absolute;
  inset: 9px 1px;
  border-inline-end: 2px solid var(--hys-ui-theme-border);
  border-radius: 2px;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid-resize:is(:hover, :focus-visible, :active)) {
  border-color: var(--hys-ui-theme-primary);
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid-row-number),
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid thead th[data-column-key]) {
  padding: 0;
}
.hys-ui-spreadsheet-column-header {
  position: relative;
  display: flex;
  align-items: center;
}
.hys-ui-spreadsheet-column-header:has(.hidden-axis-marker[data-side="before"]) {
  padding-inline-start: min(12px, 25%);
}
.hys-ui-spreadsheet-column-header:has(.hidden-axis-marker[data-side="after"]) {
  padding-inline-end: min(12px, 25%);
}
.hys-ui-spreadsheet-row-header {
  position: relative;
  display: flex;
  align-items: stretch;
  user-select: none;
}
.hys-ui-spreadsheet-row-resize {
  position: absolute;
  z-index: 1;
  inset-inline: 0;
  inset-block-end: 0;
  block-size: 5px;
  cursor: row-resize;
  touch-action: none;
}
.hys-ui-spreadsheet-row-resize:is(:hover, :focus-visible) {
  box-shadow: inset 0 -2px var(--hys-ui-theme-primary);
}
.hys-ui-spreadsheet-grid :deep(.hys-ui-pf-grid-scroll[data-row-resizing]),
.hys-ui-spreadsheet-grid :deep(.hys-ui-pf-grid-scroll[data-row-resizing] *) {
  cursor: row-resize;
}
.hys-ui-spreadsheet-grid :deep(.hys-ui-spreadsheet-row-resize-guide) {
  position: absolute;
  z-index: 3;
  block-size: 2px;
  transform: translateY(-50%);
  pointer-events: none;
  background: var(--hys-ui-spreadsheet-selection, var(--hys-ui-theme-primary));
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-row-select) {
  flex: 1;
  min-inline-size: 0;
  cursor: crosshair;
  overflow: hidden;
}
.hys-ui-spreadsheet-axis-label {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hys-ui-spreadsheet-axis-lock {
  flex: none;
  color: var(--hys-ui-theme-muted);
}
.hys-ui-spreadsheet-column-state {
  display: inline-flex;
  align-items: center;
  flex: none;
  color: var(--hys-ui-theme-primary);
}
.hys-ui-spreadsheet-column-state small {
  font-size: 9px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-column-data) {
  inline-size: 18px;
  gap: 0;
  color: var(--hys-ui-theme-muted);
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-column-data svg) {
  inline-size: 12px;
  block-size: 12px;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-column-data:is(:hover, [aria-expanded="true"], [data-sort-direction], [data-column-filtered])) {
  color: var(--hys-ui-theme-primary);
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-column-data small) {
  font-size: 9px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid .hys-ui-pf-grid-row-number:has(.hys-ui-spreadsheet-row-select[aria-pressed="true"])) {
  background: color-mix(in srgb, var(--hys-ui-theme-primary) 10%, var(--hys-ui-theme-surface-alt));
}
.hys-ui-spreadsheet-row-header > :deep(.hys-ui-spreadsheet-row-select[aria-pressed="true"]) {
  background: transparent;
  border-color: transparent;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-row-select[data-row-movable]) {
  cursor: grab;
}
.hys-ui-spreadsheet-grid[data-row-reordering] :deep(.hys-ui-spreadsheet-row-select) {
  cursor: grabbing;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid .hys-ui-pf-grid-row-number:has(.hys-ui-spreadsheet-row-header[data-row-dragging])) {
  background: color-mix(in srgb, var(--hys-ui-theme-primary) 19%, var(--hys-ui-theme-surface-alt));
}
.hys-ui-spreadsheet-grid :deep(.hys-ui-spreadsheet-row-drop) {
  --row-drop-ink: var(--hys-ui-spreadsheet-selection, var(--hys-ui-theme-primary));
  position: absolute;
  z-index: 3;
  pointer-events: none;
  background: color-mix(in srgb, var(--row-drop-ink) 8%, transparent);
}
.hys-ui-spreadsheet-grid :deep(.hys-ui-spreadsheet-row-drop::before),
.hys-ui-spreadsheet-grid :deep(.hys-ui-spreadsheet-row-drop::after) {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: var(--row-drop-edge, 0%);
  transform: translateY(-50%);
  background: var(--row-drop-ink);
}
.hys-ui-spreadsheet-grid :deep(.hys-ui-spreadsheet-row-drop::before) {
  inset-inline-end: 0;
  block-size: 2px;
}
.hys-ui-spreadsheet-grid :deep(.hys-ui-spreadsheet-row-drop::after) {
  inline-size: 8px;
  block-size: 10px;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}
.hys-ui-spreadsheet-grid :deep(.hys-ui-spreadsheet-row-drop[data-position="after"]) {
  --row-drop-edge: 100%;
}
.hys-ui-spreadsheet-grid :deep(tr[data-row-inserting]) {
  position: relative;
  z-index: 3;
  background: var(--hys-ui-spreadsheet-background, var(--hys-ui-theme-surface));
}
.hys-ui-spreadsheet-grid :deep(tr[data-row-emphasized] > td[data-column-key]) {
  position: relative;
}
.hys-ui-spreadsheet-grid :deep(tr[data-row-emphasized] > td[data-column-key]::before) {
  --row-emphasis-ink: var(--hys-ui-spreadsheet-selection, var(--hys-ui-theme-primary));
  content: "";
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: color-mix(in srgb, var(--row-emphasis-ink) 18%, transparent);
  box-shadow: inset 0 2px var(--row-emphasis-ink), inset 0 -2px var(--row-emphasis-ink);
  animation: hys-spreadsheet-row-emphasis 460ms ease-out 3 both;
}
@keyframes hys-spreadsheet-row-emphasis {
  0% { opacity: 0; }
  24% { opacity: 1; }
  100% { opacity: 0; }
}
.hys-ui-spreadsheet-row-insert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.hys-ui-spreadsheet-menu-quantity.hys-ui-number-wrap {
  flex: 0 0 64px;
  inline-size: 64px;
  min-inline-size: 0;
  margin-inline: 4px 8px;
}
.hys-ui-spreadsheet-row-insert > :deep(.hys-ui-number-wrap) {
  inline-size: 72px;
  min-inline-size: 0;
}
.hys-ui-spreadsheet :deep(.hys-ui-pf-grid-sort-group > .hys-ui-pf-grid-sort-label) {
  inline-size: 100%;
  min-inline-size: 0;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-column-header .hys-ui-spreadsheet-header-button) {
  flex: 1;
  min-inline-size: 0;
  justify-content: flex-start;
  overflow: hidden;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-column-grip) {
  flex: 0 0 22px;
  inline-size: 22px;
  color: var(--hys-ui-theme-muted);
  cursor: grab;
  opacity: 0;
  pointer-events: none;
}
.hys-ui-spreadsheet :deep(th:is(:hover, [data-column-hovered], .hys-ui-spreadsheet-column-dragging) .hys-ui-spreadsheet-column-grip),
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-column-grip:focus-visible) {
  opacity: 1;
  pointer-events: auto;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-column-grip:is(:hover, :focus-visible)) {
  color: var(--hys-ui-theme-primary);
}
.hys-ui-spreadsheet :deep(th.hys-ui-spreadsheet-column-dragging) {
  opacity: 0.55;
}
.hys-ui-spreadsheet
  :deep(th:is(.hys-ui-spreadsheet-column-drop-before, .hys-ui-spreadsheet-column-drop-after)::after) {
  position: absolute;
  inset-block: 3px;
  width: 3px;
  border-radius: 2px;
  background: var(--hys-ui-spreadsheet-selection, var(--hys-ui-theme-primary));
  z-index: 8;
  pointer-events: none;
  content: "";
}
.hys-ui-spreadsheet :deep(th.hys-ui-spreadsheet-column-drop-before::after) {
  left: 0;
}
.hys-ui-spreadsheet :deep(th.hys-ui-spreadsheet-column-drop-after::after) {
  right: 0;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-header-button) {
  width: 100%;
  min-height: 32px;
  padding: 0 4px;
  gap: 3px;
  border-radius: 0;
  color: var(--hys-ui-spreadsheet-header-color, inherit);
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-header-button:focus-visible) {
  outline-offset: -2px;
}
.hys-ui-spreadsheet
  :deep(.hys-ui-spreadsheet-header-button[aria-pressed="true"]) {
  color: var(--hys-ui-theme-primary);
}
.hys-ui-spreadsheet-summary {
  display: flex;
  gap: 4px 12px;
  flex-wrap: wrap;
}
.hys-ui-spreadsheet :deep(.hys-ui-pro-grid-cell) {
  min-block-size: 22px;
  vertical-align: middle;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-cell-tooltip) {
  display: inline-block;
  max-inline-size: 100%;
  vertical-align: baseline;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-number) {
  font-variant-numeric: tabular-nums;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-bold) {
  font-weight: 700;
}
.hys-ui-spreadsheet :deep(.hys-ui-spreadsheet-error) {
  color: var(--hys-ui-theme-red);
  font-weight: 600;
}
.hys-ui-spreadsheet-sheets {
  padding: 0 8px;
}
.hys-ui-spreadsheet-sheets :deep(.hys-ui-tabs) {
  flex: 1 1 180px;
  min-width: 0;
}
.hys-ui-spreadsheet-footer,
.hys-ui-spreadsheet-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 16px;
}
.hys-ui-spreadsheet-footer {
  padding: 6px 10px;
  color: var(--hys-ui-theme-muted);
  border-top: 1px solid var(--hys-ui-theme-border);
  font-size: 12px;
}
.hys-ui-spreadsheet-status {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
