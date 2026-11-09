import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeGanttSchedule,
  parseGanttDay,
  previewGanttConflicts,
} from "../packages/ui/dist/composables/ganttConflicts.js";
const task = (id, extra = {}) => ({
  id,
  title: "Task " + id,
  start: "2026-11-01",
  end: "2026-11-03",
  ...extra,
});
test("Finish-to-start conflicts use inclusive dates and identify the earliest valid successor date", () => {
  const result = analyzeGanttSchedule([
    task("a"),
    task("b", { start: "2026-11-03", end: "2026-11-06", dependencies: ["a"] }),
  ]);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].expectedStart, "2026-11-04");
  assert.equal(result.conflicts[0].days, 1);
  assert.equal(
    analyzeGanttSchedule([
      task("a"),
      task("b", {
        start: "2026-11-04",
        end: "2026-11-06",
        dependencies: ["a"],
      }),
    ]).conflicts.length,
    0,
  );
});
test("Date diagnostics reject nonexistent dates and reversed intervals with timezone-safe leap-day arithmetic", () => {
  assert.equal(parseGanttDay("2026-02-30"), null);
  assert.equal(parseGanttDay("2026-2-01"), null);
  assert.equal(parseGanttDay("2024-03-01") - parseGanttDay("2024-02-28"), 2);
  assert.equal(parseGanttDay("2026-11-02") - parseGanttDay("2026-11-01"), 1);
  const result = analyzeGanttSchedule([
    task("a", { start: "bad" }),
    task("b", { end: "2026-10-01" }),
  ]);
  assert.equal(
    result.conflicts.filter((item) => item.type === "invalid-date").length,
    2,
  );
});
test("Missing references, duplicate dependencies and typed identifiers retain their exact identities", () => {
  const result = analyzeGanttSchedule([
    task(1),
    task("1", { dependencies: [1, 1, "unknown"] }),
  ]);
  assert.equal(
    result.conflicts.filter((item) => item.type === "missing-dependency")
      .length,
    1,
  );
  assert.equal(
    result.conflicts.filter((item) => item.type === "dependency-order").length,
    1,
  );
  assert.equal(result.byEdge.size, 1);
});
test("Cycle diagnostics identify actual cycle edges without mislabelling downstream tasks", () => {
  const result = analyzeGanttSchedule([
    task("a", { dependencies: ["b"] }),
    task("b", { dependencies: ["a"] }),
    task("c", { start: "2026-11-10", end: "2026-11-12", dependencies: ["b"] }),
  ]);
  assert.equal(
    result.conflicts.filter((item) => item.type === "dependency-cycle").length,
    2,
  );
  assert.equal(
    result.conflicts.some((item) => item.taskId === "c"),
    false,
  );
  assert.equal(
    analyzeGanttSchedule([task("self", { dependencies: ["self"] })])
      .conflicts[0].type,
    "dependency-cycle",
  );
});
test("Large dependency chains use iterative graph traversal and previews inspect only incident edges", () => {
  const items = Array.from({ length: 10000 }, (_, index) =>
      task(index, { dependencies: index ? [index - 1] : [] }),
    ),
    result = analyzeGanttSchedule(items);
  assert.equal(result.cyclic.size, 0);
  assert.equal(result.conflicts.length, 9999);
  const before = result.conflicts.length,
    preview = previewGanttConflicts(
      result,
      5000,
      parseGanttDay("2026-11-04"),
      parseGanttDay("2026-11-06"),
    );
  assert(preview.length <= 2);
  assert.equal(result.conflicts.length, before);
  assert.equal(items[5000].start, "2026-11-01");
});
