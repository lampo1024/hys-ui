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
    : type === "click" || type === "contextmenu"
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

const nodes = [
  {
    value: "p",
    label: "Engineering",
    children: [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta" },
      { value: "locked", label: "Locked", disabled: true },
    ],
  },
  { value: "q", label: "Product" },
  {
    value: "off",
    label: "Archived",
    disabled: true,
    children: [{ value: "off-child", label: "Archived child" }],
  },
];
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
  await pause(1);
};
const popup = () => document.querySelector(".hys-ui-tree-select-menu");
const row = (key) =>
  popup()?.querySelector(
    '[data-tree-select-key="' + typeof key + ":" + key + '"]',
  );
const trigger = (a) => a.find("[role=combobox]");
const visibleKeys = () =>
  [...popup().querySelectorAll("[role=treeitem]")].map((e) =>
    e.getAttribute("data-tree-select-key"),
  );

test("TreeSelect preserves single selection and legacy change arguments with a real tree popup", async () => {
  const a = await mount(ui.HysTreeSelect, {
    nodes,
    modelValue: "",
    clearable: true,
  });
  assert.equal(await a.vm.show(), true);
  assert(popup().querySelector("[role=tree]"));
  assert.equal(document.activeElement.getAttribute("aria-label"), "搜索节点");
  await fire(row("a"), "click");
  await settle();
  assert.equal(a.props.modelValue, "a");
  assert.equal(a.events.change[0][0], "a");
  assert.equal(a.events.change[0][1].reason, "select");
  assert.equal(a.events.select[0][1].label, "Alpha");
  assert(!popup());
  assert(trigger(a).textContent.includes("Alpha"));
  assert.equal(await a.vm.clear(), true);
  assert.equal(a.props.modelValue, "");
  assert.equal(a.events.clear.length, 1);
});
test("TreeSelect label-only controlled requests report the proposed label without accepting a veto", async () => {
  const api = ref(),
    changes = [],
    accepted = [];
  await mount(
    defineComponent({
      setup: () => () =>
        h(ui.HysTreeSelect, {
          ref: api,
          nodes,
          modelValue: { value: "a", label: "Original" },
          labelInValue: true,
          onChange: (value, info) => changes.push(info),
          "onValue-change": (value) => accepted.push(value),
        }),
    }),
  );
  assert.equal(
    await api.value.setValue({ value: "a", label: "Proposed" }),
    false,
  );
  assert.equal(changes[0].items[0].label, "Proposed");
  assert.equal(api.value.getSelectedItems()[0].label, "Original");
  assert.equal(accepted.length, 0);
});
test("TreeSelect inherited disabled branches are unselectable and a disabled current single value can be replaced", async () => {
  const a = await mount(ui.HysTreeSelect, { nodes, modelValue: "locked" });
  await a.vm.show();
  await fire(row("off-child"), "click");
  assert.equal(a.props.modelValue, "locked");
  assert.equal(row("off-child").getAttribute("aria-disabled"), "true");
  await fire(row("b"), "click");
  await settle();
  assert.equal(a.props.modelValue, "b");
});
test("TreeSelect uncontrolled defaults retain accepted state while controlled hosts may reject requests", async () => {
  const api = ref(),
    Wrapper = defineComponent({
      setup() {
        return () =>
          h(ui.HysTreeSelect, { ref: api, nodes, defaultValue: "q" });
      },
    }),
    a = await mount(Wrapper);
  await api.value.show();
  assert(
    row("a"),
    JSON.stringify({
      open: api.value.open,
      keys: api.value.getExpandedKeys(),
      popups: document.querySelectorAll(".hys-ui-tree-select-menu").length,
    }),
  );
  await fire(row("a"), "click");
  await settle();
  assert.deepEqual(api.value.getSelectedKeys(), ["a"]);
  a.unmount();
  const rejected = ref(),
    requests = [],
    Host = defineComponent({
      setup() {
        return () =>
          h(ui.HysTreeSelect, {
            ref: rejected,
            nodes,
            modelValue: "q",
            "onUpdate:modelValue": (v) => requests.push(v),
          });
      },
    });
  await mount(Host);
  await rejected.value.show();
  await fire(row("a"), "click");
  await settle();
  assert.deepEqual(requests, ["a"]);
  assert.deepEqual(rejected.value.getSelectedKeys(), ["q"]);
  assert(popup());
});
test("TreeSelect multiple tags can be removed while disabled values survive clear", async () => {
  const a = await mount(ui.HysTreeSelect, {
    nodes,
    modelValue: ["a", "b", "locked"],
    clearable: true,
    maxTagCount: 2,
  });
  assert.equal(a.all(".hys-ui-tree-select-tag-remove").length, 2);
  assert(a.host.textContent.includes("+1"));
  assert.equal(await a.vm.removeTag("a"), true);
  assert.deepEqual([...a.props.modelValue], ["b", "locked"]);
  assert.equal(await a.vm.removeTag("locked"), false);
  assert.equal(await a.vm.clear(), true);
  assert.deepEqual([...a.props.modelValue], ["locked"]);
  assert.equal(a.find(".hys-ui-tree-select-tag-remove").disabled, true);
});
test("TreeSelect check conduction publishes child, parent and all strategies without losing accepted events", async () => {
  for (const strategy of ["child", "parent", "all"]) {
    const a = await mount(ui.HysTreeSelect, {
      nodes,
      modelValue: [],
      checkable: true,
      showCheckedStrategy: strategy,
    });
    await a.vm.show();
    await fire(row("p"), "click");
    await settle();
    const expected =
      strategy === "child"
        ? ["a", "b"]
        : strategy === "parent"
          ? ["p"]
          : ["p", "a", "b"];
    assert.deepEqual([...a.props.modelValue].sort(), expected.sort());
    assert.deepEqual(a.vm.getCheckedKeys(), ["p", "a", "b"]);
    assert.equal(a.events.check.length, 1);
    assert.equal(a.events["value-change"].length, 1);
    assert.equal(await a.vm.removeTag(strategy === "child" ? "a" : "p"), true);
    await settle();
    assert.deepEqual(
      [...a.props.modelValue],
      strategy === "child" ? ["b"] : [],
    );
    a.unmount();
  }
});
test("TreeSelect partial checking exposes correct new half-state and strict mode isolates parents", async () => {
  const a = await mount(ui.HysTreeSelect, {
    nodes,
    modelValue: [],
    checkable: true,
  });
  await a.vm.show();
  await fire(row("a"), "click");
  await settle();
  assert.deepEqual(a.events.change[0][1].halfCheckedKeys, ["p"]);
  assert.deepEqual(a.events.check[0][0].halfCheckedKeys, ["p"]);
  assert.equal(row("p").getAttribute("aria-checked"), "mixed");
  a.props.checkStrictly = true;
  a.props.modelValue = [];
  await settle();
  await fire(row("p"), "click");
  await settle();
  assert.deepEqual([...a.props.modelValue], ["p"]);
  assert.deepEqual(a.vm.getCheckedKeys(), ["p"]);
});
test("TreeSelect leaf-only picks expand branches while multiple limits reject only additions", async () => {
  const a = await mount(ui.HysTreeSelect, {
    nodes,
    modelValue: [],
    multiple: true,
    multipleLimit: 1,
    leafOnly: true,
    defaultExpandAll: false,
  });
  await a.vm.show();
  assert(!row("a"));
  await fire(row("p"), "click");
  await settle();
  assert(row("a"));
  assert.deepEqual([...a.props.modelValue], []);
  await fire(row("a"), "click");
  await settle();
  await fire(row("b"), "click");
  await settle();
  assert.deepEqual([...a.props.modelValue], ["a"]);
  assert.equal(a.events.limit.length, 1);
  assert.equal(await a.vm.removeTag("a"), true);
  await fire(row("b"), "click");
  await settle();
  assert.deepEqual([...a.props.modelValue], ["b"]);
});
test("TreeSelect business fields, number zero and cached labels preserve raw values", async () => {
  const data = [
      {
        code: 0,
        meta: { name: "Head office" },
        teams: [{ code: 1, meta: { name: "Platform" } }],
      },
    ],
    a = await mount(ui.HysTreeSelect, {
      nodes: data,
      modelValue: 0,
      nodeKey: "code",
      fieldNames: { label: "meta.name", children: "teams" },
    });
  assert(trigger(a).textContent.includes("Head office"));
  await a.vm.show();
  await fire(row(1), "click");
  await settle();
  assert.equal(a.props.modelValue, 1);
  a.props.nodes = [];
  await settle();
  assert(trigger(a).textContent.includes("Platform"));
  a.props.modelValue = 99;
  a.props.cacheData = [{ code: 99, meta: { name: "Remote member" } }];
  await settle();
  assert(trigger(a).textContent.includes("Remote member"));
  assert.equal(a.vm.getSelectedItems()[0].missing, true);
});
test("TreeSelect label-in-value supports explicit labels and custom clear values", async () => {
  const a = await mount(ui.HysTreeSelect, {
    nodes,
    modelValue: null,
    labelInValue: true,
    clearValue: null,
  });
  await a.vm.show();
  await fire(row("a"), "click");
  await settle();
  assert.equal(a.props.modelValue.value, "a");
  assert.equal(a.props.modelValue.label, "Alpha");
  assert.equal(
    await a.vm.setValue({ value: "a", label: "Custom label" }),
    true,
  );
  assert(trigger(a).textContent.includes("Custom label"));
  assert.equal(await a.vm.clear(), true);
  assert.equal(a.props.modelValue, null);
});
test("TreeSelect flat business data handles parent zero, cycles and raw option slot data without mutation", async () => {
  const data = [
      { id: 0, parentId: null, value: "root", label: "Root" },
      { id: 1, parentId: 0, value: "child", label: "Child" },
      { id: 2, parentId: 3, value: "x", label: "Cycle X" },
      { id: 3, parentId: 2, value: "y", label: "Cycle Y" },
      { id: 1, parentId: 0, value: "duplicate", label: "Duplicate" },
    ],
    a = await mount(
      ui.HysTreeSelect,
      { nodes: data, modelValue: "", simpleMode: true },
      {
        option: ({ node }) =>
          h("span", { class: "raw" }, node.id + ":" + node.label),
      },
    );
  await a.vm.show();
  assert.equal(row("child").getAttribute("aria-level"), "2");
  assert(row("x"));
  assert(row("y"));
  assert(!row("duplicate"));
  await fire(row("child"), "click");
  await settle();
  assert.equal(a.events.select[0][1].id, 1);
  assert.equal(data[0].children, undefined);
});
test("TreeSelect search reveals ancestors, ignores case and preserves text editing keys", async () => {
  const a = await mount(ui.HysTreeSelect, {
    nodes,
    modelValue: "",
    defaultExpandAll: false,
  });
  await a.vm.show();
  const input = popup().querySelector("input:not([type=checkbox])");
  input.value = "BETA";
  await fire(input, "input");
  await settle();
  assert.deepEqual(visibleKeys(), ["string:p", "string:b"]);
  const event = new KeyboardEvent("keydown", {
    key: "ArrowLeft",
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(event);
  assert.equal(event.defaultPrevented, false);
  await fire(input, "keydown", { key: "ArrowDown" });
  await settle();
  assert.equal(
    document.activeElement.getAttribute("data-tree-select-key"),
    "string:p",
  );
  await fire(document.activeElement, "keydown", { key: "ArrowDown" });
  await settle();
  assert.equal(
    document.activeElement.getAttribute("data-tree-select-key"),
    "string:b",
  );
  await fire(document.activeElement, "keydown", { key: "Enter" });
  await settle();
  assert.equal(a.props.modelValue, "b");
});
test("TreeSelect controlled popup requests can be rejected or accepted without stale focus", async () => {
  const api = ref(),
    Host = defineComponent({
      setup() {
        return () => h(ui.HysTreeSelect, { ref: api, nodes, open: false });
      },
    }),
    a = await mount(Host);
  assert.equal(await api.value.show(), false);
  assert(!popup());
  a.unmount();
  const b = await mount(ui.HysTreeSelect, {
    nodes,
    open: false,
    searchable: false,
  });
  assert.equal(await b.vm.show(), true);
  await settle();
  assert(popup());
  assert.equal(document.activeElement.getAttribute("role"), "treeitem");
  b.vm.hide(true);
  await settle();
  assert(!popup());
  assert.equal(document.activeElement, trigger(b));
});
test("TreeSelect lazy requests start on open, cancel on close and preserve accepted children for reopening", async () => {
  const pending = [],
    signals = [];
  let calls = 0;
  const a = await mount(ui.HysTreeSelect, {
    nodes: [{ value: "p", label: "Lazy", hasChildren: true }],
    modelValue: "",
    loadChildren: (n, c) => {
      calls++;
      signals.push(c.signal);
      return new Promise((r) => pending.push(r));
    },
  });
  await settle();
  assert.equal(calls, 0);
  await a.vm.show();
  await settle();
  assert.equal(calls, 1);
  a.vm.hide();
  await settle();
  assert(signals[0].aborted);
  pending[0]([{ value: "old", label: "Old" }]);
  await settle();
  assert(!a.vm.getNode("old"));
  await a.vm.show();
  await settle();
  assert.equal(calls, 2);
  pending[1]([{ value: "new", label: "New" }]);
  await settle();
  assert(row("new"));
  a.vm.hide();
  await settle();
  await a.vm.show();
  await settle();
  assert(row("new"));
  assert.equal(calls, 2);
});
test("TreeSelect remote search cancels old work, caches labels and exposes recoverable errors", async () => {
  const requests = [],
    a = await mount(ui.HysTreeSelect, {
      nodes: [],
      modelValue: "",
      remote: true,
      debounce: 0,
      remoteMethod: (q, c) =>
        new Promise((resolve, reject) =>
          requests.push({ q, signal: c.signal, resolve, reject }),
        ),
    });
  await a.vm.show();
  await settle();
  assert.equal(requests.length, 1);
  a.vm.filter("a");
  await settle();
  assert(requests[0].signal.aborted);
  requests[0].resolve([{ value: "old", label: "Old" }]);
  requests[1].resolve([{ value: "a", label: "Alpha" }]);
  await settle();
  assert(!row("old"));
  assert(row("a"));
  await fire(row("a"), "click");
  await settle();
  assert(trigger(a).textContent.includes("Alpha"));
  await a.vm.show();
  await settle();
  requests.at(-1).reject(Error("Network"));
  await settle();
  assert(popup().querySelector("[role=alert]"));
  await fire(popup().querySelector("[role=alert] button"), "click");
  await settle();
  requests.at(-1).resolve([]);
  await settle();
  assert(!popup().querySelector("[role=alert]"));
  assert(trigger(a).textContent.includes("Alpha"));
});

test("TreeSelect virtual navigation renders bounded rows and selects offscreen numeric entries", async () => {
  const data = Array.from({ length: 20000 }, (_, value) => ({
      value,
      label: "Item " + value,
      disabled: value === 1,
    })),
    a = await mount(ui.HysTreeSelect, {
      nodes: data,
      modelValue: null,
      virtual: true,
      itemHeight: 32,
      listHeight: 200,
      searchable: false,
    });
  await a.vm.show();
  await settle();
  assert(popup().querySelectorAll("[role=treeitem]").length < 20);
  await fire(document.activeElement, "keydown", { key: "ArrowDown" });
  await settle();
  assert.equal(document.activeElement.dataset.treeSelectKey, "number:2");
  await fire(document.activeElement, "keydown", { key: "End" });
  await settle();
  assert.equal(document.activeElement.dataset.treeSelectKey, "number:19999");
  assert(popup().querySelectorAll("[role=treeitem]").length < 20);
  await fire(document.activeElement, "keydown", { key: "Enter" });
  await settle();
  assert.equal(a.props.modelValue, 19999);
  await a.vm.scrollTo({ key: 5000, align: "top" });
  assert.equal(popup().querySelector("[role=tree]").scrollTop, 160000);
  assert(row(5000));
});
test("TreeSelect forms inherit size and disabled states, validate the actual field and preserve native values", async () => {
  const model = reactive({ teams: [] }),
    api = ref(),
    a = await mount(
      ui.HysForm,
      {
        model,
        size: "sm",
        rules: {
          teams: {
            type: "array",
            required: true,
            min: 1,
            message: "Choose a team",
          },
        },
      },
      {
        default: () =>
          h(ui.HysFormItem, { prop: "teams", label: "Teams" }, () =>
            h(ui.HysTreeSelect, {
              ref: api,
              nodes,
              modelValue: model.teams,
              "onUpdate:modelValue": (value) => (model.teams = value),
              checkable: true,
              name: "teams",
            }),
          ),
      },
    );
  await settle();
  const combo = trigger(a);
  assert.equal(a.find("label").htmlFor, combo.id);
  await fire(a.find("form"), "submit");
  await pause(5);
  assert.equal(document.activeElement, combo);
  assert.equal(combo.getAttribute("aria-invalid"), "true");
  assert(a.find(".hys-ui-tree-select-sm"));
  await api.value.show();
  const search = popup().querySelector("input:not([type=checkbox])");
  search.value = "Alpha";
  await fire(search, "input");
  await settle();
  const enter = new KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true,
    cancelable: true,
    isComposing: true,
  });
  search.dispatchEvent(enter);
  assert.equal(enter.defaultPrevented, false);
  assert.deepEqual(model.teams, []);
  await fire(row("a"), "click");
  await settle();
  assert.deepEqual(model.teams, ["a"]);
  assert.equal(a.vm.errors.teams, undefined);
  assert.equal(a.find("input[type=hidden][name=teams]").value, "a");
  api.value.hide();
  a.vm.resetFields();
  await settle();
  assert.deepEqual(model.teams, []);
  a.props.disabled = true;
  await settle();
  assert.equal(await api.value.show(), false);
  assert.equal(await api.value.setValue(["q"]), false);
});
test("TreeSelect popup close aborts remote work and cached page leave prevents late children or menus", async () => {
  const visible = ref(true),
    api = ref(),
    requests = [],
    source = [{ value: "p", label: "Lazy", hasChildren: true }],
    loader = (node, ctx) =>
      new Promise((resolve) => requests.push({ signal: ctx.signal, resolve })),
    Cached = defineComponent({
      setup() {
        return () =>
          h(ui.HysTreeSelect, {
            ref: api,
            nodes: source,
            defaultValue: "cached",
            cacheData: [{ value: "cached", label: "Cached label" }],
            loadChildren: loader,
          });
      },
    }),
    Wrapper = defineComponent({
      setup() {
        return () =>
          h(KeepAlive, null, {
            default: () => (visible.value ? h(Cached) : h("div", "Other")),
          });
      },
    }),
    a = await mount(Wrapper);
  await api.value.show();
  await settle();
  assert.equal(requests.length, 1);
  visible.value = false;
  await settle();
  assert(requests[0].signal.aborted);
  assert(!popup());
  requests[0].resolve([{ value: "old", label: "Stale" }]);
  await settle();
  visible.value = true;
  await settle();
  assert.equal(api.value.open, false);
  assert(a.host.textContent.includes("Cached label"));
  await api.value.show();
  await settle();
  requests.at(-1).resolve([{ value: "new", label: "New" }]);
  await settle();
  assert(row("new"));
  assert(!row("old"));
});
test("TreeSelect popup teleport, theme and local slots remain independent of form context", async () => {
  const a = await mount(
    ui.HysTreeSelect,
    { nodes, modelValue: "q", appendTo: false, searchable: false },
    {
      header: () => h("strong", "Header"),
      footer: ({ close }) => h(ui.HysButton, { onClick: close }, () => "Done"),
      option: ({ node, depth }) =>
        h("span", { class: "custom-node" }, node.label + ":" + depth),
    },
  );
  await a.vm.show();
  assert(a.host.contains(popup()));
  assert.equal(popup().getAttribute("data-hys-theme"), "blue");
  assert(popup().textContent.includes("Header"));
  assert(popup().querySelector(".custom-node"));
  await fire(popup().querySelector("footer button"), "click");
  await settle();
  assert(!popup());
});

test("TreeSelect bulk checking keeps all values with bounded tags and virtual option nodes", async () => {
  const data = [
      {
        value: 0,
        label: "All members",
        children: Array.from({ length: 5000 }, (_, i) => ({
          value: i + 1,
          label: "Member " + (i + 1),
        })),
      },
    ],
    a = await mount(ui.HysTreeSelect, {
      nodes: data,
      modelValue: [],
      checkable: true,
      virtual: true,
      itemHeight: 32,
      listHeight: 200,
    });
  await a.vm.show();
  await fire(row(0), "click");
  await settle();
  assert.equal(a.props.modelValue.length, 5000);
  assert.equal(a.all(".hys-ui-tree-select-tag-remove").length, 3);
  assert(a.host.textContent.includes("+4997"));
  assert(popup().querySelectorAll("[role=treeitem]").length < 20);
  assert.equal(a.vm.getCheckedKeys(true).length, 5000);
});
