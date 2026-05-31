# Convention Library

## What it is

A Convention is a named, reusable bid subtree that can be attached to any node in a bidding system. Instead of re-entering the same responses (e.g. RKCB 1430, Stayman, transfers) in every system that uses them, a developer defines the sequence once in the library and links it by reference wherever it is needed.

Conventions are first-class objects with their own CRUD, sharing, visibility, and social mechanics (likes, forks). They live at `/conventions` and `/conventions/:id`.

## Data model

### `ConventionDef` (in `types.ts`)

```
id          string
name        string
description string | undefined
parameters  ConventionParam[] | undefined
root        BidNode            -- synthetic root (bids: []), children are top-level responses
```

### `ConventionParam` (in `types.ts`)

Named substitution variables declared on a `ConventionDef`. Their `name` field is used as a `{{name}}` placeholder in `meaning` and `notes` strings inside the subtree. When a `BidNode` in a system attaches this convention, it supplies concrete `args` (a `Record<string, string>`) that are substituted at render time.

```
id           string
name         string     -- used in {{name}} placeholders
description  string | undefined
defaultValue string | undefined
type         'text' | 'suit' | undefined   -- 'suit' renders a suit picker in the link form
label        string | undefined
```

### `ConventionDetail` / `ConventionSummary` (in `types.ts`)

`ConventionDetail` is the full server response (returned from `GET /api/conventions/:id`). It includes the full `parameters` array, the `root` subtree, `permission` (`OWNER` | `READ` | `WRITE` | `NONE`), `forkedFrom`, like/fork counts, and `likedByMe`.

`ConventionSummary` is the lightweight list item returned by the gallery. It replaces the full `parameters` array with a `paramCount` integer.

### Attachment: `ConventionRef` on `BidNode`

```
id    string                  -- convention ID
args  Record<string, string>  -- param name → concrete value
```

A `BidNode` can carry `conventionRefs?: ConventionRef[]`. When present, the node's rendered children come from the referenced convention subtrees (merged in order) instead of from the stored `children` array (which is always `[]` for linked nodes). Multiple conventions can be attached to the same node.

## UX flows

### Create

From `ConventionLibraryPage`, clicking "New convention" opens an inline form (name + optional description). On submit, `useCreateConvention` fires `POST /api/conventions` and navigates to `/conventions/:id` on success.

### Edit

`ConventionEditorPage` loads the convention via `useConvention(id)` and renders `ConventionEditor`. The editor is structurally identical to `SystemEditor`:

- Left pane: description textarea, parameter list (`ParameterEditor`), bid tree (`BidTree` + `BidForm` for add).
- Right pane: `BidDetailPanel` for selected node detail and adding continuations.
- Auto-save: 800 ms debounce on the `dirty` flag, calling `useUpdateConvention`.
- Drag-to-move saves immediately (bypasses the debounce).

The name is edited inline by clicking the header title.

### Parameters

`ParameterEditor` (inside `ConventionLibraryPage.tsx`) manages the `ConventionParam[]` list locally. Each param has a name field, optional description, and optional default value. Changes set `dirty`, which triggers the debounced persist.

### Publish / Unpublish

Only `OWNER` permission shows the Publish / Unpublish button. It calls `useUpdateConventionVisibility`, which updates the detail cache and invalidates both gallery query keys (`galleryConventions('newest')` and `galleryConventions('most_liked')`).

### Fork

Any user with `READ` or no ownership can fork. Forking calls `useForkConvention`, which calls `POST /api/conventions/:id/fork` and invalidates `queryKeys.conventions`. The new copy appears in the user's library. The editor shows a "Forked from" banner when `convention.forkedFrom` is set.

### Like

In the gallery and in `ConventionEditor` (for non-owners), users can like/unlike. `useToggleConventionLike` invalidates `galleryConventions` query keys and the individual convention detail.

### Share

`useConventionShares(id)` returns collaborators. The share dialog (reused from systems) controls read/write access per username.

## Attaching a convention to a system node

In `SystemEditor`, `BidDetailPanel` exposes a "Link convention" button for the selected node. Selecting a convention from the user's library (loaded via `useMyConventions`) calls `handleAttachConvention(convId, args)`, which:

1. Adds a `ConventionRef` entry to `node.conventionRefs`.
2. Clears `node.children` to `[]` (the convention subtree takes over).
3. Marks dirty (triggers debounced save).

`handleDetachConvention(convId)` removes the ref and allows re-adding manual children.

Nodes that are children of a convention (read from the convention's subtree, not from the stored tree) are flagged `readOnly` in the detail panel; the panel shows an "Edit in Library" link instead of edit controls.

## Query hooks (all in `api/queries.ts`)

| Hook | Query key | Purpose |
|---|---|---|
| `useMyConventions()` | `['conventions']` | List user's own + shared conventions |
| `useConvention(id)` | `['convention', id]` | Load a single convention for the editor |
| `useCreateConvention()` | invalidates `['conventions']` | Create a new convention |
| `useUpdateConvention(id)` | seeds `['convention', id]`, invalidates `['conventions']` | Save edits |
| `useUpdateConventionVisibility(id)` | seeds `['convention', id]`, invalidates `['conventions']` and gallery keys | Toggle public |
| `useDeleteConvention()` | removes `['convention', id]`, invalidates `['conventions']` | Delete |
| `useForkConvention()` | invalidates `['conventions']` | Fork a convention |
| `useToggleConventionLike(id)` | invalidates gallery keys and `['convention', id]` | Like / unlike |
| `useConventionShares(id)` | `['conventionShares', id]` | List collaborators |
| `usePublicConventions(sort)` | `['galleryConventions', sort]` | Public browsing in gallery |

## Non-obvious implementation decisions

**`useUpdateConvention` seeds the detail cache directly.** On success, the mutation handler calls `qc.setQueryData(queryKeys.convention(id), updated)` with the server response before invalidating the list. This prevents a flash of stale data when the editor is still open.

**Convention children are merged in order.** When a node has multiple `conventionRefs`, the bid trees are concatenated in array order. There is no deduplication — conflicting bids from two conventions both appear.

**Parameter substitution is render-time only.** The raw `{{name}}` placeholders are stored in the convention's tree. Substitution with `args` values happens in the rendering layer, not in the stored data. This means you can change arg values without re-saving the convention.

**`OWNER` vs `WRITE` edit rights.** Both `OWNER` and `WRITE` permissions allow editing the tree and parameters. Only `OWNER` can publish/unpublish or delete.
