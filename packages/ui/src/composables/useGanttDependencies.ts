import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
} from "vue";
import type {
  HysGanttDependencyChange,
  HysGanttDependencyInvalid,
  HysGanttDependencyMove,
  HysGanttDependencyReason,
  HysGanttScrollOptions,
} from "./gantt";
type Id = string | number;
interface Task {
  id: Id;
  title: string;
  disabled?: boolean;
  dependencies?: Id[];
}
interface Position {
  x: number;
  y: number;
  w: number;
  index: number;
}
interface Draft {
  sourceId: Id;
  previousTargetId?: Id;
  targetId?: Id;
  mode: "pointer" | "keyboard";
  point: { x: number; y: number };
  reason: HysGanttDependencyReason | null;
}
interface Context<T extends Task> {
  items: () => readonly T[];
  rows: () => readonly T[];
  enabled: ComputedRef<boolean>;
  live: () => boolean;
  root: Ref<HTMLElement | undefined>;
  viewport: Ref<HTMLElement | null>;
  grid: Ref<HTMLElement | null>;
  labelWidth: () => number;
  rowHeight: () => number;
  position: (id: Id) => Position | undefined;
  locate: (id: Id, options?: HysGanttScrollOptions) => Promise<boolean>;
  cancelTask: () => void;
  update: (items: T[]) => void;
  change: (item: T) => void;
  added: (info: HysGanttDependencyChange, item: T) => void;
  removed: (info: HysGanttDependencyChange, item: T) => void;
  moved: (info: HysGanttDependencyMove, item: T, previousItem: T) => void;
  invalid: (info: HysGanttDependencyInvalid) => void;
}
const reasons: Record<HysGanttDependencyReason, string> = {
  missing: "找不到对应任务或依赖关系",
  disabled: "该任务不可编辑依赖关系",
  self: "任务不能依赖自身",
  duplicate: "这条前置依赖已存在",
  cycle: "该连接会形成循环依赖",
  rejected: "依赖更新请求未被接受",
};
export function ganttDependencyPath(
  from: { x: number; y: number; w: number },
  to: { x: number; y: number },
  rowHeight = 46,
) {
  const x = from.x + from.w,
    elbow = x + 14,
    tip = to.x - 4;
  if (to.x === x && to.y === from.y) return "";
  // A backward relation approaches outside the target bar, through the row gap.
  // Ending at its centre from the right would hide the connector under the bar.
  const route =
    tip >= elbow + 12
      ? `V ${to.y} H ${tip}`
      : `V ${to.y + ((to.y < from.y ? 1 : -1) * rowHeight) / 2} H ${tip - 16} V ${to.y} H ${tip}`;
  return `M ${x} ${from.y} H ${elbow} ${route} M ${tip - 5} ${to.y - 4} L ${tip} ${to.y} L ${tip - 5} ${to.y + 4}`;
}
export function useGanttDependencies<T extends Task>(ctx: Context<T>) {
  const draft = shallowRef<Draft>(),
    selectedRef = shallowRef<HysGanttDependencyChange>(),
    message = ref(""),
    tasks = computed(() => new Map(ctx.items().map((item) => [item.id, item]))),
    sourceId = computed(() => draft.value?.sourceId);
  function ancestors(id: Id) {
    const result = new Set<Id>(),
      stack = [...(tasks.value.get(id)?.dependencies ?? [])];
    while (stack.length) {
      const next = stack.pop()!;
      if (result.has(next)) continue;
      result.add(next);
      for (const parent of tasks.value.get(next)?.dependencies ?? [])
        stack.push(parent);
    }
    return result;
  }
  const sourceAncestors = computed(() =>
    sourceId.value === undefined ? new Set<Id>() : ancestors(sourceId.value),
  );
  const selected = computed(() => {
    const edge = selectedRef.value;
    return edge &&
      tasks.value.get(edge.targetId)?.dependencies?.includes(edge.sourceId)
      ? edge
      : undefined;
  });
  function issue(
    info: HysGanttDependencyChange,
  ): HysGanttDependencyReason | null {
    const source = tasks.value.get(info.sourceId),
      target = tasks.value.get(info.targetId);
    if (!target || (info.type === "add" && !source)) return "missing";
    if (
      !ctx.enabled.value ||
      target.disabled ||
      (info.type === "add" && source?.disabled)
    )
      return "disabled";
    if (info.type === "remove")
      return target.dependencies?.includes(info.sourceId) ? null : "missing";
    if (info.sourceId === info.targetId) return "self";
    if (target.dependencies?.includes(info.sourceId)) return "duplicate";
    if (
      (sourceId.value === info.sourceId
        ? sourceAncestors.value
        : ancestors(info.sourceId)
      ).has(info.targetId)
    )
      return "cycle";
    return null;
  }
  function reject(
    info: HysGanttDependencyChange | HysGanttDependencyMove,
    reason: HysGanttDependencyReason,
  ) {
    message.value = reasons[reason];
    if (ctx.live()) ctx.invalid({ ...info, reason });
  }
  async function update(info: HysGanttDependencyChange) {
    if (!ctx.live()) return false;
    const reason = issue(info);
    if (reason) {
      reject(info, reason);
      return false;
    }
    const target = tasks.value.get(info.targetId)!,
      next = {
        ...target,
        dependencies:
          info.type === "add"
            ? [...new Set([...(target.dependencies ?? []), info.sourceId])]
            : (target.dependencies ?? []).filter((id) => id !== info.sourceId),
      } as T;
    ctx.update(ctx.items().map((item) => (item.id === next.id ? next : item)));
    ctx.change(next);
    await nextTick();
    if (!ctx.live()) return false;
    const actual = tasks.value.get(info.targetId),
      accepted =
        !!actual &&
        !!actual.dependencies?.includes(info.sourceId) ===
          (info.type === "add");
    if (!accepted) {
      reject(info, "rejected");
      return false;
    }
    message.value = info.type === "add" ? "前置依赖已建立" : "前置依赖已移除";
    if (info.type === "add") ctx.added(info, actual!);
    else {
      selectedRef.value = undefined;
      ctx.removed(info, actual!);
    }
    return true;
  }
  const add = (sourceId: Id, targetId: Id) =>
      update({ sourceId, targetId, type: "add" }),
    remove = (sourceId: Id, targetId: Id) =>
      update({ sourceId, targetId, type: "remove" });
  function moveIssue(
    info: HysGanttDependencyMove,
  ): HysGanttDependencyReason | null {
    const original = issue({
      sourceId: info.sourceId,
      targetId: info.previousTargetId,
      type: "remove",
    });
    if (original) return original;
    if (info.previousTargetId === info.targetId) return null;
    return issue({
      sourceId: info.sourceId,
      targetId: info.targetId,
      type: "add",
    });
  }
  async function moveTarget(sourceId: Id, previousTargetId: Id, targetId: Id) {
    if (!ctx.live()) return false;
    const info: HysGanttDependencyMove = {
        sourceId,
        previousTargetId,
        targetId,
        type: "move",
      },
      reason = moveIssue(info);
    if (reason) {
      reject(info, reason);
      return false;
    }
    if (previousTargetId === targetId) return true;
    const previous = {
      ...tasks.value.get(previousTargetId)!,
      dependencies: (
        tasks.value.get(previousTargetId)!.dependencies ?? []
      ).filter((id) => id !== sourceId),
    } as T;
    const target = {
      ...tasks.value.get(targetId)!,
      dependencies: [
        ...new Set([
          ...(tasks.value.get(targetId)!.dependencies ?? []),
          sourceId,
        ]),
      ],
    } as T;
    ctx.update(
      ctx
        .items()
        .map((item) =>
          item.id === previousTargetId
            ? previous
            : item.id === targetId
              ? target
              : item,
        ),
    );
    ctx.change(previous);
    ctx.change(target);
    await nextTick();
    if (!ctx.live()) return false;
    const actualPrevious = tasks.value.get(previousTargetId),
      actualTarget = tasks.value.get(targetId);
    if (
      !actualPrevious ||
      !actualTarget ||
      actualPrevious.dependencies?.includes(sourceId) ||
      !actualTarget.dependencies?.includes(sourceId)
    ) {
      reject(info, "rejected");
      return false;
    }
    selectedRef.value = { sourceId, targetId, type: "remove" };
    message.value = "前置依赖的终点已修改";
    ctx.moved(info, actualTarget, actualPrevious);
    return true;
  }
  let pointerId: number | undefined,
    capture: HTMLElement | undefined,
    point: { x: number; y: number } | undefined,
    start: { x: number; y: number } | undefined,
    frame: number | undefined,
    moved = false,
    suppressClickBefore = 0;
  function stopPointer() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    const id = pointerId,
      element = capture;
    pointerId = undefined;
    capture = undefined;
    point = start = undefined;
    if (id !== undefined && element?.hasPointerCapture?.(id))
      element.releasePointerCapture(id);
  }
  function cancel(clearMessage = true) {
    if (pointerId !== undefined) suppressClickBefore = performance.now() + 350;
    draft.value = undefined;
    stopPointer();
    if (clearMessage) message.value = "";
  }
  function chooseTarget(
    id: Id | undefined,
    position: { x: number; y: number },
  ) {
    const current = draft.value;
    if (!current) return;
    const reason =
        id === undefined
          ? null
          : current.previousTargetId === undefined
            ? issue({ sourceId: current.sourceId, targetId: id, type: "add" })
            : moveIssue({
                sourceId: current.sourceId,
                previousTargetId: current.previousTargetId,
                targetId: id,
                type: "move",
              }),
      target = id === undefined ? undefined : ctx.position(id),
      next = target ? { x: target.x, y: target.y } : position;
    if (
      current.targetId !== id ||
      current.reason !== reason ||
      current.point.x !== next.x ||
      current.point.y !== next.y
    )
      draft.value = { ...current, targetId: id, point: next, reason };
    message.value = reason
      ? reasons[reason]
      : id === undefined
        ? "拖到后置任务，释放建立前置依赖"
        : `${tasks.value.get(current.sourceId)?.title ?? current.sourceId} → ${tasks.value.get(id)?.title ?? id}，释放或按 Enter 确认`;
  }
  function schedule() {
    if (frame === undefined) frame = requestAnimationFrame(paint);
  }
  function paint(_time?: number, allowScroll = true) {
    frame = undefined;
    const current = draft.value,
      el = ctx.viewport.value,
      grid = ctx.grid.value;
    if (
      !ctx.live() ||
      !ctx.enabled.value ||
      current?.mode !== "pointer" ||
      !point ||
      !el ||
      !grid
    )
      return;
    const box = el.getBoundingClientRect(),
      gridBox = grid.getBoundingClientRect(),
      hit = document.elementFromPoint(point.x, point.y),
      inside =
        point.x >= box.left &&
        point.x <= box.right &&
        point.y >= box.top &&
        point.y <= box.bottom,
      owned = hit?.closest(".hys-ui-pg-gantt") === ctx.root.value;
    let id: Id | undefined;
    if (inside && owned && point.y >= box.top + 66) {
      const row = hit?.closest<HTMLElement>("[data-row-index]"),
        index = row
          ? Number(row.dataset.rowIndex)
          : Math.floor((point.y - gridBox.top) / ctx.rowHeight());
      id = ctx.rows()[index]?.id;
    }
    chooseTarget(id, { x: point.x - gridBox.left, y: point.y - gridBox.top });
    if (allowScroll && inside && moved) {
      const oldTop = el.scrollTop,
        oldLeft = el.scrollLeft,
        dy = point.y < box.top + 94 ? -12 : point.y > box.bottom - 28 ? 12 : 0,
        timeline = box.left + ctx.labelWidth(),
        dx =
          point.x < timeline
            ? 0
            : point.x < timeline + 28
              ? -12
              : point.x > box.right - 28
                ? 12
                : 0;
      el.scrollTop += dy;
      el.scrollLeft += dx;
      if (el.scrollTop !== oldTop || el.scrollLeft !== oldLeft) schedule();
    }
  }
  function beginPointer(
    event: PointerEvent,
    source: Id,
    previousTargetId?: Id,
  ) {
    if (
      !ctx.live() ||
      !ctx.enabled.value ||
      event.button !== 0 ||
      tasks.value.get(source)?.disabled ||
      !ctx.viewport.value
    )
      return;
    cancel();
    ctx.cancelTask();
    selectedRef.value = undefined;
    const position = ctx.position(source);
    if (!position) return;
    point = start = { x: event.clientX, y: event.clientY };
    moved = false;
    draft.value = {
      sourceId: source,
      previousTargetId,
      targetId: previousTargetId,
      mode: "pointer",
      point:
        previousTargetId === undefined
          ? { x: position.x + position.w, y: position.y }
          : (ctx.position(previousTargetId) ?? {
              x: position.x + position.w,
              y: position.y,
            }),
      reason: null,
    };
    pointerId = event.pointerId;
    capture = ctx.viewport.value;
    capture.setPointerCapture(event.pointerId);
    capture.focus({ preventScroll: true });
    message.value =
      previousTargetId === undefined
        ? "拖到后置任务，释放建立前置依赖"
        : "拖到新的后置任务，释放修改终点；Esc 保留原连接";
  }
  function move(event: PointerEvent) {
    if (pointerId !== event.pointerId || !draft.value) return;
    point = { x: event.clientX, y: event.clientY };
    moved =
      moved ||
      (!!start && Math.hypot(point.x - start.x, point.y - start.y) > 4);
    if (moved) schedule();
  }
  async function submit(targetId?: Id) {
    const current = draft.value,
      id = targetId ?? current?.targetId;
    if (!current || id === undefined) {
      message.value = "请选择一个后置任务";
      return false;
    }
    const info: HysGanttDependencyChange | HysGanttDependencyMove =
        current.previousTargetId === undefined
          ? {
              sourceId: current.sourceId,
              targetId: id,
              type: "add",
            }
          : {
              sourceId: current.sourceId,
              previousTargetId: current.previousTargetId,
              targetId: id,
              type: "move",
            },
      reason = info.type === "move" ? moveIssue(info) : issue(info);
    if (reason) {
      reject(info, reason);
      if (current.mode === "pointer") cancel(false);
      return false;
    }
    cancel(false);
    return info.type === "move"
      ? moveTarget(info.sourceId, info.previousTargetId, info.targetId)
      : add(info.sourceId, info.targetId);
  }
  function end(event: PointerEvent) {
    if (pointerId !== event.pointerId) return;
    if (moved) {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      point = { x: event.clientX, y: event.clientY };
      paint(undefined, false);
      suppressClickBefore = performance.now() + 350;
      void submit();
      if (draft.value?.mode === "pointer") cancel(false);
    } else {
      const source = draft.value?.sourceId,
        previousTargetId = draft.value?.previousTargetId;
      cancel();
      suppressClickBefore = performance.now() + 350;
      if (source !== undefined) beginKeyboard(source, previousTargetId);
    }
  }
  function lost(event: PointerEvent) {
    if (pointerId === event.pointerId) cancel();
  }
  function beginKeyboard(source: Id, previousTargetId?: Id) {
    if (!ctx.live() || !ctx.enabled.value || tasks.value.get(source)?.disabled)
      return;
    if (
      draft.value?.mode === "keyboard" &&
      draft.value.sourceId === source &&
      draft.value.previousTargetId === previousTargetId
    ) {
      cancel();
      return;
    }
    cancel();
    ctx.cancelTask();
    selectedRef.value = undefined;
    const position = ctx.position(source);
    if (!position) return;
    draft.value = {
      sourceId: source,
      previousTargetId,
      targetId: previousTargetId,
      mode: "keyboard",
      point:
        previousTargetId === undefined
          ? { x: position.x + position.w, y: position.y }
          : (ctx.position(previousTargetId) ?? {
              x: position.x + position.w,
              y: position.y,
            }),
      reason: null,
    };
    message.value =
      previousTargetId === undefined
        ? "点击后置任务，或用上下键选择后按 Enter 确认；Esc 取消"
        : "选择新的后置任务后按 Enter 确认；Esc 保留原连接";
    ctx.viewport.value?.focus({ preventScroll: true });
  }
  function clickSource(event: MouseEvent, id: Id, previousTargetId?: Id) {
    if (performance.now() < suppressClickBefore) return;
    beginKeyboard(id, previousTargetId);
  }
  function key(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key === "Escape" && (draft.value || selected.value)) {
      event.preventDefault();
      event.stopPropagation();
      cancel();
      selectedRef.value = undefined;
      return;
    }
    if (
      draft.value?.mode === "keyboard" &&
      ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Enter" || event.key === " ") {
        void submit();
        return;
      }
      const rows = ctx.rows(),
        current = draft.value.targetId ?? draft.value.sourceId,
        index = rows.findIndex((item) => item.id === current),
        direction = event.key === "ArrowDown" ? 1 : -1;
      for (
        let next = index + direction;
        next >= 0 && next < rows.length;
        next += direction
      ) {
        const task = rows[next];
        if (task.id === draft.value.sourceId || task.disabled) continue;
        const position = ctx.position(task.id);
        if (position) {
          chooseTarget(task.id, { x: position.x, y: position.y });
          void ctx.locate(task.id, { block: "nearest" });
        }
        break;
      }
      return;
    }
    if (
      selected.value &&
      ["Delete", "Backspace"].includes(event.key) &&
      (event.target instanceof SVGElement ||
        event.target === ctx.viewport.value)
    ) {
      event.preventDefault();
      event.stopPropagation();
      void remove(selected.value.sourceId, selected.value.targetId);
    }
  }
  function selectEdge(event: Event, sourceId: Id, targetId: Id) {
    if (!ctx.enabled.value || !ctx.live()) return;
    cancel();
    selectedRef.value = { sourceId, targetId, type: "remove" };
    message.value = `${tasks.value.get(sourceId)?.title ?? sourceId} → ${tasks.value.get(targetId)?.title ?? targetId}，拖动终点可改接；Delete 可移除`;
    if (event.currentTarget instanceof SVGElement)
      (event.currentTarget as SVGElement & { focus: () => void }).focus();
  }
  const path = computed(() => {
    const current = draft.value,
      from = current && ctx.position(current.sourceId);
    return current && from
      ? ganttDependencyPath(from, current.point, ctx.rowHeight())
      : "";
  });
  const clearSelected = () => {
    const hadSelection = !!selected.value;
    selectedRef.value = undefined;
    if (hadSelection && !draft.value) message.value = "";
  };
  function blur() {
    cancel();
  }
  const attach = () => window.addEventListener("blur", blur),
    detach = () => {
      window.removeEventListener("blur", blur);
      cancel();
    };
  onMounted(attach);
  onActivated(attach);
  onDeactivated(detach);
  onBeforeUnmount(detach);
  watch(ctx.enabled, (value) => {
    if (!value) {
      cancel();
      clearSelected();
    }
  });
  return {
    draft,
    selected,
    message,
    path,
    add,
    remove,
    moveTarget,
    cancel,
    beginPointer,
    move,
    end,
    lost,
    clickSource,
    beginKeyboard,
    key,
    selectEdge,
    clearSelected,
    submit,
  };
}
