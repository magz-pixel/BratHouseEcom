import type { WigProduct } from "./catalog";
import { wigProducts } from "./catalog";

/* ------------------------------------------------------------------ */
/*  BRATHOUSE "Build Your Wig" — config model, options, pricing, URL   */
/* ------------------------------------------------------------------ */

export type LaceId = "closure5x5" | "frontal13x4" | "glueless13x4";
export type GradeId = "12A" | "14A";
export type PartId = "middle" | "side";
export type TextureId = "straight" | "body" | "curly" | "kinky" | "bob";
export type ColorId =
  | "black" | "brown" | "honey" | "burgundy" | "ginger" | "highlight" | "ombre" | "pink" | "chrome"
  | "blue" | "lilac" | "cherry";
export type DensityId = 150 | 180 | 200;
export type HairlineId = "natural" | "plucked" | "babyhairs";
export type ExtraId = "knots" | "precut" | "bangs" | "curtain" | "clips" | "scarf" | "bonnet";
export type SkinId = "deep" | "rich" | "warm";

export type WigConfig = {
  name: string;
  lace: LaceId;
  grade: GradeId;
  part: PartId;
  texture: TextureId;
  length: number; // inches, even numbers 10–30
  color: ColorId;
  density: DensityId;
  hairline: HairlineId;
  extras: ExtraId[];
};

export type CategoryId = "lace" | "texture" | "length" | "color" | "density" | "hairline" | "extras";

export const CATEGORIES: { id: CategoryId; label: string; icon: string; hint: string }[] = [
  { id: "lace", label: "Lace & Cap", icon: "◇", hint: "How the wig sits and how you can part it." },
  { id: "texture", label: "Texture", icon: "∿", hint: "Sleek, wavy, curly or full-volume kinky." },
  { id: "length", label: "Length", icon: "↕", hint: "Drag it — watch her grow." },
  { id: "color", label: "Color", icon: "◐", hint: "From 1B natural black to full chrome." },
  { id: "density", label: "Density", icon: "▦", hint: "How full the hair is from root to tip." },
  { id: "hairline", label: "Hairline", icon: "⌒", hint: "The detail that makes it undetectable." },
  { id: "extras", label: "Extras", icon: "✦", hint: "Finishing touches and accessories." },
];

export type Option<T> = { id: T; label: string; note: string; price: number; locked?: number };

export const LACE_OPTIONS: Option<LaceId>[] = [
  { id: "closure5x5", label: "5×5 Closure", note: "Part in a 5×5 square. Easy, beginner-friendly.", price: -120 },
  { id: "frontal13x4", label: "13×4 Frontal", note: "Ear-to-ear lace. Part anywhere, pull it back.", price: -80 },
  { id: "glueless13x4", label: "13×4 Glueless", note: "Ear-to-ear lace, elastic band. No glue, no drama.", price: 0 },
];

export const GRADE_OPTIONS: Option<GradeId>[] = [
  { id: "12A", label: "12A hair", note: "Our core grade. Soft, full, great value.", price: 0 },
  { id: "14A", label: "14A hair", note: "Top grade. Longer life, silkier feel.", price: 1000 },
];

export const PART_OPTIONS: Option<PartId>[] = [
  { id: "middle", label: "Middle part", note: "Classic and symmetrical.", price: 0 },
  { id: "side", label: "Side part", note: "Deep side sweep. Best on 13×4.", price: 0 },
];

export const TEXTURE_OPTIONS: Option<TextureId>[] = [
  { id: "straight", label: "Straight", note: "Bone straight, glassy shine.", price: 0 },
  { id: "body", label: "Body Wave", note: "Soft S-waves, effortless volume.", price: 100 },
  { id: "curly", label: "Curly", note: "Bouncy defined curls.", price: 200 },
  { id: "kinky", label: "Afro Kinky", note: "Full, coily, natural-looking volume.", price: 200 },
  { id: "bob", label: "Bob", note: "Blunt cut, 10–14\". Sharp and chic.", price: 0 },
];

export type ColorSwatch = { base: string; dark: string; light: string };
export const COLOR_OPTIONS: (Option<ColorId> & { swatch: ColorSwatch; perInch?: number })[] = [
  { id: "black", label: "Natural Black", note: "1B — goes with everything.", price: 0, swatch: { base: "#1d1716", dark: "#060404", light: "#55474a" } },
  { id: "brown", label: "Natural Brown", note: "#4 — warm chocolate.", price: 100, swatch: { base: "#4a2b1c", dark: "#24130b", light: "#86593f" } },
  { id: "honey", label: "Honey Blonde", note: "#27 — sun-kissed glow.", price: 350, swatch: { base: "#c4843d", dark: "#8a5422", light: "#f2c47c" } },
  { id: "burgundy", label: "Burgundy", note: "99J — wine-night energy.", price: 250, swatch: { base: "#5c1326", dark: "#2c050f", light: "#a33350" } },
  { id: "ginger", label: "Ginger", note: "Burnt orange, our signature.", price: 250, swatch: { base: "#c25418", dark: "#7a2f0a", light: "#ee9150" } },
  { id: "highlight", label: "Highlights", note: "1B with honey ribbons.", price: 100, perInch: 5, swatch: { base: "#1d1716", dark: "#060404", light: "#e0a65a" } },
  { id: "ombre", label: "Ombré", note: "Dark root melting to honey.", price: 150, perInch: 5, swatch: { base: "#5a3820", dark: "#120c0a", light: "#e7b56c" } },
  { id: "pink", label: "Hot Pink", note: "#FF1493. You know why.", price: 400, swatch: { base: "#f0158c", dark: "#9c0a55", light: "#ff8ec7" } },
  { id: "chrome", label: "Chrome Silver", note: "Liquid metal, icy finish.", price: 450, swatch: { base: "#b9b9c6", dark: "#6c6c7b", light: "#ffffff" } },
  { id: "blue", label: "Blue Raspberry", note: "Unlocked with sparkle points.", price: 400, locked: 50, swatch: { base: "#2f6bf0", dark: "#0f2a8c", light: "#9cc0ff" } },
  { id: "lilac", label: "Lilac Haze", note: "Unlocked with sparkle points.", price: 400, locked: 90, swatch: { base: "#a983d8", dark: "#5f3f91", light: "#e6d4ff" } },
  { id: "cherry", label: "Cherry Cola", note: "Unlocked with sparkle points.", price: 400, locked: 130, swatch: { base: "#6a0f1c", dark: "#33040b", light: "#c2364a" } },
];

export const DENSITY_OPTIONS: Option<DensityId>[] = [
  { id: 150, label: "150%", note: "Natural, lightweight.", price: -150 },
  { id: 180, label: "180%", note: "Full. Our best seller.", price: 0 },
  { id: 200, label: "200%", note: "Maximum volume. Big hair, bigger plans.", price: 250 },
];

export const HAIRLINE_OPTIONS: Option<HairlineId>[] = [
  { id: "natural", label: "Natural", note: "Factory hairline as-is.", price: 0 },
  { id: "plucked", label: "Pre-Plucked", note: "Thinned and softened, ready to wear.", price: 80 },
  { id: "babyhairs", label: "Baby Hairs", note: "Pre-plucked plus laid baby hairs.", price: 120 },
];

export const EXTRA_OPTIONS: Option<ExtraId>[] = [
  { id: "knots", label: "Bleached Knots", note: "Knots lightened so the lace melts.", price: 100 },
  { id: "precut", label: "Pre-Cut Lace", note: "Lace trimmed. Open, wear, go.", price: 80 },
  { id: "bangs", label: "Full Bangs", note: "Blunt fringe, doll-face energy.", price: 150 },
  { id: "curtain", label: "Curtain Bangs", note: "Face-framing swoop.", price: 150 },
  { id: "clips", label: "Butterfly Clips", note: "A set of Y2K butterfly clips.", price: 60 },
  { id: "scarf", label: "Satin Scarf", note: "Tie it, frame it, protect it.", price: 90 },
  { id: "bonnet", label: "Satin Bonnet", note: "Overnight protection for your crown.", price: 70 },
];

export const LENGTH_MIN = 10;
export const LENGTH_MAX = 30;
export const BOB_MAX = 14;

export const DEFAULT_CONFIG: WigConfig = {
  name: "",
  lace: "glueless13x4",
  grade: "12A",
  part: "middle",
  texture: "body",
  length: 20,
  color: "black",
  density: 180,
  hairline: "plucked",
  extras: [],
};

export const PRESETS: { id: string; label: string; vibe: string; config: Omit<WigConfig, "name"> & { name: string } }[] = [
  { id: "y2k", label: "Y2K Baddie", vibe: "Honey ribbons, baby hairs, butterfly clips.", config: { name: "Y2K Baddie", lace: "glueless13x4", grade: "12A", part: "middle", texture: "body", length: 24, color: "highlight", density: 200, hairline: "babyhairs", extras: ["clips", "knots"] } },
  { id: "softglam", label: "Soft Glam", vibe: "Chocolate waves with a curtain swoop.", config: { name: "Soft Glam", lace: "glueless13x4", grade: "12A", part: "middle", texture: "body", length: 20, color: "brown", density: 180, hairline: "plucked", extras: ["curtain", "precut"] } },
  { id: "boss", label: "Boss Babe", vibe: "14A bone straight. Side part. Meeting at 9.", config: { name: "Boss Babe", lace: "frontal13x4", grade: "14A", part: "side", texture: "straight", length: 22, color: "black", density: 180, hairline: "plucked", extras: ["knots", "precut"] } },
  { id: "icy", label: "Icy Chrome", vibe: "Liquid-metal straight. Cold, on purpose.", config: { name: "Icy Chrome", lace: "glueless13x4", grade: "12A", part: "middle", texture: "straight", length: 28, color: "chrome", density: 200, hairline: "babyhairs", extras: ["knots", "clips"] } },
  { id: "ginger", label: "Ginger Bob", vibe: "Burnt-orange bob with a blunt fringe.", config: { name: "Ginger Bob", lace: "closure5x5", grade: "12A", part: "middle", texture: "bob", length: 12, color: "ginger", density: 180, hairline: "natural", extras: ["bangs"] } },
  { id: "curlqueen", label: "Curl Queen", vibe: "Burgundy curls, full density, satin scarf.", config: { name: "Curl Queen", lace: "glueless13x4", grade: "12A", part: "side", texture: "curly", length: 22, color: "burgundy", density: 200, hairline: "babyhairs", extras: ["scarf", "bonnet"] } },
];

/* ------------------------------ helpers ------------------------------ */

export const clampLength = (texture: TextureId, length: number) => {
  const max = texture === "bob" ? BOB_MAX : LENGTH_MAX;
  const even = Math.round(length / 2) * 2;
  return Math.max(LENGTH_MIN, Math.min(max, even));
};

/** Applies option rules so a config is always buildable. */
export function normalizeConfig(config: WigConfig): WigConfig {
  let extras = Array.from(new Set(config.extras));
  // One fringe at a time.
  if (extras.includes("bangs") && extras.includes("curtain")) extras = extras.filter((x) => x !== "curtain");
  return {
    ...config,
    name: config.name.slice(0, 32),
    length: clampLength(config.texture, config.length),
    extras,
  };
}

export const findOption = <T,>(list: Option<T>[], id: T) => list.find((o) => o.id === id)!;
export const colorOf = (id: ColorId) => COLOR_OPTIONS.find((o) => o.id === id) ?? COLOR_OPTIONS[0];

/* ------------------------------ pricing ------------------------------ */
/*
 * Calibrated so that every one of the ten listed supplier SKUs prices exactly
 * at its published Rand price (see wigBuilder.test.ts). Everything outside
 * those ten combinations is an ESTIMATE to be confirmed with the factory.
 *
 * Base: 12A · 13×4 glueless · straight · 18" · 180% · natural black = R1,799.99
 */
export const BASE_PRICE = 1799.99;
export const BASE_LENGTH = 18;
export const PER_INCH_UP = 100;
export const PER_INCH_DOWN = 60;

export type PriceLine = { label: string; amount: number };

export function priceBreakdown(raw: WigConfig): { lines: PriceLine[]; total: number } {
  const c = normalizeConfig(raw);
  const lines: PriceLine[] = [{ label: `Base unit (12A · 13×4 glueless · 18" · 180%)`, amount: BASE_PRICE }];
  const lace = findOption(LACE_OPTIONS, c.lace);
  if (lace.price) lines.push({ label: lace.label, amount: lace.price });
  const tex = findOption(TEXTURE_OPTIONS, c.texture);
  if (tex.price) lines.push({ label: `${tex.label} texture`, amount: tex.price });
  if (c.grade === "14A") lines.push({ label: "14A grade upgrade", amount: 1000 + tex.price });
  const diff = c.length - BASE_LENGTH;
  if (diff) lines.push({ label: `${c.length}" length`, amount: diff > 0 ? diff * PER_INCH_UP : diff * PER_INCH_DOWN });
  const color = colorOf(c.color);
  const colorPrice = color.price + (color.perInch ? color.perInch * c.length : 0);
  if (colorPrice) lines.push({ label: `${color.label} color`, amount: colorPrice });
  const density = findOption(DENSITY_OPTIONS, c.density);
  if (density.price) lines.push({ label: `${density.label} density`, amount: density.price });
  const hairline = findOption(HAIRLINE_OPTIONS, c.hairline);
  if (hairline.price) lines.push({ label: `${hairline.label} hairline`, amount: hairline.price });
  for (const id of c.extras) {
    const extra = findOption(EXTRA_OPTIONS, id);
    lines.push({ label: extra.label, amount: extra.price });
  }
  const cents = lines.reduce((sum, line) => sum + Math.round(line.amount * 100), 0);
  return { lines, total: cents / 100 };
}

/* ------------------------- catalog <-> builder ------------------------- */

const textureFromSku: Record<WigProduct["texture"], TextureId> = {
  Bob: "bob", Straight: "straight", "Body wave": "body", Curly: "curly", "Afro kinky": "kinky",
};

export function skuToConfig(product: WigProduct): WigConfig {
  return {
    name: "",
    lace: product.lace === "5X5" ? "closure5x5" : product.glueless ? "glueless13x4" : "frontal13x4",
    grade: product.grade,
    part: "middle",
    texture: textureFromSku[product.texture],
    length: product.length,
    color: product.color === "Highlight" ? "highlight" : "black",
    density: (product.density as DensityId | undefined) ?? 180,
    hairline: "natural",
    extras: [],
  };
}

/** Returns the stocked sample SKU if this build is exactly one of the ten listed wigs. */
export function matchingSku(raw: WigConfig): WigProduct | undefined {
  const c = normalizeConfig(raw);
  if (c.extras.length || c.hairline !== "natural") return undefined;
  return wigProducts.find((p) => {
    const s = skuToConfig(p);
    return s.lace === c.lace && s.grade === c.grade && s.texture === c.texture && s.length === c.length && s.color === c.color && s.density === c.density;
  });
}

/* ------------------------------ URL state ------------------------------ */

const LACE_CODES: Record<LaceId, string> = { closure5x5: "c", frontal13x4: "f", glueless13x4: "g" };
const TEX_CODES: Record<TextureId, string> = { straight: "s", body: "b", curly: "c", kinky: "k", bob: "o" };
const HL_CODES: Record<HairlineId, string> = { natural: "n", plucked: "p", babyhairs: "b" };
const invert = <K extends string>(map: Record<K, string>) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<string, K>;

export function encodeConfig(raw: WigConfig): string {
  const c = normalizeConfig(raw);
  const params = new URLSearchParams();
  if (c.name) params.set("n", c.name);
  params.set("l", LACE_CODES[c.lace]);
  params.set("g", c.grade === "14A" ? "14" : "12");
  params.set("p", c.part === "side" ? "s" : "m");
  params.set("t", TEX_CODES[c.texture]);
  params.set("len", String(c.length));
  params.set("c", c.color);
  params.set("d", String(c.density));
  params.set("h", HL_CODES[c.hairline]);
  if (c.extras.length) params.set("x", c.extras.join("."));
  return params.toString();
}

export function decodeConfig(query: string): WigConfig | null {
  const params = new URLSearchParams(query);
  if (!params.has("t") && !params.has("l")) return null;
  const pick = <T,>(value: T | undefined, fallback: T) => (value === undefined ? fallback : value);
  const color = params.get("c") as ColorId | null;
  const density = Number(params.get("d"));
  const extras = (params.get("x") || "").split(".").filter((x): x is ExtraId => EXTRA_OPTIONS.some((o) => o.id === x));
  return normalizeConfig({
    name: params.get("n") || "",
    lace: pick(invert(LACE_CODES)[params.get("l") || ""], DEFAULT_CONFIG.lace),
    grade: params.get("g") === "14" ? "14A" : "12A",
    part: params.get("p") === "s" ? "side" : "middle",
    texture: pick(invert(TEX_CODES)[params.get("t") || ""], DEFAULT_CONFIG.texture),
    length: Number(params.get("len")) || DEFAULT_CONFIG.length,
    color: color && COLOR_OPTIONS.some((o) => o.id === color) ? color : DEFAULT_CONFIG.color,
    density: density === 150 || density === 200 ? density : 180,
    hairline: pick(invert(HL_CODES)[params.get("h") || ""], DEFAULT_CONFIG.hairline),
    extras,
  });
}

/* --------------------------- human-readable --------------------------- */

export function specLines(raw: WigConfig): [string, string][] {
  const c = normalizeConfig(raw);
  return [
    ["Lace & cap", `${findOption(LACE_OPTIONS, c.lace).label} · ${c.part === "side" ? "side" : "middle"} part`],
    ["Grade", c.grade],
    ["Texture", findOption(TEXTURE_OPTIONS, c.texture).label],
    ["Length", `${c.length}"`],
    ["Color", colorOf(c.color).label],
    ["Density", `${c.density}%`],
    ["Hairline", findOption(HAIRLINE_OPTIONS, c.hairline).label],
    ["Extras", c.extras.length ? c.extras.map((id) => findOption(EXTRA_OPTIONS, id).label).join(", ") : "None"],
  ];
}

export function shortSpec(raw: WigConfig): string {
  const c = normalizeConfig(raw);
  return [c.grade, `${c.length}"`, findOption(TEXTURE_OPTIONS, c.texture).label, colorOf(c.color).label, findOption(LACE_OPTIONS, c.lace).label, `${c.density}%`].join(" · ");
}

export function randomConfig(unlockedPoints: number, rand: () => number = Math.random): WigConfig {
  const pickOne = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const texture = pickOne(TEXTURE_OPTIONS).id;
  const colors = COLOR_OPTIONS.filter((o) => !o.locked || o.locked <= unlockedPoints);
  const extras = EXTRA_OPTIONS.filter(() => rand() < 0.28).map((o) => o.id);
  return normalizeConfig({
    name: "",
    lace: pickOne(LACE_OPTIONS).id,
    grade: rand() < 0.25 ? "14A" : "12A",
    part: rand() < 0.5 ? "middle" : "side",
    texture,
    length: texture === "bob" ? pickOne([10, 12, 14]) : pickOne([14, 16, 18, 20, 22, 24, 26, 28, 30]),
    color: pickOne(colors).id,
    density: pickOne(DENSITY_OPTIONS).id,
    hairline: pickOne(HAIRLINE_OPTIONS).id,
    extras,
  });
}

export const WIG_NAME_IDEAS = ["Main Character", "Brat Summer", "Soft Life", "Group Chat Famous", "Pretty Problem", "Sunday Service", "Lagos Nights", "Joburg Baddie", "Kampala Crush", "Sandton Sleek"];
