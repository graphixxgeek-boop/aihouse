import type { FaceExpression } from "./simulation";

// Rendu partagé du visage synthétique (couche 0 : expression, couche 1 : genre) — utilisé à la
// fois par la scène 3D (components/house-view.tsx, texture de sprite) et par la fiche latérale
// (app/page.tsx, petit canevas indépendant) pour qu'il n'existe qu'une seule source de dessin,
// jamais deux implémentations qui pourraient diverger (Article 2 de la charte).
//
// gender : traits fixes indépendants de l'état émotionnel (2026-09-17). Lia : sourcils plus fins et
// arqués, yeux plus grands, bouche plus étroite mais plus pleine, fard/cils/chevelure suggérée.
// Noé : sourcils plus épais et droits, bouche plus large. Aucun des deux n'a de corps ni de
// vêtements — seul le visage lui-même peut être expressif (règle assouplie, cf. lib/lia.ts).
const GENDER = {
  lia: { browW: .042, browArch: .62, eyeRX: .10, eyeRYMul: 1.08, mouthWMul: .82 },
  noe: { browW: .072, browArch: .18, eyeRX: .085, eyeRYMul: .92, mouthWMul: 1.08 },
} as const;

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

// Ressort critique-amorti-léger : jamais de saut d'un état à l'autre, un léger dépassement
// organique — la fluidité demandée explicitement le 2026-09-17 ("transitions ultra fluides,
// surtout pas de changements brusques"), partagée par tous les rendus du visage.
export class Spring {
  value: number; target: number; vel = 0;
  constructor(v: number, public stiff = 90, public damp = 13) { this.value = v; this.target = v; }
  set(t: number) { this.target = t; }
  step(dt: number) {
    const acc = (this.target - this.value) * this.stiff - this.vel * this.damp;
    this.vel += acc * dt; this.value += this.vel * dt;
  }
}
const NUMERIC_KEYS = ["browRaise", "furrow", "eyeOpen", "mouthCurve", "breathOpen", "jitterAmp", "angerLevel", "comfort", "attraction"] as const;
export type ExpressionSprings = Record<typeof NUMERIC_KEYS[number], Spring>;
export function makeExpressionSprings(initial: FaceExpression): ExpressionSprings {
  const springs = {} as ExpressionSprings;
  for (const k of NUMERIC_KEYS) springs[k] = new Spring(initial[k]);
  return springs;
}
export function stepExpressionSprings(springs: ExpressionSprings, target: FaceExpression, dt: number): FaceExpression {
  for (const k of NUMERIC_KEYS) { springs[k].set(target[k]); springs[k].step(dt); }
  const out = { sleeping: target.sleeping } as FaceExpression;
  for (const k of NUMERIC_KEYS) out[k] = springs[k].value;
  return out;
}

export function drawFace(ctx: CanvasRenderingContext2D, size: number, isLia: boolean, e: FaceExpression, mouthOpenExtra = 0) {
  const gender = isLia ? GENDER.lia : GENDER.noe;
  const baseColor = isLia ? "#ff3294" : "#05e3ec";
  const R = size * .34, cx = size / 2, cy = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(cx, cy);

  const glow = .18 + e.comfort / 100 * .22 + e.attraction / 100 * .16;
  const plate = ctx.createRadialGradient(0, -R * .15, R * .1, 0, 0, R);
  plate.addColorStop(0, isLia ? `rgba(255,205,225,${.22 + glow * .4})` : `rgba(210,255,250,${.14 + glow * .3})`);
  plate.addColorStop(.55, `rgba(${isLia ? "52,22,36" : "12,38,40"},.85)`);
  plate.addColorStop(1, "rgba(8,9,13,.96)");
  ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fillStyle = plate; ctx.fill();
  ctx.lineWidth = 1.4; ctx.strokeStyle = `rgba(255,255,255,${.06 + glow * .2})`; ctx.stroke();

  if (isLia) {
    // Chevelure suggérée : quatre mèches fluides et lumineuses, jamais une texture réaliste.
    const hairGrad = ctx.createLinearGradient(0, -R * 1.05, 0, R * .3);
    hairGrad.addColorStop(0, `rgba(255,170,205,${.5 + glow * .3})`);
    hairGrad.addColorStop(1, "rgba(255,170,205,0)");
    ctx.strokeStyle = hairGrad; ctx.lineCap = "round";
    for (const [off, wob, lw] of [[-1, .06, .05], [-.62, .1, .04], [.62, -.1, .04], [1, -.06, .05]] as const) {
      ctx.lineWidth = R * lw;
      ctx.beginPath();
      ctx.moveTo(off * R * .78, -R * .55);
      ctx.quadraticCurveTo(off * R * (.98 + wob), R * .05, off * R * .7, R * .95 + Math.abs(off) * R * .1);
      ctx.stroke();
    }
  }

  const jitter = () => (Math.random() - .5) * e.jitterAmp;
  const eyeDX = R * .32, eyeY = -R * .08;
  const lineColor = `rgba(255,255,255,${.68 + glow * .32})`;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = lineColor; ctx.shadowColor = baseColor; ctx.shadowBlur = 6 + glow * 10;

  // Sourcils : point interne/externe traités séparément, symétriques par construction — furrow
  // rapproche et abaisse toujours les points internes (jamais l'inverse), quel que soit le côté.
  ctx.lineWidth = R * gender.browW;
  ([-1, 1] as const).forEach(side => {
    const x = side * eyeDX + jitter() * 2, yBase = eyeY - R * .34 - e.browRaise * R * .09;
    const innerY = yBase + e.furrow * R * .11 + jitter();
    const outerY = yBase - e.furrow * R * .03 + jitter();
    const midY = yBase - R * (.045 + gender.browArch * .05) * (1 - e.furrow * .5) + jitter();
    ctx.beginPath();
    ctx.moveTo(x - side * R * .16, innerY);
    ctx.quadraticCurveTo(x, midY, x + side * R * .16, outerY);
    ctx.stroke();
  });

  if (isLia) {
    ([-1, 1] as const).forEach(side => {
      const x = side * eyeDX * 1.05, y = eyeY + R * .16;
      const blush = ctx.createRadialGradient(x, y, 0, x, y, R * .19);
      blush.addColorStop(0, `rgba(255,140,185,${.3 + glow * .2})`);
      blush.addColorStop(1, "rgba(255,140,185,0)");
      ctx.fillStyle = blush; ctx.beginPath(); ctx.arc(x, y, R * .19, 0, 6.283); ctx.fill();
    });
  }

  // Yeux : taille/forme fixées par le genre, ouverture par l'émotion/fatigue/sommeil.
  ctx.lineWidth = R * .05;
  ([-1, 1] as const).forEach(side => {
    const x = side * eyeDX + jitter(), y = eyeY + jitter() * .6;
    const ry = R * .16 * gender.eyeRYMul * e.eyeOpen + R * .015;
    ctx.beginPath();
    ctx.ellipse(x, y, R * gender.eyeRX, Math.max(ry, R * .012), 0, 0, 6.283);
    ctx.stroke();
    if (isLia) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,195,220,${.85 + glow * .15})`; ctx.lineWidth = R * .032;
      ctx.beginPath(); ctx.ellipse(x, y - ry * .6, R * gender.eyeRX * 1.02, R * .026, 0, 3.3, 6.2); ctx.stroke();
      const flickX = x + side * R * gender.eyeRX * 1.0, flickY = y - ry * .8;
      ctx.beginPath(); ctx.moveTo(flickX, flickY); ctx.lineTo(flickX + side * R * .075, flickY - R * .055); ctx.stroke();
      ctx.restore();
    }
    if (e.eyeOpen > .14) {
      ctx.beginPath(); ctx.arc(x, y, R * .032, 0, 6.283);
      ctx.fillStyle = lineColor; ctx.fill();
    }
  });

  // Bouche : largeur fixée par le genre, courbe/ouverture par l'émotion + la parole (visèmes).
  const mouthOpenBase = clamp(e.breathOpen + mouthOpenExtra, 0, 1);
  ctx.lineWidth = isLia ? R * .085 : R * .06;
  ctx.strokeStyle = isLia ? `rgba(255,150,190,${.9 + glow * .1})` : lineColor;
  ctx.shadowColor = isLia ? "#ff5fa3" : baseColor;
  ctx.shadowBlur = isLia ? 10 + glow * 14 : 6 + glow * 10;
  const my = R * .34, mw = R * .34 * gender.mouthWMul;
  const mouthMidY = my + e.mouthCurve * R * .32 + mouthOpenBase * R * .5;
  ctx.beginPath();
  ctx.moveTo(-mw + jitter(), my + jitter());
  ctx.quadraticCurveTo(0, mouthMidY + jitter(), mw + jitter(), my + jitter());
  if (mouthOpenBase > .05) {
    ctx.quadraticCurveTo(0, my + e.mouthCurve * R * .32 - mouthOpenBase * R * .28 + jitter(), -mw + jitter(), my + jitter());
    ctx.closePath(); ctx.fillStyle = "rgba(6,7,10,.85)"; ctx.fill();
  }
  ctx.stroke();
  if (isLia && mouthOpenBase <= .05) {
    ctx.beginPath(); ctx.strokeStyle = `rgba(255,255,255,${.35 + glow * .2})`; ctx.lineWidth = R * .02;
    ctx.moveTo(-mw * .35, mouthMidY - R * .02); ctx.quadraticCurveTo(0, mouthMidY - R * .05, mw * .35, mouthMidY - R * .02); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}
