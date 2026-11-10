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
  "SVGElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "HTMLSelectElement",
  "HTMLTextAreaElement",
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
Object.defineProperty(document.documentElement, "clientWidth", {
  value: 1024,
  configurable: true,
});
Object.defineProperty(document.documentElement, "clientHeight", {
  value: 800,
  configurable: true,
});
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    x: 20,
    y: 20,
    left: 20,
    top: 20,
    right: 220,
    bottom: 60,
    width: 200,
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
const { createApp, h, reactive, ref, nextTick, KeepAlive } =
    await import("vue"),
  ui = await import("../packages/ui/dist/index.js"),
  apps = [];
const settle = async () => {
  for (let i = 0; i < 6; i++) await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await nextTick();
};
const pause = async (ms = 10) => {
  await new Promise((r) => setTimeout(r, ms));
  await settle();
};
afterEach(() => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount();
    host.remove();
  }
  document.body.replaceChildren();
});
async function mount(component, values = {}, slots = {}, accept = true) {
  const state = reactive(values),
    events = [],
    vm = ref(),
    host = document.createElement("div"),
    shown = ref(true);
  document.body.append(host);
  const handlers = {};
  for (const name of [
    "select",
    "dropdownSelect",
    "update:open",
    "visibleChange",
    "update:openPath",
    "openPathChange",
    "update:checkedKeys",
    "checkedChange",
    "update:selectedKeys",
    "selectionChange",
  ]) {
    handlers["on" + name[0].toUpperCase() + name.slice(1)] = (...args) => {
      events.push([name, ...args]);
      if (
        accept &&
        name.startsWith("update:") &&
        Object.hasOwn(values, name.slice(7))
      )
        state[name.slice(7)] = args[0];
    };
  }
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(KeepAlive, null, {
          default: () =>
            shown.value
              ? h(component, { ...state, ...handlers, ref: vm }, slots)
              : null,
        });
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  return {
    state,
    events,
    host,
    shown,
    get vm() {
      return vm.value;
    },
  };
}
const items = [
  { label: "Open", value: "open" },
  { label: "Blocked", value: "blocked", disabled: true },
  { label: "Save", value: "save" },
];
const menu = (values = {}, slots = {}, accept = true) =>
  mount(
    ui.HysContextMenu,
    { items, trigger: "click", ...values },
    { default: () => h(ui.HysButton, null, () => "Actions"), ...slots },
    accept,
  );
const rows = (level = 0) => [
  ...document.querySelectorAll(`[data-level="${level}"] [data-hys-menu-item]`),
];
const row = (label, level = 0) =>
  rows(level).find((el) => el.textContent.trim() === label);
const fire = async (el, type, values = {}) => {
  const Ctor = type.startsWith("key")
    ? KeyboardEvent
    : type.startsWith("focus")
      ? FocusEvent
      : MouseEvent;
  const e = new Ctor(type, { bubbles: true, cancelable: true, ...values });
  el.dispatchEvent(e);
  await settle();
  return e;
};
const key = (value) => fire(document.activeElement, "keydown", { key: value });
async function focused(label) {
  for (let i = 0; i < 50; i++) {
    if (document.activeElement.textContent.trim() === label) return;
    await pause(5);
  }
  assert.equal(document.activeElement.textContent.trim(), label);
}
test("Legacy context trigger, cursor positioning, disabled skipping and select(value) remain compatible", async () => {
  const a = await menu({ trigger: "contextmenu" });
  assert.equal(
    (
      await fire(a.host.firstElementChild, "contextmenu", {
        clientX: 100,
        clientY: 130,
      })
    ).defaultPrevented,
    true,
  );
  assert.equal(document.activeElement.textContent.trim(), "Open");
  await key("ArrowDown");
  assert.equal(document.activeElement.textContent.trim(), "Save");
  await key("Enter");
  assert.equal(a.events.find((e) => e[0] === "select")[1], "save");
  assert.equal(a.vm.open, false);
});
test("Click triggers and keyboard Home/End, repeated typeahead and disabled entries use roving focus", async () => {
  const a = await menu({ items: [...items, { label: "Send", value: "send" }] });
  await fire(a.host.querySelector("button"), "click");
  await key("End");
  assert.equal(document.activeElement.textContent.trim(), "Send");
  await key("Home");
  await key("s");
  assert.equal(document.activeElement.textContent.trim(), "Save");
  await key("s");
  assert.equal(document.activeElement.textContent.trim(), "Send");
  assert.equal(rows().filter((el) => el.tabIndex === 0).length, 1);
  await key("Escape");
  assert.equal(a.vm.open, false);
  assert.equal(document.activeElement, a.host.querySelector("button"));
});
test("Nested menus navigate both directions and retain raw item paths", async () => {
  const leaf = { label: "PDF", value: 0 },
    a = await menu({
      items: [
        {
          label: "Export",
          value: "export",
          children: [{ label: "Document", value: "doc", children: [leaf] }],
        },
      ],
    });
  await a.vm.show();
  await key("ArrowRight");
  assert.deepEqual([...a.vm.openPath], ["export"]);
  await focused("Document");
  await key("ArrowRight");
  assert.deepEqual([...a.vm.openPath], ["export", "doc"]);
  await focused("PDF");
  await key("ArrowLeft");
  await focused("Document");
  await key("ArrowRight");
  await focused("PDF");
  await key("Enter");
  const e = a.events.find((e) => e[0] === "select");
  assert.equal(e[1], 0);
  assert.equal(e[2].item.label, leaf.label);
  assert.deepEqual([...e[2].keys], ["export", "doc", 0]);
  assert.equal(e[2].path.length, 3);
});
test("RTL reverses submenu arrows and loopNavigation=false stops at the ends", async () => {
  const a = await menu({
    direction: "rtl",
    loopNavigation: false,
    items: [
      {
        label: "Parent",
        value: "p",
        children: [{ label: "Child", value: "c" }],
      },
    ],
  });
  await a.vm.show();
  await key("ArrowUp");
  assert.equal(document.activeElement.textContent.trim(), "Parent");
  await key("ArrowLeft");
  await focused("Child");
  await key("ArrowRight");
  await focused("Parent");
});
test("Groups, dividers, hidden and duplicate keys are normalized without mutating input", async () => {
  const data = [
      {
        label: "Group",
        type: "group",
        children: [
          { label: "Child", value: 0 },
          { label: "String", value: "0" },
        ],
      },
      { type: "divider" },
      { label: "Hidden", value: "hidden", hidden: true },
      { label: "Duplicate", value: 0 },
      {
        label: "Locked group",
        type: "group",
        disabled: true,
        children: [{ label: "Locked", value: "locked" }],
      },
    ],
    before = JSON.stringify(data),
    a = await menu({ items: data });
  await a.vm.show();
  assert.equal(rows().length, 3);
  assert.equal(document.querySelectorAll('[role="separator"]').length, 1);
  assert.equal(row("Locked").disabled, true);
  assert.equal(a.vm.getItems().length, 3);
  assert.equal(JSON.stringify(data), before);
});
test("Mapped fields preserve numeric identity, nested data, icons and original objects", async () => {
  const data = [
      {
        code: 1,
        meta: { name: "Parent" },
        nodes: [{ code: 2, meta: { name: "Child" } }],
      },
    ],
    a = await menu({
      items: data,
      fieldNames: { value: "code", label: "meta.name", children: "nodes" },
    });
  await a.vm.focusItem(2);
  assert.equal(document.activeElement.textContent.trim(), "Child");
  await key("Enter");
  const e = a.events.find((e) => e[0] === "select");
  assert.equal(e[1], 2);
  assert.equal(e[2].item.code, 2);
  assert.equal(e[2].path[0].code, 1);
});
test("Checkbox and independent radio groups update once and keep the menu open", async () => {
  const a = await menu({
    items: [
      { label: "Check", value: "check", type: "checkbox" },
      { label: "A", value: "a", type: "radio", checked: true },
      { label: "B", value: "b", type: "radio" },
      {
        label: "Other",
        value: "other",
        type: "radio",
        radioGroup: "other",
        checked: true,
      },
    ],
  });
  await a.vm.show();
  assert.deepEqual([...a.vm.checkedKeys], ["a", "other"]);
  await fire(row("Check"), "click");
  assert.deepEqual([...a.vm.checkedKeys], ["a", "other", "check"]);
  assert.equal(a.vm.open, true);
  await fire(row("B"), "click");
  assert.deepEqual([...a.vm.checkedKeys], ["other", "check", "b"]);
  assert.equal(row("B").getAttribute("aria-checked"), "true");
  assert.equal(row("A").getAttribute("aria-checked"), "false");
  assert.equal(a.events.filter((e) => e[0] === "checkedChange").length, 2);
});
test("Controlled checks and selection honor host refusals and emit no accepted-change events", async () => {
  const a = await menu(
    {
      checkedKeys: [],
      selectedKeys: [],
      selectable: true,
      hideOnClick: false,
      items: [
        { label: "Check", value: 1, type: "checkbox" },
        { label: "Select", value: 2 },
      ],
    },
    {},
    false,
  );
  await a.vm.show();
  await fire(row("Check"), "click");
  await fire(row("Select"), "click");
  assert.deepEqual([...a.vm.checkedKeys], []);
  assert.deepEqual([...a.vm.selectedKeys], []);
  assert.equal(
    a.events.filter((e) => ["checkedChange", "selectionChange"].includes(e[0]))
      .length,
    0,
  );
  assert.equal(a.vm.open, true);
});
test("Selectable multiple menus toggle individual keys and per-item close rules override defaults", async () => {
  const a = await menu({
    selectable: true,
    multiple: true,
    hideOnClick: false,
    items: [...items, { label: "Done", value: "done", closeOnSelect: true }],
  });
  await a.vm.show();
  await fire(row("Open"), "click");
  await fire(row("Save"), "click");
  await fire(row("Open"), "click");
  assert.deepEqual([...a.vm.selectedKeys], ["save"]);
  await fire(row("Done"), "click");
  assert.equal(a.vm.open, false);
});
test("Controlled open can reject showing and closing while visibleChange reports only actual state", async () => {
  const a = await menu({ open: false }, {}, false);
  assert.equal(await a.vm.show(), false);
  assert.equal(document.querySelector('[role="menu"]'), null);
  a.state.open = true;
  await settle();
  assert.equal(a.vm.open, true);
  assert.equal(await a.vm.hide(), false);
  assert.equal(a.vm.open, true);
  a.state.open = false;
  await settle();
  assert.equal(a.vm.open, false);
  assert.deepEqual(
    a.events.filter((e) => e[0] === "visibleChange").map((e) => e[1]),
    [true, false],
  );
});
test("Focus trigger Escape restoration does not reopen and blur never blurs an outside field", async () => {
  const a = await menu({ trigger: "focus" });
  a.host.querySelector("button").focus();
  await settle();
  assert.equal(a.vm.open, true);
  await key("Escape");
  assert.equal(a.vm.open, false);
  assert.equal(document.activeElement, a.host.querySelector("button"));
  const outside = document.createElement("input");
  document.body.append(outside);
  outside.focus();
  a.vm.blur();
  await settle();
  assert.equal(document.activeElement, outside);
});
test("Hover delays are cancellable and click-only submenus do not open on hover", async () => {
  const a = await menu({
    trigger: "hover",
    showDelay: 5,
    hideDelay: 5,
    submenuDelay: 0,
    submenuTrigger: "click",
    items: [{ label: "Parent", value: "p", children: items }],
  });
  await fire(a.host.firstElementChild, "pointerenter");
  await fire(a.host.firstElementChild, "pointerleave");
  await pause();
  assert.equal(a.vm.open, false);
  await fire(a.host.firstElementChild, "pointerenter");
  await pause();
  assert.equal(a.vm.open, true);
  await fire(row("Parent"), "pointerenter");
  await pause();
  assert.deepEqual([...a.vm.openPath], []);
  await fire(row("Parent"), "click");
  assert.deepEqual([...a.vm.openPath], ["p"]);
});
test("Disabled state closes without reopening and pending hover work is cleaned on page deactivation", async () => {
  const a = await menu({ trigger: "hover", showDelay: 10 });
  await a.vm.show();
  a.state.disabled = true;
  await settle();
  assert.equal(a.vm.open, false);
  a.state.disabled = false;
  await settle();
  assert.equal(a.vm.open, false);
  await fire(a.host.firstElementChild, "pointerenter");
  a.shown.value = false;
  await pause(25);
  assert.equal(document.querySelector('[role="menu"]'), null);
  a.shown.value = true;
  await settle();
  assert.equal(a.vm.open, false);
  await a.vm.show();
  assert.equal(a.vm.open, true);
});
test("Loading and data replacement reconcile focus and empty content remains keyboard dismissible", async () => {
  const a = await menu();
  await a.vm.show();
  await a.vm.focusItem("save");
  a.state.items = [{ label: "Replacement", value: "replacement" }];
  await settle();
  assert.equal(document.activeElement.textContent.trim(), "Replacement");
  a.state.loading = true;
  await settle();
  assert.equal(document.activeElement.getAttribute("role"), "menu");
  assert(document.querySelector('[role="status"]'));
  a.state.loading = false;
  a.state.items = [];
  await settle();
  assert.match(document.querySelector('[role="menu"]').textContent, /暂无操作/);
  await key("Escape");
  assert.equal(a.vm.open, false);
});
test("Header/footer controls, custom item/link slots and safe target links do not duplicate select events", async () => {
  const a = await menu(
    {
      items: [
        { label: "Docs", value: "docs", href: "#docs", target: "_blank" },
      ],
    },
    {
      header: () => h("strong", "Tools"),
      footer: ({ close }) =>
        h(ui.HysButton, { onClick: () => close() }, () => "Close"),
      link: ({ attrs, label }) =>
        h(
          "a",
          { ...attrs, onClick: [attrs.onClick, (e) => e.preventDefault()] },
          label,
        ),
    },
  );
  await a.vm.show();
  const link = row("Docs");
  assert.equal(link.tagName, "A");
  assert.match(link.rel, /noopener/);
  await fire(link, "click");
  assert.equal(a.events.filter((e) => e[0] === "select").length, 1);
  assert.equal(a.vm.open, false);
});
test("Imperative APIs target nested items, reject unknown keys and expose current normalized records", async () => {
  const a = await menu({
    items: [{ label: "Parent", value: "p", children: items }],
  });
  assert.equal(await a.vm.focusItem("save"), true);
  assert.deepEqual([...a.vm.openPath], ["p"]);
  assert.equal(await a.vm.focusItem("missing"), false);
  assert.equal(await a.vm.closeSubmenus(), true);
  assert.deepEqual([...a.vm.openPath], []);
  await a.vm.setCheckedKeys([0, 0, "0"]);
  assert.deepEqual([...a.vm.checkedKeys], [0, "0"]);
  await a.vm.setSelectedKeys(["open", "save"]);
  assert.deepEqual([...a.vm.selectedKeys], ["open"]);
  assert.equal(a.vm.getItems().length, 4);
});
test("Breadcrumb retains separators, disabled/current semantics and legacy select indices", async () => {
  const a = await mount(ui.HysBreadcrumb, {
    items: [
      { label: "Home", href: "#home", target: "_blank" },
      { label: "Blocked", href: "#blocked", disabled: true, separator: ">" },
      { label: "Current", href: "#current", showSeparator: false },
    ],
  });
  const link = a.host.querySelector("a");
  assert.equal(link.rel, "noopener noreferrer");
  await fire(link, "click");
  assert.equal(a.events.find((e) => e[0] === "select")[2], 0);
  assert.equal(
    a.host.querySelectorAll(".hys-ui-breadcrumb-separator").length,
    1,
  );
  assert.equal(
    a.host.querySelector(".hys-ui-breadcrumb-separator").textContent,
    ">",
  );
  assert.equal(
    a.host.querySelector('[aria-current="page"]').textContent,
    "Current",
  );
  assert.equal(a.host.querySelectorAll("a").length, 1);
});
test("Breadcrumb collapse preserves ancestor links and original indices without input mutation", async () => {
  const data = Array.from({ length: 7 }, (_, i) => ({
      label: "Level " + i,
      href: "#" + i,
    })),
    before = JSON.stringify(data),
    a = await mount(ui.HysBreadcrumb, {
      items: data,
      maxItems: 4,
      itemsBeforeCollapse: 1,
      itemsAfterCollapse: 2,
    });
  assert.equal(a.host.querySelectorAll("ol>li").length, 4);
  await fire(a.host.querySelector(".hys-ui-breadcrumb-overflow"), "click");
  await fire(row("Level 3"), "click");
  const e = a.events.find((e) => e[0] === "dropdownSelect");
  assert.equal(e[1].label, "Level 3");
  assert.equal(e[2].index, 3);
  assert.equal(e[2].source, "overflow");
  assert.equal(JSON.stringify(data), before);
});
test("Breadcrumb deep sibling menus use unique keys and report raw descendant paths", async () => {
  const branch = (prefix) => ({
      label: prefix,
      children: [
        {
          label: prefix + " child",
          children: [{ label: prefix + " leaf", href: "#leaf" }],
        },
      ],
    }),
    a = await mount(ui.HysBreadcrumb, {
      items: [
        { label: "Location", children: [branch("A"), branch("B")] },
        { label: "Current" },
      ],
    });
  await fire(a.host.querySelector(".hys-ui-breadcrumb-arrow"), "click");
  await fire(row("B"), "click");
  await fire(row("B child", 1), "click");
  assert(row("B leaf", 2));
  await fire(row("B leaf", 2), "click");
  const e = a.events.find((e) => e[0] === "dropdownSelect");
  assert.deepEqual(
    e[2].path.map((x) => x.label),
    ["B", "B child", "B leaf"],
  );
  assert.equal(e[2].parent.label, "Location");
  assert.equal(e[2].index, 0);
});
test("Breadcrumb router adapter keeps host href and emits one selection for dropdown links", async () => {
  const a = await mount(
    ui.HysBreadcrumb,
    {
      items: [
        {
          label: "Home",
          to: { path: "/home" },
          children: [{ label: "Sibling", to: { path: "/sibling" } }],
        },
        { label: "Current" },
      ],
    },
    {
      link: ({ item, attrs }) =>
        h(
          "a",
          {
            ...attrs,
            href: item.to.path,
            onClick: [attrs.onClick, (e) => e.preventDefault()],
          },
          item.label,
        ),
    },
  );
  assert.equal(a.host.querySelector("a").getAttribute("href"), "/home");
  await fire(a.host.querySelector(".hys-ui-breadcrumb-arrow"), "click");
  const link = row("Sibling");
  assert.equal(link.getAttribute("href"), "/sibling");
  await fire(link, "click");
  assert.equal(a.events.filter((e) => e[0] === "select").length, 1);
  assert.equal(a.events.filter((e) => e[0] === "dropdownSelect").length, 1);
});
test("Disabled breadcrumbs have no active links or usable menu triggers", async () => {
  const a = await mount(ui.HysBreadcrumb, {
    disabled: true,
    maxItems: 3,
    items: Array.from({ length: 5 }, (_, i) => ({
      label: "Level " + i,
      href: "#" + i,
      children: [{ label: "Sibling", href: "#sibling" }],
    })),
  });
  assert.equal(a.host.querySelectorAll("a").length, 0);
  assert(
    [...a.host.querySelectorAll("button")].every((button) => button.disabled),
  );
  await fire(a.host.querySelector("button"), "click");
  assert.equal(document.querySelector('[role="menu"]'), null);
});

test("Controlled submenu paths honor refusal without focusing a hidden descendant", async () => {
  const a = await menu(
    { openPath: [], items: [{ label: "Parent", value: 1, children: items }] },
    {},
    false,
  );
  await a.vm.show();
  assert.equal(await a.vm.openSubmenu(1), false);
  assert.deepEqual([...a.vm.openPath], []);
  assert.equal(await a.vm.focusItem("save"), false);
  assert.equal(document.activeElement.textContent.trim(), "Parent");
});

test("Cyclic menu input is bounded and unknown imperative focus requests do not open a menu", async () => {
  const cyclic = { label: "Loop", value: "loop" };
  cyclic.children = [cyclic];
  const a = await menu({
    items: [cyclic, { label: "Available", value: "ok" }],
  });
  assert.equal(await a.vm.focusItem("unknown"), false);
  assert.equal(a.vm.open, false);
  await a.vm.show();
  assert.equal(rows().length, 2);
  assert.equal(a.vm.getItems().length, 2);
});

test("Closing a parent Modal clears nested menus even when a controlled open prop remains true", async () => {
  const state = reactive({ visible: true }),
    vm = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(ui.HysModal, { open: state.visible, title: "Parent", destroyOnClose: false }, () =>
          h(
            ui.HysContextMenu,
            { items, open: true, ref: vm, trigger: "click" },
            () => h(ui.HysButton, null, () => "Menu"),
          ),
        );
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await pause(35);
  assert.equal(vm.value.open, true);
  state.visible = false;
  await pause(35);
  assert.equal(document.querySelector('[role="menu"]'), null);
  assert.equal(vm.value.open, false);
  state.visible = true;
  await pause(35);
  assert.equal(vm.value.open, false);
  assert.equal(await vm.value.show(), true);
});
