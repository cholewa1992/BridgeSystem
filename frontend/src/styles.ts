import type { CSSProperties } from 'react';

export const SUITS: Record<string, string> = {
  '♠': 'spade',
  '♥': 'heart',
  '♦': 'diamond',
  '♣': 'club',
  NT: 'nt',
  ma: 'ma',
  om: 'om',
};

export function suitColor(s: string): string {
  if (s === '♥' || s === '♦' || s === 'X') return 'var(--suit-red)';
  if (s === 'NT' || s === 'XX') return 'var(--suit-nt)';
  if (s === 'ma' || s === 'om') return 'var(--suit-symbolic)';
  return 'var(--suit-black)';
}

export function suitOf(bid: string | null | undefined): string {
  if (!bid) return 'NT';
  if (bid === 'X' || bid === 'XX') return bid;
  const m = bid.match(/^[1-7](NT|ma|om|[♣♦♥♠])$/);
  if (m) return m[1];
  return 'NT';
}

// ── Surfaces ──────────────────────────────────────────────────────────────

export const cardStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-sm)',
};

export const cardElevatedStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
};

// ── Inputs ────────────────────────────────────────────────────────────────

export const inputStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--fg)',
  padding: '8px 12px',
  fontSize: 14,
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
};

// ── Buttons ───────────────────────────────────────────────────────────────

const buttonBase: CSSProperties = {
  border: '1px solid transparent',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'var(--font-ui)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  whiteSpace: 'nowrap',
  lineHeight: 1.2,
};

export const buttonPrimary: CSSProperties = {
  ...buttonBase,
  background: 'var(--accent)',
  color: '#fff',
  boxShadow: 'var(--shadow-sm)',
};

export const buttonSecondary: CSSProperties = {
  ...buttonBase,
  background: 'var(--surface)',
  color: 'var(--fg)',
  border: '1px solid var(--border-strong)',
};

export const buttonGhost: CSSProperties = {
  ...buttonBase,
  background: 'transparent',
  color: 'var(--fg-body)',
  padding: '6px 10px',
};

export const buttonDanger: CSSProperties = {
  ...buttonBase,
  background: 'var(--surface)',
  color: 'var(--danger)',
  border: '1px solid var(--border-strong)',
};

export const buttonSmall: CSSProperties = {
  padding: '4px 10px',
  fontSize: 13,
};

/** Legacy helper kept for back-compat — small button with a custom bg. */
export function smBtn(bg: string): CSSProperties {
  return {
    ...buttonBase,
    background: bg,
    color: '#fff',
    padding: '6px 12px',
    fontSize: 13,
  };
}

// ── Labels ────────────────────────────────────────────────────────────────

export const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--fg-muted)',
  fontFamily: 'var(--font-ui)',
};

export const mutedStyle: CSSProperties = {
  color: 'var(--fg-muted)',
  fontSize: 13,
  fontFamily: 'var(--font-ui)',
};
