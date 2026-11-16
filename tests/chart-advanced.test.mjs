import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "Node",
  "Element",
  "HTMLElement",
  "HTMLFormElement",
  "SVGElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "FocusEvent",
  "MutationObserver",
  "XMLSerializer",
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
const { createApp, h, nextTick, reactive, ref } = await import("vue");
const { HysChart, provideHysConfig } =
  await import("../packages/ui/dist/index.js");

let unmount;
async function mount(options, motion = "off") {
  const host = document.createElement("div");
  document.body.append(host);
  const props = reactive(options);
  const instance = ref();
  const events = {};
  const listeners = {};
  for (const key of [
    "update:selectedKey",
    "update:hiddenKeys",
    "update:range",
    "update:cursor",
    "point-click",
    "legend-change",
    "point-hover",
    "range-change",
    "retry",
  ]) {
    listeners["on" + key[0].toUpperCase() + key.slice(1)] = (value) =>
      (events[key] ??= []).push(value);
  }
  const app = createApp({
    setup() {
      provideHysConfig({ motion });
      return () => h(HysChart, { ...props, ...listeners, ref: instance });
    },
  });
  app.mount(host);
  unmount = () => {
    app.unmount();
    host.remove();
  };
  await nextTick();
  return {
    props,
    events,
    instance,
    find: (selector) => host.querySelector(selector),
    all: (selector) => [...host.querySelectorAll(selector)],
    async click(selector) {
      const target = host.querySelector(selector);
      assert(target, selector);
      target.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
      await nextTick();
    },
  };
}
afterEach(() => {
  unmount?.();
  unmount = undefined;
});

test("Chart uses a chronological horizontal scale, exact dual Y bounds, and preserves a missing point gap", async () => {
  const day = 86400000;
  const first = Date.UTC(2026, 10, 1);
  const chart = await mount({
    type: "line",
    xAxis: {
      type: "time",
      min: new Date(first),
      max: "2026-11-04",
      ticks: [first, first + 2 * day, first + 3 * day],
      formatter: (value) => String((value - first) / day + 1),
    },
    yAxis: [
      { min: 0, max: 100, ticks: [0, 50, 100], unit: "%" },
      { min: 0, max: 800, ticks: [0, 400, 800], unit: "ms" },
    ],
    series: [
      {
        id: "rate",
        name: "Success",
        data: [
          { id: "late", label: "Late", time: "2026-11-04", value: 50 },
          { id: "early", label: "Early", time: new Date(first), value: 50 },
          { label: "Gap", time: "2026-11-02", value: null },
        ],
      },
      {
        id: "speed",
        name: "Time",
        yAxis: 1,
        data: [{ label: "Early", time: first, value: 400 }],
      },
    ],
    annotations: [
      { type: "band", from: 300, to: 500, yAxis: 1, label: "Alert" },
      { type: "max", seriesId: "rate" },
      { type: "trend", seriesId: "rate" },
    ],
    showTable: true,
  });
  const dot = (key) =>
    chart.find('[data-chart-point="' + key + '"] .hys-chart-dot');
  assert(
    Number(dot("rate:early").getAttribute("cx")) <
      Number(dot("rate:late").getAttribute("cx")),
  );
  assert.equal(
    dot("rate:early").getAttribute("cy"),
    dot("speed:0").getAttribute("cy"),
  );
  assert.equal(chart.all(".hys-chart-secondary-axis").length, 3);
  assert.match(
    chart.find(".hys-chart-secondary-axis").parentNode.textContent,
    /400 ms/,
  );
  assert(chart.find('[aria-label="Alert"] rect'));
  assert(chart.find('[aria-label="最大 50"] circle'));
  assert(chart.find('[aria-label="Success趋势"] line'));
  assert.equal(chart.all(".hys-chart-line").length, 3);
  chart.props.missing = "connect";
  await nextTick();
  assert.equal(chart.all(".hys-chart-line").length, 2);
  chart.props.missing = "zero";
  await nextTick();
  assert(dot("rate:2"));
  assert.equal(
    chart
      .all("tbody tr")
      .find((row) => row.querySelector("th").textContent === "Gap")
      .lastElementChild.textContent,
    "0",
  );
});

test("Chart controlled selection, legend, range and state only change when the caller updates them", async () => {
  const chart = await mount({
    type: "line",
    showLegend: true,
    selectedKey: null,
    hiddenKeys: [],
    range: null,
    zoomable: true,
    data: [1, 2, 3, 4, 5].map((value) => ({
      id: value,
      label: String(value),
      value,
    })),
  });
  await chart.click('[data-chart-point="series:0:2"]');
  assert.deepEqual(chart.events["update:selectedKey"], ["series:0:2"]);
  assert.equal(
    chart.find('[data-chart-point="series:0:2"]').getAttribute("aria-pressed"),
    "false",
  );
  chart.props.selectedKey = "series:0:2";
  await nextTick();
  assert.equal(
    chart.find('[data-chart-point="series:0:2"]').getAttribute("aria-pressed"),
    "true",
  );
  await chart.click(".hys-chart-legend button");
  assert.deepEqual(chart.events["update:hiddenKeys"], [["series:0"]]);
  assert.equal(chart.all("[data-chart-point]").length, 5);
  chart.props.hiddenKeys = ["series:0"];
  await nextTick();
  assert.match(chart.find(".hys-chart-empty").textContent, /请选择/);
  chart.props.hiddenKeys = [];
  chart.props.range = { start: 1, end: 3 };
  await nextTick();
  assert.equal(chart.all("[data-chart-point]").length, 3);
  chart.instance.value.resetRange();
  assert.deepEqual(chart.events["range-change"], [null]);
  chart.props.loading = true;
  chart.props.error = "offline";
  await nextTick();
  assert.equal(chart.find("svg"), null);
  assert.match(chart.find("[aria-busy]").textContent, /正在加载/);
  chart.props.loading = false;
  await nextTick();
  assert.match(chart.find(".hys-chart-empty").textContent, /offline/);
  await chart.click(".hys-chart-empty button");
  assert.equal(chart.events.retry.length, 1);
});

test("Chart samples points without dropping extrema or the externally selected point, and exports intact source data", async () => {
  const chart = await mount({
    type: "line",
    sampling: 18,
    selectedKey: "series:0:75",
    showTable: true,
    data: Array.from({ length: 100 }, (_, index) => ({
      id: index,
      label: index === 1 ? "=SUM(1,2)" : 'Row "' + index + '"',
      value: index === 45 ? 999 : index === 3 ? null : index % 10,
    })),
  });
  assert(chart.all("[data-chart-point]").length <= 19);
  assert(chart.find('[data-chart-point="series:0:45"]'));
  assert(chart.find('[data-chart-point="series:0:75"][aria-pressed="true"]'));
  assert.equal(chart.all("tbody tr").length, 99);
  const csv = await chart.instance.value.exportChart("csv");
  const rows = (await csv.text()).split("\r\n");
  assert.equal(rows.length, 101);
  assert(rows[2].includes(`"'=SUM(1,2)"`));
  assert.match(rows[4], /,,$/);
  const svg = await chart.instance.value.exportChart("svg");
  assert.equal(svg.type, "image/svg+xml;charset=utf-8");
  assert.match(
    await svg.text(),
    /<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/,
  );
});

test("Chart renders and selects each added plot type with finite geometry", async () => {
  const chart = await mount({
    type: "radar",
    selectedKey: null,
    data: [
      { label: "Latency", value: 17 },
      { label: "Uptime", value: 99 },
      { label: "Score", value: 80 },
    ],
  });
  for (const [type, count] of [
    ["radar", 3],
    ["funnel", 3],
    ["gauge", 1],
    ["heatmap", 3],
  ]) {
    chart.props.type = type;
    await nextTick();
    assert.equal(chart.all("[data-chart-point]").length, count, type);
    assert.doesNotMatch(chart.find(".hys-chart-svg").outerHTML, /NaN|Infinity/);
    await chart.click('[data-chart-point="series:0:0"]');
    assert.equal(chart.events["update:selectedKey"].at(-1), "series:0:0");
  }
});

test("Chart keeps tooltip text mounted while closing and clears the hover state immediately", async () => {
  const chart = await mount(
    {
      data: [{ label: "Orders", value: 14 }],
    },
    "subtle",
  );
  chart
    .find("[data-chart-point]")
    .dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
  await nextTick();
  const content = document.querySelector(".hys-chart-tooltip-content");
  assert(content);
  assert.match(content.textContent, /Orders.*14/);
  chart.find("[data-chart-point]").dispatchEvent(
    new MouseEvent("pointerout", {
      bubbles: true,
      relatedTarget: document.body,
    }),
  );
  await nextTick();
  assert.equal(chart.events["point-hover"].at(-1), null);
  assert.equal(document.querySelector(".hys-chart-tooltip-content"), content);
  assert.match(content.textContent, /Orders.*14/);
});

function chartPointerTarget(chart) {
  const svg = chart.find(".hys-chart-svg");
  const [, , width, height] = svg
    .getAttribute("viewBox")
    .split(" ")
    .map(Number);
  const clip = svg.querySelector("clipPath rect");
  const [left, top, plotWidth, plotHeight] = ["x", "y", "width", "height"].map(
    (name) => Number(clip.getAttribute(name)),
  );
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width, height });
  function dispatch(type, x, y, extras = {}) {
    const EventType = type === "wheel" ? dom.window.WheelEvent : MouseEvent;
    const event = new EventType(type, {
      cancelable: true,
      bubbles: true,
      clientX: left + x * plotWidth,
      clientY: top + y * plotHeight,
      ...extras,
    });
    svg.dispatchEvent(event);
    return event;
  }
  return { svg, dispatch };
}

test("Chart zooms with an unmodified wheel at the pointer and lets unused wheel events scroll", async () => {
  const chart = await mount({
    type: "line",
    zoomable: true,
    xAxis: { type: "value", min: 0, max: 100 },
    data: [0, 25, 50, 75, 100].map((x) => ({ label: String(x), x, value: x })),
  });
  const { dispatch } = chartPointerTarget(chart);
  const wheel = (deltaY, x = 0.75, y = 0.5) =>
    dispatch("wheel", x, y, { deltaY });
  assert.equal(wheel(100).defaultPrevented, false);
  assert.equal(wheel(-100, 0.75, 1.1).defaultPrevented, false);
  assert.equal(wheel(0).defaultPrevented, false);
  assert.equal(chart.events["update:range"], undefined);
  assert.equal(wheel(-100).defaultPrevented, true);
  await nextTick();
  const { start, end } = chart.events["update:range"][0];
  assert(Math.abs(start - 15) < 1e-10);
  assert(Math.abs(end - 95) < 1e-10);
  assert.equal(chart.all("[data-chart-point]").length, 3);
  assert.equal(wheel(100).defaultPrevented, true);
  await nextTick();
  assert.equal(chart.events["update:range"].at(-1), null);
  chart.props.zoomable = false;
  await nextTick();
  assert.equal(wheel(-100).defaultPrevented, false);
});

test("Chart preserves Shift selection on the plot and cancels it on Escape", async () => {
  const chart = await mount({
    type: "line",
    zoomable: true,
    xAxis: { type: "value", min: 0, max: 100 },
    data: [0, 25, 50, 75, 100].map((x) => ({ label: String(x), x, value: x })),
  });
  const { svg, dispatch } = chartPointerTarget(chart);
  const start = async () => {
    dispatch("pointerdown", 0.25, 0.5, { shiftKey: true });
    dispatch("pointermove", 0.75, 0.65, { shiftKey: true });
    await nextTick();
    assert(chart.find(".hys-chart-region"));
  };
  await start();
  svg.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await nextTick();
  assert.equal(chart.find(".hys-chart-region"), null);
  assert.equal(chart.events["update:range"], undefined);
  await start();
  dispatch("pointerup", 0.75, 0.65, { shiftKey: true });
  await nextTick();
  assert.equal(chart.find(".hys-chart-region"), null);
  assert.deepEqual(chart.events["update:range"], [{ start: 25, end: 75 }]);
});

test("Chart navigator draws, resizes and pans a selected interval below the plot", async () => {
  const chart = await mount({
    type: "line",
    zoomable: true,
    xAxis: { type: "value", min: 0, max: 100 },
    data: [0, 25, 50, 75, 100].map((x) => ({ label: String(x), x, value: x })),
  });
  const track = chart.find(".hys-chart-navigator-track");
  const rail = track.querySelector(".hys-ui-slider-rail");
  rail.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 1000,
    bottom: 34,
    width: 1000,
    height: 34,
  });
  assert(
    track
      .closest(".hys-chart-navigator")
      .previousElementSibling.classList.contains("hys-chart-plot"),
  );
  const overview = track
    .querySelector(".hys-chart-navigator-overview path")
    .getAttribute("d");
  function pointer(target, type, x) {
    target.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: 10,
      }),
    );
  }
  async function draw(target, from, to) {
    pointer(target, "pointerdown", from);
    pointer(track, "pointermove", to);
    await nextTick();
    pointer(track, "pointerup", to);
    await nextTick();
  }
  const selected = rail.querySelector(".hys-ui-slider-selection");
  pointer(selected, "pointerdown", 200);
  pointer(track, "pointermove", 700);
  await nextTick();
  assert.equal(chart.events["update:range"], undefined);
  assert.equal(chart.find(".hys-chart-navigator-range").textContent, "20 – 70");
  track.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await nextTick();
  assert.equal(chart.events["update:range"], undefined);
  assert.equal(
    chart.find(".hys-chart-navigator-range").textContent,
    "全部区间",
  );
  await draw(selected, 700, 200);
  assert.deepEqual(chart.events["update:range"], [{ start: 20, end: 70 }]);
  assert.equal(chart.all("[data-chart-point]").length, 2);
  assert.equal(
    track.querySelector(".hys-chart-navigator-overview path").getAttribute("d"),
    overview,
  );
  const handles = track.querySelectorAll('[role="slider"]');
  handles[1].dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "ArrowRight",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  await nextTick();
  assert.equal(handles[1].getAttribute("aria-valuenow"), "710");
  await draw(selected, 430, 530);
  assert.deepEqual(chart.events["update:range"].at(-1), { start: 30, end: 81 });
  pointer(rail, "pointerdown", 880);
  pointer(track, "pointerup", 880);
  await nextTick();
  assert.deepEqual(chart.events["update:range"].at(-1), {
    start: 49,
    end: 100,
  });
  await chart.click(".hys-chart-navigator-controls button:last-child");
  assert.equal(chart.events["update:range"].at(-1), null);
  assert.equal(chart.all("[data-chart-point]").length, 5);
});

test("Chart returns to the exact full time domain after opposite wheel steps", async () => {
  const start = Date.UTC(2026, 10, 12, 8);
  const end = start + 239 * 60000;
  const chart = await mount({
    type: "line",
    zoomable: true,
    xAxis: { type: "time" },
    data: [
      { label: "Start", time: start, value: 2 },
      { label: "End", time: end, value: 3 },
    ],
  });
  const { dispatch } = chartPointerTarget(chart);
  assert(dispatch("wheel", 0.65, 0.5, { deltaY: -100 }).defaultPrevented);
  await nextTick();
  assert(dispatch("wheel", 0.65, 0.5, { deltaY: 100 }).defaultPrevented);
  await nextTick();
  assert.equal(chart.events["update:range"].at(-1), null);
  assert.equal(
    dispatch("wheel", 0.65, 0.5, { deltaY: 100 }).defaultPrevented,
    false,
  );
});

test("Chart bounds the inline legend and can find and toggle an overflow item", async () => {
  const series = Array.from({ length: 30 }, (_, index) => ({
    id: "site-" + index,
    name: "配送中心 " + index,
    data: [{ label: "本周", value: index + 1 }],
  }));
  const chart = await mount({ type: "line", series, showTooltip: false });
  const top = chart.all(".hys-chart-legend-inline .hys-chart-legend-item");
  assert(top.length < series.length);
  assert.equal(chart.all("[data-chart-point]").length, 30);
  const trigger = chart.find(".hys-chart-legend-more button");
  trigger.getBoundingClientRect = () => new dom.window.DOMRect(40, 40, 110, 30);
  trigger.getClientRects = () => [trigger.getBoundingClientRect()];
  await chart.click(".hys-chart-legend-more button");
  const search = chart.find(".hys-chart-legend-panel input");
  assert(search);
  search.value = "29";
  search.dispatchEvent(new Event("input", { bubbles: true }));
  await nextTick();
  const matches = chart.all(".hys-chart-legend-items .hys-chart-legend-item");
  assert.equal(matches.length, 1);
  assert.match(matches[0].textContent, /29/);
  await chart.click(".hys-chart-legend-items .hys-chart-legend-item");
  assert.equal(matches[0].getAttribute("aria-pressed"), "false");
  assert.equal(chart.find('[data-chart-point="site-29:0"]'), null);
  assert.deepEqual(chart.events["update:hiddenKeys"], [["site-29"]]);
  assert(chart.find(".hys-chart-legend-panel"));
});

test("Chart preserves legend visibility through every layout and keeps page changes local", async () => {
  const series = Array.from({ length: 30 }, (_, index) => ({
    id: "site-" + index,
    name: "配送中心 " + index,
    legendLabel: "中心 " + index,
    legendGroup: index < 15 ? "华东" : "华北",
    data: [
      { label: "第二周", value: index + 10, x: 2 },
      { label: "第一周", value: index + 1, x: 1 },
    ],
  }));
  const hiddenKeys = series.slice(4).map((item) => item.id);
  const chart = await mount({
    type: "line",
    series,
    hiddenKeys,
    xAxis: { type: "value" },
    showTooltip: false,
  });
  const item = (key) =>
    chart.find('.hys-chart-legend-item[data-legend-key="' + key + '"]');
  assert(chart.find('[data-legend-layout="compact"]'));
  assert.equal(chart.all("[data-chart-point]").length, 8);
  chart.props.legendLayout = "selected";
  await nextTick();
  assert.equal(chart.all(".hys-chart-legend-chip").length, 4);
  assert.match(item("site-0").textContent, /中心 0/);
  await chart.click('[data-legend-key="site-0"]');
  assert.deepEqual(chart.events["update:hiddenKeys"], [
    [...hiddenKeys, "site-0"],
  ]);
  assert.equal(chart.all(".hys-chart-legend-chip").length, 4);
  chart.props.hiddenKeys = chart.events["update:hiddenKeys"][0];
  await nextTick();
  assert.equal(chart.all(".hys-chart-legend-chip").length, 3);
  assert.equal(chart.find('[data-chart-point="site-0:0"]'), null);

  chart.props.legendLayout = "grouped";
  await nextTick();
  const groups = chart.all(".hys-chart-legend-group");
  assert.deepEqual(
    groups.map((button) => button.getAttribute("aria-pressed")),
    ["true", "false"],
  );
  await chart.click(".hys-chart-legend-group:nth-child(2)");
  assert(item("site-15"));
  assert.equal(item("site-15").getAttribute("aria-pressed"), "false");

  chart.props.legendLayout = "sidebar";
  await nextTick();
  assert(chart.find(".hys-chart-body-sidebar .hys-chart-legend-sidebar"));
  assert.equal(
    chart.all(".hys-chart-legend-list .hys-chart-legend-item").length,
    30,
  );
  assert.equal(
    item("site-1").querySelector(".hys-chart-legend-value").textContent,
    "11",
  );
  assert.equal(item("site-1").getAttribute("aria-pressed"), "true");

  chart.props.legendLayout = "paged";
  await nextTick();
  assert(item("site-0"));
  assert(chart.find('[aria-label="上一页图例"]').disabled);
  await chart.click('[aria-label="下一页图例"]');
  assert.equal(item("site-0"), null);
  assert.match(chart.find(".hys-chart-legend-pager").textContent, /2 \//);
  chart.props.legendLayout = "compact";
  await nextTick();
  assert.equal(item("site-0").getAttribute("aria-pressed"), "false");
  assert.equal(item("site-1").getAttribute("aria-pressed"), "true");
  assert.equal(chart.events["legend-change"].length, 1);
  assert.equal(chart.all("[data-chart-point]").length, 6);
});

test("Chart retains an uncontrolled pie-slice legend selection across layouts", async () => {
  const chart = await mount({
    type: "pie",
    legendLayout: "grouped",
    data: [
      {
        id: "fruit",
        label: "水果份额",
        legendLabel: "水果",
        legendGroup: "食品",
        value: 18,
      },
      { id: "books", label: "图书份额", legendGroup: "用品", value: 13 },
      { id: "other", label: "其他份额", value: 7 },
    ],
  });
  assert.equal(chart.all(".hys-chart-legend-group").length, 3);
  await chart.click('[data-legend-key="series:0:fruit"]');
  assert.equal(chart.find('[data-chart-point="series:0:fruit"]'), null);
  chart.props.legendLayout = "selected";
  await nextTick();
  assert.equal(chart.all(".hys-chart-legend-chip").length, 2);
  chart.props.legendLayout = "sidebar";
  chart.props.showLegend = false;
  await nextTick();
  assert.equal(chart.find(".hys-chart-legend"), null);
  assert.equal(chart.all(".hys-chart-slice").length, 2);
  assert.deepEqual(chart.events["legend-change"], [
    { key: "series:0:fruit", visible: false },
  ]);
});

test("Chart snaps the crosshair from blank plot space, locks unsampled comparisons, and releases them by keyboard", async () => {
  const chart = await mount({
    type: "line",
    crosshair: true,
    xAxis: { type: "value", min: 0, max: 10 },
    sampling: 4,
    series: ["Orders", "Shipments"].map((name, index) => ({
      name,
      data: Array.from({ length: 11 }, (_, x) => ({
        label: String(x),
        x,
        value: 100 * index + x,
      })),
    })),
  });
  const { svg, dispatch } = chartPointerTarget(chart);
  dispatch("pointermove", 0.39, 0.2);
  await nextTick();
  assert.deepEqual(chart.events["update:cursor"].at(-1), {
    value: 4,
    locked: false,
  });
  assert.equal(chart.all(".hys-chart-crosshair line").length, 2);
  dispatch("click", 0.39, 0.2);
  await nextTick();
  assert.deepEqual(chart.events["update:cursor"].at(-1), {
    value: 4,
    locked: true,
  });
  assert.equal(chart.events["point-click"], undefined);
  assert.deepEqual(
    chart
      .all(".hys-chart-locked-comparison li strong")
      .map((el) => el.textContent),
    ["4", "104"],
  );

  dispatch("pointerleave", 0.5, 0.3);
  dispatch("pointermove", 0.8, 0.5);
  await nextTick();
  assert.deepEqual(chart.events["update:cursor"].at(-1), {
    value: 4,
    locked: true,
  });
  svg.dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
  );
  await nextTick();
  assert.deepEqual(chart.events["update:cursor"].at(-1), {
    value: 5,
    locked: true,
  });

  svg.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await nextTick();
  assert.equal(chart.events["update:cursor"].at(-1), null);
  assert.equal(chart.find(".hys-chart-locked-comparison"), null);
  assert.equal(chart.find(".hys-chart-crosshair"), null);
});

test("Chart time presets use the UTC data window and support the existing range model", async () => {
  const day = 86400000;
  const end = Date.UTC(2026, 9, 7, 17, 23);
  const chart = await mount({
    type: "line",
    xAxis: { type: "time" },
    showDateRange: true,
    range: null,
    rangePresets: [{ label: "最近七天", days: 7 }, { label: "全部" }],
    data: Array.from({ length: 10 }, (_, index) => ({
      label: String(index),
      time: end - (9 - index) * day,
      value: index,
    })),
  });
  const dateTrigger = chart.find(".hys-chart-date-range [role=combobox]");
  anchor(dateTrigger);
  assert(
    ![...document.querySelectorAll("button")].some(
      (button) => button.textContent.trim() === "最近七天",
    ),
  );
  dateTrigger.click();
  await nextTick();
  await clickButton("最近七天");
  const request = { start: Date.UTC(2026, 9, 1), end };
  assert.deepEqual(chart.events["update:range"], [request]);
  assert.deepEqual(chart.events["range-change"], [request]);
  chart.props.range = request;
  await nextTick();
  assert.match(
    chart.find(".hys-chart-date-range .hys-ui-date-display").textContent,
    /2026-10-01.*2026-10-07/u,
  );
  await nextTick();
  dateTrigger.click();
  await nextTick();
  await clickButton("全部");
  assert.equal(chart.events["update:range"].at(-1), null);

  // A narrower intraday viewport can have the same two calendar dates.
  chart.props.range = {
    start: end - 9 * day + 3_600_000,
    end: end - 3_600_000,
  };
  await nextTick();
  dateTrigger.click();
  await nextTick();
  await clickButton("全部");
  assert.deepEqual(chart.events["update:range"], [request, null, null]);
  assert.equal(dateTrigger.getAttribute("aria-expanded"), "false");
});

test("Chart exports the current range and visible series, retaining source values and contextual SVG labels", async () => {
  const first = Date.UTC(2026, 9, 1);
  const day = 86400000;
  const range = { start: first + 2 * day, end: first + 12 * day };
  const chart = await mount({
    type: "line",
    xAxis: { type: "time" },
    range,
    missing: "zero",
    sampling: 4,
    crosshair: true,
    cursor: { value: range.start, locked: true },
    ariaLabel: "Daily totals",
    hiddenKeys: ["hidden"],
    series: [
      {
        id: "visible",
        name: "Visible",
        data: Array.from({ length: 16 }, (_, index) => ({
          label: "Day " + index,
          time: first + index * day,
          value: index === 5 ? null : index,
        })),
      },
      {
        id: "hidden",
        name: "Hidden",
        data: [{ label: "Other", time: range.start, value: 100 }],
      },
    ],
  });
  assert(chart.all("[data-chart-point]").length < 11);
  const instance = chart.instance.value;
  const current = (
    await (await instance.exportChart("csv", { scope: "visible" })).text()
  ).split("\r\n");
  assert.equal(current.length, 12);
  assert.equal(current[1], "Visible,Day 2," + range.start + ",2");
  assert.equal(current[4], "Visible,Day 5," + (first + 5 * day) + ",");
  assert.equal(current.at(-1), "Visible,Day 12," + range.end + ",12");
  const all = await (await instance.exportChart("csv")).text();
  assert.match(all, /Hidden,Other/);
  assert.match(all, /Visible,Day 15/);
  const svg = await (
    await instance.exportChart("svg", { includeContext: true })
  ).text();
  assert.match(svg, /<title>Daily totals<\/title>/);
  assert.match(svg, /2026-10-03.*2026-10-13/);
  assert.match(svg, />Visible<\/text>/);
  assert.doesNotMatch(svg, /Hidden|hys-chart-crosshair/);
  Object.defineProperty(chart.find(".hys-chart-plot"), "clientWidth", {
    value: 250,
  });
  window.dispatchEvent(new Event("resize"));
  await nextTick();
  const narrow = await (
    await instance.exportChart("svg", { includeContext: true })
  ).text();
  assert.match(narrow, />开始 +2026-10-03 00:00 UTC<\/text>/u);
  assert.match(narrow, />结束 +2026-10-13 00:00 UTC<\/text>/u);
  const legacy = await (await instance.exportChart("svg", 2)).text();
  assert.doesNotMatch(legacy, /<title>Daily totals<\/title>/);
});

function anchor(element) {
  assert(element);
  element.getBoundingClientRect = () => new dom.window.DOMRect(40, 40, 140, 30);
  element.getClientRects = () => [element.getBoundingClientRect()];
}
async function clickButton(label) {
  const button = [...document.querySelectorAll("button")].find(
    (el) => el.textContent.trim() === label,
  );
  assert(button, label);
  button.click();
  await nextTick();
}

test("Chart restores legends in a single batch and emits each changed legend key", async () => {
  const chart = await mount({
    type: "line",
    legendActions: true,
    hiddenKeys: ["b", "c"],
    series: ["a", "b", "c"].map((id) => ({
      id,
      name: id,
      data: [{ label: "Day", value: 1 }],
    })),
  });
  const trigger = chart.find(".hys-chart-tools-actions button");
  anchor(trigger);
  trigger.click();
  await nextTick();
  await clickButton("恢复全部");
  assert.deepEqual(chart.events["update:hiddenKeys"], [[]]);
  assert.deepEqual(chart.events["legend-change"], [
    { key: "b", visible: true },
    { key: "c", visible: true },
  ]);
  assert.equal(chart.all("[data-chart-point]").length, 1);
  chart.props.hiddenKeys = [];
  await nextTick();
  assert.equal(chart.all("[data-chart-point]").length, 3);
});
