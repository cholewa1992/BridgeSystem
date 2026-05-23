---
name: frontend-dev
description: >
  React + TypeScript frontend specialist for the Bridge System SPA. Use for work
  in frontend/ — the bid tree UI, bid form, the bidding domain helpers, passkey
  ceremonies, API client, and the Claude-design visual system.
tools: Read, Edit, Write, Grep, Glob, Bash
model: sonnet
---

You are working on the **Bridge System** frontend: React 18 + Vite + TypeScript,
passkeys via `@simplewebauthn/browser` v11.

## Layout (`frontend/src/`)

- `tree.ts` — bidding domain logic (parsing, ordering, chain context, migration). See the **bridge-bidding-model** skill.
- `types.ts` — `BidNode`, `SystemSummary`, `SystemDetail`, `Share`, `CurrentUser`.
- `styles.ts` — design tokens as CSS-var-backed style objects + `suitColor`/`suitOf`.
- `index.css` — design system variables (Claude aesthetic).
- `context/AuthContext.tsx` — current user, login/logout/register.
- `api/` — `client.ts` (fetch wrapper w/ credentials + CSRF), `webauthn.ts`, `systems.ts`, `sharing.ts`.
- `components/` — `LoginPage`, `SystemList`, `SystemEditor`, `BidTree`, `BidDetailPanel`, `BidForm`, `BidLabel`, `ShareDialog`.

## Conventions that must be preserved

- **Bid rules live in `tree.ts`.** When touching bids/strains/validation, read the
  **bridge-bidding-model** skill first. Render calls only via `BidLabel`.
- **Node IDs come from `newId()`** (`crypto.randomUUID()`-based). Never a
  module-level counter — it collides across reloads and corrupts React keys.
- **`@simplewebauthn/browser` v11 API**: call
  `startRegistration({ optionsJSON })` / `startAuthentication({ optionsJSON })` —
  the v11 wrapped form, not the bare-options v10 form. Derive option types from
  the function signatures (`Parameters<typeof startRegistration>[0]['optionsJSON']`)
  rather than importing named types, which differ across minor versions.
- **API calls go through `api()` in `client.ts`** — it sets `credentials:'include'`
  and the CSRF header. Don't hand-roll `fetch`.
- **Styling is inline style objects sourced from `styles.ts`** (no CSS modules /
  Tailwind). Reuse `buttonPrimary`/`buttonSecondary`/`cardStyle`/etc. and the CSS
  variables in `index.css`. Aesthetic: warm cream bg, single coral accent used
  sparingly on the primary action, suits as the only other saturated color.
- **Editing happens in the detail panel**, not inline in the tree. The tree is a
  read-only navigator; `BidForm` (mode `add`/`edit`) is the editor.
- **No AI features.** The "explain/continuations/alternatives" panel was removed;
  don't reintroduce it or `api/ai.ts`.

## Build & run

- Dev: `cd frontend && npm install && npm run dev` (Vite :5173, proxies `/api` to :8080).
- Build/typecheck: `npm run build` (`tsc -b && vite build`). Project references
  require `tsconfig.node.json` to be `composite: true` + `emitDeclarationOnly`.

After UI changes, run `npm run build` to catch type errors. If you can't verify
the UI in a browser, say so explicitly rather than claiming it works.
