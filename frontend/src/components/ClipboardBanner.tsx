import { useTranslation } from 'react-i18next';
import type { BidNode } from '../types';
import { Button } from './ui';
import { BidLabel } from './BidLabel';

interface Props {
  /** The subtree currently on the clipboard. */
  node: BidNode;
  mode: 'copy' | 'cut';
  /** Whether a node is selected as the paste destination. */
  hasSelection: boolean;
  /** Whether the clipboard can legally be pasted under the current selection. */
  canPaste: boolean;
  /** Paste under the current selection. */
  onPaste: () => void;
  /** Discard the clipboard. */
  onClear: () => void;
}

/**
 * Persistent banner shown while a bid is on the clipboard. Gives feedback that
 * a copy/cut happened, and a one-click Paste under the selected bid (disabled
 * with an explanation when the selection isn't a legal destination).
 */
export function ClipboardBanner({ node, mode, hasSelection, canPaste, onPaste, onClear }: Props) {
  const { t } = useTranslation(['editor', 'common']);

  const hint = !hasSelection
    ? t('clipboard.selectDestination')
    : !canPaste
      ? t('clipboard.invalidTarget')
      : t('clipboard.readyToPaste');

  return (
    <div className="mb-2 rounded-sm border border-accent-border bg-accent-soft px-2.5 py-2">
      <div className="flex items-center gap-2">
        <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
          {mode === 'cut' ? t('clipboard.cutLabel') : t('clipboard.copiedLabel')}
        </span>
        <BidLabel bids={node.bids} byOpponent={node.byOpponent} className="font-display text-sm" />
        <button
          onClick={onClear}
          className="ml-auto shrink-0 font-ui text-[12px] text-fg-muted hover:text-fg"
        >
          {t('clipboard.clear')}
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <Button
          variant="secondary"
          small
          onClick={onPaste}
          disabled={!hasSelection || !canPaste}
          title={!hasSelection || !canPaste ? hint : ''}
        >
          {mode === 'cut' ? t('clipboard.pasteMove') : t('clipboard.paste')}
        </Button>
        <span className="font-ui text-[12px] text-fg-muted">{hint}</span>
      </div>
    </div>
  );
}
