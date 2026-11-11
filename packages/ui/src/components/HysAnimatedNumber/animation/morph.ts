import {
  clamp,
  glyph,
  mix,
  noise,
  smooth,
  wave,
  type PaintFrame,
} from "./paint";
import { digitPath, tracePath } from "./paths";

export function paintMorph(frame: PaintFrame, variant: number) {
  const { fromIndex, toIndex, from, to, p, strength, ctx, size, seed } = frame;
  const t = [8, 9, 16].includes(variant) ? smooth(p) : p;
  const bend = wave(t) * strength;
  const first = digitPath(fromIndex),
    last = digitPath(toIndex);
  const shape = first.map(([x, y], i): [number, number] => {
    const px = mix(x, last[i][0], t);
    const py = mix(y, last[i][1], t);
    const r = noise(seed, i) - 0.5;
    switch (variant) {
      case 3:
        return [px + r * bend * 0.25, py + ((i % 3) - 1) * bend * 0.1];
      case 4:
        return [px * (1 - bend * 0.75), py];
      case 5:
        return [
          px + Math.sin(py * 10 - t * 8) * 0.17 * bend,
          py + Math.cos(px * 8 + t * 6) * 0.12 * bend,
        ];
      case 6:
        return [
          px * (1 + bend * 0.45),
          py * (1 - bend * 0.3) + Math.sin(i * 0.5) * 0.055 * bend,
        ];
      case 7:
        return [px * (1 + bend * 0.25), py + (py + 0.4) ** 2 * bend * 0.52];
      case 8:
        return [px * (1 - bend * 0.22), py * (1 + bend * 0.55)];
      case 9:
        return [px * (1 + bend * 0.43), py * (1 - bend * 0.52)];
      case 10:
        return [px + Math.sin(py * 6) * 0.36 * bend, py - px * 0.2 * bend];
      case 11:
        return [
          px * Math.cos(bend) - py * Math.sin(bend),
          px * Math.sin(bend) + py * Math.cos(bend),
        ];
      case 12:
        return [
          px + 0.8 * r * bend,
          py + 0.5 * (noise(seed + 1, i) - 0.5) * bend,
        ];
      case 13:
        return [
          mix(px, Math.round(px * 4) / 4, bend),
          mix(py, Math.round(py * 4) / 4, bend),
        ];
      case 14:
        return [px + 0.06 * (i % 2 ? -1 : 1) * bend, py];
      case 15:
        return [
          px + py ** 2 * bend * 0.85,
          py + Math.sin(px * 10) * 0.1 * bend,
        ];
      case 16:
        return [
          px + Math.sin(i * 0.24) * bend * 0.035,
          py + Math.cos(i * 0.24) * bend * 0.035,
        ];
      case 17:
        return [px + Math.sign(px) * bend * 0.26, py];
      case 19:
        return [
          px + Math.sin(i / 3 - t * 15) * 0.08 * bend,
          py + Math.cos(i / 3 - t * 15) * 0.08 * bend,
        ];
      default:
        return [px, py];
    }
  });
  const opacity = Math.min(1, wave(p) * 4);
  glyph(frame, from, { alpha: clamp(1 - p * 5) });
  glyph(frame, to, { alpha: clamp((p - 0.8) * 5) });
  if (variant === 12 || variant === 3) {
    for (let i = 0; i < shape.length - 2; i += 3)
      tracePath(frame, shape.slice(i, i + 3), 1, {
        alpha: opacity,
        width: 0.065,
      });
    return;
  }
  if (variant === 18) {
    glyph(frame, from, {
      alpha: (1 - p) * opacity,
      sx: 1 + bend * 0.15,
      color: frame.accent,
      blur: 0.035 * bend,
    });
    glyph(frame, to, {
      alpha: p * opacity,
      sy: 1 - bend * 0.25,
      blur: 0.025 * bend,
    });
    return;
  }
  if (variant === 2 || variant === 19) {
    ctx.save();
    ctx.translate(0.035 * size, 0);
    tracePath(frame, shape, 1, {
      alpha: opacity,
      width: 0.035,
      color: frame.accent,
      smooth: true,
    });
    ctx.translate(-0.07 * size, 0);
    tracePath(frame, shape, 1, { alpha: opacity, width: 0.035, smooth: true });
    ctx.restore();
    return;
  }
  tracePath(
    frame,
    variant === 14
      ? shape.filter((_, i) => i % 4 === 0 || i === shape.length - 1)
      : shape,
    1,
    {
      alpha: opacity,
      width:
        variant === 4
          ? 0.035
          : variant === 6
            ? 0.18
            : variant === 1
              ? 0.075
              : 0.11,
      smooth: ![1, 13, 14].includes(variant),
    },
  );
}
