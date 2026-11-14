#!/usr/bin/env node
/**
 * Turn a raw BRATHOUSE shoot folder into web-ready media.
 *
 *   pnpm media:process [shootDir] [--only 05] [--no-video]
 *
 * shootDir defaults to ./shoot (git-ignored). Its layout follows
 * docs/brathouse/photo-shoot-guide.md:
 *
 *   shoot/
 *     01-bob-black-10/
 *       01-bob-black-10_01_front.jpg ... _13_hand.jpg
 *       spin/000.jpg 015.jpg ... 345.jpg
 *       01-bob-black-10_vid_turntable.mp4 ...
 *
 * Output: client/public/wigs/<slug>/... and shared/wigMedia.generated.json.
 * Re-running is safe: each processed wig's output folder is rebuilt from scratch,
 * other wigs in the manifest are kept.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_ROOT = path.join(ROOT, "client", "public", "wigs");
const MANIFEST = path.join(ROOT, "shared", "wigMedia.generated.json");

/** Shoot folder number -> catalog slug (shared/catalog.ts). Keep in sync with the shoot guide. */
const FOLDER_TO_SLUG = {
  "01": "12a-5x5-10-bob-black",
  "02": "12a-5x5-10-bob-highlight",
  "03": "12a-180-13x4-18-straight-black-glueless",
  "04": "12a-180-13x4-20-straight-black-glueless",
  "05": "12a-180-13x4-20-body-black-glueless",
  "06": "12a-180-13x4-20-body-highlight-glueless",
  "07": "12a-180-13x4-20-curly-black-glueless",
  "08": "12a-180-13x4-18-afro-kinky-black-glueless",
  "09": "14a-13x4-20-straight-black-glueless",
  "10": "14a-13x4-20-body-black-glueless",
};

// Same order as shared/wigMedia.ts SHOTS; index + 1 = shot number in the guide.
const SHOTS = ["front", "three-quarter-left", "left", "back", "right", "three-quarter-right", "hairline", "part", "texture", "ends", "cap", "length", "hand"];
// Extra words people might type instead of the canonical name.
const SHOT_ALIASES = { "3q-left": "three-quarter-left", "3q-right": "three-quarter-right", "profile-left": "left", "profile-right": "right", inside: "cap", "hand-in-hair": "hand" };
const VIDEO_KINDS = ["turntable", "hand", "hairline", "brush", "walkaround"];

const STILL_WIDTHS = [480, 960, 1600];
const SPIN_WIDTH = 1000;
const IMAGE_EXT = /\.(jpe?g|png|webp|tiff?|heic|heif)$/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|webm)$/i;

// ---------------------------------------------------------------- args
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const shootDir = path.resolve(args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--only") ?? path.join(ROOT, "shoot"));
const only = opt("--only");
const skipVideo = flag("--no-video");

if (!fs.existsSync(shootDir)) {
  console.error(`Shoot folder not found: ${shootDir}\nCopy the shoot into ./shoot or pass its path.`);
  process.exit(1);
}

const hasFfmpeg = !skipVideo && spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
if (!skipVideo && !hasFfmpeg) console.warn("! ffmpeg not found: videos will be copied as-is (no compression, no posters).");

// ---------------------------------------------------------------- helpers
const toPublic = (abs) => "/" + path.relative(path.join(ROOT, "client", "public"), abs).split(path.sep).join("/");
const files = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => !f.startsWith(".")).sort() : []);

function shotFor(filename) {
  const base = filename.toLowerCase().replace(/\.[^.]+$/, "");
  // Prefer the explicit number: "<folder>_07_hairline" -> 07
  const num = base.match(/_(\d{2})(?:_|$)/);
  if (num) {
    const idx = Number(num[1]) - 1;
    if (SHOTS[idx]) return SHOTS[idx];
  }
  // Otherwise match a name, longest first so "three-quarter-left" beats "left".
  const names = [...SHOTS, ...Object.keys(SHOT_ALIASES)].sort((a, b) => b.length - a.length);
  const hit = names.find((n) => base.includes(n));
  return hit ? (SHOT_ALIASES[hit] ?? hit) : undefined;
}

async function still(src, outDir, name) {
  const img = sharp(src).rotate(); // apply EXIF orientation
  const meta = await img.metadata();
  const portrait = (meta.orientation ?? 1) >= 5;
  const width = portrait ? meta.height : meta.width;
  const height = portrait ? meta.width : meta.height;
  const srcset = {};
  for (const w of STILL_WIDTHS) {
    if (w > width && Object.keys(srcset).length) break; // never upscale beyond first size
    const target = Math.min(w, width);
    const out = path.join(outDir, `${name}-${target}.webp`);
    await sharp(src).rotate().resize({ width: target, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
    srcset[target] = toPublic(out);
  }
  return { srcset, width, height };
}

function video(src, outDir, kind) {
  const out = path.join(outDir, `${kind}.mp4`);
  if (!hasFfmpeg) {
    fs.copyFileSync(src, out);
    return { src: toPublic(out) };
  }
  const poster = path.join(outDir, `${kind}-poster.webp`);
  // 1080p max on the long side, H.264, no audio, fast start for streaming.
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf", "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", out]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "0.5", "-i", out, "-frames:v", "1", "-vf", "scale=960:-2", poster]);
  return { src: toPublic(out), poster: toPublic(poster) };
}

// ---------------------------------------------------------------- main
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const report = [];

for (const folder of files(shootDir).sort((a, b) => a.localeCompare(b, "en", { numeric: true }))) {
  const dir = path.join(shootDir, folder);
  if (!fs.statSync(dir).isDirectory()) continue;
  const num = folder.match(/^(\d{2})-/)?.[1];
  const slug = num && FOLDER_TO_SLUG[num];
  if (!slug) {
    if (!folder.startsWith("00")) console.warn(`- skipping ${folder} (no matching wig number)`);
    continue;
  }
  if (only && only !== num) continue;

  console.log(`\n▸ ${folder} -> ${slug}`);
  const outDir = path.join(OUT_ROOT, slug);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, "spin"), { recursive: true });

  const entry = { source: folder, shots: {}, spin: [], videos: {} };
  const unmatched = [];

  // Stills
  for (const f of files(dir).filter((f) => IMAGE_EXT.test(f))) {
    const shot = shotFor(f);
    if (!shot) { unmatched.push(f); continue; }
    if (entry.shots[shot]) { console.warn(`  ! duplicate ${shot}: keeping first, ignoring ${f}`); continue; }
    try {
      entry.shots[shot] = await still(path.join(dir, f), outDir, shot);
    } catch (e) {
      console.warn(`  ! could not read ${f} (${e.message.split("\n")[0]}). HEIC? Export as JPG.`);
    }
  }

  // Spin frames: named by angle (000.jpg) or just in shooting order.
  const spinDir = path.join(dir, "spin");
  const frames = files(spinDir).filter((f) => IMAGE_EXT.test(f));
  const numbered = frames.every((f) => /^\d+/.test(f));
  const ordered = numbered ? frames.sort((a, b) => parseInt(a) - parseInt(b)) : frames;
  for (const [i, f] of ordered.entries()) {
    const angle = numbered ? parseInt(f) % 360 : Math.round((360 / ordered.length) * i);
    const out = path.join(outDir, "spin", `${String(angle).padStart(3, "0")}.webp`);
    const info = await sharp(path.join(spinDir, f)).rotate().resize({ width: SPIN_WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
    entry.spinSize ??= { width: info.width, height: info.height };
    entry.spin.push({ angle, src: toPublic(out) });
  }

  // Videos
  if (!skipVideo) {
    for (const f of files(dir).filter((f) => VIDEO_EXT.test(f))) {
      const kind = VIDEO_KINDS.find((k) => f.toLowerCase().includes(`vid_${k}`) || f.toLowerCase().includes(k));
      if (!kind) { unmatched.push(f); continue; }
      process.stdout.write(`  video ${kind}… `);
      entry.videos[kind] = video(path.join(dir, f), outDir, kind);
      console.log("done");
    }
  }

  manifest[slug] = entry;
  const missing = SHOTS.filter((s) => !entry.shots[s]);
  report.push({ folder, shots: Object.keys(entry.shots).length, spin: entry.spin.length, videos: Object.keys(entry.videos).length, missing, unmatched });
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

console.log("\n─── summary ───");
for (const r of report) {
  console.log(`${r.folder}: ${r.shots}/13 shots, ${r.spin} spin frames, ${r.videos} videos`);
  if (r.missing.length) console.log(`   missing: ${r.missing.join(", ")}`);
  if (r.unmatched.length) console.log(`   couldn't place: ${r.unmatched.join(", ")}`);
  if (r.spin && r.spin < 24) console.log(`   spin has only ${r.spin} frames (24+ looks smooth)`);
}
const missingWigs = Object.entries(FOLDER_TO_SLUG).filter(([, s]) => !manifest[s]).map(([n]) => n).sort();
if (missingWigs.length) console.log(`\nNo media yet for wig folders: ${missingWigs.join(", ")} (they keep the drawn art).`);
console.log(`\nManifest: ${path.relative(ROOT, MANIFEST)}`);
