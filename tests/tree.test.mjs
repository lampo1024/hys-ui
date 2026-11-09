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
    id: "root",
    label: "Root",
    children: [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
      { id: "locked", label: "Protected", disabled: true },
    ],
  },
  { id: "other", label: "Other", children: [{ id: "c", label: "Gamma" }] },
];
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};
const row = (a, key) =>
  a.find('[data-tree-key="' + typeof key + ":" + key + '"]');
const ids = (a) =>
  a.all("[role=treeitem]").map((e) => e.getAttribute("data-tree-id"));
function drag(element, type, y = 40) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(e, {
    clientY: { value: y },
    dataTransfer: {
      value: { setData() {}, effectAllowed: "", dropEffect: "" },
    },
  });
  element.dispatchEvent(e);
  return e;
}

test("Tree keeps existing selection, check events and per-node disabled behavior", async () => {
  const a = await mount(ui.HysTree, {
    nodes,
    modelValue: "a",
    checkedKeys: [],
    defaultExpandAll: true,
    checkable: true,
  });
  await fire(row(a, "b"), "click");
  await settle();
  assert.equal(a.props.modelValue, "b");
  assert.equal(a.events.select[0][0].id, "b");
  await a.vm.setChecked("a", true);
  assert.deepEqual(a.vm.getHalfCheckedKeys(), ["root"]);
  assert.deepEqual(a.vm.getCheckedKeys(), ["a"]);
  await a.vm.setChecked("b", true);
  assert.deepEqual(a.vm.getCheckedKeys(), ["root", "a", "b"]);
  assert.equal(row(a, "root").getAttribute("aria-checked"), "true");
  assert.equal(await a.vm.setChecked("locked", true), false);
  await a.vm.setChecked("a", false);
  assert.deepEqual(a.vm.getCheckedKeys(), ["b"]);
  assert.equal(row(a, "root").getAttribute("aria-checked"), "mixed");
  assert(a.events.check.at(-1)[1].checkedNodes.some((n) => n.id === "b"));
});
test("Tree uncontrolled defaults work independently for selection, checks and expansion", async () => {
  const api = ref(),
    Wrapper = defineComponent({
      setup() {
        return () =>
          h(ui.HysTree, {
            ref: api,
            nodes,
            defaultValue: "a",
            defaultCheckedKeys: ["root"],
            defaultExpandedKeys: ["root"],
            allowDeselect: true,
            checkable: true,
          });
      },
    }),
    a = await mount(Wrapper);
  assert.equal(api.value.getCurrentKey(), "a");
  assert.deepEqual(api.value.getCheckedKeys(true), ["a", "b"]);
  await fire(row(a, "a"), "click");
  assert.equal(api.value.getCurrentKey(), null);
  assert.equal(api.value.getCurrentNode(), null);
  await api.value.setChecked("b", false);
  assert.deepEqual(api.value.getHalfCheckedKeys(), ["root"]);
  await api.value.collapseAll();
  assert.deepEqual(ids(a), ["root", "other"]);
});
test("Tree controlled hosts can reject selection, checked and expansion updates", async () => {
  const api = ref(),
    requests = [],
    Wrapper = defineComponent({
      setup() {
        return () =>
          h(ui.HysTree, {
            ref: api,
            nodes,
            modelValue: "a",
            checkedKeys: [],
            expandedKeys: [],
            checkable: true,
            "onUpdate:modelValue": (v) => requests.push(v),
          });
      },
    }),
    a = await mount(Wrapper);
  assert.equal(await api.value.setCurrentKey("other", false), false);
  assert.equal(api.value.getCurrentKey(), "a");
  assert.equal(await api.value.setChecked("root", true), false);
  assert.deepEqual(api.value.getCheckedKeys(), []);
  assert.equal(await api.value.expandNode("root"), false);
  assert.deepEqual(ids(a), ["root", "other"]);
  assert.deepEqual(requests, ["other"]);
});
test("Tree business fields retain number zero, string-number identity and raw slot objects", async () => {
  const data = [
      {
        meta: { code: 0, name: "Numeric zero" },
        kids: [{ meta: { code: "0", name: "String zero" } }],
      },
      { meta: { code: 2, name: "Locked" }, closed: true },
    ],
    a = await mount(
      ui.HysTree,
      {
        nodes: data,
        nodeKey: (n) => n.meta.code,
        fieldNames: {
          label: "meta.name",
          children: "kids",
          disabled: "closed",
        },
        defaultExpandAll: true,
      },
      {
        node: ({ node, key }) =>
          h("span", { class: "raw" }, typeof key + ":" + node.meta.name),
      },
    );
  assert.deepEqual(ids(a), ["0", "0", "2"]);
  await fire(row(a, 0), "click");
  assert.equal(a.props.modelValue, 0);
  assert.equal(a.vm.getNode("0").meta.name, "String zero");
  assert.equal(a.vm.getNodeInfo("0").parent, 0);
  assert(a.find(".raw").textContent.includes("number"));
  assert.equal(await a.vm.setCurrentKey(2), false);
});
test("Tree duplicate and cyclic input is bounded and does not rewrite source objects", async () => {
  const cyclic = { id: "one", label: "One", children: [] };
  cyclic.children = [cyclic, { id: "two", label: "Two" }];
  const a = await mount(ui.HysTree, {
    nodes: [
      cyclic,
      { id: "one", label: "Duplicate" },
      { id: NaN, label: "Bad" },
    ],
    defaultExpandAll: true,
  });
  assert.deepEqual(ids(a), ["one", "two"]);
  assert.equal(cyclic.children[0], cyclic);
  assert(!a.host.textContent.includes("Duplicate"));
});
test("Tree checking respects disabled barriers, hidden checkboxes and explicit strict half states", async () => {
  const data = [
      {
        id: "p",
        label: "Parent",
        children: [
          {
            id: "x",
            label: "Barrier",
            disableCheckbox: true,
            children: [{ id: "y", label: "Child" }],
          },
          { id: "z", label: "No checkbox", checkable: false },
          { id: "a", label: "Active" },
        ],
      },
    ],
    a = await mount(ui.HysTree, {
      nodes: data,
      defaultExpandAll: true,
      checkable: true,
      defaultCheckedKeys: ["x"],
    });
  await a.vm.setChecked("p", true);
  assert.deepEqual(a.vm.getCheckedKeys(), ["p", "x", "a"]);
  assert(!row(a, "z").querySelector("input[type=checkbox]"));
  await a.vm.setChecked("y", true);
  assert(a.vm.getCheckedKeys().includes("y"));
  a.props.checkStrictly = true;
  a.props.checkedKeys = ["a"];
  a.props.halfCheckedKeys = ["p"];
  await settle();
  assert.deepEqual(a.vm.getHalfCheckedKeys(), ["p"]);
  await a.vm.setChecked("p", true, true);
  assert(a.vm.getCheckedKeys().includes("a"));
  assert(!a.vm.getCheckedKeys().includes("y"));
});
test("Tree auto expands ancestors and accordion only closes siblings at the same depth", async () => {
  const a = await mount(ui.HysTree, {
    nodes,
    defaultExpandedKeys: ["a"],
    autoExpandParent: true,
    accordion: true,
  });
  assert(row(a, "a"));
  assert(a.vm.getExpandedKeys().includes("root"));
  await a.vm.expandNode("other");
  assert(!row(a, "a"));
  assert(row(a, "c"));
  await a.vm.setCurrentKey("b");
  assert(row(a, "b"));
  assert.equal(a.vm.getCurrentNode().id, "b");
  await a.vm.setCurrentKey(null);
  assert.equal(a.vm.getCurrentKey(), null);
});
test("Tree search keeps ancestors, supports subtree matches and highlighting without hiding", async () => {
  const a = await mount(ui.HysTree, {
    nodes,
    defaultExpandedKeys: [],
    searchValue: "",
  });
  a.vm.filter("ALPHA");
  await settle();
  assert.deepEqual(ids(a), ["root", "a"]);
  assert.equal(row(a, "root").getAttribute("aria-expanded"), "true");
  a.vm.filter("Root");
  a.props.showMatchedChildren = true;
  await settle();
  assert.deepEqual(ids(a), ["root", "a", "b", "locked"]);
  a.props.filterMode = "highlight";
  a.props.expandedKeys = ["root"];
  a.vm.filter("beta");
  await settle();
  assert.equal(a.all(".hys-ui-tree-matched").length, 1);
  assert(row(a, "other"));
  a.props.filterNode = (q, n) => q === "exact" && n.id === "c";
  a.vm.filter("exact");
  a.props.filterMode = "hide";
  await settle();
  assert.deepEqual(ids(a), ["other", "c"]);
  a.vm.filter("none");
  await settle();
  assert(a.host.textContent.includes("无匹配节点"));
});
test("Tree lazy loads once, checks late children and retries failures with raw context", async () => {
  let calls = 0,
    fail = true,
    context;
  const data = [{ id: "p", label: "Lazy", hasChildren: true }],
    a = await mount(ui.HysTree, {
      nodes: data,
      checkable: true,
      defaultCheckedKeys: ["p"],
      loadChildren: async (node, ctx) => {
        calls++;
        context = ctx;
        if (fail) throw Error("network");
        return [{ id: "c", label: "Loaded" }];
      },
    });
  await a.vm.expandNode("p");
  await settle();
  assert.equal(calls, 1);
  assert(a.find(".hys-ui-tree-retry"));
  fail = false;
  assert.equal(await a.vm.reloadNode("p"), true);
  await settle();
  assert.equal(context.key, "p");
  assert.equal(context.signal.aborted, false);
  assert(row(a, "c"));
  assert.deepEqual(a.vm.getCheckedKeys(), ["p", "c"]);
  await a.vm.expandNode("p", false);
  await a.vm.expandNode("p");
  assert.equal(calls, 2);
  assert.equal(data[0].children, undefined);
  assert.equal(a.events["children-loaded"].length, 1);
});
test("Tree async results are cancelled on source replacement and cannot insert stale children", async () => {
  let finish, signal;
  const a = await mount(ui.HysTree, {
    nodes: [{ id: "p", label: "Lazy", hasChildren: true }],
    loadChildren: (n, c) => {
      signal = c.signal;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  void a.vm.expandNode("p");
  await settle();
  a.props.nodes = [{ id: "p", label: "Replacement" }];
  await settle();
  assert(signal.aborted);
  finish([{ id: "stale", label: "Stale" }]);
  await settle();
  assert(!a.vm.getNode("stale"));
  assert(!a.events["children-loaded"]);
});
test("Tree controlled loaded keys can reject asynchronous data acceptance", async () => {
  const api = ref(),
    Wrapper = defineComponent({
      setup() {
        return () =>
          h(ui.HysTree, {
            ref: api,
            nodes: [{ id: "p", label: "Lazy", hasChildren: true }],
            loadedKeys: [],
            loadChildren: async () => [{ id: "c", label: "Child" }],
          });
      },
    }),
    a = await mount(Wrapper);
  await api.value.expandNode("p");
  await settle();
  assert(!api.value.getNode("c"));
  assert(!a.find("[data-tree-id=c]"));
});
test("Tree data editing emits immutable trees and requires accepted source updates", async () => {
  const original = structuredClone(nodes),
    a = await mount(ui.HysTree, { nodes: original, defaultExpandAll: true });
  assert.equal(await a.vm.append({ id: "new", label: "New" }, "root"), true);
  assert.equal(original[0].children.length, 3);
  assert(a.vm.getNode("new"));
  assert.equal(
    await a.vm.insertBefore({ id: "before", label: "Before" }, "new"),
    true,
  );
  assert.equal(a.props.nodes[0].children.at(-2).id, "before");
  assert.equal(
    await a.vm.insertAfter({ id: "after", label: "After" }, "new"),
    true,
  );
  assert.equal(await a.vm.remove("new"), true);
  assert(!a.vm.getNode("new"));
  assert.equal(
    await a.vm.updateKeyChildren("other", [{ id: "d", label: "Replacement" }]),
    true,
  );
  assert(a.vm.getNode("d"));
  assert(!a.vm.getNode("c"));
  assert.equal(await a.vm.append({ id: "d", label: "Duplicate" }), false);
  assert.equal(await a.vm.remove("locked"), false);
  assert.equal(
    await a.vm.updateKeyChildren("locked", [{ id: "no", label: "No" }]),
    false,
  );
  assert.equal(
    await a.vm.append({
      id: "invalid",
      label: "Invalid branch",
      children: [{ id: "d", label: "Duplicate existing child" }],
    }),
    false,
  );
});
test("Tree editing with dotted children paths preserves business fields and rejects host vetoes", async () => {
  const data = [{ key: 0, text: "Root", meta: { items: [], extra: 123 } }],
    a = await mount(ui.HysTree, {
      nodes: data,
      nodeKey: "key",
      fieldNames: { label: "text", children: "meta.items" },
    });
  assert.equal(await a.vm.append({ key: 1, text: "Added" }, 0), true);
  assert.equal(a.props.nodes[0].meta.extra, 123);
  assert.equal(data[0].meta.items.length, 0);
  a.unmount();
  const api = ref(),
    Wrapper = defineComponent({
      setup() {
        return () =>
          h(ui.HysTree, {
            ref: api,
            nodes: data,
            nodeKey: "key",
            fieldNames: { label: "text", children: "meta.items" },
          });
      },
    });
  await mount(Wrapper);
  assert.equal(await api.value.append({ key: 2, text: "No" }, 0), false);
  assert.equal(api.value.getNode(2), undefined);
});
test("Tree virtual rendering and keyboard navigation bound DOM and skip disabled rows", async () => {
  const data = Array.from({ length: 20000 }, (_, id) => ({
      id,
      label: "Item " + id,
      disabled: id === 1,
    })),
    a = await mount(ui.HysTree, {
      nodes: data,
      virtual: true,
      rowHeight: 32,
      viewportHeight: 240,
    });
  assert(a.all("[role=treeitem]").length < 20);
  await a.vm.focus(0);
  await fire(row(a, 0), "keydown", { key: "ArrowDown" });
  await settle();
  assert.equal(document.activeElement.getAttribute("data-tree-id"), "2");
  await fire(document.activeElement, "keydown", { key: "End" });
  await settle();
  assert(row(a, 19999));
  assert.equal(document.activeElement.getAttribute("data-tree-id"), "19999");
  assert(a.all("[role=treeitem]").length < 20);
  await a.vm.scrollTo({ key: 8000, align: "top" });
  assert.equal(a.find("[role=tree]").scrollTop, 256000);
  assert(row(a, 8000));
  a.props.viewportHeight = NaN;
  a.props.rowHeight = Infinity;
  await settle();
  assert(a.all("[role=treeitem]").length < 30);
});
test("Tree native drag guards self, descendants, foreign drags and denied positions", async () => {
  const a = await mount(ui.HysTree, {
    nodes,
    draggable: true,
    defaultExpandAll: true,
    allowDrop: (from, to, pos) => pos === "after",
  });
  drag(row(a, "other"), "dragover", 59);
  drag(row(a, "other"), "drop", 59);
  assert(!a.events["node-drop"]);
  drag(row(a, "root"), "dragstart");
  drag(row(a, "a"), "dragover", 59);
  drag(row(a, "a"), "drop", 59);
  assert(!a.events["node-drop"]);
  drag(row(a, "a"), "dragstart");
  drag(row(a, "other"), "dragover", 21);
  assert(!a.find(".hys-ui-pf-tree-drop"));
  drag(row(a, "other"), "dragover", 59);
  await settle();
  assert.equal(a.find(".hys-ui-pf-tree-drop").dataset.dropPosition, "after");
  drag(row(a, "other"), "drop", 59);
  await settle();
  assert.equal(a.events["node-drop"][0][0].dragId, "a");
  assert(!a.find(".hys-ui-pf-tree-drop"));
  assert.equal(a.events["node-drag-end"].length, 2);
});
test("Tree context menus use local themes and keyboard focus while disabled trees stay inert", async () => {
  const a = await mount(ui.HysTree, {
    nodes,
    contextMenu: true,
    defaultExpandAll: true,
  });
  await fire(row(a, "a"), "contextmenu", { clientX: 40, clientY: 40 });
  assert(document.querySelector("[role=menu]"));
  assert.equal(document.activeElement.getAttribute("role"), "menuitem");
  await fire(document.activeElement, "keydown", { key: "Escape" });
  await settle();
  assert(!document.querySelector("[role=menu]"));
  assert.equal(document.activeElement.getAttribute("data-tree-id"), "a");
  a.props.disabled = true;
  await settle();
  await fire(row(a, "a"), "contextmenu");
  assert(!document.querySelector("[role=menu]"));
  assert.equal(await a.vm.setChecked("a", true), false);
});

test("Tree forms link to the composite tree, validate checked keys and keep internal search out of form state", async () => {
  const model = reactive({ teams: [] }),
    api = ref(),
    a = await mount(
      ui.HysForm,
      {
        model,
        rules: {
          teams: {
            required: true,
            type: "array",
            min: 1,
            message: "Choose a team",
          },
        },
      },
      {
        default: () =>
          h(ui.HysFormItem, { prop: "teams", label: "Teams" }, () =>
            h(ui.HysTree, {
              ref: api,
              nodes,
              checkable: true,
              defaultExpandAll: true,
              checkedKeys: model.teams,
              "onUpdate:checkedKeys": (keys) => (model.teams = keys),
            }),
          ),
      },
    );
  await settle();
  const tree = a.find("[role=tree]"),
    label = a.find("label");
  assert.equal(label.htmlFor, tree.id);
  assert(tree.hasAttribute("data-hys-ui-field-managed"));
  await fire(a.find("form"), "submit");
  await pause(5);
  await settle();
  assert.equal(tree.getAttribute("aria-invalid"), "true");
  assert.equal(document.activeElement.getAttribute("data-tree-id"), "root");
  const search = a.find("input:not([type=checkbox])");
  search.value = "Alpha";
  await fire(search, "input");
  await settle();
  assert.deepEqual(model.teams, []);
  assert.equal(a.vm.errors.teams, "Choose a team");
  await api.value.setChecked("a", true);
  await settle();
  assert.deepEqual(model.teams, ["a"]);
  assert.equal(a.vm.errors.teams, undefined);
  a.vm.resetFields();
  await settle();
  assert.deepEqual(model.teams, []);
  assert.equal(api.value.getCheckedKeys().length, 0);
  a.props.disabled = true;
  await settle();
  assert.equal(await api.value.setChecked("a", true), false);
});
test("Tree cached pages cancel loaders, close menus and restore virtual scroll without late results", async () => {
  const show = ref(true),
    api = ref(),
    pending = [],
    signals = [],
    data = [
      ...Array.from({ length: 300 }, (_, i) => ({ id: i, label: "Item " + i })),
      { id: 999, label: "Lazy", hasChildren: true },
    ],
    Cached = defineComponent({
      setup() {
        return () =>
          h(ui.HysTree, {
            ref: api,
            nodes: data,
            virtual: true,
            rowHeight: 32,
            viewportHeight: 200,
            contextMenu: true,
            loadChildren: (node, ctx) => {
              signals.push(ctx.signal);
              return new Promise((resolve) => pending.push(resolve));
            },
          });
      },
    }),
    Wrapper = defineComponent({
      setup() {
        return () =>
          h(KeepAlive, null, {
            default: () => (show.value ? h(Cached) : h("div", "Other")),
          });
      },
    }),
    a = await mount(Wrapper);
  await api.value.scrollTo({ key: 280, align: "top" });
  const port = a.find("[role=tree]");
  assert.equal(port.scrollTop, 8960);
  const expanding = api.value.expandNode(999);
  await settle();
  await fire(row(a, 280), "contextmenu");
  assert(document.querySelector("[role=menu]"));
  show.value = false;
  await settle();
  await expanding;
  assert(signals[0].aborted);
  assert(!document.querySelector("[role=menu]"));
  port.scrollTop = 0;
  show.value = true;
  await settle();
  assert.equal(port.scrollTop, 8960);
  assert.equal(pending.length, 2);
  pending[0]([{ id: 1000, label: "Stale" }]);
  await settle();
  assert(!api.value.getNode(1000));
  pending[1]([{ id: 1001, label: "Current" }]);
  await settle();
  assert(api.value.getNode(1001));
});
test("Tree hover expansion and global Escape cleanup respect active drag lifecycle", async () => {
  const a = await mount(ui.HysTree, {
    nodes,
    draggable: true,
    dragExpandDelay: 15,
  });
  drag(row(a, "other"), "dragstart");
  drag(row(a, "root"), "dragover", 40);
  await pause(25);
  await settle();
  assert(row(a, "a"));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  await settle();
  assert(!a.find(".hys-ui-pf-tree-drop"));
  assert(!a.find(".hys-ui-tree-row-dragging"));
  await a.vm.collapseAll();
  drag(row(a, "other"), "dragstart");
  drag(row(a, "root"), "dragover", 40);
  a.props.disabled = true;
  await settle();
  await pause(25);
  assert(!row(a, "a"));
});
