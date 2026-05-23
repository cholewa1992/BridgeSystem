import { useMemo, useState } from 'react';
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
import {
  buttonPrimary,
  buttonSecondary,
  inputStyle,
  labelStyle,
  suitColor,
} from '../styles';
import { BidLabel } from './BidLabel';

export interface BidFormData {
  bids: string[];
  meaning: string;
  notes: string;
  byOpponent: boolean;
}

type CallKind = 'bid' | 'X' | 'XX';

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
  const minContract = useMemo(
    () => minValidBidAfter(parsedLastContract),
    [parsedLastContract],
  );

  const doubleAllowed = !!chain.lastContractBid && !chain.hasActiveDouble && !chain.hasActiveRedouble;
  const redoubleAllowed = chain.hasActiveDouble && !chain.hasActiveRedouble;
  const contractBidAllowed = !!minContract;

  // ── Initial state ─────────────────────────────────────────────────────
  const initialBids = initial?.bids ?? [];
  const firstInitial = initialBids[0];
  const initialKind: CallKind =
    firstInitial === 'X' ? 'X' : firstInitial === 'XX' ? 'XX' : 'bid';

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
    return 'bid';
  });

  const [level, setLevel] = useState<Level | null>(
    derived?.level ?? (minContract?.level ?? null),
  );
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

  // ── No legal calls at all ─────────────────────────────────────────────
  if (!contractBidAllowed && !doubleAllowed && !redoubleAllowed) {
    return (
      <div
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
        }}
      >
        <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
          No legal call available — 7NT redoubled is the ceiling.
        </p>
        <div style={{ marginTop: 12 }}>
          <button onClick={onCancel} style={buttonSecondary}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 18,
      }}
    >
      <div style={{ ...labelStyle, marginBottom: 12 }}>
        {mode === 'add'
          ? chain.lastContractBid
            ? `Continuation after ${chain.lastContractBid}${
                chain.hasActiveRedouble ? ' XX' : chain.hasActiveDouble ? ' X' : ''
              }`
            : 'Opening call'
          : 'Edit call'}
      </div>

      {/* Call kind picker */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>
          Type of call
        </div>
        <div
          style={{
            display: 'inline-flex',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
          }}
        >
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
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>
              Level
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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

          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>
              Strain(s)
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STRAINS.map((S) => {
                const enabled = level ? isStrainAllowed(S, level) : false;
                const isSymbolic = S === 'ma' || S === 'om';
                const isText = S === 'NT' || isSymbolic;
                const hint =
                  S === 'ma'
                    ? 'Symbolic — the same major suit just bid (e.g. raise opener\'s major)'
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
                    style={{
                      color: enabled ? suitColor(S) : 'var(--fg-subtle)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: isText ? 14 : 16,
                      fontStyle: isSymbolic ? 'italic' : 'normal',
                      minWidth: 40,
                    }}
                  >
                    {S}
                  </PickerButton>
                );
              })}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--fg-subtle)',
                marginTop: 6,
                fontStyle: 'italic',
              }}
            >
              Pick more than one for a group (e.g. 1♥/1♠).{' '}
              <span style={{ color: 'var(--suit-symbolic)', fontStyle: 'italic' }}>ma</span> = same
              major,{' '}
              <span style={{ color: 'var(--suit-symbolic)', fontStyle: 'italic' }}>om</span> = other
              major.
            </div>
          </div>
        </>
      )}

      {/* Preview */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--fg-muted)',
          margin: '14px 0',
          fontFamily: 'var(--font-ui)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>Call{previewBids.length > 1 ? 's' : ''}:</span>
        {previewBids.length > 0 ? (
          <BidLabel
            bids={previewBids}
            byOpponent={byOpponent}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 15,
            }}
          />
        ) : (
          <em style={{ color: 'var(--fg-subtle)' }}>nothing selected</em>
        )}
      </div>

      {/* Meaning */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>
          Meaning <span style={{ color: 'var(--danger)' }}>*</span>
        </div>
        <input
          placeholder={
            kind === 'X'
              ? 'e.g. Takeout — partner should bid'
              : kind === 'XX'
              ? 'e.g. Shows extra strength, asks partner to bid'
              : 'e.g. Major-suit opening'
          }
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          style={{ ...inputStyle, width: '100%' }}
          autoFocus={mode === 'edit'}
        />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 6 }}>
          Notes <span style={{ color: 'var(--fg-subtle)', fontStyle: 'italic' }}>(optional)</span>
        </div>
        <textarea
          placeholder="Longer explanation — when to use it, point ranges, partnership reminders…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          style={{
            ...inputStyle,
            width: '100%',
            resize: 'vertical',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Interference */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          fontSize: 14,
          color: 'var(--fg-body)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <input
          type="checkbox"
          checked={byOpponent}
          onChange={(e) => setByOpponent(e.target.checked)}
          style={{ accentColor: 'var(--accent)' }}
        />
        Call made by opponent
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={!canSubmit} style={buttonPrimary}>
          {mode === 'add' ? 'Add' : 'Save'}
        </button>
        <button onClick={onCancel} style={buttonSecondary}>
          Cancel
        </button>
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
  style,
  title,
}: {
  children: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        minWidth: 36,
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        border: selected
          ? '1px solid var(--accent)'
          : '1px solid var(--border-strong)',
        background: selected ? 'var(--accent-soft)' : 'var(--surface)',
        color: selected ? 'var(--accent-ink)' : 'var(--fg)',
        fontFamily: 'var(--font-ui)',
        fontWeight: 500,
        fontSize: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        ...style,
      }}
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
        padding: '6px 14px',
        border: 'none',
        borderRight: '1px solid var(--border-strong)',
        background: selected ? 'var(--accent-soft)' : 'var(--surface)',
        color: selected
          ? 'var(--accent-ink)'
          : disabled
          ? 'var(--fg-subtle)'
          : color ?? 'var(--fg)',
        fontFamily: 'var(--font-ui)',
        fontWeight: selected ? 600 : 500,
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
