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
  "Document",
  "ShadowRoot",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "HTMLButtonElement",
  "HTMLSelectElement",
  "HTMLFormElement",
  "Event",
  "FocusEvent",
  "MouseEvent",
  "KeyboardEvent",
  "MutationObserver",
])
  globalThis[name] = dom.window[name];
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(
  dom.window,
);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(
  dom.window,
);
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    x: 20,
    y: 20,
    left: 20,
    top: 20,
    right: 320,
    bottom: 60,
    width: 300,
    height: 40,
    toJSON() {
      return {};
    },
  };
};
HTMLElement.prototype.getClientRects = function () {
  return [this.getBoundingClientRect()];
};
HTMLElement.prototype.scrollIntoView = function () {};
if (!("inert" in HTMLElement.prototype))
  Object.defineProperty(HTMLElement.prototype, "inert", {
    configurable: true,
    get() {
      return this.hasAttribute("inert");
    },
    set(value) {
      this.toggleAttribute("inert", !!value);
    },
  });
const { createApp, h, reactive, ref, nextTick, KeepAlive, defineComponent } =
  await import("vue");
const ui = await import("../packages/ui/dist/index.js");
const mounts = new Set();
async function mount(Component, values = {}, slots = {}) {
  const props = reactive(values),
    events = {},
    element = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const listeners = Object.fromEntries(
    (Array.isArray(Component.emits)
      ? Component.emits
      : Object.keys(Component.emits || {})
    ).map((name) => [
      "on" + name[0].toUpperCase() + name.slice(1),
      (...args) => {
        (events[name] ??= []).push(args);
        if (name.startsWith("update:")) props[name.slice(7)] = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(
          Component,
          { ...props, ...listeners, ref: element },
          typeof slots === "string" ? { default: () => slots } : slots,
        );
    },
  });
  app.mount(host);
  const item = {
    props,
    events,
    host,
    get vm() {
      return element.value;
    },
    find: (selector) => host.querySelector(selector),
    all: (selector) => [...host.querySelectorAll(selector)],
    unmount() {
      app.unmount();
      host.remove();
      mounts.delete(item);
    },
  };
  mounts.add(item);
  await nextTick();
  return item;
}
const fire = async (element, type, options = {}) => {
  assert(element, "Missing target for " + type);
  const EventClass = type.startsWith("key")
    ? KeyboardEvent
    : type === "click"
      ? MouseEvent
      : Event;
  element.dispatchEvent(
    new EventClass(type, { bubbles: true, cancelable: true, ...options }),
  );
  await nextTick();
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
afterEach(async () => {
  for (const item of [...mounts]) item.unmount();
  await nextTick();
  document.body.innerHTML = "";
  document.body.style.cssText = "";
});

const columns = [
  { key: "name", label: "姓名", sortable: true, filterable: true },
  { key: "age", label: "年龄", sortable: true },
  {
    key: "team",
    label: "团队",
    filters: [
      { label: "设计", value: "design" },
      { label: "开发", value: "dev" },
    ],
  },
];
const rows = [
  { id: 1, name: "Alice", age: 30, team: "design" },
  { id: 2, name: "Bob", age: 20, team: "dev" },
  { id: 3, name: "Cara", age: 20, team: "design" },
];
const keys = (a) =>
  a.all("tbody tr[data-row-key]").map((e) => e.dataset.rowKey);
const settle = async () => {
  await nextTick();
  await pause(0);
  await nextTick();
};
test("Table locale customizes empty/loading states and accessible action labels", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows: [],
    locale: {
      emptyText: "No data",
      loadingText: "Loading records",
      selectAll: "Select all",
      sortAsc: "Sort {label} ascending",
    },
    selectable: true,
  });
  assert(a.host.textContent.includes("No data"));
  assert(a.find('[aria-label="Select all"]'));
  assert(a.find('[aria-label="Sort 姓名 ascending"]'));
  a.props.loading = true;
  await settle();
  assert(a.host.textContent.includes("Loading records"));
  a.props.loading = false;
  a.props.emptyText = "Explicit";
  await settle();
  assert(a.host.textContent.includes("Explicit"));
});
test("Typed false and zero filters remain distinct and column-width requests may be rejected", async () => {
  const a = await mount(ui.HysTable, {
    columns: [
      {
        key: "active",
        label: "Active",
        filters: [
          { label: "False", value: false },
          { label: "Zero", value: 0 },
        ],
      },
    ],
    rows: [
      { id: 1, active: false },
      { id: 2, active: 0 },
      { id: 3, active: "0" },
    ],
  });
  a.vm.setFilter("active", [false]);
  await settle();
  assert.deepEqual(keys(a), ["1"]);
  a.vm.setFilter("active", [0]);
  await settle();
  assert.deepEqual(keys(a), ["2"]);
  const host = document.createElement("div");
  document.body.append(host);
  const api = ref(),
    app = createApp({
      render: () =>
        h(ui.HysTable, {
          ref: api,
          columns: [{ key: "name", label: "Name", width: 120 }],
          rows,
          columnWidths: {},
        }),
    });
  app.mount(host);
  try {
    api.value.resizeColumn("name", 240);
    await settle();
    assert.equal(host.querySelector("col").style.width, "120px");
    assert.equal(host.querySelector("table").style.width, "100%");
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Indeterminate select-all can clear the page while preserving selected off-page rows", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows,
    selectable: true,
    pagination: true,
    pageSize: 2,
    reserveSelection: true,
    selectOnIndeterminate: false,
  });
  await a.vm.toggleRowSelection(3, true);
  await a.vm.toggleRowSelection(1, true);
  await settle();
  await fire(a.find('[aria-label="选择当前页全部行"]'), "click");
  await settle();
  assert.deepEqual(a.vm.selectedKeys, [3]);
});
test("Default expansion bounds automatic lazy loading concurrency and makes progress as requests settle", async () => {
  const requests = [];
  const a = await mount(ui.HysTable, {
    columns: [{ key: "name", label: "Name" }],
    rows: Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: "Parent " + i,
      hasChildren: true,
    })),
    treeMode: true,
    defaultExpandAll: true,
    loadChildren: (row, ctx) =>
      new Promise((resolve) =>
        requests.push({ resolve, signal: ctx.signal, row }),
      ),
  });
  await settle();
  assert.equal(requests.length, 4);
  requests[0].resolve([{ id: 100, name: "child" }]);
  await settle();
  assert.equal(requests.length, 5);
  a.unmount();
  assert(requests.slice(1).every((r) => r.signal.aborted));
});
test("Cached-page leave cancels lazy work, retains expansion and resumes with a fresh request", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const active = ref(true),
    api = ref(),
    requests = [],
    loads = [],
    stable = { id: 1, name: "Parent", hasChildren: true },
    loader = (row, ctx) =>
      new Promise((resolve) => requests.push({ resolve, signal: ctx.signal })),
    app = createApp({
      render: () =>
        h(KeepAlive, null, {
          default: () =>
            active.value
              ? h(ui.HysTable, {
                  ref: api,
                  columns: [{ key: "name", label: "Name" }],
                  rows: [stable],
                  treeMode: true,
                  loadChildren: loader,
                  onLoad: (...args) => loads.push(args),
                })
              : h("div", "other"),
        }),
    });
  app.mount(host);
  await settle();
  try {
    await api.value.toggleRowExpansion(1, true);
    await settle();
    assert.equal(requests.length, 1);
    active.value = false;
    await settle();
    assert(requests[0].signal.aborted);
    requests[0].resolve([{ id: 99, name: "stale" }]);
    await settle();
    assert.equal(loads.length, 0);
    active.value = true;
    await settle();
    assert.equal(requests.length, 2);
    requests[1].resolve([{ id: 2, name: "fresh" }]);
    await settle();
    assert(host.textContent.includes("fresh"));
    assert(!host.textContent.includes("stale"));
    assert.equal(loads.length, 1);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Table remains unpaginated by default and resolves nested fields and custom cell formatters", async () => {
  const a = await mount(ui.HysTable, {
    columns: [
      {
        key: "user",
        label: "User",
        dataIndex: ["profile", "name"],
        formatter: (row, c, value) => "User: " + value,
      },
    ],
    rows: [{ id: 1, profile: { name: "Alice" } }],
  });
  assert(!a.find(".hys-ui-table-pagination"));
  assert(a.host.textContent.includes("User: Alice"));
  assert.equal(a.props.rows[0].profile.name, "Alice");
});
test("Table normalizes grouped fixed headers, duplicate columns and responsive visibility without mutating definitions", async () => {
  const group = [
    {
      key: "person",
      label: "资料",
      children: [
        { key: "name", label: "姓名", fixed: "left" },
        { key: "age", label: "年龄" },
        { key: "hidden", label: "隐藏", hidden: true },
      ],
    },
    { key: "team", label: "团队", fixed: "right" },
    { key: "age", label: "重复" },
  ];
  const a = await mount(ui.HysTable, { columns: group, rows });
  assert.equal(a.all("col").length, 3);
  assert.equal(a.all("thead tr").length, 2);
  assert.equal(
    a.all("tbody tr[data-row-key]:first-child td")[0].dataset.columnKey,
    "name",
  );
  assert.equal(
    a.all("tbody tr[data-row-key]:first-child td").at(-1).dataset.columnKey,
    "team",
  );
  assert.equal(group[0].children.length, 3);
  assert.equal(a.find('th[data-column-key="name"]').style.zIndex, "6");
});
test("Multi-sort is stable, numeric, null-last and reversible while keeping source order", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows: [...rows, { id: 4, name: "Null", age: null }],
    multiSort: true,
  });
  a.vm.setSort([
    { key: "age", direction: "asc" },
    { key: "name", direction: "desc" },
  ]);
  await settle();
  assert.deepEqual(keys(a), ["3", "2", "1", "4"]);
  a.vm.setSort({ key: "age", direction: "desc" });
  await settle();
  assert.deepEqual(keys(a), ["1", "2", "3", "4"]);
  a.vm.clearSort();
  await settle();
  assert.deepEqual(keys(a), ["1", "2", "3", "4"]);
  assert.equal(a.props.rows[0].name, "Alice");
});
test("Controlled sorting and filters may be rejected while query callbacks describe the requested state", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const instance = ref(),
    changes = [],
    app = createApp({
      render: () =>
        h(ui.HysTable, {
          columns,
          rows,
          sort: null,
          filters: {},
          ref: instance,
          onQueryChange: (q) => changes.push(q),
        }),
    });
  app.mount(host);
  try {
    instance.value.setSort({ key: "age", direction: "asc" });
    instance.value.setFilter("name", ["Bob"]);
    await settle();
    assert.equal(host.querySelector("tbody tr").dataset.rowKey, "1");
    assert.equal(host.querySelectorAll("tbody tr").length, 3);
    assert.equal(changes.at(-1).filters.name[0], "Bob");
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Local filters combine per-column and reset pagination while custom server sorting keeps supplied data", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows,
    pagination: true,
    pageSize: 1,
  });
  a.vm.setPage(3);
  await settle();
  assert.deepEqual(keys(a), ["3"]);
  a.vm.setFilter("team", ["design"]);
  await settle();
  assert.equal(a.vm.query.page, 1);
  a.vm.setFilter("name", ["Cara"]);
  await settle();
  assert.deepEqual(keys(a), ["3"]);
  a.vm.clearFilter(["name"]);
  await settle();
  assert.deepEqual(keys(a), ["1"]);
  a.vm.clearFilter();
  await settle();
  assert.equal(a.vm.query.currentData.length, 3);
  const b = await mount(ui.HysTable, {
    columns,
    rows,
    serverMode: true,
    pagination: { pageSize: 2, total: 200 },
  });
  b.vm.setSort({ key: "age", direction: "asc" });
  b.vm.setFilter("team", ["dev"]);
  await settle();
  assert.deepEqual(keys(b), ["1", "2", "3"]);
  assert.equal(b.events.queryChange.at(-1)[0].filters.team[0], "dev");
});
test("Checkbox selection skips disabled rows and preserves selected identities through sorting and pagination", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows,
    selectable: (row) => row.id !== 2,
    pagination: true,
    pageSize: 2,
    reserveSelection: true,
  });
  assert(await a.vm.toggleAllSelection(true));
  assert.deepEqual(a.vm.selectedKeys, [1]);
  a.vm.setPage(2);
  await settle();
  assert(await a.vm.toggleRowSelection(3, true));
  assert.deepEqual(
    a.vm.getSelectionRows().map((r) => r.id),
    [1, 3],
  );
  a.vm.setSort({ key: "name", direction: "desc" });
  await settle();
  assert.deepEqual(a.vm.selectedKeys, [1, 3]);
  assert(await a.vm.clearSelection());
  assert.deepEqual(a.vm.selectedKeys, []);
});
test("Reserved selections survive server-page replacement; non-reserved selections are pruned", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows: [rows[0]],
    selectable: true,
    reserveSelection: true,
    serverMode: true,
  });
  assert(await a.vm.toggleRowSelection(1, true));
  a.props.rows = [rows[1]];
  await settle();
  assert.deepEqual(a.vm.selectedKeys, [1]);
  assert.equal(a.vm.getSelectionRows()[0].name, "Alice");
  assert(await a.vm.toggleRowSelection(2, true));
  assert.deepEqual(a.vm.selectedKeys, [1, 2]);
  a.props.reserveSelection = false;
  await settle();
  assert.deepEqual(a.vm.selectedKeys, [2]);
});
test("Radio selection and current-row highlighting remain independent and can be cleared", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows,
    selectable: true,
    selectionType: "radio",
    highlightCurrentRow: true,
  });
  await a.vm.toggleRowSelection(1, true);
  await a.vm.toggleRowSelection(2, true);
  assert.deepEqual(a.vm.selectedKeys, [2]);
  await a.vm.setCurrentRow(3);
  await settle();
  assert.equal(a.vm.currentRow.name, "Cara");
  assert(
    a.find('[data-row-key="3"]').classList.contains("hys-ui-table-row-current"),
  );
  await a.vm.setCurrentRow();
  assert.equal(a.vm.currentRow, undefined);
  assert.deepEqual(a.vm.selectedKeys, [2]);
});
test("Tree selection cascades through loaded children and reports intermediate parents", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows: [
      {
        id: "parent",
        name: "Parent",
        children: [
          { id: 1, name: "A" },
          { id: 2, name: "B" },
        ],
      },
    ],
    selectable: true,
    treeMode: true,
    checkStrictly: false,
  });
  await a.vm.toggleRowSelection(1, true);
  assert.deepEqual(
    a.vm.getHalfSelectionRows().map((r) => r.id),
    ["parent"],
  );
  await a.vm.toggleRowSelection(2, true);
  assert(a.vm.selectedKeys.includes("parent"));
  await a.vm.toggleRowSelection("parent", false);
  assert.deepEqual(a.vm.selectedKeys, []);
  assert.deepEqual(a.vm.getHalfSelectionRows(), []);
});
test("Tree filtering retains ancestor paths and sibling sorting does not mix hierarchical levels", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows: [
      {
        id: 1,
        name: "Parent",
        children: [
          { id: 2, name: "Z", age: 30 },
          { id: 3, name: "Needle", age: 10 },
        ],
      },
      { id: 4, name: "Other" },
    ],
    treeMode: true,
  });
  a.vm.setFilter("name", ["Needle"]);
  await settle();
  assert.deepEqual(keys(a), ["1", "3"]);
  a.vm.clearFilter();
  await a.vm.toggleRowExpansion(1, true);
  a.vm.setSort({ key: "age", direction: "asc" });
  await settle();
  assert.deepEqual(keys(a), ["1", "3", "2", "4"]);
});
test("Expandable detail rows preserve local content only when requested", async () => {
  let count = 0;
  const Child = defineComponent({
    setup() {
      count++;
      return () => h("input", { value: "draft" });
    },
  });
  const a = await mount(
    ui.HysTable,
    { columns, rows, preserveExpandedContent: true },
    { expand: ({ row }) => h(Child, { key: row.id }) },
  );
  await a.vm.toggleRowExpansion(1, true);
  await settle();
  const field = a.find(".hys-ui-table-detail input");
  field.value = "edited";
  await a.vm.toggleRowExpansion(1, false);
  await settle();
  assert.equal(a.find(".hys-ui-table-detail").style.display, "none");
  await a.vm.toggleRowExpansion(1, true);
  await settle();
  assert.equal(a.find(".hys-ui-table-detail input").value, "edited");
  assert.equal(count, 1);
});
test("Lazy trees load once, retry failures, and ignore stale requests after row replacement", async () => {
  let attempt = 0;
  const a = await mount(ui.HysTable, {
    columns,
    rows: [{ id: 1, name: "Parent", hasChildren: true }],
    treeMode: true,
    loadChildren: async () => {
      attempt++;
      if (attempt === 1) throw Error("offline");
      return [{ id: 2, name: "Loaded" }];
    },
  });
  await a.vm.toggleRowExpansion(1, true);
  await settle();
  assert(a.find('[aria-label="重新加载子行"]'));
  assert(await a.vm.loadRow(1, true));
  await settle();
  assert.deepEqual(keys(a), ["1", "2"]);
  await a.vm.toggleRowExpansion(1, false);
  await a.vm.toggleRowExpansion(1, true);
  await settle();
  assert.equal(attempt, 2);
  let resolve, signal;
  const b = await mount(ui.HysTable, {
    columns,
    rows: [{ id: "p", name: "Old", hasChildren: true }],
    treeMode: true,
    loadChildren: (row, ctx) => {
      signal = ctx.signal;
      return new Promise((r) => (resolve = r));
    },
  });
  await b.vm.toggleRowExpansion("p", true);
  const oldSignal = signal,
    oldResolve = resolve;
  b.props.rows = [{ id: "p", name: "New", hasChildren: true }];
  await settle();
  assert(oldSignal.aborted);
  oldResolve([{ id: 99, name: "Stale" }]);
  await settle();
  assert(!b.host.textContent.includes("Stale"));
  assert(!b.events.load);
});
test("Collapsing a pending lazy row aborts the request without a late load event", async () => {
  let resolve, signal;
  const a = await mount(ui.HysTable, {
    columns,
    rows: [{ id: 1, name: "P", hasChildren: true }],
    treeMode: true,
    loadChildren: (r, c) => {
      signal = c.signal;
      return new Promise((done) => (resolve = done));
    },
  });
  await a.vm.toggleRowExpansion(1, true);
  await a.vm.toggleRowExpansion(1, false);
  assert(signal.aborted);
  resolve([{ id: 2, name: "late" }]);
  await settle();
  assert(!a.events.load);
  assert.deepEqual(keys(a), ["1"]);
});
test("Grouped summaries and merged cells remain aligned and do not merge across fixed boundaries", async () => {
  const a = await mount(ui.HysTable, {
    columns: [
      { key: "id", label: "ID", fixed: "left", width: 80 },
      { key: "name", label: "Name" },
      { key: "age", label: "Age", summary: "sum" },
    ],
    rows,
    showSummary: true,
    spanMethod: ({ rowIndex, columnIndex }) =>
      rowIndex === 0 && columnIndex === 0
        ? [2, 2]
        : rowIndex === 0 && columnIndex === 1
          ? [1, 2]
          : undefined,
  });
  assert.equal(a.find('tbody td[data-column-key="id"]').colSpan, 1);
  assert.equal(a.find('tbody td[data-column-key="id"]').rowSpan, 2);
  assert.equal(a.find('tbody td[data-column-key="name"]').colSpan, 2);
  assert.equal(a.find('tfoot td[data-column-key="age"]').textContent, "70");
});
test("Custom summaries, header/body slots and cell events expose typed values and row identity", async () => {
  const a = await mount(
    ui.HysTable,
    {
      columns,
      rows,
      showSummary: true,
      summaryMethod: () => ({ age: "Sum: 70" }),
    },
    {
      "header-name": ({ column }) => h("b", "Header " + column.label),
      "body-cell": ({ value }) => h("i", String(value)),
      title: () => h("strong", "People"),
      footer: () => h("small", "Footer"),
    },
  );
  assert(a.host.textContent.includes("Header 姓名"));
  assert.equal(
    a.find('tfoot td[data-column-key="age"]').textContent,
    "Sum: 70",
  );
  await fire(a.find('tbody td[data-column-key="age"]'), "click");
  assert.equal(a.events.cellClick[0][0].value, 30);
  assert.equal(a.events.rowClick[0][0].id, 1);
});
test("Controlled row selections and expansion can reject requests without emitting accepted events", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const instance = ref(),
    accepted = [],
    app = createApp({
      render: () =>
        h(ui.HysTable, {
          ref: instance,
          columns,
          rows,
          selectable: true,
          selectedRowKeys: [],
          expandedRowKeys: [],
          expandable: true,
          onSelectionChange: () => accepted.push("selected"),
          onExpandChange: () => accepted.push("expanded"),
        }),
    });
  app.mount(host);
  try {
    assert.equal(await instance.value.toggleRowSelection(1, true), false);
    assert.equal(await instance.value.toggleRowExpansion(1, true), false);
    assert.deepEqual(accepted, []);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Disabled/loading states prevent table edits and loading/empty cells always span visible columns", async () => {
  const a = await mount(ui.HysTable, {
    columns,
    rows,
    disabled: true,
    selectable: true,
  });
  assert.equal(await a.vm.toggleRowSelection(1, true), false);
  a.vm.setSort({ key: "age", direction: "asc" });
  assert(!a.events.sortChange);
  a.props.loading = true;
  await settle();
  assert(a.find('[role="status"]'));
  assert.equal(a.find(".hys-ui-table-message td").colSpan, 4);
  a.props.columns = [];
  a.props.loading = false;
  a.props.rows = [];
  await settle();
  assert.equal(a.find(".hys-ui-table-message td").colSpan, 1);
});
test("Cyclic tree input and very deep row structures remain bounded without recursion overflow", async () => {
  const root = { id: 0, name: "root", children: [] };
  let current = root;
  for (let i = 1; i < 1500; i++) {
    const next = { id: i, name: String(i), children: [] };
    current.children.push(next);
    current = next;
  }
  current.children.push(root);
  const a = await mount(ui.HysTable, {
    columns: [{ key: "name", label: "Name" }],
    rows: [root],
    treeMode: true,
  });
  assert.deepEqual(keys(a), ["0"]);
  assert.equal(a.vm.query.currentData.length, 1500);
});
test("Table column widths can be changed and reset without mutating column definitions", async () => {
  const defs = [{ key: "name", label: "Name", width: 120, resizable: true }],
    a = await mount(ui.HysTable, { columns: defs, rows });
  a.vm.resizeColumn("name", 220);
  await settle();
  assert.equal(a.find("col").style.width, "220px");
  assert.equal(a.events.columnResize.at(-1)[1], 220);
  assert.equal(defs[0].width, 120);
  a.vm.resetColumnWidths();
  await settle();
  assert.equal(a.find("col").style.width, "120px");
});
