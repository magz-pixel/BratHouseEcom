import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, ChevronLeft, ChevronRight, Copy, Dices, Download, Info, Lock, Package, RotateCcw, Share2, ShoppingBag, Sparkles, SplitSquareHorizontal, Volume2, VolumeX, X } from "lucide-react";
import { Link } from "wouter";
import { formatMoney } from "@shared/money";
import { BUSINESS, whatsappLink } from "@shared/business";
import {
  CATEGORIES, COLOR_OPTIONS, DEFAULT_CONFIG, DENSITY_OPTIONS, EXTRA_OPTIONS, GRADE_OPTIONS, HAIRLINE_OPTIONS, LACE_OPTIONS, LENGTH_MAX, LENGTH_MIN, BOB_MAX,
  PART_OPTIONS, PRESETS, TEXTURE_OPTIONS, WIG_NAME_IDEAS, clampLength, colorOf, decodeConfig, encodeConfig, matchingSku, normalizeConfig, priceBreakdown,
  randomConfig, sameLook, nearestSku, differencesFromSku, skuToConfig, shortSpec, specLines, type CategoryId, type ExtraId, type SkinId, type WigConfig,
} from "@shared/wigBuilder";
import { SiteShell } from "@/components/SiteShell";
import { SkuArt, hasPhotos } from "@/components/LookArt";
import { TryOn } from "@/components/TryOn";
import type { WigProduct } from "@shared/catalog";
import { Pedestal, SKINS, WigRender } from "@/components/WigRender";
import { useStore } from "@/contexts/StoreContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { absoluteUrl, asset, currentQuery, pathWithQuery, replaceQuery } from "@/lib/routing";

/* ------------------------------ persistence ------------------------------ */

const POINTS_KEY = "brathouse-builder-points-v1";
const CLAIMS_KEY = "brathouse-builder-claims-v1";
const MUTE_KEY = "brathouse-builder-muted";
const LEADS_KEY = "brathouse-builder-leads-demo";

const read = <T,>(key: string, fallback: T): T => {
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};
const write = (key: string, value: unknown) => { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional */ } };

/* --------------------------------- sound --------------------------------- */

function useSound(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const tone = useCallback((freqs: number[], gap = 0.07, type: OscillatorType = "sine", vol = 0.08) => {
    if (muted || typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = (ctxRef.current ??= new Ctx());
      if (ctx.state === "suspended") void ctx.resume();
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + i * gap;
        osc.type = type;
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.09);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch { /* audio optional */ }
  }, [muted]);
  return useMemo(() => ({
    plink: () => tone([1046], 0, "sine", 0.07),
    pop: () => tone([660, 990], 0.05, "triangle", 0.05),
    slay: () => tone([784, 988, 1175, 1568], 0.08, "sine", 0.07),
    dice: () => tone([300, 420, 360, 520, 460, 700], 0.05, "square", 0.025),
  }), [tone]);
}

/* ------------------------------- reactions ------------------------------- */

const REACTIONS = ["Slay!", "Ate.", "Obsessed.", "She's giving.", "Iconic.", "Main character.", "No notes.", "Mother."];

type Toast = { id: number; text: string; tone: "pink" | "chrome" | "orange" };

/* ================================ PAGE ================================ */

export default function BuildPage() {
  usePageMeta("/build");
  const [config, setConfig] = useState<WigConfig>(() => decodeConfig(currentQuery()) ?? DEFAULT_CONFIG);
  const touched = useRef(false);
  const [tab, setTab] = useState<CategoryId>("lace");
  // Progress counts sections this visitor opened. (The look itself lives in the URL, so a reload or shared link
  // keeps the wig but shouldn't claim every step was done.)
  const [visited, setVisited] = useState<Set<CategoryId>>(() => new Set<CategoryId>(["lace"]));
  const [points, setPoints] = useState<number>(() => read(POINTS_KEY, 0));
  const claimsRef = useRef<string[]>(read(CLAIMS_KEY, []));
  const [muted, setMuted] = useState<boolean>(() => read(MUTE_KEY, false));
  const [skin, setSkin] = useState<SkinId>("rich");
  const [angle, setAngle] = useState(0);
  const [compare, setCompare] = useState(false);
  const [tryOn, setTryOn] = useState(false);
  const [split, setSplit] = useState(50);
  const [reaction, setReaction] = useState<{ id: number; text: string } | null>(null);
  const [burst, setBurst] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [rolling, setRolling] = useState(false);
  const [modal, setModal] = useState<null | "summary" | "save">(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const sound = useSound(muted);
  const stageSvgRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLElement>(null);

  const cfg = useMemo(() => normalizeConfig(config), [config]);
  const price = useMemo(() => priceBreakdown(cfg), [cfg]);
  const sku = useMemo(() => matchingSku(cfg), [cfg]);
  const query = useMemo(() => encodeConfig(cfg), [cfg]);
  const progress = Math.round(((visited.size + (cfg.name.trim() ? 1 : 0)) / (CATEGORIES.length + 1)) * 100);

  // keep the URL shareable
  useEffect(() => { const t = window.setTimeout(() => replaceQuery("/build", query), 250); return () => window.clearTimeout(t); }, [query]);
  useEffect(() => write(MUTE_KEY, muted), [muted]);

  const toast = useCallback((text: string, tone: Toast["tone"] = "pink") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2600);
  }, []);

  const award = useCallback((claim: string, amount: number, label: string) => {
    if (claimsRef.current.includes(claim)) return;
    claimsRef.current = [...claimsRef.current, claim];
    write(CLAIMS_KEY, claimsRef.current);
    setPoints((before) => {
      const after = before + amount;
      write(POINTS_KEY, after);
      for (const color of COLOR_OPTIONS) {
        if (color.locked && before < color.locked && after >= color.locked) {
          window.setTimeout(() => { toast(`Unlocked: ${color.label}!`, "chrome"); sound.slay(); }, 500);
        }
      }
      return after;
    });
    toast(`+${amount} sparkle points · ${label}`, "orange");
  }, [sound, toast]);

  const react = useCallback(() => {
    setReaction({ id: Date.now(), text: REACTIONS[Math.floor(Math.random() * REACTIONS.length)] });
    setBurst((b) => b + 1);
  }, []);

  const update = useCallback((patch: Partial<WigConfig>, opts: { quiet?: boolean } = {}) => {
    touched.current = true;
    setConfig((current) => {
      const next = { ...current, ...patch };
      if (patch.texture) next.length = clampLength(patch.texture, next.length);
      return normalizeConfig(next);
    });
    if (!opts.quiet) { sound.plink(); react(); }
  }, [react, sound]);

  const openTab = (id: CategoryId) => {
    touched.current = true;
    setTab(id);
    sound.pop();
    setVisited((set) => {
      if (set.has(id)) return set;
      const next = new Set(set); next.add(id);
      return next;
    });
    award(`tab:${id}`, 10, `${CATEGORIES.find((c) => c.id === id)?.label} explored`);
    // Phones: if the options panel is scrolled under the sticky preview/tabs, bring the new section's top into view.
    window.requestAnimationFrame(() => {
      const panel = optionsRef.current, tabs = tabsRef.current;
      if (!panel || !tabs) return;
      panel.scrollTop = 0; // desktop: the options column scrolls on its own
      const gap = panel.getBoundingClientRect().top - tabs.getBoundingClientRect().bottom;
      if (gap < 0) window.scrollBy({ top: gap - 8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      tabs.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
    });
  };

  useEffect(() => {
    if (touched.current && visited.size === CATEGORIES.length && cfg.name.trim()) {
      if (!claimsRef.current.includes("complete")) { sound.slay(); toast("Look complete! Your wig is 100% built 💖", "pink"); }
      award("complete", 20, "full look");
    }
  }, [visited, cfg.name, award, sound, toast]);

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id)!;
    setConfig(normalizeConfig(preset.config));
    sound.slay(); react();
    award(`preset:${id}`, 5, preset.label);
  };

  const surprise = () => {
    if (rolling) return;
    setRolling(true);
    sound.dice();
    let ticks = 0;
    const timer = window.setInterval(() => {
      ticks++;
      setConfig({ ...randomConfig(points), name: cfg.name });
      if (ticks >= 7) {
        window.clearInterval(timer);
        setConfig({ ...randomConfig(points), name: cfg.name || WIG_NAME_IDEAS[Math.floor(Math.random() * WIG_NAME_IDEAS.length)] });
        setAngle((a) => a + 360);
        setRolling(false);
        sound.slay(); react();
        const n = claimsRef.current.filter((c) => c.startsWith("surprise")).length;
        if (n < 3) award(`surprise:${n}`, 5, "Surprise me");
      }
    }, 110);
  };

  const reset = () => { setConfig({ ...DEFAULT_CONFIG, name: cfg.name }); setAngle(0); sound.pop(); };

  const svgMarkup = useCallback(() => stageSvgRef.current?.querySelector("svg.wig-svg--main")?.outerHTML ?? "", []);

  return (
    <SiteShell hideHelper>
      <div className="builder" data-rolling={rolling || undefined} data-tryon={tryOn || undefined}>
        {/* TOP BAR */}
        <header className="builder-top">
          <div className="builder-top__title">
            <p className="builder-kicker"><Sparkles size={14} /> BUILD-A-BRAT · CUSTOM WIG STUDIO</p>
            <h1 className="builder-h1">Build your <em>wig</em></h1>
          </div>
          <div className="builder-name">
            <label htmlFor="wig-name">Name your wig</label>
            <div className="builder-name__row">
              <input
                id="wig-name"
                value={config.name}
                maxLength={32}
                placeholder={`e.g. ${WIG_NAME_IDEAS[0]}`}
                onChange={(e) => { touched.current = true; setConfig((c) => ({ ...c, name: e.target.value })); }}
                onBlur={() => { if (cfg.name.trim()) award("name", 15, "named your wig"); }}
              />
              <button type="button" className="gloss-btn gloss-btn--dice" onClick={surprise} aria-label="Surprise me: randomise the whole look" title="Surprise me">
                <Dices size={20} className={rolling ? "spin" : ""} /><span>Surprise me</span>
              </button>
            </div>
          </div>
          <div className="builder-presets" role="group" aria-label="Style presets">
            <span className="builder-presets__label">Presets</span>
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className={`preset-chip ${sameLook(cfg, p.config) ? "is-on" : ""}`} aria-pressed={sameLook(cfg, p.config)} onClick={() => applyPreset(p.id)} title={p.vibe}>
                <span className="preset-chip__dot" style={{ background: `linear-gradient(135deg, ${colorOf(p.config.color).swatch.light}, ${colorOf(p.config.color).swatch.dark})` }} />
                {p.label}
              </button>
            ))}
          </div>
        </header>

        <div className="builder-main">
          {/* CATEGORY TABS */}
          <nav ref={tabsRef} className="builder-tabs" role="tablist" aria-label="Wig categories">
            {CATEGORIES.map((c) => (
              <button key={c.id} role="tab" type="button" aria-selected={tab === c.id} className={`builder-tab ${tab === c.id ? "is-active" : ""} ${visited.has(c.id) ? "is-done" : ""}`} onClick={() => openTab(c.id)}>
                <span className="builder-tab__icon" aria-hidden="true">{c.icon}</span>
                <span className="builder-tab__label">{c.label}</span>
                {visited.has(c.id) && <Check className="builder-tab__check" size={12} aria-hidden="true" />}
              </button>
            ))}
          </nav>

          {/* STAGE */}
          <section className="builder-stage" aria-label="Live wig preview">
            {tryOn ? <TryOn config={cfg} onClose={() => setTryOn(false)} /> : <Stage
              config={cfg}
              skin={skin}
              angle={angle}
              setAngle={setAngle}
              compare={compare}
              split={split}
              setSplit={setSplit}
              showLace={tab === "lace"}
              stageRef={stageSvgRef}
              burst={burst}
              reaction={reaction}
            />}
            {!tryOn && <><div className="stage-controls">
              <button type="button" className="round-btn" onClick={() => { setAngle((a) => a - 45); sound.pop(); }} aria-label="Rotate left"><ChevronLeft size={18} /></button>
              <span className="stage-controls__hint">{compare ? "Drag the line" : "Drag to spin 360°"}</span>
              <button type="button" className="round-btn" onClick={() => { setAngle((a) => a + 45); sound.pop(); }} aria-label="Rotate right"><ChevronRight size={18} /></button>
            </div>
            <div className="stage-tools">
              <button type="button" className="tool-chip tool-chip--tryon" onClick={() => { setTryOn(true); setCompare(false); sound.pop(); award("tryon", 15, "tried it on"); }}><Camera size={14} /> <span>Try on me</span></button>
              <button type="button" className={`tool-chip ${compare ? "is-on" : ""}`} onClick={() => { setCompare((v) => !v); setAngle(0); sound.pop(); }} aria-pressed={compare}><SplitSquareHorizontal size={14} /> Before / after</button>
              <div className="skin-picker" role="group" aria-label="Model skin tone">
                {(Object.keys(SKINS) as SkinId[]).map((id) => (
                  <button key={id} type="button" aria-label={`${SKINS[id].label} skin tone`} aria-pressed={skin === id} className={skin === id ? "is-on" : ""} style={{ background: `radial-gradient(circle at 35% 30%, ${SKINS[id].light}, ${SKINS[id].dark})` }} onClick={() => setSkin(id)} />
                ))}
              </div>
              <button type="button" className="tool-chip tool-chip--icon" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute sounds" : "Mute sounds"} aria-pressed={muted}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
              <button type="button" className="tool-chip tool-chip--icon" onClick={reset} aria-label="Reset look"><RotateCcw size={15} /></button>
            </div></>}
            <div className={`ship-badge ${sku ? "ship-badge--ready" : ""}`}>
              {sku ? <><Package size={14} /> <b>Ready to ship</b> · in our SA sample drop · <Link href={`/product/${sku.slug}`}>view</Link></> : <><Sparkles size={14} /> <b>Made to order</b> · built on the factory line for you</>}
            </div>
          </section>

          {/* OPTIONS */}
          <section ref={optionsRef} className="builder-options" role="tabpanel" aria-label={`${CATEGORIES.find((c) => c.id === tab)?.label} options`}>
            <div className="options-head">
              <h2>{CATEGORIES.find((c) => c.id === tab)?.label}</h2>
              <p>{CATEGORIES.find((c) => c.id === tab)?.hint}</p>
            </div>
            <OptionPanel tab={tab} config={cfg} update={update} points={points} />
            <NextStep tab={tab} onNext={openTab} onReview={() => { setModal("summary"); sound.slay(); }} />
            <ClosestWig config={cfg} exact={sku} onUse={(p) => { setConfig({ ...skuToConfig(p), name: cfg.name }); sound.slay(); react(); toast(`Switched to ${p.name}`, "chrome"); }} />
          </section>
        </div>

        {/* SPARKLE POINTS */}
        <div className="sparkle-meter" aria-live="polite">
          <span className="sparkle-meter__pts"><Sparkles size={14} /> {points} sparkle pts</span>
          <span className="sparkle-meter__next">{nextUnlockText(points)}</span>
        </div>

        {/* BOTTOM BAR */}
        <footer className="builder-bar">
          <div className="builder-bar__progress">
            <span>Your wig is <b>{progress}%</b> built{progress === 100 ? "! 💖" : visited.size === CATEGORIES.length && !cfg.name.trim() ? " · name it to finish" : ""}</span>
            <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Build progress"><i style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="builder-bar__price">
            <button type="button" className="price-pill" onClick={() => setShowBreakdown((v) => !v)} aria-expanded={showBreakdown}>
              <small>{sku ? "Price" : "Est. price"}</small>
              <strong key={price.total} className="price-pop">{formatMoney(price.total)}</strong>
              <Info size={13} />
            </button>
            {showBreakdown && <Breakdown lines={price.lines} total={price.total} exact={Boolean(sku)} onClose={() => setShowBreakdown(false)} />}
          </div>
          <div className="builder-bar__actions">
            <button type="button" className="gloss-btn gloss-btn--chrome" onClick={() => { setModal("save"); award("save", 25, "saved your look"); }}><Share2 size={16} /> <span>Save my look</span></button>
            <button type="button" className="gloss-btn gloss-btn--pink" onClick={() => { setModal("summary"); sound.slay(); }}><ShoppingBag size={16} /> <span>Order now</span></button>
          </div>
        </footer>

        {/* TOASTS */}
        <div className="builder-toasts" aria-live="polite">
          {toasts.map((t) => <div key={t.id} className={`builder-toast builder-toast--${t.tone}`}>{t.text}</div>)}
        </div>

        {modal === "summary" && <SummaryModal config={cfg} price={price} sku={sku} skin={skin} onClose={() => setModal(null)} onSave={() => setModal("save")} query={query} />}
        {modal === "save" && <SaveModal config={cfg} total={price.total} query={query} getSvg={svgMarkup} skin={skin} onClose={() => setModal(null)} />}
      </div>
    </SiteShell>
  );
}

/* ----------------------------- guided flow ----------------------------- */

function NextStep({ tab, onNext, onReview }: { tab: CategoryId; onNext: (id: CategoryId) => void; onReview: () => void }) {
  const i = CATEGORIES.findIndex((c) => c.id === tab);
  const next = CATEGORIES[i + 1];
  return (
    <div className="next-step">
      <span className="next-step__count">Step {i + 1} of {CATEGORIES.length}</span>
      {next
        ? <button type="button" className="gloss-btn gloss-btn--chrome" onClick={() => onNext(next.id)}>Next: {next.label} <ArrowRight size={15} /></button>
        : <button type="button" className="gloss-btn gloss-btn--pink" onClick={onReview}>Review &amp; order <ArrowRight size={15} /></button>}
    </div>
  );
}

/** The closest photographed, ready-to-ship wig: real photos for a custom build. */
function ClosestWig({ config, exact, onUse }: { config: WigConfig; exact?: WigProduct; onUse: (p: WigProduct) => void }) {
  const product = exact ?? nearestSku(config);
  const diffs = exact ? [] : differencesFromSku(config, product);
  const photos = hasPhotos(product);
  return (
    <aside className={`closest ${exact ? "closest--exact" : ""}`} aria-label="Closest ready-to-ship wig">
      <Link href={`/product/${product.slug}`} className="closest__thumb" aria-label={`See ${product.name}`}><SkuArt product={product} sizes="96px" /></Link>
      <div className="closest__body">
        <p className="closest__kicker">{exact ? <><Package size={13} /> This exact wig is in stock</> : <>{photos ? "See it for real" : "Closest wig in stock"}</>}</p>
        <p className="closest__name">{product.name} · <b>{formatMoney(product.price)}</b></p>
        {diffs.length > 0 && <p className="closest__diff">Your changes: {diffs.slice(0, 4).join(" · ")}{diffs.length > 4 ? ` · +${diffs.length - 4} more` : ""}</p>}
        <div className="closest__actions">
          <Link href={`/product/${product.slug}`} className="text-link">{photos ? "See photos & 360°" : "View wig"} <ArrowRight size={13} /></Link>
          {!exact && <button type="button" className="text-link" onClick={() => onUse(product)}>Start from this wig</button>}
        </div>
      </div>
    </aside>
  );
}

function nextUnlockText(points: number) {
  const next = COLOR_OPTIONS.filter((c) => c.locked && c.locked > points).sort((a, b) => a.locked! - b.locked!)[0];
  return next ? `${next.locked! - points} more to unlock ${next.label}` : "All colors unlocked. Icon behaviour.";
}

/* ================================ STAGE ================================ */

function Stage({ config, skin, angle, setAngle, compare, split, setSplit, showLace, stageRef, burst, reaction }: {
  config: WigConfig; skin: SkinId; angle: number; setAngle: (fn: (a: number) => number) => void; compare: boolean; split: number; setSplit: (n: number) => void;
  showLace: boolean; stageRef: React.RefObject<HTMLDivElement | null>; burst: number; reaction: { id: number; text: string } | null;
}) {
  const drag = useRef<{ x: number; active: boolean }>({ x: 0, active: false });
  const boxRef = useRef<HTMLDivElement>(null);
  const rad = (angle * Math.PI) / 180;
  const facing = Math.cos(rad) >= 0 ? "front" : "back";
  const squash = 0.42 + 0.58 * Math.abs(Math.cos(rad));
  const shift = Math.sin(rad) * 10;

  const onDown = (e: ReactPointerEvent) => {
    drag.current = { x: e.clientX, active: true };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag.current.active) return;
    if (compare) {
      const rect = boxRef.current?.getBoundingClientRect();
      if (rect) setSplit(Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100)));
      return;
    }
    const dx = e.clientX - drag.current.x;
    drag.current.x = e.clientX;
    setAngle((a) => a + dx * 0.9);
  };
  const onUp = () => { drag.current.active = false; };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); compare ? setSplit(Math.max(4, split - 5)) : setAngle((a) => a - 15); }
    if (e.key === "ArrowRight") { e.preventDefault(); compare ? setSplit(Math.min(96, split + 5)) : setAngle((a) => a + 15); }
  };

  return (
    <div
      className={`stage ${compare ? "stage--compare" : ""}`}
      ref={boxRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={onKey}
      tabIndex={0}
      aria-label={compare ? "Before and after comparison. Use arrow keys to move the divider." : "Wig preview. Use arrow keys to rotate."}
    >
      <div className="stage__glow" aria-hidden="true" />
      <div className="stage__mirror" aria-hidden="true" />
      <span className="stage__spark stage__spark--1" aria-hidden="true">✦</span>
      <span className="stage__spark stage__spark--2" aria-hidden="true">✧</span>
      <span className="stage__spark stage__spark--3" aria-hidden="true">✦</span>
      <div className="stage__figure" ref={stageRef}>
        {compare ? (
          <div className="compare">
            <WigRender config={config} mode="cap" skin={skin} className="wig-svg" title="Before: bare wig cap" />
            <div className="compare__after" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
              <WigRender config={config} skin={skin} className="wig-svg wig-svg--main" title={`After: ${shortSpec(config)}`} />
            </div>
            <div className="compare__line" style={{ left: `${split}%` }}><span>⇆</span></div>
            <span className="compare__tag compare__tag--before">BEFORE</span>
            <span className="compare__tag compare__tag--after">AFTER</span>
          </div>
        ) : (
          <div className="turntable" style={{ transform: `translateX(${shift}px) scaleX(${squash})` } as CSSProperties}>
            <WigRender config={config} view={facing} skin={skin} showLace={showLace && facing === "front"} className="wig-svg wig-svg--main" title={`Your wig: ${shortSpec(config)}`} />
          </div>
        )}
        <Pedestal bonnet={config.extras.includes("bonnet")} />
      </div>
      {showLace && !compare && <span className="lace-legend">Lace X-ray: {config.lace === "closure5x5" ? "5×5 parting zone" : "13×4 ear-to-ear lace"}</span>}
      {burst > 0 && <div key={burst} className="sparkle-burst" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ "--i": i } as CSSProperties}>{i % 3 ? "✦" : "♡"}</i>)}</div>}
      {reaction && <div key={reaction.id} className="slay-pop" aria-hidden="true">{reaction.text}</div>}
    </div>
  );
}

/* =============================== OPTIONS =============================== */

function OptionPanel({ tab, config, update, points }: { tab: CategoryId; config: WigConfig; update: (p: Partial<WigConfig>) => void; points: number }) {
  switch (tab) {
    case "lace":
      return (
        <>
          <OptionGrid>{LACE_OPTIONS.map((o) => <OptionCard key={o.id} selected={config.lace === o.id} onClick={() => update({ lace: o.id })} title={o.label} note={o.note} price={o.price} visual={<LaceIcon id={o.id} />} />)}</OptionGrid>
          <SubHead>Hair grade</SubHead>
          <OptionGrid cols={2}>{GRADE_OPTIONS.map((o) => <OptionCard key={o.id} selected={config.grade === o.id} onClick={() => update({ grade: o.id })} title={o.label} note={o.note} price={o.id === "14A" ? 1000 + TEXTURE_OPTIONS.find((t) => t.id === config.texture)!.price : 0} visual={<span className="glyph-badge">{o.id}</span>} />)}</OptionGrid>
          <SubHead>Part</SubHead>
          <OptionGrid cols={2}>{PART_OPTIONS.map((o) => <OptionCard key={o.id} selected={config.part === o.id} onClick={() => update({ part: o.id })} title={o.label} note={o.note} price={0} visual={<PartIcon side={o.id === "side"} />} />)}</OptionGrid>
        </>
      );
    case "texture":
      return <OptionGrid>{TEXTURE_OPTIONS.map((o) => <OptionCard key={o.id} selected={config.texture === o.id} onClick={() => update({ texture: o.id })} title={o.label} note={o.note} price={o.price} visual={<WigRender compact config={{ ...config, texture: o.id, length: clampLength(o.id, config.length), extras: [] }} className="mini-render" title={o.label} />} />)}</OptionGrid>;
    case "length": {
      const max = config.texture === "bob" ? BOB_MAX : LENGTH_MAX;
      return (
        <div className="length-panel">
          <div className="length-readout"><strong>{config.length}"</strong><span>{config.length <= 12 ? "Chin–jaw" : config.length <= 16 ? "Shoulder" : config.length <= 20 ? "Collarbone–chest" : config.length <= 24 ? "Mid-back" : "Waist-grazing"}</span></div>
          <input className="gloss-range" type="range" min={LENGTH_MIN} max={max} step={2} value={config.length} onChange={(e) => update({ length: Number(e.target.value) })} aria-label="Wig length in inches" style={{ "--fill": `${((config.length - LENGTH_MIN) / (max - LENGTH_MIN)) * 100}%` } as CSSProperties} />
          <div className="length-scale"><span>{LENGTH_MIN}"</span><span>{max}"</span></div>
          {config.texture === "bob" && <p className="panel-note">Bobs come in 10–14". Switch texture for longer lengths.</p>}
          <div className="length-quick">{[10, 14, 18, 22, 26, 30].filter((l) => l <= max).map((l) => <button key={l} type="button" className={config.length === l ? "is-on" : ""} onClick={() => update({ length: l })}>{l}"</button>)}</div>
          <p className="panel-note">Each inch over 18" adds {formatMoney(100)}; shorter lengths save {formatMoney(60)} per inch.</p>
        </div>
      );
    }
    case "color":
      return (
        <OptionGrid cols={3}>
          {COLOR_OPTIONS.map((o) => {
            const locked = Boolean(o.locked && points < o.locked);
            const cost = o.price + (o.perInch ? o.perInch * config.length : 0);
            return <OptionCard key={o.id} selected={config.color === o.id} disabled={locked} onClick={() => !locked && update({ color: o.id })} title={o.label} note={locked ? `Unlocks at ${o.locked} sparkle pts` : o.note} price={cost} visual={<span className={`swatch swatch--${o.id}`} style={{ background: o.id === "highlight" ? `repeating-linear-gradient(100deg, ${o.swatch.dark} 0 7px, ${o.swatch.light} 7px 11px)` : `radial-gradient(circle at 32% 28%, ${o.swatch.light}, ${o.swatch.base} 52%, ${o.swatch.dark})` }}>{locked && <Lock size={16} />}</span>} />;
          })}
        </OptionGrid>
      );
    case "density":
      return <OptionGrid>{DENSITY_OPTIONS.map((o) => <OptionCard key={o.id} selected={config.density === o.id} onClick={() => update({ density: o.id })} title={o.label} note={o.note} price={o.price} visual={<DensityIcon level={o.id} />} />)}</OptionGrid>;
    case "hairline":
      return <OptionGrid>{HAIRLINE_OPTIONS.map((o) => <OptionCard key={o.id} selected={config.hairline === o.id} onClick={() => update({ hairline: o.id })} title={o.label} note={o.note} price={o.price} visual={<HairlineIcon id={o.id} />} />)}</OptionGrid>;
    case "extras":
      return (
        <>
          <OptionGrid>
            {EXTRA_OPTIONS.map((o) => {
              const on = config.extras.includes(o.id);
              const toggle = () => {
                let extras: ExtraId[] = on ? config.extras.filter((x) => x !== o.id) : [...config.extras, o.id];
                if (!on && o.id === "bangs") extras = extras.filter((x) => x !== "curtain");
                if (!on && o.id === "curtain") extras = extras.filter((x) => x !== "bangs");
                update({ extras });
              };
              return <OptionCard key={o.id} multi selected={on} onClick={toggle} title={o.label} note={o.note} price={o.price} visual={<span className="glyph-badge glyph-badge--extra">{EXTRA_GLYPH[o.id]}</span>} />;
            })}
          </OptionGrid>
          <p className="panel-note">Pick as many as you like. One fringe at a time.</p>
        </>
      );
  }
}

const EXTRA_GLYPH: Record<ExtraId, string> = { knots: "◌", precut: "✂", bangs: "▔", curtain: "⌒", clips: "ღ", scarf: "∞", bonnet: "☁" };

function SubHead({ children }: { children: ReactNode }) { return <h3 className="options-subhead">{children}</h3>; }

function OptionGrid({ children, cols }: { children: ReactNode; cols?: number }) {
  return <div className="option-grid" style={cols ? ({ "--cols": cols } as CSSProperties) : undefined}>{children}</div>;
}

function OptionCard({ selected, onClick, title, note, price, visual, disabled, multi }: { selected: boolean; onClick: () => void; title: string; note: string; price: number; visual: ReactNode; disabled?: boolean; multi?: boolean }) {
  return (
    <button type="button" className={`option-card ${selected ? "is-selected" : ""} ${disabled ? "is-locked" : ""}`} onClick={onClick} aria-pressed={selected} aria-disabled={disabled || undefined} role={multi ? "checkbox" : undefined} aria-checked={multi ? selected : undefined}>
      <span className="option-card__visual">{visual}</span>
      <span className="option-card__title">{title}</span>
      <span className="option-card__note">{note}</span>
      <span className="option-card__price">{price === 0 ? "Included" : `${price > 0 ? "+" : "−"}${formatMoney(Math.abs(price))}`}</span>
      {selected && <span className="option-card__tick" aria-hidden="true"><Check size={12} /></span>}
    </button>
  );
}

/* ---------------------------- tiny option icons ---------------------------- */

function LaceIcon({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 64 64" className="opt-icon" aria-hidden="true">
      <ellipse cx="32" cy="36" rx="22" ry="24" fill="#f3d9c9" />
      {id === "closure5x5" ? <rect x="22" y="12" width="20" height="18" rx="3" fill="#ff1493" opacity="0.75" /> : <path d="M10 40 C10 18 22 12 32 12 C42 12 54 18 54 40 L48 40 C48 24 40 20 32 20 C24 20 16 24 16 40 Z" fill="#ff1493" opacity="0.75" />}
      {id === "glueless13x4" && <path d="M10 46 Q32 60 54 46" stroke="#cc5500" strokeWidth="3" fill="none" strokeDasharray="3 2" />}
    </svg>
  );
}
function PartIcon({ side }: { side: boolean }) {
  return <svg viewBox="0 0 64 64" className="opt-icon" aria-hidden="true"><path d="M8 50 C8 18 22 8 32 8 C42 8 56 18 56 50" fill="#2a1d1b" /><path d={side ? "M24 10 L22 30" : "M32 8 L32 30"} stroke="#f3d9c9" strokeWidth="3" strokeLinecap="round" /></svg>;
}
function DensityIcon({ level }: { level: number }) {
  const n = level === 150 ? 7 : level === 180 ? 10 : 13;
  return <svg viewBox="0 0 64 64" className="opt-icon" aria-hidden="true">{Array.from({ length: n }, (_, i) => <path key={i} d={`M${8 + (i * 48) / (n - 1)} 8 Q${4 + (i * 48) / (n - 1)} 32 ${8 + (i * 48) / (n - 1)} 56`} stroke="#2a1d1b" strokeWidth="2.6" fill="none" strokeLinecap="round" />)}</svg>;
}
function HairlineIcon({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 64 64" className="opt-icon" aria-hidden="true">
      <rect width="64" height="64" rx="12" fill="#a06a44" />
      <path d="M0 26 C14 14 50 14 64 26 L64 0 L0 0 Z" fill="#2a1d1b" />
      {id !== "natural" && <path d="M0 28 C14 17 50 17 64 28" stroke="#2a1d1b" strokeWidth="3" opacity="0.5" fill="none" />}
      {id === "babyhairs" && <path d="M10 26 c4 3 6 8 2 10 c-3 2 -6 -1 -4 -3 M54 26 c-4 3 -6 8 -2 10 c3 2 6 -1 4 -3" stroke="#2a1d1b" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

/* ============================== BREAKDOWN ============================== */

function Breakdown({ lines, total, exact, onClose }: { lines: { label: string; amount: number }[]; total: number; exact: boolean; onClose?: () => void }) {
  return (
    <div className="breakdown" role="region" aria-label="Price breakdown">
      {onClose && <button type="button" className="breakdown__close" onClick={onClose} aria-label="Close price breakdown"><X size={14} /></button>}
      <h3>Price breakdown</h3>
      <ul>{lines.map((l) => <li key={l.label}><span>{l.label}</span><b>{l.amount < 0 ? "−" : l.amount > 0 && l !== lines[0] ? "+" : ""}{formatMoney(Math.abs(l.amount))}</b></li>)}</ul>
      <p className="breakdown__total"><span>{exact ? "Total" : "Estimated total"}</span><b>{formatMoney(total)}</b></p>
      <p className="breakdown__note">{exact ? "This exact wig is one of our listed styles." : "Custom builds are estimates. We confirm the final price and lead time on WhatsApp before you pay."} Shipping not included.</p>
    </div>
  );
}

/* ============================ ORDER SUMMARY ============================ */

function orderMessage(config: WigConfig, total: number, shareUrl: string, ready: boolean) {
  const lines = specLines(config).map(([k, v]) => `• ${k}: ${v}`).join("\n");
  return `Hi BRATHOUSE! 💖 I built a wig on your site and want to order it.\n\n*${config.name.trim() || "My custom wig"}*\n${lines}\n\n${ready ? "Price" : "Estimated price"}: ${formatMoney(total)}\n${ready ? "Ready to ship from SA stock." : "Custom / made to order."}\n\nMy look: ${shareUrl}\n\nCan you confirm availability, final price and delivery?`;
}

function SummaryModal({ config, price, sku, skin, onClose, onSave, query }: { config: WigConfig; price: { lines: { label: string; amount: number }[]; total: number }; sku: ReturnType<typeof matchingSku>; skin: SkinId; onClose: () => void; onSave: () => void; query: string }) {
  const { addItem } = useStore();
  const renderRef = useRef<HTMLDivElement>(null);
  const shareUrl = absoluteUrl("/build", query);
  const name = config.name.trim() || "My custom wig";
  const addToBag = () => {
    const svg = renderRef.current?.querySelector("svg")?.outerHTML ?? "";
    const image = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'))}` : asset("images/brathouse-logo.webp");
    if (sku) addItem({ id: sku.slug, name: sku.name, kind: "wig", price: sku.price, image: sku.image, variant: shortSpec(config) });
    else addItem({ id: `custom-${query}`, name: `${name} (custom)`, kind: "custom", price: price.total, image, variant: shortSpec(config), link: pathWithQuery("/build", query) });
    onClose();
  };
  useEscape(onClose);
  return (
    <div className="b-modal" role="dialog" aria-modal="true" aria-labelledby="summary-title">
      <button type="button" className="b-modal__scrim" aria-label="Close" onClick={onClose} />
      <div className="b-modal__panel b-modal__panel--wide">
        <button type="button" className="b-modal__close" onClick={onClose} aria-label="Close order summary"><X size={18} /></button>
        <div className="summary">
          <div className="summary__visual" ref={renderRef}>
            <WigRender config={config} skin={skin} className="summary__svg" title={name} />
            <span className={`ship-badge ${sku ? "ship-badge--ready" : ""}`}>{sku ? <><Package size={14} /> Ready to ship</> : <><Sparkles size={14} /> Made to order</>}</span>
          </div>
          <div className="summary__info">
            <p className="builder-kicker"><Sparkles size={14} /> ORDER SUMMARY</p>
            <h2 id="summary-title" className="summary__name">{name}</h2>
            <dl className="summary__specs">{specLines(config).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <Breakdown lines={price.lines} total={price.total} exact={Boolean(sku)} />
            <div className="summary__actions">
              <a className="gloss-btn gloss-btn--whatsapp" href={whatsappLink(orderMessage(config, price.total, shareUrl, Boolean(sku)))} target="_blank" rel="noreferrer"><WhatsAppGlyph /> Send to WhatsApp</a>
              <button type="button" className="gloss-btn gloss-btn--pink" onClick={addToBag}><ShoppingBag size={16} /> Add to bag</button>
              <button type="button" className="gloss-btn gloss-btn--chrome" onClick={onSave}><Share2 size={16} /> Save & share</button>
            </div>
            {BUSINESS.whatsappIsPlaceholder && <p className="panel-note">Demo: WhatsApp opens with your look pre-filled, but the business number is still a placeholder.</p>}
            <button type="button" className="text-link" onClick={onClose}><ArrowLeft size={14} /> Keep styling</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppGlyph() {
  return <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.4-.3Z" /></svg>;
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

/* ============================== SAVE / SHARE ============================== */

async function makeStoryCard(svg: string, config: WigConfig, total: number): Promise<Blob | null> {
  if (!svg) return null;
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    await Promise.race([
      Promise.all([document.fonts.load('80px "Titan One"'), document.fonts.load('28px "Space Mono"'), document.fonts.load('600 30px "DM Sans"')]),
      new Promise((resolve) => window.setTimeout(resolve, 1500)),
    ]);
  } catch { /* fonts optional */ }
  // background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#ffd1e8"); bg.addColorStop(0.45, "#ff7ac0"); bg.addColorStop(1, "#cc5500");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // chrome halo
  const halo = ctx.createRadialGradient(W / 2, 760, 60, W / 2, 760, 560);
  halo.addColorStop(0, "rgba(255,255,255,0.9)"); halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo; ctx.fillRect(0, 160, W, 1200);
  // sparkles
  ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = '64px "Titan One", sans-serif';
  [[120, 260], [930, 340], [160, 1180], [920, 1080], [540, 160]].forEach(([x, y], i) => ctx.fillText(i % 2 ? "✧" : "✦", x, y));
  // wig render
  const img = new Image();
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.includes("xmlns=") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'))}`;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); img.src = src; });
  if (img.complete && img.naturalWidth) ctx.drawImage(img, 140, 260, 800, 1000);
  // logo
  const logo = new Image();
  await new Promise<void>((resolve) => { logo.onload = () => resolve(); logo.onerror = () => resolve(); logo.src = asset("images/brathouse-logo.webp"); });
  if (logo.naturalWidth) ctx.drawImage(logo, W / 2 - 90, 40, 180, 180);
  // text card
  ctx.fillStyle = "rgba(255,253,248,0.94)";
  roundRect(ctx, 70, 1300, W - 140, 520, 48); ctx.fill();
  ctx.strokeStyle = "#0a0a0a"; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = "#ff1493"; ctx.textAlign = "center";
  ctx.font = '84px "Titan One", Impact, sans-serif';
  ctx.fillText((config.name.trim() || "My custom wig").toUpperCase(), W / 2, 1410, W - 200);
  ctx.fillStyle = "#242124"; ctx.font = '30px "Space Mono", monospace';
  const spec = specLines(config).filter(([k]) => k !== "Extras").map(([, v]) => v);
  [spec.slice(0, 3).join(" · "), spec.slice(3).join(" · ")].forEach((line, i) => ctx.fillText(line, W / 2, 1480 + i * 46, W - 200));
  ctx.fillStyle = "#cc5500"; ctx.font = '72px "Titan One", Impact, sans-serif';
  ctx.fillText(formatMoney(total), W / 2, 1650);
  ctx.fillStyle = "#0a0a0a"; ctx.font = '600 32px "DM Sans", sans-serif';
  ctx.fillText(`Built at ${BUSINESS.displayDomain} · ${BUSINESS.instagram}`, W / 2, 1740);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function SaveModal({ config, total, query, getSvg, skin, onClose }: { config: WigConfig; total: number; query: string; getSvg: () => string; skin: SkinId; onClose: () => void }) {
  const shareUrl = absoluteUrl("/build", query);
  const [copied, setCopied] = useState(false);
  const [card, setCard] = useState<{ url: string; blob: Blob } | null>(null);
  const [contact, setContact] = useState("");
  const [saved, setSaved] = useState(false);
  const hiddenRef = useRef<HTMLDivElement>(null);
  useEscape(onClose);
  useEffect(() => {
    let url = "";
    // always draw the front view for the card
    const svg = hiddenRef.current?.querySelector("svg")?.outerHTML || getSvg();
    void makeStoryCard(svg, config, total).then((blob) => { if (blob) { url = URL.createObjectURL(blob); setCard({ url, blob }); } });
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [config, total, getSvg]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { window.prompt("Copy your look link:", shareUrl); }
  };
  const fileName = `${(config.name.trim() || "brathouse-wig").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  const shareCard = async () => {
    if (!card) return;
    const file = new File([card.blob], fileName, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: config.name || "My BRATHOUSE wig", text: `Built my wig at BRATHOUSE ✦ ${shareUrl}` }); return; } catch { /* cancelled */ }
    }
    const a = document.createElement("a"); a.href = card.url; a.download = fileName; a.click();
  };
  const saveContact = () => {
    if (contact.trim().length < 6) return;
    const leads = read<{ contact: string; look: string; at: string }[]>(LEADS_KEY, []);
    write(LEADS_KEY, [...leads, { contact: contact.trim(), look: shareUrl, at: new Date().toISOString() }]);
    setSaved(true);
  };
  return (
    <div className="b-modal" role="dialog" aria-modal="true" aria-labelledby="save-title">
      <button type="button" className="b-modal__scrim" aria-label="Close" onClick={onClose} />
      <div className="b-modal__panel b-modal__panel--wide">
        <button type="button" className="b-modal__close" onClick={onClose} aria-label="Close save dialog"><X size={18} /></button>
        <div ref={hiddenRef} className="sr-only" aria-hidden="true"><WigRender config={config} skin={skin} /></div>
        <div className="save">
          <div className="save__card">
            {card ? <img src={card.url} alt={`Story card for ${config.name || "your wig"}`} /> : <div className="save__card-loading">Glossing your story card…</div>}
          </div>
          <div className="save__info">
            <p className="builder-kicker"><Sparkles size={14} /> SAVE MY LOOK</p>
            <h2 id="save-title" className="summary__name">Your look is saved ✦</h2>
            <p className="save__lede">Share the link or post the card to your Stories. Anyone who opens the link sees your exact build.</p>
            <div className="share-link"><input readOnly value={shareUrl} aria-label="Shareable link" onFocus={(e) => e.currentTarget.select()} /><button type="button" className="gloss-btn gloss-btn--chrome" onClick={copy}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button></div>
            <div className="summary__actions">
              <button type="button" className="gloss-btn gloss-btn--pink" onClick={shareCard} disabled={!card}><Download size={16} /> Story card (IG / TikTok)</button>
              <a className="gloss-btn gloss-btn--whatsapp" href={`https://wa.me/?text=${encodeURIComponent(`Rate my wig build 👀✦ ${shareUrl}`)}`} target="_blank" rel="noreferrer"><WhatsAppGlyph /> Send to a friend</a>
            </div>
            <div className="capture">
              <label htmlFor="capture">Want us to hold this design? <span>(optional)</span></label>
              <div className="share-link"><input id="capture" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="WhatsApp number or email" autoComplete="email" /><button type="button" className="gloss-btn gloss-btn--chrome" onClick={saveContact} disabled={saved}>{saved ? <><Check size={15} /> Saved</> : <>Save <ArrowRight size={14} /></>}</button></div>
              {saved && <p className="panel-note">Saved on this device (demo). Connect this to your CRM or a Google Sheet before launch.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
