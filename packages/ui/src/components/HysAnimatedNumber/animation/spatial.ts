import { glyph, mix, rectangle, smooth, wave, type PaintFrame } from "./paint";

function rotateFaces(
  frame: PaintFrame,
  sides: number,
  horizontal: boolean,
  curved = false,
) {
  const { p, from, to, ctx, size, strength } = frame;
  const faces = [
    { text: from, angle: (p * 2 * Math.PI) / sides },
    { text: to, angle: ((p - 1) * 2 * Math.PI) / sides },
  ];
  if (sides > 4) {
    faces.push({
      text: frame.glyphs[(frame.fromIndex + 9) % 10],
      angle: ((p + 1) * 2 * Math.PI) / sides,
    });
    faces.push({
      text: frame.glyphs[(frame.toIndex + 1) % 10],
      angle: ((p - 2) * 2 * Math.PI) / sides,
    });
  }
  for (const face of faces.sort(
    (a, b) => Math.cos(a.angle) - Math.cos(b.angle),
  )) {
    const depth = Math.cos(face.angle);
    if (depth <= 0) continue;
    const radius = (sides > 4 ? 0.62 : 0.43) * (0.7 + strength * 0.3);
    const delta = Math.sin(face.angle) * radius;
    const scale = curved ? Math.sqrt(depth) : depth;
    ctx.save();
    ctx.globalAlpha *= depth * 0.28 * wave(p);
    ctx.fillStyle = frame.accent;
    const x = (horizontal ? delta - 0.33 * scale : -0.33) * size;
    const y = (horizontal ? -0.51 : delta - 0.51 * scale) * size;
    ctx.fillRect(
      x,
      y,
      0.66 * size * (horizontal ? scale : 1),
      1.02 * size * (horizontal ? 1 : scale),
    );
    ctx.restore();
    glyph(frame, face.text, {
      x: horizontal ? delta : 0,
      y: horizontal ? 0 : delta,
      sx: horizontal ? scale : curved ? 0.88 + 0.12 * depth : 1,
      sy: horizontal ? (curved ? 0.88 + 0.12 * depth : 1) : scale,
      alpha: 0.38 + depth * 0.62,
    });
  }
}

function folds(frame: PaintFrame, variant: number) {
  const { p, from, to, width, size, ctx } = frame;
  const horizontal =
    variant === 5 || (variant === 14 && frame.axis === "horizontal");
  const sections =
    variant === 9 ? 5 : variant === 8 || variant === 4 || variant === 5 ? 2 : 1;
  const ratio = width / size;
  const a = Math.cos(p * Math.PI);
  const front = p < 0.5;
  const text = front ? from : to;
  const angle = variant === 6 ? (front ? p : p - 1) * 0.36 : 0;
  if (variant === 8) {
    rectangle(frame, -ratio / 2, -0.57, ratio, 0.57, () =>
      glyph(frame, front ? to : text),
    );
    rectangle(frame, -ratio / 2, 0, ratio, 0.57, () =>
      glyph(frame, front ? text : from),
    );
  }
  for (let part = 0; part < sections; part++) {
    const position = horizontal
      ? (ratio / sections) * part - ratio / 2
      : (1.12 / sections) * part - 0.56;
    const clip = horizontal
      ? [position, -0.56, ratio / sections, 1.12]
      : [-ratio / 2, position, ratio, 1.12 / sections];
    const phase = variant === 9 ? smooth(p * 1.25 - part * 0.055) : p;
    const foreshorten =
      variant === 9 ? Math.abs(Math.cos(phase * Math.PI)) : Math.abs(a);
    const displacement =
      variant === 7
        ? -0.62 * wave(phase)
        : variant === 8
          ? 0.25 * wave(phase) * (front ? -1 : 1)
          : 0;
    rectangle(frame, clip[0], clip[1], clip[2], clip[3], () => {
      ctx.globalAlpha *= variant === 8 ? 0.92 : 1;
      glyph(frame, phase < 0.5 ? from : to, {
        x: horizontal && variant === 5 ? (part - 0.5) * 0.25 * wave(phase) : 0,
        y:
          displacement + (variant === 4 ? (part - 0.5) * 0.3 * wave(phase) : 0),
        sx: horizontal ? foreshorten : 1,
        sy: horizontal ? 1 : foreshorten,
        angle,
      });
    });
  }
}

export function paintSpatial(frame: PaintFrame, variant: number) {
  const { from, to, p, strength } = frame;
  if (variant < 4 || variant === 15) {
    rotateFaces(
      frame,
      [4, 8, 10, 6][variant] ?? 3,
      variant === 0 || variant === 2 || variant === 15,
      variant === 2,
    );
    return;
  }
  if (variant <= 9 || variant === 14) {
    folds(frame, variant);
    return;
  }
  const q = (1 - p) * strength;
  const poses = {
    10: {
      sx: 0.5 + smooth(p) * 0.5 + wave(p) * 0.32,
      sy: 0.5 + smooth(p) * 0.5 + wave(p) * 0.32,
    },
    11: { sx: 1 + q * 0.75, sy: 1 + q * 0.75, blur: 0.045 * q },
    12: { sx: 0.25 + 0.75 * p, sy: 1 + 0.16 * q, angle: q * 0.5, x: -0.3 * q },
    13: {
      sx: mix(0.25, 1, p),
      sy: mix(0.25, 1, p),
      x: 0.6 * q,
      y: -0.32 * q,
      blur: 0.06 * q,
    },
    16: {
      y: -0.28 * wave(p) * strength,
      sx: 1 + wave(p) * 0.12,
      sy: 1 + wave(p) * 0.12,
      glow: 0.2 * wave(p),
    },
    17: { angle: -0.48 * q, sx: 1 - 0.28 * q, sy: 1 + 0.12 * q },
    18: { sx: 1 + 0.4 * wave(p) * strength, sy: 1 - 0.42 * wave(p) * strength },
    19: { sx: 0.14 + 0.86 * smooth(p), sy: 0.42 + 0.58 * p, angle: q * 0.28 },
  };
  glyph(frame, from, { alpha: (1 - p) ** 2, sx: 1 + p * 0.3, sy: 1 + p * 0.3 });
  glyph(frame, to, {
    ...poses[variant as keyof typeof poses],
    alpha: p ** 0.5,
  });
}
