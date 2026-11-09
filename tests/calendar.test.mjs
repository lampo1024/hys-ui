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

const day = (a, value) => a.find(`[data-date="${value}"]`);
const choose = (a, value) =>
  fire(day(a, value).querySelector(".hys-ui-calendar-day"), "click");
const dateMath = await import("../packages/ui/dist/composables/calendar.js");
test("An out-of-range selected value keeps its model while opening a usable panel", async () => {
  const a = await mount(ui.HysCalendar, {
    modelValue: "2020-01-01",
    validRange: ["2028-02-10", "2028-03-20"],
  });
  assert.equal(a.vm.panelValue, "2028-02-10");
  assert.equal(a.vm.selectedDay, "2020-01-01");
  assert(!a.events.change);
  assert(await a.vm.pickDay("2028-02-11"));
});
test("Full date and month slots replace default content while preserving grid semantics", async () => {
  const a = await mount(
    ui.HysCalendar,
    { modelValue: "2026-11-09" },
    {
      "date-full-cell": ({ data }) =>
        h("span", { "data-full": data.day }, data.day),
      "month-full-cell": ({ data }) =>
        h("b", { "data-full-month": data.month }, String(data.month)),
    },
  );
  assert(!a.find(".hys-ui-calendar-day"));
  assert(a.find('[data-full="2026-11-09"]'));
  a.props.mode = "year";
  await nextTick();
  assert.equal(a.all("[data-full-month]").length, 12);
  assert.equal(a.all('[role="gridcell"][tabindex="0"]').length, 1);
});
test("Rejected controlled Calendar requests do not overwrite the selected value", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const instance = ref(),
    app = createApp({
      render: () =>
        h(ui.HysCalendar, { ref: instance, modelValue: "2026-11-09" }),
    });
  app.mount(host);
  try {
    assert.equal(await instance.value.pickDay("2026-11-10"), false);
    assert.equal(instance.value.selectedDay, "2026-11-09");
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Month transitions keep a single active grid when global motion is disabled", async () => {
  const a = await mount(ui.HysCalendar, {
    modelValue: "2026-11-09",
    transition: "zoom",
    transitionDuration: 600,
  });
  a.vm.selectDate("next-month");
  await nextTick();
  assert.equal(a.all(".hys-ui-calendar-page").length, 1);
  await a.vm.focus();
  assert.equal(document.activeElement.dataset.date, "2026-12-09");
  assert(!a.find('[class*="enter-active"]'));
});
test("Civil date parsing, custom formats and month navigation cover leap years and invalid dates", () => {
  const {
    calendarDay: parse,
    calendarISO: iso,
    calendarShift: shift,
    calendarWeek: week,
  } = dateMath;
  assert.equal(iso(parse("2024-02-29")), "2024-02-29");
  assert.equal(parse("2023-02-29"), undefined);
  assert.equal(parse("2024-04-31"), undefined);
  assert.equal(parse("0000-01-01"), undefined);
  assert.equal(iso(parse("31/01/2024", "DD/MM/YYYY")), "2024-01-31");
  assert.equal(iso(shift(parse("2024-01-31"), 1)), "2024-02-29");
  assert.equal(iso(shift(parse("2024-02-29"), 12)), "2025-02-28");
  assert.equal(week(parse("2021-01-01")), 53);
  assert.equal(iso(parse("0001-01-01")), "0001-01-01");
  assert.equal(parse(new Date("invalid")), undefined);
});
test("Calendar starts Monday, supports variable and fixed week counts, and preserves selection while browsing", async () => {
  const a = await mount(ui.HysCalendar, { modelValue: "2021-02-12" });
  assert.equal(a.all('[role="columnheader"]')[0].textContent, "周一");
  assert.equal(a.all("[data-date]").length, 28);
  a.props.fixedWeeks = true;
  await nextTick();
  assert.equal(a.all("[data-date]").length, 42);
  a.vm.selectDate("next-month");
  await nextTick();
  assert.equal(a.vm.panelValue, "2021-03-12");
  assert.equal(a.vm.selectedDay, "2021-02-12");
  assert(!a.events.change);
  a.props.firstDayOfWeek = 0;
  await nextTick();
  assert.equal(a.all('[role="columnheader"]')[0].textContent, "周日");
  assert.equal(new Date(a.vm.visibleRange[0] + "T12:00Z").getUTCDay(), 0);
});
test("Controlled date selection emits source info and repeated selection does not repeat change", async () => {
  const a = await mount(ui.HysCalendar, { modelValue: "2026-11-09" });
  await choose(a, "2026-11-10");
  assert.equal(a.vm.selectedDay, "2026-11-10");
  assert.deepEqual(a.events.select.at(-1), ["2026-11-10", { source: "date" }]);
  assert.equal(a.events.change.length, 1);
  await choose(a, "2026-11-10");
  assert.equal(a.events.change.length, 1);
  assert.equal(a.events.select.length, 2);
  assert.equal(await a.vm.pickDay("2026-11-12"), true);
  assert.equal(a.events.select.at(-1)[1].source, "customize");
});
test("Uncontrolled Calendar retains picked values without a host update", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const instance = ref(),
    app = createApp({
      render: () =>
        h(ui.HysCalendar, { defaultValue: "2026-11-09", ref: instance }),
    });
  app.mount(host);
  try {
    assert(await instance.value.pickDay("2026-11-13"));
    assert.equal(instance.value.selectedDay, "2026-11-13");
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Date models are cloned local dates; string formats and externally changed values stay synchronized", async () => {
  const original = new Date(2024, 0, 31, 15),
    a = await mount(ui.HysCalendar, {
      modelValue: original,
      valueType: "date",
    });
  assert(await a.vm.pickDay("2024-02-29"));
  assert(a.props.modelValue instanceof Date);
  assert.equal(a.props.modelValue.getDate(), 29);
  assert.equal(original.getMonth(), 0);
  assert.equal(original.getHours(), 15);
  const b = await mount(ui.HysCalendar, {
    modelValue: "09/11/2026",
    valueFormat: "DD/MM/YYYY",
  });
  assert.equal(b.vm.panelValue, "09/11/2026");
  await choose(b, "2026-11-10");
  assert.equal(b.props.modelValue, "10/11/2026");
  b.props.modelValue = "31/12/2028";
  await nextTick();
  assert(b.host.textContent.includes("2028年12月"));
});
test("Year view has twelve months, preserves day-of-month with clamping and supports controlled mode changes", async () => {
  const a = await mount(ui.HysCalendar, {
    modelValue: "2024-01-31",
    mode: "year",
  });
  assert.equal(a.all("[data-month]").length, 12);
  await fire(a.find('[data-month="2"] .hys-ui-calendar-day'), "click");
  assert.equal(a.props.modelValue, "2024-02-29");
  assert.equal(a.events.select.at(-1)[1].source, "month");
  assert.equal(a.vm.currentMode, "year");
  a.vm.setMode("month");
  await nextTick();
  assert.equal(a.props.mode, "month");
  assert.equal(a.events.panelChange.at(-1)[1], "month");
});
test("Fixed ranges align weeks, disable padding and block navigation; valid ranges limit normal navigation", async () => {
  const a = await mount(ui.HysCalendar, {
    modelValue: "2026-11-28",
    range: ["2026-11-25", "2026-12-10"],
  });
  assert.deepEqual(a.vm.visibleRange, ["2026-11-23", "2026-12-13"]);
  assert.equal(a.vm.selectDate("next-month"), false);
  assert.equal(await a.vm.pickDay("2026-11-23"), false);
  assert(await a.vm.pickDay("2026-12-05"));
  const b = await mount(ui.HysCalendar, {
    modelValue: "2026-11-09",
    validRange: ["2026-11-05", "2026-12-20"],
    disabledDate: (s) => [0, 6].includes(new Date(s + "T12:00Z").getUTCDay()),
  });
  assert.equal(await b.vm.pickDay("2026-11-07"), false);
  assert.equal(b.vm.selectDate("prev-month"), false);
  assert.equal(b.vm.selectDate("next-month"), true);
  assert.equal(b.vm.selectDate("next-month"), false);
  b.props.validRange = ["bad", "range"];
  await nextTick();
  assert.equal(await b.vm.pickDay("2026-12-08"), false);
});
test("Readonly retains browsing and event inspection; disabled and loading block all built-in writes", async () => {
  const a = await mount(ui.HysCalendar, {
    modelValue: "2026-11-09",
    readonly: true,
    events: [{ id: "one", date: "2026-11-09", title: "Meeting" }],
  });
  assert.equal(await a.vm.pickDay("2026-11-10"), false);
  await fire(a.find(".hys-ui-calendar-event"), "click");
  assert.equal(a.events.event[0][0], "one");
  assert(a.vm.selectDate("next-month"));
  a.props.disabled = true;
  await nextTick();
  assert.equal(a.vm.selectDate("prev-month"), false);
  assert.equal(a.vm.setMode("year"), false);
  a.props.disabled = false;
  a.props.loading = true;
  await nextTick();
  assert(a.find('[role="status"]'));
  assert.equal(a.vm.selectDate("prev-month"), false);
});
test("Multi-day events, overflow panels and event disabling preserve independent selection", async () => {
  const events = [
      { id: "span", date: "2026-11-08", end: "2026-11-10", title: "Workshop" },
      ...Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        date: "2026-11-09",
        title: "Meeting " + i,
        disabled: i === 4,
      })),
    ],
    a = await mount(ui.HysCalendar, {
      modelValue: "2026-11-09",
      events,
      maxEvents: 2,
    });
  assert.equal(
    day(a, "2026-11-08").querySelectorAll(".hys-ui-calendar-event").length,
    1,
  );
  assert.equal(
    day(a, "2026-11-09").querySelectorAll(".hys-ui-calendar-event").length,
    2,
  );
  await fire(
    day(a, "2026-11-09").querySelector(".hys-ui-calendar-more"),
    "click",
  );
  await pause(30);
  const popup = document.querySelector(".hys-ui-calendar-popup");
  assert(popup);
  assert.equal(popup.querySelectorAll(".hys-ui-calendar-event").length, 6);
  await fire(popup.querySelector(".hys-ui-calendar-event"), "click");
  assert.equal(a.events.event.at(-1)[2], "2026-11-09");
  assert(!a.events.select);
  await fire(popup.querySelector(".hys-ui-calendar-event:disabled"), "click");
  assert.equal(a.events.event.length, 1);
  await fire(document, "keydown", { key: "Escape" });
  assert(!document.querySelector(".hys-ui-calendar-popup"));
});
test("Legacy and new slots receive compatible data, and cell controls do not select dates", async () => {
  const a = await mount(
    ui.HysCalendar,
    { modelValue: "2026-11-09" },
    {
      date: ({ date, day }) => h("span", { "data-legacy": date }, String(day)),
      "date-cell": ({ date, data }) =>
        h("div", [
          h(
            "small",
            { class: "slot-date" },
            date instanceof Date ? data.day : "bad",
          ),
          h("input", { value: "custom" }),
        ]),
      footer: ({ selected, visibleRange }) =>
        h("span", selected + visibleRange.join()),
    },
  );
  assert.equal(a.find('[data-legacy="2026-11-09"]').textContent, "9");
  assert(day(a, "2026-11-09").textContent.includes("2026-11-09"));
  await fire(day(a, "2026-11-10").querySelector("input"), "click");
  assert(!a.events.select);
  assert(a.find("footer").textContent.includes("2026-11-09"));
});
test("Grid keyboard moves focus without selecting, skips disabled days and preserves nested input keys", async () => {
  const a = await mount(
    ui.HysCalendar,
    { modelValue: "2026-11-09", disabledDate: (date) => date === "2026-11-10" },
    { "date-cell": () => h("input", { value: "edit" }) },
  );
  await a.vm.focus();
  assert.equal(document.activeElement.dataset.date, "2026-11-09");
  await fire(document.activeElement, "keydown", { key: "ArrowRight" });
  assert.equal(document.activeElement.dataset.date, "2026-11-11");
  assert(!a.events.select);
  await fire(document.activeElement, "keydown", { key: "Enter" });
  assert.equal(a.props.modelValue, "2026-11-11");
  assert.equal(a.events.select.at(-1)[1].source, "keyboard");
  await fire(day(a, "2026-11-11").querySelector("input"), "keydown", {
    key: "PageDown",
  });
  assert.equal(a.vm.panelValue, "2026-11-11");
  await fire(day(a, "2026-11-11"), "keydown", { key: "PageDown" });
  assert.equal(document.activeElement.dataset.date, "2026-12-11");
  await fire(document.activeElement, "keydown", {
    key: "PageUp",
    shiftKey: true,
  });
  assert.equal(document.activeElement.dataset.date, "2025-12-11");
});
test("Year keyboard navigates months and limited months find the first available date", async () => {
  const a = await mount(ui.HysCalendar, {
    modelValue: "2026-11-09",
    mode: "year",
    validRange: ["2026-02-10", "2026-12-20"],
  });
  await a.vm.focus();
  await fire(document.activeElement, "keydown", { key: "Home" });
  assert.equal(document.activeElement.dataset.month, "2");
  await fire(document.activeElement, "keydown", { key: "Enter" });
  assert.equal(a.props.modelValue, "2026-02-10");
  assert.equal(a.events.select.at(-1)[1].source, "month");
});
test("Invalid models and year limits render safely without rewriting the host", async () => {
  const a = await mount(ui.HysCalendar, { modelValue: "invalid" });
  assert.equal(a.vm.selectedDay, undefined);
  assert(!a.events["update:modelValue"]);
  a.props.modelValue = "0001-01-01";
  await nextTick();
  assert(a.host.textContent.includes("1年1月"));
  assert.equal(a.vm.selectDate("prev-month"), false);
  a.props.modelValue = "9999-12-31";
  await nextTick();
  assert.equal(a.vm.selectDate("next-month"), false);
});
test("Large event arrays are indexed only into the visible window with bounded cell content", async () => {
  const events = Array.from({ length: 10000 }, (_, i) => ({
      id: String(i),
      date: i < 5000 ? "2026-11-09" : "2025-01-01",
      title: "Task " + i,
    })),
    a = await mount(ui.HysCalendar, {
      modelValue: "2026-11-09",
      events,
      maxEvents: 3,
    });
  assert.equal(a.all(".hys-ui-calendar-event").length, 3);
  assert(day(a, "2026-11-09").textContent.includes("+4997"));
  a.props.mode = "year";
  await nextTick();
  assert.equal(a.all("[data-month]").length, 12);
  assert(a.find('[data-month="11"]').textContent.includes("5000"));
});
test("Cached calendars keep their panel and close teleported event lists on leave", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const active = ref(true),
    calendar = ref(),
    app = createApp({
      render: () =>
        h(KeepAlive, null, {
          default: () =>
            active.value
              ? h(ui.HysCalendar, {
                  ref: calendar,
                  defaultValue: "2026-11-09",
                  maxEvents: 0,
                  events: [{ id: "a", date: "2026-11-09", title: "A" }],
                })
              : h("div", "other"),
        }),
    });
  app.mount(host);
  await nextTick();
  try {
    await fire(host.querySelector(".hys-ui-calendar-more"), "click");
    await pause(30);
    assert(document.querySelector(".hys-ui-calendar-popup"));
    active.value = false;
    await nextTick();
    assert(!document.querySelector(".hys-ui-calendar-popup"));
    active.value = true;
    await nextTick();
    calendar.value.selectDate("next-month");
    await nextTick();
    active.value = false;
    await nextTick();
    active.value = true;
    await nextTick();
    assert.equal(calendar.value.panelValue, "2026-12-09");
    assert(!document.querySelector(".hys-ui-calendar-popup"));
  } finally {
    app.unmount();
    host.remove();
  }
});
test("Select protects virtual rendering from non-finite or excessive list heights", async () => {
  const a = await mount(ui.HysSelect, {
    options: Array.from({ length: 10000 }, (_, value) => ({
      value,
      label: "Item " + value,
    })),
    listHeight: Infinity,
  });
  await fire(a.find('[role="combobox"]'), "click");
  assert(document.querySelectorAll('[role="option"]').length < 70);
  assert(
    document
      .querySelector(".hys-ui-select-options")
      .style.maxHeight.includes("60dvh"),
  );
  assert(
    document
      .querySelector(".hys-ui-select-list")
      .style.maxHeight.includes("240px"),
  );
  a.props.listHeight = 1000000;
  await nextTick();
  assert(document.querySelectorAll('[role="option"]').length < 80);
});
