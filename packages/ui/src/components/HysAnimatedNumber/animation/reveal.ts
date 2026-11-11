import {
  clamp,
  glyph,
  localProgress,
  noise,
  rectangle,
  smooth,
  type PaintFrame,
} from "./paint";
import { digitPath, tracePath } from "./paths";

export function paintReveal(frame: PaintFrame, variant: number) {
  const { p, from, to, index, count, size, width, strength, ctx } = frame;
  const x = (width / size) * 0.54;
  let t = smooth(p);
  if ([0, 10, 18, 19].includes(variant))
    t = localProgress(t, index, count, variant === 10 ? 0.8 : 0.58);
  glyph(frame, from, { alpha: (1 - p) ** 2 * 0.55 });
  const show = (
    left: number,
    top: number,
    w: number,
    h: number,
    draw = () => glyph(frame, to),
  ) => rectangle(frame, left, top, w, h, draw);
  switch (variant) {
    case 0:
      glyph(frame, to, { alpha: t, y: (1 - t) * 0.18 });
      return;
    case 1: {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, x * t * 1.5 * size, 0.85 * t * size, 0, 0, 2 * Math.PI);
      ctx.clip();
      glyph(frame, to);
      ctx.restore();
      return;
    }
    case 2:
      show(-x, -0.6, x * 2 * t, 1.2);
      return;
    case 3:
      show(-x, -0.6, x * 2, 1.2 * t);
      show(-x, -0.6 + t * 1.2, x * 2, 0.05, () =>
        glyph(frame, to, { color: frame.accent, glow: 0.11 }),
      );
      return;
    case 4: {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-x * size, -0.62 * size);
      ctx.lineTo((-x + x * 4 * t) * size, -0.62 * size);
      ctx.lineTo((-x + x * 4 * t - x * 0.8) * size, 0.62 * size);
      ctx.lineTo(-x * size, 0.62 * size);
      ctx.clip();
      glyph(frame, to);
      ctx.restore();
      return;
    }
    case 5:
      show(-x * t, -0.6, 2 * x * t, 1.2);
      return;
    case 6:
      show(-x, -0.6, x * t, 1.2);
      show(x * (1 - t), -0.6, x * t, 1.2);
      return;
    case 7:
      show(-x, -0.6, x * 2, 1.2, () =>
        glyph(frame, to, { y: (1 - t) * strength }),
      );
      return;
    case 8:
      show(-x, -0.6, x * 2, 1.2, () =>
        glyph(frame, to, { y: (t - 1) * strength }),
      );
      return;
    case 9:
      for (let i = 0; i < 5; i++) show(-x, -0.6 + i * 0.24, x * 2, 0.24 * t);
      return;
    case 10:
      if (t > 0.25) glyph(frame, to);
      return;
    case 11:
    case 12:
      tracePath(frame, digitPath(frame.toIndex), t, {
        smooth: variant === 11,
        width: variant === 11 ? 0.085 : 0.065,
        color: frame.accent,
      });
      glyph(frame, to, { alpha: clamp((t - 0.78) / 0.22) });
      return;
    case 13:
      glyph(frame, to, { stroke: 0.02 });
      show(-x, 0.6 - t * 1.2, x * 2, t * 1.2);
      return;
    case 14:
      show(-x, 0.6 - t * 1.2, x * 2, t * 1.2);
      return;
    case 15:
      for (let i = 0; i < 12; i++) {
        const h = clamp(
          t + 0.13 * Math.sin(i / 2 + p * 10) * Math.sin(p * Math.PI),
        );
        show(-x + (i * x) / 6, 0.6 - h * 1.2, x / 6 + 0.005, h * 1.2);
      }
      return;
    case 16:
      glyph(frame, to, { alpha: 0.55 + t * 0.45 });
      show(-x + 2 * x * t, -0.6, 0.09, 1.2, () =>
        glyph(frame, to, { color: frame.accent, glow: 0.2 }),
      );
      return;
    case 17:
      show(-x, -0.6, t * x * 2, 1.2);
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * p) * 0.52;
      ctx.fillStyle = frame.accent;
      ctx.fillRect(
        (-x + x * 2 * t) * size,
        -0.6 * size,
        0.022 * size,
        1.2 * size,
      );
      ctx.restore();
      return;
    case 18:
      for (let i = 0; i < 6; i++) {
        const offset = (noise(frame.seed, i) - 0.5) * (1 - t) * strength;
        show(-x, -0.6 + i * 0.2, x * 2, 0.2, () =>
          glyph(frame, to, { x: offset, alpha: t }),
        );
      }
      return;
    default:
      show(-x, -0.6, x * 2 * t, 1.2, () =>
        glyph(frame, to, { y: 0.4 * (1 - t), alpha: t }),
      );
  }
}
