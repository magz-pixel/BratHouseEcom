# Shoot → website: photo pipeline

How the shoot photos (see [photo-shoot-guide.md](photo-shoot-guide.md)) get onto the site.

## Steps

1. Copy the whole shoot folder into the repo as `./shoot/` (it is git-ignored; keep the originals in Drive).
   The wig folders must start with their number: `01-…` to `10-…`.
2. Run:

   ```bash
   pnpm media:process
   ```

   Options: `pnpm media:process path/to/shoot`, `--only 05` (one wig), `--no-video`.
3. Read the summary. It lists missing shots, files it couldn't place, and short spins.
4. Check the shop and product pages (`pnpm dev:static`), then commit `client/public/wigs/` and `shared/wigMedia.generated.json`.

## What it does

| Input | Output (`client/public/wigs/<slug>/`) |
| --- | --- |
| `<folder>_NN_<shot>.jpg` (13 named shots) | `<shot>-480.webp`, `-960.webp`, `-1600.webp` (EXIF rotation applied) |
| `spin/000.jpg … 345.jpg` | `spin/000.webp …` at 1000px wide, ordered by angle |
| `<folder>_vid_<kind>.mp4` | `<kind>.mp4` (1080p H.264, no audio, fast-start) + `<kind>-poster.webp`, if ffmpeg is installed. Otherwise copied unchanged. |

It also writes `shared/wigMedia.generated.json`, which the site reads through `shared/wigMedia.ts`.

- A shot is matched by its number (`_07_`) first, then by name (`hairline`).
- Spin frames are matched by the angle in the filename. If they aren't numbered, they're spread evenly in filename order.
- iPhone HEIC files may fail. Export them as JPG ("Most Compatible" camera setting).

## On the site

- `SkuArt` (`client/src/components/LookArt.tsx`) shows the **front** photo when a wig has one, and the drawn illustration when it doesn't. This applies to shop cards, product pages and cart thumbnails.
- The "Illustration · real photos coming soon" note disappears for wigs that have photos.
- Folder number → product mapping lives at the top of `scripts/process-shoot.mjs` (`FOLDER_TO_SLUG`).

## Not yet built (next steps)

- Product page gallery (angles, close-ups, videos): the data is already in the manifest.
- Done: 360° spin viewer (`client/src/components/SpinViewer.tsx`) shows on product pages as a Photo / 360° toggle once a wig has 8+ spin frames.
- Background-removed cut-outs for the try-on: planned for the try-on step.
- Size: around 1–2 MB of WebP per wig plus videos. If the repo gets heavy, move `client/public/wigs` to a CDN or object storage and point the manifest URLs there.
