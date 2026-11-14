# AI "try it on your head" plan (11 Nov 2026)

- **Use generative image editing, not an AR overlay.** Inputs: the customer's selfie, a reference photo of the closest real wig (from the factory photo set), and text for the specifics (length, bangs, part, baby hairs).
- **Two routes to test:**
  - Perfect Corp YouCam AI Hairstyle API, which accepts a custom reference image.
  - Google's Gemini image editing ("Nano Banana"), using a two-image prompt: "use image 1 as the person and image 2 only as the hairstyle reference".
- **Generate once, not on every tap.** Trigger it at a "See it on me" step, cap free generations (about 3), and unlock more with a WhatsApp number.
- **Server-side only.** API keys stay on the server, never in the browser.
- **Privacy.** Get consent, don't store selfies, and label results as an AI preview. Check POPIA requirements.
- **Test first.** Manual tests on a range of skin tones and hair types before building anything.

The full Chinese factory request (prices, photos, lead times) is in the claude.ai project doc `claude/factory-request-and-try-on-plan.md`.
