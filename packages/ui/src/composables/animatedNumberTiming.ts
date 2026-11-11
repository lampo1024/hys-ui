import type { HysNumberEasing, HysNumberValue } from "./animatedNumber";
import type { numberInterpolation } from "./animatedNumberFormat";

type Tick = (now: number) => void;
const subscribers = new Set<Tick>();
let frameId: number | undefined;

function requestTick() {
  if (frameId === undefined && subscribers.size)
    frameId = requestAnimationFrame(runFrame);
}

function runFrame(now: number) {
  frameId = undefined;
  for (const tick of [...subscribers]) {
    if (subscribers.has(tick)) tick(now);
  }
  requestTick();
}

export function unsubscribe(tick: Tick) {
  subscribers.delete(tick);
  if (!subscribers.size && frameId !== undefined) {
    cancelAnimationFrame(frameId);
    frameId = undefined;
  }
}

export function subscribe(tick: Tick) {
  subscribers.add(tick);
  requestTick();
}

const visibilityListeners = new Set<() => void>();
function visibilityChanged() {
  for (const update of visibilityListeners) update();
}

export function listenVisibility(update: () => void) {
  if (!visibilityListeners.size)
    document.addEventListener("visibilitychange", visibilityChanged);
  visibilityListeners.add(update);
}

export function unlistenVisibility(update: () => void) {
  visibilityListeners.delete(update);
  if (!visibilityListeners.size)
    document.removeEventListener("visibilitychange", visibilityChanged);
}

function cubicBezier([x1, y1, x2, y2]: readonly [
  number,
  number,
  number,
  number,
]) {
  const coordinate = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  if (
    ![x1, y1, x2, y2].every(Number.isFinite) ||
    x1 < 0 ||
    x1 > 1 ||
    x2 < 0 ||
    x2 > 1
  )
    return (p: number) => p;
  return (progress: number) => {
    let low = 0,
      high = 1;
    for (let i = 0; i < 20; i++) {
      const middle = (low + high) / 2;
      if (coordinate(middle, x1, x2) < progress) low = middle;
      else high = middle;
    }
    return coordinate((low + high) / 2, y1, y2);
  };
}

function bounce(progress: number): number {
  if (progress < 1 / 2.75) return 7.5625 * progress ** 2;
  if (progress < 2 / 2.75) return 7.5625 * (progress - 1.5 / 2.75) ** 2 + 0.75;
  if (progress < 2.5 / 2.75)
    return 7.5625 * (progress - 2.25 / 2.75) ** 2 + 0.9375;
  return 7.5625 * (progress - 2.625 / 2.75) ** 2 + 0.984375;
}

export function makeEasing(easing: HysNumberEasing = "ease-out") {
  if (typeof easing === "function") return easing;
  if (typeof easing !== "string") return cubicBezier(easing);
  switch (easing) {
    case "linear":
      return (p: number) => p;
    case "ease-in":
      return (p: number) => p ** 3;
    case "ease-in-out":
      return (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
    case "spring":
      return (p: number) => 1 - Math.exp(-7 * p) * Math.cos(12 * p);
    case "bounce":
      return bounce;
    default:
      return (p: number) => 1 - (1 - p) ** 3;
  }
}

export interface Run {
  from: HysNumberValue;
  to: HysNumberValue;
  interpolate: ReturnType<typeof numberInterpolation>;
  easing: ReturnType<typeof makeEasing>;
  duration: number;
  elapsed: number;
  iteration: number;
  loops: number;
  alternate: boolean;
  started: boolean;
}
