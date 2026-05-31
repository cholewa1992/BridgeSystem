# Frontend Modernization

This work is complete. The doc below records what was done and why — it is
preserved as a historical reference, not an active checklist.

**Features added after this work landed are documented separately:**
- [Convention Library](convention-library.md) — reusable parametrized bid subtrees
- [Gallery](gallery.md) — public browsing of systems and conventions
- [i18n](i18n.md) — English and Danish translation
- [Mobile layout](mobile-layout.md) — master/detail pane switching on small screens

---

The UI was already polished before this pass; the work targeted *code* quality.

## Why

Three concrete sources of messiness, confirmed by exploring `frontend/src`:

1. **~156 inline `style={{}}` objects** across 8 components, with heavy
   duplication of layout/spacing/typography (e.g.
   `{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }` appears ~25×).
   This is what reads as "messy" in the JSX.
2. **Hand-rolled server state** — `useEffect → setState → .catch` plus a manual
   `refresh()` pattern repeated in `SystemEditor`, `SystemList`, `ShareDialog`.
   `SystemEditor` alone holds 13 `useState` calls, a bespoke `saveState`
   machine, and a debounced auto-save.
3. **No tests, no ESLint config file, no Prettier** (ESLint is installed but
   unconfigured).

Foundation worth preserving: a complete CSS design-token system in
`frontend/src/index.css` (`--bg`, `--accent`, `--radius-md`, `--shadow-md`,
fonts, suit colors). All work below keeps these tokens as the source of truth.

---

## Now (high-impact)

### Part 1 — Tailwind CSS

- [x] Install Tailwind v4 + `@tailwindcss/vite`; add `clsx`.
- [x] Register the Tailwind plugin in `frontend/vite.config.ts`.
- [x] In `index.css`: add the Tailwind import and an `@theme` block that maps
      the existing `:root` custom properties into Tailwind's theme, so
      utilities resolve to current tokens (`bg-surface`, `text-fg-muted`,
      `rounded-md`, `shadow-md`, `border-border-strong`, `font-display/ui`,
      suit colors). Keep the `:root` block as the source of truth.
- [x] Create reusable components under `frontend/src/components/ui/`:
      `Button.tsx` (variants primary/secondary/ghost/danger, size sm),
      `Card.tsx`, `Input.tsx`, `Textarea.tsx`, `Label.tsx`.
- [x] Trim `styles.ts` to the domain helpers only: `suitColor`, `suitOf`,
      `SUITS` (these are bid logic, not styling).
- [x] Migrate components leaf-first, replacing inline styles with Tailwind
      utilities + `ui/` components, preserving exact visual output. Dynamic
      styles use conditional class strings / `clsx`:
  - [x] `BidLabel.tsx`
  - [x] `BidTree.tsx`
  - [x] `SystemList.tsx`
  - [x] `LoginPage.tsx`
  - [x] `ShareDialog.tsx`
  - [x] `BidDetailPanel.tsx`
  - [x] `SystemEditor.tsx`
  - [x] `BidForm.tsx`

### Part 2 — TanStack Query

- [x] Install `@tanstack/react-query` (+ optional devtools).
- [x] Wrap `<App/>` in `QueryClientProvider` in `main.tsx`.
- [x] Keep `api()` in `api/client.ts` as the transport (CSRF/credentials
      handling stays). Query wraps it; it is not replaced.
- [x] New `api/queries.ts` hooks:
  - [x] `useSystems()` / `useSystem(id)`
  - [x] `useCreateSystem()` / `useUpdateSystem()` / `useDeleteSystem()`
        (invalidate `['systems']` and `['system', id]`)
  - [x] `useShares(systemId)` / `useAddShare()` / `useRemoveShare()`
- [x] Refactor components:
  - [x] `SystemList` → `useSystems()` + create/delete mutations.
  - [x] `ShareDialog` → `useShares()` + mutations; drop the `busy` flag
        (use `mutation.isPending`).
  - [x] `SystemEditor` → load via `useSystem(id)`; persist via
        `useUpdateSystem()`. Keep the editable tree as local `root` state
        (seeded from query data). Collapse the `saveState` machine into
        `mutation.isPending`/`isError` + one local `dirty` flag. Both the
        debounced auto-save and the drag-to-move immediate save call the same
        mutation.
- [x] `AuthContext` stays as-is (app-global session) — see deferred note.

**Regression guard:** drag-to-move a bid continuation must still save and
survive a page refresh (now via `useUpdateSystem`).

---

## Deferred (next passes)

### Vitest + React Testing Library
- [x] Add Vitest + RTL config and a `test` script.
- [x] First tests target `tree.ts` pure functions: `parseBid`, `bidRank`,
      `compareBids`, `canDropNode`, and the chain-context helpers.
- [x] Then component smoke tests for the main screens.

### react-hook-form
- [ ] Refactor `BidForm` (533 lines, 6 manual fields, validates every render).
- [ ] Then `LoginPage` and the `SystemList` create form.

### ESLint flat config + Prettier
- [x] Add `eslint.config.js` (flat) wiring the already-installed plugins.
- [x] Add `.prettierrc.json` + `format` / `lint` scripts; wire into CI.

### Optional
- [ ] `useCurrentUser()` query to back `AuthContext`, with logout-on-401.

---

## Verification

- `npm run dev`: every page renders visually identical (tokens unchanged).
  Spot-check SystemList, SystemEditor, BidForm, ShareDialog, LoginPage.
- Drag-to-move a bid continuation still saves and survives a refresh.
- Create/delete a system and add/revoke a share — lists refetch automatically
  via cache invalidation (no manual refresh).
- `npm run build`: `tsc -b && vite build` passes clean.
