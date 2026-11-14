import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Camera, Download, Eye, ImagePlus, Loader2, RefreshCw, ScanFace, ShieldCheck, X } from "lucide-react";
import type { WigConfig } from "@shared/wigBuilder";
import { WigRender, HEAD } from "@/components/WigRender";
import { detectFace, fileToCanvas, warmUpFaceDetector } from "@/lib/faceDetect";

/** Eye positions in the drawn head (SVG units): used to line the wig up on a real face. */
const SVG_EYE_MID = { x: HEAD.cx, y: 190 };
const SVG_EYE_DIST = 50;
const VB = { x: 0, y: 40, w: 400, h: 500 };

/** Where the wig sits, as fractions of the photo so it survives resizes. */
type Placement = { x: number; y: number; unit: number; rot: number };

type Status = "idle" | "loading" | "found" | "manual";

/**
 * Live try-on: the customer's own photo with the current build drawn on top.
 * Everything stays on the device. Options changed in the builder update it instantly.
 */
export function TryOn({ config, onClose }: { config: WigConfig; onClose: () => void }) {
  const [photo, setPhoto] = useState<{ url: string; w: number; h: number } | null>(null);
  const [place, setPlace] = useState<Placement | null>(null);
  const [auto, setAuto] = useState<Placement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [peek, setPeek] = useState(false);
  const outerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; dist: number; place: Placement } | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const wigRef = useRef<HTMLDivElement>(null);

  useEffect(() => { warmUpFaceDetector(); }, []);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  // Fit the photo inside the stage, keeping its shape.
  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el || !photo) return;
    const fit = () => {
      const W = el.clientWidth, H = el.clientHeight;
      const s = Math.min(W / photo.w, H / photo.h);
      setBox({ w: Math.round(photo.w * s), h: Math.round(photo.h * s) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [photo]);

  const onFile = async (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setStatus("loading");
    try {
      const canvas = await fileToCanvas(file);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
      if (!blob) throw new Error("no blob");
      setPhoto({ url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height });
      const face = await detectFace(canvas);
      const aspect = canvas.width / canvas.height;
      const fitted: Placement = face
        ? { x: face.eyeX, y: face.eyeY, unit: face.eyeDist / SVG_EYE_DIST, rot: face.roll }
        // No face found: centre a sensibly sized wig and let them drag it.
        : { x: 0.5, y: 0.4, unit: Math.min(0.42, 0.42 / aspect) / (HEAD.halfWidth * 2), rot: 0 };
      setAuto(fitted);
      setPlace(fitted);
      setStatus(face ? "found" : "manual");
    } catch {
      setStatus("manual");
    }
  };

  /* ------------------------------ gestures ------------------------------ */
  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (!place || !pts.length) { gesture.current = null; return; }
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gesture.current = { x: cx, y: cy, dist, place };
  };
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!place) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current || !box.w) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    let unit = g.place.unit;
    if (pts.length > 1 && g.dist > 0) unit = clampUnit(g.place.unit * (Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) / g.dist));
    setPlace({ ...g.place, unit, x: g.place.x + (cx - g.x) / box.w, y: g.place.y + (cy - g.y) / box.h });
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    startGesture();
  };
  const onWheel = useCallback((e: WheelEvent) => {
    if (!place) return;
    e.preventDefault();
    setPlace((p) => (p ? { ...p, unit: clampUnit(p.unit * (e.deltaY < 0 ? 1.04 : 0.96)) } : p));
  }, [place]);
  useEffect(() => {
    const el = wigRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  /* ------------------------------ save image ------------------------------ */
  const save = async () => {
    if (!photo || !place) return;
    const svg = wigRef.current?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = photo.w; canvas.height = photo.h;
    const ctx = canvas.getContext("2d")!;
    const base = await loadImage(photo.url);
    ctx.drawImage(base, 0, 0);
    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.setAttribute("width", String(VB.w));
    copy.setAttribute("height", String(VB.h));
    const wig = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`);
    const u = place.unit * photo.w;
    ctx.translate(place.x * photo.w, place.y * photo.h);
    ctx.rotate((place.rot * Math.PI) / 180);
    ctx.drawImage(wig, -(SVG_EYE_MID.x - VB.x) * u, -(SVG_EYE_MID.y - VB.y) * u, VB.w * u, VB.h * u);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = `600 ${Math.round(photo.w * 0.028)}px "Space Mono", monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("BRATHOUSE · drawn preview", photo.w * 0.03, photo.h * 0.97);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/jpeg", 0.92);
    a.download = `${(config.name.trim() || "brathouse-try-on").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
    a.click();
  };

  /* ------------------------------ render ------------------------------ */
  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={uploadRef} type="file" accept="image/*" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
    </>
  );

  if (!photo) {
    return (
      <div className="tryon tryon--empty">
        {inputs}
        <button type="button" className="tryon__close" onClick={onClose} aria-label="Back to the model"><X size={16} /></button>
        <ScanFace size={34} aria-hidden="true" />
        <h3>Try it on <em>you</em></h3>
        <p>Take a selfie or upload a photo and your build lands on your head. Change length, colour or texture and watch it update.</p>
        <div className="tryon__cta">
          <button type="button" className="gloss-btn gloss-btn--pink" onClick={() => cameraRef.current?.click()}><Camera size={16} /> Take a selfie</button>
          <button type="button" className="gloss-btn gloss-btn--chrome" onClick={() => uploadRef.current?.click()}><ImagePlus size={16} /> Upload photo</button>
        </div>
        <p className="tryon__privacy"><ShieldCheck size={13} /> Your photo stays on your device. Nothing is uploaded.</p>
        <p className="tryon__tips">Best results: face the camera, hair pulled back, good light.</p>
        {status === "loading" && <p className="tryon__status" role="status"><Loader2 size={14} className="spin" /> Finding your face…</p>}
      </div>
    );
  }

  const unitPx = place ? place.unit * box.w : 0;
  return (
    <div className="tryon">
      {inputs}
      <div className="tryon__outer" ref={outerRef}>
        <div className="tryon__frame" style={{ width: box.w, height: box.h }}>
          <img src={photo.url} alt="Your photo" className="tryon__photo" draggable={false} />
          {place && (
            <div
              ref={wigRef}
              className={`tryon__wig ${peek ? "is-hidden" : ""}`}
              role="application"
              aria-label="Wig on your photo. Drag to move, pinch or scroll to resize."
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              style={{
                left: place.x * box.w - (SVG_EYE_MID.x - VB.x) * unitPx,
                top: place.y * box.h - (SVG_EYE_MID.y - VB.y) * unitPx,
                width: VB.w * unitPx,
                height: VB.h * unitPx,
                transform: `rotate(${place.rot}deg)`,
                transformOrigin: `${(SVG_EYE_MID.x - VB.x) * unitPx}px ${(SVG_EYE_MID.y - VB.y) * unitPx}px`,
              }}
            >
              <WigRender config={config} mode="hair" title="Your wig" />
            </div>
          )}
        </div>
      </div>

      <div className="tryon__top">
        <span className={`tryon__badge tryon__badge--${status}`}>
          {status === "found" ? "Face found · drag to adjust" : status === "loading" ? "Finding your face…" : "Drag the wig onto your head"}
        </span>
        <button type="button" className="tryon__close" onClick={onClose} aria-label="Back to the model"><X size={16} /></button>
      </div>

      <div className="tryon__tools">
        <label className="tryon__slider">Size
          <input type="range" min={0.3} max={2.2} step={0.01} value={place && auto ? place.unit / auto.unit : 1} onChange={(e) => auto && place && setPlace({ ...place, unit: auto.unit * Number(e.target.value) })} />
        </label>
        <label className="tryon__slider">Tilt
          <input type="range" min={-30} max={30} step={1} value={place?.rot ?? 0} onChange={(e) => place && setPlace({ ...place, rot: Number(e.target.value) })} />
        </label>
        <div className="tryon__buttons">
          <button type="button" className="tool-chip" onPointerDown={() => setPeek(true)} onPointerUp={() => setPeek(false)} onPointerLeave={() => setPeek(false)} onKeyDown={(e) => e.key === " " && setPeek(true)} onKeyUp={() => setPeek(false)} aria-label="Hold to see your photo without the wig"><Eye size={14} /> Hold: before</button>
          <button type="button" className="tool-chip" onClick={() => auto && setPlace(auto)} aria-label="Reset the wig position"><RefreshCw size={14} /> Re-fit</button>
          <button type="button" className="tool-chip" onClick={() => uploadRef.current?.click()} aria-label="Use a different photo"><ImagePlus size={14} /> New photo</button>
          <button type="button" className="tool-chip" onClick={() => void save()} aria-label="Save this try-on as an image"><Download size={14} /> Save</button>
        </div>
      </div>
      <p className="tryon__note">Drawn preview of your build. Real-hair try-on comes after the photo shoot.</p>
    </div>
  );
}

const clampUnit = (u: number) => Math.max(0.0004, Math.min(0.05, u));

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
