export type ChartPlotFrame = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  horizontal: boolean;
  coordinateAt: (ratio: number) => number;
};

export function plotReader(target: SVGSVGElement, bounds: ChartPlotFrame) {
  const rect = target.getBoundingClientRect();
  const svgSize = target.viewBox?.baseVal;
  const scaleX = (svgSize?.width || rect.width) / Math.max(1, rect.width);
  const scaleY = (svgSize?.height || rect.height) / Math.max(1, rect.height);
  return (event: MouseEvent) => {
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    return {
      x,
      y,
      inside:
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.top &&
        y <= bounds.bottom,
      ratio: bounds.horizontal
        ? (y - bounds.top) / (bounds.bottom - bounds.top)
        : (x - bounds.left) / (bounds.right - bounds.left),
    };
  };
}
