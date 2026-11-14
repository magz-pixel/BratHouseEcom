import { useId, type CSSProperties } from "react";
import { colorOf, normalizeConfig, type SkinId, type WigConfig } from "@shared/wigBuilder";

/*
 * Procedural, layered SVG wig preview.
 * Each customisation option maps to a layer, so this is the placeholder for the
 * real layered PNG renders/photos — swap any layer for an <image> later.
 *
 * Layer order (back → front):
 *   back hair → bust → head/face → crown cap → side curtains → fringe → hairline detail
 *   → part → accessories → lace X-ray overlay
 */

const CX = 200;
const CY = 185; // head centre
const HRX = 66; // head half-width
const HRY = 84; // head half-height
const CHIN = CY + HRY;

export const SKINS: Record<SkinId, { base: string; dark: string; light: string; label: string }> = {
  deep: { base: "#5b3420", dark: "#2f190e", light: "#8a5636", label: "Deep" },
  rich: { base: "#7d4a2c", dark: "#4a2914", light: "#b07a52", label: "Rich" },
  warm: { base: "#a06a44", dark: "#6b4027", light: "#d29e74", label: "Warm" },
};

type Pt = [number, number];

/** Catmull-Rom spline through points, as a cubic-bezier SVG path fragment. */
function smooth(points: Pt[], closed = false): string {
  if (points.length < 2) return "";
  const pts = closed ? [points[points.length - 1], ...points, points[0], points[1]] : [points[0], ...points, points[points.length - 1]];
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? `${d} Z` : d;
}

export const lengthToY = (length: number) => 296 + (length - 10) * 10;

type Geo = ReturnType<typeof geometry>;

function geometry(c: WigConfig) {
  const density = c.density === 150 ? 0.93 : c.density === 200 ? 1.08 : 1;
  const spread = { straight: 1, body: 1.08, curly: 1.2, kinky: 1.38, bob: 1.04 }[c.texture];
  const v = density * spread;
  const thick = 7 + (v - 0.93) * 48; // hair thickness above scalp
  const endY = lengthToY(c.length);
  const flare = c.texture === "bob" ? 0.04 : c.texture === "kinky" ? 0.26 : c.texture === "curly" ? 0.2 : 0.13 + (v - 1) * 0.2;
  const halfWidth = (y: number) => {
    const base = HRX + thick + 4;
    if (y <= CY) return base;
    const t = y - CY;
    return base + t * flare * density + (c.texture === "bob" ? Math.min(t, 60) * 0.12 : 0);
  };
  /** Outward edge displacement for the texture at height y (side = ±1 phase). */
  const disp = (y: number, side: number) => Math.min(1, Math.max(0, (y - CY) / 40)) * rawDisp(y, side);
  const rawDisp = (y: number, side: number) => {
    const t = y - CY;
    switch (c.texture) {
      case "body": return 7 * density * Math.sin(t / 34 * Math.PI + (side > 0 ? 0.9 : 0));
      case "curly": return 7 * Math.abs(Math.sin(t / 15 * Math.PI + (side > 0 ? 0.5 : 0))) + 3 * Math.sin(t / 47);
      case "kinky": return 5 * Math.abs(Math.sin(t / 8 * Math.PI + side)) + 4 * Math.abs(Math.sin(t / 23));
      default: return 0;
    }
  };
  const bottom = (x: number, half: number) => {
    const n = (x - CX) / Math.max(half, 1);
    switch (c.texture) {
      case "straight": return 10 * (1 - n * n);
      case "body": return 6 * Math.sin(x / 26) + 6;
      case "curly": return 9 * Math.abs(Math.sin(x / 11)) + 2;
      case "kinky": return 7 * Math.abs(Math.sin(x / 7)) + 4 * Math.abs(Math.sin(x / 19));
      case "bob": return -10 * n * n; // curves under at the sides
    }
  };
  const step = c.texture === "kinky" ? 5 : c.texture === "curly" ? 6 : 12;
  return { v, thick, endY, halfWidth, disp, bottom, step, density };
}

const faceHalf = (y: number) => {
  const n = (y - CY) / HRY;
  if (Math.abs(n) >= 1) return 0;
  // egg shape: narrower towards chin
  return HRX * Math.sqrt(1 - n * n) * (n > 0 ? 1 - n * 0.18 : 1);
};

function backHairPath(g: Geo) {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let y = CY; y <= g.endY; y += g.step) {
    left.push([CX - g.halfWidth(y) - g.disp(y, -1), y]);
    right.push([CX + g.halfWidth(y) + g.disp(y, 1), y]);
  }
  const endHalf = g.halfWidth(g.endY);
  const bottomPts: Pt[] = [];
  const bStep = g.step;
  for (let x = CX + endHalf; x >= CX - endHalf; x -= bStep) bottomPts.push([x, g.endY + g.bottom(x, endHalf)]);
  const top: Pt[] = [];
  const r = HRX + g.thick + 4;
  const ry = HRY + g.thick + 2;
  const bumps = g.disp === undefined ? 0 : 1;
  for (let a = 180; a >= 0; a -= g.step > 8 ? 12 : 6) {
    const rad = (a * Math.PI) / 180;
    const wobble = bumps * (g.step < 8 ? 4 * Math.abs(Math.sin(a / 7)) : 0);
    top.push([CX + (r + wobble) * Math.cos(rad), CY - (ry + wobble) * Math.sin(rad)]);
  }
  // right side going down, bottom right→left, left side going up, over the top (left→right)
  return `${smooth([...right, ...bottomPts, ...left.reverse()])} ${smooth(top).replace("M", "L")} Z`;
}

function curtainPath(g: Geo, side: -1 | 1, isBob: boolean) {
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  const startY = 150;
  const end = g.endY - 2;
  for (let y = startY; y <= end; y += g.step) {
    outer.push([CX + side * (g.halfWidth(y) * 0.94 + g.disp(y, side) * 0.8), y]);
    let ix: number;
    if (y < CHIN - 6) ix = faceHalf(y) - 6;
    else ix = 30 + (y - CHIN) * (isBob ? 0.25 : 0.14);
    inner.push([CX + side * Math.max(ix, 18), y]);
  }
  const endOuter: Pt = [CX + side * (g.halfWidth(end) * 0.94), end + (isBob ? -6 : g.bottom(CX + side * g.halfWidth(end) * 0.94, g.halfWidth(end)))];
  const endInner: Pt = [inner[inner.length - 1][0], end + (isBob ? 4 : 2)];
  return `${smooth([...outer, endOuter])} L${endInner[0].toFixed(1)} ${endInner[1].toFixed(1)} ${smooth(inner.reverse()).replace("M", "L")} Z`;
}

function capPath(g: Geo, part: WigConfig["part"]) {
  const r = HRX + g.thick;
  const ry = HRY + g.thick;
  const pts: Pt[] = [];
  for (let a = 196; a >= -16; a -= g.step > 8 ? 10 : 5) {
    const rad = (a * Math.PI) / 180;
    const wobble = g.step < 8 ? 3.5 * Math.abs(Math.sin(a / 6)) : 0;
    pts.push([CX + (r + wobble) * Math.cos(rad), CY - (ry + wobble) * Math.sin(rad)]);
  }
  const offset = part === "side" ? -8 : 0;
  // hairline: temple → forehead → temple
  const hairline: Pt[] = [[CX + 64, 210], [CX + 60, 182], [CX + 50, 154], [CX + 28 + offset * 0.3, 133], [CX + offset * 0.6, 127], [CX - 28 + offset * 0.3, 133], [CX - 50, 154], [CX - 60, 182], [CX - 64, 210]];
  return `${smooth(pts)} ${smooth(hairline).replace("M", "L")} Z`;
}

function strands(g: Geo, side: -1 | 1, count: number) {
  const lines: string[] = [];
  for (let i = 1; i <= count; i++) {
    const f = i / (count + 1);
    const pts: Pt[] = [];
    for (let y = 160; y <= g.endY - 8; y += 10) {
      const outerX = g.halfWidth(y) * 0.94 + g.disp(y, side) * 0.8;
      const innerX = y < CHIN - 6 ? faceHalf(y) - 6 : 30 + (y - CHIN) * 0.14;
      pts.push([CX + side * (innerX + (outerX - innerX) * f), y]);
    }
    if (pts.length > 1) lines.push(smooth(pts));
  }
  return lines;
}

function fringePath(c: WigConfig, g: Geo) {
  if (c.extras.includes("bangs")) {
    const pts: Pt[] = [[CX - 60, 182], [CX - 58, 140], [CX - 30, 118], [CX, 113], [CX + 30, 118], [CX + 58, 140], [CX + 60, 182]];
    const hem: Pt[] = [];
    for (let x = CX + 58; x >= CX - 58; x -= c.texture === "curly" || c.texture === "kinky" ? 7 : 14) {
      const wav = c.texture === "curly" || c.texture === "kinky" ? 5 * Math.abs(Math.sin(x / 6)) : c.texture === "body" ? 3 * Math.sin(x / 12) : 0;
      hem.push([x, 166 + wav + Math.abs(x - CX) * 0.08]);
    }
    return [smooth([...pts, ...hem], true)];
  }
  if (c.extras.includes("curtain")) {
    const sweep = (s: -1 | 1) => smooth([[CX, 126], [CX + s * 22, 140], [CX + s * 42, 168], [CX + s * 54, 206], [CX + s * 66, 214], [CX + s * 64, 160], [CX + s * 40, 126], [CX + s * 6, 120]], true);
    return [sweep(-1), sweep(1)];
  }
  void g;
  return [];
}

export type WigRenderProps = {
  config: WigConfig;
  view?: "front" | "back";
  mode?: "styled" | "cap";
  skin?: SkinId;
  showLace?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
  /** Hide the shoulders/bust (used for small thumbnails). */
  compact?: boolean;
};

export function WigRender({ config: raw, view = "front", mode = "styled", skin = "rich", showLace = false, className, style, title, compact = false }: WigRenderProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = normalizeConfig(raw);
  const g = geometry(c);
  const col = colorOf(c.color).swatch;
  const sk = SKINS[skin];
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const isBob = c.texture === "bob";
  const hairFill = c.color === "highlight" ? url("stripes") : url("hair");
  const styled = mode === "styled";
  const back = view === "back";
  const isChrome = c.color === "chrome";
  const strandCount = c.texture === "kinky" ? 0 : c.texture === "curly" ? 3 : 5;
  const viewBox = compact ? "40 60 320 470" : "0 40 400 500";

  return (
    <svg viewBox={viewBox} className={className} style={style} role="img" aria-label={title || "Wig preview"} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id("hair")} x1="0" y1="90" x2="0" y2={g.endY + 10} gradientUnits="userSpaceOnUse">
          {c.color === "ombre" ? (
            <>
              <stop offset="0" stopColor={col.dark} />
              <stop offset="0.38" stopColor={col.dark} />
              <stop offset="0.7" stopColor={col.base} />
              <stop offset="1" stopColor={col.light} />
            </>
          ) : (
            <>
              <stop offset="0" stopColor={col.dark} />
              <stop offset="0.3" stopColor={col.base} />
              <stop offset={isChrome ? "0.55" : "0.62"} stopColor={isChrome ? col.light : col.base} />
              <stop offset={isChrome ? "0.75" : "0.85"} stopColor={isChrome ? col.dark : col.dark} stopOpacity={isChrome ? 1 : 0.85} />
              <stop offset="1" stopColor={col.base} />
            </>
          )}
        </linearGradient>
        <linearGradient id={id("ribbon")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#e2a65c" stopOpacity="0" />
          <stop offset="0.5" stopColor="#efbd75" stopOpacity="0.95" />
          <stop offset="1" stopColor="#e2a65c" stopOpacity="0" />
        </linearGradient>
        <pattern id={id("stripes")} width="34" height="600" patternUnits="userSpaceOnUse" patternTransform="rotate(3)">
          <rect width="34" height="600" fill={url("hair")} />
          <rect x="5" width="8" height="600" fill={url("ribbon")} opacity="0.7" />
          <rect x="22" width="5" height="600" fill={url("ribbon")} opacity="0.45" />
        </pattern>
        <linearGradient id={id("sheen")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.3" stopColor="#fff" stopOpacity={isChrome ? 0.55 : 0.18} />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.72" stopColor="#fff" stopOpacity={isChrome ? 0.45 : 0.12} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("crownGloss")} cx="0.42" cy="0.22" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity={isChrome ? 0.75 : 0.3} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("skin")} cx="0.42" cy="0.35" r="0.75">
          <stop offset="0" stopColor={sk.light} />
          <stop offset="0.55" stopColor={sk.base} />
          <stop offset="1" stopColor={sk.dark} />
        </radialGradient>
        <linearGradient id={id("bust")} x1="0" x2="0" y1="330" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={sk.base} />
          <stop offset="1" stopColor={sk.dark} />
        </linearGradient>
        <linearGradient id={id("lips")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c4466f" />
          <stop offset="1" stopColor="#8e1f45" />
        </linearGradient>
        <pattern id={id("mesh")} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#3b2a24" />
          <circle cx="3" cy="3" r="1.1" fill="#58423a" />
        </pattern>
        <filter id={id("soft")} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4" /></filter>
        <filter id={id("shadow")} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#3a0a22" floodOpacity="0.28" /></filter>
      </defs>

      <g filter={url("shadow")}>
        {/* BACK HAIR */}
        {styled && <path d={backHairPath(g)} fill={hairFill} />}
        {styled && <path d={backHairPath(g)} fill={url("sheen")} />}

        {/* BUST */}
        {!compact && <path d="M60 476 C62 404 104 356 160 342 L240 342 C296 356 338 404 340 476 Z" fill={url("bust")} />}
        <path d="M177 246 C178 292 173 322 160 344 L240 344 C227 322 222 292 223 246 Z" fill={url("bust")} />
        <path d="M168 300 C185 318 215 318 232 300" stroke={sk.dark} strokeOpacity="0.35" strokeWidth="3" fill="none" />

        {/* HEAD */}
        <ellipse cx={CX - HRX + 1} cy={196} rx={8} ry={16} fill={sk.base} />
        <ellipse cx={CX + HRX - 1} cy={196} rx={8} ry={16} fill={sk.base} />
        <path d={`M${CX} ${CY - HRY} C${CX + 46} ${CY - HRY} ${CX + HRX + 2} ${CY - 44} ${CX + HRX} ${CY} C${CX + HRX - 2} ${CY + 44} ${CX + 42} ${CHIN - 2} ${CX} ${CHIN} C${CX - 42} ${CHIN - 2} ${CX - HRX + 2} ${CY + 44} ${CX - HRX} ${CY} C${CX - HRX - 2} ${CY - 44} ${CX - 46} ${CY - HRY} ${CX} ${CY - HRY} Z`} fill={url("skin")} />

        {!back && (
          <g>
            {/* brows */}
            <path d="M160 168 Q174 160 188 166" stroke="#1a0e0a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d="M212 166 Q226 160 240 168" stroke="#1a0e0a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            {/* closed eyes + lashes */}
            <path d="M163 190 Q175 198 187 190" stroke="#1a0e0a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M213 190 Q225 198 237 190" stroke="#1a0e0a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M166 193 l-4 5 M171 196 l-2 6 M177 197 l0 6 M183 195 l2 5" stroke="#1a0e0a" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M217 195 l-2 5 M223 197 l0 6 M229 196 l2 6 M234 193 l4 5" stroke="#1a0e0a" strokeWidth="1.6" strokeLinecap="round" />
            {/* shimmer lids */}
            <path d="M164 188 Q175 180 186 188" stroke="#ff8cc6" strokeOpacity="0.55" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M214 188 Q225 180 236 188" stroke="#ff8cc6" strokeOpacity="0.55" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* nose */}
            <path d="M194 222 Q200 228 206 222" stroke={sk.dark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {/* blush */}
            <ellipse cx="162" cy="218" rx="14" ry="7" fill="#ff1493" opacity="0.14" />
            <ellipse cx="238" cy="218" rx="14" ry="7" fill="#ff1493" opacity="0.14" />
            {/* lips */}
            <path d="M184 243 Q192 237 200 241 Q208 237 216 243 Q208 254 200 254 Q192 254 184 243 Z" fill={url("lips")} />
            <path d="M192 246 Q200 249 208 246" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* WIG CAP (before) */}
        {!styled && (
          <g>
            <path d={capPath({ ...g, thick: 2, step: 12 }, "middle")} fill={url("mesh")} opacity="0.95" />
            <path d="M138 196 C140 150 166 124 200 122 C234 124 260 150 262 196" stroke="#2a1d18" strokeWidth="3" fill="none" />
          </g>
        )}

        {styled && !back && (
          <g>
            {/* crown cap */}
            <path d={capPath(g, c.part)} fill={hairFill} />
            <path d={capPath(g, c.part)} fill={url("crownGloss")} />
            {/* side curtains */}
            <path d={curtainPath(g, -1, isBob)} fill={hairFill} />
            <path d={curtainPath(g, 1, isBob)} fill={hairFill} />
            <path d={curtainPath(g, -1, isBob)} fill={url("sheen")} opacity="0.8" />
            <path d={curtainPath(g, 1, isBob)} fill={url("sheen")} opacity="0.8" />
            {strandCount > 0 && [...strands(g, -1, strandCount), ...strands(g, 1, strandCount)].map((d, i) => <path key={i} d={d} stroke={col.light} strokeOpacity={c.color === "black" ? 0.22 : 0.3} strokeWidth="1.2" fill="none" />)}
            {(c.texture === "curly" || c.texture === "kinky") && <CoilTexture g={g} color={col.light} />}

            {/* hairline detail */}
            {c.hairline !== "natural" && <path d="M138 204 C140 158 166 130 200 127 C234 130 260 158 262 204" stroke={col.dark} strokeOpacity="0.55" strokeWidth="4" fill="none" filter={url("soft")} />}
            {c.hairline === "natural" && <path d="M140 200 C142 158 166 131 200 128 C234 131 258 158 260 200" stroke={col.dark} strokeWidth="1.6" strokeDasharray="2 2" fill="none" opacity="0.45" />}
            {c.hairline === "babyhairs" && (
              <g stroke={col.dark} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.95">
                <path d="M142 168 c6 4 9 10 4 15 c-4 4 -9 0 -6 -4 M139 186 c7 2 10 8 6 12 c-3 3 -7 0 -5 -3 M150 150 c4 5 6 11 2 14" />
                <path d="M258 168 c-6 4 -9 10 -4 15 c4 4 9 0 6 -4 M261 186 c-7 2 -10 8 -6 12 c3 3 7 0 5 -3 M250 150 c-4 5 -6 11 -2 14" />
                <path d="M186 130 c2 4 0 7 -3 8 M214 130 c-2 4 0 7 3 8" />
              </g>
            )}

            {/* part */}
            {!c.extras.includes("bangs") && (c.part === "middle"
              ? <path d={`M200 128 L200 ${CY - HRY - g.thick * 0.4}`} stroke={sk.light} strokeOpacity="0.7" strokeWidth="2.2" strokeLinecap="round" />
              : <path d={`M182 130 Q178 112 176 ${CY - HRY - g.thick * 0.3}`} stroke={sk.light} strokeOpacity="0.7" strokeWidth="2.2" strokeLinecap="round" fill="none" />)}

            {/* fringe */}
            {fringePath(c, g).map((d, i) => <g key={i}><path d={d} fill={hairFill} /><path d={d} fill={url("crownGloss")} /></g>)}
          </g>
        )}

        {/* BACK VIEW: full coverage */}
        {styled && back && (
          <g>
            <ellipse cx={CX} cy={CY + 4} rx={HRX + g.thick} ry={HRY + g.thick} fill={hairFill} />
            <ellipse cx={CX} cy={CY + 4} rx={HRX + g.thick} ry={HRY + g.thick} fill={url("crownGloss")} />
            <path d={backHairPath(g)} fill={hairFill} opacity="0.92" />
            <path d={backHairPath(g)} fill={url("sheen")} />
            {strandCount > 0 && [...strands(g, -1, strandCount + 2), ...strands(g, 1, strandCount + 2)].map((d, i) => <path key={i} d={d} stroke={col.light} strokeOpacity="0.25" strokeWidth="1.2" fill="none" />)}
            {(c.texture === "curly" || c.texture === "kinky") && <CoilTexture g={g} color={col.light} full />}
          </g>
        )}

        {/* ACCESSORIES */}
        {styled && c.extras.includes("scarf") && (
          <g>
            <path d={`M${CX - HRX - g.thick + 2} 160 C${CX - 40} ${110 - g.thick} ${CX + 40} ${110 - g.thick} ${CX + HRX + g.thick - 2} 160`} stroke="#ff1493" strokeWidth="15" fill="none" strokeLinecap="round" />
            <path d={`M${CX - HRX - g.thick + 2} 160 C${CX - 40} ${110 - g.thick} ${CX + 40} ${110 - g.thick} ${CX + HRX + g.thick - 2} 160`} stroke="#ffb6d9" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d={`M${CX + HRX + g.thick - 6} 158 l22 -10 l-6 18 z M${CX + HRX + g.thick - 6} 162 l18 16 l-18 2 z`} fill="#e0117f" />
          </g>
        )}
        {styled && c.extras.includes("clips") && (
          <g>
            {[[CX - 38, 128 - g.thick * 0.5, -18], [CX + 42, 132 - g.thick * 0.5, 16], [CX - 58, 170, -30]].map(([x, y, r], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
                <path d="M0 0 C-10 -12 -18 -4 -12 4 C-16 10 -6 14 0 4 C6 14 16 10 12 4 C18 -4 10 -12 0 0 Z" fill={i === 1 ? "#cfd0dc" : "#ff4fae"} stroke="#fff" strokeWidth="1.2" />
                <circle r="1.8" fill="#fff" />
              </g>
            ))}
          </g>
        )}

        {/* LACE X-RAY */}
        {showLace && styled && !back && (
          <g className="lace-xray" fill="none" strokeWidth="2" strokeDasharray="5 4">
            {c.lace === "closure5x5" ? (
              <rect x={CX - 26} y={CY - HRY - 6} width="52" height="44" rx="6" stroke="#fff" />
            ) : (
              <path d={`M${CX - HRX - 4} 210 C${CX - HRX} 120 ${CX - 30} ${CY - HRY - 10} ${CX} ${CY - HRY - 10} C${CX + 30} ${CY - HRY - 10} ${CX + HRX} 120 ${CX + HRX + 4} 210 L${CX + HRX - 10} 210 C${CX + HRX - 16} 140 ${CX + 30} ${CY - HRY + 22} ${CX} ${CY - HRY + 22} C${CX - 30} ${CY - HRY + 22} ${CX - HRX + 16} 140 ${CX - HRX + 10} 210 Z`} stroke="#fff" />
            )}
          </g>
        )}
      </g>
    </svg>
  );
}

function CoilTexture({ g, color, full = false }: { g: Geo; color: string; full?: boolean }) {
  const dots: Pt[] = [];
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let y = 150; y < g.endY - 6; y += 9) {
    const half = g.halfWidth(y) * 0.9;
    for (let k = 0; k < 4; k++) {
      const x = CX + (rnd() * 2 - 1) * half;
      const inFace = !full && y < CHIN + 10 && Math.abs(x - CX) < faceHalf(y) + 4;
      const onChest = !full && y >= CHIN && Math.abs(x - CX) < 30 + (y - CHIN) * 0.14;
      if (!inFace && !onChest) dots.push([x, y]);
    }
  }
  return <g stroke={color} strokeOpacity="0.32" strokeWidth="1.3" fill="none">{dots.map(([x, y], i) => <path key={i} d={`M${x.toFixed(1)} ${y.toFixed(1)} a3.2 3.2 0 1 1 3 3`} />)}</g>;
}

/** Static vanity pedestal that sits under the rotating bust. */
export function Pedestal({ bonnet = false }: { bonnet?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 400 90" className="wig-pedestal" aria-hidden="true">
      <defs>
        <linearGradient id={`chrome-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#8a8a99" />
          <stop offset="0.25" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#a5a5b3" />
          <stop offset="0.75" stopColor="#f4f4f8" />
          <stop offset="1" stopColor="#7d7d8b" />
        </linearGradient>
        <radialGradient id={`satin-${uid}`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffd3ea" />
          <stop offset="0.6" stopColor="#ff69b4" />
          <stop offset="1" stopColor="#c2116f" />
        </radialGradient>
      </defs>
      <rect x="184" y="0" width="32" height="44" fill={`url(#chrome-${uid})`} />
      <ellipse cx="200" cy="56" rx="104" ry="18" fill={`url(#chrome-${uid})`} />
      <ellipse cx="200" cy="50" rx="96" ry="12" fill="#fff" opacity="0.55" />
      {bonnet && (
        <g className="pedestal-bonnet">
          <path d="M300 54 C296 28 318 14 340 16 C362 18 376 34 370 56 Z" fill={`url(#satin-${uid})`} />
          <path d="M296 56 C320 62 352 62 374 56" stroke="#c2116f" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M318 26 C328 20 340 20 350 24" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
