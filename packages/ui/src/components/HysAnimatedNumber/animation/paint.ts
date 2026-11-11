import type { ResolvedNumberAnimation } from "../../../composables/numberAnimation";

export interface PaintFrame {
  ctx: CanvasRenderingContext2D;
  from: string;
  to: string;
  digit: string;
  section?: "integer" | "fraction";
  fromIndex: number;
  toIndex: number;
  glyphs: readonly string[];
  width: number;
  size: number;
  p: number;
  strength: number;
  cycles: number;
  axis: "horizontal" | "vertical";
  seed: number;
  index: number;
  count: number;
  color: string;
  accent: string;
  plan: ResolvedNumberAnimation;
}

export const clamp = (p: number) => Math.min(1, Math.max(0, p));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const wave = (p: number) => Math.sin(Math.PI * clamp(p));
export const smooth = (p: number) => clamp(p) ** 2 * (3 - 2 * clamp(p));
export const noise = (seed: number, n: number) =>
  ((Math.imul(n + 13, 0x85ebca6b) ^ Math.imul(seed + 37, 0xc2b2ae35)) >>> 0) /
  0x100000000;

export interface GlyphStyle {
  x?: number;
  y?: number;
  sx?: number;
  sy?: number;
  angle?: number;
  alpha?: number;
  color?: string;
  blur?: number;
  stroke?: number;
  glow?: number;
}

export function glyph(frame: PaintFrame, text: string, style: GlyphStyle = {}) {
  const { ctx, color, size } = frame;
  const {
    x = 0,
    y = 0,
    sx = 1,
    sy = 1,
    angle = 0,
    alpha = 1,
    blur = 0,
    stroke = 0,
    glow = 0,
  } = style;
  if (!text || alpha <= 0 || sx <= 0 || sy <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.translate(x * size, y * size);
  if (angle) ctx.rotate(angle);
  ctx.scale(sx, sy);
  ctx.fillStyle = ctx.strokeStyle = style.color ?? color;
  if (blur) ctx.filter = `blur(${size * blur}px)`;
  if (glow) {
    ctx.shadowBlur = size * glow;
    ctx.shadowColor = style.color ?? color;
  }
  if (stroke) {
    ctx.lineJoin = "round";
    ctx.lineWidth = size * stroke;
    ctx.strokeText(text, 0, 0);
  } else ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function rectangle(
  frame: PaintFrame,
  x: number,
  y: number,
  w: number,
  h: number,
  paint: () => void,
) {
  const { ctx, size } = frame;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x * size, y * size, Math.max(0, w) * size, Math.max(0, h) * size);
  ctx.clip();
  paint();
  ctx.restore();
}

export function localProgress(
  p: number,
  index: number,
  count: number,
  spread: number,
) {
  return clamp((p - (index / Math.max(1, count - 1)) * spread) / (1 - spread));
}

export const rollingGlyph = (frame: PaintFrame, index: number) =>
  frame.glyphs[((index % 10) + 10) % 10] ?? frame.digit;
