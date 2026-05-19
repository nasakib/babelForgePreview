import Link from "next/link";

/**
 * Palantir-styled 404 surface. Anonymous-safe. Suggests the command
 * palette and the major entry points.
 */
export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center bg-void min-h-[60vh]">
      <div className="max-w-xl w-full px-4 sm:px-6 py-10 text-center">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted">
          babelforge / not-found
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-ink mt-2 mb-2">404</h1>
        <p className="text-sm text-ink-subtle mb-6">
          No object with that identifier exists in the workspace.
        </p>
        <div className="text-xs text-ink-muted mb-6">
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface-100 font-mono">
            ⌘K
          </kbd>{" "}
          to open the command palette and jump to any module.
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-clinical border border-accent-500/60 bg-accent-500/10 text-accent-200 text-xs font-semibold"
          >
            Console (F1)
          </Link>
          <Link
            href="/welcome"
            className="px-3 py-1.5 rounded-clinical border border-line bg-surface-50 text-ink-subtle text-xs font-semibold"
          >
            Welcome
          </Link>
          <Link
            href="/fourier"
            className="px-3 py-1.5 rounded-clinical border border-line bg-surface-50 text-ink-subtle text-xs font-semibold"
          >
            Fourier (F10)
          </Link>
        </div>
      </div>
    </div>
  );
}
