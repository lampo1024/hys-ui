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
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "Event",
  "MutationObserver",
])
  globalThis[name] = dom.window[name];
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
const { createApp, h, reactive, ref, nextTick, defineComponent, KeepAlive } =
    await import("vue"),
  ui = await import("../packages/ui/dist/index.js");
const apps = [];
afterEach(() => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount();
    host.remove();
  }
  document.body.replaceChildren();
});
async function mount(values = {}, slots = {}, config = {}) {
  const props = reactive({ value: 42, ...values }),
    host = document.createElement("div"),
    vm = ref();
  document.body.append(host);
  const app = createApp({
    setup() {
      ui.provideHysConfig(config);
      return () => h(ui.HysProgress, { ...props, ref: vm }, slots);
    },
  });
  app.mount(host);
  apps.push({ app, host });
  await nextTick();
  return {
    props,
    host,
    root: host.firstElementChild,
    get vm() {
      return vm.value;
    },
    find: (selector) => host.querySelector(selector),
    all: (selector) => [...host.querySelectorAll(selector)],
  };
}
test("Legacy defaults, label slot and progress semantics remain available", async () => {
  const a = await mount({ value: 72 });
  assert.equal(a.root.getAttribute("role"), "progressbar");
  assert.equal(a.root.getAttribute("aria-valuenow"), "72");
  assert.equal(a.host.textContent, "72%");
  assert.equal(a.find(".hys-ui-progress-fill").style.width, "72%");
  assert.equal(a.find(".hys-ui-progress-track").style.height, "7px");
  assert.equal(a.all("svg").length, 0);
  const slot = await mount(
    { value: 25 },
    { default: ({ value }) => h("strong", value + " complete") },
  );
  assert.equal(slot.find("strong").textContent, "25 complete");
});
for (const [input, expected] of [
  [-1, 0],
  [150, 100],
  [NaN, 0],
  [Infinity, 0],
  [-Infinity, 0],
])
  test(
    "Invalid percent " + input + " is normalized in visuals and accessibility",
    async () => {
      const a = await mount({ value: input, type: "circle" });
      assert.equal(a.root.getAttribute("aria-valuenow"), String(expected));
      assert.equal(a.vm.value, expected);
      assert.equal(a.root.textContent, expected + "%");
      assert(!a.root.outerHTML.includes("NaN"));
      assert(!a.root.outerHTML.includes("Infinity"));
    },
  );
test("Precision is opt-in and format receives normalized current and success percentages", async () => {
  const a = await mount({ value: 42.12345 });
  assert.equal(a.root.textContent, "42.12345%");
  a.props.precision = 2;
  await nextTick();
  assert.equal(a.root.textContent, "42.12%");
  a.props.success = { value: 14.25 };
  a.props.format = (value, success) => `${success} / ${value}`;
  await nextTick();
  assert.equal(a.root.textContent, "14.25 / 42.12345");
});
test("A formatter can return a VNode without rendering object text", async () => {
  const a = await mount({
    value: 33,
    format: (value) => h("em", value + " tasks"),
  });
  assert.equal(a.find("em").textContent, "33 tasks");
  assert(!a.root.textContent.includes("[object Object]"));
  assert.equal(a.root.getAttribute("aria-valuetext"), "33%");
});
test("Status icons are optional and never remove the legacy percentage label", async () => {
  for (const status of ["success", "warning", "error"]) {
    const a = await mount({ value: 100, status });
    assert.equal(a.root.textContent, "100%");
    assert.equal(a.all("svg").length, 0);
    a.props.showStatusIcon = true;
    await nextTick();
    assert.equal(a.root.textContent, "100%");
    assert.equal(
      a.find(".hys-ui-progress-label svg").getAttribute("aria-hidden"),
      "true",
    );
  }
  const normal = await mount({ value: 100, showStatusIcon: true });
  assert.equal(normal.all("svg").length, 0);
});
test("Hidden labels do not instantiate slots but retain accessible value text", async () => {
  let calls = 0;
  const a = await mount(
    { showLabel: false, ariaLabel: "Upload completion" },
    {
      default: () => {
        calls++;
        return "Label";
      },
    },
  );
  assert.equal(calls, 0);
  assert.equal(a.root.textContent, "");
  assert.equal(a.root.getAttribute("aria-label"), "Upload completion");
  assert.equal(a.root.getAttribute("aria-valuetext"), "42%");
});
test("The extended slot context preserves value and exposes status and success", async () => {
  let context;
  await mount(
    {
      value: 120,
      success: { value: 30 },
      status: "warning",
      indeterminate: true,
    },
    {
      default: (info) => {
        context = info;
        return h("span", "Custom");
      },
    },
  );
  assert.deepEqual(
    { ...context },
    { value: 100, successValue: 30, status: "warning", indeterminate: true },
  );
});
test("Text inside remains visible at zero and uses a sufficient default track height", async () => {
  const a = await mount({ value: 0, textInside: true });
  assert.equal(a.find(".hys-ui-progress-inside-label").textContent, "0%");
  assert(parseInt(a.find(".hys-ui-progress-track").style.height) >= 20);
  a.props.value = 100;
  await nextTick();
  assert.equal(a.find(".hys-ui-progress-fill").style.width, "100%");
  assert.equal(a.all(".hys-ui-progress-label").length, 1);
});

test("Thin explicit tracks keep labels outside rather than clipping the content", async () => {
  const a = await mount({ textInside: true, strokeWidth: 3 });
  assert.equal(a.find(".hys-ui-progress-inside-label"), null);
  assert.equal(a.find(".hys-ui-progress-label").textContent, "42%");
});

test("An icon slot can represent a normal ongoing state", async () => {
  const a = await mount(
    { showStatusIcon: true },
    { icon: () => h("span", { "data-custom-icon": "" }, "Working") },
  );
  assert.equal(a.find("[data-custom-icon]").textContent, "Working");
});
test("Preset sizes and explicit dimensions have predictable precedence", async () => {
  const a = await mount({ type: "circle", size: "sm" });
  assert.equal(a.root.style.width, "80px");
  a.props.size = "lg";
  await nextTick();
  assert.equal(a.root.style.width, "132px");
  a.props.width = 150;
  a.props.strokeWidth = 20;
  await nextTick();
  assert.equal(a.root.style.width, "150px");
  assert.equal(
    a.find(".hys-ui-progress-ring-trail").getAttribute("stroke-width"),
    "20",
  );
  a.props.width = "40%";
  await nextTick();
  assert.equal(a.root.style.width, "40%");
});
test("Out-of-bounds dimensions and duration never emit invalid CSS or path data", async () => {
  const a = await mount({
    type: "dashboard",
    width: NaN,
    strokeWidth: Infinity,
    stepGap: Infinity,
    steps: NaN,
    gapDegree: Infinity,
    duration: NaN,
    flowDuration: NaN,
  });
  assert.equal(a.root.style.width, "100px");
  assert(!/NaN|Infinity/.test(a.root.outerHTML));
  a.props.strokeWidth = 300;
  a.props.gapDegree = 500;
  await nextTick();
  assert.equal(
    a.find(".hys-ui-progress-ring-trail").getAttribute("stroke-width"),
    "48",
  );
  assert(!/NaN|Infinity/.test(a.find("path").getAttribute("d")));
});
test("A full circle closes with two arcs and keeps the original radius", async () => {
  const a = await mount({ type: "circle", value: 50 });
  const d = a.find(".hys-ui-progress-ring-trail").getAttribute("d");
  assert.equal((d.match(/ A /g) || []).length, 2);
  assert(d.startsWith("M 50 6 "));
  assert.equal(
    a.find(".hys-ui-progress-ring-fill").getAttribute("stroke-dasharray"),
    "50 100",
  );
});
test("Dashboard gap positions rotate the arc origin into the correct quadrant", async () => {
  const a = await mount({ type: "dashboard", gapDegree: 90 });
  for (const [position, quadrant] of [
    ["bottom", [-1, 1]],
    ["top", [1, -1]],
    ["left", [-1, -1]],
    ["right", [1, 1]],
  ]) {
    a.props.gapPosition = position;
    await nextTick();
    const [, x, y] = a
      .find(".hys-ui-progress-ring-trail")
      .getAttribute("d")
      .match(/^M ([\d.-]+) ([\d.-]+)/);
    assert.equal(Math.sign(+x - 50), quadrant[0]);
    assert.equal(Math.sign(+y - 50), quadrant[1]);
  }
  a.props.gapDegree = 0;
  await nextTick();
  assert.equal(
    (a.find("path").getAttribute("d").match(/ A /g) || []).length,
    2,
  );
});
test("A success portion is clamped to current progress and overlays both shapes", async () => {
  for (const type of ["line", "circle", "dashboard"]) {
    const a = await mount({ value: 60, success: { value: 90 }, type });
    assert.equal(a.vm.successValue, 60);
    assert.equal(
      type === "line"
        ? a.find(".hys-ui-progress-success").style.width
        : a
            .find(".hys-ui-progress-ring-success")
            .getAttribute("stroke-dasharray"),
      type === "line" ? "60%" : "60 100",
    );
    a.props.value = 10;
    await nextTick();
    assert.equal(a.vm.successValue, 10);
  }
});
test("Color factories see normalized values and failed factories use the status color", async () => {
  let seen;
  const a = await mount({
    value: 120,
    color: (value) => {
      seen = value;
      return "#123456";
    },
  });
  assert.equal(seen, 100);
  assert.equal(
    a.find(".hys-ui-progress-fill").style.background,
    "rgb(18, 52, 86)",
  );
  a.props.color = () => {
    throw Error("broken");
  };
  await nextTick();
  assert(
    a
      .find(".hys-ui-progress-fill")
      .style.background.includes("--hys-ui-primary"),
  );
});
test("Threshold colors sort a copy, honor exact boundaries and leave source records untouched", async () => {
  const colors = Object.freeze([
    Object.freeze({ value: 100, color: "green" }),
    Object.freeze({ value: 30, color: "red" }),
    Object.freeze({ value: 60, color: "orange" }),
  ]);
  const a = await mount({ value: 30, color: colors });
  assert.equal(a.find(".hys-ui-progress-fill").style.background, "red");
  a.props.value = 31;
  await nextTick();
  assert.equal(a.find(".hys-ui-progress-fill").style.background, "orange");
  a.props.value = 100;
  await nextTick();
  assert.equal(a.find(".hys-ui-progress-fill").style.background, "green");
  assert.deepEqual(
    colors.map((x) => x.value),
    [100, 30, 60],
  );
});
test("Gradient paints are represented by CSS for lines and SVG definitions for rings", async () => {
  const gradient = {
    from: "#123456",
    to: "#abcdef",
    direction: "to right",
    stops: [{ offset: 50, color: "red" }],
  };
  const a = await mount({ color: gradient });
  assert(
    a
      .find(".hys-ui-progress-fill")
      .style.background.includes("linear-gradient(90deg"),
  );
  assert.equal(a.all("defs").length, 0);
  a.props.type = "circle";
  await nextTick();
  assert.equal(a.all("linearGradient").length, 1);
  const stops = a.all("stop");
  assert.deepEqual(
    stops.map((stop) => stop.getAttribute("offset")),
    ["0%", "50%", "100%"],
  );
  const definition = a.find("linearGradient");
  assert.equal(+definition.getAttribute("x1"), 0);
  assert.equal(+definition.getAttribute("x2"), 100);
  assert.equal(
    a.find(".hys-ui-progress-ring-fill").getAttribute("stroke"),
    "url(#" + definition.id + ")",
  );
});
test("Independent apps and progress changes do not collide or regenerate gradient ids", async () => {
  const color = { from: "red", to: "blue" },
    a = await mount({ type: "circle", color, success: { value: 20, color } }),
    b = await mount({ type: "dashboard", color });
  const ids = [...a.all("linearGradient"), ...b.all("linearGradient")].map(
    (el) => el.id,
  );
  assert.equal(new Set(ids).size, 3);
  a.props.value = 70;
  await nextTick();
  assert.deepEqual(
    a.all("linearGradient").map((el) => el.id),
    ids.slice(0, 2),
  );
  assert.equal(
    a.find(".hys-ui-progress-ring-success").getAttribute("stroke"),
    "url(#" + ids[1] + ")",
  );
});
test("Gradients normalize stops and invalid directions without mutating input", async () => {
  const color = {
    from: "red",
    to: "blue",
    direction: Infinity,
    stops: [
      { offset: 110, color: "green" },
      { offset: -2, color: "black" },
      { offset: NaN, color: "yellow" },
    ],
  };
  const a = await mount({ type: "circle", color });
  assert.deepEqual(
    a.all("stop").map((el) => el.getAttribute("offset")),
    ["0%", "0%", "100%", "100%"],
  );
  assert.equal(color.stops[0].offset, 110);
  assert.equal(a.find("linearGradient").getAttribute("x2"), "100");
});
test("Line steps preserve fractional progress and partial success", async () => {
  const a = await mount({ value: 45, steps: 10, success: { value: 15 } });
  const widths = a.all(".hys-ui-progress-fill").map((el) => el.style.width);
  assert.equal(widths.filter((x) => x === "100%").length, 4);
  assert.equal(widths[4], "50%");
  assert.equal(widths[5], "0%");
  assert.deepEqual(
    a
      .all(".hys-ui-progress-success")
      .slice(0, 3)
      .map((el) => el.style.width),
    ["100%", "50%", "0%"],
  );
});
test("Step palette arrays apply individual colors and form gradients in continuous mode", async () => {
  const a = await mount({ value: 100, steps: 4, color: ["red", "blue"] });
  assert.deepEqual(
    a.all(".hys-ui-progress-fill").map((el) => el.style.background),
    ["red", "blue", "red", "blue"],
  );
  a.props.steps = 0;
  await nextTick();
  assert(
    a
      .find(".hys-ui-progress-fill")
      .style.background.includes("linear-gradient"),
  );
});
test("Ring steps use bounded paths and preserve fractional fills", async () => {
  const a = await mount({
    value: 45,
    success: { value: 15 },
    steps: 10,
    type: "dashboard",
  });
  assert.equal(a.all(".hys-ui-progress-ring-steps>g").length, 10);
  assert.equal(a.all(".hys-ui-progress-ring-fill").length, 5);
  assert.equal(
    a.all(".hys-ui-progress-ring-fill").at(-1).getAttribute("stroke-dasharray"),
    "50 100",
  );
  assert.equal(a.all(".hys-ui-progress-ring-success").length, 2);
  a.props.steps = 1e8;
  await nextTick();
  assert.equal(a.all(".hys-ui-progress-ring-steps>g").length, 200);
  assert(a.all("path").length <= 600);
  assert(a.all("path").every((el) => !el.getAttribute("d").includes("NaN")));
});
for (const type of ["line", "circle", "dashboard"])
  test(
    "Indeterminate " +
      type +
      " omits determinate semantics and uses one continuous track",
    async () => {
      const a = await mount({
        value: 70,
        steps: 100,
        indeterminate: true,
        type,
        format: () => "Working",
      });
      assert.equal(a.root.getAttribute("aria-valuenow"), null);
      assert.equal(a.root.getAttribute("aria-valuetext"), "处理中");
      assert.equal(a.root.textContent, "Working");
      assert.equal(a.all(".hys-ui-progress-step").length, 0);
      assert.equal(a.all(".hys-ui-progress-ring-steps").length, 0);
      assert(
        a.find(
          type === "line"
            ? ".hys-ui-progress-indeterminate"
            : ".hys-ui-progress-ring-indeterminate",
        ),
      );
    },
  );
test("Caller-provided accessible text, descriptions and ids are preserved", async () => {
  const a = await mount({
    value: 35,
    ariaLabel: "Task progress",
    ariaValueText: (context) => `${context.value} of 100 tasks`,
    id: "tasks",
    "aria-describedby": "help",
  });
  assert.equal(a.root.getAttribute("id"), "tasks");
  assert.equal(a.root.getAttribute("aria-describedby"), "help");
  assert.equal(a.root.getAttribute("aria-label"), "Task progress");
  assert.equal(a.root.getAttribute("aria-valuetext"), "35 of 100 tasks");
});
test("Linecap and trail color are applied consistently", async () => {
  const a = await mount({
    strokeLinecap: "butt",
    trailColor: "pink",
    type: "dashboard",
  });
  assert(
    a.all("path").every((el) => el.getAttribute("stroke-linecap") === "butt"),
  );
  assert.equal(
    a.find(".hys-ui-progress-ring-trail").getAttribute("stroke"),
    "pink",
  );
  a.props.type = "line";
  await nextTick();
  assert.equal(
    a.root.style.getPropertyValue("--hys-ui-progress-radius"),
    "0px",
  );
  assert.equal(a.find(".hys-ui-progress-track").style.background, "pink");
});
test("Global off, local animated false and zero flow duration disable repeating motion", async () => {
  const motion = ref("off"),
    a = await mount({ value: 60, indeterminate: true }, {}, { motion });
  assert(!a.root.classList.contains("hys-ui-progress-flow"));
  assert.equal(
    a.root.style.getPropertyValue("--hys-ui-progress-duration"),
    "0ms",
  );
  motion.value = "full";
  await nextTick();
  assert(a.root.classList.contains("hys-ui-progress-flow"));
  a.props.animated = false;
  await nextTick();
  assert(!a.root.classList.contains("hys-ui-progress-flow"));
  a.props.animated = true;
  a.props.flowDuration = 0;
  await nextTick();
  assert(!a.root.classList.contains("hys-ui-progress-flow"));
});
test("Theme updates remain local and do not alter the progress value", async () => {
  const theme = ref("green"),
    a = await mount({ value: 61 }, {}, { theme });
  assert.equal(a.root.dataset.hysTheme, "green");
  theme.value = "dark";
  await nextTick();
  assert.equal(a.root.dataset.hysTheme, "dark");
  assert.equal(a.root.getAttribute("aria-valuenow"), "61");
  assert.equal(document.documentElement.dataset.hysTheme, undefined);
});
test("Cached progress turns off animations on departure and restores them on return without timers", async () => {
  const shown = ref(true),
    host = document.createElement("div");
  document.body.append(host);
  const cached = defineComponent({
      setup: () => () => h(ui.HysProgress, { value: 35, indeterminate: true }),
    }),
    app = createApp({
      setup: () => () =>
        h(KeepAlive, () => (shown.value ? h(cached) : h("p", "Other"))),
    });
  app.mount(host);
  apps.push({ app, host });
  await nextTick();
  const root = host.querySelector("[role=progressbar]");
  assert(root.classList.contains("hys-ui-progress-flow"));
  shown.value = false;
  await nextTick();
  assert(!root.classList.contains("hys-ui-progress-flow"));
  shown.value = true;
  await nextTick();
  assert.equal(host.querySelector("[role=progressbar]"), root);
  assert(root.classList.contains("hys-ui-progress-flow"));
});
