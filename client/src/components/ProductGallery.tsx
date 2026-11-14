import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Play, RotateCw, X, ZoomIn } from "lucide-react";
import type { WigProduct } from "@shared/catalog";
import { SHOTS, VIDEO_KINDS, pickSrc, toSrcSet, type MediaImage, type ShotName, type VideoKind, type WigMedia } from "@shared/wigMedia";
import { SpinViewer } from "@/components/SpinViewer";

const SHOT_LABELS: Record<ShotName, string> = {
  front: "Front",
  "three-quarter-left": "¾ left",
  left: "Left side",
  back: "Back",
  right: "Right side",
  "three-quarter-right": "¾ right",
  hairline: "Hairline",
  part: "Part",
  texture: "Texture",
  ends: "Ends",
  cap: "Inside the cap",
  length: "Length check",
  hand: "Movement",
};
const VIDEO_LABELS: Record<VideoKind, string> = {
  turntable: "Turntable",
  hand: "Hand-in-hair",
  hairline: "Hairline close-up",
  brush: "Brush-through",
  walkaround: "Walk-around",
};

type Item =
  | { kind: "photo"; id: string; label: string; image: MediaImage }
  | { kind: "spin"; id: "spin"; label: string }
  | { kind: "video"; id: string; label: string; src: string; poster?: string };

function buildItems(media: WigMedia): Item[] {
  const items: Item[] = [];
  const photo = (s: ShotName) => media.shots[s] && items.push({ kind: "photo", id: s, label: SHOT_LABELS[s], image: media.shots[s]! });
  photo("front");
  if (media.spin.length >= 8) items.push({ kind: "spin", id: "spin", label: "360° spin" });
  SHOTS.filter((s) => s !== "front").forEach(photo);
  for (const k of VIDEO_KINDS) {
    const v = media.videos[k];
    if (v) items.push({ kind: "video", id: `video-${k}`, label: VIDEO_LABELS[k], src: v.src, poster: v.poster });
  }
  return items;
}

/** Photos, 360° spin and clips from the shoot, with a thumbnail rail and full-screen zoom. */
export function ProductGallery({ product, media }: { product: WigProduct; media: WigMedia }) {
  const items = useMemo(() => buildItems(media), [media]);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const item = items[active] ?? items[0];
  const photos = items.filter((i): i is Extract<Item, { kind: "photo" }> => i.kind === "photo");
  const step = (d: number) => setActive((a) => (a + d + items.length) % items.length);

  return (
    <div className="pg">
      <div className="pg-stage">
        {item.kind === "photo" && (
          <button type="button" className="pg-photo" onClick={() => setZoom(true)} aria-label={`Zoom ${item.label} photo`}>
            <img src={pickSrc(item.image, 960)} srcSet={toSrcSet(item.image)} sizes="(max-width: 900px) 100vw, 640px" width={item.image.width} height={item.image.height} alt={`${product.name}: ${item.label.toLowerCase()}`} decoding="async" />
            <span className="pg-zoom-hint" aria-hidden="true"><ZoomIn size={15} /> Zoom</span>
          </button>
        )}
        {item.kind === "spin" && <SpinViewer frames={media.spin} size={media.spinSize} label={product.name} className="pg-spin" />}
        {item.kind === "video" && (
          <video key={item.src} className="pg-video" src={item.src} poster={item.poster} autoPlay muted loop playsInline controls aria-label={`${product.name}: ${item.label}`} />
        )}
        {items.length > 1 && (
          <>
            <button type="button" className="pg-arrow pg-arrow--prev" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft size={20} /></button>
            <button type="button" className="pg-arrow pg-arrow--next" onClick={() => step(1)} aria-label="Next"><ChevronRight size={20} /></button>
          </>
        )}
        <span className="pg-caption">{item.label} · {active + 1}/{items.length}</span>
      </div>

      {items.length > 1 && (
        <div className="pg-rail" role="tablist" aria-label="Product media">
          {items.map((it, i) => (
            <button key={it.id} type="button" role="tab" aria-selected={i === active} aria-label={it.label} title={it.label} className={`pg-thumb pg-thumb--${it.kind}`} onClick={() => setActive(i)}>
              {it.kind === "photo" && <img src={pickSrc(it.image, 480)} alt="" loading="lazy" width={96} height={120} />}
              {it.kind === "spin" && <><img src={media.spin[0].src} alt="" loading="lazy" width={96} height={120} /><span className="pg-thumb__badge"><RotateCw size={13} /> 360°</span></>}
              {it.kind === "video" && <>{it.poster ? <img src={it.poster} alt="" loading="lazy" width={96} height={120} /> : <span className="pg-thumb__blank" />}<span className="pg-thumb__badge"><Play size={12} /> Clip</span></>}
            </button>
          ))}
        </div>
      )}

      {zoom && item.kind === "photo" && (
        <Lightbox photos={photos} start={photos.findIndex((p) => p.id === item.id)} name={product.name} onClose={(id) => { setZoom(false); const i = items.findIndex((x) => x.id === id); if (i >= 0) setActive(i); }} />
      )}
    </div>
  );
}

function Lightbox({ photos, start, name, onClose }: { photos: { id: string; label: string; image: MediaImage }[]; start: number; name: string; onClose: (id: string) => void }) {
  const [i, setI] = useState(Math.max(0, start));
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const p = photos[i];
  const go = (d: number) => { setZoomed(false); setI((x) => (x + d + photos.length) % photos.length); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(p.id);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  });

  // Portal to <body>: the gallery sits in a tilted sticker card, and a transformed
  // ancestor would trap position: fixed inside it.
  return createPortal(
    <div className="pg-lightbox" role="dialog" aria-modal="true" aria-label={`${name} photos`}>
      <button type="button" className="pg-lightbox__close" onClick={() => onClose(p.id)} aria-label="Close" autoFocus><X size={22} /></button>
      <div
        className={`pg-lightbox__frame ${zoomed ? "is-zoomed" : ""}`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          setZoomed((z) => !z);
        }}
        onMouseMove={(e) => {
          if (!zoomed) return;
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
        }}
      >
        <img src={pickSrc(p.image, 1600)} alt={`${name}: ${p.label.toLowerCase()}`} style={{ transformOrigin: origin }} />
      </div>
      <p className="pg-lightbox__caption">{p.label} · {i + 1}/{photos.length} · {zoomed ? "click to zoom out" : "click to zoom in"}</p>
      {photos.length > 1 && (
        <>
          <button type="button" className="pg-arrow pg-arrow--prev" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={22} /></button>
          <button type="button" className="pg-arrow pg-arrow--next" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={22} /></button>
        </>
      )}
    </div>,
    document.body,
  );
}
