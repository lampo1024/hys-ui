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
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
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

const { createApp, h, reactive, ref, nextTick } = await import("vue"),
  ui = await import("../packages/ui/dist/index.js"),
  mounts = [];
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};
afterEach(() => {
  for (const { app, host } of mounts.splice(0)) {
    app.unmount();
    host.remove();
  }
  document.body.replaceChildren();
});
async function mount(values = {}, controlled = true) {
  const state = reactive({
      modelValue: [],
      options: [
        { label: "Alpha", value: "a" },
        { label: "Beta", value: "b" },
        { label: "Disabled", value: "d", disabled: true },
        { label: "Gamma", value: "c" },
      ],
      ...values,
    }),
    events = {},
    vm = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h("div", [
          h(ui.HysSelect, {
            ...state,
            ref: vm,
            "onUpdate:modelValue": (value) => {
              (events.update ??= []).push(value);
              if (controlled) state.modelValue = value;
            },
            onChange: (...args) => (events.change ??= []).push(args),
            onSelectAll: (...args) => (events.selectAll ??= []).push(args),
            onDeselectAll: (...args) => (events.deselectAll ??= []).push(args),
            onSelect: () => (events.select ??= []).push(1),
            onDeselect: () => (events.deselect ??= []).push(1),
            onCreate: () => (events.create ??= []).push(1),
          }),
          h("button", { id: "next-control" }, "Next"),
        ]);
    },
  });
  app.mount(host);
  mounts.push({ app, host });
  await settle();
  return {
    state,
    events,
    host,
    get vm() {
      return vm.value;
    },
    panel: () => document.querySelector(".hys-ui-select-options"),
  };
}
async function open(a) {
  await a.vm.open();
  await settle();
  return a.panel();
}
async function key(el, key, extra = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...extra,
  });
  el.dispatchEvent(event);
  await settle();
  return event;
}

test("Bulk toolbar is multi-select only and can be hidden without changing the trigger", async () => {
  const single = await mount({ modelValue: "a" });
  await open(single);
  assert(!single.panel().querySelector(".hys-ui-select-bulk"));
  single.vm.close();
  const multi = await mount({ modelValue: [], showSelectAll: false });
  await open(multi);
  assert(!multi.panel().querySelector(".hys-ui-select-bulk"));
  multi.state.showSelectAll = true;
  await settle();
  assert(multi.panel().querySelector('[aria-label="批量选择"]'));
  assert(!multi.host.querySelector(".hys-ui-select-bulk"));
});
test("Select-all skips disabled options, preserves order, and emits one model/change and bulk event", async () => {
  const a = await mount({ modelValue: ["c", "d"] });
  assert.equal(a.vm.selectAll(), 2);
  await settle();
  assert.deepEqual([...a.state.modelValue], ["c", "d", "a", "b"]);
  assert.equal(a.events.update.length, 1);
  assert.equal(a.events.change.length, 1);
  assert.equal(a.events.selectAll.length, 1);
  assert.deepEqual(
    a.events.selectAll[0][1].map((x) => x.value),
    ["a", "b"],
  );
  assert(!a.events.select);
  assert.equal(a.vm.selectAll(), 0);
  assert.equal(a.events.update.length, 1);
  assert.equal(a.vm.deselectAll(), 3);
  await settle();
  assert.deepEqual([...a.state.modelValue], ["d"]);
  assert.equal(a.events.deselectAll.length, 1);
  assert(!a.events.deselect);
});
test("Filtered batch operations preserve selections outside the search and keep the query", async () => {
  const a = await mount({
    modelValue: ["c"],
    filterable: true,
    searchValue: "a",
  });
  await open(a);
  a.state.searchValue = "Alpha";
  await settle();
  assert.equal(a.vm.selectAll(), 1);
  await settle();
  assert.deepEqual([...a.state.modelValue], ["c", "a"]);
  assert.equal(a.vm.query, "Alpha");
  assert.equal(a.vm.deselectAll(), 1);
  await settle();
  assert.deepEqual([...a.state.modelValue], ["c"]);
  assert.equal(a.vm.query, "Alpha");
});
test("All scope includes hidden loaded options and clears unknown values while preserving disabled ones", async () => {
  const a = await mount({
    modelValue: ["remote-old", "d"],
    filterable: true,
    searchValue: "Alpha",
    selectAllScope: "all",
  });
  assert.equal(a.vm.selectAll(), 3);
  await settle();
  assert.equal(a.state.modelValue.length, 5);
  assert.equal(a.vm.deselectAll(), 4);
  await settle();
  assert.deepEqual([...a.state.modelValue], ["d"]);
});
test("Selection limits apply to the batch as a whole, with one update and stable existing values", async () => {
  const a = await mount({ modelValue: ["c"], multipleLimit: 2 });
  await open(a);
  assert.equal(a.vm.selectAll(), 1);
  await settle();
  assert.deepEqual([...a.state.modelValue], ["c", "a"]);
  assert(a.panel().querySelector(".hys-ui-select-bulk-action").disabled);
  assert.equal(a.events.update.length, 1);
  assert.equal(a.vm.selectAll(), 0);
  a.vm.deselectAll();
  await settle();
  assert(!a.panel().querySelector(".hys-ui-select-bulk-action").disabled);
});
test("Grouped disabled options and duplicate object keys stay protected during batch operations", async () => {
  const a = await mount({
    modelValue: [{ id: 9 }],
    valueKey: "id",
    options: [
      {
        label: "Locked",
        disabled: true,
        options: [{ label: "Nine", value: { id: 9 } }],
      },
      { label: "One", value: { id: 1 } },
      { label: "Duplicate", value: { id: 1 } },
      { label: "Two", value: { id: 2 } },
    ],
  });
  assert.equal(a.vm.selectAll(), 2);
  await settle();
  assert.deepEqual(
    a.state.modelValue.map((x) => x.id),
    [9, 1, 2],
  );
  assert.equal(a.vm.deselectAll(), 2);
  await settle();
  assert.deepEqual(
    a.state.modelValue.map((x) => x.id),
    [9],
  );
});
for (const flag of ["disabled", "readonly", "loading"])
  test(flag + " blocks both instance batch methods", async () => {
    const a = await mount({ modelValue: ["a"], [flag]: true });
    assert.equal(a.vm.selectAll(), 0);
    assert.equal(a.vm.deselectAll(), 0);
    assert(!a.events.update);
    assert.deepEqual([...a.state.modelValue], ["a"]);
  });
test("Host-controlled rejection does not alter state or silently cache the requested value", async () => {
  const a = await mount({ modelValue: [] }, false);
  assert.equal(a.vm.selectAll(), 3);
  await settle();
  assert.deepEqual([...a.state.modelValue], []);
  assert.deepEqual(a.vm.selected, []);
  assert.equal(a.events.update.length, 1);
});
test("Remote scope only operates on the loaded result and retains other selected values", async () => {
  const a = await mount({
    modelValue: ["old"],
    remote: true,
    searchValue: "server-query",
    options: [{ label: "Current result", value: "current" }],
  });
  assert.equal(a.vm.selectAll(), 1);
  await settle();
  assert.deepEqual([...a.state.modelValue], ["old", "current"]);
  a.vm.deselectAll();
  await settle();
  assert.deepEqual([...a.state.modelValue], ["old"]);
});
test("Virtual all-selection includes offscreen options with one update and bounded rendered rows", async () => {
  const options = Array.from({ length: 10000 }, (_, i) => ({
      label: "Option " + i,
      value: i,
    })),
    a = await mount({ options, virtual: true });
  await open(a);
  assert(a.panel().querySelectorAll("[role=option]").length < 30);
  assert.equal(a.vm.selectAll(), 10000);
  await settle();
  assert.equal(a.state.modelValue.length, 10000);
  assert.equal(
    a.host.querySelectorAll(".hys-ui-select-tag:not(.hys-ui-select-more)")
      .length,
    3,
  );
  assert(
    a.host.querySelector(".hys-ui-select-more").textContent.includes("9997"),
  );
  assert.equal(a.events.update.length, 1);
  assert.equal(a.events.change.length, 1);
  assert(!a.events.select);
  assert(a.panel().querySelectorAll("[role=option]").length < 30);
});
test("Batch selection does not implicitly create a pending custom option", async () => {
  const a = await mount({
    allowCreate: true,
    filterable: true,
    searchValue: "Not created",
    options: [],
  });
  assert.equal(a.vm.selectAll(), 0);
  await settle();
  assert(!a.events.create);
  assert(!a.events.update);
});
test("Toolbar keyboard actions retain native Enter and Space behavior and Tab remains usable", async () => {
  const a = await mount({ filterable: true });
  await open(a);
  const search = a.panel().querySelector("input"),
    all = a.panel().querySelector(".hys-ui-select-bulk-action");
  search.focus();
  await key(search, "Tab");
  assert.equal(document.activeElement, all);
  const event = await key(all, "Enter");
  assert.equal(event.defaultPrevented, false);
  assert(!a.events.select);
  all.click();
  await settle();
  assert.equal(a.state.modelValue.length, 3);
  const clear = a.panel().querySelectorAll(".hys-ui-select-bulk-action")[1];
  assert(!clear.disabled);
  clear.focus();
  await key(clear, "Tab");
  assert.equal(document.activeElement.id, "next-control");
  assert(!a.panel());
});
test("Shift Tab from search returns to the trigger and closes the popup", async () => {
  const a = await mount({ filterable: true });
  await open(a);
  const search = a.panel().querySelector("input");
  search.focus();
  await key(search, "Tab", { shiftKey: true });
  assert(!a.panel());
  assert.equal(document.activeElement.getAttribute("role"), "combobox");
});

test("A native focusout gap before the bulk button receives focus does not dismiss the popup", async () => {
  const a = await mount();
  await open(a);
  const trigger = a.host.querySelector("[role=combobox]"),
    button = a.panel().querySelector(".hys-ui-select-bulk-action");
  trigger.focus();
  trigger.dispatchEvent(
    new FocusEvent("focusout", { bubbles: true, relatedTarget: button }),
  );
  await settle();
  assert(a.panel());
  button.focus();
  button.click();
  await settle();
  assert(a.panel());
  assert.equal(a.state.modelValue.length, 3);
});
