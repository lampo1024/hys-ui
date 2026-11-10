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
async function mount(Component, values = {}, slots = {}, acceptUpdates = true) {
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
        if (acceptUpdates && name.startsWith("update:"))
          props[name.slice(7)] = args[0];
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

test("DataGrid current-column search toggles the shared filter row while preserving conditions", async () => {
  const a = await mount(ui.HysDataGrid, {
    columns: [
      { key: "id", label: "ID", pinned: "left" },
      { key: "name", label: "Name" },
      { key: "date", label: "Date", pinned: "right" },
    ],
    rows: [
      { id: 1, name: "Alpha", date: "2026-11-09" },
      { id: 2, name: "Beta", date: "2026-11-10" },
    ],
  });
  const trigger = a.find('[aria-label="筛选Name"]');
  await fire(trigger, "click");
  const input = a.find('[aria-label="过滤Name"]');
  assert.equal(document.activeElement, input);
  assert.equal(trigger.getAttribute("aria-controls"), input.closest("tr").id);
  input.value = "Alpha";
  await fire(input, "input");
  assert.equal(a.all("tbody tr").length, 1);
  await fire(trigger, "click");
  assert(!a.find(".hys-ui-pf-grid-filter-row"));
  assert.equal(a.all("tbody tr").length, 1);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert(!a.host.textContent.includes("收起筛选"));
  await fire(trigger, "click");
  assert.equal(a.find('[aria-label="过滤Name"]').value, "Alpha");
});
test("DataGrid switching filter columns focuses the right field and Escape returns to its trigger", async () => {
  const a = await mount(ui.HysDataGrid, {
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
    ],
    rows: [{ id: 1, name: "Alpha" }],
  });
  await fire(a.find('[aria-label="筛选ID"]'), "click");
  await fire(a.find('[aria-label="筛选Name"]'), "click");
  const input = a.find('[aria-label="过滤Name"]');
  assert.equal(document.activeElement, input);
  await fire(input, "keydown", { key: "Escape" });
  assert(!a.find(".hys-ui-pf-grid-filter-row"));
  assert.equal(document.activeElement, a.find('[aria-label="筛选Name"]'));
  assert.equal(a.events.sortChange, undefined);
});

test("DataGrid starts at the supplied remote page and reconciles page and size together", async () => {
  const a = await mount(ui.HysDataGrid, {
    columns: [{ key: "id", label: "ID" }],
    rows: [{ id: 21 }],
    serverMode: true,
    page: 3,
    pageSize: 10,
    totalRows: 50,
  });
  assert.equal(a.find('[aria-current="page"]').textContent.trim(), "3");
  a.props.page = 2;
  a.props.pageSize = 12;
  await nextTick();
  assert.equal(a.vm.getQuery().page, 2);
  assert.equal(a.vm.getQuery().pageSize, 12);
  assert.equal(a.events.queryChange.length, 1);
});

test("DataGrid requests controlled query changes and only reports accepted state", async () => {
  const original = { page: 2, pageSize: 2, search: "", sort: [], filters: {} };
  const a = await mount(
    ui.HysDataGrid,
    {
      columns: [{ key: "id", label: "ID" }],
      rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      query: original,
      immediateQuery: true,
    },
    {},
    false,
  );
  assert.deepEqual(a.events.queryChange[0][0], original);
  await fire(a.find('[aria-label="ID降序"]'), "click");
  const requested = a.events["update:query"][0][0];
  assert.deepEqual(requested.sort, [{ key: "id", direction: "desc" }]);
  assert.equal(requested.page, 1);
  assert.equal(a.vm.getQuery().page, 2);
  assert.equal(a.events.queryChange.length, 1);
  assert.equal(a.events.sortChange, undefined);
  a.props.query = requested;
  await nextTick();
  assert.equal(a.events.queryChange.length, 2);
  assert.equal(
    a.find('th[data-column-key="id"]').getAttribute("aria-sort"),
    "descending",
  );
  a.vm.getQuery().sort.length = 0;
  assert.equal(a.vm.getQuery().sort.length, 1);
});

test("DataGrid keeps numeric and text keys distinct and skips disabled rows when selecting a page", async () => {
  const a = await mount(
    ui.HysDataGrid,
    {
      columns: [{ key: "name", label: "Name" }],
      rows: [
        { id: 0, name: "numeric" },
        { id: "0", name: "string" },
        { id: 3, name: "locked" },
      ],
      rowSelectable: (row) => row.id !== 3,
      reserveSelection: true,
    },
    {},
    false,
  );
  assert.deepEqual(
    a.all("[data-grid-row]").map((row) => row.dataset.gridRow),
    ["number:0", "string:0", "number:3"],
  );
  a.find('[aria-label="选择当前页全部行"]').click();
  await nextTick();
  assert.deepEqual(a.vm.getSelection(), [0, "0"]);
  assert(a.find('[aria-label="选择第3行"]').disabled);
  a.props.rows = [{ id: 4, name: "replacement" }];
  await nextTick();
  assert.deepEqual(a.vm.getSelection(), [0, "0"]);
  a.vm.clearSelection();
  await nextTick();
  assert.deepEqual(a.events.selectionChange.at(-1)[0], []);
});

test("DataGrid only commits accepted controlled radio selections", async () => {
  const a = await mount(
    ui.HysDataGrid,
    {
      columns: [{ key: "id", label: "ID" }],
      rows: [{ id: 0 }, { id: "0" }],
      selectionType: "radio",
      selectedRowKeys: [],
    },
    {},
    false,
  );
  a.find('[aria-label="选择第1行"]').click();
  await pause(0);
  assert.deepEqual(a.events["update:selectedRowKeys"][0][0], [0]);
  assert.equal(a.events.selectionChange, undefined);
  assert.equal(a.find('[aria-label="选择第1行"]').checked, false);
  a.props.selectedRowKeys = ["0"];
  await nextTick();
  assert.equal(a.find('[aria-label="选择第2行"]').checked, true);
  assert.deepEqual(a.events.selectionChange.at(-1)[0], ["0"]);
});

test("DataGrid tree collapse excludes descendants and exposes original rows without metadata", async () => {
  const rows = [
    { id: 0, name: "parent" },
    { id: "0", parentId: 0, name: "child" },
  ];
  const a = await mount(ui.HysDataGrid, {
    columns: [{ key: "name", label: "Name" }],
    rows,
    treeMode: true,
    pageSize: 1,
  });
  assert.equal(a.all("[data-grid-row]").length, 1);
  assert(!a.find('[aria-label="第 2 页"]'));
  const row = a.find('[data-grid-row="number:0"]');
  await fire(row, "click");
  assert.equal(a.events.rowClick[0][0], a.props.rows[0]);
  assert.deepEqual(Object.keys(a.events.rowClick[0][0]), ["id", "name"]);
  await fire(a.find('[aria-label="展开子行"]'), "click");
  assert(a.find('[aria-label="第 2 页"]'));
  await fire(a.find('[aria-label="折叠子行"]'), "click");
  assert(!a.find('[aria-label="第 2 页"]'));
});

test("DataGrid editing uses the source record and stable fallback key after sorting", async () => {
  const a = await mount(ui.HysDataGrid, {
    columns: [{ key: "name", label: "Name", editable: true }],
    editable: true,
    rows: [{ name: "Alpha" }, { name: "Zulu" }],
  });
  await fire(a.find('[aria-label="Name降序"]'), "click");
  const cell = a.find(
    '[data-grid-row="number:1"] td[data-column-key="name"] span',
  );
  cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  await nextTick();
  const editor = a.find('[aria-label="编辑Name"]');
  editor.value = "Changed";
  await fire(editor, "input");
  await fire(editor, "keydown", { key: "Enter" });
  assert.equal(a.events.cellEdit.length, 1);
  const payload = a.events.cellEdit[0][0];
  assert.equal(payload.row, a.props.rows[1]);
  assert.equal(payload.rowKey, 1);
  assert.equal(payload.value, "Changed");
});

test("DataGrid aborts superseded remote requests, ignores late results and retries failures", async () => {
  const requests = [];
  const a = await mount(
    ui.HysDataGrid,
    {
      columns: [{ key: "name", label: "Name" }],
      rows: [],
      totalRows: 50,
      defaultQuery: { page: 3 },
      loadRows: (query, { signal }) =>
        new Promise((resolve, reject) =>
          requests.push({ query, signal, resolve, reject }),
        ),
    },
    {},
    false,
  );
  assert.equal(requests[0].query.page, 3);
  a.vm.setQuery({ page: 2 });
  await nextTick();
  assert.equal(requests.length, 2);
  assert(requests[0].signal.aborted);
  requests[1].resolve({ rows: [{ id: 11, name: "accepted" }], total: 50 });
  await pause(0);
  requests[0].resolve({ rows: [{ id: 21, name: "stale" }], total: 50 });
  await pause(0);
  assert(a.host.textContent.includes("accepted"));
  assert(!a.host.textContent.includes("stale"));
  a.vm.reload();
  requests.at(-1).reject(new Error("offline"));
  await pause(0);
  assert(a.host.textContent.includes("加载失败"));
  assert.equal(a.events.loadError[0][0].message, "offline");
  a.vm.reload();
  requests.at(-1).resolve({ rows: [{ id: 11, name: "retried" }], total: 50 });
  await pause(0);
  assert(a.host.textContent.includes("retried"));
  assert(!a.host.textContent.includes("加载失败"));
});

test("DataGrid cancels a pending load while cached and restarts it on return", async () => {
  const requests = [];
  const showing = ref(true);
  const loadRows = (query, { signal }) =>
    new Promise((resolve) => requests.push({ signal, resolve }));
  const Page = defineComponent({
    setup: () => () =>
      h(ui.HysDataGrid, {
        columns: [{ key: "id", label: "ID" }],
        rows: [],
        loadRows,
      }),
  });
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup: () => () =>
      h(KeepAlive, null, {
        default: () => (showing.value ? h(Page) : null),
      }),
  });
  app.mount(host);
  try {
    assert.equal(requests.length, 1);
    showing.value = false;
    await nextTick();
    assert(requests[0].signal.aborted);
    showing.value = true;
    await nextTick();
    assert.equal(requests.length, 2);
    requests[1].resolve({ rows: [{ id: 41 }], total: 1 });
    await pause(0);
    assert(host.querySelector('[data-grid-row="number:41"]'));
  } finally {
    app.unmount();
    host.remove();
  }
});

test("DataGrid resize previews per frame, persists on release, and discards cancellation", async () => {
  const previous = globalThis.localStorage;
  const writes = [];
  globalThis.localStorage = {
    getItem: () => null,
    setItem: (key, value) => writes.push({ key, value: JSON.parse(value) }),
  };
  try {
    const a = await mount(ui.HysDataGrid, {
      columns: [
        { key: "id", label: "ID", width: 100, minWidth: 80, maxWidth: 180 },
      ],
      rows: [{ id: 1 }],
      storageKey: "resize-test",
    });
    const handle = a.find('[aria-label="调整ID列宽"]');
    const pointer = (target, type, clientX, pointerId = 1) => {
      const event = new MouseEvent(type, {
        clientX,
        button: 0,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, "pointerId", { value: pointerId });
      target.dispatchEvent(event);
    };
    document.body.style.cursor = "wait";
    pointer(handle, "pointerdown", 100);
    for (const x of [110, 125, 140]) pointer(window, "pointermove", x);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await nextTick();
    assert.equal(handle.getAttribute("aria-valuenow"), "140");
    assert.equal(writes.length, 0);
    pointer(window, "pointerup", 150, 2);
    assert.equal(writes.length, 0);
    pointer(window, "pointerup", 150);
    await nextTick();
    assert.equal(writes.length, 1);
    assert.equal(writes[0].value.widths.id, 150);
    assert.equal(document.body.style.cursor, "wait");
    pointer(handle, "pointerdown", 150);
    pointer(window, "pointermove", 175);
    pointer(window, "pointercancel", 175);
    await nextTick();
    assert.equal(handle.getAttribute("aria-valuenow"), "150");
    assert.equal(writes.length, 1);
    const search = a.find('[aria-label="搜索表格"]');
    search.addEventListener("keydown", (event) => event.stopPropagation());
    pointer(handle, "pointerdown", 150);
    pointer(window, "pointermove", 175);
    await fire(search, "keydown", { key: "Escape" });
    pointer(window, "pointerup", 175);
    await nextTick();
    assert.equal(handle.getAttribute("aria-valuenow"), "150");
    assert.equal(writes.length, 1);
    await fire(handle, "keydown", { key: "End" });
    assert.equal(handle.getAttribute("aria-valuenow"), "180");
    assert.equal(writes[1].value.widths.id, 180);
  } finally {
    globalThis.localStorage = previous;
  }
});

test("DataGrid groups equal structured values without merging different records or empty values", async () => {
  const a = await mount(ui.HysDataGrid, {
    columns: [{ key: "group", label: "分类" }],
    rows: [
      { id: 1, group: { team: "A" } },
      { id: 2, group: { team: "B" } },
      { id: 3, group: { team: "A" } },
      { id: 4, group: null },
      { id: 5, group: "" },
    ],
    groupable: true,
  });
  await fire(a.find('[aria-label="按列分组"]'), "click");
  await pause(10);
  const option = [...document.querySelectorAll('[role="option"]')].find(
    (node) => node.textContent.trim() === "分类",
  );
  await fire(option, "click");
  const groups = a.all(".hys-ui-pf-grid-group-row");
  assert.equal(groups.length, 4);
  assert.match(groups[0].textContent, /\(2\)/);
  assert.equal(a.all("[data-grid-row]").length, 5);
});
