import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", {
  pretendToBeVisual: true,
});
for (const name of [
  "window",
  "document",
  "Element",
  "HTMLElement",
  "SVGElement",
  "Node",
  "Event",
]) {
  globalThis[name] = dom.window[name];
}
const requests = new Map();
let frameId = 0,
  now = 0,
  reduced = false;
globalThis.requestAnimationFrame = (callback) => {
  requests.set(++frameId, callback);
  return frameId;
};
globalThis.cancelAnimationFrame = (id) => requests.delete(id);
window.matchMedia = () => ({
  matches: reduced,
  addEventListener() {},
  removeEventListener() {},
});
const { createApp, createSSRApp, h, nextTick, reactive, ref } =
  await import("vue");
const { renderToString } = await import("vue/server-renderer");
const { HysAnimatedNumber, useHysAnimatedNumber, useHysNumberAnimationGroup } =
  await import("../packages/ui/dist/index.js");

const cleanup = [];
afterEach(() => {
  for (const unmount of cleanup.splice(0)) unmount();
  assert.equal(requests.size, 0);
  reduced = false;
  delete globalThis.IntersectionObserver;
  delete document.hidden;
  document.body.replaceChildren();
});

async function tick(ms = 0) {
  now += ms;
  const callbacks = [...requests.values()];
  requests.clear();
  callbacks.forEach((callback) => callback(now));
  await nextTick();
}

async function mount(values, acceptModel = true) {
  const props = reactive(values),
    vm = ref(),
    events = {};
  const host = document.body.appendChild(document.createElement("div"));
  const listeners = Object.fromEntries(
    HysAnimatedNumber.emits.map((event) => [
      "on" + event[0].toUpperCase() + event.slice(1),
      (...args) => {
        (events[event] ??= []).push(args[0]);
        if (event === "update:modelValue" && acceptModel)
          props.modelValue = args[0];
      },
    ]),
  );
  const app = createApp({
    render: () => h(HysAnimatedNumber, { ...props, ...listeners, ref: vm }),
  });
  app.mount(host);
  cleanup.push(() => app.unmount());
  await nextTick();
  return { host, props, events, api: vm.value };
}

test("decimal strings animate beyond Number precision and settle on the exact target", async () => {
  const from = "9007199254740993.000000000001",
    value = "9007199254740993.000000000009";
  const { api, events } = await mount({
    from,
    value,
    precision: 12,
    duration: 100,
    easing: "linear",
  });
  assert.equal(api.displayValue, from);
  await tick();
  await tick(50);
  assert.equal(api.displayValue, "9007199254740993.000000000005");
  api.pause();
  await tick(200);
  assert.equal(api.frame.progress, 0.5);
  api.resume();
  await tick();
  await tick(50);
  assert.equal(api.frame.value, value);
  assert.equal(api.displayValue, value);
  assert.equal(events.end.length, 1);
  assert.equal(events.end[0].status, "finished");
});

test("custom interpolation can replace intermediate values and falls back on failure", async () => {
  const { api } = await mount({
    from: 0,
    value: 100,
    duration: 100,
    easing: "linear",
    interpolate: ({ progress }) => {
      if (progress > 0.5) throw Error("Invalid custom frame");
      return 35;
    },
  });
  assert.equal(api.frame.value, 0);
  api.seek(0.5);
  assert.equal(api.frame.value, 35);
  api.seek(0.75);
  assert.equal(api.frame.value, 75);
  api.finishAnimation();
  assert.equal(api.frame.value, 100);
});

test("threshold effects compose enter and exit layers without exposing the outgoing number", async () => {
  const { api, host } = await mount({
    from: 10,
    value: 100,
    duration: 100,
    easing: "linear",
    changeThreshold: 60,
    thresholdEffect: ["fade", "slide"],
    axis: "horizontal",
  });
  api.seek(0.5);
  await nextTick();
  const outgoing = host.querySelector(".hys-ui-motion-number-outgoing");
  assert.equal(outgoing.textContent, "10");
  assert.equal(outgoing.getAttribute("aria-hidden"), "true");
  assert.equal(outgoing.style.opacity, "0.5");
  assert.equal(outgoing.style.transform, "translateX(-50%)");
  assert.equal(api.displayValue, "55");
  api.finishAnimation();
  await nextTick();
  assert.equal(host.querySelector(".hys-ui-motion-number-outgoing"), null);
  assert.equal(host.textContent, "100");
});

test("digit appearance preserves absent places and deterministic scramble settles at the exact target", async () => {
  const { api, host, props } = await mount({
    from: 9,
    value: 12,
    duration: 100,
    effect: "appear",
  });
  assert.equal(host.querySelector(".hys-number-face-first").textContent, "");
  api.seek(0.4);
  props.effect = "scramble";
  await nextTick();
  const first = host.querySelector(".hys-number-digits").textContent;
  api.seek(0.6);
  await nextTick();
  api.seek(0.4);
  await nextTick();
  assert.equal(host.querySelector(".hys-number-digits").textContent, first);
  api.finishAnimation();
  await nextTick();
  assert.equal(
    host.querySelector(".hys-number-digits").getAttribute("aria-label"),
    "12",
  );
  assert.equal(host.textContent, "12");
});

test("a finished digit stays at its destination while the overall timeline continues", async () => {
  const { api, host } = await mount({
    from: 10,
    value: 90,
    effect: "slot",
    duration: 100,
    digitDuration: 30,
    easing: "linear",
  });
  api.seek(0.5);
  await nextTick();
  assert.equal(api.displayValue, "50");
  assert.equal(host.textContent, "90");
  api.seek(0.75);
  await nextTick();
  assert.equal(host.textContent, "90");
});

test("seeking, reversing twice and retargeting preserve the current frame", async () => {
  const { api, props } = await mount({
    from: -100,
    value: 100,
    duration: 100,
    easing: "linear",
  });
  api.seek(0.75);
  assert.equal(api.frame.value, 50);
  api.reverse();
  assert.equal(api.frame.value, 50);
  assert.equal(api.frame.to, -100);
  await tick();
  await tick(50);
  assert.equal(api.frame.value, -25);
  api.reverse();
  assert.equal(api.frame.value, -25);
  assert.equal(api.frame.to, 100);
  props.value = 200;
  await nextTick();
  assert.equal(api.frame.from, -25);
  api.finishAnimation();
  assert.equal(api.frame.value, 200);
});

test("bounded queue, alternate loops and v-model stay independent of display frames", async () => {
  const { api, events } = await mount({
    from: 0,
    modelValue: 10,
    duration: 100,
    interrupt: "queue",
    queueLimit: 2,
    loop: 2,
    alternate: true,
  });
  for (const value of [20, 30, 40]) {
    api.setValue(value);
    await nextTick();
  }
  assert.equal(api.frame.to, 10);
  await tick();
  await tick(100);
  assert.equal(events.loop[0].iteration, 2);
  assert.equal(api.frame.to, 0);
  await tick(100);
  assert.equal(events.end[0].value, 0);
  assert.equal(api.frame.to, 30);
  api.finishAnimation();
  assert.equal(api.frame.to, 40);
  api.finishAnimation();
  assert.equal(api.frame.value, 40);
  assert.deepEqual(events["update:modelValue"], [20, 30, 40]);
});

test("formatting keeps exact rounding, locale grouping, percentages and scientific exponents", async () => {
  const { api, props } = await mount({
    value: "9007199254740993.105",
    locale: "de-DE",
    precision: 2,
    rounding: "half-even",
    numberFormat: "currency",
    currency: "EUR",
    disabled: true,
  });
  assert.equal(api.displayValue, "9.007.199.254.740.993,10\u00a0€");
  Object.assign(props, {
    value: "-0.42505",
    numberFormat: "percent",
    precision: 2,
    rounding: "floor",
  });
  await nextTick();
  assert.equal(api.displayValue, "-42,51\u00a0%");
  Object.assign(props, {
    value: "9.999e-99",
    numberFormat: "scientific",
    rounding: "half-up",
    trimZeros: true,
  });
  await nextTick();
  assert.equal(api.displayValue, "1e-98");
  Object.assign(props, {
    value: "1200000",
    numberFormat: "decimal",
    compact: "short",
    unit: " 件",
  });
  await nextTick();
  assert.equal(api.displayValue, "1,2M 件");
});

test("visibility and document hiding freeze active time without altering manual pause", async () => {
  let intersection;
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      intersection = callback;
    }
    observe() {}
    disconnect() {}
  };
  const { api, events } = await mount({
    from: 0,
    value: 100,
    trigger: "visible",
    pauseOutside: true,
    duration: 100,
    easing: "linear",
  });
  assert.equal(requests.size, 0);
  intersection([{ isIntersecting: true, intersectionRatio: 1 }]);
  await tick();
  await tick(25);
  intersection([{ isIntersecting: false, intersectionRatio: 0 }]);
  await tick(200);
  assert.equal(api.frame.value, 25);
  intersection([{ isIntersecting: true, intersectionRatio: 1 }]);
  await tick();
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  await tick(200);
  assert.equal(api.frame.value, 25);
  delete document.hidden;
  document.dispatchEvent(new Event("visibilitychange"));
  await tick();
  await tick(75);
  assert.equal(api.frame.value, 100);
  assert.equal(events.start.length, 1);
});

test("reduced motion preserves completion and uncontrolled setValue updates the target", async () => {
  reduced = true;
  const { api, events } = await mount(
    { from: -30, duration: 100, effect: "flip" },
    false,
  );
  assert.equal(api.frame.value, 0);
  api.setValue(50);
  await nextTick();
  assert.equal(api.frame.value, 50);
  assert.equal(requests.size, 0);
  assert.deepEqual(
    events.end.map(({ value }) => value),
    [0, 50],
  );
});

test("the composable shares one request across instances and releases it when stopped", async () => {
  let first, second;
  const app = createApp({
    setup() {
      first = useHysAnimatedNumber({
        from: 0,
        value: 10,
        duration: 100,
        easing: "linear",
      });
      second = useHysAnimatedNumber({
        from: 0,
        value: 20,
        duration: 100,
        easing: "linear",
      });
      return () => null;
    },
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  cleanup.push(() => app.unmount());
  assert.equal(requests.size, 1);
  await tick();
  await tick(50);
  assert.equal(first.frame.value.value, 5);
  assert.equal(second.frame.value.value, 10);
  first.stop();
  assert.equal(requests.size, 1);
  second.stop();
  assert.equal(requests.size, 0);
});

test("group controls synchronize many independent animations without per-instance frame requests", async () => {
  const members = [];
  const app = createApp({
    setup() {
      for (let index = 1; index <= 64; index++) {
        members.push(
          useHysAnimatedNumber({
            from: 0,
            value: index * 4,
            duration: 100,
            easing: "linear",
          }),
        );
      }
      return () => null;
    },
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  cleanup.push(() => app.unmount());
  const group = useHysNumberAnimationGroup(() => [
    null,
    ...members,
    members[0],
  ]);
  await tick();
  await tick(25);
  group.pause();
  assert.equal(requests.size, 0);
  assert(members.every((item, index) => item.frame.value.value === index + 1));
  group.seek(0.5);
  assert(
    members.every((item, index) => item.frame.value.value === (index + 1) * 2),
  );
  group.resume();
  assert.equal(requests.size, 1);
  await tick();
  await tick(50);
  assert(
    members.every((item, index) => item.frame.value.value === (index + 1) * 4),
  );
  assert.equal(requests.size, 0);
});

test("countdown hydrates an identical initial view before syncing to the wall clock", async () => {
  const deadline = Date.now() + 10000;
  const view = () =>
    h(HysAnimatedNumber, { deadline, format: "mm:ss", effect: "flip" });
  const server = await renderToString(createSSRApp({ render: view }));
  const host = document.body.appendChild(document.createElement("div"));
  host.innerHTML = server;
  assert.equal(host.textContent, "00:00");
  const app = createSSRApp({ render: view });
  const warnings = [];
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount(host);
  cleanup.push(() => app.unmount());
  await nextTick();
  assert.match(host.textContent, /^00:(?:0[1-9]|10)$/);
  assert.deepEqual(warnings, []);
});

test("hidden countdowns reconcile the real deadline once on visibility return", async (t) => {
  let clock = 1000;
  t.mock.method(Date, "now", () => clock);
  const { api, events } = await mount({ deadline: 4000 });
  assert.equal(api.remaining, 3000);
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  clock = 4500;
  assert.equal(api.remaining, 3000);
  assert.equal(events.finish, undefined);
  delete document.hidden;
  document.dispatchEvent(new Event("visibilitychange"));
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(api.remaining, 0);
  assert.equal(events.finish.length, 1);
});
