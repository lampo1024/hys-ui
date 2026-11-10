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

const { createApp, h, reactive, ref, nextTick, KeepAlive, defineComponent } =
    await import("vue"),
  ui = await import("../packages/ui/dist/index.js"),
  apps = [],
  animations = [];
let reads = 0;
const box = (x, y, w, h) => ({
  x,
  y,
  left: x,
  top: y,
  right: x + w,
  bottom: y + h,
  width: w,
  height: h,
  toJSON() {
    return {};
  },
});
HTMLElement.prototype.getBoundingClientRect = function () {
  const side = this.closest(".hys-ui-transfer-pane")?.dataset.side,
    x = side === "right" ? 620 : 20;
  if (this.matches(".hys-ui-transfer-row")) {
    reads++;
    const rows = [...this.parentElement.children];
    return box(x, 60 + rows.indexOf(this) * 36, 300, 36);
  }
  return box(x, 60, 300, 240);
};
document.elementFromPoint = (x, y) => {
  const side = x > 500 ? "right" : "left";
  return (
    document.querySelectorAll(
      ".hys-ui-transfer-pane[data-side=" + side + "] .hys-ui-transfer-row",
    )[Math.max(0, Math.floor((y - 60) / 36))] ?? null
  );
};
HTMLElement.prototype.animate = function (frames, options) {
  let resolve;
  const finished = new Promise((r) => (resolve = r)),
    entry = {
      node: this,
      frames,
      options,
      cancelled: false,
      finish: () => resolve(),
      cancel() {
        entry.cancelled = true;
        resolve();
      },
      finished,
    };
  animations.push(entry);
  return entry;
};
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
  animations.splice(0);
  document.body.replaceChildren();
  reads = 0;
});
async function mount(values = {}, config = {}, accept = true) {
  const state = reactive({
      modelValue: [],
      filterable: false,
      options: Array.from({ length: 20 }, (_, i) => ({
        value: i,
        label: "Item " + i,
      })),
      ...values,
    }),
    vm = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup() {
      ui.provideHysConfig(config);
      return () =>
        h(ui.HysTransfer, {
          ...state,
          ref: vm,
          "onUpdate:modelValue": (value) => {
            if (accept) state.modelValue = value;
          },
        });
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await settle();
  return {
    state,
    host,
    get vm() {
      return vm.value;
    },
  };
}

test("Accepted moves fly from the source to the target and highlight after landing", async () => {
  const a = await mount();
  assert(await a.vm.move("right", [0, 1]));
  assert.equal(document.querySelectorAll(".hys-ui-transfer-flight").length, 2);
  assert(animations[0].frames[1].transform.includes("600px"));
  assert.equal(
    a.host.querySelector('[data-side=right] [data-transfer-key="number:0"]')
      .style.opacity,
    "0",
  );
  animations.forEach((x) => x.finish());
  await settle();
  assert.equal(document.querySelectorAll(".hys-ui-transfer-flight").length, 0);
  assert.equal(a.host.querySelectorAll(".hys-ui-transfer-landed").length, 2);
  assert.equal(
    a.host.querySelector('[data-side=right] [data-transfer-key="number:0"]')
      .style.opacity,
    "",
  );
});
test("Reverse moves fly toward the left and successive moves cancel old previews", async () => {
  const a = await mount({ modelValue: [0, 1] });
  assert(await a.vm.move("left", [0]));
  assert(animations[0].frames[1].transform.includes("-600px"));
  const first = animations[0];
  assert(await a.vm.move("right", [2]));
  assert(first.cancelled);
  assert.equal(document.querySelectorAll(".hys-ui-transfer-flight").length, 1);
});
test("Large virtual moves create a bounded number of ghosts and measure only sampled rows", async () => {
  const options = Array.from({ length: 10000 }, (_, i) => ({
      value: i,
      label: "Resource " + i,
    })),
    a = await mount({ options, virtual: true, maxAnimatedItems: 4 });
  reads = 0;
  assert(
    await a.vm.move(
      "right",
      options.map((x) => x.value),
    ),
  );
  assert.equal(a.state.modelValue.length, 10000);
  assert(document.querySelectorAll(".hys-ui-transfer-flight").length <= 4);
  assert.equal(document.querySelectorAll(".hys-ui-transfer-flight").length, 4);
  assert(reads <= 8, "row reads: " + reads);
  assert(a.host.querySelectorAll(".hys-ui-transfer-row").length < 40);
  assert(
    [...document.querySelectorAll(".hys-ui-transfer-flight")].some((el) =>
      el.textContent.includes("+9996"),
    ),
  );
});
for (const options of [
  { animated: false },
  { moveAnimation: "none" },
  { moveDuration: 0 },
])
  test("Disabling movement motion performs the move without previews", async () => {
    const a = await mount(options);
    assert(await a.vm.move("right", [0]));
    assert.equal(animations.length, 0);
    assert.equal(
      document.querySelectorAll(".hys-ui-transfer-flight").length,
      0,
    );
  });
test("Global off skips movement measurements and reduced motion skips the first move", async () => {
  const a = await mount({}, { motion: "off" });
  reads = 0;
  assert(await a.vm.move("right", [0]));
  assert.equal(reads, 0);
  assert.equal(animations.length, 0);
  const original = window.matchMedia;
  window.matchMedia = () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  });
  try {
    const b = await mount();
    assert(await b.vm.move("right", [0]));
    assert.equal(animations.length, 0);
  } finally {
    window.matchMedia = original;
  }
});
test("Controlled host rejection never plays a successful-move preview", async () => {
  const a = await mount({}, {}, false);
  assert.equal(await a.vm.move("right", [0]), false);
  assert.equal(document.querySelectorAll(".hys-ui-transfer-flight").length, 0);
  assert.equal(a.host.querySelectorAll(".hys-ui-transfer-received").length, 0);
});
test("Scrolling cancels flights and restores the opacity of actual rows", async () => {
  const a = await mount();
  await a.vm.move("right", [0, 1]);
  await new Promise(requestAnimationFrame);
  window.dispatchEvent(new Event("scroll"));
  await settle();
  assert(animations.every((x) => x.cancelled));
  assert.equal(
    document.querySelectorAll(".hys-ui-transfer-flight,.hys-ui-transfer-landed")
      .length,
    0,
  );
  assert.equal(
    a.host.querySelector('[data-side=right] [data-transfer-key="number:0"]')
      .style.opacity,
    "",
  );
});
test("Arrival highlight can be disabled without losing the flight", async () => {
  const a = await mount({ highlightOnArrival: false });
  await a.vm.move("right", [0]);
  assert.equal(animations.length, 1);
  animations[0].finish();
  await settle();
  assert.equal(a.host.querySelectorAll(".hys-ui-transfer-landed").length, 0);
});
test("Unmount cleans previews, highlights, animations and inline row styles", async () => {
  const a = await mount();
  await a.vm.move("right", [0]);
  a.host.remove();
  apps.shift().app.unmount();
  await settle();
  assert.equal(document.querySelectorAll(".hys-ui-transfer-flight").length, 0);
  assert(animations[0].cancelled);
});
