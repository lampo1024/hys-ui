import {
  finite,
  normalizeToastPosition,
} from "../components/HysToast/toastPresentation";
import type { ToastClock } from "../components/HysToast/useToastTimer";
import type {
  HysToastCloseContext,
  HysToastCloseReason,
  HysToastConfig,
  HysToastContext,
  HysToastFilter,
  HysToastHandle,
  HysToastOptions,
  HysToastSnapshot,
  HysToastStatus,
} from "../components/HysToast/toastTypes";
export interface ToastInstance {
  close(
    reason?: HysToastCloseReason,
    event?: Event,
    force?: boolean,
  ): Promise<boolean>;
  restart(): void;
  extend(milliseconds: number): void;
  snapshotClock(): ToastClock;
  restoreClock(clock: ToastClock): void;
}
export interface ToastEntry {
  id: string;
  serial: number;
  options: HysToastOptions;
  status: HysToastStatus;
  repeat: number;
  lastSeen: number;
  paused: boolean;
  extending: number;
  clock?: ToastClock;
  shown?: boolean;
  entered?: boolean;
  closeContext?: HysToastCloseContext;
  handle: HysToastHandle;
  resolve: () => void;
}
let sequence = 0;
export const nextToastSequence = () => ++sequence;
export const asOptions = (value: string | HysToastOptions): HysToastOptions =>
  typeof value === "string" ? { message: value } : value;

export function presentation(options: HysToastOptions) {
  const {
    id,
    content,
    icon,
    header,
    footer,
    renderActions,
    priority,
    group,
    grouping,
    dedupe,
    dedupeKey,
    dedupeWindow,
    onShow,
    onAfterShow,
    onClose,
    onAfterClose,
    onClick,
    onAction,
    onStateChange,
    ...props
  } = options;
  return props;
}
export function toastStackKey(options: HysToastOptions) {
  return JSON.stringify([
    normalizeToastPosition(options.position),
    options.offsetX ?? options.offset ?? 24,
    options.offsetY ?? options.offset ?? 24,
    options.zIndex ?? 2000,
    options.coordinates,
  ]);
}
export function defaults(config: HysToastConfig) {
  const {
    maxCount,
    maxQueue,
    overflow,
    queueOrder,
    queueScope,
    layout,
    gap,
    collapsedCount,
    layerCount,
    layerTrigger,
    appendTo,
    ...options
  } = config;
  return options;
}
export function context(entry: ToastEntry): HysToastContext {
  return {
    id: entry.id,
    message: entry.options.message ?? "",
    title: entry.options.title,
    type: entry.options.type ?? "info",
  };
}
export function snapshot(entry: ToastEntry): HysToastSnapshot {
  return {
    ...context(entry),
    id: entry.id,
    status: entry.status,
    position: normalizeToastPosition(entry.options.position),
    group: entry.options.group,
    priority: finite(entry.options.priority, 0),
    repeat: entry.repeat,
  };
}
export function matches(entry: ToastEntry, filter: HysToastFilter = {}) {
  return (
    (filter.type === undefined || filter.type === entry.options.type) &&
    (filter.group === undefined || filter.group === entry.options.group) &&
    (filter.status === undefined || filter.status === entry.status) &&
    (filter.position === undefined ||
      normalizeToastPosition(filter.position) ===
        normalizeToastPosition(entry.options.position))
  );
}
