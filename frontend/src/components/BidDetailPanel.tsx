import { useState } from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import type { BidNode, ConventionDef } from '../types';
import type { ChainContext } from '../tree';
import { resolveConventionChildren, findConvention, findNode } from '../tree';
import { Button, Card, Input, Label, Select } from './ui';
import { BidForm, type BidFormData } from './BidForm';
import { BidLabel } from './BidLabel';
import { BiddingTable } from './BiddingTable';

interface Props {
  selected: BidNode | null;
  breadcrumb: BidNode[];
  readOnly: boolean;
  /** Chain context for adding a child under `selected`. */
  addChain: ChainContext | null;
  /** Chain context for editing `selected` (its own call excluded from the walk). */
  editChain: ChainContext | null;
  /** Add-form state — non-null when adding under the selected node. */
  addingTo: string | null;
  /** Edit-form state — true when editing the selected node. */
  editing: boolean;
  onRequestAdd: () => void;
  onCancelAdd: () => void;
  onSubmitAdd: (data: BidFormData) => void;
  onRequestEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: (data: BidFormData) => void;
  onDelete: () => void;
  onSelect: (id: string) => void;
  /** System ID — used for the "Edit in Convention Library" link. */
  systemId?: string;
  /** Conventions available in this system. */
  conventions?: ConventionDef[];
  /** Called when the user attaches a convention to the selected node. */
  onAttachConvention?: (convId: string, args: Record<string, string>) => void;
  /** Called when the user detaches a convention from the selected node. */
  onDetachConvention?: (convId: string) => void;
  /** Called when the user clicks "Edit in Convention Library". */
  onOpenConventionLibrary?: () => void;
  /** Called when the user clicks a bid that is a convention child. */
  onSelectConventionChild?: (node: BidNode, convRefId: string) => void;
  /** When set, this node was resolved from a convention — show read-only convention banner. */
  fromConventionRef?: string;
  /** Called on mobile when the user wants to navigate back to the tree pane. */
  onMobileBack?: () => void;
}

export function BidDetailPanel(props: Props) {
  const { t } = useTranslation(['editor', 'common']);
  const { selected, breadcrumb } = props;
  const conventions = props.conventions ?? [];
  const fromConvention = props.fromConventionRef
    ? conventions.find((c) => c.id === props.fromConventionRef)
    : undefined;

  const [showConvPicker, setShowConvPicker] = useState(false);

  if (!selected) {
    return (
      <div className="mt-20 text-center font-ui text-fg-subtle">
        <div className="mb-3 text-[36px] opacity-50">♣</div>
        <p className="m-0 text-[15px]">{t('bidDetail.selectPrompt')}</p>
      </div>
    );
  }

  const MobileBackButton = props.onMobileBack ? (
    <button
      onClick={props.onMobileBack}
      className="mb-5 flex items-center gap-1 font-ui text-[13px] text-fg-muted md:hidden"
    >
      {t('bidDetail.backToTree')}
    </button>
  ) : null;

  const isOpp = !!selected.byOpponent;
  const attachedConventions = (selected.conventionRefs ?? [])
    .map((ref) => conventions.find((c) => c.id === ref.id))
    .filter((c): c is ConventionDef => c !== undefined);
  const effectiveChildren = resolveConventionChildren(selected, conventions);

  return (
    <>
      {MobileBackButton}
      {props.editing && !props.readOnly && props.editChain ? (
        <BidForm
          mode="edit"
          chain={props.editChain}
          initial={{
            bids: selected.bids,
            meaning: selected.meaning,
            notes: selected.notes ?? '',
            byOpponent: selected.byOpponent ?? false,
            alerted: selected.alerted ?? false,
          }}
          onSubmit={props.onSubmitEdit}
          onCancel={props.onCancelEdit}
        />
      ) : (
        <>
          {/* Meaning header */}
          <div className="mb-[18px] flex items-start gap-3">
            <div className="flex-1">
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                {isOpp && (
                  <div className="inline-block rounded-full bg-surface-sunken px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-muted">
                    {t('bidDetail.interference')}
                  </div>
                )}
                {selected.alerted && (
                  <div
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-[0.06em]"
                    style={{ background: 'rgba(59,88,120,0.12)', color: '#3b5878' }}
                  >
                    <span
                      className="inline-flex items-center justify-center rounded-full"
                      style={{
                        width: 12,
                        height: 12,
                        background: '#3b5878',
                        color: '#fff',
                        fontSize: 8,
                        fontWeight: 800,
                        lineHeight: 1,
                        paddingBottom: 1,
                      }}
                    >
                      !
                    </span>
                    {t('bidDetail.alertable')}
                  </div>
                )}
              </div>
              <div className="font-display text-[22px] font-semibold leading-[1.3] tracking-[-0.005em] text-fg">
                {selected.meaning || (
                  <em className="text-fg-muted opacity-50">{t('bidDetail.noMeaning')}</em>
                )}
              </div>
            </div>
            {!props.readOnly && !fromConvention && (
              <div className="hidden gap-1.5 pt-0.5 md:flex">
                <Button variant="secondary" onClick={props.onRequestEdit}>
                  {t('bidDetail.edit')}
                </Button>
                <Button variant="danger" onClick={props.onDelete}>
                  {t('bidDetail.delete')}
                </Button>
              </div>
            )}
          </div>

          {/* BiddingTable */}
          {breadcrumb.length > 0 && (
            <div className="mb-6">
              <BiddingTable path={breadcrumb} />
            </div>
          )}

          {/* Notes */}
          {selected.notes && (
            <Card className="mb-7 whitespace-pre-wrap px-[22px] py-[18px] font-body text-[15px] leading-[1.65] text-fg-body">
              {selected.notes}
            </Card>
          )}

          {/* Convention source banner */}
          {fromConvention && (
            <div className="mb-6 flex items-center gap-3 rounded-md border border-border bg-surface-sunken px-4 py-3">
              <div className="flex-1">
                <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-muted">
                  {t('bidDetail.definedInConvention')}
                </span>
                <div className="mt-0.5 font-display text-[15px] font-semibold text-fg">
                  {fromConvention.name}
                </div>
              </div>
              {props.systemId && (
                <Button variant="ghost" small onClick={props.onOpenConventionLibrary}>
                  {t('bidDetail.editInLibrary')}
                </Button>
              )}
            </div>
          )}

          {/* Add child / convention section */}
          {!props.readOnly && !fromConvention && (
            <div className="mb-8 hidden md:block">
              {/* List of attached conventions */}
              {attachedConventions.length > 0 && (
                <div className="mb-3 flex flex-col gap-2">
                  {attachedConventions.map((conv) => {
                    const ref = selected.conventionRefs!.find((r) => r.id === conv.id);
                    return (
                      <div
                        key={conv.id}
                        className="rounded-md border border-border bg-surface-sunken px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-muted">
                              {t('bidDetail.convention')}
                            </span>
                            <div className="mt-0.5 font-display text-[15px] font-semibold text-fg">
                              {conv.name}
                            </div>
                            {conv.description && (
                              <div className="mt-0.5 font-ui text-[12px] text-fg-muted">
                                {conv.description}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            {props.onOpenConventionLibrary && (
                              <Button
                                variant="secondary"
                                small
                                onClick={props.onOpenConventionLibrary}
                              >
                                {t('bidDetail.editConvention')}
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              small
                              onClick={() => props.onDetachConvention?.(conv.id)}
                            >
                              {t('bidDetail.detach')}
                            </Button>
                          </div>
                        </div>
                        {/* Show current param values if any */}
                        {(conv.parameters?.length ?? 0) > 0 && (
                          <div className="mt-3 border-t border-border pt-3">
                            <p className="mb-2 font-ui text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                              {t('bidDetail.parameters')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {conv.parameters!.map((p) => {
                                const val = ref?.args?.[p.name] ?? p.defaultValue ?? '—';
                                const suitColor =
                                  val === '♥' || val === '♦'
                                    ? 'var(--suit-red)'
                                    : val === '♠' || val === '♣'
                                      ? 'var(--suit-black)'
                                      : undefined;
                                return (
                                  <div
                                    key={p.name}
                                    className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5"
                                  >
                                    <span className="font-ui text-[11px] text-fg-muted">
                                      {p.label}
                                    </span>
                                    <span
                                      className="font-display text-[15px] font-semibold leading-none"
                                      style={{ color: suitColor ?? 'var(--fg)' }}
                                    >
                                      {val}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bid form OR convention picker OR action buttons */}
              {props.addingTo === selected.id && props.addChain ? (
                /* ── BidForm open ── */
                <BidForm
                  mode="add"
                  chain={props.addChain}
                  onSubmit={props.onSubmitAdd}
                  onCancel={props.onCancelAdd}
                />
              ) : showConvPicker && conventions.length > 0 ? (
                /* ── Convention picker ── */
                <ConventionPicker
                  conventions={conventions}
                  onAttach={(convId, args) => {
                    props.onAttachConvention?.(convId, args);
                    setShowConvPicker(false);
                  }}
                  onCancel={() => setShowConvPicker(false)}
                />
              ) : (
                /* ── Default: add / link buttons ── */
                <div className="flex flex-wrap gap-2">
                  {attachedConventions.length === 0 && (
                    <Button variant="secondary" onClick={props.onRequestAdd}>
                      {t('bidDetail.addContinuation')}
                    </Button>
                  )}
                  {conventions.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        props.onCancelAdd();
                        setShowConvPicker(true);
                      }}
                    >
                      {t('bidDetail.linkConvention')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Children list */}
          {effectiveChildren.length > 0 && (
            <div>
              <Label className="mb-2.5 block">
                {t('bidDetail.continuations', { count: effectiveChildren.length })}
                {attachedConventions.length > 0 && (
                  <span className="ml-1.5 font-normal text-fg-muted">
                    {t('bidDetail.fromConvention')}
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {(attachedConventions.length > 0 ? effectiveChildren : selected.children).map(
                  (c) => {
                    const isConvChild = attachedConventions.length > 0;
                    const handleClick = isConvChild
                      ? () => {
                          const owningRef = selected.conventionRefs?.find((r) => {
                            const conv = findConvention(conventions, r.id);
                            return conv && findNode(conv.root, c.id) !== null;
                          });
                          props.onSelectConventionChild?.(
                            c,
                            owningRef?.id ?? selected.conventionRefs?.[0]?.id ?? '',
                          );
                        }
                      : () => props.onSelect(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={handleClick}
                        className="cursor-pointer rounded-md border border-border bg-surface px-[12px] py-[6px] font-display text-[14px] font-semibold hover:bg-surface-hover"
                        title={c.meaning}
                      >
                        <BidLabel bids={c.bids} byOpponent={c.byOpponent} />
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── Convention picker ─────────────────────────────────────────────────────

function ConventionPicker({
  conventions,
  onAttach,
  onCancel,
}: {
  conventions: ConventionDef[];
  onAttach: (convId: string, args: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation(['editor', 'common']);
  const [convId, setConvId] = useState(conventions[0]?.id ?? '');
  const [args, setArgs] = useState<Record<string, string>>(() =>
    defaultArgs(conventions, conventions[0]?.id ?? ''),
  );

  const selectedConv = conventions.find((c) => c.id === convId);
  const params = selectedConv?.parameters ?? [];
  const canLink = params.every((p) => {
    const val = args[p.name] ?? '';
    return val.trim().length > 0 || (p.defaultValue ?? '').length > 0;
  });

  function handleConvChange(id: string) {
    setConvId(id);
    setArgs(defaultArgs(conventions, id));
  }

  return (
    <div className="rounded-md border border-border bg-surface-sunken px-4 py-4">
      <p className="mb-3 font-ui text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
        {t('bidDetail.linkConvention')}
      </p>

      {/* Convention selector */}
      <Select
        value={convId}
        onChange={handleConvChange}
        options={conventions.map((c) => ({
          value: c.id,
          label: c.name,
          description: c.description,
          meta:
            (c.parameters?.length ?? 0) > 0
              ? t('bidDetail.paramCount', { count: c.parameters!.length })
              : undefined,
        }))}
        className="mb-4"
      />

      {/* Parameters */}
      {params.length > 0 && (
        <div className="mb-4 flex flex-col gap-4">
          {params.map((p) => (
            <div key={p.name}>
              <p className="mb-1.5 font-ui text-[13px] font-medium text-fg">{p.label}</p>
              {p.type === 'suit' ? (
                <LargeSuitPicker
                  value={args[p.name] ?? p.defaultValue ?? ''}
                  onChange={(v) => setArgs((prev) => ({ ...prev, [p.name]: v }))}
                />
              ) : (
                <Input
                  value={args[p.name] ?? ''}
                  placeholder={p.defaultValue ?? ''}
                  onChange={(e) => setArgs((prev) => ({ ...prev, [p.name]: e.target.value }))}
                  className="w-full"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="primary" disabled={!canLink} onClick={() => onAttach(convId, args)}>
          {t('bidDetail.link')}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {t('common:action.cancel')}
        </Button>
      </div>
    </div>
  );
}

// ── Large suit picker (used in the link form) ─────────────────────────────

const SUIT_OPTIONS = [
  { symbol: '♣', value: '♣', color: 'var(--suit-black)', label: 'Clubs' },
  { symbol: '♦', value: '♦', color: 'var(--suit-red)', label: 'Diamonds' },
  { symbol: '♥', value: '♥', color: 'var(--suit-red)', label: 'Hearts' },
  { symbol: '♠', value: '♠', color: 'var(--suit-black)', label: 'Spades' },
] as const;

function LargeSuitPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {SUIT_OPTIONS.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(active ? '' : s.value)}
            title={s.label}
            className={clsx(
              'flex h-12 w-12 flex-col items-center justify-center rounded-md border-2 transition-all',
              active
                ? 'border-current bg-surface shadow-sm scale-105'
                : 'border-border bg-surface hover:border-current hover:bg-surface-2',
            )}
            style={{ color: s.color }}
          >
            <span className="text-[22px] leading-none">{s.symbol}</span>
          </button>
        );
      })}
    </div>
  );
}

function defaultArgs(conventions: ConventionDef[], convId: string): Record<string, string> {
  const conv = conventions.find((c) => c.id === convId);
  const result: Record<string, string> = {};
  for (const p of conv?.parameters ?? []) {
    result[p.name] = p.defaultValue ?? '';
  }
  return result;
}
