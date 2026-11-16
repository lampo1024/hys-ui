import {
  pointCoordinate,
  usesFirstSeries,
  axisType,
  isCartesian,
  chartData,
  type ChartEntry,
  type ChartLegendEntry,
} from "./chartModel";
import type { HysChartProps, HysChartRange } from "./chartTypes";

interface ChartExportView {
  range: HysChartRange;
  hidden: ReadonlySet<string>;
  entries: readonly ChartEntry[];
}
export interface ChartExportContext {
  figure: HTMLElement | null;
  title?: string;
  range?: readonly [string, string];
  legends: readonly ChartLegendEntry[];
}

const cell = (value: unknown) => {
  let text = String(value ?? "");
  if (
    typeof value === "string" &&
    /^(?:[\s\uFEFF]*[=+\-@]|[\t\r\n])/u.test(text)
  )
    text = "'" + text;
  return /[",\r\n]/u.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
};

export function chartCSV(props: HysChartProps, view?: ChartExportView) {
  const type = props.type ?? "bar";
  const axis = axisType(type, props.xAxis);
  if (view) {
    const entries = isCartesian(type)
      ? chartData({
          data: props.data ?? [],
          series: props.series,
          type,
          axis,
          missing: "zero",
          format: () => "",
        })
          .groups.filter((group) => !view.hidden.has(group.key))
          .flatMap((group) =>
            group.entries.filter((entry) => {
              const coordinate = entry.x ?? entry.category;
              return (
                coordinate >= view.range.start && coordinate <= view.range.end
              );
            }),
          )
      : view.entries;
    return [
      "series,label,x,value",
      ...entries.map(({ series, point, x }) =>
        [series.name, point.label, x, point.value].map(cell).join(","),
      ),
    ].join("\r\n");
  }
  const source = props.series ?? [{ name: "数值", data: props.data ?? [] }];
  const groups = usesFirstSeries(type) ? source.slice(0, 1) : source;
  const rows = [["series", "label", "x", "value"].join(",")];
  for (const series of groups) {
    for (const [index, point] of series.data.entries()) {
      const coordinate = pointCoordinate(point, index, axis);
      rows.push(
        [
          series.name,
          point.label,
          Number.isFinite(coordinate) ? coordinate : null,
          Number.isFinite(point.value) ? point.value : null,
        ]
          .map(cell)
          .join(","),
      );
    }
  }
  return rows.join("\r\n");
}

const properties = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "color",
  "opacity",
  "paint-order",
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
  "dominant-baseline",
  "display",
  "visibility",
];

export function chartSVG(svg: SVGSVGElement, context?: ChartExportContext) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const [, , width, height] = (svg.getAttribute("viewBox") ?? "0 0 620 220")
    .split(/\s+/u)
    .map(Number);
  copy.setAttribute("width", String(width));
  copy.setAttribute("height", String(height));
  const originals = [svg, ...svg.querySelectorAll<SVGElement>("*")];
  const copies = [copy, ...copy.querySelectorAll<SVGElement>("*")];
  originals.forEach((element, index) => {
    const style = getComputedStyle(element);
    for (const property of properties) {
      const value = style.getPropertyValue(property);
      if (!value) continue;
      const localRef = value.match(/^url\(["']?[^#)]*#([^"')]+)["']?\)$/u);
      copies[index].style.setProperty(
        property,
        localRef ? `url(#${localRef[1]})` : value,
      );
    }
    copies[index].removeAttribute("tabindex");
  });
  copy
    .querySelectorAll("[data-chart-export-ignore]")
    .forEach((element) => element.remove());
  return new XMLSerializer().serializeToString(
    context ? frameSVG(copy, width, height, context) : copy,
  );
}

const svgNamespace = "http://www.w3.org/2000/svg";

function frameSVG(
  plot: SVGSVGElement,
  plotWidth: number,
  plotHeight: number,
  context: ChartExportContext,
) {
  const doc = plot.ownerDocument;
  const root = doc.createElementNS(svgNamespace, "svg");
  const width = Math.max(320, plotWidth + 24);
  const padding = 12;
  const style = context.figure ? getComputedStyle(context.figure) : undefined;
  const color = style?.color || "#17243b";
  const background = style?.backgroundColor;
  const add = (
    tag: "text" | "rect" | "title",
    attrs: Record<string, string | number>,
    label?: string,
  ) => {
    const element = doc.createElementNS(svgNamespace, tag);
    for (const [key, value] of Object.entries(attrs))
      element.setAttribute(key, String(value));
    if (label) element.textContent = label;
    root.append(element);
    return element;
  };
  function line(
    label: string,
    x: number,
    y: number,
    size: number,
    strong = false,
    maxWidth = width - padding * 2,
  ) {
    const characters = [...label];
    const limit = Math.floor(maxWidth / size);
    const text =
      characters.length <= limit
        ? label
        : characters.slice(0, limit - 1).join("") + "…";
    add(
      "text",
      {
        x,
        y,
        fill: color,
        "font-size": size,
        "font-weight": strong ? 650 : 400,
      },
      text,
    );
  }
  root.setAttribute("font-family", style?.fontFamily || "sans-serif");
  const surface = add("rect", {
    width,
    fill:
      !background || background === "rgba(0, 0, 0, 0)" ? "#fff" : background,
  });
  let y = padding;
  if (context.title) {
    add("title", {}, context.title);
    line(context.title, padding, y + 17, 16, true);
    y += 25;
  }
  if (context.range) {
    const range = context.range.join(" – ");
    const lines =
      [...range].length * 12 <= width - padding * 2
        ? [range]
        : ["开始  " + context.range[0], "结束  " + context.range[1]];
    for (const label of lines) {
      add(
        "text",
        { x: padding, y: y + 13, fill: color, "font-size": 12 },
        label,
      );
      y += 17;
    }
    y += 4;
  }

  const colorProbe = doc.createElement("span");
  colorProbe.style.display = "none";
  if (context.legends.length) {
    context.figure?.append(colorProbe);
    try {
      let x = padding;
      for (const legend of context.legends) {
        const available = width - padding * 2 - 18;
        const textWidth = Math.min(available, [...legend.label].length * 12);
        if (x + 18 + textWidth > width - padding) {
          x = padding;
          y += 20;
        }
        colorProbe.style.color = "";
        colorProbe.style.color = legend.color;
        const swatch = colorProbe.isConnected
          ? getComputedStyle(colorProbe).color
          : legend.color;
        add("rect", {
          x,
          y: y + 4,
          width: 8,
          height: 8,
          rx: 2,
          fill: swatch || color,
        });
        line(legend.label, x + 13, y + 12, 12, false, textWidth);
        x += textWidth + 22;
      }
    } finally {
      colorProbe.remove();
    }
    y += 24;
  }

  const height = y + plotHeight + padding;
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));
  root.setAttribute("viewBox", "0 0 " + width + " " + height);
  surface.setAttribute("height", String(height));
  plot.setAttribute("x", String((width - plotWidth) / 2));
  plot.setAttribute("y", String(y));
  root.append(plot);
  return root;
}

export async function chartPNG(
  svg: SVGSVGElement,
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2),
  context?: ChartExportContext,
) {
  const url = URL.createObjectURL(
    new Blob([chartSVG(svg, context)], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const { naturalWidth: width, naturalHeight: height } = image;
    const ratio = Math.min(
      Number.isFinite(pixelRatio) ? Math.max(0.1, Math.min(4, pixelRatio)) : 1,
      4096 / Math.max(width, height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法创建图表画布");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("无法生成 PNG"))),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadChart(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
