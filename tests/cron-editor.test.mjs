import test from "node:test";
import assert from "node:assert/strict";
import { parseCron, normalizeCron } from "../packages/ui/dist/components/HysCronEditor/cronValidation.js";
import { cronRuns } from "../packages/ui/dist/components/HysCronEditor/cronSchedule.js";
import { describeCron } from "../packages/ui/dist/components/HysCronEditor/cronDescriptions.js";

const validateCron = (expression, format) => {
  const result = parseCron(expression, format);
  return result.kind === "invalid" ? result.issue.message : "";
};
const times = (expression, from, count, format, zone) => {
  const result = parseCron(expression, format);
  if (result.kind !== "calendar") return [];
  return cronRuns(result, new Date(from), count, zone).map(value => value.toISOString());
};

test("Unix Cron recognizes shortcuts, names, and day-or-weekday matching", () => {
  assert.equal(normalizeCron("  0  9 * jan mon-fri "), "0 9 * JAN MON-FRI");
  assert.equal(parseCron("@Reboot").kind, "reboot");
  assert.deepEqual(times("@reboot", "2026-01-01T00:00:00Z", 3), []);
  assert.deepEqual(times("@weekly", "2026-01-01T00:00:00Z", 2), [
    "2026-01-04T00:00:00.000Z", "2026-01-11T00:00:00.000Z",
  ]);
  assert.deepEqual(times("0 9 15 NOV MON", "2026-11-09T09:00:00Z", 2), [
    "2026-11-15T09:00:00.000Z", "2026-11-16T09:00:00.000Z",
  ]);
  assert.deepEqual(times("0 9 * * 7", "2026-01-01T00:00:00Z", 1), ["2026-01-04T09:00:00.000Z"]);
  assert.deepEqual(times("10-30/10 9 * * MON,WED-FRI/2", "2026-01-05T09:30:00Z", 2), [
    "2026-01-07T09:10:00.000Z", "2026-01-07T09:20:00.000Z",
  ]);
  assert.equal(describeCron(parseCron("0 9 * * MON-FRI")), "周一至周五 09:00 运行");
});

test("parser reports field-level errors and distinguishes Unix and Quartz weekday numbers", () => {
  const error = parseCron("60 9 * * MON");
  assert.equal(error.kind, "invalid");
  assert.equal(error.issue.field, "minute");
  assert.match(validateCron("*/0 * * * *"), /步长/);
  for (const expression of ["0 9 * * SUNMON", "0 9 * * 0MON", "0 9 * * ?"]) assert(validateCron(expression));
  assert(validateCron("0 0 9 * * *", "quartz"));
  assert(validateCron("0 0 9 ? * ?", "quartz"));
  assert(validateCron("0 0 9 ? * FRI#6", "quartz"));
  assert.match(validateCron("*/60 * * * * ?", "quartz"), /步长/);
  assert.match(validateCron("0 0 9 ? * FRI 2028-2027", "quartz"), /年份/);
  assert.equal(validateCron("0 0 9 ? * 1", "quartz"), "");
  assert.deepEqual(times("0 0 9 ? * 1", "2026-01-01T00:00:00Z", 1, "quartz"), [
    "2026-01-04T09:00:00.000Z",
  ]);
});

test("Quartz preview handles seconds and searches explicit future years", () => {
  assert.deepEqual(times("0/20 * * * * ?", "2026-11-01T00:00:00.123Z", 4, "quartz"), [
    "2026-11-01T00:00:20.000Z", "2026-11-01T00:00:40.000Z",
    "2026-11-01T00:01:00.000Z", "2026-11-01T00:01:20.000Z",
  ]);
  assert.deepEqual(times("15 0 9 29 FEB ? 2040", "2026-01-01T00:00:00Z", 2, "quartz"), [
    "2040-02-29T09:00:15.000Z",
  ]);
  assert.deepEqual(times("0 0 31 FEB *", "2026-01-01T00:00:00Z", 1), []);
});

test("Quartz month end, nearest weekday, nth weekday, and last weekday stay within the month", () => {
  const start = "2026-02-01T00:00:00Z";
  assert.deepEqual(times("0 0 9 L * ?", start, 1, "quartz"), ["2026-02-28T09:00:00.000Z"]);
  assert.deepEqual(times("0 0 9 L-2 * ?", start, 1, "quartz"), ["2026-02-26T09:00:00.000Z"]);
  assert.deepEqual(times("0 0 9 LW * ?", start, 1, "quartz"), ["2026-02-27T09:00:00.000Z"]);
  assert.deepEqual(times("0 0 9 1W AUG ?", start, 1, "quartz"), ["2026-08-03T09:00:00.000Z"]);
  assert.deepEqual(times("0 0 9 ? * FRI#2", start, 1, "quartz"), ["2026-02-13T09:00:00.000Z"]);
  assert.deepEqual(times("0 0 9 ? * FRIL", start, 1, "quartz"), ["2026-02-27T09:00:00.000Z"]);
});

test("zoned previews skip nonexistent times and retain both repeated instants in order", () => {
  const zone = "America/New_York";
  assert.deepEqual(times("30 2 * * *", "2026-03-07T05:00:00Z", 3, "unix", zone), [
    "2026-03-07T07:30:00.000Z", "2026-03-09T06:30:00.000Z", "2026-03-10T06:30:00.000Z",
  ]);
  assert.deepEqual(times("0,30 1 * * *", "2026-11-01T04:00:00Z", 4, "unix", zone), [
    "2026-11-01T05:00:00.000Z", "2026-11-01T05:30:00.000Z",
    "2026-11-01T06:00:00.000Z", "2026-11-01T06:30:00.000Z",
  ]);
  assert.deepEqual(times("30 1 * * *", "2026-11-01T05:30:00Z", 1, "unix", zone), ["2026-11-01T06:30:00.000Z"]);
  assert.deepEqual(times("0 9 * * *", "2026-11-01T00:00:00Z", 2, "unix", "Bad/TimeZone"), []);
});

test("normal timezone preview respects local calendar boundaries and fractional offsets", () => {
  assert.deepEqual(times("0 9 * * MON", "2026-11-15T22:00:00Z", 1, "unix", "Asia/Kathmandu"), [
    "2026-11-16T03:15:00.000Z",
  ]);
});
