import { ReactNode } from "react";

interface ClinicalPanelProps {
  title: string;
  /** Optional eyebrow text shown above the title in caps. */
  eyebrow?: string;
  /** Right-aligned slot for actions, badges, or live indicators. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standard chrome for a clinical panel: subtle border, brand eyebrow,
 * bold title, optional action slot. Use everywhere we surface
 * patient/simulation data so the visual language stays consistent.
 */
export default function ClinicalPanel({
  title,
  eyebrow,
  actions,
  children,
  className = "",
}: ClinicalPanelProps) {
  return (
    <section
      className={`rounded-clinical border border-line bg-surface-0 shadow-sm flex flex-col overflow-hidden ${className}`}
    >
      <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-line">
        <div>
          {eyebrow && (
            <span className="block text-[10px] font-bold uppercase tracking-widest text-accent-500">
              {eyebrow}
            </span>
          )}
          <h2 className="text-sm font-bold text-ink">{title}</h2>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
}
