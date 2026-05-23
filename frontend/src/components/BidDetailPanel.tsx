import type { BidNode } from '../types';
import type { ChainContext } from '../tree';
import {
  buttonDanger,
  buttonSecondary,
  cardStyle,
  labelStyle,
} from '../styles';
import { BidForm, type BidFormData } from './BidForm';
import { BidLabel } from './BidLabel';

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
      <div
        style={{
          textAlign: 'center',
          marginTop: 80,
          color: 'var(--fg-subtle)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>♣</div>
        <p style={{ fontSize: 15, margin: 0 }}>
          Select a bid to view its details, or add an opening bid to get started.
        </p>
      </div>
    );
  }

  const isOpp = !!selected.byOpponent;

  return (
    <>
      {breadcrumb.length > 0 && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--fg-muted)',
            marginBottom: 18,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            flexWrap: 'wrap',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {breadcrumb.map((n, i) => (
            <span key={n.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => props.onSelect(n.id)}
              >
                <BidLabel
                  bids={n.bids}
                  byOpponent={n.byOpponent}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                />
              </span>
              {i < breadcrumb.length - 1 && (
                <span style={{ margin: '0 6px', color: 'var(--fg-subtle)' }}>›</span>
              )}
            </span>
          ))}
        </div>
      )}

      {props.editing && !props.readOnly && props.editChain ? (
        <BidForm
          mode="edit"
          chain={props.editChain}
          initial={{
            bids: selected.bids,
            meaning: selected.meaning,
            notes: selected.notes ?? '',
            byOpponent: selected.byOpponent ?? false,
          }}
          onSubmit={props.onSubmitEdit}
          onCancel={props.onCancelEdit}
        />
      ) : (
        <>
          {/* Hero */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 18,
            }}
          >
            <BidLabel
              bids={selected.bids}
              byOpponent={selected.byOpponent}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 48,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            />
            <div style={{ flex: 1 }}>
              {isOpp && (
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--fg-muted)',
                    background: 'var(--surface-sunken)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontFamily: 'var(--font-ui)',
                    marginBottom: 6,
                  }}
                >
                  Interference / opponent
                </div>
              )}
              <div
                style={{
                  fontSize: 19,
                  color: 'var(--fg)',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1.35,
                }}
              >
                {selected.meaning || (
                  <em style={{ opacity: 0.5, color: 'var(--fg-muted)' }}>No meaning defined</em>
                )}
              </div>
            </div>
            {!props.readOnly && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={props.onRequestEdit} style={buttonSecondary}>
                  Edit
                </button>
                <button onClick={props.onDelete} style={buttonDanger}>
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          {selected.notes && (
            <div
              style={{
                ...cardStyle,
                padding: '18px 22px',
                marginBottom: 28,
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                lineHeight: 1.65,
                color: 'var(--fg-body)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {selected.notes}
            </div>
          )}

          {/* Add child */}
          {!props.readOnly && (
            <div style={{ marginBottom: 32 }}>
              {props.addingTo === selected.id && props.addChain ? (
                <BidForm
                  mode="add"
                  chain={props.addChain}
                  onSubmit={props.onSubmitAdd}
                  onCancel={props.onCancelAdd}
                />
              ) : (
                <button onClick={props.onRequestAdd} style={buttonSecondary}>
                  + Add continuation
                </button>
              )}
            </div>
          )}

          {/* Children list */}
          {selected.children.length > 0 && (
            <div>
              <div style={{ ...labelStyle, marginBottom: 10 }}>
                Continuations ({selected.children.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selected.children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => props.onSelect(c.id)}
                    style={{
                      ...cardStyle,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      boxShadow: 'none',
                    }}
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
