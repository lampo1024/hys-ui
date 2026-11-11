import {
  clamp,
  glyph,
  localProgress,
  noise,
  rectangle,
  smooth,
  wave,
  type PaintFrame,
} from "./paint";
import { paintRoll } from "./rolling";
import { paintSpatial } from "./spatial";
import { paintPhysics } from "./physics";
import { paintReveal } from "./reveal";
import { paintParticles } from "./particles";
import { paintDigital } from "./digital";

function indicator(frame: PaintFrame, p: number, variant: number) {
  const { ctx, size, width, accent } = frame;
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = accent;
  ctx.lineWidth = 0.025 * size;
  ctx.lineCap = "round";
  ctx.globalAlpha *= 0.8;
  const x = (width / size) * 0.48;
  if (variant === 17 || variant === 18) {
    ctx.beginPath();
    ctx.arc(0, 0, 0.53 * size, -Math.PI / 2, Math.PI * (2 * p - 0.5));
    ctx.stroke();
    if (variant === 18) {
      ctx.beginPath();
      ctx.moveTo(0, 0.42 * size);
      ctx.lineTo(
        Math.cos(Math.PI * (p - 1)) * 0.33 * size,
        (0.42 + Math.sin(Math.PI * (p - 1)) * 0.33) * size,
      );
      ctx.stroke();
    }
  } else if (variant === 19 || variant === 20) {
    ctx.beginPath();
    ctx.moveTo(-x * size, 0.64 * size);
    for (let i = 1; i <= 8; i++) {
      const pos = i / 8;
      const y =
        variant === 19
          ? 0.62 - 0.17 * pos - Math.sin(pos * 11) * 0.08
          : 0.64 - pos * 0.21;
      ctx.lineTo((-x + x * 2 * pos * p) * size, y * size);
    }
    ctx.stroke();
  } else ctx.fillRect(-x * size, 0.58 * size, x * 2 * p * size, 0.028 * size);
  ctx.restore();
}

export function paintData(frame: PaintFrame, variant: number) {
  const { p, from, to, digit, index, strength, accent, ctx, size } = frame;
  if (variant === 2 && frame.section === "integer") {
    glyph(frame, digit);
    return;
  }
  if (variant < 3 || variant === 28 || variant === 29) {
    paintRoll(frame, [17, 7, 15][variant] ?? (variant === 28 ? 13 : 19));
    return;
  }
  if (variant === 3 || variant === 4) {
    paintSpatial(frame, variant === 3 ? 6 : 14);
    return;
  }
  if (variant === 5) {
    paintReveal(frame, 19);
    return;
  }
  if (variant === 10 || variant === 11) {
    paintReveal(frame, variant === 10 ? 5 : 14);
    return;
  }
  if (variant >= 16 && variant <= 20) {
    glyph(frame, digit);
    indicator(frame, p, variant);
    return;
  }
  if ([21, 22, 23, 24].includes(variant)) {
    paintPhysics(
      frame,
      variant === 22 ? 19 : variant === 23 ? 0 : variant === 24 ? 12 : 11,
    );
    return;
  }
  const crest = wave(p) * strength;
  const rise = [6, 8, 12, 13, 14, 15, 26].includes(variant);
  const tone = variant === 25 || variant === 27 ? "#df5268" : accent;
  const emphatic = [6, 7, 12, 13, 14, 15, 25, 26, 27].includes(variant);
  glyph(frame, from, { y: (rise ? 0.28 : -0.28) * p, alpha: (1 - p) ** 2 });
  glyph(frame, to, {
    y: (rise ? -0.23 : 0.23) * (1 - p) * strength,
    sx: 1 + (emphatic ? 0.18 * crest : 0),
    sy: 1 + (emphatic ? 0.18 * crest : 0),
    alpha: Math.min(1, 0.35 + p),
    color: emphatic && p > 0.28 ? tone : undefined,
    glow: emphatic ? crest * 0.2 : 0,
  });
  if ((variant === 8 || variant === 9) && index === frame.count - 1)
    glyph(frame, variant === 8 ? "↑" : "↓", {
      x: 0.57,
      y: (1 - p) * 0.17,
      sx: 0.47,
      sy: 0.47,
      color: tone,
      alpha: crest,
    });
  if ([6, 12, 26].includes(variant)) {
    ctx.save();
    ctx.fillStyle = tone;
    ctx.globalAlpha *= crest * 0.7;
    const span = variant === 6 ? frame.width * 0.52 : frame.width * 0.72 * p;
    ctx.fillRect(
      -span / 2,
      size * (variant === 26 ? -0.58 : 0.54),
      span,
      size * 0.022,
    );
    ctx.restore();
  }
  if (variant === 13 || variant === 14 || variant === 15 || variant === 25) {
    ctx.save();
    ctx.strokeStyle = tone;
    ctx.lineWidth = 0.022 * size;
    ctx.globalAlpha *= crest * 0.7;
    const edge = (0.42 + crest * 0.16) * size;
    if (variant === 13) {
      ctx.setLineDash([size * 0.045, size * 0.045]);
      ctx.strokeRect(-edge / 2, -edge, edge, edge * 2);
    } else if (variant === 14 || variant === 15) {
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        edge * 0.62,
        edge * 1.16,
        0,
        -Math.PI / 2,
        (p * 2 - 0.5) * Math.PI,
      );
      ctx.stroke();
      if (variant === 15) indicator(frame, p, 16);
    } else ctx.strokeRect(-edge / 2, -edge, edge, edge * 2);
    ctx.restore();
  }
}

function celebration(frame: PaintFrame, confetti: boolean) {
  const { p, from, to, size, ctx, seed, strength, accent } = frame;
  const colors = [accent, "#e9903d", "#d8649e", "#23aa85"];
  glyph(frame, from, { alpha: (1 - p) ** 3 });
  glyph(frame, to, { alpha: clamp(p * 1.7), glow: 0.17 * wave(p) });
  const t = clamp((p - 0.17) / 0.83);
  if (!t) return;
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + noise(seed, i) * 0.19;
    const distance = (0.3 + noise(seed + 7, i) * 0.69) * smooth(t) * strength;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance + t ** 2 * (confetti ? 0.58 : 0.19);
    ctx.save();
    ctx.globalAlpha *= (1 - t) * 0.9;
    ctx.fillStyle = ctx.strokeStyle = colors[i % colors.length];
    if (confetti) {
      ctx.translate(x * size, y * size);
      ctx.rotate(angle + t * Math.PI * 3);
      ctx.fillRect(-0.023 * size, -0.046 * size, 0.047 * size, 0.095 * size);
    } else {
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = size * 0.08;
      ctx.lineWidth = size * 0.021;
      ctx.beginPath();
      ctx.moveTo(
        (x - Math.cos(angle) * 0.13 * (1 - t)) * size,
        (y - Math.sin(angle) * 0.13 * (1 - t)) * size,
      );
      ctx.lineTo(x * size, y * size);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function paintSequence(frame: PaintFrame, variant: number) {
  const { p, index, count, seed } = frame;
  const center = Math.abs(index - (count - 1) / 2);
  const edge = Math.min(index, count - index - 1);
  const position = [
    index,
    index,
    Math.floor(index / 2),
    center * 2,
    edge * 2,
    noise(seed, index) * (count - 1),
    0,
    index,
    index % 2,
    index,
    index,
    index % 3,
    index,
    edge * 2,
    Math.floor(index / 3),
    Math.floor(index / 3) + (index % 3),
    index,
    noise(seed + 37, index) * (count - 1),
    Math.floor(index / 3),
    index % 3,
  ][variant];
  const spread =
    variant === 6
      ? 0
      : variant === 9
        ? 0.75
        : variant === 10
          ? 0.62
          : variant === 12
            ? 0.54
            : 0.45;
  const local = localProgress(p, position, count, spread);
  const next = { ...frame, p: local };
  if (local === 0) {
    glyph(frame, frame.from);
    return;
  }
  if (local === 1) {
    glyph(frame, frame.to);
    return;
  }
  if (variant === 1 || variant === 13)
    paintPhysics(next, variant === 1 ? 11 : 8);
  else if (variant === 8 || variant === 9 || variant === 6 || variant === 7)
    paintRoll(
      { ...next, axis: index % 2 === 0 ? frame.axis : "horizontal" },
      variant === 7 ? 17 : 15,
    );
  else if (variant === 10) paintReveal(next, 16);
  else if (variant === 12) paintReveal(next, 8);
  else paintReveal(next, [2, 15, 16, 18, 19].includes(variant) ? 18 : 2);
}

export function paintSpecial(frame: PaintFrame, variant: number) {
  const { p, from, to, size, ctx, seed, accent, width, strength } = frame;
  if (variant === 0) {
    paintSpatial(frame, 8);
    return;
  }
  if (variant <= 4) {
    paintRoll(frame, [0, 5, 10, 17, 6][variant]);
    return;
  }
  if (variant === 9) {
    paintParticles(frame, 19);
    indicator(frame, p, 17);
    return;
  }
  if (variant === 10 || variant === 11) {
    celebration(frame, variant === 11);
    return;
  }
  if (variant >= 14) {
    if (variant === 17 || variant === 19)
      indicator(frame, p, variant === 17 ? 18 : 16);
    else {
      const height = smooth(p) * 0.94;
      const w = (width / size) * 0.47;
      rectangle(frame, -w, 0.49 - height, w * 2, height, () =>
        glyph(frame, to, { color: accent, glow: 0.1 }),
      );
      ctx.save();
      ctx.globalAlpha *= 0.38 * wave(p);
      ctx.fillStyle = accent;
      if (variant === 15)
        ctx.fillRect(
          -width * 0.58,
          (0.42 - height) * size,
          0.04 * size,
          height * size,
        );
      if (variant === 16)
        ctx.fillRect(-width * 0.5, -0.54 * size, width * p, 0.055 * size);
      if (variant === 18)
        ctx.fillRect(-width * 0.5, (0.55 - height) * size, width, 0.038 * size);
      ctx.restore();
    }
    glyph(frame, to, { alpha: 0.38 + 0.62 * p });
    return;
  }
  if (variant === 7 || variant === 8) {
    glyph(frame, from, { alpha: (1 - p) ** 3 });
    glyph(frame, to, { alpha: clamp(p * 1.4) });
    for (let coin = 0; coin < 6; coin++) {
      const t = clamp(p * 1.6 - coin * 0.09);
      if (!t || (t === 1 && variant === 7)) continue;
      ctx.save();
      ctx.globalAlpha *= wave(p);
      ctx.fillStyle = coin % 2 ? "#f1a52f" : "#ffd67a";
      ctx.beginPath();
      ctx.ellipse(
        (noise(seed, coin) - 0.5) * width * 1.3,
        (variant === 7
          ? -1 + t ** 2 * 1.55
          : 0.48 - coin * 0.085 - (1 - t) * 0.72) * size,
        0.11 * size,
        (0.04 + Math.abs(Math.sin(t * 12)) * 0.035) * size,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }
    return;
  }
  if (variant === 13) {
    paintDigital(frame, 27);
    indicator(frame, p, 17);
    return;
  }
  paintPhysics(
    { ...frame, strength: strength * 0.9 },
    variant === 12 ? 18 : variant === 6 ? 14 : 2,
  );
  indicator(frame, p, 17);
}
