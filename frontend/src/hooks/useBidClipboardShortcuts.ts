import { useEffect } from 'react';

interface Options {
  /** Disable all shortcuts (e.g. read-only editors). */
  disabled?: boolean;
  /** Currently selected node id, or null. */
  selectedId: string | null;
  /** True when something is on the clipboard. */
  hasClipboard: boolean;
  /** Copy/cut the selected node's subtree to the clipboard. */
  onCopy: (mode: 'copy' | 'cut') => void;
  /** Paste the clipboard subtree as a continuation of the selected node. */
  onPaste: (parentId: string) => void;
  /** Whether the clipboard can legally be pasted under the selected node. */
  canPaste: (parentId: string) => boolean;
}

/** True when the keystroke originates from a text field we shouldn't hijack. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/**
 * Wires Cmd/Ctrl + C / X / V to copy, cut and paste the selected bid subtree.
 * Mirrors the detail-panel buttons. Skips keystrokes coming from text inputs,
 * and leaves native text copy/cut alone when the user has a text selection.
 */
export function useBidClipboardShortcuts({
  disabled,
  selectedId,
  hasClipboard,
  onCopy,
  onPaste,
  canPaste,
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
        if (!hasClipboard || !selectedId || !canPaste(selectedId)) return;
        e.preventDefault();
        onPaste(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, selectedId, hasClipboard, onCopy, onPaste, canPaste]);
}
