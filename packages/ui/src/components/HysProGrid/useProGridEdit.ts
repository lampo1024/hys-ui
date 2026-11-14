import {
  computed,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  shallowRef,
  watch,
} from "vue";
import type { HysDataGridCellContext } from "../HysDataGrid/gridPresentation";
import type { HysDataGridKey } from "../../composables/dataGrid";
import type {
  HysProGridCancelReason,
  HysProGridCell,
  HysProGridChange,
  HysProGridEditor,
  HysProGridEditPhase,
  HysProGridFailure,
  HysProGridMessages,
  HysProGridProps,
} from "./proGridTypes";
import {
  gridEditChange,
  gridEditRejection,
  initialGridDraft,
  parseGridDraft,
} from "./proGridValues";

interface EditSession<T extends object> {
  cell: HysProGridCell<T>;
  editor: HysProGridEditor<T>;
}

interface EditOptions<T extends object> {
  props: HysProGridProps<T>;
  words: () => HysProGridMessages;
  cell: (context: HysDataGridCellContext<T>) => HysProGridCell<T> | undefined;
  current: (cell: HysProGridCell<T>) => boolean;
  visible: (cell: HysProGridCell<T>) => boolean;
  hasCustomEditor: () => boolean;
  batchActive: () => boolean;
  focus: (rowKey: HysDataGridKey, columnKey: string) => boolean;
  start: (cell: HysProGridCell<T>) => void;
  committed: (change: HysProGridChange<T>) => void;
  failed: (failure: HysProGridFailure) => void;
  cancelled: (cell: HysProGridCell<T>, reason: HysProGridCancelReason) => void;
}

export function useProGridEdit<T extends object>(options: EditOptions<T>) {
  const { props } = options;
  const session = shallowRef<EditSession<T>>();
  const draft = shallowRef<unknown>();
  const phase = shallowRef<HysProGridEditPhase>("editing");
  const error = shallowRef<HysProGridFailure>();
  const address = computed(() =>
    session.value
      ? {
          rowKey: session.value.cell.rowKey,
          columnKey: session.value.cell.column.key,
        }
      : null,
  );
  let request: AbortController | undefined;

  function editable(cell: HysProGridCell<T>) {
    return (
      !props.readonly &&
      !props.gridOptions?.loading &&
      !!cell.column.editor &&
      (cell.column.editor.type !== "custom" || options.hasCustomEditor()) &&
      cell.column.canEdit?.(cell) !== false
    );
  }

  function canBegin(cell: HysProGridCell<T>) {
    return editable(cell) && options.current(cell);
  }

  function reset(abort = true) {
    const task = request;
    request = undefined;
    session.value = undefined;
    error.value = undefined;
    draft.value = undefined;
    phase.value = "editing";
    if (abort) task?.abort();
  }

  function restore(cell: HysProGridCell<T>) {
    void nextTick(() => {
      if (!session.value) options.focus(cell.rowKey, cell.column.key);
    });
  }

  function cancel(
    reason: HysProGridCancelReason = "cancel",
    restoreFocus = true,
  ) {
    const cell = session.value?.cell;
    if (!cell) return;
    reset();
    if (restoreFocus) restore(cell);
    options.cancelled(cell, reason);
  }

  function begin(context: HysDataGridCellContext<T>, initialText?: string) {
    if (options.batchActive()) return false;
    const cell = options.cell(context);
    if (!cell || !canBegin(cell)) return false;
    if (session.value)
      return (
        session.value.cell.rowKey === cell.rowKey &&
        session.value.cell.column.key === cell.column.key
      );
    const editor = cell.column.editor!;
    let initial: unknown;
    try {
      initial =
        initialText === undefined
          ? initialGridDraft(cell, editor)
          : initialText;
    } catch (cause) {
      options.failed({
        rowKey: cell.rowKey,
        columnKey: cell.column.key,
        stage: "parse",
        message: options.words().invalidValue,
        cause,
      });
      return false;
    }
    draft.value = initial;
    session.value = { cell, editor };
    options.start(cell);
    return true;
  }

  function setDraft(value: unknown) {
    if (!session.value || phase.value !== "editing") return;
    draft.value = value;
    error.value = undefined;
  }

  function fail(
    active: EditSession<T>,
    stage: HysProGridFailure["stage"],
    message: string,
    cause?: unknown,
  ) {
    if (session.value !== active) return false;
    phase.value = "editing";
    error.value = {
      rowKey: active.cell.rowKey,
      columnKey: active.cell.column.key,
      stage,
      message,
      ...(cause !== undefined ? { cause } : {}),
    };
    options.failed(error.value);
    return false;
  }

  async function commit(restoreFocus = true) {
    const active = session.value;
    if (!active || phase.value !== "editing" || request) return false;
    const { cell, editor } = active;
    if (!options.visible(cell)) {
      cancel("view-change", false);
      return false;
    }
    if (!canBegin(cell)) {
      cancel("data-change", false);
      return false;
    }
    const words = options.words();
    let parsed;
    try {
      parsed = parseGridDraft(draft.value, cell, editor, words);
    } catch (cause) {
      return fail(active, "parse", words.invalidValue, cause);
    }
    if (!parsed.ok) return fail(active, "parse", parsed.message);

    const change = gridEditChange(cell, editor, parsed.value);
    const task = new AbortController();
    request = task;
    error.value = undefined;
    const stillCurrent = () => {
      if (session.value !== active || task.signal.aborted) return false;
      if (!options.visible(cell)) {
        cancel("view-change", false);
        return false;
      }
      if (canBegin(cell)) return true;
      cancel("data-change", false);
      return false;
    };
    let stage: "validate" | "save" = "validate";
    try {
      if (cell.column.validate) {
        phase.value = "validating";
        const decision = await cell.column.validate(change, {
          signal: task.signal,
        });
        if (!stillCurrent()) return false;
        const message = gridEditRejection(decision, words.validationFailed);
        if (message) return fail(active, stage, message);
      }
      if (props.saveCell) {
        stage = "save";
        phase.value = "saving";
        const decision = await props.saveCell(change, { signal: task.signal });
        if (!stillCurrent()) return false;
        const message = gridEditRejection(decision, words.saveFailed);
        if (message) return fail(active, stage, message);
      }
      if (!stillCurrent()) return false;
      reset(false);
      if (restoreFocus) restore(cell);
      options.committed(change);
      return true;
    } catch (cause) {
      if (!stillCurrent()) return false;
      return fail(
        active,
        stage,
        stage === "validate" ? words.validationFailed : words.saveFailed,
        cause,
      );
    } finally {
      if (request === task) request = undefined;
    }
  }

  watch(
    () => {
      const cell = session.value?.cell;
      return !cell || canBegin(cell);
    },
    (valid) => {
      if (!valid) cancel("data-change", false);
    },
    { flush: "sync" },
  );
  onDeactivated(() => reset());
  onBeforeUnmount(() => reset());

  return {
    session,
    draft,
    phase,
    error,
    address,
    canBegin,
    begin,
    cancel,
    commit,
    setDraft,
  };
}
