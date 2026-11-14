/**
 * On-device face detection for the photo try-on (MediaPipe BlazeFace).
 * The photo is never uploaded: only the model files are downloaded, and the
 * image is analysed in the browser.
 *
 * Loaded lazily the first time someone opens try-on.
 */
import type { FaceDetector } from "@mediapipe/tasks-vision";

// Keep the wasm version in step with the npm package (package.json).
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

/** Face position as fractions of the image (0–1), so it works at any display size. */
export type FaceFit = {
  /** Midpoint between the eyes. */
  eyeX: number;
  eyeY: number;
  /** Distance between the eyes, as a fraction of image width. */
  eyeDist: number;
  /** Head tilt in degrees (positive = clockwise). */
  roll: number;
  confidence: number;
};

let detectorPromise: Promise<FaceDetector> | null = null;

function loadDetector() {
  detectorPromise ??= (async () => {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
    });
  })().catch((e) => {
    detectorPromise = null; // allow a retry
    throw e;
  });
  return detectorPromise;
}

/** Start downloading the model early (e.g. when the try-on panel opens). */
export function warmUpFaceDetector() {
  void loadDetector().catch(() => undefined);
}

/**
 * Find the most prominent face. Returns null if none is found or the model
 * can't load (offline, blocked CDN): callers fall back to manual placement.
 */
export async function detectFace(source: HTMLCanvasElement): Promise<FaceFit | null> {
  let detector: FaceDetector;
  try {
    detector = await loadDetector();
  } catch {
    return null;
  }
  const result = detector.detect(source);
  const best = [...result.detections].sort((a, b) => (b.categories[0]?.score ?? 0) - (a.categories[0]?.score ?? 0))[0];
  if (!best) return null;
  const W = source.width, H = source.height;
  const kp = best.keypoints; // normalized: 0 right eye, 1 left eye, 2 nose, 3 mouth, 4 right ear, 5 left ear
  if (kp.length >= 2) {
    const [a, b] = [kp[0], kp[1]];
    // Person's right eye appears on the image's left.
    const [l, r] = a.x < b.x ? [a, b] : [b, a];
    const dx = (r.x - l.x) * W, dy = (r.y - l.y) * H;
    return {
      eyeX: (l.x + r.x) / 2,
      eyeY: (l.y + r.y) / 2,
      eyeDist: Math.hypot(dx, dy) / W,
      roll: (Math.atan2(dy, dx) * 180) / Math.PI,
      confidence: best.categories[0]?.score ?? 0,
    };
  }
  const box = best.boundingBox;
  if (!box) return null;
  return { eyeX: (box.originX + box.width / 2) / W, eyeY: (box.originY + box.height * 0.38) / H, eyeDist: (box.width * 0.42) / W, roll: 0, confidence: best.categories[0]?.score ?? 0 };
}

/** Draw a File into a canvas (EXIF rotation applied, max 1280px) for display and detection. */
export async function fileToCanvas(file: File, maxSide = 1280): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions).catch(() => createImageBitmap(file));
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas;
}
