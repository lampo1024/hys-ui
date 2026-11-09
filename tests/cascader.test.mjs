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

const options = [
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
    children: [{ value: "hidden", label: "Blocked child" }],
  },
];
const popup = () => document.querySelector(".hys-ui-cascader-menu");
const token = (path) => JSON.stringify(path.map((v) => [typeof v, v]));
const option = (path) =>
  [...(popup()?.querySelectorAll("[data-cascader-key]") ?? [])].find(
    (el) => el.getAttribute("data-cascader-key") === token(path),
  );
const combo = (a) => a.find("[role=combobox]");
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
  await pause(1);
};
test("Cascader a newer browsing request supersedes a pending lazy path", async () => {
  let finish;
  const a = await mount(ui.HysCascader, {
    options: [
      { value: "p", label: "Lazy", isLeaf: false },
      {
        value: "q",
        label: "Other",
        children: [{ value: "x", label: "Other leaf" }],
      },
    ],
    modelValue: [],
    loadChildren: (node) =>
      node.value === "p" ? new Promise((resolve) => (finish = resolve)) : [],
  });
  await a.vm.show();
  const pending = a.vm.setExpandedPath(["p", "child"]);
  await settle();
  assert.equal(await a.vm.setExpandedPath(["q"]), true);
  finish([{ value: "child", label: "Late child" }]);
  assert.equal(await pending, false);
  assert.deepEqual(a.vm.getExpandedPath(), ["q"]);
  assert.deepEqual(a.props.modelValue, []);
});

test("Cascader initial browse defaults and closed instance navigation preserve selection", async () => {
  const a = await mount(ui.HysCascader, {
    options,
    modelValue: [],
    defaultExpandedPath: ["p"],
  });
  await a.vm.show();
  await settle();
  assert(option(["p", "a"]));
  assert.deepEqual(a.vm.getExpandedPath(), ["p"]);
  a.vm.hide();
  await settle();
  assert.equal(await a.vm.setExpandedPath(["p"]), true);
  assert(popup());
  assert(option(["p", "a"]));
  assert.deepEqual(a.props.modelValue, []);
});

test("Cascader expansion events describe accepted branch changes only", async () => {
  const a = await mount(ui.HysCascader, { options, modelValue: [] });
  await a.vm.show();
  await a.vm.setExpandedPath(["p"]);
  await settle();
  assert.deepEqual(a.events["node-expand"].at(-1)[1].path, ["p"]);
  await a.vm.setExpandedPath([]);
  await settle();
  assert.deepEqual(a.events["node-collapse"].at(-1)[1].path, ["p"]);
  assert.equal(a.events["node-expand"].length, 1);
  a.vm.hide();
  const api = ref(),
    rejectedEvents = [];
  await mount(
    defineComponent({
      setup: () => () =>
        h(ui.HysCascader, {
          ref: api,
          options,
          expandedPath: [],
          "onNode-expand": (...args) => rejectedEvents.push(args),
        }),
    }),
  );
  assert.equal(await api.value.setExpandedPath(["p"]), false);
  assert.deepEqual(api.value.getExpandedPath(), []);
  assert.equal(rejectedEvents.length, 0);
});

test("Cascader unresolved linked branches are not published as selected leaves", async () => {
  const a = await mount(ui.HysCascader, {
    options: [{ value: "p", label: "Unavailable branch", isLeaf: false }],
    multiple: true,
    modelValue: [],
  });
  await a.vm.show();
  await fire(option(["p"]).querySelector("input"), "click");
  await settle();
  assert.deepEqual(a.props.modelValue, []);
  assert(!a.events.change);
  a.props.checkStrictly = true;
  await settle();
  await fire(option(["p"]).querySelector("input"), "click");
  await settle();
  assert.deepEqual(a.props.modelValue, [["p"]]);
});

test("Cascader actual leaf locations take precedence over stale cache paths", async () => {
  const a = await mount(ui.HysCascader, {
    options: [
      {
        value: "current",
        label: "Current",
        children: [{ value: 0, label: "Actual" }],
      },
    ],
    cacheData: [
      { value: "old", label: "Old", children: [{ value: 0, label: "Cached" }] },
    ],
    modelValue: 0,
    emitPath: false,
  });
  assert.deepEqual(a.vm.getSelectedItems()[0].path, ["current", 0]);
  assert(combo(a).textContent.includes("Actual"));
});
test("Cascader controlled open and browsing path can be rejected independently", async () => {
  const api = ref(),
    allow = ref(false),
    shown = ref(false),
    values = ref([]),
    requests = [];
  await mount(
    defineComponent({
      setup: () => () =>
        h(ui.HysCascader, {
          ref: api,
          options,
          modelValue: values.value,
          open: shown.value,
          expandedPath: [],
          "onUpdate:open": (value) => {
            requests.push(value);
            if (allow.value) shown.value = value;
          },
        }),
    }),
  );
  assert.equal(await api.value.show(), false);
  assert(!popup());
  assert.deepEqual(requests, [true]);
  allow.value = true;
  assert.equal(await api.value.show(), true);
  assert(popup());
  assert.equal(await api.value.setExpandedPath(["p"]), false);
  assert.deepEqual(api.value.getExpandedPath(), []);
  api.value.hide(true);
  await settle();
  assert.equal(shown.value, false);
});
test("Cascader strict multiple and limits reject additions without losing prior selections", async () => {
  const a = await mount(ui.HysCascader, {
    options,
    modelValue: [],
    multiple: true,
    checkStrictly: true,
    multipleLimit: 1,
  });
  await a.vm.show();
  await fire(option(["p"]).querySelector("input"), "click");
  await settle();
  assert.deepEqual(a.props.modelValue, [["p"]]);
  await a.vm.setExpandedPath(["p"]);
  await settle();
  assert.equal(option(["p", "a"]).getAttribute("aria-checked"), "false");
  await fire(option(["p", "a"]).querySelector("input"), "click");
  await settle();
  assert.deepEqual(a.props.modelValue, [["p"]]);
  assert.equal(a.events.limit.at(-1)[0], 1);
  await a.vm.removeTag(["p"]);
  assert.deepEqual(a.props.modelValue, []);
});
test("Cascader checking a lazy parent loads descendants with bounded concurrency before committing", async () => {
  let active = 0,
    peak = 0;
  const a = await mount(ui.HysCascader, {
    options: [{ value: "r", label: "Root", isLeaf: false }],
    modelValue: [],
    multiple: true,
    loadChildren: async (node, ctx) => {
      active++;
      peak = Math.max(peak, active);
      await pause(2);
      active--;
      if (node.value === "r")
        return Array.from({ length: 8 }, (_, i) => ({
          value: "g" + i,
          label: "Group " + i,
          isLeaf: false,
        }));
      return [{ value: node.value + "-leaf", label: "Leaf", isLeaf: true }];
    },
  });
  await a.vm.show();
  await fire(option(["r"]).querySelector("input"), "click");
  const deadline = Date.now() + 2000;
  while (a.props.modelValue.length !== 8 && Date.now() < deadline) await pause(5);
  await settle();
  assert.equal(a.props.modelValue.length, 8);
  assert(peak <= 4);
  assert.equal(a.events["value-change"].length, 1);
  assert(a.props.modelValue.every((path) => path.length === 3));
});
test("Cascader canceling a pending parent check keeps its previous value", async () => {
  let request;
  const a = await mount(ui.HysCascader, {
    options: [
      { value: "r", label: "Root", isLeaf: false },
      { value: "q", label: "Existing" },
    ],
    modelValue: [["q"]],
    multiple: true,
    loadChildren: (node, ctx) =>
      new Promise((resolve) => (request = { ctx, resolve })),
  });
  await a.vm.show();
  await fire(option(["r"]).querySelector("input"), "click");
  await settle();
  a.vm.hide();
  await settle();
  assert(request.ctx.signal.aborted);
  request.resolve([{ value: "late", label: "Late" }]);
  await settle();
  assert.deepEqual(a.props.modelValue, [["q"]]);
  assert(!a.events.change);
});
test("Cascader search hooks cancel obsolete work, retain current drafts and retry failures", async () => {
  const requests = [];
  const a = await mount(ui.HysCascader, {
    options,
    modelValue: [],
    filterable: true,
    beforeFilter: (q, ctx) =>
      new Promise((resolve, reject) =>
        requests.push({ q, ctx, resolve, reject }),
      ),
  });
  await a.vm.show();
  a.vm.filter("Alpha");
  await settle();
  a.vm.filter("Beta");
  await settle();
  assert(requests[0].ctx.signal.aborted);
  requests[0].resolve(true);
  requests[1].resolve(true);
  await settle();
  assert.equal(popup().querySelectorAll("[role=option]").length, 1);
  assert(popup().querySelector("[role=option]").textContent.includes("Beta"));
  a.vm.filter("Product");
  await settle();
  requests[2].reject(Error("Unavailable"));
  await settle();
  assert(popup().querySelector("[role=alert]"));
  await fire(popup().querySelector("[role=alert] button"), "click");
  await settle();
  requests[3].resolve(true);
  await settle();
  assert(popup().textContent.includes("Product"));
  a.vm.filter("Pending");
  await settle();
  a.vm.hide();
  await settle();
  assert(requests.at(-1).ctx.signal.aborted);
});
test("Cascader root loads are cancelable and accepted results tolerate equivalent empty options", async () => {
  const requests = [];
  const a = await mount(ui.HysCascader, {
    options: [],
    modelValue: ["r", "a"],
    cacheData: [
      {
        value: "r",
        label: "Cached root",
        children: [{ value: "a", label: "Cached item" }],
      },
    ],
    loadRoot: (ctx) =>
      new Promise((resolve, reject) => requests.push({ ctx, resolve, reject })),
  });
  assert(combo(a).textContent.includes("Cached item"));
  await a.vm.show();
  await settle();
  assert.equal(requests.length, 1);
  a.props.options = [];
  await settle();
  assert.equal(requests.length, 1);
  assert(!requests[0].ctx.signal.aborted);
  a.vm.hide();
  await settle();
  assert(requests[0].ctx.signal.aborted);
  requests[0].resolve([{ value: "old", label: "Old" }]);
  await settle();
  await a.vm.show();
  await settle();
  requests[1].resolve([
    { value: "r", label: "Root", children: [{ value: "a", label: "Actual" }] },
  ]);
  await settle();
  assert(combo(a).textContent.includes("Actual"));
  assert(option(["r", "a"]));
  a.vm.hide();
  await settle();
  await a.vm.show();
  await settle();
  assert.equal(requests.length, 2);
  const pending = a.vm.reloadRoot();
  await settle();
  a.vm.hide();
  assert.equal(await pending, false);
  requests.at(-1).resolve([]);
  await settle();
});
test("Cascader hover expansion is delayed, never selects and is canceled on popup close", async () => {
  const a = await mount(ui.HysCascader, {
    options,
    modelValue: [],
    expandTrigger: "hover",
    hoverDelay: 10,
  });
  await a.vm.show();
  await fire(option(["p"]), "pointerenter");
  await pause(16);
  await settle();
  assert(option(["p", "a"]));
  assert.deepEqual(a.props.modelValue, []);
  await fire(option(["q"]), "pointerenter");
  a.vm.hide();
  await pause(16);
  assert(!popup());
});
test("Cascader virtual columns reach distant values with bounded DOM", async () => {
  const data = Array.from({ length: 20000 }, (_, value) => ({
    value,
    label: "Item " + value,
    disabled: value === 1,
  }));
  const a = await mount(ui.HysCascader, {
    options: data,
    modelValue: [],
    virtual: true,
    listHeight: 256,
    itemHeight: 32,
  });
  await a.vm.show();
  assert(popup().querySelectorAll("[data-cascader-key]").length < 25);
  await fire(option([0]), "keydown", { key: "End" });
  await settle();
  assert.equal(
    document.activeElement.getAttribute("data-cascader-key"),
    token([19999]),
  );
  await fire(document.activeElement, "keydown", { key: "Enter" });
  await settle();
  assert.deepEqual(a.props.modelValue, [19999]);
});
test("Cascader stable path indexing tolerates cycles and a reused object under different parents", async () => {
  const child = { value: "same", label: "Shared" },
    root = { value: "r", label: "Root", children: [child] };
  root.children.push(root);
  const a = await mount(ui.HysCascader, {
    options: [root, { value: "s", label: "Sibling", children: [child] }],
    modelValue: [],
    multiple: true,
  });
  await a.vm.show();
  await a.vm.setExpandedPath(["r"]);
  await settle();
  assert(option(["r", "same"]));
  assert(!option(["r", "r"]));
  await fire(option(["r", "same"]), "click");
  await a.vm.setExpandedPath(["s"]);
  await settle();
  assert.equal(option(["s", "same"]).getAttribute("aria-checked"), "false");
  assert.equal(root.children[1], root);
  assert.equal(child.value, "same");
});
test("Cascader custom clear sentinels and missing cache labels do not conflate zero by default", async () => {
  const a = await mount(ui.HysCascader, {
    options: [
      { value: 0, label: "Zero" },
      { value: 1, label: "One" },
    ],
    modelValue: 0,
    emitPath: false,
    clearable: true,
    clearValue: "empty",
  });
  assert(combo(a).textContent.includes("Zero"));
  assert.equal(await a.vm.clear(), true);
  assert.equal(a.props.modelValue, "empty");
  assert.equal(a.vm.getSelectedItems().length, 0);
  const b = await mount(ui.HysCascader, {
    options: [],
    modelValue: ["future", "item"],
    cacheData: [
      {
        value: "future",
        label: "Future",
        children: [{ value: "item", label: "Cached item" }],
      },
    ],
  });
  assert(b.vm.getSelectedItems()[0].missing);
  assert(combo(b).textContent.includes("Cached item"));
});
test("Cascader inherits form state, binds the composite label and validates accepted value once", async () => {
  const model = reactive({ category: [] }),
    size = ref("sm"),
    disabled = ref(false),
    api = ref(),
    form = ref();
  let changes = 0;
  const a = await mount(
    defineComponent({
      setup: () => () =>
        h(
          ui.HysForm,
          { ref: form, model, size: size.value, disabled: disabled.value },
          () =>
            h(
              ui.HysFormItem,
              {
                prop: "category",
                label: "Category",
                rules: { type: "array", required: true, min: 1 },
              },
              () =>
                h(ui.HysCascader, {
                  ref: api,
                  options,
                  modelValue: model.category,
                  "onUpdate:modelValue": (value) => (model.category = value),
                  "onValue-change": () => changes++,
                }),
            ),
        ),
    }),
  );
  const trigger = combo(a);
  assert.equal(a.find("label").htmlFor, trigger.id);
  assert(trigger.hasAttribute("data-hys-ui-field-managed"));
  assert.equal(await form.value.validate(), false);
  await api.value.show();
  await fire(option(["q"]), "click");
  await settle();
  assert.equal(changes, 1);
  assert.equal(await form.value.validate(), true);
  await api.value.show();
  assert(popup().classList.contains("hys-ui-cascader-sm"));
  assert.equal(
    popup().querySelector(".hys-ui-cascader-column").getAttribute("data-size"),
    "sm",
  );
  disabled.value = true;
  await settle();
  assert(!popup());
  assert.equal(trigger.getAttribute("aria-disabled"), "true");
  assert.equal(await api.value.setValue(["p", "a"]), false);
});
test("Cascader cached inline panels resume keyboard interaction and abort outstanding data", async () => {
  const visible = ref(true),
    api = ref(),
    signals = [],
    resolvers = [];
  const Cached = defineComponent({
    setup: () => () =>
      h(ui.HysCascader, {
        ref: api,
        inline: true,
        options: [
          { value: "r", label: "Root", isLeaf: false },
          { value: "q", label: "Existing" },
        ],
        defaultValue: ["q"],
        loadChildren: (node, ctx) =>
          new Promise((resolve) => {
            signals.push(ctx.signal);
            resolvers.push(resolve);
          }),
      }),
  });
  const a = await mount(
    defineComponent({
      setup: () => () =>
        h(KeepAlive, null, {
          default: () => (visible.value ? h(Cached) : h("p", "Away")),
        }),
    }),
  );
  await fire(option(["r"]), "click");
  await settle();
  visible.value = false;
  await settle();
  assert(signals[0].aborted);
  resolvers[0]([{ value: "late", label: "Late" }]);
  await settle();
  visible.value = true;
  await settle();
  await fire(option(["q"]), "keydown", { key: "Home" });
  await settle();
  assert.equal(
    document.activeElement.getAttribute("data-cascader-key"),
    token(["r"]),
  );
  assert.equal(api.value.getSelectedItems()[0].value, "q");
});
test("Cascader preserves path values, original node slots and single-change workflow", async () => {
  const a = await mount(ui.HysCascader, {
    options,
    modelValue: [],
    clearable: true,
  });
  assert.equal(await a.vm.show(), true);
  await fire(option(["p"]), "click");
  await settle();
  assert(option(["p", "a"]));
  assert.deepEqual(a.props.modelValue, []);
  await fire(option(["p", "a"]), "click");
  await settle();
  assert.deepEqual(a.props.modelValue, ["p", "a"]);
  assert.equal(a.events.change[0][1].items[0].node.label, "Alpha");
  assert.equal(a.vm.getCheckedNodes()[0].label, "Alpha");
  assert(!popup());
  assert.equal(document.activeElement, combo(a));
  assert.equal(await a.vm.clear(), true);
  assert.deepEqual(a.props.modelValue, []);
});
test("Cascader permits duplicate leaf values in different paths without cross-selection", async () => {
  const a = await mount(ui.HysCascader, {
    options: [
      {
        value: 0,
        label: "North",
        children: [{ value: "same", label: "North office" }],
      },
      {
        value: 1,
        label: "South",
        children: [{ value: "same", label: "South office" }],
      },
    ],
    modelValue: [],
    multiple: true,
  });
  await a.vm.show();
  await fire(option([0]), "click");
  await settle();
  await fire(option([0, "same"]), "click");
  await settle();
  await fire(option([1]), "click");
  await settle();
  assert.equal(option([1, "same"]).getAttribute("aria-checked"), "false");
  await fire(option([1, "same"]), "click");
  await settle();
  assert.deepEqual(a.props.modelValue, [
    [0, "same"],
    [1, "same"],
  ]);
  assert.equal(a.vm.getSelectedItems().length, 2);
});
test("Cascader multiple parent checks, half state, strategy and protected tags stay consistent", async () => {
  const a = await mount(ui.HysCascader, {
    options,
    modelValue: [],
    multiple: true,
    clearable: true,
  });
  await a.vm.show();
  await fire(option(["p"]), "click");
  await settle();
  await fire(option(["p", "a"]), "click");
  await settle();
  assert.equal(option(["p"]).getAttribute("aria-checked"), "mixed");
  const checkbox = option(["p"]).querySelector("input[type=checkbox]");
  await fire(checkbox, "click");
  await settle();
  assert.deepEqual(a.props.modelValue, [
    ["p", "a"],
    ["p", "b"],
  ]);
  a.props.showCheckedStrategy = "parent";
  await settle();
  assert.equal(a.vm.getSelectedItems()[0].node.label, "Engineering");
  assert.equal(await a.vm.removeTag(["p"]), true);
  assert.deepEqual(a.props.modelValue, []);
  a.props.modelValue = [["p", "locked"], ["q"]];
  await settle();
  await a.vm.clear();
  assert.deepEqual(a.props.modelValue, [["p", "locked"]]);
});
test("Cascader business fields and leaf-only output retain numeric zero", async () => {
  const data = [
    {
      code: 0,
      title: "Head office",
      departments: [{ code: 1, title: "Team A" }],
    },
  ];
  const a = await mount(ui.HysCascader, {
    options: data,
    fieldNames: { value: "code", label: "title", children: "departments" },
    emitPath: false,
    modelValue: null,
    checkStrictly: true,
  });
  await a.vm.show();
  await fire(option([0]).querySelector("input[type=radio]"), "click");
  await settle();
  assert.equal(a.props.modelValue, 0);
  assert.equal(a.vm.getSelectedItems()[0].value, 0);
  await a.vm.show();
  await a.vm.setExpandedPath([0]);
  await settle();
  await fire(option([0, 1]), "click");
  await settle();
  assert.equal(a.props.modelValue, 1);
});
test("Cascader local search uses complete labels, preserves cursor keys and limits suggestions", async () => {
  const a = await mount(ui.HysCascader, {
    options,
    modelValue: [],
    filterable: true,
    searchLimit: 1,
  });
  await a.vm.show();
  const input = popup().querySelector("input[type=text]");
  assert.equal(document.activeElement, input);
  const cursor = new KeyboardEvent("keydown", {
    key: "ArrowLeft",
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(cursor);
  assert.equal(cursor.defaultPrevented, false);
  input.value = "Engineering";
  await fire(input, "input");
  await settle();
  assert.equal(popup().querySelectorAll("[role=option]").length, 1);
  await fire(input, "keydown", { key: "ArrowDown" });
  await settle();
  assert(document.activeElement.textContent.includes("Alpha"));
  await fire(document.activeElement, "keydown", { key: "Enter" });
  await settle();
  assert.deepEqual(a.props.modelValue, ["p", "a"]);
});
test("Cascader lazy branches cancel old requests, retry errors and retain accepted children", async () => {
  const requests = [];
  const a = await mount(ui.HysCascader, {
    options: [{ value: "r", label: "Root", isLeaf: false }],
    modelValue: [],
    loadChildren: (node, ctx) =>
      new Promise((resolve, reject) =>
        requests.push({ node, ctx, resolve, reject }),
      ),
  });
  await a.vm.show();
  void fire(option(["r"]), "click");
  await settle();
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].ctx.path, ["r"]);
  a.vm.hide();
  await settle();
  assert(requests[0].ctx.signal.aborted);
  requests[0].resolve([{ value: "old", label: "Old" }]);
  await settle();
  await a.vm.show();
  void fire(option(["r"]), "click");
  await settle();
  assert.equal(requests.length, 2);
  requests[1].reject(Error("Offline"));
  await settle();
  assert(popup().querySelector(".hys-ui-cascader-retry"));
  void a.vm.reloadNode(["r"]);
  await settle();
  requests[2].resolve([{ value: "new", label: "New", isLeaf: true }]);
  await settle();
  assert(option(["r", "new"]));
  a.vm.hide();
  await settle();
  await a.vm.show();
  await settle();
  assert(option(["r", "new"]));
  assert.equal(requests.length, 3);
});
test("Cascader uncontrolled values and controlled value veto report accepted state correctly", async () => {
  const api = ref(),
    events = [];
  await mount(
    defineComponent({
      setup: () => () =>
        h(ui.HysCascader, {
          ref: api,
          options,
          modelValue: ["q"],
          "onValue-change": () => events.push("accepted"),
        }),
    }),
  );
  assert.equal(await api.value.setValue(["p", "a"]), false);
  assert.equal(api.value.getSelectedItems()[0].node.label, "Product");
  assert.deepEqual(events, []);
  const second = ref();
  await mount(
    defineComponent({
      setup: () => () =>
        h(ui.HysCascader, { ref: second, options, defaultValue: ["q"] }),
    }),
  );
  assert.equal(await second.value.setValue(["p", "a"]), true);
  assert.equal(second.value.getSelectedItems()[0].node.label, "Alpha");
});
test("Cascader inline menus stay inside the field root and methods expose checked nodes", async () => {
  const a = await mount(ui.HysCascader, {
    options,
    inline: true,
    modelValue: ["q"],
    name: "categories",
  });
  assert(!combo(a));
  assert(a.vm.element.contains(a.find("[role=menu]")));
  assert.equal(a.vm.getCheckedNodes()[0].label, "Product");
  assert.equal(a.find("input[type=hidden]").value, '["q"]');
});
