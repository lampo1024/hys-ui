export interface HysGanttScrollOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  horizontal?: boolean;
}
export interface HysGanttDependencyChange {
  sourceId: string | number;
  targetId: string | number;
  type: "add" | "remove";
}
export type HysGanttDependencyReason =
  "missing" | "disabled" | "self" | "duplicate" | "cycle" | "rejected" | "busy";
export type HysGanttHistoryType =
  | "move"
  | "resize-start"
  | "resize-end"
  | "nudge"
  | "dependency-add"
  | "dependency-remove"
  | "dependency-move";
export interface HysGanttHistoryEntry {
  type: HysGanttHistoryType;
  label: string;
  taskIds: Array<string | number>;
}
export interface HysGanttHistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  undoLabel: string;
  redoLabel: string;
  pending: boolean;
}
export interface HysGanttHistoryInvalid {
  action: "undo" | "redo";
  reason: "disabled" | "busy" | "missing" | "stale" | "rejected";
}
export type HysGanttConflictType =
  | "dependency-order"
  | "invalid-date"
  | "missing-dependency"
  | "dependency-cycle";
export interface HysGanttConflict {
  id: string;
  type: HysGanttConflictType;
  taskId: string | number;
  taskTitle: string;
  sourceId?: string | number;
  sourceTitle?: string;
  message: string;
  expectedStart?: string;
  days?: number;
}
export interface HysGanttDependencyMove {
  sourceId: string | number;
  previousTargetId: string | number;
  targetId: string | number;
  type: "move";
}
export type HysGanttDependencyInvalid = (
  HysGanttDependencyChange | HysGanttDependencyMove
) & { reason: HysGanttDependencyReason };
export interface HysGanttInstance {
  element: HTMLElement | undefined;
  viewport: HTMLElement | null;
  scrollToTask: (
    id: string | number,
    options?: HysGanttScrollOptions,
  ) => Promise<boolean>;
  scrollToTop: (options?: Pick<HysGanttScrollOptions, "behavior">) => void;
  addDependency: (
    sourceId: string | number,
    targetId: string | number,
  ) => Promise<boolean>;
  removeDependency: (
    sourceId: string | number,
    targetId: string | number,
  ) => Promise<boolean>;
  cancelDependency: () => void;
  moveDependency: (
    sourceId: string | number,
    previousTargetId: string | number,
    targetId: string | number,
  ) => Promise<boolean>;
  canUndo: boolean;
  canRedo: boolean;
  historyState: HysGanttHistoryState;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  clearHistory: () => void;
  conflicts: readonly HysGanttConflict[];
}
