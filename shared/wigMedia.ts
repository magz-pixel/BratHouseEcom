import generated from "./wigMedia.generated.json";

/**
 * Real photo/video media for each ready-to-ship wig, produced by
 * `pnpm media:process` from the shoot folders (see docs/brathouse/photo-pipeline.md).
 * A wig with no entry keeps its drawn illustration.
 */

/** Named stills from the shoot guide, in display order. */
export const SHOTS = [
  "front",
  "three-quarter-left",
  "left",
  "back",
  "right",
  "three-quarter-right",
  "hairline",
  "part",
  "texture",
  "ends",
  "cap",
  "length",
  "hand",
] as const;
export type ShotName = (typeof SHOTS)[number];

export const VIDEO_KINDS = ["turntable", "hand", "hairline", "brush", "walkaround"] as const;
export type VideoKind = (typeof VIDEO_KINDS)[number];

/** One processed still: public URLs at each width, plus the intrinsic aspect. */
export type MediaImage = {
  /** width (px) -> public URL */
  srcset: Record<string, string>;
  width: number;
  height: number;
};

export type WigMedia = {
  /** Shoot folder this came from, e.g. "05-body-black-20". */
  source: string;
  shots: Partial<Record<ShotName, MediaImage>>;
  /** 360° frames in rotation order (angle ascending). */
  spin: { angle: number; src: string }[];
  spinSize?: { width: number; height: number };
  videos: Partial<Record<VideoKind, { src: string; poster?: string }>>;
};

export type WigMediaManifest = Record<string, WigMedia>;

const manifest = generated as WigMediaManifest;

export function getWigMedia(slug: string): WigMedia | undefined {
  return manifest[slug];
}

/** Largest-first `srcset` string for an <img>. */
export function toSrcSet(image: MediaImage): string {
  return Object.entries(image.srcset)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([w, url]) => `${url} ${w}w`)
    .join(", ");
}

/** Smallest URL at or above `minWidth`, else the largest available. */
export function pickSrc(image: MediaImage, minWidth = 800): string {
  const entries = Object.entries(image.srcset).map(([w, url]) => [Number(w), url] as const).sort((a, b) => a[0] - b[0]);
  return (entries.find(([w]) => w >= minWidth) ?? entries[entries.length - 1])[1];
}

/** The photo to lead with on cards and product pages. */
export function heroShot(media: WigMedia | undefined): MediaImage | undefined {
  if (!media) return undefined;
  return media.shots.front ?? Object.values(media.shots)[0];
}
