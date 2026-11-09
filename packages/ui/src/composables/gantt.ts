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
  "missing" | "disabled" | "self" | "duplicate" | "cycle" | "rejected";
export interface HysGanttDependencyInvalid extends HysGanttDependencyChange {
  reason: HysGanttDependencyReason;
}
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
}
