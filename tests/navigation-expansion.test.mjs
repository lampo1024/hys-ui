import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
for (const name of ["window", "document", "Node", "Element", "HTMLElement", "SVGElement", "DOMRect", "MutationObserver"]) {
  globalThis[name] = dom.window[name];
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
HTMLElement.prototype.getBoundingClientRect = () => new DOMRect(20, 30, 150, 40);
HTMLElement.prototype.getClientRects = function () { return [this.getBoundingClientRect()]; };

const { createApp, h, nextTick } = await import("vue");
const { HysDropdown, HysMenu, provideHysConfig } = await import("../packages/ui/dist/index.js");
const { registerFloatButton } = await import("../packages/ui/dist/components/HysFloatButton/floatButtonStack.js");

let app;
afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
});

async function render(component, props) {
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp({
    setup() {
      provideHysConfig({ motion: "off" });
      return () => h(component, props);
    },
  });
  app.mount(host);
  await nextTick();
  return host;
}

test("Dropdown commits selection only after its asynchronous action succeeds", async () => {
  let complete;
  const selected = [];
  const errors = [];
  const item = {
    key: "archive",
    label: "归档",
    action: () => new Promise((resolve, reject) => { complete = { resolve, reject }; }),
  };
  await render(HysDropdown, {
    defaultOpen: true,
    items: [item],
    selectionMode: "multiple",
    "onUpdate:selectedKeys": keys => selected.push(keys),
    onSelectError: (key, error) => errors.push([key, error]),
  });
  await new Promise(resolve => requestAnimationFrame(resolve));
  const option = () => document.querySelector('[role="menuitemcheckbox"]');
  assert(option());
  option().click();
  await nextTick();
  assert.equal(option().getAttribute("aria-busy"), "true");
  assert.equal(option().getAttribute("aria-checked"), "false");
  assert.deepEqual(selected, []);

  const error = new Error("网络失败");
  complete.reject(error);
  await Promise.resolve();
  await nextTick();
  assert.deepEqual(errors, [["archive", error]]);
  assert.deepEqual(selected, []);
  option().click();
  complete.resolve(true);
  await Promise.resolve();
  await nextTick();
  assert.deepEqual(selected, [["archive"]]);
  assert.equal(option().getAttribute("aria-checked"), "true");
});

test("Menu respects accordion when the active route initially opened a branch", async () => {
  const host = await render(HysMenu, {
    accordion: true,
    activePath: "/audit",
    items: [
      { key: "first", label: "归档", children: [{ key: "audit", label: "验收", href: "/audit" }] },
      { key: "second", label: "交付", children: [{ key: "deliver", label: "配送", href: "/deliver" }] },
    ],
  });
  const [first, second] = host.querySelectorAll("button");
  assert.equal(first.getAttribute("aria-expanded"), "true");
  assert.equal(host.querySelector("a[aria-current=page]").textContent.trim(), "验收");
  second.click();
  await nextTick();
  assert.equal(first.getAttribute("aria-expanded"), "false");
  assert.equal(second.getAttribute("aria-expanded"), "true");
  assert(first.classList.contains("is-active-branch"));
});

test("Floating controls honor distinct edge offsets and reserve room for later controls", () => {
  const scope = document.createElement("div");
  let first;
  let second;
  const leave = registerFloatButton(scope, { offsetHeight: 80 }, "bottom-end", 40, () => 44, (...layout) => { first = layout; });
  const leaveSecond = registerFloatButton(scope, { offsetHeight: 44 }, "bottom-end", 14, () => 44, (...layout) => { second = layout; });
  assert.deepEqual(first, [40, 52]);
  assert.deepEqual(second, [128, 0]);
  leave();
  assert.deepEqual(second, [14, 0]);
  leaveSecond();
});


test("Horizontal navigation enables width-based overflow by default", async () => {
  const host = await render(HysMenu, {
    mode: "horizontal",
    items: [{ key: "first", label: "工作台" }, { key: "second", label: "归档" }],
  });
  assert(host.querySelector(".strip.responsive"));
});
