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

test("Badge keeps existing tag and counter behavior while hidden badges retain their host", async () => {
  const a = await mount(
    ui.HysBadge,
    { value: 120, max: 99 },
    { default: () => h("button", "Messages") },
  );
  assert.equal(a.find("sup").textContent, "99+");
  assert.equal(a.find("sup").title, "120");
  a.props.hidden = true;
  await nextTick();
  assert(!a.find("sup"));
  assert(a.find("button"));
  a.props.hidden = false;
  a.props.value = 0;
  await nextTick();
  assert(!a.find("sup"));
  a.props.showZero = true;
  await nextTick();
  assert.equal(a.find("sup").textContent, "0");
  a.props.value = "120";
  await nextTick();
  assert.equal(a.find("sup").textContent, "120");
  a.props.value = NaN;
  await nextTick();
  assert(!a.find("sup"));
  const tag = await mount(ui.HysBadge, { closable: true }, "Review");
  await fire(tag.find("button"), "click");
  assert.equal(tag.events.close.length, 1);
  assert(tag.host.textContent.includes("Review"));
});
test("Badge custom counter and status modes do not create empty labels or redundant counters", async () => {
  const original = window.matchMedia;
  let mediaCalls = 0;
  window.matchMedia = (...args) => {
    mediaCalls++;
    return original(...args);
  };
  try {
    const a = await mount(
      ui.HysBadge,
      {
        value: 120,
        max: 99,
        placement: "bottom-left",
        badgeClass: "custom",
        color: "#7945d5",
      },
      {
        content: ({ value, displayValue }) =>
          h("span", `${value}:${displayValue}`),
      },
    );
    assert.equal(a.find("sup").textContent, "120:99+");
    assert(a.find("sup.custom.hys-ui-badge-bottom-left"));
    assert(!a.find(".hys-ui-badge"));
    a.props.hidden = true;
    await nextTick();
    assert(!a.find("sup"));
    const status = await mount(ui.HysBadge, {
      status: "processing",
      text: "Processing",
    });
    assert.equal(status.host.textContent, "Processing");
    assert(!status.find("sup"));
    assert(status.find(".hys-ui-badge-status-dot"));
    assert(
      !status.find(".hys-ui-badge-processing"),
      "motion=off suppresses processing animation",
    );
    assert.equal(
      mediaCalls,
      0,
      "Badges in dense tables do not allocate per-instance media listeners",
    );
  } finally {
    window.matchMedia = original;
  }
});
test("Selectable badges accept host changes, separate close from toggle, and honor disabled state", async () => {
  const a = await mount(
    ui.HysBadge,
    { checkable: true, closable: true, defaultChecked: true },
    "Watch",
  );
  const button = a.find("[aria-pressed]");
  assert.equal(button.getAttribute("aria-pressed"), "true");
  await fire(button, "click");
  assert.equal(button.getAttribute("aria-pressed"), "false");
  assert.equal(a.events.change.length, 1);
  await fire(a.find(".hys-ui-badge-close"), "click");
  assert.equal(a.events.close.length, 1);
  assert.equal(a.events.change.length, 1);
  a.props.disabled = true;
  await nextTick();
  await fire(button, "click");
  await fire(a.find(".hys-ui-badge-close"), "click");
  assert.equal(a.events.change.length, 1);
  assert.equal(a.events.close.length, 1);
});
test("Controlled Badge and Card may reject changes without accepted change events", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const changes = [],
    requests = [],
    app = createApp({
      render: () =>
        h("div", [
          h(
            ui.HysBadge,
            {
              checkable: true,
              checked: false,
              "onUpdate:checked": (v) => requests.push(v),
              onChange: () => changes.push("badge"),
            },
            () => "Watch",
          ),
          h(ui.HysCard, {
            tabs: [
              { label: "One", value: 1 },
              { label: "Two", value: 2 },
            ],
            activeTab: 1,
            "onUpdate:activeTab": (v) => requests.push(v),
            onTabChange: () => changes.push("card"),
          }),
        ]),
    });
  app.mount(host);
  try {
    await fire(host.querySelector("[aria-pressed]"), "click");
    await fire(host.querySelectorAll("[role=tab]")[1], "click");
    assert.deepEqual(requests, [true, 2]);
    assert.deepEqual(changes, []);
    assert.equal(
      host.querySelector("[aria-pressed]").getAttribute("aria-pressed"),
      "false",
    );
    assert.equal(
      host.querySelector("[role=tab]").getAttribute("aria-selected"),
      "true",
    );
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Card supports legacy sections, custom loading and typed keyboard tab navigation", async () => {
  const a = await mount(
    ui.HysCard,
    {
      title: "Card",
      subtitle: "Description",
      footer: "Footer",
      bodyStyle: { padding: "13px" },
      tabs: [
        { label: "Zero", value: 0 },
        { label: "Disabled", value: "disabled", disabled: true },
        { label: "String zero", value: "0" },
      ],
    },
    {
      default: ({ activeTab }) => h("p", typeof activeTab + ":" + activeTab),
      action: () => h("button", "Action"),
      cover: () => h("div", "Cover"),
      actions: () => h("button", "Save"),
    },
  );
  assert.equal(a.vm.element, a.find("section"));
  assert.equal(a.find("[role=tabpanel]").textContent, "number:0");
  assert.equal(a.find(".hys-ui-card-content").style.padding, "13px");
  assert(a.find(".hys-ui-card-cover"));
  assert(a.find(".hys-ui-card-actions"));
  assert.equal(a.find("footer").textContent, "Footer");
  await fire(a.find("[role=tab]"), "keydown", { key: "ArrowRight" });
  assert.equal(a.props.activeTab, "0");
  assert.equal(a.find("[role=tabpanel]").textContent, "string:0");
  assert.equal(a.events.tabChange.length, 1);
  await fire(a.find("[role=tab][aria-selected=true]"), "keydown", {
    key: "Home",
  });
  assert.equal(a.props.activeTab, 0);
  a.props.loading = true;
  await nextTick();
  assert(a.find("[role=status]"));
  assert(a.all("[role=tab]").every((el) => el.disabled));
  await fire(a.all("[role=tab]")[2], "click");
  assert.equal(a.props.activeTab, 0);
  a.props.loading = false;
  await nextTick();
  assert.equal(a.find("[role=tabpanel]").textContent, "number:0");
});
test("Card non-controlled defaults and RTL navigation track the available tab list", async () => {
  const a = await mount(ui.HysCard, {
    defaultActiveTab: "two",
    tabs: [
      { label: "One", value: "one" },
      { label: "Two", value: "two" },
      { label: "Three", value: "three" },
    ],
  });
  assert.equal(a.vm.activeTab, "two");
  a.find("[role=tablist]").style.direction = "rtl";
  await fire(a.find("[aria-selected=true]"), "keydown", { key: "ArrowLeft" });
  assert.equal(a.props.activeTab, "three");
  a.props.activeTab = undefined;
  a.props.tabs = [{ label: "New", value: "new" }];
  await nextTick();
  assert.equal(a.find("[role=tab]").getAttribute("tabindex"), "0");
  assert.equal(a.vm.activeTab, "new");
});
test("Card fullscreen preserves its content and returns focus and page scrolling on Escape", async () => {
  const a = await mount(ui.HysCard, { title: "Records", fullscreenable: true }, {
    default: () => h("input", { defaultValue: "Initial" }),
  });
  const card = a.vm.element;
  const button = card.querySelector("[data-card-fullscreen-toggle]");
  const input = card.querySelector("input");
  input.value = "Draft";
  button.focus();
  await fire(button, "click");
  await nextTick();

  assert.equal(a.vm.fullscreen, true);
  assert.equal(card.parentElement, document.body);
  assert.equal(card.getAttribute("role"), "dialog");
  assert.equal(card.getAttribute("aria-modal"), "true");
  assert.equal(document.activeElement, button);
  assert.equal(document.body.style.overflow, "hidden");
  assert.deepEqual(a.events.fullscreenChange, [[true]]);
  assert.equal(card.querySelector("input"), input);
  assert.equal(input.value, "Draft");

  await fire(input, "keydown", { key: "Escape" });
  await nextTick();
  assert.equal(a.vm.fullscreen, false);
  assert.equal(a.find("section"), card);
  assert.equal(document.activeElement, button);
  assert.equal(document.body.style.overflow, "");
  assert.deepEqual(a.events.fullscreenChange, [[true], [false]]);
  assert.equal(input.value, "Draft");

  assert.equal(await a.vm.setFullscreen(true), true);
  a.unmount();
  assert.equal(document.body.style.overflow, "");
  assert.equal(document.querySelector('[aria-modal="true"]'), null);
});
test("Card fullscreen keeps automatic focus silent and lets the user reopen the tooltip", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const a = await mount(ui.HysCard, { title: "Records", fullscreenable: true });
  const button = a.vm.element.querySelector("[data-card-fullscreen-toggle]");
  const tip = () => document.querySelector('[role="tooltip"]');
  async function showDelay() {
    await nextTick();
    t.mock.timers.tick(601);
    await nextTick();
    await nextTick();
  }

  button.focus();
  await showDelay();
  assert.equal(tip()?.textContent, "全屏查看卡片");
  const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
  assert.equal(button.dispatchEvent(enter), true);
  await fire(button, "click");
  await showDelay();
  assert.equal(a.vm.fullscreen, true);
  assert.equal(document.activeElement, button);
  assert.equal(tip(), null);

  await fire(button.closest(".hys-ui-tooltip-wrap"), "pointerenter");
  await showDelay();
  assert.equal(tip()?.textContent, "退出卡片全屏");
  await fire(button, "click");
  await showDelay();
  assert.equal(a.vm.fullscreen, false);
  assert.equal(document.activeElement, button);
  assert.equal(tip(), null);

  button.blur();
  button.focus();
  await showDelay();
  assert.equal(tip()?.textContent, "全屏查看卡片");
});
test("Divider keeps separator semantics and suppresses text in vertical mode", async () => {
  const a = await mount(ui.HysDivider, {
    label: "Configuration",
    orientation: "start",
    orientationMargin: 0,
    borderStyle: "dotted",
    dashed: true,
  });
  assert.equal(
    a.find("[role=separator]").getAttribute("aria-orientation"),
    "horizontal",
  );
  assert.equal(a.host.textContent, "Configuration");
  a.props.direction = "vertical";
  await nextTick();
  assert.equal(
    a.find("[role=separator]").getAttribute("aria-orientation"),
    "vertical",
  );
  assert.equal(a.host.textContent, "");
});
test("Skeleton delays display for short requests and holds visible placeholders for minDuration", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const a = await mount(
    ui.HysSkeleton,
    { loading: false, delay: 100, minDuration: 200 },
    { default: () => h("p", "Ready") },
  );
  a.props.loading = true;
  await nextTick();
  t.mock.timers.tick(50);
  a.props.loading = false;
  await nextTick();
  t.mock.timers.tick(500);
  await nextTick();
  assert(!a.find("[role=status]"));
  assert.equal(a.host.textContent, "Ready");
  a.props.loading = true;
  await nextTick();
  t.mock.timers.tick(100);
  await nextTick();
  assert(a.find("[role=status]"));
  a.props.loading = false;
  await nextTick();
  t.mock.timers.tick(199);
  await nextTick();
  assert(a.find("[role=status]"));
  t.mock.timers.tick(1);
  await nextTick();
  assert(!a.find("[role=status]"));
  assert.deepEqual(a.events.visibilityChange, [[true], [false]]);
});
test("Skeleton replacement loads cancel pending hides and custom repeated templates render independent indices", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const a = await mount(
    ui.HysSkeleton,
    { loading: true, minDuration: 100, count: 3 },
    {
      template: ({ index, active }) => h("span", index + ":" + active),
      default: () => h("p", "Ready"),
    },
  );
  assert.equal(a.host.textContent, "0:false1:false2:false");
  a.props.loading = false;
  await nextTick();
  t.mock.timers.tick(50);
  a.props.loading = true;
  await nextTick();
  t.mock.timers.tick(200);
  await nextTick();
  assert(a.find("[role=status]"));
  a.props.loading = false;
  await nextTick();
  assert.equal(a.host.textContent, "Ready");
});
test("Skeleton leaves no delayed state work while cached or after unmount", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const visible = ref(true),
    loading = ref(true),
    events = [],
    host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup() {
      ui.provideHysConfig({ motion: "off" });
      return () =>
        h(KeepAlive, null, {
          default: () =>
            visible.value
              ? h(ui.HysSkeleton, {
                  loading: loading.value,
                  delay: 100,
                  onVisibilityChange: (v) => events.push(v),
                })
              : h("div", "Other"),
        });
    },
  });
  app.mount(host);
  await nextTick();
  visible.value = false;
  await nextTick();
  t.mock.timers.tick(200);
  await nextTick();
  assert.deepEqual(events, []);
  visible.value = true;
  await nextTick();
  t.mock.timers.tick(100);
  await nextTick();
  assert.deepEqual(events, [true]);
  loading.value = false;
  await nextTick();
  assert.deepEqual(events, [true, false]);
  app.unmount();
  host.remove();
  t.mock.timers.tick(500);
  assert.deepEqual(events, [true, false]);
});
