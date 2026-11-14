import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type Frame = { angle: number; src: string };

/**
 * Drag / swipe / arrow-key 360° viewer built from the mannequin spin photos.
 * Frames are real photos, so what you see is the actual wig.
 */
export function SpinViewer({ frames, size, label, className = "" }: { frames: Frame[]; size?: { width: number; height: number }; label: string; className?: string }) {
  const count = frames.length;
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [hinted, setHinted] = useState(false);
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const spinning = useRef<number | null>(null);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  // Preload every frame so dragging never flashes blank.
  useEffect(() => {
    let alive = true;
    setLoaded(0);
    const imgs = frames.map((f) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => alive && setLoaded((n) => n + 1);
      img.src = f.src;
      return img;
    });
    return () => { alive = false; imgs.forEach((img) => (img.onload = img.onerror = null)); };
  }, [frames]);

  const ready = loaded >= count;

  // One slow intro turn once loaded, unless the user prefers less motion.
  useEffect(() => {
    if (!ready || hinted || count < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setHinted(true); return; }
    let step = 0;
    spinning.current = window.setInterval(() => {
      step += 1;
      setIndex(step % count);
      if (step >= count) stopIntro();
    }, 1400 / count);
    return () => stopIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function stopIntro() {
    if (spinning.current !== null) { window.clearInterval(spinning.current); spinning.current = null; }
    setHinted(true);
  }

  // Full drag across the viewer = one full turn.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    stopIntro();
    drag.current = { x: e.clientX, start: index, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !box.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    const perFrame = box.current.clientWidth / count;
    go(drag.current.start - Math.round(dx / perFrame));
  };
  const onPointerUp = () => { drag.current = null; };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); stopIntro(); go(index + 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); stopIntro(); go(index - 1); }
    else if (e.key === "Home") { e.preventDefault(); stopIntro(); go(0); }
  };

  const angle = frames[index]?.angle ?? 0;

  return (
    <div
      ref={box}
      className={`spin-viewer ${ready ? "is-ready" : ""} ${className}`}
      role="slider"
      tabIndex={0}
      aria-label={`${label}: 360° view. Drag or use arrow keys to rotate.`}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={angle}
      aria-valuetext={`${angle}°`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      style={size ? { aspectRatio: `${size.width} / ${size.height}` } : undefined}
    >
      {frames.map((f, i) => (
        <img key={f.src} src={f.src} alt="" draggable={false} className={i === index ? "is-active" : ""} width={size?.width} height={size?.height} />
      ))}
      {!ready && <div className="spin-viewer__loading" role="status">Loading 360° · {Math.round((loaded / count) * 100)}%</div>}
      <div className="spin-viewer__hud" aria-hidden="true">
        <span className="spin-viewer__badge">360°</span>
        <span className="spin-viewer__hint">{hinted ? "Drag to spin" : "Spinning…"}</span>
        <svg className="spin-viewer__dial" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" /><line x1="18" y1="18" x2="18" y2="5" style={{ transform: `rotate(${angle}deg)` }} /></svg>
      </div>
    </div>
  );
}
