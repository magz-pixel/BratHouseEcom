# BRATHOUSE — wig e-commerce site

React + Vite storefront (originally Manus-generated) with a custom "Build Your Wig" studio.

- Builder: `client/src/pages/BuildPage.tsx`, renderer `client/src/components/WigRender.tsx`, model/pricing `shared/wigBuilder.ts` (tests in `shared/wigBuilder.test.ts`).
- Shoot photos → site: `pnpm media:process` (`scripts/process-shoot.mjs`) writes `client/public/wigs/` + `shared/wigMedia.generated.json`; see `docs/brathouse/photo-pipeline.md`.
- Business placeholders (WhatsApp number, domain): `shared/business.ts`.
- Plans and decoded factory price data: `docs/brathouse/` (synced from the claude.ai project).
- Pricing rules decided: 38% target gross margin (floor 33%), add-ons 40%, FX ¥1 = R2.55, round to R…99; combos without factory data → "quote on WhatsApp".
- Run: `pnpm install`, `pnpm dev`, `pnpm test`. Static demo build: `VITE_HASH_ROUTER=1 vite build --base ./`.
