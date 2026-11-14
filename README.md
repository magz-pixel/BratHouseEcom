# BRATHOUSE — wigs, built your way

South African wig storefront with a custom **Build Your Wig** studio. React 19 + Vite + Tailwind on the front end; an Express/tRPC server (from the original Manus starter) is kept for later payments and orders.

## Run it

```bash
pnpm install
pnpm dev:static   # storefront only, http://localhost:3000
pnpm dev          # full Express server
pnpm check        # TypeScript
pnpm test         # Vitest (pricing model + server)
pnpm build:static # static site into dist/public
```

No global pnpm? Prefix commands with `npx pnpm@10.18.0`.

Static demo build (works from any folder / file host): `VITE_HASH_ROUTER=1 pnpm exec vite build --base ./`

## Where things live

| What | Where |
| --- | --- |
| Pages and routes | `client/src/pages/`, `client/src/App.tsx` |
| Build Your Wig studio | `client/src/pages/BuildPage.tsx`, `client/src/components/WigRender.tsx` |
| Pricing model (+ tests) | `shared/wigBuilder.ts`, `shared/wigBuilder.test.ts` |
| Ready-to-ship catalog | `shared/catalog.ts` |
| **Launch placeholders** (WhatsApp, domain, socials, share image) | `shared/business.ts` |
| Plans, pricing data, AI try-on plan | `docs/brathouse/` |

## Ordering

WhatsApp-first until a South African payment gateway is connected. Checkout never takes payment.

CI (`.github/workflows/ci.yml`) runs typecheck, tests and the static build on every push and PR.
