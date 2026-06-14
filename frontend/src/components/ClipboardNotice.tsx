import { clsx } from 'clsx';

export interface Notice {
  kind: 'info' | 'error';
  text: string;
}

/** Transient feedback line for clipboard copy/cut/paste actions. */
export function ClipboardNotice({ notice }: { notice: Notice }) {
  return (
    <div
      role="status"
      className={clsx(
        'mb-2 rounded-sm border px-2.5 py-1.5 font-ui text-[12px]',
        notice.kind === 'error'
          ? 'border-danger bg-danger-soft text-danger'
          : 'border-accent-border bg-accent-soft text-fg-body',
      )}
    >
      {notice.text}
    </div>
  );
}
