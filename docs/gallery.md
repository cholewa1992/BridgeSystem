# Gallery

## What it is

The Gallery (`/gallery`) is a public-facing page where anyone can browse bidding systems and conventions that owners have chosen to make public. No login is required to view the gallery. Authenticated users can like items and fork conventions directly from the gallery.

## Components

- `GalleryPage` (`frontend/src/components/GalleryPage.tsx`) — the page component.
- `SystemCard` (`frontend/src/components/SystemCard.tsx`) — reused for both the gallery and the user's system list.

## Tabs and sorting

The page has two tabs — Systems and Conventions — controlled by local `tab` state. A separate `sort` toggle switches between `'newest'` and `'most_liked'`. Both values are passed straight to the query hooks, so each tab/sort combination is cached independently.

## Visibility model

A system or convention is public when its `isPublic` flag is `true`. Owners toggle this from within `SystemEditor` or `ConventionEditor` using the Publish / Unpublish button. The flag is stored server-side; the gallery endpoints (`GET /api/gallery` and `GET /api/gallery/conventions`) only return public items.

`SystemSummary.isPublic` and `ConventionSummary.isPublic` carry the flag on the client type. Gallery items may also carry `likedByMe: boolean | null` — `null` means the request was made without a session.

## Like mechanics

Likes are per-user per-item toggles.

**Systems:** `useToggleLike(systemId)` — calls `unlikeSystem` or `likeSystem` depending on the current `likedByMe` state. On success it invalidates both gallery sort variants (`gallery('newest')`, `gallery('most_liked')`), the user's system list (`['systems']`), and the individual system detail cache.

**Conventions:** `useToggleConventionLike(conventionId)` — calls `unlikeConvention` or `likeConvention`. Invalidates both `galleryConventions` sort variants and the convention detail cache.

Unauthenticated users who click Like are redirected to `/login` rather than seeing an error.

## Fork mechanics

Forking creates a copy of a system or convention owned by the authenticated user.

**Systems:** `useForkSystem()` (`api/queries.ts`). Calls `POST /api/systems/:id/fork`. On success, invalidates the user's system list and both gallery sort variants so both the list and gallery reflect the updated fork count.

**Conventions:** `useForkConvention()`. Calls `POST /api/conventions/:id/fork`. On success, invalidates `['conventions']` (the user's convention list). After forking from the gallery, `ConventionGalleryCard` navigates the user to `/conventions` so they can find the copy.

Owners do not see a Fork button on their own items (`ownedByMe` is used to suppress it). Unauthenticated visitors are redirected to `/login` on fork attempt.

## Query hooks

| Hook | Query key | API endpoint |
|---|---|---|
| `usePublicSystems(sort)` | `['gallery', sort]` | `GET /api/gallery?sort=` |
| `usePublicConventions(sort)` | `['galleryConventions', sort]` | `GET /api/gallery/conventions?sort=` |
| `useToggleLike(systemId)` | invalidates gallery and system keys | `POST /api/systems/:id/like` or `DELETE` |
| `useToggleConventionLike(id)` | invalidates galleryConventions and convention keys | `POST /api/conventions/:id/like` or `DELETE` |
| `useForkSystem()` | invalidates gallery and system keys | `POST /api/systems/:id/fork` |
| `useForkConvention()` | invalidates `['conventions']` | `POST /api/conventions/:id/fork` |

All API calls go through `api()` in `api/client.ts` (credentials + CSRF). The raw transport functions live in `api/gallery.ts`, `api/likes.ts`, and `api/systems.ts`.
