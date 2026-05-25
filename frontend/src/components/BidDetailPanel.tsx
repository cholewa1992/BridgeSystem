import type { BidNode } from '../types';
import type { ChainContext } from '../tree';
import { Button, Card, Label } from './ui';
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
}

export function BidDetailPanel(props: Props) {
  const { selected, breadcrumb } = props;

  if (!selected) {
    return (
      <div className="mt-20 text-center font-ui text-fg-subtle">
        <div className="mb-3 text-[36px] opacity-50">♣</div>
        <p className="m-0 text-[15px]">
          Select a bid to view its details, or add an opening bid to get started.
        </p>
      </div>
    );
  }

  const isOpp = !!selected.byOpponent;

  return (
    <>
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
                    Interference / opponent
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
                    Alertable
                  </div>
                )}
              </div>
              <div className="font-display text-[22px] font-semibold leading-[1.3] tracking-[-0.005em] text-fg">
                {selected.meaning || (
                  <em className="text-fg-muted opacity-50">No meaning defined</em>
                )}
              </div>
            </div>
            {!props.readOnly && (
              <div className="flex gap-1.5 pt-0.5">
                <Button variant="secondary" onClick={props.onRequestEdit}>
                  Edit
                </Button>
                <Button variant="danger" onClick={props.onDelete}>
                  Delete
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

          {/* Add child */}
          {!props.readOnly && (
            <div className="mb-8">
              {props.addingTo === selected.id && props.addChain ? (
                <BidForm
                  mode="add"
                  chain={props.addChain}
                  onSubmit={props.onSubmitAdd}
                  onCancel={props.onCancelAdd}
                />
              ) : (
                <Button variant="secondary" onClick={props.onRequestAdd}>
                  + Add continuation
                </Button>
              )}
            </div>
          )}

          {/* Children list */}
          {selected.children.length > 0 && (
            <div>
              <Label className="mb-2.5 block">Continuations ({selected.children.length})</Label>
              <div className="flex flex-wrap gap-1.5">
                {selected.children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => props.onSelect(c.id)}
                    className="cursor-pointer rounded-md border border-border bg-surface px-[12px] py-[6px] font-display text-[14px] font-semibold"
                    title={c.meaning}
                  >
                    <BidLabel bids={c.bids} byOpponent={c.byOpponent} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
