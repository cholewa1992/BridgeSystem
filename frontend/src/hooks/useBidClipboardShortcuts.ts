import { useEffect } from 'react';

interface Options {
  /** Disable all shortcuts (e.g. read-only editors). */
  disabled?: boolean;
  /** Currently selected node id, or null. */
  selectedId: string | null;
  /** Root id — paste target when nothing is selected. */
  rootId: string;
  /** Copy/cut the selected node's subtree to the clipboard. */
  onCopy: (mode: 'copy' | 'cut') => void;
  /** Paste the clipboard subtree under `parentId`. */
  onPaste: (parentId: string) => void;
}

/** True when the keystroke originates from a text field we shouldn't hijack. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/**
 * Wires Cmd/Ctrl + C / X / V to copy, cut and paste bids via the OS clipboard.
 * Paste lands under the selected bid, or at the root when nothing is selected.
 * Skips keystrokes from text inputs, and leaves native text copy/cut alone when
 * the user has a text selection.
 */
export function useBidClipboardShortcuts({
  disabled,
  selectedId,
  rootId,
  onCopy,
  onPaste,
}: Options): void {
  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      const key = e.key.toLowerCase();

      if (key === 'c' || key === 'x') {
        if (!selectedId) return;
        // Don't clobber a real text selection (e.g. in the notes card).
        if (window.getSelection()?.toString()) return;
        e.preventDefault();
        onCopy(key === 'c' ? 'copy' : 'cut');
      } else if (key === 'v') {
        e.preventDefault();
        onPaste(selectedId ?? rootId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, selectedId, rootId, onCopy, onPaste]);
}
