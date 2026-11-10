import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "Node",
  "Element",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLFormElement",
  "SVGElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "FocusEvent",
  "MutationObserver",
])
  globalThis[name] = dom.window[name];
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
const {
  createApp,
  defineComponent,
  h,
  nextTick,
  shallowReactive,
  ref,
  KeepAlive,
} = await import("vue");
const { HysVirtualTable, provideHysConfig } =
  await import("../packages/ui/dist/index.js");
const rows = Array.from({ length: 200 }, (_, id) => ({
  id,
  name: "Task " + id,
  score: 200 - id,
}));
const columns = [
  { key: "id", label: "ID", width: 72, fixed: "left" },
  { key: "name", label: "Task", width: 360 },
  { key: "score", label: "Score", width: 96, fixed: "right", sortable: true },
];
const mounts = [];
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};
const frame = async () => {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await settle();
};
afterEach(() => {
  for (const { app, host } of mounts.splice(0)) {
    app.unmount();
    host.remove();
  }
});
async function mount(values = {}, slots = {}, accept = true) {
  const state = shallowReactive({ rows, columns, ...values }),
    vm = ref(),
    host = document.createElement("div"),
    events = [];
  document.body.append(host);
  const listeners = Object.fromEntries(
    HysVirtualTable.emits.map((name) => [
      "on" + name[0].toUpperCase() + name.slice(1),
      (...args) => {
        events.push({ name, args });
        if (
          accept &&
          name.startsWith("update:") &&
          state[name.slice(7)] !== undefined
        )
          state[name.slice(7)] = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      provideHysConfig({ motion: "off" });
      return () =>
        h(HysVirtualTable, { ...state, ...listeners, ref: vm }, slots);
    },
  });
  mounts.push({ app, host });
  app.mount(host);
  await settle();
  return {
    state,
    vm: vm.value,
    host,
    events,
    viewport: host.querySelector(".hys-ui-v4-table-viewport"),
    last: (name) => events.findLast((e) => e.name === name)?.args,
    body: () => [...host.querySelectorAll(".hys-ui-virtual-space [role=row]")],
  };
}
const click = async (node) => {
  assert(node);
  node.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true }),
  );
  await settle();
};
test("Legacy height, custom slots, and replace loading remain compatible", async () => {
  const record = { id: 0, name: "Raw record" };
  const table = await mount(
    {
      rows: [record],
      columns: [{ key: "name", label: "Name" }],
      loading: true,
    },
    {
      header: ({ column }) => column.label + " heading",
      name: ({ row, value }) => {
        assert.equal(row, record);
        return value + " custom";
      },
      empty: () => "Legacy placeholder",
    },
  );
  assert.equal(table.viewport.style.height, "322px");
  assert.equal(table.body().length, 0);
  assert.match(table.host.textContent, /Name heading.*Legacy placeholder/);
  table.state.loading = false;
  await settle();
  assert.equal(table.body().length, 1);
  assert.match(table.host.textContent, /Raw record custom/);
  table.state.rows = [];
  await settle();
  assert.match(table.host.textContent, /Legacy placeholder/);
});
test("VirtualTable keeps a bounded row and column window with typed fixed edges", async () => {
  let reads = 0;
  const data = Array.from({ length: 10000 }, (_, id) => ({ id })),
    many = Array.from({ length: 600 }, (_, i) => ({
      key: "c" + i,
      label: "Column " + i,
      width: 100,
      valueGetter: (row) => row.id + ":" + i,
    }));
  const table = await mount({
    rows: data,
    columns: [columns[0], ...many, columns[2]],
    rowKey: (row) => {
      reads++;
      return row.id;
    },
    width: 650,
    virtualColumns: true,
  });
  assert.equal(reads, 10000);
  assert(table.body().length < 24);
  assert(table.host.querySelectorAll("[role=columnheader]").length < 12);
  table.vm.scrollToRow(5000, "start");
  table.vm.scrollToColumn("c420", "start");
  await settle();
  assert(table.body().some((row) => row.textContent.includes("5000:420")));
  assert(
    table.vm.range.columnKeys.includes("id") &&
      table.vm.range.columnKeys.includes("score"),
  );
  assert(table.body().length < 24);
  assert(table.host.querySelectorAll("[role=columnheader]").length < 12);
  assert.equal(reads, 10000);
  assert.equal(
    table.host
      .querySelector("[data-column-key=c420]")
      .getAttribute("aria-colindex"),
    "422",
  );
});
test("Appending rows retains both axes and endReached is gated per dataset length", async () => {
  const table = await mount({
    width: 360,
    height: 140,
    rows: rows.slice(0, 30),
  });
  table.vm.scrollTo({ top: 10000, left: 300 });
  await settle();
  const { scrollTop, scrollLeft } = table.vm;
  assert.equal(table.last("endReached")[0].total, 30);
  for (let i = 0; i < 4; i++) {
    table.viewport.dispatchEvent(new Event("scroll"));
    await frame();
  }
  assert.equal(table.events.filter((e) => e.name === "endReached").length, 1);
  table.state.rows = rows.slice(0, 50);
  await settle();
  await frame();
  assert.equal(table.vm.scrollTop, scrollTop);
  assert.equal(table.vm.scrollLeft, scrollLeft);
  table.vm.scrollToRow(49, "end");
  await settle();
  assert.equal(table.last("endReached")[0].total, 50);
  table.state.rows = rows.slice(0, 3);
  await settle();
  await frame();
  assert.equal(table.vm.scrollTop, 0);
  assert.equal(table.body().length, 3);
});
test("Scroll notifications use the latest position once per frame", async () => {
  const table = await mount({ width: 300, height: 140 });
  const start = table.events.filter((e) => e.name === "scroll").length;
  for (let i = 1; i <= 12; i++) {
    table.viewport.scrollTop = 400 + i * 100;
    table.viewport.scrollLeft = i;
    table.viewport.dispatchEvent(new Event("scroll"));
  }
  assert.equal(table.events.filter((e) => e.name === "scroll").length, start);
  await frame();
  assert.equal(
    table.events.filter((e) => e.name === "scroll").length,
    start + 1,
  );
  assert.deepEqual(table.last("scroll")[0], {
    scrollTop: 1600,
    scrollLeft: 12,
    direction: "down",
  });
});
test("A short first page can request more data without scrolling", async () => {
  const table = await mount({ rows: rows.slice(0, 2) });
  assert.deepEqual(table.last("endReached"), [{ distance: 0, total: 2 }]);
  table.vm.remeasure();
  await frame();
  assert.equal(table.events.filter((e) => e.name === "endReached").length, 1);
});
test("Sorting is stable, leaves the source untouched, and exposes a request and an accepted event", async () => {
  const data = Object.freeze([
    { id: 0, score: 7 },
    { id: 1, score: 4 },
    { id: 2, score: 7 },
  ]);
  const table = await mount({
    rows: data,
    defaultSort: { key: "score", direction: "desc" },
  });
  assert.equal(table.vm.getRow(0), data[0]);
  assert.equal(table.vm.getRow(1), data[2]);
  await click(table.host.querySelector('[aria-label="Score升序"]'));
  assert.equal(table.vm.getRow(0), data[1]);
  assert.equal(table.vm.getRow(1), data[0]);
  assert.deepEqual(table.last("sortChange"), [
    { key: "score", direction: "asc" },
  ]);
  assert.deepEqual(
    data.map((r) => r.id),
    [0, 1, 2],
  );
  assert.equal(
    table.host
      .querySelector("[role=columnheader][data-column-key=score]")
      .getAttribute("aria-sort"),
    "ascending",
  );
});
test("Controlled rejection preserves order, selection and current row; custom sort leaves ordering to host", async () => {
  const remoteCols = columns.map((c) =>
    c.key === "score" ? { ...c, sortable: "custom" } : c,
  );
  const rejected = await mount(
    {
      columns: remoteCols,
      sortState: null,
      selectedRowKeys: [],
      currentRowKey: null,
      selectable: true,
      highlightCurrentRow: true,
    },
    {},
    false,
  );
  assert.equal(
    await rejected.vm.setSort({ key: "score", direction: "desc" }),
    false,
  );
  assert.equal(await rejected.vm.toggleRowSelection(0), false);
  assert.equal(await rejected.vm.setCurrentRow(0), false);
  assert.equal(rejected.last("sortChange"), undefined);
  assert.equal(rejected.last("selectionChange"), undefined);
  assert.equal(rejected.last("currentChange"), undefined);
  const table = await mount({ columns: remoteCols, sortState: null });
  assert.equal(
    await table.vm.setSort({ key: "score", direction: "asc" }),
    true,
  );
  assert.equal(table.vm.getRow(0), rows[0]);
});
test("Selection handles disabled records, zero and string keys, and external row removal", async () => {
  const data = [
    { id: 0, name: "Number" },
    { id: "0", name: "String" },
    { id: 2, name: "Locked" },
    { id: 3, name: "Duplicate" },
    { id: 3, name: "Duplicate also" },
  ];
  const table = await mount({ rows: data, selectable: (row) => row.id !== 2 });
  assert.equal(await table.vm.selectAll(), true);
  assert.deepEqual(table.vm.selectedRowKeys, [0, "0"]);
  assert.equal(await table.vm.toggleRowSelection(2), false);
  assert.equal(await table.vm.toggleRowSelection(3), false);
  assert.deepEqual(table.last("selectionChange")[1], data.slice(0, 2));
  assert.equal(
    new Set(table.body().map((el) => el.dataset.rowKey)).size,
    data.length,
  );
  table.state.rows = data.slice(1);
  await settle();
  assert.deepEqual(table.vm.selectedRowKeys, ["0"]);
  table.state.rows = data;
  await settle();
  assert.deepEqual(table.vm.selectedRowKeys, ["0"]);
});
test("Radio selection remains single and reserved keys survive temporary row replacement", async () => {
  const table = await mount({
    rows: rows.slice(0, 5),
    selectable: true,
    selectionType: "radio",
    reserveSelection: true,
    defaultSelectedRowKeys: [0],
  });
  assert.equal(await table.vm.selectAll(), false);
  assert.equal(await table.vm.toggleRowSelection(1, true), true);
  assert.deepEqual(table.vm.selectedRowKeys, [1]);
  table.state.rows = rows.slice(2, 5);
  await settle();
  assert.deepEqual(table.vm.selectedRowKeys, [1]);
  table.state.rows = rows.slice(0, 5);
  await settle();
  assert.equal(table.body()[1].querySelector("input").checked, true);
});
test("Keyboard moves to offscreen cells without creating many tab stops", async () => {
  const table = await mount({
    width: 300,
    height: 140,
    virtualColumns: true,
    selectable: true,
    keyboard: true,
  });
  assert.equal(await table.vm.focusCell(88, "name"), true);
  const grid = table.host.querySelector("[role=grid]");
  assert.equal(document.activeElement, grid);
  assert.equal(
    document.getElementById(grid.getAttribute("aria-activedescendant"))
      .textContent,
    "Task 88",
  );
  const key = async (key, options = {}) => {
    grid.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...options,
      }),
    );
    await settle();
  };
  await key("ArrowDown");
  assert.equal(
    document.getElementById(grid.getAttribute("aria-activedescendant"))
      .textContent,
    "Task 89",
  );
  await key(" ");
  await key("ArrowDown");
  await key(" ", { shiftKey: true });
  assert.deepEqual(table.vm.selectedRowKeys, [89, 90]);
  await key("End", { ctrlKey: true });
  assert.equal(
    document.getElementById(grid.getAttribute("aria-activedescendant")).dataset
      .columnKey,
    "score",
  );
  assert.equal(table.vm.getRow(table.vm.range.visibleEnd), rows.at(-1));
});
test("Fixed rows, custom cells and overlay use the original rows and preserve structure", async () => {
  const fixed = { id: "summary", name: "Summary" };
  const table = await mount(
    {
      fixedRows: [fixed],
      loadingMode: "overlay",
      loading: true,
      customCell: ({ column }) => ({ class: "example-" + column.key }),
    },
    {
      loading: () => "Updating data",
      footer: ({ rows }) => rows.length + " records",
    },
  );
  assert.equal(table.viewport.style.height, "364px");
  assert.equal(
    table.host
      .querySelector(".hys-ui-virtual-fixed-row")
      .getAttribute("aria-rowindex"),
    "2",
  );
  assert.equal(table.body()[0].getAttribute("aria-rowindex"), "3");
  assert(table.body().length > 0);
  assert(table.host.querySelector(".example-score"));
  assert.match(table.host.textContent, /Summary/);
  assert.match(table.host.textContent, /Updating data/);
  assert.match(table.host.textContent, /200 records/);
  assert.equal(
    await table.vm.setSort({ key: "score", direction: "asc" }),
    false,
  );
});
test("KeepAlive disconnects observers, cancels pending notifications and restores scroll", async () => {
  const active = ref(true),
    vm = ref(),
    observers = [],
    events = [],
    host = document.createElement("div");
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {
      this.active = true;
    }
    disconnect() {
      this.active = false;
    }
  };
  document.body.append(host);
  const Page = defineComponent({
    setup: () => () =>
      h(HysVirtualTable, {
        rows,
        columns,
        width: 350,
        height: 140,
        ref: vm,
        onScroll: (state) => events.push(state),
      }),
  });
  const app = createApp({
    setup: () => () =>
      h(KeepAlive, null, { default: () => (active.value ? h(Page) : null) }),
  });
  app.mount(host);
  mounts.push({ app, host });
  try {
    await settle();
    assert.equal(observers.filter((o) => o.active).length, 1);
    vm.value.scrollTo({ top: 840, left: 60 });
    await settle();
    const port = vm.value.viewport;
    port.scrollTop = 1680;
    port.dispatchEvent(new Event("scroll"));
    const count = events.length;
    active.value = false;
    await settle();
    await frame();
    assert.equal(events.length, count);
    assert.equal(observers.filter((o) => o.active).length, 0);
    active.value = true;
    await settle();
    assert.equal(vm.value.scrollTop, 1680);
    assert.equal(vm.value.scrollLeft, 60);
    assert.equal(observers.filter((o) => o.active).length, 1);
  } finally {
    if (original === undefined) delete globalThis.ResizeObserver;
    else globalThis.ResizeObserver = original;
  }
});
