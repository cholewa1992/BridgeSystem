import type { BidNode } from './types';
import { sanitizeBidNode } from './tree';

/**
 * Bid copy/paste rides the real OS clipboard so bids can move between systems,
 * conventions, and tabs. The payload is a small JSON envelope written as plain
 * text; paste parses it, validates the shape, and (separately) checks legality
 * before inserting.
 */

const CLIPBOARD_KIND = 'bridge-bid';
const CLIPBOARD_VERSION = 1;

interface ClipboardEnvelope {
  kind: typeof CLIPBOARD_KIND;
  version: number;
  node: BidNode;
}

/** Serialise a bid subtree to the clipboard text payload. */
export function encodeBid(node: BidNode): string {
  const envelope: ClipboardEnvelope = { kind: CLIPBOARD_KIND, version: CLIPBOARD_VERSION, node };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Parse clipboard text back into a bid subtree. Returns null when the text is
 * not a bridge-bid payload (e.g. the user copied something unrelated).
 */
export function decodeBid(text: string): BidNode | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const env = parsed as Record<string, unknown>;
  if (env.kind !== CLIPBOARD_KIND) return null;
  if (!env.node || typeof env.node !== 'object') return null;
  return sanitizeBidNode(env.node);
}

/** True when the Clipboard API is usable (secure context, supported browser). */
export function clipboardAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.clipboard;
}

export async function writeClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function readClipboard(): Promise<string> {
  return navigator.clipboard.readText();
}
