import {
  clamp,
  glyph,
  localProgress,
  noise,
  rectangle,
  rollingGlyph,
  smooth,
  wave,
  type PaintFrame,
} from "./paint";

export function paintRoll(frame: PaintFrame, variant: number) {
  const { p, index, count, fromIndex, toIndex, ctx, size, width, strength } =
    frame;
  const direction = toIndex < fromIndex ? -1 : 1;
  const remainder = ((toIndex - fromIndex) * direction + 10) % 10;
  const rate =
    [
      smooth(p),
      p,
      smooth(p),
      localProgress(p, index, count, 0.34),
      p,
      1 - (1 - p) ** 4,
      p ** 3,
      1 - (1 - p) ** 3,
      1 - (1 - p) ** 2 * Math.cos(p * Math.PI * 1.8),
      1 - Math.exp(-5 * p) * Math.cos(p * Math.PI * 5) * (1 - p),
      p,
      (Math.floor(p * 3) + smooth((p * 3) % 1)) / 3,
      Math.floor(p * 8) / 8,
      Math.floor(p * 5) / 5,
      p ** (0.65 + (index / Math.max(1, count - 1)) * 1.45),
      smooth(p),
      localProgress(p, index % 2, 2, 0.36),
      localProgress(p, index, count, 0.42),
      smooth(p),
      p,
    ][variant] ?? p;
  const cycles = Math.round(
    frame.plan.cycles ??
      (variant === 10 ? 4 : [12, 13, 19].includes(variant) ? 0 : 1),
  );
  const distance = (cycles * 10 + remainder) * direction;
  let travelled = distance * rate;
  if (variant === 13) travelled = Math.trunc(travelled / 2) * 2;
  const whole = Math.floor(travelled);
  const fractional = travelled - whole;
  const phase =
    variant === 18 ? smooth(clamp((fractional - 0.65) / 0.35)) : fractional;
  const horizontal = frame.axis === "horizontal" || variant === 2;
  const span = horizontal ? width / size : 0.88;
  const move = (step: number) => (step - phase) * span;
  const render = (step: number) => {
    const offset = move(step);
    const circle = variant === 0 || variant === 1;
    const depth = circle ? Math.max(0.18, Math.cos((step - phase) * 1.22)) : 1;
    glyph(frame, rollingGlyph(frame, fromIndex + whole + step), {
      x: horizontal
        ? offset
        : variant === 4
          ? Math.sin(offset * 4 + p * 10) * 0.22 * wave(p) * strength
          : 0,
      y: horizontal ? 0 : offset,
      sx: horizontal ? depth : 1,
      sy: horizontal ? 1 : depth,
      angle: variant === 1 ? offset * 0.45 : variant === 4 ? offset * 0.55 : 0,
      alpha: circle ? 0.45 + 0.55 * depth : 1,
      blur: variant === 5 ? 0.045 * (1 - p) : 0,
    });
  };
  if (variant === 1) {
    ctx.save();
    ctx.rotate(p * Math.PI * 2);
    ctx.strokeStyle = frame.accent;
    ctx.globalAlpha *= 0.38;
    ctx.lineWidth = 0.035 * size;
    ctx.beginPath();
    for (let tooth = 0; tooth <= 32; tooth++) {
      const angle = (tooth / 32) * 2 * Math.PI;
      const r = size * (tooth % 4 < 2 ? 0.56 : 0.47);
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  rectangle(
    frame,
    (-width / size) * 0.52,
    -0.55,
    (width / size) * 1.04,
    1.1,
    () => {
      render(0);
      if (![12, 13].includes(variant)) render(1);
    },
  );
  if (variant === 19 || variant === 18 || variant === 11) {
    glyph(frame, rollingGlyph(frame, fromIndex + whole), {
      color: frame.accent,
      alpha: 0.7 * (variant === 19 ? (1 - phase) ** 8 : phase ** 6),
      glow: 0.07 + 0.02 * noise(frame.seed, index),
    });
  }
}
