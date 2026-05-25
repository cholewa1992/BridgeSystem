interface Props {
  variant?: 'horizontal' | 'stacked' | 'mark-only' | 'wordmark-only';
  height?: number;
}

export function BrandLockup({ variant = 'horizontal', height = 28 }: Props) {
  const src = {
    horizontal: '/codex-lockup.svg',
    stacked: '/codex-lockup-stack.svg',
    'mark-only': '/codex-favicon.svg',
    'wordmark-only': '/codex-wordmark.svg',
  }[variant];
  return <img src={src} alt="Codex" style={{ height }} />;
}
