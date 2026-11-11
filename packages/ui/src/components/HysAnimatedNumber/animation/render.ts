import { glyph, wave, type PaintFrame } from "./paint";
import { paintRoll } from "./rolling";
import { paintSpatial } from "./spatial";
import { paintMorph } from "./morph";
import { paintReveal } from "./reveal";
import { paintPhysics } from "./physics";
import { paintParticles } from "./particles";
import { paintDigital } from "./digital";
import { paintData, paintSequence, paintSpecial } from "./scenarios";

const painters = {
  rolling: paintRoll,
  spatial: paintSpatial,
  morph: paintMorph,
  reveal: paintReveal,
  physics: paintPhysics,
  particles: paintParticles,
  digital: paintDigital,
  data: paintData,
  sequence: paintSequence,
  special: paintSpecial,
};

export function paintNumberAnimation(frame: PaintFrame) {
  const { plan, digit, from, to, p, strength } = frame;
  if (plan.entry) {
    painters[plan.entry.category](frame, plan.entry.variant);
    return;
  }
  switch (plan.effect) {
    case "odometer":
      paintRoll(frame, 19);
      return;
    case "wheel":
      paintRoll(frame, 6);
      return;
    case "slot":
      paintRoll(frame, 10);
      return;
    case "random":
      paintDigital(frame, 9);
      return;
    case "scramble":
      paintDigital(frame, 6);
      return;
    case "flip":
      paintSpatial(frame, 14);
      return;
    case "appear":
      paintReveal(frame, 0);
      return;
    case "disappear":
      glyph(frame, from, { alpha: 1 - p, y: -0.3 * p });
      glyph(frame, to, { alpha: p });
      return;
    case "fade":
      glyph(frame, from, { alpha: 1 - p });
      glyph(frame, to, { alpha: p });
      return;
    case "scale":
      paintSpatial(frame, 10);
      return;
    case "bounce":
      paintPhysics(frame, 2);
      return;
    case "spring":
      paintPhysics(frame, 3);
      return;
    case "slide":
      paintReveal(frame, 7);
      return;
    case "blur":
      glyph(frame, digit, { blur: (1 - p) * 0.16 * strength });
      return;
    case "flash":
      glyph(frame, digit, { alpha: 1 - 0.3 * wave(p) });
      return;
    case "highlight":
      glyph(frame, digit, { glow: 0.22 * wave(p), color: frame.accent });
      return;
    case "gradient":
      glyph(frame, digit, {
        color: p < 0.5 ? frame.accent : frame.color,
        glow: 0.1 * wave(p),
      });
      return;
    default:
      glyph(frame, digit);
  }
}
