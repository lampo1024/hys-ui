export function resolveScrollTarget(input?: HTMLElement | string) {
  if (typeof window === "undefined") return;
  if (typeof input !== "string") return input ?? window;
  try {
    const node = document.querySelector(input);
    return node instanceof HTMLElement ? node : undefined;
  } catch {
    return undefined;
  }
}

export function scrollTargetTop(target: Window | HTMLElement) {
  return target instanceof HTMLElement ? target.scrollTop : target.scrollY;
}

export function scrollTargetTo(target: Window | HTMLElement, top: number, smooth: boolean) {
  target.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "instant" });
}
