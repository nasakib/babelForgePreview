"use client";

import { FOURIER_CATEGORIES, FourierCategory, FourierCategoryKey } from "@/lib/fourier/synthesis";

interface Props {
  active: FourierCategoryKey;
  onSelect: (k: FourierCategoryKey) => void;
}

/**
 * Grouped category tabs for the Fourier visualizer. Groups appear as
 * labeled columns of buttons — the same layout works on both desktop
 * and mobile because each group wraps independently.
 */
export default function CategoryTabs({ active, onSelect }: Props) {
  const groups = FOURIER_CATEGORIES.reduce<Record<string, FourierCategory[]>>((acc, c) => {
    (acc[c.group] ||= []).push(c);
    return acc;
  }, {});
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <div className="text-[10px] uppercase tracking-widest text-ink-muted mb-1.5">
            {group}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((c) => {
              const isActive = c.key === active;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onSelect(c.key)}
                  aria-pressed={isActive}
                  className={`px-2.5 py-1.5 rounded-clinical text-xs font-semibold border transition-colors ${
                    isActive
                      ? "bg-accent-500/15 border-accent-500/60 text-accent-200"
                      : "bg-surface-50 border-line hover:bg-surface-0 text-ink-subtle"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
