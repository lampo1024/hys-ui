import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const key of [
  "window",
  "document",
  "Document",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "HTMLFormElement",
  "HTMLTextAreaElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "FocusEvent",
  "MutationObserver",
])
  globalThis[key] = dom.window[key];
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
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 1000,
    bottom: 420,
    width: 1000,
    height: 420,
  };
};
HTMLElement.prototype.getClientRects = function () {
  return [this.getBoundingClientRect()];
};
HTMLElement.prototype.scrollIntoView = function () {};
const observers = new Set(),
  blurListeners = new Set(),
  nativeAdd = window.addEventListener.bind(window),
  nativeRemove = window.removeEventListener.bind(window);
window.addEventListener = (name, fn, ...args) => {
  if (name === "blur") blurListeners.add(fn);
  nativeAdd(name, fn, ...args);
};
window.removeEventListener = (name, fn, ...args) => {
  if (name === "blur") blurListeners.delete(fn);
  nativeRemove(name, fn, ...args);
};
globalThis.ResizeObserver = class {
  observe() {
    observers.add(this);
  }
  disconnect() {
    observers.delete(this);
  }
};
const { createApp, h, ref, shallowReactive, nextTick, KeepAlive } =
    await import("vue"),
  ui = await import("../packages/ui/dist/index.js"),
  mounts = new Set();
const settle = async () => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
  },
  task = (id, extra = {}) => ({
    id,
    title: "Task " + id,
    start: "2026-11-01",
    end: "2026-11-03",
    ...extra,
  });
async function mount(Component, values = {}, accept = true) {
  const props = shallowReactive(values),
    events = {},
    instance = ref(),
    host = document.createElement("div");
  document.body.append(host);
  const listeners = Object.fromEntries(
    (Array.isArray(Component.emits)
      ? Component.emits
      : Object.keys(Component.emits ?? {})
    ).map((name) => [
      "on" + name[0].toUpperCase() + name.slice(1),
      (...args) => {
        (events[name] ??= []).push(args);
        if (accept && name.startsWith("update:"))
          props[name.slice(7)] = args[0];
      },
    ]),
  );
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () => h(Component, { ...props, ...listeners, ref: instance });
    },
  });
  app.mount(host);
  const result = {
    props,
    events,
    host,
    get vm() {
      return instance.value;
    },
    find: (s) => host.querySelector(s),
    all: (s) => [...host.querySelectorAll(s)],
    unmount() {
      app.unmount();
      host.remove();
      mounts.delete(result);
    },
  };
  mounts.add(result);
  await settle();
  return result;
}
const key = async (el, key, extra = {}) => {
  el.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...extra,
    }),
  );
  await settle();
};
afterEach(async () => {
  for (const item of [...mounts]) item.unmount();
  await settle();
  document.body.innerHTML = "";
  assert.equal(observers.size, 0, "Gantt geometry observers leaked");
  assert.equal(blurListeners.size, 0, "Gantt blur listeners leaked");
});
test("Gantt height modes distinguish the default limit, explicit height and unlimited content", async () => {
  const a = await mount(ui.HysGantt, { items: [task(1)] });
  assert.equal(a.vm.viewport.style.maxHeight, "620px");
  a.props.height = 720;
  await settle();
  assert.equal(a.vm.viewport.style.height, "720px");
  assert.equal(a.vm.viewport.style.maxHeight, "none");
  a.props.maxHeight = 300;
  await settle();
  assert.equal(a.vm.viewport.style.maxHeight, "300px");
  a.props.height = undefined;
  a.props.maxHeight = false;
  await settle();
  assert.equal(a.vm.viewport.style.maxHeight, "none");
});
test("Gantt virtual rows stay bounded and locate tasks beyond the initial window", async () => {
  const a = await mount(ui.HysGantt, {
    items: Array.from({ length: 10000 }, (_, index) => task(index)),
    virtual: true,
    height: 420,
  });
  assert(a.all(".hys-ui-pg-row").length < 50);
  assert.equal(await a.vm.scrollToTask(9999), true);
  assert(a.find('.hys-ui-pg-row[data-row-index="9999"]'));
  assert.equal(
    a.all(".hys-ui-pg-row").length,
    a.all(".hys-ui-pg-task-label").length,
  );
  assert(a.all(".hys-ui-pg-row").length < 50);
  assert(!a.events.open);
  const before = a.vm.viewport.scrollTop;
  assert.equal(await a.vm.scrollToTask("missing"), false);
  assert.equal(a.vm.viewport.scrollTop, before);
  a.vm.scrollToTop();
  await settle();
  assert(a.find('.hys-ui-pg-row[data-row-index="0"]'));
});
test("Gantt virtual windows tolerate invalid dates and nonpositive row heights", async () => {
  const a = await mount(ui.HysGantt, {
    items: [
      task("bad", { start: "2026-02-30" }),
      ...Array.from({ length: 100 }, (_, index) => task(index)),
    ],
    virtual: true,
    rowHeight: 0,
  });
  assert.equal(await a.vm.scrollToTask("bad"), false);
  assert.equal(await a.vm.scrollToTask(99), true);
  assert(a.find('.hys-ui-pg-row[data-row-index="99"]'));
  assert.equal(a.find(".hys-ui-pg-row").style.height, "46px");
});
test("Adding a dependency updates only its target and reports accepted metadata", async () => {
  const items = [task("a"), task("b")],
    a = await mount(ui.HysGantt, { items, editable: true });
  assert.equal(await a.vm.addDependency("a", "b"), true);
  assert.equal(a.props.items[0], items[0]);
  assert.notEqual(a.props.items, items);
  assert.equal(items[1].dependencies, undefined);
  assert.deepEqual(a.props.items[1].dependencies, ["a"]);
  assert.deepEqual(a.events.dependencyAdd[0][0], {
    sourceId: "a",
    targetId: "b",
    type: "add",
  });
  assert.equal(a.events.dependencyAdd[0][1].id, "b");
  assert.equal(a.all(".hys-ui-pg-edge-hit").length, 1);
});
test("Dependency validation blocks self, duplicate, cycle, missing and locked endpoints", async () => {
  const items = [
      task("a"),
      task("b", { dependencies: ["a"] }),
      task("c", { dependencies: ["b"] }),
      task("locked", { disabled: true }),
    ],
    a = await mount(ui.HysGantt, { items, editable: true });
  for (const [source, target, reason] of [
    ["a", "a", "self"],
    ["a", "b", "duplicate"],
    ["c", "a", "cycle"],
    ["missing", "a", "missing"],
    ["a", "locked", "disabled"],
    ["locked", "a", "disabled"],
  ]) {
    assert.equal(await a.vm.addDependency(source, target), false);
    assert.equal(a.events.dependencyInvalid.at(-1)[0].reason, reason);
  }
  assert.equal(a.events["update:items"], undefined);
  assert.equal(a.props.items, items);
});
test("Cycle checks traverse deep dependency chains without recursive stack overflow", async () => {
  const count = 5000,
    items = Array.from({ length: count }, (_, index) =>
      task(index, { dependencies: index ? [index - 1] : [] }),
    ),
    a = await mount(ui.HysGantt, { items, virtual: true, editable: true });
  assert.equal(await a.vm.addDependency(count - 1, 0), false);
  assert.equal(a.events.dependencyInvalid.at(-1)[0].reason, "cycle");
  assert(a.all(".hys-ui-pg-row").length < 50);
});
test("Dependency removal can repair dangling references while preserving unrelated entries", async () => {
  const a = await mount(ui.HysGantt, {
    items: [
      task("a", { disabled: true }),
      task("b", { dependencies: ["a", "unknown"] }),
    ],
    editable: true,
  });
  assert.equal(await a.vm.removeDependency("a", "b"), true);
  assert.deepEqual(a.props.items[1].dependencies, ["unknown"]);
  assert.equal(await a.vm.removeDependency("unknown", "b"), true);
  assert.deepEqual(a.props.items[1].dependencies, []);
  assert.equal(a.events.dependencyRemove.length, 2);
  assert.equal(await a.vm.removeDependency("unknown", "b"), false);
  assert.equal(a.events.dependencyInvalid.at(-1)[0].reason, "missing");
});
test("Hosts may reject dependency updates without false acceptance notifications", async () => {
  const a = await mount(
    ui.HysGantt,
    { items: [task("a"), task("b")], editable: true },
    false,
  );
  assert.equal(await a.vm.addDependency("a", "b"), false);
  assert.equal(a.events.change.length, 1);
  assert.equal(a.events.dependencyAdd, undefined);
  assert.equal(a.events.dependencyInvalid.at(-1)[0].reason, "rejected");
  assert.equal(a.props.items[1].dependencies, undefined);
});
test("Dependency permissions can be controlled separately from date editing", async () => {
  const a = await mount(ui.HysGantt, {
    items: [task("a"), task("b")],
    editable: false,
  });
  assert.equal(await a.vm.addDependency("a", "b"), false);
  a.props.dependencyEditable = true;
  await settle();
  assert.equal(await a.vm.addDependency("a", "b"), true);
  a.props.dependencyEditable = false;
  a.props.editable = true;
  await settle();
  assert.equal(await a.vm.removeDependency("a", "b"), false);
  const before = a.props.items[0].start;
  await key(a.find(".hys-ui-pg-bar"), "ArrowRight", { altKey: true });
  assert.notEqual(a.props.items[0].start, before);
});
test("Existing duplicate dependencies render once and identifiers retain their types", async () => {
  const a = await mount(ui.HysGantt, {
    items: [task(1), task("1", { dependencies: [1, 1] })],
    editable: true,
  });
  assert.equal(a.all(".hys-ui-pg-edge-hit").length, 1);
  assert.equal(await a.vm.addDependency("1", 1), false);
  assert.equal(a.events.dependencyInvalid.at(-1)[0].reason, "cycle");
  assert.equal(await a.vm.removeDependency(1, "1"), true);
  assert.deepEqual(a.props.items[1].dependencies, []);
});
test("Keyboard connections choose rows, confirm dependencies and cancel with Escape", async () => {
  const a = await mount(ui.HysGantt, {
    items: [task("a"), task("b"), task("c")],
    editable: true,
  });
  await key(a.find(".hys-ui-pg-link-port"), "Enter");
  assert(a.find(".hys-ui-pg-link-preview"));
  await key(a.vm.viewport, "ArrowDown");
  await key(a.vm.viewport, "Enter");
  assert.deepEqual(a.props.items[1].dependencies, ["a"]);
  assert.equal(a.find(".hys-ui-pg-link-preview"), null);
  await key(a.find(".hys-ui-pg-link-port"), "Enter");
  await key(a.vm.viewport, "Escape");
  assert.equal(a.find(".hys-ui-pg-link-preview"), null);
  assert.equal(a.events.dependencyAdd.length, 1);
});
test("Hiding dependency lines preserves data and cancels active connections", async () => {
  const a = await mount(ui.HysGantt, {
    items: [task("a"), task("b", { dependencies: ["a"] })],
    editable: true,
  });
  await key(a.find(".hys-ui-pg-link-port"), "Enter");
  a.props.showDependencies = false;
  await settle();
  assert.equal(a.find(".hys-ui-pg-link-preview"), null);
  assert.equal(a.find(".hys-ui-pg-dependencies"), null);
  assert.deepEqual(a.props.items[1].dependencies, ["a"]);
  assert.equal(await a.vm.removeDependency("a", "b"), true);
});
test("Cached Gantt pages release listeners and reject inactive instance commands", async () => {
  const visible = ref(true),
    api = ref(),
    Page = {
      setup: () => () =>
        h(ui.HysGantt, {
          ref: api,
          items: [task("a"), task("b")],
          editable: true,
        }),
    };
  const a = await mount({
    setup: () => () =>
      h(KeepAlive, null, () => (visible.value ? h(Page) : null)),
  });
  await key(a.find(".hys-ui-pg-link-port"), "Enter");
  assert(blurListeners.size > 0);
  visible.value = false;
  await settle();
  assert.equal(observers.size, 0);
  assert.equal(blurListeners.size, 0);
  assert.equal(await api.value.addDependency("a", "b"), false);
  assert.equal(await api.value.scrollToTask("a"), false);
  visible.value = true;
  await settle();
  assert.equal(a.find(".hys-ui-pg-link-preview"), null);
  assert(blurListeners.size > 0);
});
test("Unmounting during an update prevents late dependency callbacks", async () => {
  const a = await mount(ui.HysGantt, {
    items: [task("a"), task("b")],
    editable: true,
  });
  const request = a.vm.addDependency("a", "b");
  a.unmount();
  assert.equal(await request, false);
  assert.equal(a.events.dependencyAdd, undefined);
});

test("Task-column resizing supports controlled widths, bounds, keyboard steps and reset", async () => {
  const a = await mount(ui.HysGantt, {
    items: [task("a")],
    labelWidth: 220,
    minLabelWidth: 150,
    maxLabelWidth: 420,
  });
  const divider = a.find('[role="separator"]'),
    value = () => Number(divider.getAttribute("aria-valuenow"));
  assert.equal(value(), 220);
  await key(divider, "ArrowRight");
  assert.equal(value(), 230);
  await key(divider, "ArrowLeft", { shiftKey: true });
  assert.equal(value(), 180);
  await key(divider, "Home");
  assert.equal(value(), 150);
  await key(divider, "End");
  assert.equal(value(), 420);
  assert.deepEqual(
    a.events.labelResize.map((args) => args[0]),
    [230, 180, 150, 420],
  );
  divider.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  await settle();
  assert.equal(value(), 220);
  a.props.labelWidth = 310;
  await settle();
  assert.equal(value(), 310);
  a.props.labelResizable = false;
  await settle();
  assert.equal(a.find('[role="separator"]'), null);
});

test("Column resize cancellation restores the initial width and releases pointer capture", async () => {
  const a = await mount(ui.HysGantt, { items: [task("a")], labelWidth: 220 });
  const divider = a.find('[role="separator"]');
  let capture = false;
  divider.setPointerCapture = () => (capture = true);
  divider.hasPointerCapture = () => capture;
  divider.releasePointerCapture = () => (capture = false);
  const pointer = (name, x) => {
    const event = new MouseEvent(name, {
      clientX: x,
      button: 0,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "pointerId", { value: 11 });
    divider.dispatchEvent(event);
  };
  pointer("pointerdown", 220);
  pointer("pointermove", 300);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await settle();
  assert.equal(a.props.labelWidth, 300);
  assert.equal(capture, true);
  await key(divider, "Escape");
  assert.equal(a.props.labelWidth, 220);
  assert.equal(capture, false);
  assert.equal(a.events.labelResize, undefined);
  pointer("pointerdown", 220);
  pointer("pointermove", 320);
  pointer("pointerup", 330);
  await settle();
  assert.equal(a.props.labelWidth, 330);
  assert.deepEqual(a.events.labelResize, [[330]]);
  assert.equal(capture, false);
  pointer("pointerdown", 330);
  pointer("pointermove", 370);
  window.dispatchEvent(new Event("blur"));
  await settle();
  assert.equal(a.props.labelWidth, 330);
  assert.equal(capture, false);
});

test("Invalid column bounds fall back to usable widths and finite separator values", async () => {
  const a = await mount(ui.HysGantt, {
    items: [task("a")],
    labelWidth: NaN,
    minLabelWidth: -1,
    maxLabelWidth: Infinity,
  });
  const divider = a.find('[role="separator"]');
  assert.equal(divider.getAttribute("aria-valuenow"), "270");
  assert.equal(divider.getAttribute("aria-valuemin"), "120");
  await key(divider, "End");
  assert.equal(divider.getAttribute("aria-valuenow"), "600");
});

test("Date edits preserve distinct string and number task identifiers", async () => {
  const a = await mount(ui.HysGantt, {
    items: [task(1), task("1")],
    editable: true,
  });
  await key(a.all(".hys-ui-pg-bar")[0], "ArrowRight", { altKey: true });
  assert.equal(a.props.items[0].start, "2026-11-02");
  assert.equal(a.props.items[1].start, "2026-11-01");
});
