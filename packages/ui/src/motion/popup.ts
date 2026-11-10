export type HysPopupTransition =
  "scale" | "fade" | "slide" | "slide-fade" | "none";
export interface HysPopupMotionProps {
  /** Built-in entrance/exit effect. Defaults to scale; none disables it. */
  popupTransition?: HysPopupTransition;
  /** Duration in milliseconds, default 160. Zero disables the transition. */
  popupTransitionDuration?: number;
}

/** Layout dimensions, unaffected by an in-flight scale/slide animation. */
export function popupSize(element: HTMLElement) {
  const box = element.getBoundingClientRect();
  return {
    width: element.offsetWidth || box.width,
    height: element.offsetHeight || box.height,
  };
}
