export default function PanelHeader({
  title,
  subtitle,
  children,
  onToggle,
  minimized,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  onToggle?: () => void;
  minimized?: boolean;
}) {
  return (
    <div className={`px-4 py-3 border-b border-line bg-surface-50 ${onToggle ? 'cursor-pointer hover:bg-surface-100 transition-colors' : ''}`} onClick={onToggle}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[14px] text-ink font-medium tracking-tight flex items-center gap-2">
            {title}
            {onToggle && (
              <svg className={`w-4 h-4 text-ink-subtle transition-transform ${minimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            )}
          </div>
          {subtitle && (
            <div className="text-[10.5px] font-mono uppercase tracking-widest2 text-ink-muted mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">{children}</div>
      </div>
    </div>
  );
}
