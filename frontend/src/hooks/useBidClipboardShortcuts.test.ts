import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBidClipboardShortcuts } from './useBidClipboardShortcuts';

function fire(key: string, opts: Partial<KeyboardEventInit> = {}, target?: EventTarget) {
  const e = new KeyboardEvent('keydown', { key, metaKey: true, cancelable: true, ...opts });
  if (target) Object.defineProperty(e, 'target', { value: target });
  window.dispatchEvent(e);
  return e;
}

function setup(overrides: Partial<Parameters<typeof useBidClipboardShortcuts>[0]> = {}) {
  const onCopy = vi.fn();
  const onPaste = vi.fn();
  renderHook(() =>
    useBidClipboardShortcuts({
      selectedId: 'n1',
      rootId: 'root',
      onCopy,
      onPaste,
      ...overrides,
    }),
  );
  return { onCopy, onPaste };
}

describe('useBidClipboardShortcuts', () => {
  beforeEach(() => {
    vi.spyOn(window, 'getSelection').mockReturnValue(null);
  });
  afterEach(() => vi.restoreAllMocks());

  it('copies and cuts the selected node', () => {
    const { onCopy } = setup();
    fire('c');
    expect(onCopy).toHaveBeenCalledWith('copy');
    fire('x');
    expect(onCopy).toHaveBeenCalledWith('cut');
  });

  it('pastes under the selected node', () => {
    const { onPaste } = setup();
    fire('v');
    expect(onPaste).toHaveBeenCalledWith('n1');
  });

  it('pastes at the root when nothing is selected', () => {
    const { onPaste } = setup({ selectedId: null });
    fire('v');
    expect(onPaste).toHaveBeenCalledWith('root');
  });

  it('does not copy when nothing is selected', () => {
    const { onCopy } = setup({ selectedId: null });
    fire('c');
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('does nothing without the modifier key', () => {
    const { onCopy } = setup();
    fire('c', { metaKey: false, ctrlKey: false });
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('is inert when disabled', () => {
    const { onCopy, onPaste } = setup({ disabled: true });
    fire('c');
    fire('v');
    expect(onCopy).not.toHaveBeenCalled();
    expect(onPaste).not.toHaveBeenCalled();
  });

  it('ignores keystrokes from text inputs', () => {
    const { onCopy } = setup();
    const input = document.createElement('input');
    fire('c', {}, input);
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('leaves native copy alone when text is selected', () => {
    const { onCopy } = setup();
    vi.spyOn(window, 'getSelection').mockReturnValue({
      toString: () => 'some text',
    } as Selection);
    const e = fire('c');
    expect(onCopy).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });
});
