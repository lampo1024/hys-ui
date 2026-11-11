import {
  clamp,
  glyph,
  mix,
  noise,
  smooth,
  wave,
  type PaintFrame,
} from "./paint";

type Point = readonly [number, number];
const masks = new Map<string, Point[]>();

export function glyphMask(text: string, font: string, size: number, grid = 3) {
  const normalizedFont = font.replace(/\d+(?:\.\d+)?px/, "40px");
  const key = `${text}/${normalizedFont}/${grid}`;
  const cached = masks.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 60;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !size) return [];
  ctx.font = normalizedFont;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 30, 30);
  const data = ctx.getImageData(0, 0, 60, 60).data;
  const points: Point[] = [];
  for (let y = 2; y < 59; y += grid) {
    for (let x = 2; x < 59; x += grid) {
      if (data[(y * 60 + x) * 4 + 3] > 110)
        points.push([(x - 30) / 40, (y - 30) / 40]);
    }
  }
  if (masks.size >= 128) masks.delete(masks.keys().next().value!);
  masks.set(key, points);
  return points;
}

export function paintParticles(frame: PaintFrame, variant: number) {
  const { from, to, p, size, strength, seed, ctx, accent, color } = frame;
  const dispersing = [1, 4, 6, 9, 14, 18, 19].includes(variant);
  const assemble = !dispersing;
  const progress = assemble ? p : 1 - p;
  const spread = (1 - smooth(progress)) * strength;
  const word = assemble ? to : from;
  const pixel = [3, 4, 5, 6, 7].includes(variant);
  const flow = [10, 11, 12, 13, 14, 15].includes(variant);
  const sparks = [16, 17, 18, 19].includes(variant);
  glyph(frame, from, {
    alpha: assemble ? (1 - p) ** 4 : clamp(1 - p * 5),
    blur: variant === 10 ? 0.07 : 0,
  });
  glyph(frame, to, { alpha: assemble ? clamp((p - 0.63) / 0.37) : p ** 3 });
  const points = glyphMask(
    word,
    ctx.font,
    size,
    variant === 5 ? 7 : pixel ? 5 : 3,
  );
  const opacity = clamp(wave(p) * 2.5);
  const morph = [2, 5, 15].includes(variant)
    ? glyphMask(from, ctx.font, size, pixel ? 5 : 3)
    : [];
  for (let i = 0; i < points.length; i++) {
    const [px, py] = points[i];
    const angle = noise(seed + variant * 31, i) * 2 * Math.PI;
    const range = 0.28 + noise(seed + 79, i) * 0.73;
    const fall =
      variant === 9 ? 0.94 * p ** 2 : variant === 8 ? -0.62 * spread : 0;
    const line = flow ? Math.sin(px * 11 + py * 4 + p * 8) * spread * 0.28 : 0;
    const start = morph[i % morph.length];
    const x = start
      ? mix(start[0], px, p) + line
      : px +
        Math.cos(angle) * range * spread * (variant === 19 ? 1.8 : 1) +
        line;
    const y = start
      ? mix(start[1], py, p) - line
      : py + Math.sin(angle) * range * spread + fall - line;
    const r = pixel
      ? variant === 5
        ? 0.09
        : 0.057
      : flow
        ? 0.034 + 0.025 * spread
        : 0.02 + noise(seed + 11, i) * 0.024;
    ctx.save();
    ctx.globalAlpha *=
      opacity * (variant === 17 ? 0.55 + 0.45 * Math.sin(p * 16 + i) ** 2 : 1);
    ctx.fillStyle = sparks || i % 6 === 0 ? accent : color;
    if (sparks) {
      ctx.shadowColor = accent;
      ctx.shadowBlur = size * 0.11;
    }
    if (pixel) {
      ctx.translate(x * size, y * size);
      if (variant === 6 || variant === 7) ctx.rotate(angle * spread);
      ctx.fillRect((-r * size) / 2, (-r * size) / 2, r * size, r * size);
    } else {
      ctx.beginPath();
      ctx.ellipse(
        x * size,
        y * size,
        r * size,
        r * size * (variant === 13 ? 2 : 1),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }
  if (variant === 11 || variant === 19) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.globalAlpha *= 0.5 * wave(p);
    ctx.lineWidth = 0.018 * size;
    for (let ring = 0; ring < (variant === 11 ? 3 : 1); ring++) {
      ctx.beginPath();
      ctx.arc(0, 0, (0.1 + p * (0.63 + ring * 0.21)) * size, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
