import type { qrSymbol } from "./qrMatrix";

export type QrSymbol = NonNullable<ReturnType<typeof qrSymbol>>;
export type QrLogo = {
  x: number;
  y: number;
  size: number;
  clip: string;
  regions: { x: number; y: number; width: number }[];
};

function runs(matrix: Int8Array[], margin: number) {
  const regions: QrLogo["regions"] = [];
  matrix.forEach((row, y) => {
    let start = -1;
    for (let x = 0; x <= row.length; x++) {
      if (row[x]) {
        if (start < 0) start = x;
      } else if (start >= 0) {
        regions.push({ x: start + margin, y: y + margin, width: x - start });
        start = -1;
      }
    }
  });
  return regions;
}
function path(regions: QrLogo["regions"]) {
  return regions
    .map(({ x, y, width }) => `M${x} ${y}h${width}v1h-${width}z`)
    .join("");
}
export type QrModuleShape = "square" | "rounded" | "dot";
export function qrPath(matrix: Int8Array[], margin: number, modules?: Int16Array[], shape: QrModuleShape = "square") {
  if (shape === "square" || !modules) return path(runs(matrix, margin));
  const result: string[] = [];
  for (let row = 0; row < matrix.length; row++) {
    for (let column = 0; column < matrix[row].length; column++) {
      if (!matrix[row][column]) continue;
      const x = margin + column, y = margin + row;
      if (modules[row][column] < 0) result.push(`M${x} ${y}h1v1h-1z`);
      else if (shape === "dot") result.push(`M${x + .5} ${y + .04}a.46 .46 0 1 1 0 .92a.46 .46 0 1 1 0 -.92z`);
      else result.push(`M${x + .2} ${y}h.6q.2 0 .2 .2v.6q0 .2 -.2 .2h-.6q-.2 0 -.2 -.2v-.6q0 -.2 .2 -.2z`);
    }
  }
  return result.join("");
}
export function logoRegion(
  symbol: QrSymbol,
  requested: number,
  margin: number,
): QrLogo | undefined {
  const width = symbol.matrix.length;
  const budget = Math.max(1, Math.floor(symbol.degree * 0.4));
  const target = Math.min(Math.floor(width * 0.35), Math.floor(requested));
  for (let size = target % 2 ? target : target - 1; size > 0; size -= 2) {
    const start = (width - size) / 2;
    const hits = new Set<number>();
    const perBlock = new Uint8Array(symbol.blockCount);
    const mask = Array.from({ length: size }, () => new Int8Array(size));
    let allowed = true;
    for (let y = 0; y < size && allowed; y++) {
      for (let x = 0; x < size; x++) {
        const word = symbol.modules[y + start][x + start];
        if (word < 0) continue; // Preserve finder, timing, alignment and metadata modules.
        mask[y][x] = 1;
        if (word >= symbol.words.length || hits.has(word)) continue;
        hits.add(word);
        if (++perBlock[symbol.owners[word]] > budget) {
          allowed = false;
          break;
        }
      }
    }
    if (!allowed) continue;
    const position = start + margin;
    const regions = runs(mask, position);
    if (regions.length)
      return { x: position, y: position, size, regions, clip: path(regions) };
  }
}

export function drawCode(
  canvas: HTMLCanvasElement,
  matrix: Int8Array[],
  margin: number,
  requested: number,
  foreground: string,
  background: string,
  logo?: QrLogo,
  image?: HTMLImageElement,
  styledPath?: string,
) {
  const extent = matrix.length + margin * 2;
  const scale = Math.max(1, Math.floor(Math.min(4096, requested) / extent));
  canvas.width = canvas.height = extent * scale;
  const context = canvas.getContext("2d");
  if (!context) return false;
  context.scale(scale, scale);
  context.imageSmoothingEnabled = false;
  context.fillStyle = background;
  context.fillRect(0, 0, extent, extent);
  context.fillStyle = foreground;
  const Path = typeof Path2D === "function" ? Path2D : undefined;
  if (styledPath && Path) context.fill(new Path(styledPath));
  else for (const { x, y, width } of runs(matrix, margin)) context.fillRect(x, y, width, 1);
  if (logo && image) {
    context.save();
    context.beginPath();
    for (const { x, y, width } of logo.regions) context.rect(x, y, width, 1);
    context.clip();
    context.clearRect(logo.x, logo.y, logo.size, logo.size);
    context.fillStyle = background;
    context.fillRect(logo.x, logo.y, logo.size, logo.size);
    context.imageSmoothingEnabled = true;
    const ratio = Math.min(
      logo.size / image.naturalWidth,
      logo.size / image.naturalHeight,
    );
    const width = image.naturalWidth * ratio;
    const height = image.naturalHeight * ratio;
    context.drawImage(
      image,
      logo.x + (logo.size - width) / 2,
      logo.y + (logo.size - height) / 2,
      width,
      height,
    );
    context.restore();
  }
  return true;
}
