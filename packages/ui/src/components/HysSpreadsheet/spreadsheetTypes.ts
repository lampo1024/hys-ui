import type { HysContextMenuItem, HysMenuKey } from "../../composables/menu";

export type HysSpreadsheetValue = string | number | boolean | null;
export type HysSpreadsheetFilterFunction = (
  cell: HysSpreadsheetCellContext,
  rule: HysSpreadsheetFilter,
) => boolean;
export type HysSpreadsheetCompare = (
  first: HysSpreadsheetCellContext,
  second: HysSpreadsheetCellContext,
) => number;
export interface HysSpreadsheetContextMenu {
  items(
    context: HysSpreadsheetCellContext,
    defaults: readonly HysContextMenuItem[],
  ): readonly HysContextMenuItem[];
  select?(
    key: HysMenuKey,
    context: HysSpreadsheetCellContext,
    spreadsheet: HysSpreadsheetInstance,
  ): void;
}
export type HysSpreadsheetNumberFormat =
  | "general"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "time"
  | "scientific"
  | "custom";

export interface HysSpreadsheetCellFormat {
  bold?: boolean;
  number?: HysSpreadsheetNumberFormat;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  borderColor?: string;
  borderStyle?: "solid" | "dashed" | "dotted" | "double";
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  overflow?: "clip" | "wrap" | "ellipsis" | "visible";
  rotation?: number;
  indent?: number;
  precision?: number;
  thousands?: boolean;
  pattern?: string;
  /** Native Excel format code retained when exchanging XLSX files. */
  excelFormat?: string;
  currency?: string;
}

export type HysSpreadsheetCellType =
  | "auto"
  | "text"
  | "number"
  | "date"
  | "time"
  | "datetime-local"
  | "percent"
  | "currency"
  | "boolean"
  | "select"
  | "multiple"
  | "autocomplete"
  | "formula"
  | "multiline"
  | "custom";

export interface HysSpreadsheetValidation {
  required?: boolean;
  type?: "text" | "number" | "date" | "boolean";
  min?: number | string;
  max?: number | string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: readonly HysSpreadsheetValue[];
  unique?: boolean;
  duplicate?: boolean;
  compare?: {
    address: string;
    operator: "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
  };
  rule?: string;
  message?: string;
  prompt?: string;
}

export interface HysSpreadsheetCellOptions {
  type?: HysSpreadsheetCellType;
  readonly?: boolean;
  locked?: boolean;
  typeName?: string;
  options?: readonly string[];
  link?: string;
  note?: string;
  tooltip?: string;
  validation?: HysSpreadsheetValidation;
  comments?: readonly HysSpreadsheetComment[];
  media?:
    | { type: "image"; src: string; alt: string }
    | { type: "chart"; values: readonly number[]; label: string };
}

export interface HysSpreadsheetComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  parentId?: string;
  resolved?: boolean;
  mentions?: readonly string[];
}

export interface HysSpreadsheetAxisOptions {
  label?: string;
  size?: number;
  hidden?: boolean;
  locked?: boolean;
}

export interface HysSpreadsheetGroup {
  start: number;
  end: number;
  collapsed?: boolean;
}

export interface HysSpreadsheetArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface HysSpreadsheetCellChange {
  row: number;
  column: number;
  value: HysSpreadsheetValue;
}

export interface HysSpreadsheetCellContext {
  sheet: HysSpreadsheetSheet;
  address: string;
  row: number;
  column: number;
  value: HysSpreadsheetValue;
}

export type HysSpreadsheetValidator = (
  context: HysSpreadsheetCellContext,
) => string | boolean | void;

export interface HysSpreadsheetCustomType {
  toDraft?(context: HysSpreadsheetCellContext): unknown;
  parse(
    draft: unknown,
    context: HysSpreadsheetCellContext,
  ): { ok: true; value: HysSpreadsheetValue } | { ok: false; message: string };
}

export type HysSpreadsheetAxis = "row" | "column";
export type HysSpreadsheetPasteMode =
  "all" | "values" | "formulas" | "formats" | "transpose";
export type HysSpreadsheetFillMode = "copy" | "series" | "smart";

export interface HysSpreadsheetFilter {
  column: number;
  operator:
    | "eq"
    | "ne"
    | "contains"
    | "startsWith"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "between"
    | "empty"
    | "notEmpty"
    | "color"
    | "custom";
  value?: HysSpreadsheetValue;
  end?: HysSpreadsheetValue;
  rule?: string;
}

export interface HysSpreadsheetSort {
  column: number;
  direction?: "asc" | "desc";
  by?: "value" | "color" | "icon" | "custom";
  order?: readonly HysSpreadsheetValue[];
}

export interface HysSpreadsheetConditionalFormat {
  range: string;
  type:
    | "value"
    | "text"
    | "date"
    | "positive"
    | "negative"
    | "greater"
    | "less"
    | "between"
    | "min"
    | "max"
    | "duplicate"
    | "empty"
    | "bar"
    | "scale"
    | "heatmap"
    | "icons"
    | "trend"
    | "formula";
  value?: HysSpreadsheetValue;
  end?: HysSpreadsheetValue;
  format?: HysSpreadsheetCellFormat;
  colors?: readonly [string, string];
  icons?: readonly [string, string, string];
  priority?: number;
}

export type HysSpreadsheetDataCommand =
  | { type: "group"; column?: number; header?: boolean }
  | { type: "sort"; keys: readonly HysSpreadsheetSort[]; header?: boolean }
  | { type: "clearSort" }
  | {
      type: "filter";
      filters: readonly HysSpreadsheetFilter[];
      match?: "all" | "any";
      header?: boolean;
    }
  | { type: "deduplicate"; columns?: readonly number[]; header?: boolean }
  | { type: "split"; delimiter: string }
  | { type: "combine"; delimiter: string }
  | {
      type: "subtotal";
      groupBy: number;
      valueColumn: number;
      header?: boolean;
    };

export interface HysSpreadsheetFindOptions {
  /** Distinguish uppercase and lowercase letters. Defaults to false. */
  matchCase?: boolean;
  /** Require the pattern to match the whole cell. Defaults to false. */
  wholeCell?: boolean;
  /** Search raw cell content, including formula expressions. Defaults to false. */
  formulas?: boolean;
  /** Enable Excel wildcards: * any text, ? one character, ~ escape. Defaults to false. */
  wildcards?: boolean;
  /** Restrict the search to these A1 ranges on the active sheet. */
  ranges?: readonly string[];
  /** Traverse columns first instead of rows. Defaults to row-major order. */
  order?: "row" | "column";
}

export type HysSpreadsheetAxisCommand =
  | {
      type: "insert" | "delete" | "copy";
      axis: HysSpreadsheetAxis;
      index: number;
      count?: number;
    }
  | {
      type: "move";
      axis: HysSpreadsheetAxis;
      index: number;
      count?: number;
      to: number;
    }
  | {
      type: "configure";
      axis: HysSpreadsheetAxis;
      index: number;
      count?: number;
      options: HysSpreadsheetAxisOptions;
    }
  | { type: "group"; axis: HysSpreadsheetAxis; index: number; count?: number }
  | {
      type: "toggleGroup" | "removeGroup";
      axis: HysSpreadsheetAxis;
      index: number;
    }
  | { type: "freeze"; rows: number; columns: number };

export interface HysSpreadsheetSheet {
  id: string;
  name: string;
  rows: readonly (readonly HysSpreadsheetValue[])[];
  columnCount?: number;
  formats?: Readonly<Record<string, HysSpreadsheetCellFormat>>;
  hidden?: boolean;
  tabColor?: string;
  protected?: boolean;
  protectionMode?: "excel";
  cells?: Readonly<Record<string, HysSpreadsheetCellOptions>>;
  rowOptions?: Readonly<Record<number, HysSpreadsheetAxisOptions>>;
  columnOptions?: Readonly<Record<number, HysSpreadsheetAxisOptions>>;
  rowGroups?: readonly HysSpreadsheetGroup[];
  columnGroups?: readonly HysSpreadsheetGroup[];
  frozenRows?: number;
  frozenColumns?: number;
  merges?: readonly string[];
  /** Keys used by the last successful sort, in priority order. */
  sortKeys?: readonly HysSpreadsheetSort[];
  /** Original row positions, indexed by current row, while a sort can be cleared. */
  sortRowOrder?: readonly number[];
  filters?: readonly HysSpreadsheetFilter[];
  filterMode?: "all" | "any";
  filterHeader?: boolean;
  groupColumn?: number;
  groupHeader?: boolean;
  conditionalFormats?: readonly HysSpreadsheetConditionalFormat[];
  unloaded?: boolean;
}

export interface HysSpreadsheetWorkbook {
  sheets: readonly HysSpreadsheetSheet[];
  name?: string;
  names?: Readonly<Record<string, { sheetId: string; range: string }>>;
  calculationMode?: "automatic" | "manual";
}

export type HysSpreadsheetFormulaArgument =
  HysSpreadsheetValue | readonly HysSpreadsheetValue[];

export type HysSpreadsheetFormulaFunction = (
  ...args: HysSpreadsheetFormulaArgument[]
) => HysSpreadsheetValue | readonly HysSpreadsheetValue[];

export type HysSpreadsheetSheetCommand =
  | {
      type: "add";
      name?: string;
      template?: Omit<HysSpreadsheetSheet, "id" | "name">;
    }
  | { type: "delete"; id: string }
  | { type: "duplicate"; id: string }
  | { type: "move"; id: string; index: number }
  | { type: "rename"; id: string; name: string }
  | { type: "visibility"; id: string; hidden: boolean }
  | { type: "color"; id: string; color?: string }
  | { type: "protect"; id: string; protected: boolean };

export interface HysSpreadsheetPersistence {
  load?(
    signal: AbortSignal,
  ): HysSpreadsheetWorkbook | Promise<HysSpreadsheetWorkbook>;
  save(
    workbook: HysSpreadsheetWorkbook,
    signal: AbortSignal,
  ): void | Promise<void>;
}

export interface HysSpreadsheetDataSource {
  loadSheet(
    sheet: HysSpreadsheetSheet,
    signal: AbortSignal,
  ): Promise<Partial<Omit<HysSpreadsheetSheet, "id">>>;
}

export interface HysSpreadsheetFileFormat {
  label: string;
  extension: string;
  decode?(file: File): HysSpreadsheetWorkbook | Promise<HysSpreadsheetWorkbook>;
  encode?(workbook: HysSpreadsheetWorkbook): Blob | Promise<Blob>;
}

export interface HysSpreadsheetPlugin {
  install(spreadsheet: HysSpreadsheetInstance): void | (() => void);
}

export interface HysSpreadsheetVersion {
  id: string;
  timestamp: number;
  action: HysSpreadsheetAction | "save" | "restore" | "remote";
  workbook: HysSpreadsheetWorkbook;
  author?: string;
}

export interface HysSpreadsheetPresence {
  id: string;
  name: string;
  color?: string;
  selection: HysSpreadsheetSelection | null;
  editing?: string;
}

export interface HysSpreadsheetCollaboration {
  connect(handlers: {
    update(
      workbook: HysSpreadsheetWorkbook,
      revision: string,
      author?: string,
    ): void;
    presence(users: readonly HysSpreadsheetPresence[]): void;
    conflict(message: string): void;
  }): () => void;
  update(workbook: HysSpreadsheetWorkbook, baseRevision?: string): void;
  presence(selection: HysSpreadsheetSelection | null, editing?: string): void;
}

export type HysSpreadsheetAction =
  "edit" | "paste" | "format" | "structure" | "undo" | "redo" | "open";

export interface HysSpreadsheetSelection {
  sheetId: string;
  anchor: string;
  focus: string;
  additional?: readonly { anchor: string; focus: string }[];
}

export interface HysSpreadsheetSelectionSummary {
  cells: number;
  nonEmpty: number;
  numeric: number;
  sum: number;
  average: number | null;
  min: number | null;
  max: number | null;
}

export interface HysSpreadsheetInstance {
  getWorkbook(): HysSpreadsheetWorkbook;
  getSelection(): HysSpreadsheetSelection | null;
  selectRange(anchor: string, focus?: string, append?: boolean): boolean;
  selectAll(): boolean;
  getSelectionSummary(): HysSpreadsheetSelectionSummary | null;
  undo(): boolean;
  redo(): boolean;
  setSheet(id: string): boolean;
  manageSheet(command: HysSpreadsheetSheetCommand): boolean;
  newWorkbook(name?: string): boolean;
  openWorkbook(workbook?: HysSpreadsheetWorkbook): Promise<boolean>;
  importWorkbook(file: File): Promise<boolean>;
  exportWorkbook(extension?: string): Promise<Blob>;
  saveWorkbookFile(extension?: string, name?: string): Promise<boolean>;
  saveWorkbook(): Promise<boolean>;
  saveWorkbookAs(name?: string): HysSpreadsheetWorkbook;
  recalculate(): void;
  manageAxis(command: HysSpreadsheetAxisCommand): boolean;
  setCells(changes: readonly HysSpreadsheetCellChange[]): boolean;
  editSelection(draft: string): boolean;
  configureCells(options: HysSpreadsheetCellOptions): boolean;
  formatCells(format: HysSpreadsheetCellFormat | null): boolean;
  validateCells(): Record<string, string>;
  fill(
    direction: "down" | "right",
    mode?: HysSpreadsheetFillMode,
    sequence?: readonly HysSpreadsheetValue[],
  ): boolean;
  paste(text: string, mode?: HysSpreadsheetPasteMode): boolean;
  manageData(command: HysSpreadsheetDataCommand): boolean;
  setConditionalFormats(
    rules: readonly HysSpreadsheetConditionalFormat[],
  ): boolean;
  find(query: string, options?: HysSpreadsheetFindOptions): string[];
  copyConditionalFormats(source: string, destination: string): boolean;
  applyStyle(name: string): boolean;
  replace(
    query: string,
    replacement: string,
    options?: HysSpreadsheetFindOptions,
  ): boolean;
  mergeCells(): boolean;
  unmergeCells(): boolean;
  getVersions(): readonly HysSpreadsheetVersion[];
  compareVersions(
    before: string,
    after?: string,
  ): {
    sheetId: string;
    address: string;
    before: HysSpreadsheetValue;
    after: HysSpreadsheetValue;
  }[];
  restoreVersion(id: string): boolean;
  addComment(text: string, parentId?: string): boolean;
  resolveComment(id: string, resolved?: boolean): boolean;
  defineName(name: string, range?: string, sheetId?: string): boolean;
}
