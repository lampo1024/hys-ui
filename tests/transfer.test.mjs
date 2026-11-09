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

const options = [
  { value: "a", label: "Alice" },
  { value: "b", label: "Bob" },
  { value: "c", label: "Carol", disabled: true },
  { value: "d", label: "David" },
];
const settle = async () => {
  await nextTick();
  await nextTick();
};
const pane = (item, side) => item.find('[data-side="' + side + '"]');
const rows = (item, side) => [
  ...pane(item, side).querySelectorAll("[data-transfer-key]"),
];
const labels = (item, side) =>
  rows(item, side).map((row) =>
    row.querySelector(".hys-ui-transfer-label").textContent.trim(),
  );
HTMLElement.prototype.scrollTo = function (options) {
  this.scrollTop = options.top ?? 0;
  this.dispatchEvent(new Event("scroll"));
};
test("Transfer preserves the existing model, moved-key events and button workflow", async () => {
  const a = await mount(ui.HysTransfer, { modelValue: ["b"], options });
  const header = pane(a, "left").querySelector("input[type=checkbox]");
  header.checked = true;
  await fire(header, "change");
  assert.deepEqual([...a.vm.getCheckedKeys("left")], ["a", "d"]);
  await fire(a.find('[aria-label="添加选中项"]'), "click");
  assert.deepEqual([...a.props.modelValue], ["b", "a", "d"]);
  assert.deepEqual(a.events.change.at(-1), [
    ["b", "a", "d"],
    "right",
    ["a", "d"],
  ]);
  await settle();
  assert.deepEqual([...a.vm.checkedKeys], []);
  assert.deepEqual(labels(a, "left"), ["Carol"]);
  assert.deepEqual(labels(a, "right"), ["Alice", "Bob", "David"]);
  assert.equal(options.length, 4);
});
test("Side-specific defaults only check items initially present in the designated panel", async () => {
  const a = await mount(ui.HysTransfer, {
    options,
    modelValue: ["b"],
    defaultCheckedKeys: ["a"],
    leftDefaultChecked: ["b", "d"],
    rightDefaultChecked: ["a", "b"],
  });
  assert.deepEqual([...a.vm.getCheckedKeys("left")], ["a", "d"]);
  assert.deepEqual([...a.vm.getCheckedKeys("right")], ["b"]);
});
test("Change-only consumers may accept transfers and controlled hosts may veto requests", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const model = ref(["b"]),
    api = ref(),
    requests = [];
  let accept = false;
  const app = createApp({
    render: () =>
      h(ui.HysTransfer, {
        ref: api,
        options,
        modelValue: model.value,
        onChange: (value, direction, moved) => {
          requests.push([value, direction, moved]);
          if (accept) model.value = value;
        },
      }),
  });
  app.mount(host);
  try {
    assert.equal(await api.value.move("right", ["a"]), false);
    assert.deepEqual(model.value, ["b"]);
    assert.equal(requests.length, 1);
    assert.equal(
      host
        .querySelector("[data-side=left] [data-transfer-key]")
        .textContent.trim(),
      "Alice",
    );
    accept = true;
    assert.equal(await api.value.move("right", ["a"]), true);
    assert.deepEqual(model.value, ["b", "a"]);
    assert.deepEqual(requests.at(-1)[2], ["a"]);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Original, push and unshift target order stay distinct without mutating the source", async () => {
  const a = await mount(ui.HysTransfer, {
    modelValue: ["b"],
    options,
    targetOrder: "push",
  });
  await a.vm.move("right", ["d", "a"]);
  assert.deepEqual(labels(a, "right"), ["Bob", "David", "Alice"]);
  a.props.targetOrder = "original";
  await settle();
  assert.deepEqual(labels(a, "right"), ["Alice", "Bob", "David"]);
  assert.deepEqual([...a.props.modelValue], ["b", "d", "a"]);
  a.props.targetOrder = "unshift";
  await a.vm.move("left", ["a", "d"]);
  await a.vm.move("right", ["d", "a"]);
  assert.deepEqual([...a.props.modelValue], ["d", "a", "b"]);
  assert.deepEqual(labels(a, "right"), ["David", "Alice", "Bob"]);
  assert.deepEqual(
    options.map((x) => x.value),
    ["a", "b", "c", "d"],
  );
});
test("Field mappings and row-key functions preserve number/string identity and skip invalid duplicates", async () => {
  const a = await mount(ui.HysTransfer, {
    modelValue: [1],
    options: [
      { uid: 1, profile: { name: "Numeric" } },
      { uid: "1", profile: { name: "String" } },
      { uid: 0, profile: { name: "Zero" }, locked: true },
      { uid: 1, profile: { name: "Duplicate" } },
      { uid: NaN, profile: { name: "Invalid" } },
    ],
    rowKey: (row) => row.uid,
    fieldNames: { label: "profile.name", disabled: "locked" },
  });
  assert.deepEqual(labels(a, "right"), ["Numeric"]);
  assert.deepEqual(labels(a, "left"), ["String", "Zero"]);
  assert.equal(await a.vm.move("right", ["1", 0]), true);
  assert.deepEqual([...a.props.modelValue], [1, "1"]);
  assert.equal(await a.vm.remove([0]), false);
  assert.equal(a.all("[data-transfer-key]").length, 3);
});
test("Unknown target keys remain host-owned until their asynchronously supplied options arrive", async () => {
  const a = await mount(ui.HysTransfer, {
    modelValue: ["missing", "b"],
    options,
    targetOrder: "push",
  });
  await a.vm.move("right", ["a"]);
  assert.deepEqual([...a.props.modelValue], ["missing", "b", "a"]);
  a.props.options = [...options, { label: "Loaded later", value: "missing" }];
  await settle();
  assert.deepEqual(labels(a, "right"), ["Loaded later", "Bob", "Alice"]);
  assert.equal(await a.vm.move("left", ["c"]), false);
});
test("Independent case-insensitive search and custom matching do not alter target selection", async () => {
  const a = await mount(ui.HysTransfer, { modelValue: ["b", "d"], options });
  a.vm.setSearch("left", "AL");
  a.vm.setSearch("right", "da");
  await settle();
  assert.deepEqual(labels(a, "left"), ["Alice"]);
  assert.deepEqual(labels(a, "right"), ["David"]);
  assert.deepEqual([...a.props.modelValue], ["b", "d"]);
  assert.deepEqual(a.events.search.at(-1), ["right", "da"]);
  a.props.filterMethod = (query, row) => row.value === query;
  a.vm.setSearch("left", "c");
  await settle();
  assert.deepEqual(labels(a, "left"), ["Carol"]);
  a.vm.clearSearch();
  await settle();
  assert.equal(rows(a, "left").length, 2);
  assert.equal(rows(a, "right").length, 2);
});
test("Same-tick controlled updates compose independently and reverting a requested search is respected", async () => {
  const a = await mount(ui.HysTransfer, {
    options: Array.from({ length: 30 }, (_, i) => ({
      value: String(i),
      label: "Item " + i,
    })),
    modelValue: Array.from({ length: 15 }, (_, i) => String(i + 15)),
    searchValues: { left: "", right: "" },
    pages: { left: 1, right: 1 },
    pageSizes: { left: 5, right: 5 },
    pagination: true,
  });
  a.vm.setSearch("left", "1");
  a.vm.setSearch("right", "2");
  a.vm.setSearch("left", "");
  await settle();
  assert.equal(
    pane(a, "left").querySelector("input:not([type=checkbox])").value,
    "",
  );
  assert.equal(
    pane(a, "right").querySelector("input:not([type=checkbox])").value,
    "2",
  );
  a.vm.clearSearch();
  await settle();
  assert.equal(
    pane(a, "right").querySelector("input:not([type=checkbox])").value,
    "",
  );
  a.vm.setPage("left", 2);
  a.vm.setPage("right", 2);
  await settle();
  assert.deepEqual({ ...a.props.pages }, { left: 2, right: 2 });
  a.vm.setPageSize("left", 3);
  a.vm.setPageSize("right", 4);
  await settle();
  assert.deepEqual({ ...a.props.pageSizes }, { left: 3, right: 4 });
  assert.deepEqual({ ...a.props.pages }, { left: 1, right: 1 });
});
test("Select-all, inversion and half selection apply to eligible current-page rows and retain other checks", async () => {
  const data = Array.from({ length: 8 }, (_, i) => ({
    value: String(i),
    label: "Item " + i,
    disabled: i === 1,
  }));
  const a = await mount(ui.HysTransfer, {
    options: data,
    modelValue: ["7"],
    pagination: { pageSize: 3 },
    defaultCheckedKeys: ["0", "7"],
  });
  assert.equal(pane(a, "left").querySelector("input").indeterminate, true);
  await a.vm.checkAll("left");
  assert.deepEqual([...a.vm.getCheckedKeys("left")], ["0", "2"]);
  a.vm.setPage("left", 2);
  await settle();
  await a.vm.invertSelection("left");
  assert.deepEqual([...a.vm.getCheckedKeys("left")], ["0", "2", "3", "4", "5"]);
  assert.deepEqual([...a.vm.getCheckedKeys("right")], ["7"]);
  await a.vm.checkAll("left", false);
  assert.deepEqual([...a.vm.getCheckedKeys("left")], ["0", "2"]);
  await a.vm.checkAll("left", true, "filtered");
  assert.equal(a.vm.getCheckedKeys("left").length, 6);
  await a.vm.clearChecked("left");
  assert.deepEqual([...a.vm.checkedKeys], ["7"]);
});
test("Controlled checked keys can reject updates without visually changing checkboxes", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const api = ref(),
    requested = [],
    app = createApp({
      render: () =>
        h(ui.HysTransfer, {
          ref: api,
          options,
          checkedKeys: ["a"],
          onCheckChange: (side, keys) => requested.push([side, keys]),
        }),
    });
  app.mount(host);
  try {
    assert.equal(await api.value.setCheckedKeys(["b"]), false);
    assert.deepEqual([...api.value.checkedKeys], ["a"]);
    assert.equal(
      host.querySelector('[data-transfer-key="string:a"] input').checked,
      true,
    );
    assert.equal(
      host.querySelector('[data-transfer-key="string:b"] input').checked,
      false,
    );
    assert.deepEqual(requested.at(-1), ["left", ["b"]]);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Search resets only its own pagination; page-size changes and data shrink remain valid", async () => {
  const a = await mount(ui.HysTransfer, {
    options: Array.from({ length: 30 }, (_, i) => ({
      value: String(i),
      label: "Item " + i,
    })),
    modelValue: ["25", "26", "27", "28", "29"],
    pagination: { pageSize: 3, showSizeChanger: true },
  });
  a.vm.setPage("left", 3);
  a.vm.setPage("right", 2);
  await settle();
  assert.equal(rows(a, "left")[0].dataset.transferKey, "string:6");
  a.vm.setSearch("left", "Item 1");
  await settle();
  assert.equal(rows(a, "left")[0].dataset.transferKey, "string:1");
  assert.equal(rows(a, "right")[0].dataset.transferKey, "string:28");
  assert.equal(a.props.pages.left, 1);
  assert.equal(a.props.pages.right, 2);
  a.vm.setPageSize("left", 5);
  await settle();
  assert.equal(rows(a, "left").length, 5);
  assert.equal(a.props.pageSizes.left, 5);
  a.props.options = a.props.options.slice(0, 2);
  await settle();
  assert.equal(rows(a, "left").length, 1);
  assert(pane(a, "right").textContent.includes("暂无已选"));
});
test("One-way mode removes individual rows while disabled targets and reverse dragging remain protected", async () => {
  const a = await mount(ui.HysTransfer, {
    options,
    modelValue: ["b", "c"],
    oneWay: true,
    defaultCheckedKeys: ["a"],
  });
  assert(!a.find('[aria-label="移除选中项"]'));
  assert.equal(
    pane(a, "right").querySelectorAll("input[type=checkbox]").length,
    0,
  );
  assert.equal(
    pane(a, "right").querySelector('[aria-label="移除Carol"]').disabled,
    true,
  );
  await fire(pane(a, "right").querySelector('[aria-label="移除Bob"]'), "click");
  assert.deepEqual([...a.props.modelValue], ["c"]);
  await a.vm.move("right", ["a"]);
  await settle();
  await a.vm.remove(["a"]);
  assert.deepEqual([...a.vm.checkedKeys], []);
  assert.equal(
    pane(a, "left").querySelector('[data-transfer-key="string:a"] input')
      .checked,
    false,
  );
});
const drag = async (
  element,
  type,
  {
    transfer = { setData() {}, effectAllowed: "move" },
    relatedTarget = null,
  } = {},
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    dataTransfer: { value: transfer },
    relatedTarget: { value: relatedTarget },
  });
  element.dispatchEvent(event);
  await nextTick();
  return event;
};
test("Group dragging moves checked source items, highlights valid targets and cleans up on release", async () => {
  const a = await mount(ui.HysTransfer, { options, modelValue: ["b"] });
  await a.vm.setCheckedKeys(["a", "d"]);
  const row = pane(a, "left").querySelector('[data-transfer-key="string:a"]');
  await drag(row, "dragstart");
  assert.equal(a.events.dragStart.at(-1)[1].length, 2);
  assert.equal(a.all(".hys-ui-is-dragging").length, 2);
  assert.equal(
    (await drag(pane(a, "right"), "dragover")).defaultPrevented,
    true,
  );
  assert(pane(a, "right").classList.contains("hys-ui-is-drop-target"));
  await drag(pane(a, "right"), "drop");
  await settle();
  assert.deepEqual([...a.props.modelValue], ["b", "a", "d"]);
  assert.equal(a.all(".hys-ui-is-dragging").length, 0);
  assert.equal(a.events.dragEnd.length, 1);
});
test("Foreign, disabled and cancelled drags never move data or leave a stale target", async () => {
  const a = await mount(ui.HysTransfer, { options, modelValue: [] });
  assert.equal(
    (await drag(pane(a, "right"), "dragover")).defaultPrevented,
    false,
  );
  await drag(
    pane(a, "left").querySelector('[data-transfer-key="string:c"]'),
    "dragstart",
  );
  assert(!a.events.dragStart);
  await drag(
    pane(a, "left").querySelector('[data-transfer-key="string:a"]'),
    "dragstart",
  );
  await drag(pane(a, "right"), "dragover");
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  await settle();
  assert(!pane(a, "right").classList.contains("hys-ui-is-drop-target"));
  assert.deepEqual([...a.props.modelValue], []);
  await drag(
    pane(a, "left").querySelector('[data-transfer-key="string:a"]'),
    "dragstart",
  );
  a.props.disabled = true;
  await settle();
  assert.equal(a.all(".hys-ui-is-dragging").length, 0);
  assert.equal(await a.vm.move("right", ["a"]), false);
});
test("Virtual scrolling bounds DOM and public scrollTo renders the requested row", async () => {
  const a = await mount(ui.HysTransfer, {
    options: Array.from({ length: 10000 }, (_, i) => ({
      value: i,
      label: "Item " + i,
    })),
    virtual: true,
    listHeight: 160,
    itemHeight: 32,
  });
  assert(rows(a, "left").length < 20);
  await a.vm.scrollTo("left", { key: 9999 });
  await settle();
  assert(pane(a, "left").querySelector('[data-transfer-key="number:9999"]'));
  assert(rows(a, "left").length < 20);
  assert.equal(await a.vm.move("right", [9999]), true);
  await settle();
  assert.equal(rows(a, "right")[0].dataset.transferKey, "number:9999");
});
test("Custom panels, headers, footer and empty slots share the same state and preserve option objects", async () => {
  let context;
  const a = await mount(
    ui.HysTransfer,
    { options, modelValue: [], filterable: false },
    {
      panel: (scope) => {
        if (scope.side === "left") context = scope;
        return h("p", scope.items.map((item) => item.label).join(","));
      },
      header: ({ info }) => h("strong", info.side + ":" + info.total),
      "right-footer": (scope) =>
        h("span", scope.filteredItems.length + " targets"),
    },
  );
  assert.equal(a.find("header").textContent, "left:4");
  assert.equal(
    pane(a, "right").querySelector("footer").textContent,
    "0 targets",
  );
  await context.check("a", true);
  await a.vm.move("right");
  await settle();
  assert.equal(
    pane(a, "right").querySelector("footer").textContent,
    "1 targets",
  );
  assert.equal(a.vm.getTargetItems()[0].label, "Alice");
  const empty = await mount(
    ui.HysTransfer,
    { options: [] },
    {
      "left-empty": () => h("p", "No source"),
      "right-empty": () => h("p", "No target"),
    },
  );
  assert(empty.host.textContent.includes("No source"));
  assert(empty.host.textContent.includes("No target"));
});
test("Loading and disabled controls block interaction and localize all visible states", async () => {
  const a = await mount(ui.HysTransfer, {
    options,
    loading: true,
    locale: {
      leftTitle: "Source",
      rightTitle: "Target",
      loading: "Please wait",
      moveRight: "Add",
      moveLeft: "Remove",
    },
  });
  assert.equal(a.find(".hys-ui-transfer").getAttribute("aria-busy"), "true");
  assert.equal(a.all('[aria-label="Please wait"]').length, 2);
  assert(a.all("input,button").every((el) => el.disabled));
  assert.equal(await a.vm.move("right", ["a"]), false);
  assert.equal(await a.vm.setCheckedKeys(["a"]), false);
  a.props.loading = false;
  await settle();
  assert(a.find('[aria-label="Add"]'));
  assert(pane(a, "left").textContent.includes("Source"));
});
test("Composite form integration inherits field size and validates transfers rather than internal checks/search", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const state = reactive({ members: [] }),
    api = ref(),
    disabled = ref(false);
  let validations = 0;
  const app = createApp({
    render: () =>
      h(
        ui.HysForm,
        { model: state, size: "sm", disabled: disabled.value },
        {
          default: () =>
            h(
              ui.HysFormItem,
              {
                prop: "members",
                label: "Members",
                rules: {
                  type: "array",
                  required: true,
                  validator: () => {
                    validations++;
                    return true;
                  },
                },
              },
              {
                default: () =>
                  h(ui.HysTransfer, {
                    ref: api,
                    options,
                    modelValue: state.members,
                    "onUpdate:modelValue": (value) => (state.members = value),
                  }),
              },
            ),
        },
      ),
  });
  app.mount(host);
  try {
    await settle();
    assert.equal(host.querySelector(".hys-ui-transfer").dataset.size, "sm");
    await api.value.setCheckedKeys(["a"]);
    api.value.setSearch("left", "al");
    await settle();
    assert.equal(validations, 0);
    const search = host.querySelector(".hys-ui-pf-transfer-search input"),
      enter = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
    search.dispatchEvent(enter);
    assert.equal(
      enter.defaultPrevented,
      true,
      "Internal filtering must not implicitly submit the enclosing form",
    );
    const composition = new KeyboardEvent("keydown", {
      key: "Enter",
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    search.dispatchEvent(composition);
    assert.equal(composition.defaultPrevented, false);
    await api.value.move("right");
    await settle();
    assert(validations > 0);
    const ids = [...host.querySelectorAll("[id]")].map((el) => el.id);
    assert.equal(
      ids.length,
      new Set(ids).size,
      "Composite inputs need unique DOM identifiers",
    );
    disabled.value = true;
    await settle();
    assert(
      [...host.querySelectorAll("input,button")].every((el) =>
        el.matches(":disabled"),
      ),
    );
    assert.equal(await api.value.move("left", ["a"]), false);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Cached-page deactivation cancels drag state and suppresses stale accepted operations", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const show = ref(true),
    api = ref(),
    model = ref([]),
    app = createApp({
      render: () =>
        h(KeepAlive, null, {
          default: () =>
            show.value
              ? h(ui.HysTransfer, {
                  ref: api,
                  options,
                  modelValue: model.value,
                  "onUpdate:modelValue": (value) => (model.value = value),
                })
              : h("div", "Other"),
        }),
    });
  app.mount(host);
  try {
    await settle();
    await api.value.setCheckedKeys(["a"]);
    await drag(
      host.querySelector('[data-transfer-key="string:a"]'),
      "dragstart",
    );
    show.value = false;
    await settle();
    assert(!document.querySelector(".hys-ui-is-dragging"));
    show.value = true;
    await settle();
    assert(!host.querySelector(".hys-ui-is-dragging"));
    assert.deepEqual([...api.value.checkedKeys], ["a"]);
    const promise = api.value.move("right", ["a"]);
    show.value = false;
    await settle();
    assert.equal(await promise, false);
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Cached virtual panels restore their scroll window after native scroll position is reset during detachment", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const show = ref(true),
    api = ref(),
    options = Array.from({ length: 200 }, (_, i) => ({
      value: i,
      label: "Item " + i,
    }));
  const app = createApp({
    render: () =>
      h(KeepAlive, null, {
        default: () =>
          show.value
            ? h(ui.HysTransfer, {
                ref: api,
                options,
                virtual: true,
                listHeight: 160,
                itemHeight: 32,
              })
            : h("div", "Other"),
      }),
  });
  app.mount(host);
  try {
    await settle();
    await api.value.scrollTo("left", { key: 180 });
    await settle();
    const port = host.querySelector(
      "[data-side=left] .hys-ui-pf-transfer-list",
    );
    assert.equal(port.scrollTop, 5760);
    show.value = false;
    await settle();
    port.scrollTop = 0;
    show.value = true;
    await settle();
    assert.equal(port.scrollTop, 5760);
    assert(host.querySelector('[data-transfer-key="number:180"]'));
  } finally {
    app.unmount();
    host.remove();
  }
});
