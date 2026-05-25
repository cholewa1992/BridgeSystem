/*
 * Bid-domain styling helpers. Component/layout styling now lives in Tailwind
 * utilities and the primitives under components/ui/. What remains here is
 * data-driven: mapping a call's suit to its color token.
 */

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
  if (s === 'P') return 'var(--fg-muted)';
  return 'var(--suit-black)';
}

export function suitOf(bid: string | null | undefined): string {
  if (!bid) return 'NT';
  if (bid === 'X' || bid === 'XX' || bid === 'P') return bid;
  const m = bid.match(/^[1-7](NT|ma|om|[♣♦♥♠])$/);
  if (m) return m[1];
  return 'NT';
}
