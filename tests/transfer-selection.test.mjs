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

HTMLElement.prototype.scrollTo = function (options) {
  this.scrollTop = options.top ?? 0;
};
const { createApp, h, reactive, ref, nextTick } = await import("vue"),
  ui = await import("../packages/ui/dist/index.js"),
  apps = [];
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};
afterEach(() => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount();
    host.remove();
  }
  document.body.replaceChildren();
});
async function mount(values = {}, slots = {}) {
  const state = reactive({
      modelValue: [],
      checkedKeys: [],
      filterable: false,
      options: Array.from({ length: 20 }, (_, i) => ({
        value: i,
        label: "Item " + i,
        disabled: i === 3,
      })),
      ...values,
    }),
    vm = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const events = [];
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(
          ui.HysTransfer,
          {
            ...state,
            ref: vm,
            "onUpdate:modelValue": (v) => (state.modelValue = v),
            "onUpdate:checkedKeys": (v) => (state.checkedKeys = v),
            onCheckChange: (...args) => events.push(args),
          },
          slots,
        );
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  return {
    state,
    host,
    events,
    get vm() {
      return vm.value;
    },
    row: (side, key) =>
      host.querySelector(
        "[data-side=" + side + '] [data-transfer-key="number:' + key + '"]',
      ),
  };
}
async function click(el, flags = {}, type = "click") {
  el.dispatchEvent(
    new MouseEvent(type, { bubbles: true, cancelable: true, ...flags }),
  );
  await settle();
}
test("Ctrl and Cmd row clicks toggle individual checks without clearing other selections", async () => {
  const a = await mount();
  await click(a.row("left", 0), { ctrlKey: true });
  await click(a.row("left", 2), { metaKey: true });
  assert.deepEqual([...a.state.checkedKeys], [0, 2]);
  await click(a.row("left", 0), { ctrlKey: true });
  assert.deepEqual([...a.state.checkedKeys], [2]);
  assert.equal(a.state.modelValue.length, 0);
});
test("Shift click adds an inclusive range while preserving other-side checks and skipping disabled items", async () => {
  const a = await mount({ modelValue: [19], checkedKeys: [19] });
  await click(a.row("left", 0), { ctrlKey: true });
  await click(a.row("left", 5), { shiftKey: true });
  assert.deepEqual([...a.state.checkedKeys], [19, 0, 1, 2, 4, 5]);
  assert(!a.state.checkedKeys.includes(3));
  assert.equal(a.events.length, 2);
});
test("Normal checkbox changes establish the same range anchor", async () => {
  const a = await mount();
  a.row("left", 1).querySelector("input").click();
  await settle();
  await click(a.row("left", 5), { shiftKey: true });
  assert.deepEqual([...a.state.checkedKeys], [1, 2, 4, 5]);
});
test("Ctrl click on the native checkbox stays synchronized with the controlled check state", async () => {
  const a = await mount(),
    input = a.row("left", 2).querySelector("input");
  await click(input, { ctrlKey: true });
  assert.deepEqual([...a.state.checkedKeys], [2]);
  assert(input.checked);
  await click(input, { ctrlKey: true });
  assert.deepEqual([...a.state.checkedKeys], []);
  assert(!input.checked);
});
test("Shift direction keys extend selection and focus while skipping disabled items", async () => {
  const a = await mount();
  const input = a.row("left", 1).querySelector("input");
  input.focus();
  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "ArrowDown",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  await settle();
  assert.deepEqual([...a.state.checkedKeys], [1, 2]);
  assert.equal(
    document.activeElement.closest("[data-transfer-key]").dataset.transferKey,
    "number:2",
  );
});
test("Search changes reset the anchor and do not select hidden results", async () => {
  const a = await mount({ filterable: true });
  await click(a.row("left", 0), { ctrlKey: true });
  a.vm.setSearch("left", "Item 1");
  await settle();
  await click(a.row("left", 15), { shiftKey: true });
  assert.deepEqual([...a.state.checkedKeys], [0, 15]);
});
test("A virtual range includes offscreen rows without rendering the full dataset", async () => {
  const a = await mount({
    virtual: true,
    options: Array.from({ length: 1000 }, (_, i) => ({
      value: i,
      label: "Item " + i,
    })),
  });
  await click(a.row("left", 0), { ctrlKey: true });
  await a.vm.scrollTo("left", { key: 999 });
  await settle();
  await click(a.row("left", 999), { shiftKey: true });
  assert.equal(a.state.checkedKeys.length, 1000);
  assert(a.host.querySelectorAll(".hys-ui-transfer-row").length < 40);
});
test("Double-click movement is opt-in and moves only the clicked project", async () => {
  const a = await mount({ checkedKeys: [1, 2] });
  await click(
    a.row("left", 0).querySelector(".hys-ui-transfer-label"),
    {},
    "dblclick",
  );
  assert.deepEqual([...a.state.modelValue], []);
  a.state.moveOnDoubleClick = true;
  await settle();
  await click(
    a.row("left", 0).querySelector(".hys-ui-transfer-label"),
    {},
    "dblclick",
  );
  assert.deepEqual([...a.state.modelValue], [0]);
  assert.deepEqual([...a.state.checkedKeys], [1, 2]);
  await click(
    a.row("right", 0).querySelector(".hys-ui-transfer-label"),
    {},
    "dblclick",
  );
  assert.deepEqual([...a.state.modelValue], []);
});
test("One-way target double-click is an individual remove and does not enable target selection", async () => {
  const a = await mount({
    oneWay: true,
    modelValue: [0],
    moveOnDoubleClick: true,
  });
  await click(a.row("right", 0), { ctrlKey: true });
  assert.deepEqual([...a.state.checkedKeys], []);
  await click(
    a.row("right", 0).querySelector(".hys-ui-transfer-label"),
    {},
    "dblclick",
  );
  assert.deepEqual([...a.state.modelValue], []);
});
for (const flag of ["disabled", "loading"])
  test(flag + " blocks modifier selection and double-click moves", async () => {
    const a = await mount({ [flag]: true, moveOnDoubleClick: true });
    await click(a.row("left", 0), { ctrlKey: true });
    await click(a.row("left", 5), { shiftKey: true });
    await click(
      a.row("left", 0).querySelector(".hys-ui-transfer-label"),
      {},
      "dblclick",
    );
    assert.deepEqual([...a.state.checkedKeys], []);
    assert.deepEqual([...a.state.modelValue], []);
  });
test("Disabled rows and interactive slot buttons never trigger double-click movement", async () => {
  const a = await mount(
    { moveOnDoubleClick: true },
    { option: ({ label }) => h("button", label) },
  );
  await click(a.row("left", 3), { shiftKey: true });
  await click(a.row("left", 3), {}, "dblclick");
  await click(a.row("left", 1).querySelector("button"), {}, "dblclick");
  assert.deepEqual([...a.state.checkedKeys], []);
  assert.deepEqual([...a.state.modelValue], []);
});

for (const area of ["label", "row"]) {
  test(`Shortcut-mode ${area} blocks text selection on the second press without delaying focus`, async () => {
    const a = await mount({ moveOnDoubleClick: true, checkedKeys: [1, 2] });
    const row = a.row("left", 0),
      target =
        area === "label" ? row.querySelector(".hys-ui-transfer-label") : row;
    for (const detail of [1, 2]) {
      const press = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0,
        detail,
      });
      target.dispatchEvent(press);
      assert.equal(press.defaultPrevented, detail === 2);
      await click(target, { detail });
      assert.equal(document.activeElement, row.querySelector("input"));
      assert.deepEqual([...a.state.checkedKeys], [1, 2]);
    }
  });
  test(`Shortcut-mode ${area} double clicks never check the project during either click or the move`, async () => {
    const a = await mount({ moveOnDoubleClick: true, checkedKeys: [1, 2] });
    for (const side of ["left", "right"]) {
      const row = a.row(side, 0),
        target =
          area === "label" ? row.querySelector(".hys-ui-transfer-label") : row;
      // A real double click sends two click events before dblclick.
      for (const detail of [1, 2]) {
        await click(target, { detail });
        assert.deepEqual([...a.state.checkedKeys], [1, 2]);
        assert.equal(row.querySelector("input").checked, false);
        assert.equal(row.classList.contains("hys-ui-is-checked"), false);
        assert.equal(a.events.length, 0);
      }
      await click(target, { detail: 2 }, "dblclick");
      assert.deepEqual([...a.state.modelValue], side === "left" ? [0] : []);
      assert.deepEqual([...a.state.checkedKeys], [1, 2]);
      const destination = a.row(side === "left" ? "right" : "left", 0);
      assert.equal(destination.querySelector("input").checked, false);
      assert.equal(destination.classList.contains("hys-ui-is-checked"), false);
      assert.equal(a.events.length, 0);
    }
  });
}

test("Double-click text-selection protection preserves interactive slot controls", async () => {
  const a = await mount(
    { moveOnDoubleClick: true },
    {
      option: () =>
        h("span", [
          h("button", "Action"),
          h("input"),
          h("textarea"),
          h("a", { href: "#" }, "Link"),
          h("span", { contenteditable: "true" }, "Editable"),
        ]),
    },
  );
  const row = a.row("left", 0);
  for (const target of row.querySelectorAll(
    "input,button,textarea,a,[contenteditable]",
  )) {
    const press = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      detail: 2,
    });
    target.dispatchEvent(press);
    assert.equal(press.defaultPrevented, false);
  }
  a.state.moveOnDoubleClick = false;
  await settle();
  const press = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    detail: 2,
  });
  row.dispatchEvent(press);
  assert.equal(press.defaultPrevented, false);
  assert.deepEqual([...a.state.checkedKeys], []);
});
