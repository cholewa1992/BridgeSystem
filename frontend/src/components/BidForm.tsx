import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  LEVELS,
  STRAINS,
  STRAIN_RANK,
  type ChainContext,
  formatBid,
  isValidContinuation,
  minValidBidAfter,
  parseBid,
  strainOutranks,
  type Level,
  type Strain,
} from '../tree';
import { suitColor } from '../styles';
import { Button, Input, Label, Textarea } from './ui';
import { BidLabel } from './BidLabel';

export interface BidFormData {
  bids: string[];
  meaning: string;
  notes: string;
  byOpponent: boolean;
}

type CallKind = 'bid' | 'X' | 'XX' | 'pass';

interface Props {
  mode: 'add' | 'edit';
  chain: ChainContext;
  initial?: Partial<BidFormData>;
  onSubmit: (data: BidFormData) => void;
  onCancel: () => void;
}

export function BidForm({ mode, chain, initial, onSubmit, onCancel }: Props) {
  const parsedLastContract = useMemo(
    () => parseBid(chain.lastContractBid),
    [chain.lastContractBid],
  );
  const minContract = useMemo(() => minValidBidAfter(parsedLastContract), [parsedLastContract]);

  const doubleAllowed =
    !!chain.lastContractBid && !chain.hasActiveDouble && !chain.hasActiveRedouble;
  const redoubleAllowed = chain.hasActiveDouble && !chain.hasActiveRedouble;
  const contractBidAllowed = !!minContract;

  // ── Initial state ─────────────────────────────────────────────────────
  const initialBids = useMemo(() => initial?.bids ?? [], [initial?.bids]);
  const firstInitial = initialBids[0];
  const initialKind: CallKind =
    firstInitial === 'P'
      ? 'pass'
      : firstInitial === 'X'
        ? 'X'
        : firstInitial === 'XX'
          ? 'XX'
          : 'bid';

  /** Derive level + strains from a group of contract-bid strings. */
  const derived = useMemo(() => {
    if (initialKind !== 'bid') return null;
    const parsed = initialBids.map(parseBid).filter((p): p is NonNullable<typeof p> => !!p);
    if (parsed.length === 0) return null;
    // Use the level of the first bid; collect distinct strains at that level
    const level = parsed[0].level;
    const strains = Array.from(
      new Set(parsed.filter((p) => p.level === level).map((p) => p.strain)),
    );
    return { level, strains };
  }, [initialKind, initialBids]);

  const [kind, setKind] = useState<CallKind>(() => {
    if (mode === 'edit') return initialKind;
    if (contractBidAllowed) return 'bid';
    if (doubleAllowed) return 'X';
    if (redoubleAllowed) return 'XX';
    return 'pass';
  });

  const [level, setLevel] = useState<Level | null>(derived?.level ?? minContract?.level ?? null);
  const [strains, setStrains] = useState<Strain[]>(
    derived?.strains ?? (minContract ? [minContract.strain] : []),
  );

  const [meaning, setMeaning] = useState(initial?.meaning ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [byOpponent, setByOpponent] = useState(initial?.byOpponent ?? false);

  // ── Picker availability ───────────────────────────────────────────────
  const isLevelAllowed = (L: Level): boolean => {
    if (!parsedLastContract) return true;
    if (L > parsedLastContract.level) return true;
    if (L === parsedLastContract.level) {
      // Some strain outranks parent at this level — i.e. parent isn't already NT.
      return STRAINS.some((s) => strainOutranks(s, parsedLastContract.strain));
    }
    return false;
  };

  const isStrainAllowed = (S: Strain, atLevel: Level): boolean => {
    if (!parsedLastContract) return true;
    if (atLevel > parsedLastContract.level) return true;
    if (atLevel === parsedLastContract.level) {
      return strainOutranks(S, parsedLastContract.strain);
    }
    return false;
  };

  const pickLevel = (L: Level) => {
    setLevel(L);
    setStrains((prev) => {
      const filtered = prev.filter((s) => isStrainAllowed(s, L));
      if (filtered.length > 0) return filtered;
      // None of the previous strains carry over; pick the lowest valid
      const lowest = STRAINS.find((s) => isStrainAllowed(s, L));
      return lowest ? [lowest] : [];
    });
  };

  const toggleStrain = (S: Strain) => {
    if (!level) return;
    if (!isStrainAllowed(S, level)) return;
    setStrains((prev) => {
      if (prev.includes(S)) {
        // Keep at least one selected
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== S);
      }
      // Maintain ranking order for consistent display
      const next = [...prev, S];
      next.sort((a, b) => STRAIN_RANK[a] - STRAIN_RANK[b]);
      return next;
    });
  };

  // ── Compose preview bids ──────────────────────────────────────────────
  const previewBids: string[] = (() => {
    if (kind === 'pass') return ['P'];
    if (kind === 'X') return ['X'];
    if (kind === 'XX') return ['XX'];
    if (!level || strains.length === 0) return [];
    return strains.map((s) => formatBid({ level, strain: s }));
  })();

  // ── Submit ────────────────────────────────────────────────────────────
  const allContractsValid = previewBids.every((b) => {
    const p = parseBid(b);
    if (!p) return true; // X/XX
    return isValidContinuation(p, parsedLastContract);
  });

  const canSubmit = (() => {
    if (!meaning.trim()) return false;
    if (previewBids.length === 0) return false;
    if (kind === 'pass') return true;
    if (kind === 'X') return doubleAllowed || initialKind === 'X';
    if (kind === 'XX') return redoubleAllowed || initialKind === 'XX';
    return allContractsValid;
  })();

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      bids: previewBids,
      meaning: meaning.trim(),
      notes: notes.trim(),
      byOpponent,
    });
  };

  // Pass is always legal, so the form is never fully blocked.

  return (
    <div className="rounded-md border border-border bg-surface-2 p-[18px]">
      <Label className="mb-3 block">
        {mode === 'add'
          ? chain.lastContractBid
            ? `Continuation after ${chain.lastContractBid}${
                chain.hasActiveRedouble ? ' XX' : chain.hasActiveDouble ? ' X' : ''
              }`
            : 'Opening call'
          : 'Edit call'}
      </Label>

      {/* Call kind picker */}
      <div className="mb-[14px]">
        <div className="mb-1.5 text-[12px] text-fg-muted">Type of call</div>
        <div className="inline-flex overflow-hidden rounded-sm border border-border-strong">
          <SegBtn
            selected={kind === 'pass'}
            onClick={() => setKind('pass')}
            title="Pass"
            color="var(--fg-muted)"
          >
            Pass (P)
          </SegBtn>
          <SegBtn
            selected={kind === 'bid'}
            disabled={!contractBidAllowed}
            onClick={() => setKind('bid')}
            title="A contract bid (1♣ – 7NT). Select multiple strains for a group."
          >
            Bid
          </SegBtn>
          <SegBtn
            selected={kind === 'X'}
            disabled={!doubleAllowed && initialKind !== 'X'}
            onClick={() => setKind('X')}
            title={
              doubleAllowed
                ? 'Double'
                : chain.hasActiveRedouble
                  ? 'Already redoubled'
                  : chain.hasActiveDouble
                    ? 'Already doubled'
                    : 'No contract bid to double'
            }
            color="var(--suit-red)"
          >
            Double (X)
          </SegBtn>
          <SegBtn
            selected={kind === 'XX'}
            disabled={!redoubleAllowed && initialKind !== 'XX'}
            onClick={() => setKind('XX')}
            title={
              redoubleAllowed
                ? 'Redouble'
                : chain.hasActiveRedouble
                  ? 'Already redoubled'
                  : 'Redouble requires an active double'
            }
            color="var(--suit-nt)"
          >
            Redouble (XX)
          </SegBtn>
        </div>
      </div>

      {/* Level + strain (contract bids only) */}
      {kind === 'bid' && (
        <>
          <div className="mb-2.5">
            <div className="mb-1.5 text-[12px] text-fg-muted">Level</div>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((L) => (
                <PickerButton
                  key={L}
                  selected={level === L}
                  disabled={!isLevelAllowed(L)}
                  onClick={() => pickLevel(L)}
                >
                  {L}
                </PickerButton>
              ))}
            </div>
          </div>

          <div className="mb-1.5">
            <div className="mb-1.5 text-[12px] text-fg-muted">Strain(s)</div>
            <div className="flex flex-wrap gap-1.5">
              {STRAINS.map((S) => {
                const enabled = level ? isStrainAllowed(S, level) : false;
                const isSymbolic = S === 'ma' || S === 'om';
                const isText = S === 'NT' || isSymbolic;
                const hint =
                  S === 'ma'
                    ? "Symbolic — the same major suit just bid (e.g. raise opener's major)"
                    : S === 'om'
                      ? 'Symbolic — the other major suit (the one not bid)'
                      : undefined;
                return (
                  <PickerButton
                    key={S}
                    selected={strains.includes(S)}
                    disabled={!enabled}
                    onClick={() => toggleStrain(S)}
                    title={hint}
                    className={clsx(
                      'font-display font-semibold',
                      isText ? 'text-[14px]' : 'text-[16px]',
                      isSymbolic && 'italic',
                    )}
                    style={{
                      color: enabled ? suitColor(S) : 'var(--fg-subtle)',
                      minWidth: 40,
                    }}
                  >
                    {S}
                  </PickerButton>
                );
              })}
            </div>
            <div className="mt-1.5 text-[12px] italic text-fg-subtle">
              Pick more than one for a group (e.g. 1♥/1♠).{' '}
              <span className="italic text-suit-symbolic">ma</span> = same major,{' '}
              <span className="italic text-suit-symbolic">om</span> = other major.
            </div>
          </div>
        </>
      )}

      {/* Preview */}
      <div className="my-[14px] flex items-center gap-2 font-ui text-[12px] text-fg-muted">
        <span>Call{previewBids.length > 1 ? 's' : ''}:</span>
        {previewBids.length > 0 ? (
          <BidLabel
            bids={previewBids}
            byOpponent={byOpponent}
            className="font-display text-[15px] font-semibold"
          />
        ) : (
          <em className="text-fg-subtle">nothing selected</em>
        )}
      </div>

      {/* Meaning */}
      <div className="mb-3">
        <div className="mb-1.5 text-[12px] text-fg-muted">
          Meaning <span className="text-danger">*</span>
        </div>
        <Input
          placeholder={
            kind === 'pass'
              ? 'e.g. No interference'
              : kind === 'X'
                ? 'e.g. Takeout — partner should bid'
                : kind === 'XX'
                  ? 'e.g. Shows extra strength, asks partner to bid'
                  : 'e.g. Major-suit opening'
          }
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          className="w-full"
          autoFocus={mode === 'edit'}
        />
      </div>

      {/* Notes */}
      <div className="mb-[14px]">
        <div className="mb-1.5 text-[12px] text-fg-muted">
          Notes <span className="italic text-fg-subtle">(optional)</span>
        </div>
        <Textarea
          placeholder="Longer explanation — when to use it, point ranges, partnership reminders…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full resize-y font-body leading-normal"
        />
      </div>

      {/* Interference */}
      <label className="mb-4 flex cursor-pointer select-none items-center gap-2 text-[14px] text-fg-body">
        <input
          type="checkbox"
          checked={byOpponent}
          onChange={(e) => setByOpponent(e.target.checked)}
          className="accent-accent"
        />
        Call made by opponent
      </label>

      <div className="flex gap-2">
        <Button variant="primary" onClick={submit} disabled={!canSubmit}>
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Picker / segmented button primitives ─────────────────────────────────

function PickerButton({
  children,
  selected,
  disabled,
  onClick,
  className,
  style,
  title,
}: {
  children: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={style}
      className={clsx(
        'min-w-[36px] rounded-sm border px-[10px] py-[6px] font-ui text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-35',
        selected
          ? 'border-accent bg-accent-soft text-accent-ink'
          : 'border-border-strong bg-surface text-fg',
        className,
      )}
    >
      {children}
    </button>
  );
}

function SegBtn({
  children,
  selected,
  disabled,
  onClick,
  title,
  color,
}: {
  children: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        color: selected
          ? 'var(--accent-ink)'
          : disabled
            ? 'var(--fg-subtle)'
            : (color ?? 'var(--fg)'),
      }}
      className={clsx(
        'border-r border-border-strong px-[14px] py-[6px] font-ui text-[13px] disabled:cursor-not-allowed',
        selected ? 'bg-accent-soft font-semibold' : 'bg-surface font-medium',
      )}
    >
      {children}
    </button>
  );
}
