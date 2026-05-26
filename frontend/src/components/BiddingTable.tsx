import type { BidNode } from '../types';
import { Card } from './ui';

// ── Shade helper ──────────────────────────────────────────────────────────────

function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '').slice(0, 6);
  const num = parseInt(h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.round(r + 255 * amt)));
  g = Math.max(0, Math.min(255, Math.round(g + 255 * amt)));
  b = Math.max(0, Math.min(255, Math.round(b + 255 * amt)));
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// ── SIZE table ────────────────────────────────────────────────────────────────

const SIZE = {
  compact: {
    w: 36,
    h: 32,
    font: 13,
    xFont: 14,
    xxFont: 11,
    multiFont: 9,
    passFont: 9,
    headerFont: 18,
    gap: 3,
    maxWidth: 280,
  },
  regular: {
    w: 44,
    h: 40,
    font: 16,
    xFont: 17,
    xxFont: 14,
    multiFont: 11,
    passFont: 11,
    headerFont: 22,
    gap: 4,
    maxWidth: 320,
  },
  large: {
    w: 56,
    h: 50,
    font: 20,
    xFont: 21,
    xxFont: 17,
    multiFont: 13,
    passFont: 13,
    headerFont: 26,
    gap: 5,
    maxWidth: 380,
  },
};

type SzKey = keyof typeof SIZE;
type Sz = (typeof SIZE)[SzKey];

// ── Seat building ─────────────────────────────────────────────────────────────

type SeatEntry = { kind: 'call'; node: BidNode; isLast: boolean } | { kind: 'pass' };

function buildSeats(path: BidNode[]): { seats: SeatEntry[][]; dealerCol: number } {
  const seats: SeatEntry[][] = [[], [], [], []]; // 0=W 1=N 2=E 3=S
  const sideOf = (c: number) => (c === 0 || c === 2 ? 'opp' : 'us');
  const sideOfCall = (n: BidNode) => (n.byOpponent ? 'opp' : 'us');

  let col = sideOfCall(path[0]) === 'us' ? 1 : 0;
  const dealerCol = col;
  seats[col].push({ kind: 'call', node: path[0], isLast: path.length === 1 });

  for (let i = 1; i < path.length; i++) {
    col = (col + 1) % 4;
    while (sideOf(col) !== sideOfCall(path[i])) {
      seats[col].push({ kind: 'pass' });
      col = (col + 1) % 4;
    }
    seats[col].push({ kind: 'call', node: path[i], isLast: i === path.length - 1 });
  }
  return { seats, dealerCol };
}

// ── BidCard colors ────────────────────────────────────────────────────────────

function bidCardColors(node: BidNode): { bg: string; fg: string } {
  const firstBid = node.bids[0];
  if (firstBid === 'X') return { bg: '#c8443a', fg: '#fff' };
  if (firstBid === 'XX') return { bg: '#3b5878', fg: '#fff' };
  const suit = firstBid.endsWith('NT') ? 'NT' : firstBid.slice(-1);
  if (suit === '♥' || suit === '♦') return { bg: '#f6d4cd', fg: '#a83323' };
  if (suit === '♠' || suit === '♣') return { bg: '#dad6cc', fg: '#1a1a1a' };
  if (suit === 'NT') return { bg: '#d6e0ed', fg: '#2f4866' };
  if (suit === 'sym') return { bg: '#e0d8ee', fg: '#553f86' };
  return { bg: '#dad6cc', fg: '#1a1a1a' };
}

// ── BidCard component ─────────────────────────────────────────────────────────

function BidCard({ entry, sz }: { entry: SeatEntry; sz: Sz }) {
  if (entry.kind === 'pass') {
    return (
      <div
        style={{
          width: sz.w,
          height: sz.h,
          borderRadius: 7,
          background: '#3e8a52',
          border: '2px solid #2f6940',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: sz.passFont,
          letterSpacing: '0.05em',
          boxShadow: '0 2px 3px rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}
      >
        PASS
      </div>
    );
  }

  const { node, isLast } = entry;
  const { bg: rawBg, fg } = bidCardColors(node);
  const bg = node.byOpponent ? rawBg + 'cc' : rawBg;
  const borderColor = isLast ? 'var(--accent)' : shade(rawBg, -0.12);
  const boxShadow = isLast
    ? '0 0 0 3px rgba(204,120,92,0.18), 0 2px 3px rgba(0,0,0,0.08)'
    : '0 2px 3px rgba(0,0,0,0.08)';

  const firstBid = node.bids[0];
  let fontSize: number;
  let text: string;
  if (firstBid === 'XX') {
    fontSize = sz.xxFont;
    text = 'XX';
  } else if (firstBid === 'X') {
    fontSize = sz.xFont;
    text = 'X';
  } else if (node.bids.length > 1) {
    fontSize = sz.multiFont;
    text = node.bids.join('/');
  } else {
    fontSize = sz.font;
    text = firstBid;
  }

  const card = (
    <div
      style={{
        width: sz.w,
        height: sz.h,
        borderRadius: 7,
        background: bg,
        border: `2px solid ${borderColor}`,
        boxShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: fg,
        fontFamily: '"Crimson Pro", serif',
        fontWeight: 700,
        fontSize,
        fontStyle: node.byOpponent ? 'italic' : undefined,
        opacity: node.byOpponent ? 0.92 : undefined,
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  );

  if (node.alerted) {
    return (
      <div style={{ position: 'relative', width: sz.w, height: sz.h, flexShrink: 0 }}>
        {card}
        <div
          title="Alertable — conventional meaning"
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#3b5878',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: 9,
            border: '1.5px solid var(--surface-sunken)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            lineHeight: 1,
          }}
        >
          !
        </div>
      </div>
    );
  }

  return card;
}

// ── BiddingTable ──────────────────────────────────────────────────────────────

export function BiddingTable({ path, size = 'regular' }: { path: BidNode[]; size?: SzKey }) {
  if (!path.length) return null;
  const sz = SIZE[size];
  const { seats, dealerCol } = buildSeats(path);
  const order = [0, 1, 2, 3].map((i) => (dealerCol + i) % 4);
  const maxRows = Math.max(...seats.map((s) => s.length), 2);
  const wellMinHeight = maxRows * sz.h + (maxRows - 1) * sz.gap;
  const LABELS = ['W', 'N', 'E', 'S'];

  return (
    <Card className="p-[18px]">
      <div className="mx-auto grid grid-cols-4 gap-2" style={{ maxWidth: sz.maxWidth }}>
        {order.map((idx) => {
          const isDealer = idx === dealerCol;
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span
                className="font-display font-bold leading-none tracking-tight"
                style={{ fontSize: sz.headerFont, color: isDealer ? '#3e8a52' : '#7da585' }}
              >
                {LABELS[idx]}
              </span>
              <div
                className="flex flex-col items-center rounded-lg bg-surface-sunken"
                style={{ width: sz.w, minHeight: wellMinHeight, gap: sz.gap, padding: 0 }}
              >
                {seats[idx].map((e, i) => (
                  <BidCard key={i} entry={e} sz={sz} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
