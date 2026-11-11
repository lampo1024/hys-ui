import { glyph, smooth, wave, type GlyphStyle, type PaintFrame } from "./paint";

function bounce(p: number) {
  if (p < 1 / 2.75) return 7.5625 * p ** 2;
  if (p < 2 / 2.75) return 7.5625 * (p - 1.5 / 2.75) ** 2 + 0.75;
  if (p < 2.5 / 2.75) return 7.5625 * (p - 2.25 / 2.75) ** 2 + 0.9375;
  return 7.5625 * (p - 2.625 / 2.75) ** 2 + 0.984375;
}

export function paintPhysics(frame: PaintFrame, variant: number) {
  const { p, strength: s, from, to, index } = frame;
  const q = 1 - p;
  const oscillation =
    Math.sin(2 * Math.PI * (frame.plan.cycles ?? 3) * p) * q * s;
  const envelope = wave(p) * s;
  const beat =
    (Math.exp(-(((p - 0.3) * 12) ** 2)) +
      0.55 * Math.exp(-(((p - 0.47) * 15) ** 2))) *
    s;
  const poses: GlyphStyle[] = [
    { y: -(1 - p ** 2) * 0.82 * s },
    { y: -(1 - p ** 3) * 0.98 * s, angle: -0.2 * q * s },
    {
      y: -(1 - bounce(p)) * 0.86 * s,
      sx: 1 + 0.15 * oscillation,
      sy: 1 - 0.16 * oscillation,
    },
    { sy: 1 + oscillation * 0.66, sx: 1 - oscillation * 0.23 },
    { sx: 1 + oscillation * 0.48, sy: 1 - oscillation * 0.48 },
    {
      x: oscillation * 0.14,
      sx: 1 + oscillation * 0.28,
      sy: 1 - oscillation * 0.25,
      angle: 0.12 * oscillation,
    },
    { sx: 1 + 0.35 * envelope, sy: 1 - 0.34 * envelope, y: 0.15 * envelope },
    {
      x: 0.24 * oscillation,
      y: 0.13 * Math.abs(oscillation),
      angle: 0.9 * oscillation,
    },
    { x: 0.28 * oscillation, angle: 0.3 * oscillation },
    { x: -(q ** 3) * 0.95 * s, blur: 0.05 * q },
    {
      x: q ** 2 * 0.55 * s - oscillation * 0.2,
      sx: 1 + Math.abs(oscillation) * 0.16,
    },
    { y: Math.sin(p * Math.PI * 4 - index * 0.72) * 0.36 * envelope },
    {
      sx: 1 + 0.24 * Math.abs(oscillation),
      sy: 1 + 0.24 * Math.abs(oscillation),
    },
    { sx: 1 + 0.25 * envelope, sy: 1 + 0.25 * envelope, alpha: 0.7 + 0.3 * p },
    { sx: 1 + 0.25 * beat, sy: 1 + 0.25 * beat, glow: 0.16 * beat },
    {
      x: 0.11 * Math.sin(18 * Math.PI * p) * envelope,
      y: 0.08 * Math.cos(24 * Math.PI * p) * envelope,
    },
    {
      x: 0.12 * oscillation,
      sy: 1 - 0.34 * Math.abs(oscillation),
      glow: 0.22 * q * s,
    },
    {
      y: -Math.sin(Math.PI * smooth(p)) * 0.76 * s + q * 0.14,
      x: -0.42 * q,
      angle: -0.46 * q,
    },
    {
      angle: q * Math.PI * 2,
      sx: 0.25 + 0.75 * p + 0.23 * envelope,
      sy: 0.25 + 0.75 * p + 0.23 * envelope,
    },
    { y: oscillation * 0.38, x: q * 0.65 * s, angle: oscillation * 0.42 },
  ];
  glyph(frame, from, { alpha: q ** 3 });
  glyph(frame, to, { alpha: Math.min(1, p * 4 + 0.2), ...poses[variant] });
}
