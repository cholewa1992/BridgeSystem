import type { LucideIcon } from 'lucide-react';

export function ComingSoonPage({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="min-h-screen bg-bg p-12 text-center">
      <div className="mx-auto max-w-sm">
        <div className="mb-4 flex justify-center opacity-30">
          <Icon size={48} />
        </div>
        <h2 className="mb-2 font-display text-[24px] text-fg">{title}</h2>
        <p className="font-ui text-[15px] text-fg-muted">This feature is coming soon.</p>
      </div>
    </div>
  );
}
