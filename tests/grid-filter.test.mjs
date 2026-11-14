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
const { createProGridClipboard } =
  await import("../packages/ui/dist/pro-grid/clipboard.js");
const { createProGridConditionalFormat } =
  await import("../packages/ui/dist/pro-grid/conditional-format.js");
const mounts = new Set();
async function mount(Component, values = {}, slots = {}, acceptUpdates = true, motion = "off") {
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
      ui.provideHysConfig({ motion });
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

test("ProGrid parses a number, validates asynchronously and retries a failed save without changing rows", async () => {
  const rows = [
    { id: 1, amount: 20 },
    { id: "1", amount: 30 },
  ];
  const seen = [];
  let saves = 0;
  const grid = await mount(ui.HysProGrid, {
    rows,
    rowKey: "id",
    columns: [
      {
        key: "amount",
        label: "Amount",
        editor: { type: "number", min: 1 },
        render: ({ value }) => h("strong", "$" + value),
        canEdit: ({ row }) => row.id === 1,
        async validate(change, { signal }) {
          seen.push(change.value);
          assert.equal(signal.aborted, false);
          return change.value <= 100 || "Over limit";
        },
      },
    ],
    async saveCell() {
      return ++saves === 1 ? "Offline" : true;
    },
  });
  const cell = grid.find(
    '[data-grid-row="number:1"] td[data-column-key="amount"]',
  );
  assert.equal(cell.querySelector("strong").textContent, "$20");
  assert.equal(
    grid.find('[data-grid-row="string:1"] .hys-ui-pro-grid-edit'),
    null,
  );
  cell.focus();
  await fire(cell, "keydown", { key: "F2" });
  await nextTick();
  const input = cell.querySelector("[data-pro-grid-input]");
  assert.equal(document.activeElement, input);
  assert.equal(input.value, "20");
  assert.deepEqual(grid.vm.editing, { rowKey: 1, columnKey: "amount" });
  for (const [draft, expected] of [
    ["NaN", "parse"],
    ["120", "validate"],
    ["52.5", "save"],
  ]) {
    input.value = draft;
    await fire(input, "input");
    assert.equal(await grid.vm.commitEdit(), false);
    await nextTick();
    assert.equal(input.value, draft);
    assert.equal(grid.events.editError.at(-1)[0].stage, expected);
    assert.equal(
      document.querySelector(".hys-ui-pro-grid-feedback").getAttribute("role"),
      "alert",
    );
  }
  assert.equal(await grid.vm.commitEdit(), true);
  await nextTick();
  assert.deepEqual(seen, [120, 52.5, 52.5]);
  assert.equal(saves, 2);
  assert.equal(rows[0].amount, 20);
  assert.equal(grid.events.cellCommit.length, 1);
  assert.deepEqual(grid.events.cellCommit[0][0], {
    row: grid.props.rows[0],
    rowKey: 1,
    columnKey: "amount",
    previousValue: 20,
    editor: "number",
    value: 52.5,
  });
  assert.equal(grid.vm.editing, null);
  assert.equal(document.activeElement, cell);
});

test("ProGrid preserves enum types and runs a custom editor's parser", async () => {
  const grid = await mount(
    ui.HysProGrid,
    {
      rowKey: (row) => row.id,
      rows: [{ id: "x", active: false, name: "before" }],
      columns: [
        {
          key: "active",
          label: "Active",
          editor: {
            type: "select",
            options: [
              { label: "Boolean", value: true },
              { label: "Text", value: "true" },
            ],
          },
        },
        {
          key: "name",
          label: "Name",
          editor: {
            type: "custom",
            toDraft: () => "after",
            parse: (draft) => ({ ok: true, value: { name: draft } }),
          },
        },
      ],
    },
    {
      editor: ({ inputId, draft, setDraft }) =>
        h("input", {
          id: inputId,
          value: draft,
          onInput: (event) => setDraft(event.target.value),
        }),
      cell: ({ value }) => h("em", String(value)),
    },
  );
  await fire(
    grid.find('[data-column-key="active"] .hys-ui-pro-grid-edit'),
    "click",
  );
  const select = grid.find('[role="combobox"][data-pro-grid-input]');
  assert(select.classList.contains("hys-ui-select"));
  assert.equal(grid.find("select"), null);
  await fire(select, "click");
  const option = Array.from(document.querySelectorAll('[role="option"]')).find(
    (element) => element.textContent.includes("Boolean"),
  );
  await fire(option, "click");
  assert.equal(await grid.vm.commitEdit(), true);
  assert.equal(grid.events.cellCommit.at(-1)[0].value, true);
  await fire(
    grid.find('[data-column-key="name"] .hys-ui-pro-grid-edit'),
    "click",
  );
  assert.equal(
    grid.find('[data-column-key="name"] .hys-ui-pro-grid-editor input').value,
    "after",
  );
  assert.equal(await grid.vm.commitEdit(), true);
  assert.deepEqual(grid.events.cellCommit.at(-1)[0].value, { name: "after" });
  assert.equal(grid.find('[data-column-key="name"] em').textContent, "before");
});

test("conditional formatting evaluates only matching columns and uses the first rule", () => {
  const context = {
    column: { key: "amount" },
    row: { amount: 110, limit: 100 },
    value: 110,
  };
  const format = createProGridConditionalFormat(
    [
      {
        columnKey: "project",
        when: () => {
          assert.fail("unrelated rule evaluated");
        },
      },
      {
        columnKey: "amount",
        when: ({ row }) => row.amount > row.limit,
        tone: "danger",
        className: "over-limit",
      },
      { when: ({ value }) => value >= 90, tone: "warning" },
    ],
    ({ column }) => `base-${column.key}`,
  );
  assert.equal(
    format(context),
    "base-amount hys-ui-pro-grid-format-danger over-limit",
  );
  assert.equal(
    format({ ...context, row: { amount: 100, limit: 100 }, value: 100 }),
    "base-amount hys-ui-pro-grid-format-warning",
  );
  assert.equal(
    format({ ...context, row: { amount: 80, limit: 100 }, value: 80 }),
    "base-amount",
  );
  assert.equal(createProGridConditionalFormat([])(context), undefined);
  assert.equal(createProGridConditionalFormat([], "keep")(context), "keep");
});

test("ProGrid keeps the committed format while editing and updates it from saved rows", async () => {
  let saves = 0;
  const cellClassName = createProGridConditionalFormat([
    {
      columnKey: "amount",
      when: ({ row }) => row.amount > row.limit,
      tone: "danger",
    },
    {
      columnKey: "amount",
      when: ({ row }) => row.amount >= row.limit * 0.9,
      tone: "warning",
    },
  ]);
  const grid = await mount(ui.HysProGrid, {
    rows: [{ id: 1, amount: 110, limit: 100 }],
    columns: [
      { key: "amount", label: "Amount", editor: { type: "number" } },
      { key: "limit", label: "Limit" },
    ],
    rowKey: "id",
    gridOptions: { cellClassName },
    saveCell: () => ++saves > 1 || "Offline",
  });
  const amount = grid.find('td[data-column-key="amount"]');
  const limit = grid.find('td[data-column-key="limit"]');
  const danger = "hys-ui-pro-grid-format-danger";
  const warning = "hys-ui-pro-grid-format-warning";
  assert(amount.classList.contains(danger));
  assert(!limit.classList.contains(danger));
  await fire(amount.querySelector(".hys-ui-pro-grid-edit"), "click");
  const input = amount.querySelector(".hys-ui-input[data-pro-grid-input]");
  input.value = "90";
  await fire(input, "input");
  assert(amount.classList.contains(danger));
  assert.equal(await grid.vm.commitEdit(), false);
  assert(amount.classList.contains(danger));
  assert.equal(await grid.vm.commitEdit(), true);
  grid.props.rows = [
    { ...grid.props.rows[0], amount: grid.events.cellCommit.at(-1)[0].value },
  ];
  await nextTick();
  assert(amount.classList.contains(warning));
  assert(!amount.classList.contains(danger));
});

test("ProGrid clipboard selects by keyboard and copies a rectangular TSV range", async () => {
  const clipboard = createProGridClipboard();
  const grid = await mount(ui.HysProGrid, {
    clipboard,
    rowKey: "id",
    rows: [
      { id: 1, name: 'A\t"B"', amount: 2 },
      { id: "1", name: "Line\nbreak", amount: 3 },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "amount", label: "Amount" },
    ],
  });
  const first = grid.find(
    '[data-grid-row="number:1"] td[data-column-key="name"]',
  );
  first.focus();
  await fire(first, "keydown", { key: "ArrowRight", shiftKey: true });
  await fire(first, "keydown", { key: "ArrowDown", shiftKey: true });
  assert.equal(grid.all("[data-hys-pro-grid-range]").length, 4);
  const event = new Event("copy", { bubbles: true, cancelable: true });
  const data = new Map();
  Object.defineProperty(event, "clipboardData", {
    value: { setData: (key, value) => data.set(key, value) },
  });
  first.dispatchEvent(event);
  assert(event.defaultPrevented);
  assert.equal(data.get("text/plain"), '"A\t""B"""\t2\r\n"Line\nbreak"\t3');
  await fire(first, "keydown", { key: "Escape" });
  assert.equal(grid.all("[data-hys-pro-grid-range]").length, 0);
  assert.equal(clipboard.copyText(), undefined);
});

test("ProGrid paste applies typed parsing, permissions and async validation before a batch commit", async () => {
  const saved = [];
  const clipboard = createProGridClipboard({
    saveBatch: async (changes) => saved.push(changes) && true,
  });
  const rows = [
    { id: 1, note: "old", amount: 2 },
    { id: 2, note: "old", amount: 3 },
    { id: 3, note: "locked", amount: 4 },
  ];
  const grid = await mount(ui.HysProGrid, {
    clipboard,
    rowKey: "id",
    rows,
    saveCell: () => assert.fail("batch must use saveBatch"),
    columns: [
      {
        key: "note",
        label: "Note",
        editor: { type: "text", trim: true },
        canEdit: ({ row }) => row.id !== 3,
      },
      {
        key: "amount",
        label: "Amount",
        editor: { type: "number", min: 0 },
        validate: async ({ value }) => value <= 100 || "Over limit",
      },
    ],
  });
  assert(clipboard.selectRange({ rowKey: 1, columnKey: "note" }));
  const rejected = await clipboard.pasteText("first\t20\nsecond\t101");
  assert.equal(rejected.reason, "validate");
  assert.deepEqual(rejected.cell, { rowKey: 2, columnKey: "amount" });
  assert.equal(
    (await clipboard.pasteText("first\t20\nsecond\t30\nlocked\t40")).reason,
    "permission",
  );
  assert.equal((await clipboard.pasteText("first\tno")).reason, "parse");
  assert.equal(
    (await clipboard.pasteText("first\t20\textra")).reason,
    "bounds",
  );
  assert.equal(
    (await clipboard.pasteText("first\t20\nsecond")).reason,
    "shape",
  );
  assert.equal(grid.events.cellsCommit, undefined);
  assert.equal(saved.length, 0);
  const success = await clipboard.pasteText(
    '" first\tpart "\t20\r\nsecond\t30\r\n',
  );
  assert.deepEqual(success, { ok: true, count: 4 });
  assert.deepEqual(
    saved[0].map(({ value }) => value),
    ["first\tpart", 20, "second", 30],
  );
  assert.equal(grid.events.cellsCommit.length, 1);
  assert.equal(grid.events.cellCommit, undefined);
  assert.equal(rows[0].amount, 2);
});

test("ProGrid clipboard reuses single-cell persistence and rejects an unconfigured batch save", async () => {
  const clipboard = createProGridClipboard();
  const attempts = [];
  const grid = await mount(ui.HysProGrid, {
    clipboard,
    rowKey: "id",
    rows: [
      { id: 1, flag: false },
      { id: 2, flag: true },
    ],
    columns: [
      {
        key: "flag",
        label: "Flag",
        editor: {
          type: "select",
          options: [
            { value: true, label: "Enabled" },
            { value: false, label: "Disabled" },
          ],
        },
      },
    ],
    saveCell(change) {
      attempts.push(change);
      return attempts.length === 1 ? "Offline" : true;
    },
  });
  assert(clipboard.selectRange({ rowKey: 1, columnKey: "flag" }));
  assert.equal((await clipboard.pasteText("Enabled\nDisabled")).reason, "save");
  assert.equal(attempts.length, 0);
  const failed = await clipboard.pasteText("Enabled");
  assert.equal(failed.reason, "save");
  assert.equal(failed.message, "Offline");
  assert.equal(grid.events.cellsCommit, undefined);
  assert.deepEqual(await clipboard.pasteText("Enabled"), {
    ok: true,
    count: 1,
  });
  assert.equal(grid.events.cellsCommit[0][0][0].value, true);
});

test("ProGrid clipboard tiles one value and cancels stale work without intercepting in-cell input", async () => {
  let received;
  let finish;
  const clipboard = createProGridClipboard({ maxCells: 2 });
  const grid = await mount(ui.HysProGrid, {
    clipboard,
    rowKey: "id",
    rows: [
      { id: 1, amount: 2 },
      { id: 2, amount: 3 },
    ],
    columns: [
      {
        key: "amount",
        label: "Amount",
        editor: { type: "number" },
        validate: ({ value }, { signal }) => {
          if (value === 15) return true;
          received = signal;
          return new Promise((resolve) => {
            finish = resolve;
          });
        },
      },
    ],
  });
  const anchor = { rowKey: 1, columnKey: "amount" };
  assert(clipboard.selectRange(anchor, { rowKey: 2, columnKey: "amount" }));
  assert.equal((await clipboard.pasteText("1\n2\n3")).reason, "limit");
  assert.deepEqual(await clipboard.pasteText("15"), { ok: true, count: 2 });
  assert.deepEqual(
    grid.events.cellsCommit[0][0].map(({ value }) => value),
    [15, 15],
  );
  const pending = clipboard.pasteText("16");
  await nextTick();
  grid.vm.setQuery({ search: "missing" });
  await nextTick();
  assert(received.aborted);
  assert.equal((await pending).reason, "cancelled");
  finish(true);
  assert.equal(grid.events.cellsCommit.length, 1);
  grid.vm.setQuery({ search: "" });
  await nextTick();
  const first = grid.find(
    '[data-grid-row="number:1"] td[data-column-key="amount"]',
  );
  await fire(first, "keydown", { key: "F2" });
  const input = first.querySelector("input[data-pro-grid-input]");
  const paste = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(paste, "clipboardData", {
    value: { types: ["text/plain"], getData: () => "5" },
  });
  input.dispatchEvent(paste);
  assert(!paste.defaultPrevented);
});

test("Spreadsheet recalculates formulas, adjusts references on insert and undoes whole changes", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        {
          id: "budget",
          name: "Budget",
          rows: [
            [4, 2, "=A1*B1"],
            [5, 0, "=SUM(C1, A2)"],
          ],
        },
      ],
    },
  });
  const cell = (row, column) =>
    grid.find(
      `[data-grid-row="number:${row}"] td[data-column-key="${column}"]`,
    );
  assert.equal(
    cell(0, 2).querySelector(".hys-ui-spreadsheet-number").textContent,
    "8",
  );
  assert.equal(
    cell(1, 2).querySelector(".hys-ui-spreadsheet-number").textContent,
    "13",
  );
  assert.equal(grid.all(".hys-ui-pro-grid-edit").length, 0);
  cell(0, 0).focus();
  await fire(cell(0, 0), "keydown", { key: "9" });
  const input = cell(0, 0).querySelector("[data-pro-grid-input]");
  assert.equal(input.value, "9");
  await fire(input, "keydown", { key: "Enter" });
  await nextTick();
  assert.equal(
    cell(0, 2).querySelector(".hys-ui-spreadsheet-number").textContent,
    "18",
  );
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], 9);
  await openSpreadsheetOperation(grid, "行列与冻结");
  const insert = spreadsheetOperationButton("插入行");
  await fire(insert, "click");
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[1][2], "=A2*B2");
  assert.equal(grid.vm.undo(), true);
  await nextTick();
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], 9);
  assert.equal(grid.vm.undo(), true);
  await nextTick();
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], 4);
  assert.equal(grid.vm.redo(), true);
  await nextTick();
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], 9);
});

test("Spreadsheet hides editor actions by default, commits on blur and supports opt-in buttons", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [{ id: "sheet", name: "Sheet", rows: [[1, 2]] }],
    },
  });
  const first = grid.find('td[data-column-key="0"]');
  const second = grid.find('td[data-column-key="1"]');
  first.focus();
  await fire(first, "keydown", { key: "9" });
  assert.equal(grid.find(".hys-ui-pro-grid-editor-actions"), null);
  second.focus();
  await nextTick();
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], 9);
  assert.equal(document.activeElement, second);
  await fire(second, "keydown", { key: "7" });
  await fire(second.querySelector("[data-pro-grid-input]"), "keydown", {
    key: "Escape",
  });
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][1], 2);
  grid.props.showEditActions = true;
  await nextTick();
  await fire(second, "keydown", { key: "8" });
  const actions = second.querySelector(".hys-ui-pro-grid-editor-actions");
  assert.equal(actions.querySelectorAll("button").length, 2);
  await fire(actions.querySelector('button[aria-label="保存"]'), "click");
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][1], 8);
});

test("Spreadsheet leaves an unchanged dropdown edit without saving or stealing focus", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: { sheets: [{
    id: "s", name: "Choices", rows: [["投影", "会议室", false, 5]],
    cells: {
      A1: { type: "multiple", options: ["投影", "白板", "麦克风"] },
      B1: { type: "select", options: ["会议室", "报告厅"] },
      C1: { type: "boolean" },
    },
  }] } });
  const cell = (column) => grid.find(`td[data-column-key="${column}"]`);
  const editor = () => grid.find(".hys-ui-pro-grid-editor");
  const openEditor = async (column) => {
    cell(column).focus();
    await fire(cell(column), "keydown", { key: "F2" });
    const trigger = editor().querySelector('[role="combobox"]');
    assert.equal(document.activeElement, trigger);
    return trigger;
  };

  await openEditor(0);
  cell(3).focus();
  await nextTick();
  assert.equal(editor(), null);
  assert.equal(document.activeElement, cell(3));

  const single = await openEditor(1);
  await fire(single, "click");
  assert.equal(single.getAttribute("aria-expanded"), "true");
  await fire(cell(3), "pointerdown");
  assert.equal(editor(), null);

  await openEditor(2);
  cell(3).focus();
  await nextTick();
  assert.equal(editor(), null);
  assert.deepEqual(grid.vm.getWorkbook().sheets[0].rows[0], ["投影", "会议室", false, 5]);
  assert.equal(grid.events.change, undefined);
  assert.equal(grid.vm.undo(), false);

  const multiple = await openEditor(0);
  await fire(multiple, "click");
  const apply = () => [...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "应用多选");
  const footer = apply();
  await fire(footer, "pointerdown");
  footer.focus();
  await nextTick();
  assert(editor());
  await fire(footer, "click");
  assert.equal(editor(), null);
  assert.equal(grid.events.change, undefined);

  await fire(await openEditor(0), "click");
  const option = document.querySelector('[role="option"][aria-label="白板"]');
  await fire(option, "pointerdown");
  option.focus();
  await nextTick();
  assert(editor());
  await fire(option, "click");
  await fire(apply(), "click");
  assert.equal(editor(), null);
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], "投影\n白板");
});

test("Spreadsheet autocomplete releases the edit session on outside interaction and keeps suggestion selection available", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: { sheets: [{
    id: "s", name: "Contacts", rows: [["陈晨", "林宁"]],
    cells: {
      A1: { type: "autocomplete", options: ["陈晨", "陈雨"] },
      B1: { type: "autocomplete", options: ["林宁", "林晨"] },
    },
  }] } });
  const cell = (column) => grid.find(`td[data-column-key="${column}"]`);
  const editor = () => grid.find(".hys-ui-pro-grid-editor");
  const values = () => grid.vm.getWorkbook().sheets[0].rows[0];
  const open = async (column) => {
    cell(column).focus();
    await fire(cell(column), "keydown", { key: "F2" });
    const input = editor().querySelector('input[role="combobox"]');
    assert.equal(document.activeElement, input);
    return input;
  };

  await open(1);
  await fire(cell(0), "pointerdown");
  cell(0).focus();
  await nextTick();
  assert.equal(editor(), null);
  assert.equal(document.activeElement, cell(0));
  assert.equal(grid.vm.undo(), false);

  let input = await open(1);
  input.value = "林";
  await fire(input, "input");
  assert(input.getAttribute("aria-controls"));
  await fire(input, "keydown", { key: "Escape" });
  assert.equal(editor(), null);
  assert.deepEqual(values(), ["陈晨", "林宁"]);
  assert.equal(grid.vm.undo(), false);

  input = await open(1);
  input.value = "新联系人";
  await fire(input, "input");
  cell(0).focus();
  await nextTick();
  assert.equal(editor(), null);
  assert.equal(document.activeElement, cell(0));
  assert.deepEqual(values(), ["陈晨", "新联系人"]);

  input = await open(0);
  input.value = "陈";
  await fire(input, "input");
  const option = [...document.querySelectorAll('.hys-ui-autocomplete-popup [role="option"]')]
    .find((item) => item.textContent.trim() === "陈雨");
  await fire(option, "pointerdown");
  assert(editor());
  await fire(option, "click");
  await nextTick();
  assert.equal(editor(), null);
  assert.deepEqual(values(), ["陈雨", "新联系人"]);
});

test("Spreadsheet date editors open the calendar and leave without committing untouched values", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: { sheets: [{
    id: "s", name: "Dates", rows: [["2026-11-20", "2026-11-19T16:00", 5]],
    formats: { A1: { number: "date" } },
    cells: { B1: { type: "datetime-local" } },
  }] } });
  const cell = (column) => grid.find(`td[data-column-key="${column}"]`);
  const editor = () => grid.find(".hys-ui-pro-grid-editor");
  const calendar = () => document.querySelector(".hys-ui-date-popup");
  const value = () => grid.vm.getWorkbook().sheets[0].rows[0];
  const openDate = async (column) => {
    cell(column).focus();
    await fire(cell(column), "keydown", { key: "F2" });
    await nextTick();
    const trigger = editor().querySelector('button[role="combobox"]');
    assert.equal(document.activeElement, trigger);
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert(calendar());
    return trigger;
  };
  await openDate(0);
  await fire(cell(2), "pointerdown");
  cell(2).focus();
  await nextTick();
  assert.equal(editor(), null);
  assert.equal(document.activeElement, cell(2));

  await openDate(1);
  await fire(document.activeElement, "keydown", { key: "Escape" });
  await nextTick();
  assert.equal(editor(), null);
  assert.deepEqual(value(), ["2026-11-20", "2026-11-19T16:00", 5]);
  assert.equal(grid.events.change, undefined);
  assert.equal(grid.vm.undo(), false);

  await openDate(0);
  const nextDay = calendar().querySelector('[aria-label="2026-11-21"]');
  await fire(nextDay, "pointerdown");
  nextDay.focus();
  assert(editor());
  await fire(nextDay, "click");
  await pause(0);
  assert.equal(editor(), null);
  assert.equal(value()[0], "2026-11-21");
});

async function openSpreadsheetOperation(grid, label) {
  await fire(grid.find('button[aria-label="更多操作"]'), "click");
  await nextTick();
  await fire(document.querySelector(`button[aria-label="${label}"]`), "click");
  await nextTick();
}

function spreadsheetOperationButton(label) {
  return [...document.querySelectorAll('.hys-ui-spreadsheet-toolbar-panel:not([style*="display: none"]) button')].find(
    (button) => button.textContent.trim() === label,
  );
}

test("Spreadsheet hides the tooltip when an operation opens a modeless search window", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "s", name: "Sheet", rows: [["Alpha", "Beta"]] }] },
  });
  const button = grid.find('button[aria-label="更多操作"]');
  assert.equal(button.hasAttribute("title"), false);
  button.parentElement.dispatchEvent(new MouseEvent("pointerenter"));
  await pause(750);
  const tooltip = () => [...document.querySelectorAll('[role="tooltip"]')].find(
    (element) => element.textContent.trim() === "更多操作" && element.style.display !== "none",
  );
  assert(tooltip());
  await openSpreadsheetOperation(grid, "查找与替换");
  const dialog = document.querySelector('.hys-ui-modal[role="dialog"]');
  assert(dialog.closest(".hys-ui-modal-penetrable"));
  assert.equal(dialog.hasAttribute("aria-modal"), false);
  const advanced = [...dialog.querySelectorAll("button")].find(
    (element) => element.textContent.trim() === "高级选项",
  );
  assert.equal(advanced.getAttribute("aria-expanded"), "true");
  await fire(advanced, "click");
  assert.equal(advanced.getAttribute("aria-expanded"), "false");
  assert.equal(document.body.style.overflow, "");
  assert.equal(tooltip(), undefined);
  const cell = grid.find('td[data-column-key="1"]');
  cell.focus();
  assert.equal(document.activeElement, cell);
  assert.equal(grid.vm.getSelection().anchor, "B1");
  assert.notEqual(dialog.closest(".hys-ui-modal-overlay").style.display, "none");
  const close = dialog.querySelector('button[aria-label="关闭"]');
  close.focus();
  await fire(close, "click");
  await pause(750);
  assert.equal(document.activeElement, button);
  assert.equal(tooltip(), undefined);
  button.parentElement.dispatchEvent(new MouseEvent("pointerenter"));
  await pause(725);
  assert.equal(tooltip(), undefined);
  button.parentElement.dispatchEvent(new MouseEvent("pointerleave", { clientX: 60 }));
  button.parentElement.dispatchEvent(new MouseEvent("pointerenter", { clientX: 10 }));
  await pause(750);
  assert(tooltip());
});

test("Spreadsheet footer slider keeps 10% stops, applies 300% and resets to 100%", async () => {
  const grid = await mount(ui.HysSpreadsheet);
  const footer = grid.find(".hys-ui-spreadsheet-footer");
  const slider = footer.querySelector('[role="slider"]');
  const reset = footer.querySelector('button[aria-label="重置缩放至 100%"]');
  assert.equal(slider.getAttribute("aria-valuemax"), "300");
  assert.equal(footer.querySelectorAll(".hys-ui-slider-stop").length, 23);
  assert.equal(footer.querySelector(".hys-ui-slider-value"), null);
  await fire(slider, "keydown", { key: "End" });
  await nextTick();
  assert.equal(slider.getAttribute("aria-valuenow"), "300");
  assert.equal(reset.textContent.trim(), "300%");
  await fire(reset, "click");
  assert.equal(slider.getAttribute("aria-valuenow"), "100");
  assert.equal(reset.textContent.trim(), "100%");
});

test("Spreadsheet tabs identify protection and offer new sheets on editable workbooks", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        { id: "locked", name: "汇总", protected: true, rows: [[1]] },
        { id: "open", name: "库存", rows: [[2]] },
      ],
    },
  });
  const tabs = () => grid.all('[role="tab"]');
  const lock = '[role="img"][aria-label="工作表受保护"]';
  assert(tabs()[0].querySelector(lock));
  assert.equal(tabs()[1].querySelector(lock), null);
  const add = () => grid.find('button[aria-label="新建工作表"]');
  assert(!add().disabled);
  await fire(add(), "click");
  assert.equal(tabs().length, 3);
  assert.equal(tabs()[2].getAttribute("aria-selected"), "true");
  assert.equal(grid.vm.getWorkbook().sheets[2].rows[0][0] ?? null, null);
  assert(grid.vm.manageSheet({ type: "protect", id: "locked", protected: false }));
  await nextTick();
  assert.equal(tabs()[0].querySelector(lock), null);
  grid.props.readonly = true;
  await nextTick();
  assert.equal(add(), null);
});

test("Spreadsheet tab reordering writes the full order, including hidden sheets, in one undo step", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        { id: "main", name: "Main", rows: [[1]] },
        { id: "hidden", name: "Hidden", hidden: true, rows: [[2]] },
        { id: "report", name: "Report", protected: true, rows: [[3]] },
      ],
    },
  });
  const order = () => grid.vm.getWorkbook().sheets.map(({ id }) => id);
  const [main, report] = grid.all('[role="tab"]');
  const mainItem = main.closest(".hys-ui-tab-item");
  Object.defineProperties(mainItem, {
    offsetWidth: { value: 64 },
    offsetHeight: { value: 32 },
    offsetLeft: { get: () => (order()[0] === "main" ? 1 : 84) },
  });
  // During the move animation the tab still reports its old visual position.
  mainItem.getBoundingClientRect = () => ({ left: 1, top: 0, width: 64, height: 32 });
  report.focus();
  await fire(report, "keydown", { key: "ArrowLeft", altKey: true, shiftKey: true });
  await nextTick();
  assert.deepEqual(order(), ["report", "main", "hidden"]);
  assert.equal(grid.find('[role="tab"][aria-selected="true"]').textContent.trim(), "Main");
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await nextTick();
  assert.equal(grid.find(".hys-tabs-indicator").style.transform, "translateX(84px)");
  assert.equal(grid.events.change.length, 1);
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual(order(), ["main", "hidden", "report"]);
  assert.equal(grid.vm.undo(), false);
});

test("Spreadsheet tab context commands target the clicked sheet and protect the last visible sheet", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        { id: "main", name: "Main", rows: [["='Report'!A1"]] },
        { id: "report", name: "Report", rows: [[1]] },
      ],
    },
  });
  const tabs = () => grid.all('[role="tab"]');
  async function open(tab) {
    tab.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true, cancelable: true, clientX: 120, clientY: 120,
    }));
    await pause(25);
  }
  const item = (label) => [...document.querySelectorAll('[role="menuitem"]')]
    .find((entry) => entry.textContent.trim() === label);
  await open(tabs()[1]);
  assert.equal(tabs()[0].getAttribute("aria-selected"), "true");
  await fire(item("重命名"), "click");
  await pause(25);
  const dialog = document.querySelector('[role="dialog"][aria-label="重命名工作表"]')
    ?? document.querySelector('[role="dialog"]');
  const name = dialog.querySelector('input[aria-label="工作表名称"]');
  name.value = "Totals";
  await fire(name, "input");
  await fire(dialog.querySelector("[data-hys-modal-confirm]"), "click");
  await pause(25);
  assert.equal(grid.vm.getWorkbook().sheets[1].name, "Totals");
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], "='Totals'!A1");
  assert.equal(tabs()[0].getAttribute("aria-selected"), "true");
  await open(tabs()[1]);
  await fire(item("隐藏工作表"), "click");
  await pause(25);
  assert.equal(tabs().length, 1);
  await open(tabs()[0]);
  assert.equal(item("隐藏工作表").getAttribute("aria-disabled"), "true");
  assert.equal(item("删除工作表").getAttribute("aria-disabled"), "true");
});

test("Spreadsheet sheet management confirms deletion and keeps the last visible sheet", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [
      { id: "budget", name: "Budget", rows: [[1]] },
      { id: "actual", name: "Actual", rows: [[2]] },
    ] },
  });
  const ids = () => grid.vm.getWorkbook().sheets.map(({ id }) => id);
  await fire(grid.find('button[aria-label="工作表管理"]'), "click");
  const panel = document.querySelector('[role="region"][aria-label="工作表管理"]');
  const remove = [...panel.querySelectorAll("button")].find((button) => button.textContent.trim() === "删除工作表");
  const dialog = () => document.querySelector('[role="dialog"][aria-label="删除工作表"]');
  await fire(remove, "click");
  await pause(25);
  assert.match(dialog().textContent, /Budget/);
  assert.deepEqual(ids(), ["budget", "actual"]);
  await fire(dialog().querySelector("[data-hys-modal-cancel]"), "click");
  await pause(25);
  assert.deepEqual(ids(), ["budget", "actual"]);
  await fire(remove, "click");
  await pause(25);
  await fire(dialog().querySelector("[data-hys-modal-confirm]"), "click");
  await pause(25);
  assert.deepEqual(ids(), ["actual"]);
  assert.equal(remove.disabled, true);
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual(ids(), ["budget", "actual"]);
});

test("Spreadsheet header drag commits the inserted column position to the workbook in one undo step", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        {
          id: "source",
          name: "来源",
          rows: [[1, 2, 3, "=A1*10+B1"]],
          columnOptions: { 0: { label: "单价", size: 180 } },
          formats: { A1: { bold: true } },
        },
        { id: "report", name: "汇总", rows: [["='来源'!$A$1", "=SUM('来源'!$A$1:$C$1)"]] },
      ],
    },
  });
  const header = (key) => grid.find(`thead th[data-column-key="${key}"]`);
  const headerOrder = () => grid.all("thead th[data-column-key]").map((cell) => cell.dataset.columnKey);
  const firstRow = () => grid.all("tbody tr[data-grid-row] td[data-column-key]").map((cell) => cell.textContent.trim());
  header(1).dispatchEvent(new MouseEvent("contextmenu", {
    bubbles: true, cancelable: true, button: 2, clientX: 30, clientY: 30,
  }));
  await pause(30);
  await fire([...document.querySelectorAll('[role="menuitem"]')]
    .find((item) => item.textContent.trim() === "隐藏此列"), "click");
  assert.deepEqual(headerOrder(), ["0", "2", "3"]);
  await fire(grid.find('[aria-label="取消隐藏列 B"]'), "click");
  assert.deepEqual(headerOrder(), ["0", "1", "2", "3"]);
  assert.deepEqual(firstRow(), ["1", "2", "3", "12"]);
  const payload = new Map();
  const transfer = {
    setData: (type, value) => payload.set(type, value),
    getData: (type) => payload.get(type) ?? "",
  };
  async function drag(type, element, clientX) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX });
    Object.defineProperty(event, "dataTransfer", { value: transfer });
    element.dispatchEvent(event);
    await nextTick();
  }
  header(2).getBoundingClientRect = () => ({ left: 200, width: 100 });
  await drag("dragstart", header(0), 50);
  await drag("dragover", header(2), 280);
  assert(!header(2).classList.contains("hys-ui-spreadsheet-column-drop-after"));
  await drag("dragstart", header(0).querySelector('[draggable="true"]'), 50);
  await drag("dragover", header(2), 280);
  assert(header(2).classList.contains("hys-ui-spreadsheet-column-drop-after"));
  await drag("drop", header(2), 280);
  const [source, report] = grid.vm.getWorkbook().sheets;
  assert.deepEqual(source.rows[0], [2, 3, 1, "=C1*10+A1"]);
  assert.deepEqual(source.formats.C1, { bold: true });
  assert.deepEqual(source.columnOptions[2], { label: "单价", size: 180 });
  assert.deepEqual(report.rows[0], ["='来源'!$C$1", "=SUM('来源'!$A$1:$C$1)"]);
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual(grid.vm.getWorkbook().sheets[0].rows[0], [1, 2, 3, "=A1*10+B1"]);
  assert.deepEqual(headerOrder(), ["0", "1", "2", "3"]);
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual(headerOrder(), ["0", "2", "3"]);
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual(headerOrder(), ["0", "1", "2", "3"]);
});

test("Spreadsheet column resize previews the width, commits it once, and restores it on undo", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        { id: "main", name: "Main", rows: [[1, 2]], columnOptions: { 0: { size: 140 } } },
        { id: "other", name: "Other", rows: [[3]] },
      ],
    },
  });
  const handle = () => grid.find('[aria-label="调整A列宽"]');
  const savedWidth = () => grid.vm.getWorkbook().sheets[0].columnOptions[0].size;
  const pointer = (target, type, clientX) => {
    const event = new MouseEvent(type, { clientX, button: 0, bubbles: true, cancelable: true });
    Object.defineProperty(event, "pointerId", { value: 1 });
    target.dispatchEvent(event);
  };
  pointer(handle(), "pointerdown", 100);
  pointer(window, "pointermove", 135);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await nextTick();
  assert.equal(handle().getAttribute("aria-valuenow"), "175");
  assert.equal(savedWidth(), 140);
  pointer(window, "pointerup", 135);
  await nextTick();
  assert.equal(savedWidth(), 175);
  assert.equal(grid.events.change.length, 1);
  assert(grid.vm.undo());
  await nextTick();
  assert.equal(savedWidth(), 140);
  assert.equal(handle().getAttribute("aria-valuenow"), "140");
  assert(grid.vm.redo());
  await nextTick();
  assert.equal(handle().getAttribute("aria-valuenow"), "175");
  pointer(handle(), "pointerdown", 100);
  pointer(window, "pointermove", 160);
  assert(grid.vm.setSheet("other"));
  await nextTick();
  pointer(window, "pointerup", 160);
  await nextTick();
  assert.equal(savedWidth(), 175);
  assert.equal(handle().getAttribute("aria-valuenow"), "124");
});

test("Spreadsheet fullscreen releases the regular grid height limit and restores it on exit", async () => {
  const grid = await mount(ui.HysSpreadsheet, { maxHeight: 280 });
  const scroll = grid.find(".hys-ui-pf-grid-scroll");
  const footer = grid.find(".hys-ui-spreadsheet-footer");
  const button = grid.find('button[aria-label="全屏"]');
  assert.equal(scroll.style.maxHeight, "280px");
  await fire(button, "click");
  assert(grid.find(".hys-ui-spreadsheet-fullscreen"));
  assert.equal(scroll.style.maxHeight, "");
  assert.equal(grid.find(".hys-ui-spreadsheet-footer"), footer);
  await fire(button, "keydown", { key: "Escape" });
  assert.equal(grid.find(".hys-ui-spreadsheet-fullscreen"), null);
  assert.equal(scroll.style.maxHeight, "280px");
});

test("Spreadsheet reverses the default sheet slide and changes effects from the toolbar", async () => {
  const originalAnimation = HTMLElement.prototype.animate;
  const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
  const played = [];
  HTMLElement.prototype.animate = function (frames) {
    const animation = { cancel() { this.cancelled = true; } };
    played.push({ element: this, frames, animation });
    return animation;
  };
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() { return 120; },
  });
  let grid;
  try {
    grid = await mount(ui.HysSpreadsheet, {
      defaultWorkbook: { sheets: [
        { id: "first", name: "First", rows: [["A"]] },
        { id: "second", name: "Second", rows: [["B"]] },
      ] },
    }, {}, true, "full");
    const surface = grid.find(".hys-ui-spreadsheet-grid");
    const snapshot = () => surface.querySelector(":scope > .hys-ui-spreadsheet-outgoing-sheet");
    const entry = () => played.findLast(({ element }) => element.classList.contains("hys-ui-pro-grid"));
    async function switchTo(id) {
      assert(grid.vm.setSheet(id));
      await nextTick();
      await nextTick();
    }
    await switchTo("second");
    assert.equal(surface.dataset.sheetTransition, "slide");
    assert.equal(entry().frames[0].transform, "translateX(32px)");
    const firstEntry = entry();
    const firstSnapshot = snapshot();
    assert(firstSnapshot.hasAttribute("inert"));
    assert.equal(firstSnapshot.getAttribute("aria-hidden"), "true");

    await switchTo("first");
    assert(firstEntry.animation.cancelled);
    assert(!firstSnapshot.isConnected);
    assert.equal(entry().frames[0].transform, "translateX(-32px)");
    entry().animation.onfinish();
    assert.equal(snapshot(), null);

    await openSpreadsheetOperation(grid, "工作表切换动效");
    const panel = document.querySelector('[role="region"][aria-label="工作表切换动效"]');
    function choose(label) {
      const option = [...panel.querySelectorAll("label")].find((node) => node.textContent.trim() === label);
      option.querySelector("input").click();
    }
    choose("纵向揭示");
    await nextTick();
    await switchTo("second");
    assert.equal(surface.dataset.sheetTransition, "wipe");
    assert.equal(entry().frames[0].clipPath, "inset(0 0 100% 0)");
    choose("无动画");
    await nextTick();
    assert.equal(snapshot(), null);
    const latestEntry = entry();
    await switchTo("first");
    assert.equal(entry(), latestEntry);
    assert.equal(surface.dataset.sheetTransition, undefined);
  } finally {
    grid?.unmount();
    if (originalAnimation) HTMLElement.prototype.animate = originalAnimation;
    else delete HTMLElement.prototype.animate;
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", offsetHeight);
  }
});

test("Spreadsheet toolbar expands on demand and keeps overflow accessible", async () => {
  let onResize;
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; }
    observe(element) {
      if (element.matches(".hys-ui-spreadsheet-toolbar .toolbar-row")) onResize = this.callback;
    }
    disconnect() {}
  };
  try {
    const grid = await mount(ui.HysSpreadsheet);
    const row = grid.find(".hys-ui-spreadsheet-toolbar .toolbar-row");
    const tool = (id) => row.querySelector(`[data-toolbar-tool="${id}"]`);
    const more = () => row.querySelector(".toolbar-more");
    const toggle = (label) => grid.find(`button[aria-label="${label}工具栏"]`);
    async function setWidth(width) {
      row.style.width = `${width}px`;
      onResize();
      await nextTick();
    }
    await setWidth(28);
    assert.equal(tool("workbook"), null);
    await openSpreadsheetOperation(grid, "工作表管理");
    assert(document.querySelector('[role="region"][aria-label="工作表管理"]'));
    await setWidth(280);
    assert.equal(toggle("展开").getAttribute("aria-expanded"), "false");
    assert(!row.classList.contains("toolbar-row-expanded"));
    assert(tool("undo"));
    assert.equal(tool("italic"), null);
    assert.equal(tool("comments"), null);
    assert.equal(tool("wrap"), null);
    assert.equal(tool("sheet-transition"), null);
    const compactCount = row.querySelectorAll("[data-toolbar-tool]").length;
    await fire(toggle("展开"), "click");
    assert.equal(toggle("收起").getAttribute("aria-expanded"), "true");
    assert(row.classList.contains("toolbar-row-expanded"));
    assert(row.querySelectorAll("[data-toolbar-tool]").length > compactCount);
    await fire(toggle("收起"), "click");
    assert.equal(row.querySelectorAll("[data-toolbar-tool]").length, compactCount);
    await setWidth(1800);
    assert(tool("workbook"));
    assert(tool("history"));
    assert.deepEqual(
      [...row.querySelectorAll("[data-toolbar-tool]")].slice(-4).map((button) => button.dataset.toolbarTool),
      ["comments", "wrap", "history", "sheet-transition"],
    );
    assert.equal(more().style.display, "none");
    assert.equal(toggle("展开"), null);
    grid.unmount();
  } finally {
    globalThis.ResizeObserver = original;
  }
});

test("Spreadsheet toolbar formats the selection from the overflow controls and supports undo", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "s", name: "Sheet", rows: [["First", "Second"]] }] },
  });
  grid.find('td[data-column-key="0"]').focus();
  await openSpreadsheetOperation(grid, "斜体");
  await openSpreadsheetOperation(grid, "水平居中");
  await openSpreadsheetOperation(grid, "字号");
  const panel = document.querySelector('[role="region"][aria-label="字号"]');
  const size = panel.querySelector('input[aria-label="字号"]');
  assert.equal(size.value, "13");
  size.value = "22";
  await fire(size, "input");
  await fire(size, "keydown", { key: "Enter" });
  const formats = () => grid.vm.getWorkbook().sheets[0].formats;
  assert.deepEqual(formats().A1, { italic: true, align: "center", fontSize: 22 });
  assert.equal(formats().B1, undefined);
  assert(grid.vm.undo());
  await nextTick();
  assert.equal(formats().A1.fontSize, undefined);
  await fire(document.querySelector('[aria-label="字号"][role="region"] button[aria-label="收起面板"]'), "click");
  grid.find('td[data-column-key="0"]').focus();
  await nextTick();
  await openSpreadsheetOperation(grid, "自动换行");
  assert.equal(formats().A1.overflow, "wrap");
  await openSpreadsheetOperation(grid, "自动换行");
  assert.equal(formats().A1.overflow, undefined);
  assert.equal(grid.find('button[aria-label="版本记录"]'), null);
  await openSpreadsheetOperation(grid, "版本记录");
  assert(document.querySelector('[role="region"][aria-label="版本记录"]'));
});

test("Spreadsheet applies toolbar colors to every selected cell without confirmation", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "s", name: "Sheet", rows: [["A", "B", "C"]] }] },
  });
  const first = grid.find('td[data-column-key="0"]');
  first.focus();
  await fire(first, "keydown", { key: "ArrowRight", shiftKey: true });
  for (const [label, color, property] of [["字体颜色", "#ef4444", "color"], ["填充颜色", "#22a06b", "backgroundColor"]]) {
    await fire(grid.find(`button[aria-label="${label}"]`), "click");
    const panel = document.querySelector(`[role="region"][aria-label="${label}"]`);
    await fire(panel.querySelector(`button[aria-label="${color}"]`), "click");
    assert.equal(panel.querySelector(".hys-ui-color-panel footer"), null);
    for (const address of ["A1", "B1"])
      assert.equal(grid.vm.getWorkbook().sheets[0].formats[address][property], color);
    await fire(panel.querySelector('button[aria-label="收起面板"]'), "click");
  }
  const formats = grid.vm.getWorkbook().sheets[0].formats;
  assert.deepEqual(formats.A1, { color: "#ef4444", backgroundColor: "#22a06b" });
  assert.deepEqual(formats.B1, formats.A1);
  assert.equal(formats.C1, undefined);
  await fire(grid.find('button[aria-label="填充颜色"]'), "click");
  await fire(spreadsheetOperationButton("无填充色"), "click");
  const updated = grid.vm.getWorkbook().sheets[0].formats;
  for (const address of ["A1", "B1"]) {
    assert.equal(updated[address].backgroundColor, undefined);
    assert.equal(updated[address].color, "#ef4444");
  }
  assert(grid.vm.undo());
  await nextTick();
  assert.equal(grid.vm.getWorkbook().sheets[0].formats.A1.backgroundColor, "#22a06b");
});

test("Spreadsheet axis and data panels keep common actions visible and secondary actions available", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{
      id: "s", name: "Sheet",
      rows: [["名称", "金额", "状态"], ["甲", 150, "待确认"], ["乙", 50, "完成"]],
    }] },
  });
  const workbookSheet = () => grid.vm.getWorkbook().sheets[0];
  const panel = (name) => document.querySelector(`.hys-ui-spreadsheet-toolbar-panel[aria-label="${name}"]`);
  assert(grid.vm.selectRange("B2"));
  await openSpreadsheetOperation(grid, "行列与冻结");
  assert(spreadsheetOperationButton("插入行"));
  await fire(spreadsheetOperationButton("冻结首行"), "click");
  assert.equal(workbookSheet().frozenRows, 1);
  assert.equal(spreadsheetOperationButton("应用尺寸"), undefined);
  const dimensions = spreadsheetOperationButton("尺寸与标题");
  assert.equal(dimensions.getAttribute("aria-expanded"), "false");
  await fire(dimensions, "click");
  assert.equal(dimensions.getAttribute("aria-expanded"), "true");
  assert(grid.vm.selectRange("B2"));
  await nextTick();
  await fire(spreadsheetOperationButton("应用尺寸"), "click");
  assert.equal(workbookSheet().columnOptions[1].size, 124);
  await fire(panel("行列与冻结").querySelector('[aria-label="收起面板"]'), "click");

  assert(grid.vm.selectRange("C2"));
  await openSpreadsheetOperation(grid, "数据与筛选");
  const filter = panel("数据与筛选").querySelector('input[aria-label="筛选文本"]');
  filter.value = "待确认";
  await fire(filter, "input");
  await fire(spreadsheetOperationButton("筛选选中列"), "click");
  assert.deepEqual(workbookSheet().filters, [{ column: 2, operator: "contains", value: "待确认" }]);
  assert.equal(grid.all("tbody tr[data-grid-row]").length, 2);
  await fire(spreadsheetOperationButton("清除筛选"), "click");
  assert.equal(grid.all("tbody tr[data-grid-row]").length, 3);
  const groups = spreadsheetOperationButton("去重与分组");
  assert.equal(groups.getAttribute("aria-expanded"), "false");
  assert.equal(spreadsheetOperationButton("按选中列分组"), undefined);
  await fire(groups, "click");
  assert.equal(groups.getAttribute("aria-expanded"), "true");
  assert(grid.vm.selectRange("C2"));
  await nextTick();
  await fire(spreadsheetOperationButton("按选中列分组"), "click");
  assert.equal(workbookSheet().groupColumn, 2);
});

test("Spreadsheet format panel applies styles and conditional rules from separate sections", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "s", name: "Sheet", rows: [[50], [150]] }] },
  });
  assert(grid.vm.selectRange("A1", "A2"));
  await openSpreadsheetOperation(grid, "样式与条件格式");
  const panel = document.querySelector('[role="region"][aria-label="样式与条件格式"]');
  const command = (label) => [...panel.querySelectorAll("button")]
    .find((button) => button.textContent.trim() === label || button.getAttribute("aria-label") === label);
  const current = () => grid.vm.getWorkbook().sheets[0];
  await fire(command("斜体"), "click");
  assert.equal(command("斜体").getAttribute("aria-pressed"), "true");
  assert.equal(current().formats.A2.italic, true);
  assert.equal(command("条件格式").getAttribute("aria-expanded"), "false");
  await fire(command("条件格式"), "click");
  await nextTick();
  assert.equal(command("条件格式").getAttribute("aria-expanded"), "true");
  const threshold = panel.querySelector('input[aria-label="高亮阈值"]');
  threshold.value = "x";
  await fire(threshold, "input");
  assert.equal(command("高亮较大值").disabled, true);
  threshold.value = "100";
  await fire(threshold, "input");
  await fire(command("高亮较大值"), "click");
  assert.equal(current().conditionalFormats[0].value, 100);
  assert.equal(current().conditionalFormats[0].range, "A1:A2");
  await fire(command("清除条件格式"), "click");
  assert.equal(current().conditionalFormats.length, 0);
});

test("Spreadsheet advanced search and replacement share matching, range and ordering options", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "s", name: "Sheet", rows: [
      ["Task1", "task2", "Task*"], ["Task13", "Task\n", "Task3"], ["=A1", "=1+1", "Task4"],
    ], cells: { C3: { locked: true } } }] },
  });
  const { find, replace } = grid.vm;
  assert.deepEqual(find("Task1", { wholeCell: true, matchCase: true }), ["A1", "A3"]);
  assert.deepEqual(find("task2", { matchCase: true }), ["B1"]);
  assert.deepEqual(find("Task", { wholeCell: true }), []);
  assert.deepEqual(find("Task?", { wildcards: true, matchCase: true, wholeCell: true, ranges: ["A1:C2", "C2"], order: "column" }), ["A1", "B2", "C1", "C2"]);
  assert.deepEqual(find("Task~*", { wildcards: true }), ["C1"]);
  assert.deepEqual(find("=A1", { formulas: true, wholeCell: true }), ["A3"]);
  assert.deepEqual(find("Task", { ranges: ["A1:B2:extra"] }), []);
  assert.equal(replace("Task?", "Changed", { wildcards: true, wholeCell: true }), false);
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], "Task1");
  assert(replace("Task?", "Done", { wildcards: true, matchCase: true, wholeCell: true, ranges: ["A1:B1", "C2"] }));
  assert.deepEqual(grid.vm.getWorkbook().sheets[0].rows, [
    ["Done", "task2", "Task*"], ["Task13", "Task\n", "Done"], ["=A1", "=1+1", "Task4"],
  ]);
  assert(grid.vm.undo());
  assert(replace("A1", "A2", { formulas: true, ranges: ["A3"] }));
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[2][0], "=A2");
});

test("Spreadsheet dragging a selected row number moves only that row", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "s", name: "Sheet", rows: [["A", 1], ["B", 2], ["C", 3], ["D", 4]] }] },
  });
  const row = (index) => grid.find(`[data-sheet-row="${index}"]`);
  const button = (index) => row(index).querySelector(".hys-ui-spreadsheet-row-select");
  const values = () => grid.vm.getWorkbook().sheets[0].rows.map(([value]) => value);
  const preview = () => grid.find(".hys-ui-spreadsheet-row-drop");
  const scroller = grid.find(".hys-ui-pf-grid-scroll");
  Object.defineProperty(scroller, "clientWidth", { value: 380 });
  scroller.scrollLeft = 20;
  const original = document.elementFromPoint;
  document.elementFromPoint = (_, y) => button(Math.floor(y / 30));
  for (let index = 0; index < 4; index++)
    row(index).closest("tr").getBoundingClientRect = () => ({ top: index * 30, height: 30 });
  async function pointer(index, type, y, buttons, shiftKey = false) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientY: y, buttons, shiftKey });
    Object.defineProperty(event, "pointerId", { value: 1 });
    button(index).dispatchEvent(event);
    await nextTick();
  }
  try {
    assert.equal(button(1).draggable, false);
    await pointer(1, "pointerdown", 45, 1);
    await pointer(1, "pointermove", 105, 1);
    assert.deepEqual(grid.vm.getSelection(), { sheetId: "s", anchor: "A2", focus: "B4" });
    assert.equal(preview(), null);
    await pointer(1, "pointerup", 105, 0);
    await fire(button(1), "click", { detail: 1 });
    assert.deepEqual(grid.vm.getSelection(), { sheetId: "s", anchor: "A2", focus: "B4" });
    assert.deepEqual(values(), ["A", "B", "C", "D"]);
    assert.equal(grid.vm.undo(), false);

    await pointer(2, "pointerdown", 75, 1);
    await pointer(2, "pointermove", 5, 1);
    assert.equal(row(2).dataset.rowDragging, "true");
    assert.equal(row(1).dataset.rowDragging, undefined);
    assert.equal(preview().dataset.position, "before");
    assert.equal(preview().dataset.row, "0");
    assert.equal(preview().style.width, "380px");
    assert.equal(preview().style.left, "20px");
    assert.deepEqual(values(), ["A", "B", "C", "D"]);
    await pointer(2, "pointercancel", 5, 0);
    assert.equal(preview(), null);
    assert.deepEqual(values(), ["A", "B", "C", "D"]);

    await pointer(2, "pointerdown", 75, 1);
    await pointer(2, "pointermove", 115, 1);
    assert.equal(preview().dataset.position, "after");
    await pointer(2, "pointerup", 5, 0);
    await nextTick();
    assert.deepEqual(values(), ["C", "A", "B", "D"]);
    assert.deepEqual(grid.vm.getSelection(), { sheetId: "s", anchor: "A1", focus: "B1" });
    assert.equal(preview(), null);
    assert(grid.vm.undo());
    await nextTick();
    assert.deepEqual(values(), ["A", "B", "C", "D"]);

    await fire(button(1), "click");
    await pointer(1, "pointerdown", 45, 1, true);
    await pointer(1, "pointermove", 5, 1, true);
    await pointer(1, "pointerup", 5, 0, true);
    assert.deepEqual(grid.vm.getSelection(), { sheetId: "s", anchor: "A2", focus: "B1" });
    assert.deepEqual(values(), ["A", "B", "C", "D"]);
  } finally {
    if (original) document.elementFromPoint = original;
    else delete document.elementFromPoint;
  }

});

test("Spreadsheet dragging a total between detail rows preserves its inputs without a circular reference", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: { sheets: [
    { id: "expenses", name: "实际支出", rows: [["项目", "金额"], ["办公用品", 1020], ["培训课程", 2100], ["合计", "=SUM(B2:B3)"]] },
    { id: "report", name: "汇总", rows: [["=IF(TRUE,SUM('实际支出'!$B$2:$B$3),0)", "=SUM(B1:B2)"]] },
  ] } });
  const header = (index) => grid.find(`[data-sheet-row="${index}"] button`);
  const total = (index) => grid.find(`[data-grid-row="number:${index}"] td[data-column-key="1"]`);
  const [expenses, report] = grid.vm.getWorkbook().sheets;
  assert.equal(total(3).textContent.trim(), "3120");
  const original = document.elementFromPoint;
  document.elementFromPoint = (_, y) => header(Math.floor(y / 30));
  for (let index = 0; index < 4; index++)
    header(index).closest("tr").getBoundingClientRect = () => ({ top: index * 30, height: 30 });
  try {
    await fire(header(3), "click");
    for (const [type, y, buttons] of [["pointerdown", 105, 1], ["pointermove", 64, 1], ["pointerup", 64, 0]]) {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientY: y, buttons });
      Object.defineProperty(event, "pointerId", { value: 1 });
      header(3).dispatchEvent(event);
      await nextTick();
    }
    const [moved, linked] = grid.vm.getWorkbook().sheets;
    assert.deepEqual(moved.rows[2], ["合计", "=SUM(B2,B4)"]);
    assert.equal(total(2).textContent.trim(), "3120");
    assert.equal(linked.rows[0][0], "=IF(TRUE,SUM('实际支出'!$B$2,'实际支出'!$B$4),0)");
    assert.equal(linked.rows[0][1], report.rows[0][1]);
    assert(grid.vm.undo());
    await nextTick();
    assert.deepEqual(grid.vm.getWorkbook().sheets[0].rows, expenses.rows);
    assert.equal(total(3).textContent.trim(), "3120");
    assert(grid.vm.redo());
    await nextTick();
    assert.equal(total(2).textContent.trim(), "3120");
  } finally {
    if (original) document.elementFromPoint = original;
    else delete document.elementFromPoint;
  }
});

test("Spreadsheet row resize previews and commits selected heights in one undo step", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [{ id: "s", name: "Sheet", rows: [[1], [2], [3]] }],
    },
  });
  const rowButton = (index) => grid.find(`[data-sheet-row="${index}"] button`);
  const handle = grid.find('[aria-label="调整第 1 行行高"]');
  const guide = () => grid.find(".hys-ui-spreadsheet-row-resize-guide");
  const heights = () => grid.vm.getWorkbook().sheets[0].rowOptions ?? {};
  const pointer = (type, clientY) => {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientY });
    Object.defineProperty(event, "pointerId", { value: 1 });
    handle.dispatchEvent(event);
    return nextTick();
  };
  await fire(rowButton(0), "click");
  await fire(rowButton(2), "click", { shiftKey: true });
  await fire(rowButton(1), "click", { ctrlKey: true });
  await pointer("pointerdown", 60);
  await pointer("pointermove", 90);
  assert.equal(guide().style.top, "70px");
  assert.deepEqual(heights(), {});
  await pointer("pointerup", 85);
  assert.equal(guide(), null);
  await nextTick();
  assert.deepEqual(heights(), { 0: { size: 65 }, 2: { size: 65 } });
  assert.equal(rowButton(1).getAttribute("aria-pressed"), "false");
  assert.equal(rowButton(2).getAttribute("aria-pressed"), "true");
  await fire(handle, "dblclick");
  assert.deepEqual(heights(), { 0: { size: 35 }, 2: { size: 65 } });
  assert.equal(rowButton(2).getAttribute("aria-pressed"), "true");
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual(heights(), { 0: { size: 65 }, 2: { size: 65 } });
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual(heights(), {});

  await pointer("pointerdown", 60);
  await pointer("pointermove", 35);
  await pointer("pointercancel", 35);
  assert.equal(guide(), null);
  assert.deepEqual(heights(), {});
  await fire(handle, "keydown", { key: "Home" });
  assert.equal(heights()[0].size, 16);
  await fire(handle, "keydown", { key: "ArrowDown", shiftKey: true });
  assert.equal(heights()[0].size, 26);

  grid.props.readonly = true;
  await nextTick();
  assert.equal(grid.find('[aria-label="调整第 1 行行高"]'), null);
});

test("Spreadsheet marks and restores hidden row and column gaps", async () => {
  const rows = Array.from({ length: 6 }, (_, row) => [row, "B", "C", "D"]);
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [{
        id: "s", name: "Sheet", rows,
        rowOptions: { 0: { hidden: true }, 2: { hidden: true, size: 25 }, 3: { hidden: true }, 5: { hidden: true } },
        columnOptions: { 0: { hidden: true }, 3: { hidden: true } },
      }],
    },
  });
  const marker = (label) => grid.find(`button[aria-label="${label}"]`);
  const rowNumbers = () => [...grid.host.querySelectorAll("[data-sheet-row]")]
    .map((element) => Number(element.dataset.sheetRow) + 1);
  assert.deepEqual(rowNumbers(), [2, 5]);
  assert(marker("取消隐藏行 1"));
  assert(marker("取消隐藏行 6"));
  assert(marker("取消隐藏列 A"));
  assert(marker("取消隐藏列 D"));
  await fire(marker("取消隐藏行 3–4"), "click");
  assert.deepEqual(rowNumbers(), [2, 3, 4, 5]);
  assert.equal(grid.vm.getWorkbook().sheets[0].rowOptions[2].size, 25);
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual(rowNumbers(), [2, 5]);
  await fire(marker("取消隐藏列 D"), "click");
  assert(grid.find('[data-column-key="3"]'));
  assert.equal(marker("取消隐藏列 D"), null);
});

test("Spreadsheet row reordering scrolls at the viewport edge and cancels cleanly", async () => {
  const rows = Array.from({ length: 24 }, (_, index) => [index]);
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "s", name: "Sheet", rows }] },
  });
  const scroll = grid.find(".hys-ui-pf-grid-scroll");
  const header = (index) => grid.find(`[data-sheet-row="${index}"]`);
  const button = header(2).querySelector("button");
  await fire(button, "click");
  const box = (top, bottom) => ({ top, bottom, left: 10, right: 410, width: 400, height: bottom - top });
  scroll.getBoundingClientRect = () => box(0, 180);
  scroll.querySelector("thead").getBoundingClientRect = () => box(0, 30);
  Object.defineProperties(scroll, {
    clientWidth: { value: 400 },
    clientHeight: { value: 180 },
    scrollHeight: { value: 750 },
  });
  for (let index = 0; index < rows.length; index++)
    header(index).closest("tr").getBoundingClientRect =
      () => box(30 + index * 30 - scroll.scrollTop, 60 + index * 30 - scroll.scrollTop);
  const previousHitTest = document.elementFromPoint;
  document.elementFromPoint = (_, y) => header(Math.floor((y - 30 + scroll.scrollTop) / 30));
  function pointer(element, type, y, buttons) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 20, clientY: y, buttons });
    Object.defineProperty(event, "pointerId", { value: 1 });
    element.dispatchEvent(event);
  }
  const preview = () => grid.find(".hys-ui-spreadsheet-row-drop");
  try {
    pointer(button, "pointerdown", 103, 1);
    pointer(scroll, "pointermove", 179, 1);
    const firstTarget = Number(preview().dataset.row);
    await pause(145);
    assert(scroll.scrollTop > 0);
    scroll.dispatchEvent(new Event("scroll"));
    assert(Number(preview().dataset.row) > firstTarget);
    pointer(scroll, "pointermove", 100, 1);
    const settled = scroll.scrollTop;
    await pause(60);
    assert.equal(scroll.scrollTop, settled);
    pointer(scroll, "pointermove", 31, 1);
    await pause(65);
    assert(scroll.scrollTop < settled);
    pointer(scroll, "pointercancel", 31, 0);
    const cancelled = scroll.scrollTop;
    await pause(65);
    assert.equal(scroll.scrollTop, cancelled);
    assert.equal(preview(), null);
    assert.deepEqual(grid.vm.getWorkbook().sheets[0].rows, rows);
  } finally {
    if (previousHitTest) document.elementFromPoint = previousHitTest;
    else delete document.elementFromPoint;
  }
});

test("Spreadsheet row number menu uses the clicked row and preserves undo", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "s", name: "Sheet", rows: [["A"], ["B"], ["C"]] }] },
  });
  const sheet = () => grid.vm.getWorkbook().sheets[0];
  const rowNumber = (row) => grid.find(`button[aria-label="选择第 ${row} 行"]`);
  const command = (label) => [...document.querySelectorAll('[role="menuitem"]')]
    .find((item) => item.textContent.trim() === label);
  async function open(row, keyboard = false) {
    const button = rowNumber(row);
    if (keyboard) {
      button.focus();
      await fire(button, "keydown", { key: "F10", shiftKey: true });
    } else {
      button.dispatchEvent(new MouseEvent("contextmenu", {
        bubbles: true, cancelable: true, button: 2, clientX: 30, clientY: 30,
      }));
    }
    await pause(30);
  }
  await fire(rowNumber(1), "click");
  await open(2);
  await fire(command("复制此行到下方"), "click");
  assert.deepEqual(sheet().rows.map(([value]) => value), ["A", "B", "B", "C"]);
  assert(grid.vm.undo());
  await nextTick();
  await open(2);
  const quantity = document.querySelector('[aria-label="上方插入行数"]');
  assert.equal(quantity.value, "1");
  assert.equal(quantity.getAttribute("aria-valuemax"), "9997");
  quantity.value = "2";
  await fire(quantity, "input");
  assert.equal(document.querySelector('[aria-label="下方插入行数"]').value, "1");
  const insert = command("在上方插入行");
  assert.equal(insert.parentElement, quantity.closest(".hys-ui-menu-item-row"));
  assert(command("复制此行到下方").compareDocumentPosition(insert) & Node.DOCUMENT_POSITION_FOLLOWING);
  await fire(insert, "click");
  assert.equal(document.querySelector('[role="dialog"][aria-label="插入行"]'), null);
  assert.deepEqual(sheet().rows.map(([value]) => value ?? null), ["A", null, null, "B", "C"]);
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual(sheet().rows.map(([value]) => value), ["A", "B", "C"]);
  await open(2, true);
  await fire(command("隐藏此行"), "click");
  assert.equal(sheet().rowOptions[1].hidden, true);
  assert.equal(rowNumber(2), null);
  await open(1);
  await fire(command("取消隐藏下方行"), "click");
  assert.equal(sheet().rowOptions[1].hidden, false);
  await open(2);
  await fire(command("冻结至此行"), "click");
  assert.equal(sheet().frozenRows, 2);
  await open(1);
  await fire(command("取消冻结行"), "click");
  assert.equal(sheet().frozenRows, 0);
  await open(2);
  await fire(command("锁定此行"), "click");
  assert.equal(sheet().rowOptions[1].locked, true);
  assert(rowNumber(2).querySelector(".hys-ui-spreadsheet-axis-lock"));
  assert.equal(rowNumber(2).getAttribute("aria-description"), "此行已锁定");
  await open(2);
  await fire(command("解锁此行"), "click");
  assert.equal(sheet().rowOptions[1].locked, false);
  assert.equal(rowNumber(2).querySelector(".hys-ui-spreadsheet-axis-lock"), null);
  assert.equal(rowNumber(2).getAttribute("aria-description"), null);
  await fire(rowNumber(1), "click");
  await fire(rowNumber(2), "click", { shiftKey: true });
  await open(2);
  await fire(command("行高"), "keydown", { key: "ArrowRight" });
  const height = document.querySelector('[aria-label="行高（像素）"]');
  assert.equal(height.value, "35");
  height.value = "20";
  await fire(height, "input");
  await fire(height, "keydown", { key: "Enter" });
  for (const index of [0, 1]) {
    assert.equal(sheet().rowOptions[index].size, 20);
    assert.equal(grid.find(`tr[data-grid-row="number:${index}"]`).style.getPropertyValue("--hys-sheet-row-height"), "20px");
  }
  assert.equal(sheet().rowOptions[2]?.size, undefined);
  assert.equal(document.querySelector('[role="dialog"][aria-label="设置行高"]'), null);
  assert(grid.vm.undo());
  await nextTick();
  assert.equal(sheet().rowOptions[0]?.size, undefined);
  assert.equal(sheet().rowOptions[1].size, undefined);
  grid.props.readonly = true;
  await nextTick();
  await open(2);
  assert.equal(command("删除此行"), undefined);
});

test("Spreadsheet column headers expose workbook commands without an ellipsis button", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{
      id: "s", name: "Sheet", frozenRows: 1, rows: [["A", "B", "=B1"], [1, 2, "=B2"]],
    }] },
  });
  const sheet = () => grid.vm.getWorkbook().sheets[0];
  const header = (letter) => grid.find(`button[aria-label="选择 ${letter} 列"]`);
  const item = (label) => [...document.querySelectorAll('[role="menuitem"]')]
    .find((item) => item.textContent.trim() === label);
  async function open(letter, keyboard = false) {
    const button = header(letter);
    if (keyboard) {
      button.focus();
      await fire(button, "keydown", { key: "F10", shiftKey: true });
    } else {
      button.dispatchEvent(new MouseEvent("contextmenu", {
        bubbles: true, cancelable: true, button: 2, clientX: 65, clientY: 30,
      }));
    }
    await pause(30);
  }
  assert.equal(grid.find(".hys-ui-pf-grid-column-menu"), null);
  await fire(header("A"), "click");
  await open("B");
  const count = document.querySelector('[aria-label="左侧插入列数"]');
  assert.equal(count.value, "1");
  assert.equal(count.getAttribute("aria-valuemax"), "97");
  count.value = "2";
  await fire(count, "input");
  await fire(count, "keydown", { key: "Enter" });
  assert.deepEqual(sheet().rows[0], ["A", null, null, "B", "=D1"]);
  assert(grid.vm.undo());
  await nextTick();
  await open("B");
  await fire(item("复制此列到右侧"), "click");
  assert.deepEqual(sheet().rows[0], ["A", "B", "B", "=B1"]);
  assert(grid.vm.undo());
  await nextTick();
  await open("B", true);
  await fire(item("冻结至此列"), "click");
  assert.equal(sheet().frozenColumns, 2);
  assert.equal(sheet().frozenRows, 1);
  await open("B");
  await fire(item("取消冻结列"), "click");
  assert.equal(sheet().frozenColumns, 0);
  assert.equal(sheet().frozenRows, 1);
  await open("B");
  await fire(item("隐藏此列"), "click");
  assert.equal(header("B"), null);
  await open("A");
  await fire(item("取消隐藏右侧列"), "click");
  assert(header("B"));
  assert.deepEqual(grid.all("thead th[data-column-key]").map((cell) => cell.dataset.columnKey), ["0", "1", "2"]);

  await open("B");
  await fire(item("锁定此列"), "click");
  assert.equal(sheet().columnOptions[1].locked, true);
  assert(header("B").querySelector(".hys-ui-spreadsheet-axis-lock"));
  assert.equal(header("B").getAttribute("aria-description"), "此列已锁定");
  await open("B");
  await fire(item("解锁此列"), "click");
  assert.equal(sheet().columnOptions[1].locked, false);
  assert.equal(header("B").querySelector(".hys-ui-spreadsheet-axis-lock"), null);

  await fire(header("A"), "click");
  await fire(header("B"), "click", { shiftKey: true });
  await open("B");
  await fire(item("列宽"), "keydown", { key: "ArrowRight" });
  const size = document.querySelector('[aria-label="列宽（像素）"]');
  assert.equal(size.value, "124");
  size.value = "160";
  await fire(size, "input");
  await fire(size, "keydown", { key: "Enter" });
  assert.deepEqual([0, 1, 2].map((index) => sheet().columnOptions[index]?.size), [160, 160, undefined]);
  if (header("A").getAttribute("aria-pressed") !== "true")
    await fire(header("A"), "click");
  await fire(header("B"), "click", { shiftKey: true });
  assert.equal(header("B").getAttribute("aria-pressed"), "true");
  await fire(grid.find('[aria-label="调整A列宽"]'), "dblclick");
  assert.deepEqual([0, 1].map((index) => sheet().columnOptions[index]?.size), [48, 160]);
  assert.equal(header("B").getAttribute("aria-pressed"), "true");
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual([0, 1].map((index) => sheet().columnOptions[index]?.size), [160, 160]);
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual([0, 1].map((index) => sheet().columnOptions[index]?.size), [undefined, undefined]);
  grid.props.readonly = true;
  await nextTick();
  await open("B");
  assert.equal(item("删除此列"), undefined);
});

test("Spreadsheet clears a single row or column by reactivating its header", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [{ id: "s", name: "Sheet", rows: [[1, 2], [3, 4], [5, 6]] }],
    },
  });
  const header = (label) => grid.find(`button[aria-label="${label}"]`);
  const firstRow = header("选择第 1 行");
  const secondRow = header("选择第 2 行");
  const firstColumn = header("选择 A 列");
  const secondColumn = header("选择 B 列");
  const assertCleared = () => {
    assert.equal(grid.vm.getSelection(), null);
    assert.equal(grid.vm.getSelectionSummary(), null);
    assert.equal(grid.find("[data-hys-pro-grid-range]"), null);
    assert.equal(grid.events.selectionChange.at(-1)[0], null);
  };

  await fire(firstRow, "click");
  assert.equal(firstRow.getAttribute("aria-pressed"), "true");
  await fire(firstRow, "click");
  assert.equal(firstRow.getAttribute("aria-pressed"), "false");
  assertCleared();

  await fire(firstColumn, "click");
  assert.equal(firstColumn.getAttribute("aria-pressed"), "true");
  await fire(firstColumn, "click");
  assert.equal(firstColumn.getAttribute("aria-pressed"), "false");
  assertCleared();

  await fire(firstRow, "click");
  await fire(secondRow, "click", { shiftKey: true });
  assert.deepEqual(grid.vm.getSelection(), { sheetId: "s", anchor: "A1", focus: "B2" });
  await fire(secondRow, "click");
  assert.deepEqual(grid.vm.getSelection(), { sheetId: "s", anchor: "A2", focus: "B2" });
  await fire(secondRow, "click");
  assertCleared();

  await fire(firstColumn, "click");
  await fire(secondColumn, "click", { shiftKey: true });
  assert.deepEqual(grid.vm.getSelection(), { sheetId: "s", anchor: "A1", focus: "B3" });
  await fire(secondColumn, "keydown", { key: "Escape" });
  assertCleared();
  assert.equal(grid.vm.undo(), false);
});

test("Spreadsheet modifier clicks remove only the targeted row or column from a selection", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [{
        id: "s", name: "Sheet",
        rows: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]],
        rowOptions: { 2: { hidden: true } },
      }],
    },
  });
  const header = (label) => grid.find(`button[aria-label="${label}"]`);
  const row = (index) => header(`选择第 ${index} 行`);
  const column = (label) => header(`选择 ${label} 列`);
  const pressed = (button) => button.getAttribute("aria-pressed") === "true";
  const painted = (row, column) => grid.find(
    `tr[data-grid-row="number:${row - 1}"] [data-column-key="${column}"]`,
  ).hasAttribute("data-hys-pro-grid-range");

  await fire(row(1), "click");
  await fire(row(4), "click", { shiftKey: true });
  await fire(row(2), "click", { ctrlKey: true });
  assert.deepEqual(grid.vm.getSelection(), {
    sheetId: "s", anchor: "A1", focus: "D1",
    additional: [{ anchor: "A4", focus: "D4" }],
  });
  assert.deepEqual([1, 2, 4].map((index) => pressed(row(index))), [true, false, true]);
  assert.deepEqual([1, 2, 4].map((index) => painted(index, 0)), [true, false, true]);
  assert.equal(grid.vm.getSelectionSummary().cells, 8);
  const cut = new Event("cut", { bubbles: true, cancelable: true });
  const clipboardData = new Map();
  Object.defineProperty(cut, "clipboardData", {
    value: { setData: (type, content) => clipboardData.set(type, content) },
  });
  grid.find('tr[data-grid-row="number:0"] td[data-column-key="0"]').dispatchEvent(cut);
  assert(cut.defaultPrevented);
  assert.equal(clipboardData.size, 0);
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[3][0], 13);
  assert(grid.vm.formatCells({ bold: true }));
  await nextTick();
  const formats = grid.vm.getWorkbook().sheets[0].formats;
  assert.deepEqual(Object.keys(formats), ["A1", "B1", "C1", "D1", "A4", "B4", "C4", "D4"]);
  await fire(row(2), "click", { ctrlKey: true });
  assert.equal(grid.vm.getSelectionSummary().cells, 8);
  await fire(row(1), "click", { ctrlKey: true });
  assert.deepEqual(grid.vm.getSelection(), { sheetId: "s", anchor: "A4", focus: "D4" });
  await fire(row(4), "click", { ctrlKey: true });
  assert.equal(grid.vm.getSelection(), null);

  await fire(column("D"), "click");
  await fire(column("A"), "click", { shiftKey: true });
  await fire(column("B"), "click", { metaKey: true });
  assert.deepEqual(grid.vm.getSelection(), {
    sheetId: "s", anchor: "A1", focus: "A4",
    additional: [{ anchor: "C1", focus: "D4" }],
  });
  assert.deepEqual(["A", "B", "C", "D"].map((label) => pressed(column(label))), [true, false, true, true]);
  assert.deepEqual([0, 1, 2, 3].map((index) => painted(4, index)), [true, false, true, true]);
  assert.equal(grid.vm.getSelectionSummary().cells, 9);
  await fire(column("D"), "click", { ctrlKey: true });
  assert.equal(grid.vm.getSelectionSummary().cells, 6);
  await fire(column("C"), "keydown", { key: "Escape" });
  assert.equal(grid.vm.getSelection(), null);
});

test("Spreadsheet selects row and column headers, reports statistics and batches structural edits", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        {
          id: "sheet",
          name: "Sheet",
          rows: [
            [1, 2, "=SUM(A1:B1)"],
            [3, 4, "=SUM(A2:B2)"],
            [5, 6, 7],
          ],
        },
      ],
    },
  });
  const button = (name) => grid.find(`button[aria-label="${name}"]`);
  await fire(button("选择第 1 行"), "click");
  await fire(button("选择第 2 行"), "click", { shiftKey: true });
  assert.deepEqual(grid.vm.getSelection(), {
    sheetId: "sheet",
    anchor: "A1",
    focus: "C2",
  });
  assert.deepEqual(grid.vm.getSelectionSummary(), {
    cells: 6,
    nonEmpty: 6,
    numeric: 6,
    sum: 20,
    average: 20 / 6,
    min: 1,
    max: 7,
  });
  await openSpreadsheetOperation(grid, "行列与冻结");
  await fire(spreadsheetOperationButton("插入行"), "click");
  assert.equal(grid.vm.getWorkbook().sheets[0].rows.length, 5);
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[2][2], "=SUM(A3:B3)");
  assert(grid.vm.undo());
  await nextTick();
  await fire(document.querySelector('.hys-ui-spreadsheet-toolbar-panel:not([style*="display: none"]) button[aria-label="收起面板"]'), "click");
  await fire(button("选择 A 列"), "click");
  await openSpreadsheetOperation(grid, "行列与冻结");
  await fire(spreadsheetOperationButton("删除列"), "click");
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][1], "=SUM(A1:A1)");
  assert(grid.vm.undo());
  await nextTick();
  assert(grid.vm.selectAll());
  await nextTick();
  assert.equal(grid.vm.getSelectionSummary().cells, 9);
  assert.equal(spreadsheetOperationButton("删除行").disabled, true);
  assert.equal(spreadsheetOperationButton("删除列").disabled, true);
  assert.equal(grid.vm.selectRange("Z99"), false);
  const nameBox = grid.find('input[aria-label="名称框"]');
  nameBox.focus();
  nameBox.value = "B2:C3";
  await fire(nameBox, "input");
  await fire(nameBox, "keydown", { key: "Enter" });
  assert.deepEqual(grid.vm.getSelection(), {
    sheetId: "sheet",
    anchor: "B2",
    focus: "C3",
  });
});

test("Spreadsheet switches sheets, formats selections and reports invalid or circular references", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        { id: "a", name: "First", rows: [["=B1", "=A1", "=1/0", "=Z20"]] },
        {
          id: "b",
          name: "Second",
          rows: [[0.25]],
          formats: { A1: { number: "percent" } },
        },
      ],
    },
  });
  assert.deepEqual(
    grid.all(".hys-ui-spreadsheet-error").map(({ textContent }) => textContent),
    ["#CYCLE!", "#CYCLE!", "#DIV/0!", "#REF!"],
  );
  assert.equal(grid.vm.setSheet("b"), true);
  await nextTick();
  assert.equal(grid.find(".hys-ui-spreadsheet-number").textContent, "25%");
  const target = grid.find('td[data-column-key="0"]');
  target.focus();
  await nextTick();
  assert.deepEqual(grid.vm.getSelection(), {
    sheetId: "b",
    anchor: "A1",
    focus: "A1",
  });
  await fire(target, "keydown", { key: "Delete" });
  assert.equal(grid.vm.getWorkbook().sheets[1].rows[0][0], null);
});

test("Spreadsheet preserves cross-sheet references through rename, structural edit and undo", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        { id: "source", name: "源数据", rows: [[3], [8]] },
        { id: "report", name: "汇总", rows: [["=SUM('源数据'!A1:A2)", '="A1"']] },
      ],
    },
  });
  assert(grid.vm.manageAxis({ type: "insert", axis: "row", index: 0 }));
  assert(grid.vm.manageSheet({ type: "rename", id: "source", name: "本月数据" }));
  assert.equal(grid.vm.getWorkbook().sheets[1].rows[0][0], "=SUM('本月数据'!A2:A3)");
  assert.equal(grid.vm.getWorkbook().sheets[1].rows[0][1], '="A1"');
  assert(grid.vm.setSheet("report"));
  await nextTick();
  assert.equal(grid.find(".hys-ui-spreadsheet-number").textContent, "11");
  assert(grid.vm.undo());
  await nextTick();
  assert.equal(grid.vm.getWorkbook().sheets[1].rows[0][0], "=SUM('源数据'!A2:A3)");
});

test("Spreadsheet validates batch writes against the candidate data and rejects protected destinations", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [{
        id: "sheet", name: "Sheet", rows: [[1, 2, 3], [4, 5, 6]],
        cells: {
          B1: { validation: { compare: { address: "A1", operator: "gt" } } },
          C1: { locked: true },
        },
      }],
    },
  });
  assert(grid.vm.selectRange("A1"));
  assert(grid.vm.paste("5\t6"));
  await nextTick();
  assert.deepEqual(grid.vm.getWorkbook().sheets[0].rows[0], [5, 6, 3]);
  assert(grid.vm.selectRange("A1"));
  assert(!grid.vm.paste("9\t8"));
  assert(!grid.vm.paste("7\t8\t9"));
  assert.deepEqual(grid.vm.getWorkbook().sheets[0].rows[0], [5, 6, 3]);
  assert(grid.vm.selectRange("A2", "C2"));
  assert(grid.vm.mergeCells());
  await nextTick();
  assert.equal(grid.find('[data-grid-row="number:1"] td[data-column-key="0"]').colSpan, 3);
  assert.equal(grid.all('[data-grid-row="number:1"] td[data-column-key]').length, 1);
});

test("Spreadsheet editors preserve typed values, accept direct keyboard input, and validate a batch atomically", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: { sheets: [{
    id: "s", name: "Editing", rows: [["001", 1, 0, 0, null, null, null, false, null, null, null, null, null], [null, 2]],
    cells: {
      A1: { type: "text" }, B1: { type: "number", validation: { max: 20 } },
      C1: { type: "percent" }, D1: { type: "currency" }, E1: { type: "date" },
      F1: { type: "time" }, G1: { type: "datetime-local" }, H1: { type: "boolean" },
      I1: { type: "select", options: ["=标签"] }, J1: { type: "multiple", options: ["甲", "乙"] },
      K1: { type: "autocomplete", options: ["联系人"] }, L1: { type: "formula" }, M1: { type: "multiline" },
      B2: { type: "number", validation: { max: 10 } },
    },
  }] } });
  const sheet = () => grid.vm.getWorkbook().sheets[0];
  grid.vm.selectRange("B1");
  const amount = grid.find('[data-grid-row="number:0"] td[data-column-key="1"]');
  await fire(amount, "keydown", { key: "7" });
  const input = grid.find(".hys-ui-pro-grid-editor input");
  assert.equal(input.value, "7");
  await fire(input, "keydown", { key: "Enter" });
  await pause(0);
  assert.equal(sheet().rows[0][1], 7);
  grid.vm.selectRange("B1", "B2");
  assert(!grid.vm.editSelection("11"));
  assert.deepEqual([sheet().rows[0][1], sheet().rows[1][1]], [7, 2]);
  assert(grid.vm.editSelection("9"));
  await nextTick();
  assert.deepEqual([sheet().rows[0][1], sheet().rows[1][1]], [9, 9]);
  assert(grid.vm.undo());
  await nextTick();
  assert.deepEqual([sheet().rows[0][1], sheet().rows[1][1]], [7, 2]);
  grid.vm.selectRange("L1", "L2");
  assert(grid.vm.editSelection("=$B1*2"));
  await nextTick();
  assert.deepEqual([sheet().rows[0][11], sheet().rows[1][11]], ["=$B1*2", "=$B2*2"]);
  grid.vm.selectRange("A1");
  assert(grid.vm.paste('0002\t6\t12.5％\t¥1,248.50\t2028-02-29\t09:05:30\t2028-02-29 16:05:25\t是\t=标签\t"甲\n乙"\t自由输入\tB1+1\t"第一行\r\n第二行"'));
  await nextTick();
  assert.deepEqual(sheet().rows[0], ["0002", 6, 0.125, 1248.5, "2028-02-29", "09:05:30", "2028-02-29T16:05:25", true, "'=标签", "甲\n乙", "自由输入", "=B1+1", "第一行\r\n第二行"]);
  grid.vm.selectRange("G1");
  assert(!grid.vm.editSelection("2027-02-29T16:05"));
  assert(!grid.vm.editSelection("2028-02-29T16:05:25Z"));
});

test("Spreadsheet fills numeric, date, custom, smart text and relative formula series through common entry points", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: { sheets: [{
    id: "s", name: "Fill", columnCount: 8,
    rows: [
      [2, "2028-02-27", "AA009", "已发货", "alice@test.example", "alice", "=$A1", 3],
      [5, "2028-02-29", "AA011", null, "ben@test.example", "ben"],
      [null, null, null, null, "carol@test.example"],
      [null, null, null, null, "dan@test.example"],
      [],
    ],
  }] } });
  const sheet = () => grid.vm.getWorkbook().sheets[0];
  assert(grid.vm.selectRange("A1", "C2"));
  await nextTick();
  const handle = grid.find('button[aria-label="拖动填充选区"]');
  const target = grid.find('[data-grid-row="number:3"] td[data-column-key="2"]');
  await fire(handle, "dragstart");
  await fire(target, "dragover");
  assert(target.classList.contains("hys-ui-spreadsheet-fill-preview"));
  await fire(target, "drop");
  await nextTick();
  assert.deepEqual(sheet().rows[2].slice(0, 3), [8, "2028-03-02", "AA013"]);
  assert.deepEqual(sheet().rows[3].slice(0, 3), [11, "2028-03-04", "AA015"]);
  assert(!target.classList.contains("hys-ui-spreadsheet-fill-preview"));
  assert(grid.vm.selectRange("D1", "D4"));
  assert(grid.vm.fill("down", "copy", ["待打包", "已发货", "已签收"]));
  await nextTick();
  assert.deepEqual(sheet().rows.slice(0, 4).map((row) => row[3]), ["已发货", "已签收", "待打包", "已发货"]);
  assert(grid.vm.selectRange("F1", "F4"));
  assert(grid.vm.fill("down", "smart"));
  await nextTick();
  assert.deepEqual(sheet().rows.slice(0, 4).map((row) => row[5]), ["alice", "ben", "carol", "dan"]);
  assert(grid.vm.selectRange("G1", "G4"));
  assert(grid.vm.fill("down"));
  await nextTick();
  assert.deepEqual(sheet().rows.slice(0, 4).map((row) => row[6]), ["=$A1", "=$A2", "=$A3", "=$A4"]);
  assert(grid.vm.selectRange("G1", "H1"));
  assert(grid.vm.fill("right"));
  await nextTick();
  assert.equal(sheet().rows[0][7], "=$A1");
  assert(grid.vm.undo());
  await nextTick();
  assert.equal(sheet().rows[0][7], 3);
  assert(grid.vm.selectRange("A3", "A4"));
  await nextTick();
  await fire(grid.find('button[aria-label="拖动填充选区"]'), "dragstart");
  await fire(grid.find('[data-grid-row="number:0"] td[data-column-key="0"]'), "drop");
  await nextTick();
  assert.deepEqual(sheet().rows.map((row) => row[0]).slice(0, 4), [2, 5, 8, 11]);
  assert(grid.vm.selectRange("C1", "C4"));
  assert(grid.vm.setCells([{ row: 0, column: 2, value: "另一个编号" }, { row: 2, column: 2, value: null }, { row: 3, column: 2, value: null }]));
  await nextTick();
  assert(grid.vm.fill("down", "smart"));
  await nextTick();
  assert.deepEqual(sheet().rows.map((row) => row[2]).slice(0, 4), ["另一个编号", "AA011", "另一个编号", "AA011"]);
});

test("Spreadsheet paste modes preserve target values and formats independently and translate filtered source rows", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: { sheets: [{
    id: "s", name: "Paste", columnCount: 6,
    rows: [[2, "=$A1*3", 70, 80, 90, 100], [3, "=$A2*3"], [4, "=$A3*3"], [], []],
    rowOptions: { 1: { hidden: true } },
    formats: { B1: { bold: true }, B3: { italic: true }, C1: { underline: true } },
    cells: { F1: { type: "formula" } },
  }] } });
  const sheet = () => grid.vm.getWorkbook().sheets[0];
  const source = grid.find('[data-grid-row="number:0"] td[data-column-key="1"]');
  source.focus();
  assert(grid.vm.selectRange("B1", "B3"));
  const data = new Map();
  data.setData = data.set;
  const copy = new Event("copy", { bubbles: true, cancelable: true });
  Object.defineProperty(copy, "clipboardData", { value: data });
  source.dispatchEvent(copy);
  const text = data.get("text/plain");
  assert(text);
  assert(grid.vm.selectRange("C1"));
  assert(grid.vm.paste(text, "values"));
  await nextTick();
  assert.equal(sheet().rows[0][2], 6);
  assert.equal(sheet().rows[2][2], 12);
  assert.equal(sheet().formats.C1.underline, true);
  assert(grid.vm.selectRange("D4"));
  assert(grid.vm.paste(text, "formulas"));
  await nextTick();
  assert.equal(sheet().rows[3][3], "=$A4*3");
  assert.equal(sheet().rows[4][3], "=$A5*3");
  assert.equal(sheet().formats.D4, undefined);
  assert(grid.vm.selectRange("E1"));
  assert(grid.vm.paste(text, "formats"));
  await nextTick();
  assert.equal(sheet().rows[0][4], 90);
  assert.equal(sheet().formats.E1.bold, true);
  assert.equal(sheet().formats.E3.italic, true);
  assert(grid.vm.selectRange("F1"));
  assert(!grid.vm.paste("=1+1", "values"));
  assert(!grid.vm.paste("123", "formats"));
  assert.equal(sheet().rows[0][5], 100);
  assert(grid.vm.paste("123", "values"));
  await nextTick();
  assert.equal(sheet().rows[0][5], 123);
});

test("Spreadsheet keeps formulas incremental and focuses a cell outside both virtual windows", async () => {
  let evaluations = 0;
  const rows = Array.from({ length: 400 }, () => []);
  rows[0] = [2, "=A1*2", "=TRACK(5)"];
  rows[399] = Array(50).fill(1);
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "data", name: "Data", rows }] },
    formulaFunctions: { TRACK: (value) => { evaluations++; return value; } },
  });
  const initial = evaluations;
  assert.equal(initial, 1);
  assert(grid.vm.setCells([{ row: 0, column: 0, value: 3 }]));
  await nextTick();
  assert.equal(evaluations, initial);
  assert.equal(grid.find('[data-grid-row="number:0"] td[data-column-key="1"]').textContent.trim(), "6");
  assert(grid.all("[data-grid-row]").length < 35);
  assert(grid.all('[data-grid-row="number:0"] td[data-column-key]').length < 25);
  assert(grid.vm.selectRange("AX400"));
  await nextTick();
  await nextTick();
  const cell = grid.find('[data-grid-row="number:399"] td[data-column-key="49"]');
  assert(cell);
  assert.equal(document.activeElement, cell);
});

test("Spreadsheet retains edits made during an asynchronous save and can reopen the saved workbook", async () => {
  const snapshots = [];
  let finish;
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{ id: "s", name: "Sheet", rows: [[1]] }] },
    persistence: {
      save: (workbook) => {
        snapshots.push(workbook);
        return new Promise((resolve) => { finish = resolve; });
      },
      load: () => snapshots.at(-1),
    },
  });
  assert(grid.vm.setCells([{ row: 0, column: 0, value: 2 }]));
  await nextTick();
  const pending = grid.vm.saveWorkbook();
  assert.equal(snapshots[0].sheets[0].rows[0][0], 2);
  assert(grid.vm.setCells([{ row: 0, column: 0, value: 3 }]));
  await nextTick();
  finish();
  assert(await pending);
  await nextTick();
  assert.match(grid.host.textContent, /有未保存的修改/);
  assert(await grid.vm.openWorkbook());
  await nextTick();
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], 2);
  assert.doesNotMatch(grid.host.textContent, /有未保存的修改/);
});

test("Spreadsheet spills arrays in two dimensions and resolves references to spilled cells", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [
        { id: "report", name: "Report", rows: [["=Data!B2", "=SUM(Data!A1:B2)"]] },
        { id: "data", name: "Data", columnCount: 2, rows: [["=SEQUENCE(2,2,5,2)"], []] },
      ],
    },
  });
  assert.deepEqual(grid.all(".hys-ui-spreadsheet-number").map(({ textContent }) => textContent), ["11", "32"]);
  assert(grid.vm.setSheet("data"));
  await nextTick();
  assert.deepEqual(grid.all(".hys-ui-spreadsheet-number").map(({ textContent }) => textContent), ["5", "7", "9", "11"]);
  assert(grid.vm.setCells([{ row: 1, column: 1, value: 3 }]));
  await nextTick();
  assert.equal(grid.find(".hys-ui-spreadsheet-error").textContent, "#SPILL!");
});

test("Spreadsheet opens and exports XLSX through its public API and keeps data on import failure", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: {
    name: "Budget", sheets: [{ id: "s", name: "预算", rows: [[3, "=A1*2"], [9, null]] }],
  } });
  const blob = await grid.vm.exportWorkbook();
  assert.match(blob.type, /spreadsheetml/);
  assert(grid.vm.setCells([{ row: 0, column: 0, value: 7 }]));
  await nextTick();
  assert.equal(await grid.vm.importWorkbook(new File(["wrong"], "bad.xlsx")), false);
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], 7);
  assert.equal(await grid.vm.importWorkbook(new File([blob], "Budget.XLSX")), true);
  await nextTick();
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][0], 3);
  assert.equal(grid.vm.getWorkbook().sheets[0].rows[0][1], "=A1*2");
  assert(document.querySelector('input[type="file"]').accept.includes(".xlsx"));
});

test("Spreadsheet paints only the perimeter of a selection and disables duplicate value tooltips", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: {
    sheets: [{ id: "s", name: "Sheet", rows: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }],
  } });
  assert(grid.vm.selectRange("A1", "C3"));
  await nextTick();
  const center = grid.find('[data-grid-row="number:1"] td[data-column-key="1"]');
  assert(center.hasAttribute("data-hys-pro-grid-range"));
  assert.equal(center.getAttribute("data-hys-pro-grid-range-edges"), null);
  assert.equal(center.getAttribute("title"), null);
  assert.equal(grid.find('[data-grid-row="number:0"] td[data-column-key="0"]').getAttribute("data-hys-pro-grid-range-edges"), "top start");
  assert.equal(grid.find('[data-grid-row="number:2"] td[data-column-key="2"]').getAttribute("data-hys-pro-grid-range-edges"), "bottom end");
  assert(grid.vm.selectRange("B2", "B2", true));
  await nextTick();
  assert.equal(grid.find('[data-grid-row="number:0"] td[data-column-key="0"]').getAttribute("data-hys-pro-grid-range-edges"), "top start");
  assert.equal(center.getAttribute("data-hys-pro-grid-range-edges"), "top bottom start end");
});

test("Spreadsheet cuts the selected value and keeps the configured row size", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: {
      sheets: [{ id: "s", name: "Sheet", rows: [["Office", 5]], rowOptions: { 0: { size: 48 } } }],
    },
  });
  const row = grid.find('[data-grid-row="number:0"]');
  const cell = row.querySelector('td[data-column-key="0"]');
  const height = row.style.height;
  assert.equal(height, "48px");
  cell.focus();
  const clipboardData = new Map();
  const cut = new Event("cut", { bubbles: true, cancelable: true });
  Object.defineProperty(cut, "clipboardData", { value: clipboardData });
  clipboardData.setData = clipboardData.set;
  cell.dispatchEvent(cut);
  await nextTick();
  assert(cut.defaultPrevented);
  assert.equal(clipboardData.get("text/plain"), "Office");
  assert.deepEqual(grid.vm.getWorkbook().sheets[0].rows[0], [null, 5]);
  assert.equal(row.style.height, height);
});

test("Spreadsheet range dragging suppresses browser text selection and leaves editor selection available", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: {
    sheets: [{ id: "s", name: "Sheet", rows: [["Alpha", "Beta"], ["Gamma", "Delta"]] }],
  } });
  const start = grid.find('[data-grid-row="number:0"] td[data-column-key="0"] span');
  const end = grid.find('[data-grid-row="number:1"] td[data-column-key="1"]');
  const browserSelection = document.getSelection();
  const text = document.createRange();
  text.selectNodeContents(start);
  browserSelection.addRange(text);
  const pointer = (target, type, x) => {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX: x });
    Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: "mouse" } });
    target.dispatchEvent(event);
    return event;
  };
  assert(pointer(start, "pointerdown", 0).defaultPrevented);
  assert.equal(browserSelection.toString(), "");
  pointer(end, "pointermove", 100);
  const during = new Event("selectstart", { bubbles: true, cancelable: true });
  end.dispatchEvent(during);
  assert(during.defaultPrevented);
  pointer(end, "pointerup", 100);
  assert.equal(grid.vm.getSelection().focus, "B2");
  await fire(end, "dblclick");
  const input = grid.find("[data-pro-grid-input]");
  assert(input);
  assert(!pointer(input, "pointerdown", 100).defaultPrevented);
  input.setSelectionRange(1, 4);
  assert.equal(input.value.slice(input.selectionStart, input.selectionEnd), "elt");
});

test("Spreadsheet header actions use calculated values and preserve filters on other columns", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [{
      id: "s", name: "Sheet",
      rows: [
        ["名称", "金额", "状态", "基数"],
        ["甲", "=D2+30", "有效", 20],
        ["乙", "=D3+10", "有效", 140],
        ["丙", "=D4+20", "无效", 60],
      ],
      filters: [{ column: 2, operator: "eq", value: "有效" }], filterHeader: true,
    }] },
  });
  const trigger = (label) => grid.find(`button[aria-label="${label}"]`);
  const content = () => document.querySelector(".column-data-menu");
  const action = (label) => [...content().querySelectorAll("button")]
    .find((node) => node.textContent.trim() === label);
  const workbookSheet = () => grid.vm.getWorkbook().sheets[0];
  assert(grid.vm.selectRange("A1", "A2"));
  await fire(trigger("排序 B 列"), "click");
  await nextTick();
  await fire(action("降序"), "click");
  assert.deepEqual(workbookSheet().rows.slice(1).map((row) => row.slice(0, 2)), [
    ["乙", "=D2+10"], ["丙", "=D3+20"], ["甲", "=D4+30"],
  ]);
  assert.equal(trigger("排序 B 列").dataset.sortDirection, "desc");

  await fire(trigger("筛选 B 列"), "click");
  await nextTick();
  const input = content().querySelector('input[aria-label="筛选文本"]');
  input.value = "150";
  await fire(input, "input");
  await fire(input, "keydown", { key: "Enter" });
  assert.deepEqual(workbookSheet().filters.map(({ column }) => column), [2, 1]);
  assert.deepEqual(grid.all('tbody td[data-column-key="0"]').map((node) => node.textContent.trim()), ["名称", "乙"]);
  assert(trigger("筛选 B 列").hasAttribute("data-column-filtered"));
  assert(trigger("筛选 C 列").hasAttribute("data-column-filtered"));
  await fire(trigger("筛选 B 列"), "click");
  await nextTick();
  assert.equal(content().querySelector('input[aria-label="筛选文本"]').value, "150");
  await fire(action("清除此列筛选"), "click");
  assert.deepEqual(workbookSheet().filters.map(({ column }) => column), [2]);
  assert(!trigger("筛选 B 列").hasAttribute("data-column-filtered"));
  assert(trigger("筛选 C 列").hasAttribute("data-column-filtered"));

  assert(grid.vm.setCells([{ row: 1, column: 3, value: 200 }]));
  await nextTick();
  await fire(trigger("排序 B 列"), "click");
  await fire(action("取消排序"), "click");
  assert.deepEqual(workbookSheet().rows.slice(1), [
    ["甲", "=D2+30", "有效", 20],
    ["乙", "=D3+10", "有效", 200],
    ["丙", "=D4+20", "无效", 60],
  ]);
  assert(!trigger("排序 B 列").hasAttribute("data-sort-direction"));
  assert(trigger("筛选 C 列").hasAttribute("data-column-filtered"));
  assert(grid.vm.undo());
  await nextTick();
  assert.equal(trigger("排序 B 列").dataset.sortDirection, "desc");
  grid.props.readonly = true;
  await nextTick();
  assert.equal(trigger("筛选 C 列"), null);
  assert(grid.find('th[data-column-key="2"] [data-column-filtered]'));
});

test("Spreadsheet clears repeated sorts after row changes and accepts order from a saved workbook", async () => {
  const sort = (grid, column) => grid.vm.manageData({
    type: "sort", keys: [{ column }], header: true,
  });
  const data = {
    sheets: [{ id: "s", name: "Sheet", rows: [["名称", "金额"], ["C", 30], ["A", 10], ["B", 20]] }],
  };
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: data });
  assert(sort(grid, 0));
  assert(grid.vm.manageAxis({ type: "insert", axis: "row", index: 2 }));
  assert(grid.vm.setCells([{ row: 2, column: 0, value: "D" }, { row: 2, column: 1, value: 40 }]));
  assert(grid.vm.manageAxis({ type: "delete", axis: "row", index: 3 }));
  assert(sort(grid, 1));
  const saved = JSON.parse(JSON.stringify(grid.vm.getWorkbook()));
  const reopened = await mount(ui.HysSpreadsheet, { defaultWorkbook: saved });
  assert(reopened.vm.manageData({ type: "clearSort" }));
  assert.deepEqual(reopened.vm.getWorkbook().sheets[0].rows.map((row) => row[0]), ["名称", "C", "D", "A"]);
  assert(!reopened.vm.manageData({ type: "clearSort" }));

  delete saved.sheets[0].sortRowOrder;
  const legacy = await mount(ui.HysSpreadsheet, { defaultWorkbook: saved });
  assert(legacy.vm.manageData({ type: "clearSort" }));
  assert.equal(legacy.vm.getWorkbook().sheets[0].sortKeys, undefined);
  assert.deepEqual(legacy.vm.getWorkbook().sheets[0].rows, saved.sheets[0].rows);
});

test("Spreadsheet column indicators track sort priority, filters, moves and undo", async () => {
  const grid = await mount(ui.HysSpreadsheet, {
    defaultWorkbook: { sheets: [
      { id: "s", name: "Sheet", rows: [["姓名", "金额", "状态"], ["甲", 150, "确认"], ["乙", 50, "待定"]] },
      { id: "other", name: "Other", rows: [[1, 2]] },
    ] },
  });
  const header = (index) => grid.find(`thead th[data-column-key="${index}"]`);
  const sort = (index) => header(index).querySelector("[data-sort-direction]");
  const filtered = (index) => !!header(index).querySelector("[data-column-filtered]");
  assert(grid.vm.manageData({ type: "sort", header: true, keys: [
    { column: 1, direction: "desc" }, { column: 0 },
  ] }));
  await nextTick();
  assert.equal(sort(1).dataset.sortDirection, "desc");
  assert.equal(sort(1).textContent.trim(), "1");
  assert.equal(sort(0).dataset.sortDirection, "asc");
  assert.equal(sort(0).textContent.trim(), "2");
  assert(grid.vm.manageData({
    type: "filter", header: true,
    filters: [{ column: 1, operator: "gt", value: 100 }],
  }));
  await nextTick();
  assert(filtered(1));
  assert.match(header(1).querySelector("button").getAttribute("aria-description"), /已按降序排序.*已应用筛选/);
  assert(grid.vm.manageAxis({ type: "move", axis: "column", index: 1, to: 2 }));
  await nextTick();
  assert.equal(sort(1), null);
  assert.equal(sort(2).dataset.sortDirection, "desc");
  assert(filtered(2));
  assert(grid.vm.manageData({ type: "filter", filters: [] }));
  await nextTick();
  assert(!filtered(2));
  assert(grid.vm.undo());
  await nextTick();
  assert(filtered(2));
  await fire(grid.find('[role="tab"][aria-label="Other"]') ?? grid.all('[role="tab"]')[1], "click");
  assert.equal(sort(0), null);
  assert(!filtered(1));
  await fire(grid.all('[role="tab"]')[0], "click");
  assert(filtered(2));
  assert.equal(sort(2).textContent.trim(), "1");
});

test("Spreadsheet moves relative formulas with sorted rows and supports duplicate-only validation", async () => {
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: {
    sheets: [{ id: "s", name: "Sheet", rows: [["Key", "Units", "Total"], ["b", 3, "=B2*$B$4"], ["a", 5, "=B3*$B$4"], ["a", 2]],
      cells: { A3: { validation: { duplicate: true } } },
      conditionalFormats: [{ range: "B2:B4", type: "heatmap" }],
    }],
  } });
  assert(grid.vm.selectRange("A1", "C3"));
  assert(grid.vm.manageData({ type: "sort", header: true, keys: [{ column: 0 }] }));
  await nextTick();
  const sheet = grid.vm.getWorkbook().sheets[0];
  assert.deepEqual(sheet.rows[1], ["a", 5, "=B2*$B$4"]);
  assert.deepEqual(sheet.rows[2], ["b", 3, "=B3*$B$4"]);
  assert.equal(grid.vm.setCells([{ row: 1, column: 0, value: "c" }]), false);
  assert.equal(grid.vm.setCells([{ row: 1, column: 0, value: "b" }]), true);
});

test("Spreadsheet sorts formula results without moving or breaking the totals row", async () => {
  const rows = [
    ["项目", "单价", "数量", "小计", "自本表取值", "跨表取值"],
    ["办公用品", 180, 6, "=B2*C2", "=SUM(B2:C2)", "=Rates!A2"],
    ["培训课程", 800, 3, "=B3*C3", "=SUM(B3:C3)", "=Rates!A3"],
    ["设备维护", 460, 2, "=B4*C4", "=SUM(B4:C4)", "=Rates!A4"],
    ["合计", null, null, "=SUM(D2:D4)"],
  ];
  const grid = await mount(ui.HysSpreadsheet, { defaultWorkbook: { sheets: [
    { id: "budget", name: "Budget", rows },
    { id: "rates", name: "Rates", rows: [["费率"], [10], [20], [30]] },
  ] } });
  const cellText = (row, column) => grid.all(`tbody td[data-column-key="${column}"]`)[row].textContent.trim();
  const names = () => grid.vm.getWorkbook().sheets[0].rows.map((row) => row[0]);
  await fire(grid.find('button[aria-label="排序 D 列"]'), "click");
  const descending = [...document.querySelectorAll('.column-data-menu button')]
    .find((node) => node.textContent.trim() === "降序");
  await fire(descending, "click");
  assert.deepEqual(names(), ["项目", "培训课程", "办公用品", "设备维护", "合计"]);
  const sorted = grid.vm.getWorkbook().sheets[0].rows;
  assert.deepEqual(sorted[1].slice(3), ["=B2*C2", "=SUM(B2:C2)", "=Rates!A3"]);
  assert.equal(sorted[4][3], "=SUM(D2:D4)");
  assert.equal(cellText(1, 3), "2400");
  assert.equal(cellText(4, 3), "4400");

  assert(grid.vm.manageData({
    type: "filter", header: true, filters: [{ column: 3, operator: "lt", value: 2000 }],
  }));
  await nextTick();
  assert.deepEqual(grid.all('tbody td[data-column-key="0"]').map((node) => node.textContent.trim()),
    ["项目", "办公用品", "设备维护", "合计"]);
  assert.equal(cellText(3, 3), "4400");
  assert(grid.vm.manageData({ type: "filter", filters: [] }));
  await nextTick();

  assert(grid.vm.selectRange("A2", "F5"));
  assert(grid.vm.manageData({ type: "sort", keys: [{ column: 3, direction: "asc" }] }));
  await nextTick();
  assert.deepEqual(names(), ["项目", "设备维护", "办公用品", "培训课程", "合计"]);
  assert.equal(cellText(4, 3), "4400");
  assert(grid.vm.manageData({ type: "clearSort" }));
  await nextTick();
  assert.deepEqual(grid.vm.getWorkbook().sheets[0].rows, rows);
  assert.equal(cellText(4, 3), "4400");

  const padded = await mount(ui.HysSpreadsheet, { defaultWorkbook: {
    sheets: [{ id: "budget", name: "Budget", rows: [...rows.map((row) => row.slice(0, 4)), [], []] }],
  } });
  assert(padded.vm.manageData({ type: "sort", header: true, keys: [{ column: 3, direction: "desc" }] }));
  await nextTick();
  assert.deepEqual(padded.vm.getWorkbook().sheets[0].rows.slice(4), [rows[4], [], []]);
});

test("ProGrid commits in the cell and moves in both directions with Tab", async () => {
  const grid = await mount(ui.HysProGrid, {
    rows: [{ id: 1, title: "First", amount: 20 }],
    rowKey: "id",
    columns: [
      { key: "title", label: "Title", editor: { type: "text" } },
      { key: "amount", label: "Amount", editor: { type: "number" } },
    ],
    gridOptions: { selectable: true, cellClassName: () => "custom-cell" },
  });
  const title = grid.find('td[data-column-key="title"]');
  const amount = grid.find('td[data-column-key="amount"]');
  title.focus();
  await fire(title, "keydown", { key: "Enter" });
  assert(title.classList.contains("custom-cell"));
  assert(title.classList.contains("hys-ui-pro-grid-cell-active"));
  const firstInput = title.querySelector("input[data-pro-grid-input]");
  firstInput.value = "Updated";
  await fire(firstInput, "input");
  await fire(firstInput, "keydown", { key: "Tab" });
  await nextTick();
  await nextTick();
  assert.equal(grid.events.cellCommit.at(-1)[0].value, "Updated");
  assert.equal(document.activeElement, amount);
  assert(!title.classList.contains("hys-ui-pro-grid-cell-active"));
  await fire(amount, "keydown", { key: "F2" });
  const secondInput = amount.querySelector("input[data-pro-grid-input]");
  await fire(secondInput, "keydown", { key: "Tab", shiftKey: true });
  await nextTick();
  await nextTick();
  assert.equal(document.activeElement, title);
  await fire(title, "keydown", { key: "F2" });
  await fire(title.querySelector("input[data-pro-grid-input]"), "keydown", {
    key: "Escape",
  });
  assert.equal(grid.events.editCancel.at(-1)[1], "cancel");
  assert.equal(grid.vm.editing, null);
  assert.equal(document.activeElement, title);
});

test("ProGrid cancels stale async work when the host replaces a row or the view changes", async () => {
  let resolve;
  let signal;
  let saves = 0;
  const grid = await mount(ui.HysProGrid, {
    rows: [{ id: 1, amount: 20 }],
    rowKey: "id",
    columns: [
      {
        key: "amount",
        label: "Amount",
        editor: { type: "number" },
        validate(change, context) {
          signal = context.signal;
          return new Promise((accept) => {
            resolve = accept;
          });
        },
      },
    ],
    saveCell() {
      saves++;
    },
  });
  await fire(grid.find(".hys-ui-pro-grid-edit"), "click");
  let result = grid.vm.commitEdit();
  assert.equal(await grid.vm.commitEdit(), false);
  grid.props.rows = [{ id: 1, amount: 20 }];
  await nextTick();
  assert.equal(signal.aborted, true);
  assert.equal(grid.events.editCancel.at(-1)[1], "data-change");
  resolve(true);
  assert.equal(await result, false);
  await fire(grid.find(".hys-ui-pro-grid-edit"), "click");
  result = grid.vm.commitEdit();
  grid.vm.setQuery({ search: "missing" });
  await nextTick();
  assert.equal(signal.aborted, true);
  assert.equal(grid.events.editCancel.at(-1)[1], "view-change");
  resolve(true);
  assert.equal(await result, false);
  assert.equal(saves, 0);
  assert.equal(grid.events.cellCommit, undefined);
});

test("ProGrid ignores a late save when the edited column is hidden", async () => {
  let finishSave;
  let signal;
  const grid = await mount(ui.HysProGrid, {
    rows: [{ id: 1, amount: 20 }],
    rowKey: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "amount", label: "Amount", editor: { type: "number" } },
    ],
    saveCell(change, context) {
      signal = context.signal;
      assert.equal(change.value, 25);
      return new Promise((resolve) => {
        finishSave = resolve;
      });
    },
  });
  await fire(grid.find(".hys-ui-pro-grid-edit"), "click");
  const input = grid.find("[data-pro-grid-input]");
  input.value = "25";
  await fire(input, "input");
  const result = grid.vm.commitEdit();
  grid.vm.applyColumnLayout({ hidden: ["amount"] });
  await nextTick();
  assert.equal(signal.aborted, true);
  assert.equal(grid.vm.editing, null);
  assert.equal(grid.events.editCancel.at(-1)[1], "view-change");
  finishSave(true);
  assert.equal(await result, false);
  assert.equal(grid.events.cellCommit, undefined);
  assert.equal(grid.props.rows[0].amount, 20);
});

test("ProGrid blocks editing missing and duplicate keys but keeps all DataGrid rows visible", async () => {
  const grid = await mount(ui.HysProGrid, {
    rows: [{ id: 1, amount: 20 }, { id: 1, amount: 30 }, { amount: 40 }],
    rowKey: "id",
    columns: [{ key: "amount", label: "Amount", editor: { type: "number" } }],
  });
  assert.equal(grid.all("tbody [data-grid-row]").length, 3);
  assert.equal(grid.all(".hys-ui-pro-grid-edit").length, 0);
  await fire(grid.find("tbody td[data-column-key='amount']"), "keydown", {
    key: "F2",
  });
  assert.equal(grid.vm.editing, null);
});

test("DataGrid column layout snapshots respect visibility and width constraints", async () => {
  const grid = await mount(ui.HysDataGrid, {
    columns: [
      { key: "id", label: "ID", pinned: "left", hideable: false },
      { key: "title", label: "Title", minWidth: 100, maxWidth: 220 },
      { key: "state", label: "State" },
    ],
    rows: [{ id: 1, title: "Review", state: "Open" }],
  });
  grid.vm.applyColumnLayout({
    order: ["state", "title", "missing"],
    hidden: ["id", "state"],
    widths: { title: 900 },
  });
  await nextTick();
  assert.deepEqual(grid.vm.getColumnLayout(), {
    order: ["state", "title", "id"],
    hidden: ["state"],
    widths: { title: 220 },
  });
  assert.deepEqual(
    grid.all("thead th[data-column-key]").map((cell) => cell.dataset.columnKey),
    ["id", "title"],
  );
  const snapshot = grid.events.columnLayoutChange.at(-1)[0];
  snapshot.order.length = 0;
  assert.equal(grid.vm.getColumnLayout().order.length, 3);
  grid.vm.resetColumns();
  await nextTick();
  assert.deepEqual(grid.vm.getColumnLayout().hidden, []);
});

test("DataGrid groups visible headers and keeps fixed column overrides in layout snapshots", async () => {
  const group = { key: "amounts", label: "金额" };
  const grid = await mount(ui.HysDataGrid, {
    columns: [
      {
        key: "id",
        label: "ID",
        pinned: "left",
        pinnable: false,
        hideable: false,
      },
      { key: "net", label: "Net", group, minWidth: 100, maxWidth: 220 },
      { key: "tax", label: "Tax", group },
    ],
    rows: [{ id: 1, net: 100, tax: 20 }],
  });
  assert.equal(grid.find("th[scope='colgroup']").getAttribute("colspan"), "2");
  assert.equal(grid.vm.pinColumn("id", null), false);
  assert.equal(grid.vm.pinColumn("tax", "right"), true);
  await nextTick();
  assert.deepEqual(
    grid.all("th[scope='colgroup']").map((th) => th.colSpan),
    [1, 1],
  );
  assert.equal(grid.find("thead th[data-column-key='tax']").style.right, "0px");
  assert.equal(grid.vm.resizeColumn("net", 300), true);
  assert.equal(grid.vm.setColumnVisibility("net", false), true);
  const snapshot = grid.vm.getColumnLayout();
  assert.deepEqual(snapshot.pins, { tax: "right" });
  assert.deepEqual(snapshot.widths, { net: 220 });
  grid.vm.resetColumns();
  grid.vm.applyColumnLayout(snapshot);
  await nextTick();
  assert.deepEqual(grid.vm.getColumnLayout(), snapshot);
  assert.equal(grid.find("thead th[data-column-key='net']"), null);
  assert.equal(grid.vm.resetColumnWidth("net"), true);
  assert.deepEqual(grid.vm.getColumnLayout().widths, {});
});

test("DataGrid separates current row from selection and reports typed context menu targets", async () => {
  const grid = await mount(ui.HysDataGrid, {
    columns: [{ key: "name", label: "Name" }],
    rows: [
      { id: 1, name: "One" },
      { id: "1", name: "Text one" },
    ],
    highlightCurrentRow: true,
    currentRowKey: null,
    contextMenu: () => false,
  });
  const cell = grid.find(
    "[data-grid-row='string:1'] td[data-column-key='name']",
  );
  await fire(cell, "click");
  assert.equal(grid.vm.getCurrentRowKey(), "1");
  assert.deepEqual(grid.vm.getSelection(), []);
  assert.equal(cell.parentElement.getAttribute("aria-current"), "true");
  const event = new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
  });
  assert.equal(cell.dispatchEvent(event), true);
  assert.equal(grid.events.cellContextmenu.at(-1)[0].value, "Text one");
  assert.equal(grid.events.rowContextmenu.length, 1);
  assert.equal(grid.events.rowContextmenu.at(-1)[0].rowKey, "1");
  grid.vm.setCurrentRow(null);
  await nextTick();
  assert.equal(cell.parentElement.hasAttribute("aria-current"), false);
});

test("DataGrid separates group and footer summaries and navigates only visible rows", async () => {
  const grid = await mount(ui.HysDataGrid, {
    columns: [
      { key: "team", label: "Team" },
      { key: "hours", label: "Hours", summary: "sum" },
    ],
    rows: [
      { id: 1, team: "A", hours: 2 },
      { id: 2, team: "A", hours: 4 },
      { id: 3, team: "B", hours: 8 },
    ],
    pageSize: 2,
    groupBy: "team",
    groupSummary: true,
    showSummary: true,
    summaryScope: "page",
    keyboardNavigation: true,
  });
  assert.match(
    grid.find(".hys-ui-pf-grid-group-summary").textContent,
    /Hours 6/,
  );
  assert.match(grid.find("tfoot").textContent, /6/);
  assert.equal(grid.vm.focusRow(1), true);
  await fire(document.activeElement, "keydown", { key: "End" });
  await fire(document.activeElement, "keydown", { key: " " });
  assert.deepEqual(grid.vm.getSelection(), [2]);
  grid.props.summaryScope = "selected";
  await nextTick();
  assert.match(grid.find("tfoot").textContent, /4/);
  grid.vm.setGroupsExpanded(false);
  await nextTick();
  assert.equal(grid.all("tr[data-grid-row]").length, 0);
  assert.equal(grid.vm.focusRow(1), false);
  assert.match(
    grid.find(".hys-ui-pf-grid-group-summary").textContent,
    /Hours 6/,
  );
  grid.vm.setGroupsExpanded(true);
  grid.vm.setGroupBy("");
  await nextTick();
  assert.deepEqual(grid.events.groupChange.at(-1), [""]);
  assert.equal(grid.all("tr[data-grid-row]").length, 2);
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

test("DataGrid keyboard editing obeys per-cell permissions and edits the raw value", async () => {
  const grid = await mount(ui.HysDataGrid, {
    columns: [
      {
        key: "stock",
        label: "Stock",
        editable: ({ row }) => !row.locked,
        formatter: ({ value }) => `${value} units`,
      },
      { key: "note", label: "Note", wrap: true },
    ],
    rows: [
      { id: 1, stock: 0, locked: false },
      { id: 2, stock: 8, locked: true },
    ],
    cellNavigation: true,
    editable: true,
    selectable: true,
    defaultSelectedRowKeys: [1, 2],
    emptyCellText: "—",
  });
  assert.equal(grid.vm.focusCell(2, "stock"), true);
  assert.equal(document.activeElement.textContent.trim(), "8 units");
  await fire(document.activeElement, "keydown", { key: "F2" });
  assert.equal(grid.find('[aria-label="编辑Stock"]'), null);
  await fire(document.activeElement, "keydown", { key: "ArrowUp" });
  const cell = document.activeElement;
  assert.equal(cell.textContent.trim(), "0 units");
  await fire(cell, "keydown", { key: "F2" });
  const editor = grid.find('[aria-label="编辑Stock"]');
  assert.equal(editor, document.activeElement);
  assert.equal(editor.value, "0");
  editor.value = "12";
  await fire(editor, "input");
  await fire(editor, "keydown", { key: "Enter" });
  assert.equal(document.activeElement, cell);
  assert.deepEqual(
    grid.events.cellEdit.map(([{ rowKey, column, value }]) => ({
      rowKey,
      column,
      value,
    })),
    [{ rowKey: 1, column: "stock", value: "12" }],
  );
  await fire(cell, "keydown", { key: "ArrowRight" });
  assert.equal(document.activeElement.textContent.trim(), "—");
  await fire(grid.find('[aria-label="批量编辑字段"]'), "click");
  await pause(10);
  await fire(
    [...document.querySelectorAll('[role="option"]')].find(
      (node) => node.textContent.trim() === "Stock",
    ),
    "click",
  );
  const batchValue = grid.find('[aria-label="批量编辑值"]');
  batchValue.value = "30";
  await fire(batchValue, "input");
  await fire(
    grid
      .all("button")
      .find((button) => button.textContent.trim() === "应用到 1 行"),
    "click",
  );
  assert.deepEqual(grid.events.batchEdit, [
    [{ keys: [1], column: "stock", value: "30" }],
  ]);
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
