import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
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
  "ShadowRoot",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: [
      "getComputedStyle",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ].includes(name)
      ? dom.window[name].bind(dom.window)
      : dom.window[name],
  });
}
const { nextTick } = await import("vue");
const { createHysToast, configureHysToast, hysToast } =
  await import("../packages/ui/dist/index.js");
const services = [];
const make = (config) => {
  const service = createHysToast({ duration: 0, motion: "off", ...config });
  services.push(service);
  return service;
};
const panel = (id) => document.querySelector(`[data-toast-id="${id}"]`);
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};
afterEach(() => {
  for (const service of services.splice(0)) service.dispose();
  hysToast.dispose();
  document.body.replaceChildren();
});

test("The queue promotes the highest priority and applies LIFO to ties after leave", async () => {
  const service = make({ maxCount: 1, overflow: "queue", queueOrder: "lifo" });
  const first = service.info({ id: "first", message: "First" });
  const low = service.info({ id: "low", message: "Low" });
  const highA = service.warning({
    id: "high-a",
    message: "High A",
    priority: 10,
  });
  const highB = service.warning({
    id: "high-b",
    message: "High B",
    priority: 10,
  });
  await nextTick();
  assert(panel(first.id));
  assert(!panel(highB.id));
  assert.equal(service.find(highB.id).status, "queued");
  first.close();
  assert.equal(service.find(highB.id).status, "queued");
  await first.closed;
  await nextTick();
  assert(panel(highB.id));
  assert(!panel(highA.id));
  highB.close();
  await highB.closed;
  await nextTick();
  assert(panel(highA.id));
  service.clearQueue();
  await low.closed;
  assert.equal(service.find(low.id), undefined);
});

test("Groups have independent capacity and deduplicate with explicit keys", async () => {
  const service = make({ maxCount: 1, overflow: "queue", queueScope: "group" });
  const a = service.info({
    id: "a",
    message: "A",
    group: "alpha",
    dedupeKey: "status",
    dedupe: "merge",
  });
  assert.equal(
    service.info({
      message: "Updated A",
      group: "alpha",
      dedupeKey: "status",
      dedupe: "merge",
    }),
    a,
  );
  const b = service.success({ id: "b", message: "B", group: "beta" });
  await nextTick();
  assert.equal(service.find(a.id).repeat, 2);
  assert.equal(service.find(a.id).message, "Updated A");
  assert(panel(a.id));
  assert(panel(b.id));
  service.closeType("success");
  await b.closed;
  assert(panel(a.id));
});

test("A reused task ID ignores stale outcomes and preserves business results and errors", async () => {
  const service = make();
  const slow = deferred();
  const stale = service.promise(slow.promise, {
    id: "job",
    success: "Stale result",
  });
  const latest = service.promise(
    async ({ progress }) => {
      progress(65);
      await nextTick();
      assert.equal(
        panel("job")
          .querySelector('[role="progressbar"]')
          .getAttribute("aria-valuenow"),
        "65",
      );
      return 42;
    },
    {
      id: "job",
      success: (value) => ({ message: "Total " + value, duration: 0 }),
    },
  );
  assert.equal(stale.handle, latest.handle);
  assert.equal(await latest.promise, 42);
  slow.resolve(7);
  assert.equal(await stale.promise, 7);
  await nextTick();
  assert.equal(service.find("job").message, "Total 42");
  assert.equal(service.find("job").type, "success");
  assert(!panel("job").querySelector('[role="progressbar"]'));
  const error = new Error("offline");
  const failed = service.promise(
    () => {
      throw error;
    },
    { id: "job", error: (value) => ({ message: value.message, duration: 0 }) },
  );
  await assert.rejects(failed.promise, error);
  assert.equal(service.find("job").type, "error");
  assert.equal(service.find("job").message, "offline");
});

test("Asynchronous actions expose busy state and can retry after an error", async () => {
  const service = make(),
    events = [],
    attempt = deferred();
  let runs = 0;
  const handle = service.info({
    id: "action",
    message: "Save",
    actions: [
      {
        id: "save",
        label: "Save",
        run: () =>
          ++runs === 1
            ? attempt.promise.then(() => {
                throw Error("offline");
              })
            : "saved",
        error: () => ({ message: "Retry available" }),
      },
    ],
    onAction: (event) => events.push(event.status),
    onClose: (event) => events.push(event.reason),
  });
  await nextTick();
  const button = panel("action").querySelector(".hys-ui-toast-text-action");
  button.click();
  await nextTick();
  assert.equal(button.getAttribute("aria-busy"), "true");
  attempt.resolve();
  await settle();
  assert.equal(service.find("action").type, "error");
  assert.equal(service.find("action").message, "Retry available");
  button.click();
  await handle.closed;
  assert.deepEqual(events, ["start", "error", "start", "success", "action"]);
});

test("A close guard vetoes dismissal and accepts a subsequent request", async () => {
  const service = make();
  let canClose = false;
  const reasons = [];
  const handle = service.info({
    id: "guard",
    message: "Confirm",
    closeOnClick: true,
    beforeClose: async ({ reason }) => {
      reasons.push(reason);
      return canClose;
    },
  });
  await nextTick();
  panel("guard").querySelector(".hys-ui-toast-message").click();
  await settle();
  assert.equal(service.find("guard").status, "visible");
  canClose = true;
  handle.close();
  await handle.closed;
  assert.deepEqual(reasons, ["click", "api"]);
});

test("Window blur pauses and position changes preserve the remaining timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const service = make({ duration: 1000 });
  let shows = 0,
    closeReason;
  const handle = service.info({
    id: "move",
    message: "Moving",
    onShow: () => shows++,
    onClose: (context) => {
      closeReason = context.reason;
    },
  });
  await settle();
  t.mock.timers.tick(300);
  window.dispatchEvent(new Event("blur"));
  t.mock.timers.tick(5000);
  assert.equal(service.find("move").status, "visible");
  handle.update({ position: "bottom-right" });
  await settle();
  assert.equal(shows, 1);
  handle.extend(100);
  window.dispatchEvent(new Event("focus"));
  t.mock.timers.tick(799);
  assert.equal(service.find("move").status, "visible");
  t.mock.timers.tick(1);
  assert.equal(closeReason, "timeout");
  await handle.closed;
});

test("Global configuration and separate services have independent containers", async () => {
  const target = document.createElement("section");
  document.body.append(target);
  const isolated = make({ appendTo: target, theme: "purple" });
  configureHysToast({ duration: 0, theme: "green" });
  const scoped = isolated.info({ id: "same", message: "Isolated" });
  hysToast.info({ id: "same", message: "Global" });
  await nextTick();
  assert.equal(
    target.querySelector(".hys-ui-toast").dataset.hysTheme,
    "purple",
  );
  assert.equal(
    document.body
      .querySelector('[data-hys-theme="green"] .hys-ui-toast')
      .textContent.includes("Global"),
    true,
  );
  configureHysToast({ theme: "dark" });
  await nextTick();
  assert(document.body.querySelector('[data-hys-theme="dark"] .hys-ui-toast'));
  hysToast.dispose();
  assert.equal(isolated.find(scoped.id).status, "visible");
});
test("Layered stacks render depth, hide rear controls, and expand from the toggle", async () => {
  const service = make({
    layout: "layered",
    layerCount: 3,
    layerTrigger: "click",
  });
  service.info({ id: "front", message: "Front" });
  service.info({ id: "middle", message: "Middle" });
  service.info({ id: "back", message: "Back" });
  await nextTick();
  assert.equal(
    document.querySelectorAll(".hys-ui-toast-layer-preview").length,
    2,
  );
  assert.equal(
    panel("middle").parentElement.getAttribute("aria-hidden"),
    "true",
  );
  assert(!panel("middle").querySelector(".hys-ui-toast-dismiss"));
  const toggle = document.querySelector(".hys-ui-toast-stack-toggle");
  toggle.click();
  await nextTick();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert(!panel("middle").parentElement.hasAttribute("aria-hidden"));
  assert(panel("middle").querySelector(".hys-ui-toast-dismiss"));
  assert.equal(
    document.querySelectorAll(".hys-ui-toast-layer-preview").length,
    0,
  );
  toggle.click();
  await nextTick();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(panel("back").parentElement.getAttribute("aria-hidden"), "true");
});
