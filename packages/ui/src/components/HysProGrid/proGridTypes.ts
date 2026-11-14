import type { VNodeChild } from "vue";
import type { HysContextMenuSlots } from "../../composables/menu";
import type {
  GridColumn,
  HysDataGridKey,
  HysDataGridProps,
  HysDataGridQuery,
} from "../../composables/dataGrid";
import type {
  HysDataGridCellContext,
  HysDataGridCellView,
  HysDataGridRowContext,
  HysDataGridHeaderContext,
} from "../HysDataGrid/gridPresentation";
import type {
  HysDataGridColumnLayout,
  HysDataGridColumnLayoutSnapshot,
} from "../HysDataGrid/gridColumnLayout";

export type HysProGridChoiceValue = string | number | boolean;
export interface HysProGridChoice {
  label: string;
  value: HysProGridChoiceValue;
}

export type HysProGridParseResult =
  { ok: true; value: unknown } | { ok: false; message: string };

export type HysProGridEditor<T extends object> =
  | { type: "text"; trim?: boolean }
  | { type: "number"; min?: number; max?: number; nullable?: boolean }
  | { type: "select"; options: readonly HysProGridChoice[] }
  | {
      type: "custom";
      typeToEdit?: (cell: HysProGridCell<T>) => boolean;
      commitOnBlur?: (cell: HysProGridCell<T>) => boolean;
      toDraft?: (context: HysProGridCell<T>) => unknown;
      parse?: (
        draft: unknown,
        context: HysProGridCell<T>,
      ) => HysProGridParseResult;
    };

export interface HysProGridAddress {
  rowKey: HysDataGridKey;
  columnKey: string;
}

export interface HysProGridCell<T extends object> extends Omit<
  HysDataGridCellContext<T>,
  "column"
> {
  column: HysProGridColumn<T>;
}

export type HysProGridChange<T extends object> = HysProGridAddress & {
  row: T;
  previousValue: unknown;
} & (
    | { editor: "text"; value: string }
    | { editor: "number"; value: number | null }
    | { editor: "select"; value: HysProGridChoiceValue }
    | { editor: "custom"; value: unknown }
  );

export type HysProGridDecision = void | boolean | string;
export type HysProGridEditHandler<T extends object> = (
  change: HysProGridChange<T>,
  context: { signal: AbortSignal },
) => HysProGridDecision | Promise<HysProGridDecision>;

export type HysProGridBatchSave<T extends object> = (
  changes: readonly HysProGridChange<T>[],
  context: { signal: AbortSignal },
) => HysProGridDecision | Promise<HysProGridDecision>;

export interface HysProGridClipboardBinding<T extends object> {
  attach(context: {
    root: HTMLElement;
    getView(): HysDataGridCellView<T> | undefined;
    getCell(context: HysDataGridCellContext<T>): HysProGridCell<T> | undefined;
    canEdit(cell: HysProGridCell<T>): boolean;
    reserve(): AbortController | undefined;
    release(task: AbortController): void;
    getSaveCell(): HysProGridEditHandler<T> | undefined;
    messages(): HysProGridMessages;
    commit(changes: readonly HysProGridChange<T>[]): void;
  }): () => void;
}

export interface HysProGridColumn<
  T extends object = Record<string, unknown>,
> extends Omit<GridColumn<T>, "editable"> {
  render?: (context: HysProGridCell<T>) => VNodeChild;
  editor?: HysProGridEditor<T>;
  canEdit?: (context: HysProGridCell<T>) => boolean;
  validate?: HysProGridEditHandler<T>;
}

export type HysProGridEditPhase = "editing" | "validating" | "saving";
export type HysProGridFailureStage = "parse" | "validate" | "save";
export interface HysProGridFailure extends HysProGridAddress {
  stage: HysProGridFailureStage;
  message: string;
  cause?: unknown;
}
export type HysProGridCancelReason = "cancel" | "view-change" | "data-change";

export type HysProGridOptions<T extends object> = Omit<
  HysDataGridProps<T>,
  "rows" | "columns" | "rowKey" | "editable" | "cellNavigation" | "loadRows"
>;

export interface HysProGridMessages {
  edit: string;
  save: string;
  cancel: string;
  retry: string;
  validating: string;
  saving: string;
  choose: string;
  invalidNumber: string;
  min: string;
  max: string;
  invalidChoice: string;
  invalidValue: string;
  validationFailed: string;
  saveFailed: string;
}

export interface HysProGridProps<T extends object> {
  rows: readonly T[];
  columns: readonly HysProGridColumn<T>[];
  rowKey: string | ((row: T) => HysDataGridKey);
  gridOptions?: HysProGridOptions<T>;
  readonly?: boolean;
  showEditButton?: boolean;
  showEditActions?: boolean;
  commitOnBlur?: boolean;
  typeToEdit?: boolean;
  enterToEdit?: boolean;
  saveCell?: HysProGridEditHandler<T>;
  clipboard?: HysProGridClipboardBinding<T>;
  messages?: Partial<HysProGridMessages>;
}

export interface HysProGridEditorScope<T extends object> {
  cell: HysProGridCell<T>;
  draft: unknown;
  phase: HysProGridEditPhase;
  error: HysProGridFailure | undefined;
  inputId: string;
  errorId: string | undefined;
  setDraft: (value: unknown) => void;
  commit: (restoreFocus?: boolean) => Promise<boolean>;
  cancel: (restoreFocus?: boolean) => void;
}

export interface HysProGridSlots<T extends object> {
  "header-cell"?: (scope: HysDataGridHeaderContext<T>) => unknown;
  "row-number"?: (scope: HysDataGridRowContext<T>) => unknown;
  "row-number-header"?: () => unknown;
  /** Interactive control beside a context menu item. */
  "context-menu-item-control"?: HysContextMenuSlots["item-control"];
  cell?: (
    scope: HysProGridCell<T> & { edit: () => boolean; editable: boolean },
  ) => unknown;
  editor?: (scope: HysProGridEditorScope<T>) => unknown;
  "toolbar-actions"?: (scope: {
    query: HysDataGridQuery;
    selectedKeys: HysDataGridKey[];
  }) => unknown;
  empty?: (scope: { query: HysDataGridQuery }) => unknown;
}

export interface HysProGridInstance {
  readonly editing: HysProGridAddress | null;
  commitEdit(): Promise<boolean>;
  cancelEdit(): void;
  focusCell(rowKey: HysDataGridKey, columnKey: string, focus?: boolean): boolean;
  getQuery(): HysDataGridQuery;
  setQuery(query: Partial<HysDataGridQuery>): void;
  getColumnLayout(): HysDataGridColumnLayoutSnapshot;
  applyColumnLayout(layout: HysDataGridColumnLayout): void;
}
