import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const name of [
  "window", "document", "navigator", "Node", "Element", "HTMLElement",
  "HTMLInputElement", "HTMLFormElement", "SVGElement", "Event",
  "MouseEvent", "KeyboardEvent", "FocusEvent", "MutationObserver", "DOMRect",
]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: name === "window" ? dom.window : dom.window[name],
  });
}
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});

const { createApp, h, nextTick, reactive } = await import("vue");
const ui = await import("../packages/ui/dist/index.js");

async function settle() {
  for (let index = 0; index < 4; index++) {
    await Promise.resolve();
    await nextTick();
  }
}
async function mount(t, component, input, listeners = {}, slots) {
  const host = document.createElement("div");
  document.body.append(host);
  const props = reactive(input);
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () => h(component, { ...props, ...listeners }, slots);
    },
  });
  app.mount(host);
  t.after(() => {
    app.unmount();
    host.remove();
  });
  await settle();
  return { host, props };
}

test("FilterBar keeps hidden conditions and resumes automatic queries after a busy request", async t => {
  const searches = [];
  const { host, props } = await mount(t, ui.HysFilterBar, {
    fields: [{ key: "term", type: "text", label: "Term" }],
    values: { term: "first" },
    hiddenKeys: [],
    showSummary: true,
    searchMode: "auto",
    searchDelay: 0,
    loading: true,
  }, { onSearch: values => searches.push(values) });

  props.hiddenKeys = ["term"];
  props.values = { term: "second" };
  await settle();
  assert.equal(host.querySelector(".hys-filter-bar-field").style.display, "none");
  assert.match(host.querySelector(".hys-filter-summary").textContent, /second/);
  await setTimeout(15);
  assert.deepEqual(searches, []);
  props.loading = false;
  await settle();
  await setTimeout(15);
  assert.deepEqual(searches, [{ term: "second" }]);
});

test("DataView observes a still-visible load button again after a batch is appended", async t => {
  const observers = [];
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: class {
      constructor(callback) {
        this.intersect = () => callback([{ isIntersecting: true }]);
        observers.push(this);
      }
      observe() {}
      disconnect() {}
    },
  });
  t.after(() => Reflect.deleteProperty(globalThis, "IntersectionObserver"));

  let loads = 0;
  const { props } = await mount(t, ui.HysDataView, {
    items: [1],
    hasMore: true,
  }, { onLoadMore: () => { loads++; } });
  const first = observers.at(-1);
  assert.ok(first);
  first.intersect();
  first.intersect();
  assert.equal(loads, 1);
  props.items = [1, 2];
  await settle();
  const second = observers.at(-1);
  assert.notEqual(second, first);
  first.intersect();
  assert.equal(loads, 1);
  second.intersect();
  assert.equal(loads, 2);
});

test("VirtualList requests another batch when the visible rows cannot fill the viewport", async t => {
  const bounds = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() { return this.classList.contains("hys-ui-scrollbar-viewport") ? 180 : 0; },
  });
  t.after(() => {
    if (bounds) Object.defineProperty(HTMLElement.prototype, "clientHeight", bounds);
    else Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
  });
  let loads = 0;
  const { props } = await mount(t, ui.HysVirtualList, {
    items: [1],
    rowHeight: 40,
    height: 180,
    hasMore: true,
    loading: true,
  }, { onLoadMore: () => { loads++; } }, { item: ({ item }) => String(item) });
  assert.equal(loads, 0);
  props.loading = false;
  await settle();
  assert.equal(loads, 1);
  props.items = [1, 2];
  await settle();
  assert.equal(loads, 2);
  props.items = Array.from({ length: 10 }, (_, index) => index + 1);
  await settle();
  assert.equal(loads, 2);
});
