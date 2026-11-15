# "See it on me" (AI try-on): setup

The builder's **Try on me** panel has two layers:

1. **Live preview** (always on, free): the drawn wig placed on the customer's photo using face detection that runs on their phone. The photo is never uploaded.
2. **See it on me (AI)** (needs the server plus an AI key): one tap sends the photo, the build spec and the closest real wig's front photo to an image AI, which returns a realistic picture of the customer wearing it.

## How the AI part works

- Client: `client/src/components/AiTryOn.tsx`: consent screen (checkbox required), loading state, result with Save, count of free previews left.
- Server: `server/tryOn.ts`, registered in `server/_core/index.ts`:
  - `GET /api/try-on/status`: is it on, and how many previews this visitor has left.
  - `POST /api/try-on`: validates the request (consent, JPG/PNG/WebP, max 2 MB, valid build), checks limits, then calls the provider.
- The prompt asks the AI to keep the person's face, skin, pose and background unchanged and replace only the hair. It includes the full build spec, and the closest real wig's front photo once the shoot has been processed.
- Photos are held in memory for the request only, never saved or logged.
- If the AI fails, the visitor gets their use back.

## Switching it on

The static demo build has no server, so the button shows "coming soon". On the real server, set these env vars:

```
TRYON_PROVIDER=gemini          # or "mock" to test the flow without an AI bill
GEMINI_API_KEY=...             # from Google AI Studio; server-side only
TRYON_GEMINI_MODEL=gemini-2.5-flash-image   # optional
TRYON_DAILY_LIMIT=3            # free previews per visitor per 24h
TRYON_GLOBAL_DAILY=200         # all visitors per 24h: the spend cap
TRUST_PROXY=1                  # if behind a proxy/CDN, so limits use the real IP
```

Local test with the mock provider: use the `brathouse-server` entry in `.claude/launch.json` (port 3100), or:

```bash
TRYON_PROVIDER=mock PORT=3100 npx pnpm@10.18.0 dev
```

## Before going live

- **Test quality first.** Run the Gemini provider on 10–20 real selfies (different skin tones, hair types, lighting) with the real wig photos. The Gemini adapter is written to Google's documented API but **has not been run against a real key yet**. If results are weak, add a second provider (e.g. Perfect Corp YouCam hairstyle API) behind the same `TryOnProvider` interface.
- **Cost:** each preview is one image generation. `TRYON_GLOBAL_DAILY` caps the daily bill. Check current pricing before choosing the cap.
- **POPIA:** the consent text is in `AiTryOn.tsx`. Have the privacy policy mention the AI partner, that photos aren't stored, and the age requirement.
- **Limits** are kept in memory, so they reset when the server restarts. That's fine for one server; move them to the database or Redis if the site runs on several.
- **More previews:** the 429 message points people to WhatsApp. A later step could unlock extra previews after they share a WhatsApp number.
