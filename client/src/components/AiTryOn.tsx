import { useEffect, useState } from "react";
import { Download, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { encodeConfig, type WigConfig } from "@shared/wigBuilder";

type Status = { enabled: boolean; remaining: number; limit: number } | null;

const DEVICE_KEY = "brathouse-tryon-device";
function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id); }
    return id;
  } catch { return ""; }
}

/** Is the server-side AI try-on switched on? (Static builds have no server, so: no.) */
export function useAiTryOnStatus() {
  const [status, setStatus] = useState<Status>(null);
  const refresh = () => {
    fetch("/api/try-on/status", { headers: { "x-tryon-device": deviceId() } })
      .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
      .then((s) => setStatus(s ? { enabled: Boolean(s.enabled), remaining: Number(s.remaining) || 0, limit: Number(s.limit) || 0 } : { enabled: false, remaining: 0, limit: 0 }))
      .catch(() => setStatus({ enabled: false, remaining: 0, limit: 0 }));
  };
  useEffect(refresh, []);
  return [status, refresh] as const;
}

async function photoForUpload(url: string, maxSide = 1024) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.86);
}

type Phase = { kind: "consent" } | { kind: "working" } | { kind: "result"; image: string } | { kind: "error"; message: string };

/**
 * Consent → generate → result, shown over the try-on photo.
 * Only opened by the customer; one tap = one generation.
 */
export function AiTryOnFlow({ photoUrl, config, onClose, onUsed }: { photoUrl: string; config: WigConfig; onClose: () => void; onUsed: () => void }) {
  const [phase, setPhase] = useState<Phase>({ kind: "consent" });
  const [agreed, setAgreed] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const generate = async () => {
    setPhase({ kind: "working" });
    try {
      const selfie = await photoForUpload(photoUrl);
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tryon-device": deviceId() },
        body: JSON.stringify({ selfie, look: encodeConfig(config), consent: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (typeof json.remaining === "number") setRemaining(json.remaining);
      onUsed();
      if (!res.ok || !json.image) return setPhase({ kind: "error", message: json.error || "Something went wrong. Try again." });
      setPhase({ kind: "result", image: json.image });
    } catch {
      setPhase({ kind: "error", message: "Couldn't reach the server. Check your connection and try again." });
    }
  };

  return (
    <div className="ai-tryon" role="dialog" aria-modal="true" aria-labelledby="ai-tryon-title">
      <button type="button" className="tryon__close ai-tryon__close" onClick={onClose} aria-label="Close AI preview"><X size={16} /></button>

      {phase.kind === "consent" && (
        <div className="ai-tryon__card">
          <Sparkles size={26} aria-hidden="true" />
          <h3 id="ai-tryon-title">See it on me <em>(AI)</em></h3>
          <p>We'll create a realistic photo of you wearing this build. It takes about 10–20 seconds.</p>
          <ul>
            <li>Your photo is sent to our AI partner only to make this one image.</li>
            <li>We don't store it, and it isn't used to train anything.</li>
            <li>It's an AI preview: the real wig may look slightly different.</li>
          </ul>
          <label className="ai-tryon__consent">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I'm 18+ (or have a parent's OK) and agree to send my photo for this preview.</span>
          </label>
          <button type="button" className="gloss-btn gloss-btn--pink" disabled={!agreed} onClick={() => void generate()}><Sparkles size={15} /> Create my preview</button>
          <p className="ai-tryon__fine"><ShieldCheck size={12} /> Handled under POPIA. You can close this at any time.</p>
        </div>
      )}

      {phase.kind === "working" && (
        <div className="ai-tryon__card" role="status">
          <Loader2 size={30} className="spin" aria-hidden="true" />
          <h3 id="ai-tryon-title">Styling you…</h3>
          <p>Laying the lace, fluffing the ends. 10–20 seconds.</p>
        </div>
      )}

      {phase.kind === "result" && (
        <div className="ai-tryon__result">
          <img src={phase.image} alt="AI preview of you wearing your wig" />
          <span className="ai-tryon__label">AI preview · real wig may vary</span>
          <div className="ai-tryon__actions">
            <a className="gloss-btn gloss-btn--pink" href={phase.image} download={`${(config.name.trim() || "brathouse-ai-preview").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`}><Download size={15} /> Save</a>
            <button type="button" className="gloss-btn gloss-btn--chrome" onClick={onClose}>Back to styling</button>
          </div>
          {remaining !== null && <p className="ai-tryon__fine">{remaining} free AI preview{remaining === 1 ? "" : "s"} left today.</p>}
        </div>
      )}

      {phase.kind === "error" && (
        <div className="ai-tryon__card">
          <h3 id="ai-tryon-title">Hmm, not this time</h3>
          <p>{phase.message}</p>
          <button type="button" className="gloss-btn gloss-btn--chrome" onClick={onClose}>Back to styling</button>
        </div>
      )}
    </div>
  );
}
