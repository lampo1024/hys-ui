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
