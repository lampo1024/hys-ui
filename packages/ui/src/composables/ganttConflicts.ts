import type { HysGanttConflict } from "./gantt";
type Id = string | number;
export interface GanttScheduleTask {
  id: Id;
  title: string;
  start: string;
  end: string;
  dependencies?: readonly Id[];
}
interface Task extends GanttScheduleTask {
  s: number | null;
  e: number | null;
}
interface Edge {
  sourceId: Id;
  targetId: Id;
  id: string;
}
export function parseGanttDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number),
    date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date.getTime() / 86400000
    : null;
}
export const ganttEdgeKey = (source: Id, target: Id) =>
  JSON.stringify([source, target]);
const formatDay = (value: number) =>
  new Date(value * 86400000).toISOString().split("T")[0];
function orderConflict(
  source: Task,
  target: Task,
): HysGanttConflict | undefined {
  if (
    source.s === null ||
    source.e === null ||
    target.s === null ||
    target.e === null ||
    source.e < source.s ||
    target.e < target.s ||
    target.s > source.e
  )
    return;
  return {
    id: JSON.stringify(["dependency-order", source.id, target.id]),
    type: "dependency-order",
    taskId: target.id,
    taskTitle: target.title,
    sourceId: source.id,
    sourceTitle: source.title,
    expectedStart: formatDay(source.e + 1),
    days: source.e - target.s + 1,
    message: `${source.title} 于 ${formatDay(source.e)} 结束，${target.title} 最早应在 ${formatDay(source.e + 1)} 开始；当前提前 ${source.e - target.s + 1} 天`,
  };
}
export function analyzeGanttSchedule(items: readonly GanttScheduleTask[]) {
  const tasks = new Map<Id, Task>(),
    outgoing = new Map<Id, Id[]>(),
    incoming = new Map<Id, Id[]>(),
    edges: Edge[] = [],
    conflicts: HysGanttConflict[] = [],
    incident = new Map<Id, Edge[]>();
  const dates = new Map<string, number | null>(),
    parse = (value: string) => {
      if (!dates.has(value)) dates.set(value, parseGanttDay(value));
      return dates.get(value)!;
    };
  for (const item of items) {
    const task = {
      id: item.id,
      title: item.title,
      start: item.start,
      end: item.end,
      dependencies: item.dependencies,
      s: parse(item.start),
      e: parse(item.end),
    };
    tasks.set(item.id, task);
    outgoing.set(item.id, []);
    incoming.set(item.id, []);
    if (task.s === null || task.e === null || task.e < task.s)
      conflicts.push({
        id: JSON.stringify(["invalid-date", item.id]),
        type: "invalid-date",
        taskId: item.id,
        taskTitle: item.title,
        message: `${item.title} 的日期无效，需使用有效的 YYYY-MM-DD 且结束日期不早于开始日期`,
      });
  }
  for (const target of tasks.values())
    for (const sourceId of new Set(target.dependencies ?? [])) {
      const source = tasks.get(sourceId);
      if (!source) {
        conflicts.push({
          id: JSON.stringify(["missing-dependency", sourceId, target.id]),
          type: "missing-dependency",
          taskId: target.id,
          taskTitle: target.title,
          sourceId,
          message: `${target.title} 引用了不存在的前置任务 ${sourceId}`,
        });
        continue;
      }
      outgoing.get(sourceId)!.push(target.id);
      incoming.get(target.id)!.push(sourceId);
      const edge = {
        sourceId,
        targetId: target.id,
        id: ganttEdgeKey(sourceId, target.id),
      };
      edges.push(edge);
      for (const id of new Set([sourceId, target.id])) {
        const list = incident.get(id);
        if (list) list.push(edge);
        else incident.set(id, [edge]);
      }
    }
  // Iterative strongly connected components distinguish cycle members from
  // ordinary tasks downstream of a cycle, without recursion on long schedules.
  const visited = new Set<Id>(),
    order: Id[] = [];
  for (const id of tasks.keys()) {
    if (visited.has(id)) continue;
    const stack: Array<{ id: Id; exit: boolean }> = [{ id, exit: false }];
    while (stack.length) {
      const next = stack.pop()!;
      if (next.exit) {
        order.push(next.id);
        continue;
      }
      if (visited.has(next.id)) continue;
      visited.add(next.id);
      stack.push({ id: next.id, exit: true });
      for (const child of outgoing.get(next.id)!)
        if (!visited.has(child)) stack.push({ id: child, exit: false });
    }
  }
  const component = new Map<Id, number>(),
    sizes: number[] = [];
  for (let index = order.length - 1; index >= 0; index--) {
    const id = order[index];
    if (component.has(id)) continue;
    const group = sizes.length,
      stack = [id];
    let count = 0;
    component.set(id, group);
    while (stack.length) {
      const next = stack.pop()!;
      count++;
      for (const parent of incoming.get(next)!)
        if (!component.has(parent)) {
          component.set(parent, group);
          stack.push(parent);
        }
    }
    sizes.push(count);
  }
  const cyclic = new Set<string>(),
    byEdge = new Map<string, HysGanttConflict>();
  for (const edge of edges) {
    const source = tasks.get(edge.sourceId)!,
      target = tasks.get(edge.targetId)!;
    let conflict: HysGanttConflict | undefined;
    if (
      component.get(source.id) === component.get(target.id) &&
      (source.id === target.id || sizes[component.get(source.id)!] > 1)
    ) {
      cyclic.add(edge.id);
      conflict = {
        id: JSON.stringify(["dependency-cycle", source.id, target.id]),
        type: "dependency-cycle",
        sourceId: source.id,
        sourceTitle: source.title,
        taskId: target.id,
        taskTitle: target.title,
        message: `${source.title} → ${target.title} 属于循环依赖，需先移除环内关系`,
      };
    } else conflict = orderConflict(source, target);
    if (conflict) {
      conflicts.push(conflict);
      byEdge.set(edge.id, conflict);
    }
  }
  const byTask = new Map<Id, HysGanttConflict[]>();
  for (const conflict of conflicts)
    for (const id of new Set([
      conflict.taskId,
      ...(conflict.sourceId !== undefined && tasks.has(conflict.sourceId)
        ? [conflict.sourceId]
        : []),
    ])) {
      const list = byTask.get(id);
      if (list) list.push(conflict);
      else byTask.set(id, [conflict]);
    }
  return { conflicts, byTask, byEdge, tasks, incident, cyclic };
}
export function previewGanttConflicts(
  analysis: ReturnType<typeof analyzeGanttSchedule>,
  id: Id,
  start: number,
  end: number,
) {
  const original = analysis.tasks.get(id);
  if (!original) return [];
  const changed = {
    ...original,
    s: start,
    e: end,
    start: formatDay(start),
    end: formatDay(end),
  };
  return (analysis.incident.get(id) ?? []).flatMap((edge) => {
    if (analysis.cyclic.has(edge.id)) return [];
    const source =
        edge.sourceId === id ? changed : analysis.tasks.get(edge.sourceId)!,
      target =
        edge.targetId === id ? changed : analysis.tasks.get(edge.targetId)!,
      conflict = orderConflict(source, target);
    return conflict ? [conflict] : [];
  });
}
