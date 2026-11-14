import { useEffect, useState } from "react";

type TrailPoint = { id: number; x: number; y: number; glyph: string };

export function useBratTrail(enabled = true) {
  const [points, setPoints] = useState<TrailPoint[]>([]);
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reduced.matches || !finePointer.matches) return;
    let last = 0;
    let id = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || performance.now() - last < 95) return;
      last = performance.now();
      const point: TrailPoint = { id: id++, x: event.clientX, y: event.clientY, glyph: id % 3 === 0 ? "✦" : "♥" };
      setPoints((current) => [...current.slice(-7), point]);
      window.setTimeout(() => setPoints((current) => current.filter((item) => item.id !== point.id)), 560);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);
  return points;
}
