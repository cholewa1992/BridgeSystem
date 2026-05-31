# Mobile Layout

## Pattern

Both `SystemEditor` and `ConventionEditor` (in `ConventionLibraryPage.tsx`) use a master/detail split: a tree pane on the left and a detail pane on the right. On wide screens both panes are visible simultaneously. On narrow screens only one pane is shown at a time; the user navigates between them explicitly.

## Breakpoint

The breakpoint is Tailwind's `md` prefix, which corresponds to `min-width: 768px`. Below 768 px the layout collapses to single-pane mode.

- Tree pane: `w-full md:w-[460px] md:shrink-0` — full width on mobile, fixed 460 px column on desktop (420 px in `ConventionEditor`).
- Detail pane: `flex-1` — fills remaining space on desktop, full width on mobile.

## `mobilePane` state machine

Both editors hold `const [mobilePane, setMobilePane] = useState<'tree' | 'detail'>('tree')`.

| Value | Visible on mobile |
|---|---|
| `'tree'` | Tree pane is shown; detail pane is hidden (`hidden md:block`) |
| `'detail'` | Detail pane is shown; tree pane is hidden (`hidden md:block`) |

On desktop (≥ 768 px) the `hidden` / `block` logic is overridden by `md:block`, so both panes are always visible regardless of `mobilePane`.

### Transitions

- **Selecting a node** (`select()` / `selectConventionChild()`) sets `mobilePane = 'detail'`. The user lands on the detail pane immediately after tapping a bid row.
- **Back button** in `BidDetailPanel` calls `onMobileBack`, which sets `mobilePane = 'tree'`. The back button is only rendered when `onMobileBack` is supplied (i.e., when `SystemEditor` or `ConventionEditor` passes it down).
- **Opening the add form at the root level** does not change `mobilePane` — the form is rendered inside the tree pane, so the user stays on the tree.

## Save indicator and action buttons

The save indicator and secondary action buttons (Publish, Share) carry `hidden md:inline-flex` so they only appear on desktop. On mobile the header is kept minimal to preserve horizontal space.
