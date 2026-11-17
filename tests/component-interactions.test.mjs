import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "navigator",
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
  "DOMRect",
]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: dom.window[name],
  });
}
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
HTMLElement.prototype.getBoundingClientRect = () =>
  new DOMRect(40, 80, 170, 35);
HTMLElement.prototype.getClientRects = function () {
  return [this.getBoundingClientRect()];
};

const { createApp, h, reactive, nextTick } = await import("vue");
const ui = await import("../packages/ui/dist/index.js");
let dispose;
afterEach(() => {
  dispose?.();
  dispose = undefined;
});

async function settle() {
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
    await nextTick();
  }
}
async function mount(component, input, bindings = [], slots) {
  const host = document.createElement("div");
  document.body.append(host);
  const props = reactive(input);
  const events = [];
  const handlers = {};
  const supports = (name) =>
    Array.isArray(component.emits)
      ? component.emits.includes(name)
      : Object.hasOwn(component.emits ?? {}, name);
  for (const name of [
    "modelValue",
    "open",
    "openKeys",
    "selectedKeys",
    "expandedKeys",
    "values",
    "view",
    "page",
  ]) {
    if (!supports("update:" + name)) continue;
    handlers["onUpdate:" + name] = (value) => {
      events.push(["update:" + name, value]);
      if (bindings.includes(name)) props[name] = value;
    };
  }
  for (const [prop, name] of [
    ["onChange", "change"],
    ["onSelect", "select"],
    ["onInvalid", "invalid"],
    ["onClose", "close"],
    ["onSearch", "search"],
    ["onReset", "reset"],
    ["onAction", "action"],
    ["onClearSelection", "clearSelection"],
    ["onSelectAll", "selectAll"],
    ["onConfirm", "confirm"],
    ["onCancel", "cancel"],
    ["onExpand", "expand"],
    ["onCollapse", "collapse"],
  ])
    if (supports(name))
      handlers[prop] = (...values) => events.push([name, ...values]);

  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () => h(component, { ...props, ...handlers }, slots);
    },
  });
  app.mount(host);
  dispose = () => {
    app.unmount();
    host.remove();
  };
  await settle();
  return { host, props, events };
}

function button(container, label) {
  const match = [...container.querySelectorAll("button")].find(
    (element) =>
      (element.getAttribute("aria-label") || element.textContent.trim()) ===
      label,
  );
  assert(match, "Missing button " + label);
  return match;
}
async function press(node, key, modifiers = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  });
  node.dispatchEvent(event);
  await settle();
  return event.defaultPrevented;
}
async function fill(input, text) {
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
}

test("RecordPicker reserves draft keys across externally supplied pages and commits only on confirmation", async () => {
  const app = await mount(
    ui.HysRecordPicker,
    {
      open: true,
      modelValue: [],
      multiple: true,
      rows: [
        { id: 0, name: "First" },
        { id: 2, name: "Blocked", blocked: true },
      ],
      columns: [{ key: "name", label: "Name" }],
      page: 1,
      pageSize: 2,
      total: 4,
      rowDisabled: (row) => row.blocked,
      labels: {
        confirm: "Accept",
        cancel: "Dismiss",
        selected: "Selected {count}",
      },
    },
    ["open", "modelValue", "page"],
  );
  function row(text) {
    const item = [...document.querySelectorAll("tbody tr")].find((entry) =>
      entry.textContent.includes(text),
    );
    assert(item, "Missing record " + text);
    return item.querySelector("input[type=checkbox]");
  }
  assert.equal(row("Blocked").disabled, true);
  row("First").click();
  await settle();
  button(document, "下一页").click();
  await settle();
  assert.equal(app.props.page, 2);
  app.props.rows = [
    { id: "0", name: "Second" },
    { id: "0", name: "Duplicate" },
  ];
  await settle();
  assert(!document.querySelector("tbody").textContent.includes("Duplicate"));
  row("Second").click();
  await settle();
  assert.deepEqual(app.props.modelValue, []);
  button(document, "上一页").click();
  app.props.rows = [{ id: 0, name: "First" }];
  await settle();
  assert.equal(row("First").checked, true);
  button(document, "Accept").click();
  await settle();
  assert.deepEqual(app.props.modelValue, [0, "0"]);
  assert.deepEqual(
    app.events.filter(([event]) => event === "confirm"),
    [["confirm", [0, "0"]]],
  );
  app.props.open = true;
  await settle();
  row("First").click();
  await settle();
  button(document, "Dismiss").click();
  await settle();
  assert.deepEqual(app.props.modelValue, [0, "0"]);
  assert.deepEqual(
    app.events.filter(([event]) => event === "cancel"),
    [["cancel"]],
  );
});

test("TreeTable skips invalid children and cycles, accepts expanded keys, and never promotes children during sorting", async () => {
  const root = { id: 1, label: "Root", rank: 10 };
  const other = { id: "1", label: "Other root", rank: 20 };
  const branch = {
    id: 2,
    label: "Branch",
    rank: 5,
    items: [{ id: 3, label: "Grandchild", rank: 0 }, root],
  };
  root.items = [
    branch,
    { id: 4, label: "First child", rank: 3, items: "invalid" },
    { id: 2, label: "Duplicate", rank: 1 },
    null,
  ];
  const app = await mount(
    ui.HysTreeTable,
    {
      data: [root, other],
      childrenKey: "items",
      expandedKeys: [],
      columns: [
        { key: "label", label: "Label" },
        { key: "rank", label: "Rank", sortable: true },
      ],
      locale: {
        expand: "Expand ",
        collapse: "Collapse ",
        sortAsc: "Ascending {label}",
      },
    },
    ["expandedKeys"],
  );
  button(app.host, "Expand Root").click();
  await settle();
  assert.deepEqual(app.props.expandedKeys, [1]);
  assert.equal(app.events.filter(([event]) => event === "expand").length, 1);
  app.props.expandedKeys = [1, 2];
  await settle();
  const names = () =>
    [...app.host.querySelectorAll("tbody tr")].map((row) =>
      row.cells[0].textContent.trim(),
    );
  assert.deepEqual(names(), [
    "Root",
    "Branch",
    "Grandchild",
    "First child",
    "Other root",
  ]);
  button(app.host, "Ascending Rank").click();
  await settle();
  assert.deepEqual(names(), [
    "Root",
    "First child",
    "Branch",
    "Grandchild",
    "Other root",
  ]);
  button(app.host, "Collapse Root").click();
  await settle();
  assert.deepEqual(names(), ["Root", "Other root"]);
  assert.equal(app.host.querySelector("table").getAttribute("role"), null);
});

test("FilterBar keeps collapsed fields, snapshots input, and restores current initial values", async () => {
  const initial = { keyword: "initial", regions: ["east"] };
  const app = await mount(
    ui.HysFilterBar,
    {
      values: { keyword: "old", regions: ["north"] },
      initialValues: initial,
      collapsedCount: 1,
      fields: [
        { key: "keyword", label: "Keyword", type: "text" },
        { key: "regions", label: "Regions", type: "custom" },
      ],
      labels: {
        search: "Search",
        reset: "Reset",
        expand: "Expand",
        collapse: "Collapse",
      },
    },
    ["values"],
    { field: ({ value }) => h("span", { class: "regions" }, value.join(",")) },
  );
  const input = app.host.querySelector("input");
  await fill(input, "current");
  button(app.host, "Expand").click();
  await settle();
  assert.equal(app.host.querySelector(".regions").textContent, "north");
  button(app.host, "Collapse").click();
  button(app.host, "Search").click();
  await settle();
  const [search] = app.events.filter(([event]) => event === "search");
  assert.deepEqual(search, [
    "search",
    { keyword: "current", regions: ["north"] },
  ]);
  search[1].regions.push("west");
  assert.deepEqual(app.props.values.regions, ["north"]);
  app.props.loading = true;
  await settle();
  assert.equal(button(app.host, "Search").disabled, true);
  button(app.host, "Reset").click();
  assert.equal(app.events.filter(([event]) => event === "reset").length, 0);
  app.props.loading = false;
  await settle();
  button(app.host, "Reset").click();
  await settle();
  assert.deepEqual(app.props.values, initial);
  assert.equal(input.value, "initial");
  assert.equal(app.events.filter(([event]) => event === "reset").length, 1);
  assert.deepEqual(initial.regions, ["east"]);
});

test("ActionBar cancels and confirms dangerous actions, respects loading, and accepts zero keys", async () => {
  const app = await mount(ui.HysActionBar, {
    selectedCount: 2,
    maxVisibleActions: 3,
    actions: [
      {
        key: 0,
        label: "Remove",
        variant: "danger",
        confirm: {
          title: "Confirm removal",
          confirmText: "Confirm",
          cancelText: "Cancel",
        },
      },
      { key: 1, label: "Send", loading: true, overflow: true },
    ],
    visibleWhenEmpty: true,
    labels: { selected: "{count} checked", clear: "Clear", more: "More" },
  });
  assert.equal(
    app.host.querySelector('[role="status"]').textContent.trim(),
    "2 checked",
  );
  const remove = button(app.host, "Remove");
  remove.click();
  await settle();
  assert.equal(app.events.filter(([event]) => event === "action").length, 0);
  button(document.body, "Cancel").click();
  await settle();
  assert.equal(app.events.filter(([event]) => event === "action").length, 0);
  remove.click();
  await settle();
  button(document.body, "Confirm").click();
  await settle();
  assert.deepEqual(
    app.events.filter(([event]) => event === "action"),
    [["action", 0]],
  );
  button(app.host, "Clear").click();
  assert.deepEqual(
    app.events.filter(([event]) => event === "clearSelection"),
    [["clearSelection"]],
  );
  app.props.loading = true;
  await settle();
  assert.equal(remove.disabled, true);
  assert.equal(button(app.host, "More").disabled, true);
  app.props.loading = false;
  app.props.selectedCount = 0;
  await settle();
  assert.equal(remove.disabled, true);
  assert.equal(
    app.host.querySelector('[role="status"]').textContent.trim(),
    "0 checked",
  );
});

test("ActionBar can select all from an empty selection and keeps clear as a separate action", async () => {
  const app = await mount(ui.HysActionBar, {
    selectedCount: 0,
    totalCount: 9,
    showSelectAll: true,
  });
  button(app.host, "选择全部 9 项").click();
  assert.deepEqual(app.events, [["selectAll", 9]]);
  app.props.selectedCount = 3;
  await settle();
  assert.equal(app.host.querySelector("button button"), null);
  button(app.host, "清空选择").click();
  assert.deepEqual(app.events.at(-1), ["clearSelection"]);
  app.props.selectedCount = 9;
  await settle();
  assert.deepEqual(
    [...app.host.querySelectorAll("button")].map((node) =>
      node.textContent.trim(),
    ),
    ["清空选择"],
  );
});

test("DataView supports two view slots and switches mode without modifying the active page", async () => {
  const items = Object.freeze([
    { id: 1, title: "Release" },
    { id: 2, title: "Notes" },
  ]);
  const app = await mount(
    ui.HysDataView,
    {
      items,
      itemKey: "id",
      view: "list",
      page: 2,
      pageSize: 2,
      total: 8,
      labels: { list: "List", grid: "Grid", empty: "No tasks" },
    },
    ["view", "page"],
    {
      "list-item": ({ item }) => h("span", { class: "list-entry" }, item.title),
      "grid-item": ({ item }) =>
        h("strong", { class: "grid-entry" }, item.title),
    },
  );
  assert.equal(app.host.querySelectorAll(".list-entry").length, 2);
  const grid = [
    ...app.host.querySelectorAll('[role="radio"], [role="tab"]'),
  ].find((node) => node.textContent.trim() === "Grid");
  assert(grid);
  grid.click();
  await settle();
  assert.equal(app.props.view, "grid");
  assert.equal(app.props.page, 2);
  assert.equal(app.host.querySelectorAll(".grid-entry").length, 2);
  assert.deepEqual(
    app.events.filter(([event]) => event === "update:page"),
    [],
  );
  button(app.host, "下一页").click();
  await settle();
  assert.equal(app.props.page, 3);
  assert.equal(app.props.view, "grid");
  app.props.items = [];
  app.props.total = 0;
  app.props.loading = true;
  await settle();
  assert(app.host.querySelector('[aria-busy="true"]'));
  assert(!app.host.textContent.includes("No tasks"));
  app.props.loading = false;
  await settle();
  assert(app.host.textContent.includes("No tasks"));
});

test("Menu preserves controlled selection, handles typed keys, and exposes nested navigation with link semantics", async () => {
  const app = await mount(
    ui.HysMenu,
    {
      items: [
        { type: "group", label: "Workspace" },
        {
          key: 1,
          label: "Root",
          children: [
            {
              key: "1",
              label: "Nested",
              children: [
                {
                  key: "seek",
                  label: "Open guide",
                  href: "/guide",
                  target: "_blank",
                },
              ],
            },
          ],
        },
        { type: "divider" },
        { key: "read-only", label: "Unavailable", disabled: true },
        { key: "detail", label: "Details" },
      ],
      openKeys: [],
      selectedKeys: ["detail"],
    },
    ["openKeys"],
    {
      item: ({ label, selected }) => (selected ? h("strong", label) : label),
    },
  );
  const nav = app.host.querySelector("nav");
  assert(nav);
  assert(!nav.querySelector('[role="menu"]'));
  assert.equal(
    nav.querySelector('[aria-current="page"]').textContent.trim(),
    "Details",
  );
  const root = button(nav, "Root");
  root.focus();
  assert(await press(root, "ArrowRight"));
  assert.equal(document.activeElement.textContent.trim(), "Nested");
  assert.deepEqual(app.props.openKeys, [1]);
  await press(document.activeElement, "ArrowRight");
  const guide = nav.querySelector("a");
  assert.equal(document.activeElement, guide);
  assert.equal(guide.getAttribute("rel"), "noopener noreferrer");
  assert.deepEqual(app.props.openKeys, [1, "1"]);
  await press(guide, "ArrowLeft");
  assert.equal(document.activeElement.textContent.trim(), "Nested");
  assert.deepEqual(app.props.openKeys, [1]);

  button(nav, "Unavailable").click();
  assert(!app.events.some(([event]) => event === "select"));
  button(nav, "Details").click();
  assert.deepEqual(
    app.events.filter(([event]) => event === "select").map((e) => e[1]),
    ["detail"],
  );
  button(nav, "Nested").click();
  await settle();
  assert(nav.querySelector("a[href='/guide']"));
  app.props.selectedKeys = ["seek"];
  await settle();
  assert.equal(
    nav.querySelector('[aria-current="page"]'),
    nav.querySelector("a"),
  );
});

test("Menu action mode maintains roving tab order and emits a path for child actions", async () => {
  const app = await mount(ui.HysMenu, {
    mode: "actions",
    items: [
      { key: 0, label: "First" },
      { key: "stop", label: "Disabled", disabled: true },
      {
        key: "folder",
        label: "Folder",
        children: [{ key: "new", label: "Create" }],
      },
    ],
  });
  const menu = app.host.querySelector('[role="menu"]');
  assert(menu);
  assert.equal(
    menu.querySelector('[role="menuitem"][tabindex="0"]').textContent.trim(),
    "First",
  );
  const first = button(menu, "First");
  assert(await press(first, "ArrowDown"));
  const folder = document.activeElement;
  assert.equal(folder.textContent.trim(), "Folder");
  await press(folder, "ArrowRight");
  assert.equal(document.activeElement.textContent.trim(), "Create");
  document.activeElement.click();
  await settle();
  assert.deepEqual(
    app.events.find((e) => e[0] === "update:selectedKeys"),
    ["update:selectedKeys", ["new"]],
  );
  assert.deepEqual(
    app.events.find((e) => e[0] === "select")[2].path.map((item) => item.key),
    ["folder", "new"],
  );
  assert.equal(
    menu.querySelectorAll('[role="menuitem"][tabindex="0"]').length,
    1,
  );
});

test("Dropdown opens through the keyboard, portals its menu, closes after selection, and restores focus", async () => {
  const app = await mount(
    ui.HysDropdown,
    {
      open: false,
      label: "Operations",
      items: [
        { key: "blocked", label: "Blocked", disabled: true },
        { key: "copy", label: "Copy" },
        { key: "save", label: "Save" },
      ],
    },
    ["open"],
  );
  const trigger = button(app.host, "Operations");
  assert.equal(trigger.getAttribute("aria-haspopup"), "menu");
  trigger.focus();
  await press(trigger, "ArrowDown");
  assert.equal(app.props.open, true);
  const menu = document.querySelector('[role="menu"]');
  assert(menu && !app.host.contains(menu));
  assert.equal(trigger.getAttribute("aria-controls"), menu.id);
  assert.equal(document.activeElement, button(menu, "Copy"));
  await press(document.activeElement, "End");
  assert.equal(document.activeElement, button(menu, "Save"));
  document.activeElement.click();
  await settle();
  assert.equal(app.props.open, false);
  assert.equal(app.events.find((e) => e[0] === "select")[1], "save");
  assert.equal(document.activeElement, trigger);
  app.props.disabled = true;
  await settle();
  trigger.click();
  await settle();
  assert.equal(app.props.open, false);
});

test("TimePicker normalizes valid 24-hour inputs, rejects nonconforming text and clears to null", async () => {
  const app = await mount(ui.HysTimePicker, { modelValue: null }, [
    "modelValue",
  ]);
  const input = app.host.querySelector("input");
  for (const value of ["00:00", "09:05", "23:59"]) {
    await fill(input, value);
    await press(input, "Enter");
    assert.equal(app.props.modelValue, value);
  }
  await fill(input, "24:00");
  await press(input, "Enter");
  assert.equal(app.props.modelValue, "23:59");
  assert.deepEqual(app.events.at(-1), ["invalid", "24:00", "format"]);
  assert.equal(input.getAttribute("aria-invalid"), "true");
  app.props.minTime = "08:30";
  app.props.maxTime = "17:00";
  app.props.minuteStep = 15;
  await settle();
  await fill(input, "08:35");
  await press(input, "Enter");
  assert.deepEqual(app.events.at(-1), ["invalid", "08:35", "range"]);
  assert.equal(app.props.modelValue, "23:59");
  app.props.modelValue = "12:15";
  await settle();
  assert.equal(input.value, "12:15");
  assert.equal(input.getAttribute("aria-invalid"), null);
  button(app.host, "清空输入").click();
  await settle();
  assert.deepEqual(app.events.slice(-2), [
    ["update:modelValue", null],
    ["change", null],
  ]);
});

test("TimePicker panel exposes only valid options with seconds, supports keys, and applies one change", async () => {
  const app = await mount(
    ui.HysTimePicker,
    {
      modelValue: "08:45:10",
      showSeconds: true,
      minuteStep: 15,
      secondStep: 10,
      minTime: "08:45:10",
      maxTime: "09:00:20",
    },
    ["modelValue"],
  );
  const input = app.host.querySelector("input");
  await press(input, "ArrowDown");
  const panel = document.querySelector(".hys-time-panel");
  assert(panel);
  const values = (label) =>
    [...panel.querySelectorAll('[role="listbox"]')]
      .find(
        (box) =>
          document.getElementById(box.getAttribute("aria-labelledby"))
            .textContent === label,
      )
      .querySelectorAll('[role="option"]');
  assert.deepEqual(
    [...values("时")].map((option) => option.textContent.trim()),
    ["08", "09"],
  );
  assert.deepEqual(
    [...values("分")].map((option) => option.textContent.trim()),
    ["45"],
  );
  assert.equal(document.activeElement.textContent.trim(), "08");
  await press(document.activeElement, "ArrowDown");
  assert.equal(document.activeElement.textContent.trim(), "09");
  assert.deepEqual(
    [...values("分")].map((option) => option.textContent.trim()),
    ["00"],
  );
  assert.deepEqual(
    [...values("秒")].map((option) => option.textContent.trim()),
    ["00", "10", "20"],
  );
  await press(document.activeElement, "ArrowRight");
  await press(document.activeElement, "ArrowRight");
  await press(document.activeElement, "End");
  assert.equal(document.activeElement.textContent.trim(), "20");
  assert.equal(app.events.length, 0);
  button(panel, "确定").click();
  await settle();
  assert.deepEqual(app.events, [
    ["update:modelValue", "09:00:20"],
    ["change", "09:00:20"],
  ]);
  assert.equal(input.value, "09:00:20");
  app.props.readonly = true;
  await settle();
  assert(input.readOnly);
  assert(button(app.host, "打开时间面板").disabled);
});

test("TimePicker blocks a form from submitting an earlier accepted value while its draft is invalid", async () => {
  const model = reactive({ time: "09:30" });
  const results = [];
  const form = {
    setup() {
      return () =>
        h(
          ui.HysForm,
          {
            model,
            onSubmit: () => results.push("submitted"),
            onInvalid: (payload) => results.push(payload.errors.time),
          },
          () =>
            h(ui.HysFormItem, { label: "Time", prop: "time" }, () =>
              h(ui.HysTimePicker, {
                modelValue: model.time,
                minuteStep: 15,
                "onUpdate:modelValue": (value) => {
                  model.time = value;
                },
              }),
            ),
        );
    },
  };
  const app = await mount(form, {});
  const input = app.host.querySelector("input");
  const element = app.host.querySelector("form");
  async function submit() {
    element.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 12));
    await settle();
  }
  await fill(input, "09:34");
  await submit();
  assert.equal(model.time, "09:30");
  assert.deepEqual(results, ["时间不符合选择范围或步长"]);
  await fill(input, "09:45");
  await press(input, "Enter");
  await submit();
  assert.deepEqual(results, ["时间不符合选择范围或步长", "submitted"]);
  assert.equal(model.time, "09:45");
});

async function markImageLoaded(width, height) {
  const img = document.querySelector(".hys-image-photo");
  assert(img);
  Object.defineProperties(img, {
    naturalWidth: { value: width },
    naturalHeight: { value: height },
  });
  img.dispatchEvent(new Event("load"));
  await settle();
  return img;
}

test("ImageViewer starts at the requested image, fits large sources, resets transforms and closes", async () => {
  const app = await mount(
    ui.HysImageViewer,
    {
      open: true,
      initialIndex: 1,
      images: [
        { src: "/a.png", alt: "A" },
        { src: "/b.png", alt: "B" },
        { src: "/c.png", alt: "C" },
      ],
    },
    ["open"],
  );
  const dialog = document.querySelector('[role="dialog"]');
  assert(dialog);
  const stage = dialog.querySelector(".hys-image-stage");
  Object.defineProperties(stage, {
    clientWidth: { value: 620 },
    clientHeight: { value: 420 },
  });
  window.dispatchEvent(new Event("resize"));
  await settle();
  const selected = await markImageLoaded(4800, 2400);
  assert.equal(selected.alt, "B");
  assert.equal(parseFloat(selected.style.width), 604);
  button(dialog, "放大").click();
  await settle();
  assert.equal(parseFloat(selected.style.width), 755);
  button(dialog, "顺时针旋转").click();
  await settle();
  assert.equal(selected.getAttribute("data-rotation"), "90");
  button(dialog, "适应视口").click();
  await settle();
  assert.equal(selected.getAttribute("data-rotation"), "90");
  button(dialog, "重置变换").click();
  await settle();
  assert.equal(selected.getAttribute("data-rotation"), "0");
  assert.equal(parseFloat(selected.style.width), 604);
  await press(dialog, "ArrowRight");
  assert.deepEqual(
    app.events.find((e) => e[0] === "change"),
    ["change", 2],
  );
  const next = await markImageLoaded(2400, 4800);
  assert.equal(next.alt, "C");
  assert.equal(next.getAttribute("data-rotation"), "0");
  assert(button(dialog, "下一张").disabled);
  await press(dialog, "Escape");
  assert.equal(app.props.open, false);
  assert(app.events.some((e) => e[0] === "close"));
});

test("ImageViewer provides failure recovery and ignores obsolete image events", async () => {
  const app = await mount(ui.HysImageViewer, {
    defaultOpen: true,
    images: [{ src: "/missing.png", alt: "Missing" }],
  });
  const dialog = document.querySelector('[role="dialog"]');
  const first = dialog.querySelector("img");
  first.dispatchEvent(new Event("error"));
  await settle();
  assert.match(dialog.textContent, /图片加载失败/);
  button(dialog, "重试").click();
  await settle();
  assert.notEqual(dialog.querySelector("img"), first);
  first.dispatchEvent(new Event("error"));
  await settle();
  assert.doesNotMatch(dialog.textContent, /图片加载失败/);
  await markImageLoaded(640, 480);
  assert(!button(dialog, "放大").disabled);
  app.props.images = [];
  await settle();
  assert.match(dialog.textContent, /没有可预览的图片/);
});
